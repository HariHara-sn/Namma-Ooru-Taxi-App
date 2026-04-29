const SurgeService = require('./SurgeService');
const PromoService = require('./PromoService');
const IncentiveService = require('./IncentiveService');
const CancellationService = require('./CancellationService');

class FareCalculatorService {
  constructor() {
    this.surgeService = SurgeService;
    this.promoService = PromoService;
    this.incentiveService = IncentiveService;
    this.cancellationService = CancellationService;
  }

  /**
   * Calculate fare with all components
   * @param {Object} params
   * @param {number} params.distance - Distance in km
   * @param {number} params.duration - Duration in minutes
   * @param {number} params.waitTime - Wait time in minutes
   * @param {Object} params.config - Fare configuration
   * @param {Object} params.driverMeta - Driver metadata
   * @param {Array} params.coupons - Array of coupon codes
   * @param {string} params.zone - Zone type
   * @param {string} params.userId - User ID
   * @param {string} params.vehicleType - Vehicle type (SEDAN, SUV, HATCHBACK, BIKE, AUTO)
   * @returns {Object} Complete fare breakdown
   */
  async calculateFare({ distance, duration, waitTime = 0, config, driverMeta = null, coupons = [], zone = 'all', userId = null, vehicleType = 'SEDAN', adjustment = 0 }) {
    try {
      console.log('calculateFare vehicleType', vehicleType,adjustment);
      
      // Validate vehicle type exists in database configuration
      const availableVehicleTypes = this.getAvailableVehicleTypes(config);
      if (!availableVehicleTypes.includes(vehicleType)) {
        return {
          success: false,
          error: `Vehicle type '${vehicleType}' is not configured in the fare system. Available types: ${availableVehicleTypes.join(', ')}`,
          fare: 0,
          breakdown: {}
        };
      }
      
      // Get vehicle-specific configuration
      const vehicleConfig = this._getVehicleConfig(config, vehicleType);
      
      // Step 1: Calculate base fare
      const baseFare = this._calculateBaseFare(distance, vehicleConfig);
    
      // Step 2: Calculate time and wait costs
      const timeCost = this._calculateTimeCost(duration, vehicleConfig);

      const waitTimeCost = this._calculateWaitTimeCost(waitTime, vehicleConfig);

      // Step 3: Calculate distance-based fare using slab pricing
      let distanceFare = this._calculateDistanceFare(distance, vehicleConfig);
      distanceFare = distanceFare == 0 ? baseFare : distanceFare;

      // Step 3.5: Calculate ride cost
      const rideCost = distanceFare + timeCost;
     
      // Step 4: Apply zone multiplier
      const {zoneAdjustedFare,zoneAdjustment} = this._applyZoneMultiplier(rideCost, zone, config);
   
      // Step 5: Apply surge adjustment
      const surgeAdjustment = this.surgeService.getSurgeMultiplier({
        time: new Date(),
        zone,
        config,
        fare: rideCost
      });
      
      
      // Extract surge amount from the adjustment object
      let surgeAmount = 0;
      if (typeof surgeAdjustment === 'object' && surgeAdjustment !== null) {
        // Handle object format with multiplier and fixedAdjustment
        if (surgeAdjustment.multiplier !== undefined && surgeAdjustment.fixedAdjustment !== undefined) {
          surgeAmount = (rideCost * (surgeAdjustment.multiplier - 1)) + surgeAdjustment.fixedAdjustment;
        } else {
          // Handle direct amount format
          surgeAmount = surgeAdjustment;
        }
      } else {
        // Handle direct number format
        surgeAmount = surgeAdjustment || 0;
      }
      
      // Step 7: Apply driver incentives/penalties
      let incentiveAdjustment = 0;
      let incentives = {};
      if (driverMeta) {
        incentives = this.incentiveService.getIncentives({ driverMeta, config });
        incentiveAdjustment = incentives.totalAdjustment;
      }
      
      console.log('baseFare', baseFare);
      console.log('distanceFare', distanceFare);
      console.log('timeCost', timeCost);
      console.log(`rideCost (add distance and time ${ distanceFare} + ${ timeCost })`, rideCost);
      console.log('waitTimeCost', waitTimeCost);
      console.log('zoneAdjustment', zoneAdjustment);
      console.log('surgeAdjustment', surgeAdjustment);
      console.log('incentiveAdjustment', incentiveAdjustment);
      console.log('ridematchadjustment', adjustment);
      let subtotal  = rideCost+waitTimeCost+zoneAdjustment+surgeAmount;
      subtotal = subtotal + incentiveAdjustment + adjustment;

      // Step 8: Apply coupons
      let couponDiscount = 0;
      let appliedCoupons = [];
      for (const couponCode of coupons) {
        const couponResult = await this.promoService.applyCoupon({
          code: couponCode,
          fare: subtotal,
          config,
          userId
        });
        
        if (couponResult.success) {
          couponDiscount += couponResult.discount;
          appliedCoupons.push(couponResult.discountRule);
        }
      }
      console.log('couponDiscount', couponDiscount);
      let rideSubtotal = subtotal - couponDiscount ;
      console.log('rideSubtotal', rideSubtotal);


      // // Step 6: Apply fees
      // const feesResult = this._applyFees(rideSubtotal, config, vehicleType);
      // const feesAdjustedFare = feesResult.fareWithFees;
      // console.log('feesAdjustedFare', feesAdjustedFare);
      const feesResult = {}
      
      // Step 6.5: Apply taxes
      const taxesResult = this._applyTaxes(rideSubtotal, config, vehicleType);
      const taxesAdjustedFare = taxesResult.fareWithTaxes;
      console.log('taxesAdjustedFare', taxesAdjustedFare);
      
      // Step 6.6: Apply fees with tax
      const feesWithTaxResult = this._applyFeesWithTax(rideSubtotal, config, vehicleType);
      const feesWithTaxAdjustedFare = feesWithTaxResult.fareWithFeesAndTax;
      console.log('feesWithTaxAdjustedFare', feesWithTaxAdjustedFare);
      
      // Step 9: Calculate final fare
      let finalFare = taxesAdjustedFare + feesWithTaxAdjustedFare;

   
    
      console.log('finalFare', finalFare);
      // Step 10: Apply rounding rules
      finalFare = this._applyRounding(finalFare, config);
      
      // Step 11: Clamp to min/max fare
      const minBound = Number.isFinite(vehicleConfig.minFare) ? vehicleConfig.minFare : 0;
      const maxBound = Number.isFinite(vehicleConfig.maxFare) ? vehicleConfig.maxFare : 999999;
      finalFare = Math.max(minBound, Math.min(maxBound, finalFare));
      
      // Step 12: Prepare breakdown

      const breakdown = this._prepareBreakdown({
        distanceFare,
        timeCost,
        waitTimeCost,
        zoneAdjustment,
        surgeAdjustment,
        incentiveAdjustment,
        adjustment,
        couponDiscount,
        feesResult,
        taxesResult,
        feesWithTaxResult,
        finalFare,
        zone,
        appliedCoupons,
        vehicleType,
        incentives,
        rideSubtotal,
        rideCost
      
      });
      
      return {
        success: true,
        fare: finalFare,
        breakdown,
        currency: config.currency,
        vehicleType
      };
      
    } catch (error) {
      console.error('Error calculating fare:', error);
      return {
        success: false,
        error: error.message,
        fare: 0,
        breakdown: {}
      };
    }
  }

  /**
   * Get vehicle-specific configuration
   * @private
   */
  _getVehicleConfig(config, vehicleType) {
    
    // Check if vehicle type specific config exists
    if (config.vehicleTypes) {
      // Handle Map structure (new dynamic approach)
      if (config.vehicleTypes instanceof Map || typeof config.vehicleTypes.get === 'function') {
        if (config.vehicleTypes.has(vehicleType)) {
          return config.vehicleTypes.get(vehicleType);
        }
      }
      // Handle object structure (legacy approach)
      else if (config.vehicleTypes[vehicleType]) {
        return config.vehicleTypes[vehicleType];
      }
    }
    
    // Fallback to legacy config for backward compatibility
    return {
      baseFare: config.baseFare || 0,
      timeCostPerMin: config.timeCostPerMin || 0,
      waitTimeCostPerMin: config.waitTimeCostPerMin || 0,
      rangePricing: config.rangePricing || [],
      minFare: config.minFare || 0,
      maxFare: config.maxFare || 999999
    };
  }

  _getmaxDistanceLimit(vehicleConfig) {
    if (!vehicleConfig) return null;
    if (vehicleConfig.maxDistanceLimit != null) return vehicleConfig.maxDistanceLimit;
    if (typeof vehicleConfig.get === 'function') {
      const viaGet = vehicleConfig.get('maxDistanceLimit');
      if (viaGet != null) return viaGet;
    }
    if (typeof vehicleConfig.toObject === 'function') {
      const plain = vehicleConfig.toObject();
      if (plain && plain.maxDistanceLimit != null) return plain.maxDistanceLimit;
    }
    return null;
  }

  /**
   * Calculate base fare
   * @private
   */
  _calculateBaseFare(distance, vehicleConfig) {
    return vehicleConfig.baseFare;
  }

  /**
   * Calculate time cost
   * @private
   */
  _calculateTimeCost(duration, vehicleConfig) {
    const travelTimeCost = duration * vehicleConfig.timeCostPerMin;
    // const waitTimeCost = waitTime * vehicleConfig.waitTimeCostPerMin;
    return travelTimeCost ;
  }

  _calculateWaitTimeCost(waitTime, vehicleConfig) {
    const waitTimeCost = waitTime * vehicleConfig.waitTimeCostPerMin;
    return waitTimeCost;
  }

  /**
   * Calculate distance fare using range-based pricing
   * @private
   */
  _calculateDistanceFare(distance, vehicleConfig) {
    let totalFare = 0;
    
    // Find the appropriate fare range for the given distance
    const applicableSlab = vehicleConfig.rangePricing.find(slab => {
      const slabStart = slab.minDistance;
      const slabEnd = slab.maxDistance ?? Infinity;
      return distance >= slabStart && distance <= slabEnd;
    });
    
    if (!applicableSlab) {
      console.log('No applicable fare range found for distance:', distance);
      return vehicleConfig.minFare ?? 0;
    }
    
    console.log('Applicable slab:', applicableSlab);
    console.log('Distance:', distance);
    
    if (applicableSlab.type === 'km') {
      // Per-km pricing: multiply distance by the rate
      const rate = parseFloat(applicableSlab.value ?? 0);
      totalFare = distance * rate;
      console.log('Per-km rate:', rate, 'Total fare:', totalFare);
    } else if (applicableSlab.type === 'fixed') {
      // Fixed pricing: charge the fixed amount regardless of distance
      totalFare = parseFloat(applicableSlab.value ?? 0);
      console.log('Fixed fare:', totalFare);
    }
    
    // Apply minFare and maxFare bounds
    totalFare = Math.max(vehicleConfig.minFare ?? 0, totalFare);
    totalFare = Math.min(vehicleConfig.maxFare ?? Infinity, totalFare);
    
    console.log('Final distance fare:', totalFare);
    return totalFare;
  }
  

  /**
   * Apply zone adjustment (multiplier or fixed value)
   * @private
   */
  _applyZoneMultiplier(fare, zone, config) {
    const zoneConfig = config.zones[zone];
    if (!zoneConfig) {
      return fare;
    }
    
    if (zoneConfig.type === 'multiplier') {
      const zoneAdjustedFare = fare * zoneConfig.value;
      return { 
        zoneAdjustedFare, 
        zoneAdjustment: zoneAdjustedFare - fare 
      };
    } else if (zoneConfig.type === 'fixed') {
      return {zoneAdjustedFare: fare + zoneConfig.value,zoneAdjustment: zoneConfig.value};
    }
    
    // Fallback to multiplier if type is not specified
    return {zoneAdjustedFare: fare * (zoneConfig.value || zoneConfig.multiplier || 1),zoneAdjustment: fare * (zoneConfig.value || zoneConfig.multiplier || 1) - fare};
  }

  /**
   * Apply fees
   * @private
   */
  _applyFees(fare, config, vehicleType = 'SEDAN') {
    const appliedFees = {};
    let totalFees = 0;

    // First, try to get vehicle-specific fees
    const vehicleConfig = this._getVehicleConfig(config, vehicleType);
    if (vehicleConfig && vehicleConfig.fees) {
      // Handle vehicle-specific fees (new dynamic structure)
      const vehicleFees = vehicleConfig.fees;
      
      // Check if it's a Map or regular object
      if (vehicleFees instanceof Map && vehicleFees.size > 0) {
        // Handle Map structure
        for (const [feeName, feeConfig] of vehicleFees.entries()) {
          const { type, value } = feeConfig;
          
          if (type === 'percentage') {
            appliedFees[feeName] = (fare * value) / 100;
          } else if (type === 'fixed') {
            appliedFees[feeName] = value;
          }
          totalFees += appliedFees[feeName];
        }
      } else if (typeof vehicleFees === 'object' && vehicleFees !== null && Object.keys(vehicleFees).length > 0) {
        // Handle regular object structure
        for (const [feeName, feeConfig] of Object.entries(vehicleFees)) {
          if (!feeConfig || typeof feeConfig !== 'object') continue;
          
          const { type, value } = feeConfig;
          if (!type || typeof value !== 'number') continue;

          if (type === 'percentage') {
            appliedFees[feeName] = (fare * value) / 100;
          } else if (type === 'fixed') {
            appliedFees[feeName] = value;
          }
          totalFees += appliedFees[feeName];
        }
      }
    } else if (config.dynamicFees) {
      // Handle global dynamic fees (new structure)
      const dynamicFees = config.dynamicFees;
      
      if (dynamicFees instanceof Map && dynamicFees.size > 0) {
        // Handle Map structure
        for (const [feeName, feeConfig] of dynamicFees.entries()) {
          const { type, value } = feeConfig;
          
          if (type === 'percentage') {
            appliedFees[feeName] = (fare * value) / 100;
          } else if (type === 'fixed') {
            appliedFees[feeName] = value;
          }
          totalFees += appliedFees[feeName];
        }
      } else if (typeof dynamicFees === 'object' && dynamicFees !== null && Object.keys(dynamicFees).length > 0) {
        // Handle regular object structure
        for (const [feeName, feeConfig] of Object.entries(dynamicFees)) {
          if (!feeConfig || typeof feeConfig !== 'object') continue;
          
          const { type, value } = feeConfig;
          if (!type || typeof value !== 'number') continue;

          if (type === 'percentage') {
            appliedFees[feeName] = (fare * value) / 100;
          } else if (type === 'fixed') {
            appliedFees[feeName] = value;
          }
          totalFees += appliedFees[feeName];
        }
      }
    } else if (config.fees) {
      // Handle legacy fees structure for backward compatibility
      const fees = config.fees?.toObject?.() || JSON.parse(JSON.stringify(config.fees));
      
      for (const [feeName, feeConfig] of Object.entries(fees)) {
        // Skip any top-level _id or unrelated keys
        if (feeName === '_id') continue;

        if (!feeConfig || typeof feeConfig !== 'object') continue;

        const { type, value } = feeConfig;

        if (!type || typeof value !== 'number') continue;

        if (type === 'percentage') {
          appliedFees[feeName] = (fare * value) / 100;
        } else if (type === 'fixed') {
          appliedFees[feeName] = value;
        } else if (type === 'multiplier') {
          appliedFees[feeName] = fare * value;
        }
        totalFees += appliedFees[feeName];
      }
    }

    return {
      fareWithFees: fare + totalFees,
      appliedFees,
      totalFees
    };
  }
  
  /**
   * Apply taxes
   * @private
   */
  _applyTaxes(fare, config, vehicleType = 'SEDAN') {
    const appliedTaxes = {};
    let totalTaxes = 0;

    // First, try to get vehicle-specific taxes
    const vehicleConfig = this._getVehicleConfig(config, vehicleType);
    if (vehicleConfig && vehicleConfig.taxes) {
      // Handle vehicle-specific taxes (new dynamic structure)
      const vehicleTaxes = vehicleConfig.taxes;
      
      // Check if it's a Map or regular object
      if (vehicleTaxes instanceof Map && vehicleTaxes.size > 0) {
        // Handle Map structure
        for (const [taxName, taxConfig] of vehicleTaxes.entries()) {
          const { type, value } = taxConfig;
          
          if (type === 'percentage') {
            const taxAmount = (fare * value) / 100;
            appliedTaxes[taxName] = {
              tax: taxAmount,
              type: type,
              value: value
            };
          } else if (type === 'fixed') {
            appliedTaxes[taxName] = {
              tax: value,
              type: type,
              value: value
            };
          }
          totalTaxes += appliedTaxes[taxName].tax;
        }
      } else if (typeof vehicleTaxes === 'object' && vehicleTaxes !== null && Object.keys(vehicleTaxes).length > 0) {
        // Handle regular object structure
        for (const [taxName, taxConfig] of Object.entries(vehicleTaxes)) {
          if (!taxConfig || typeof taxConfig !== 'object') continue;
          
          const { type, value } = taxConfig;
          if (!type || typeof value !== 'number') continue;

          if (type === 'percentage') {
            const taxAmount = (fare * value) / 100;
            appliedTaxes[taxName] = {
              tax: taxAmount,
              type: type,

              value: value
            };
          } else if (type === 'fixed') {
            appliedTaxes[taxName] = {
              tax: value,
              type: type,

              value: value
            };
          }
          totalTaxes += appliedTaxes[taxName].tax;
        }
      }
    } else if (config.dynamicTaxes) {
      // Handle global dynamic taxes (new structure)
      const dynamicTaxes = config.dynamicTaxes;
      
      if (dynamicTaxes instanceof Map && dynamicTaxes.size > 0) {
        // Handle Map structure
        for (const [taxName, taxConfig] of dynamicTaxes.entries()) {
          const { type, value } = taxConfig;
          
          if (type === 'percentage') {
            const taxAmount = (fare * value) / 100;
            appliedTaxes[taxName] = {
              tax: taxAmount,
              type: type,

              value: value
            };
          } else if (type === 'fixed') {
            appliedTaxes[taxName] = {
              tax: value,
              type: type,

              value: value
            };
          }
          totalTaxes += appliedTaxes[taxName].tax;
        }
      } else if (typeof dynamicTaxes === 'object' && dynamicTaxes !== null && Object.keys(dynamicTaxes).length > 0) {
        // Handle regular object structure
        for (const [taxName, taxConfig] of Object.entries(dynamicTaxes)) {
          if (!taxConfig || typeof taxConfig !== 'object') continue;
          
          const { type, value } = taxConfig;
          if (!type || typeof value !== 'number') continue;

          if (type === 'percentage') {
            const taxAmount = (fare * value) / 100;
            appliedTaxes[taxName] = {
              tax: taxAmount,
              type: type,
              value: value
            };
          } else if (type === 'fixed') {
            appliedTaxes[taxName] = {
              tax: value,
              type: type,
              value: value
            };
          }
          totalTaxes += appliedTaxes[taxName].tax;
        }
      }
    } else if (config.taxes) {
      // Handle legacy taxes structure for backward compatibility
      const taxes = config.taxes?.toObject?.() || JSON.parse(JSON.stringify(config.taxes));
      
      for (const [taxName, taxConfig] of Object.entries(taxes)) {
        // Skip any top-level _id or unrelated keys
        if (taxName === '_id') continue;

        if (!taxConfig || typeof taxConfig !== 'object') continue;

        const { type, value } = taxConfig;

        if (!type || typeof value !== 'number') continue;

        if (type === 'percentage') {
          const taxAmount = (fare * value) / 100;
          appliedTaxes[taxName] = {
            tax: taxAmount,
            type: type,

            value: value
          };
        } else if (type === 'fixed') {
          appliedTaxes[taxName] = {
            tax: value,
            type: type,

            value: value
          };
        }
        totalTaxes += appliedTaxes[taxName].tax;
      }
    }

    return {
      fareWithTaxes: fare + totalTaxes,
      appliedTaxes,
      totalTaxes
    };
  }

  /**
   * Apply fees with tax
   * @private
   */
  _applyFeesWithTax(fare, config, vehicleType = 'SEDAN') {
    const appliedFeesWithTax = {};
    let totalFeesWithTax = 0;

    // Get vehicle-specific configuration
    const vehicleConfig = this._getVehicleConfig(config, vehicleType);
    
    // Check for feeWithTax configuration in vehicle config
    if (vehicleConfig && vehicleConfig.feeWithTax) {
      const feeWithTaxConfig = vehicleConfig.feeWithTax;
      
      // Handle Map structure
      if (feeWithTaxConfig instanceof Map && feeWithTaxConfig.size > 0) {
        for (const [feeName, feeConfig] of feeWithTaxConfig.entries()) {
          const feeWithTaxResult = this._calculateFeeWithTax(feeConfig, fare);
          appliedFeesWithTax[feeName] = feeWithTaxResult;
          totalFeesWithTax += feeWithTaxResult.total;
        }
      } 
      // Handle regular object structure
      else if (typeof feeWithTaxConfig === 'object' && feeWithTaxConfig !== null && Object.keys(feeWithTaxConfig).length > 0) {
        for (const [feeName, feeConfig] of Object.entries(feeWithTaxConfig)) {
          if (!feeConfig || typeof feeConfig !== 'object') continue;
          
          const feeWithTaxResult = this._calculateFeeWithTax(feeConfig, fare);
          appliedFeesWithTax[feeName] = feeWithTaxResult;
          totalFeesWithTax += feeWithTaxResult.total;
        }
      }
    }
    // Check for global feeWithTax configuration
    else if (config.feeWithTax) {
      const feeWithTaxConfig = config.feeWithTax;
      
      // Handle Map structure
      if (feeWithTaxConfig instanceof Map && feeWithTaxConfig.size > 0) {
        for (const [feeName, feeConfig] of feeWithTaxConfig.entries()) {
          const feeWithTaxResult = this._calculateFeeWithTax(feeConfig, fare);
          appliedFeesWithTax[feeName] = feeWithTaxResult;
          totalFeesWithTax += feeWithTaxResult.total;
        }
      } 
      // Handle regular object structure
      else if (typeof feeWithTaxConfig === 'object' && feeWithTaxConfig !== null && Object.keys(feeWithTaxConfig).length > 0) {
        for (const [feeName, feeConfig] of Object.entries(feeWithTaxConfig)) {
          if (!feeConfig || typeof feeConfig !== 'object') continue;
          
          const feeWithTaxResult = this._calculateFeeWithTax(feeConfig, fare);
          appliedFeesWithTax[feeName] = feeWithTaxResult;
          totalFeesWithTax += feeWithTaxResult.total;
        }
      }
    }

    return {
      fareWithFeesAndTax: totalFeesWithTax,
      appliedFeesWithTax,
      totalFeesWithTax
    };
  }

  /**
   * Calculate individual fee with tax
   * @private
   */
  _calculateFeeWithTax(feeConfig, fare) {
    const { type, value, tax } = feeConfig;
    let feeAmount = 0;
    let totalTaxAmount = 0;
    const taxBreakdown = {};

    // Calculate fee amount
    if (type === 'percentage') {
      feeAmount = (fare * value) / 100;
    } else if (type === 'fixed') {
      feeAmount = value;
    } else if (type === 'multiplier') {
      feeAmount = fare * value;
    }

    // Calculate tax on the fee if tax configuration exists
    if (tax && typeof tax === 'object') {
      // Handle Map structure for taxes
      if (tax instanceof Map && tax.size > 0) {
        for (const [taxName, taxConfig] of tax.entries()) {
          const { type: taxType, value: taxValue } = taxConfig;
          
          if (taxType === 'percentage') {
            const individualTaxAmount = (feeAmount * taxValue) / 100;
            taxBreakdown[taxName] = {
              tax: individualTaxAmount,
              type: taxType,
              value: taxValue
            };
            totalTaxAmount += individualTaxAmount;
          } else if (taxType === 'fixed') {
            taxBreakdown[taxName] = {
              tax: taxValue,
              type: taxType,
              value: taxValue
            };
            totalTaxAmount += taxValue;
          }
        }
      } 
      // Handle regular object structure for taxes
      else if (typeof tax === 'object' && Object.keys(tax).length > 0) {
        for (const [taxName, taxConfig] of Object.entries(tax)) {
          if (!taxConfig || typeof taxConfig !== 'object') continue;
          
          const { type: taxType, value: taxValue } = taxConfig;
          if (!taxType || typeof taxValue !== 'number') continue;

          if (taxType === 'percentage') {
            const individualTaxAmount = (feeAmount * taxValue) / 100;
            taxBreakdown[taxName] = {
              tax: individualTaxAmount,
              type: taxType,
              percentage: taxValue
            };
            totalTaxAmount += individualTaxAmount;
          } else if (taxType === 'fixed') {
            taxBreakdown[taxName] = {
              tax: taxValue,
              type: taxType,
              fixedAmount: taxValue
            };
            totalTaxAmount += taxValue;
          }
        }
      }
    }

    return {
      feeAmount,
      taxAmount: taxBreakdown,
      total: feeAmount + totalTaxAmount
    };
  }

  /**
   * Apply rounding rules
   * @private
   */
  _applyRounding(fare, config) {
    if (!config.roundingRules.enabled) {
      return fare;
    }

    const roundingRules = config.roundingRules;
    const strategy = roundingRules.strategy || 'nearest';
    
    // Don't round if fare is below minimum threshold
    if (roundingRules.minFareThreshold && fare < roundingRules.minFareThreshold) {
      return fare;
    }

    switch (strategy) {
      case 'decimal':
        // Round to specific decimal places (e.g., 2 decimal places for currency)
        const decimalPlaces = roundingRules.decimalPlaces || roundingRules.value || 2;
        const multiplier = Math.pow(10, decimalPlaces);
        return Math.round(fare * multiplier) / multiplier;
        
      case 'up':
        // Always round up to the nearest value
        const roundUpTo = roundingRules.nearestValue || roundingRules.value || 5;
        return Math.ceil(fare / roundUpTo) * roundUpTo;
        
      case 'down':
        // Always round down to the nearest value
        const roundDownTo = roundingRules.nearestValue || roundingRules.value || 5;
        return Math.floor(fare / roundDownTo) * roundDownTo;
        
      case 'nearest':
        return Math.round(fare);
      case 'ceil':
        // Default: round up to next integer (normal behavior, e.g., 16.6 => 17)
        return Math.ceil(fare);
      default:
        return Math.round(fare);
    }
  }

  /**
   * Prepare fare breakdown
   * @private
   */
  _prepareBreakdown(components) {
    // Calculate subtotal (base + distance + time + zone + surge)
    // The zone multiplier is already applied in zoneAdjustedFare
   
    return {
      
      distancefare: components.rideCost,
      waitTimeCost: components.waitTimeCost,
      zoneAdjustment: components.zoneAdjustment,
      rideMatchAdjustment: components.adjustment,
      surgeAdjustment: components.surgeAdjustment,
      incentives: components.incentives && components.incentives.incentives ? components.incentives.incentives.total : 0,
      lowPerformancePenalty: (components.incentives && components.incentives.penalties ? components.incentives.penalties.total : 0) * -1,
      couponDiscount: (components.couponDiscount || 0) * -1,
      subtotal: components.rideSubtotal,// Round to 2 decimal places
      fees: {
        total: components.feesResult.totalFees,
        breakdown: components.feesResult.appliedFees
      },
      taxes: {
        total: components.taxesResult.totalTaxes,
        breakdown: components.taxesResult.appliedTaxes
      },
      feesWithTax: {
        total: components.feesWithTaxResult.totalFeesWithTax,
        breakdown: components.feesWithTaxResult.appliedFeesWithTax
      },
      appliedCoupons: components.appliedCoupons,
      finalFare: components.finalFare,
      vehicleType: components.vehicleType,
      driverEarnings: components.finalFare  - components.taxesResult.totalTaxes - components.feesWithTaxResult.totalFeesWithTax,
      driverDue:  components.taxesResult.totalTaxes + components.feesWithTaxResult.totalFeesWithTax
    };
  }

  /**
   * Estimate fare range
   * @param {Object} params
   * @param {number} params.distance - Distance in km
   * @param {number} params.duration - Duration in minutes
   * @param {Object} params.config - Fare configuration
   * @param {string} params.zone - Zone type
   * @param {string} params.vehicleType - Vehicle type
   * @returns {Object} Fare range estimate
   */
  async estimateFareRange({ distance, duration, config, zone = 'all', vehicleType = 'SEDAN',waitTime = 0 }) {
    // Validate vehicle type exists in database configuration
    const availableVehicleTypes = this.getAvailableVehicleTypes(config);
    if (!availableVehicleTypes.includes(vehicleType)) {
      return {
        success: false,
        error: `Vehicle type '${vehicleType}' is not configured in the fare system. Available types: ${availableVehicleTypes.join(', ')}`,
        minFare: 0,
        maxFare: 0,
        currency: config.currency,
        estimatedDuration: duration,
        vehicleType
      };
    }

    const minFare = await this.calculateFare({
      distance,
      duration,
      waitTime,
      config,
      zone,
      driverMeta: null,
      coupons: [],
      vehicleType
    });

    // const maxFare = await this.calculateFare({
    //   distance,
    //   duration,
    //   waitTime: waitTime + 10, // Assume some wait time
    //   config,
    //   zone,
    //   driverMeta: null,
    //   coupons: [],
    //   vehicleType
    // });

    const vehicleConfig = this._getVehicleConfig(config, vehicleType);
   
    const maxDistanceLimit = this._getmaxDistanceLimit(vehicleConfig);
    
    
    console.log('minFare', minFare.fare - (minFare.fare * 0.1));
    console.log('maxFare', minFare.fare + (minFare.fare * 0.1));
    const data = {
      
      minFare: minFare.fare - (minFare.fare * 0.1),
      maxFare: minFare.fare + (minFare.fare * 0.1),
      currency: config.currency,
      estimatedDuration: duration,
      vehicleType
    
    }
    if(maxDistanceLimit){
      data.maxDistanceLimit = maxDistanceLimit;
    }
    return data;
  }

  /**
   * Calculate fare with coupon
   * @param {Object} params
   * @param {number} params.fare - Base fare
   * @param {string} params.couponCode - Coupon code
   * @param {Object} params.config - Fare configuration
   * @param {string} params.userId - User ID
   * @returns {Object} Fare after coupon application
   */
  async calculateFareWithCoupon({ fare, couponCode, config, userId }) {
    return await this.promoService.applyCoupon({
      code: couponCode,
      fare,
      config,
      userId
    });
  }

  /**
   * Get cancellation fee
   * @param {Object} params
   * @param {Date} params.cancelledAt - When cancellation occurred
   * @param {Date} params.requestedAt - When trip was requested
   * @param {Object} params.config - Fare configuration
   * @param {string} params.userId - User ID
   * @returns {Object} Cancellation fee details
   */
  getCancellationFee({ cancelledAt, requestedAt, config, userId }) {
    return this.cancellationService.getCancellationFee({
      cancelledAt,
      requestedAt,
      config,
      userId
    });
  }

  /**
   * Get available coupons
   * @param {Object} params
   * @param {number} params.fare - Base fare
   * @param {Object} params.config - Fare configuration
   * @param {string} params.userId - User ID
   * @returns {Array} Available coupons
   */
  async getAvailableCoupons({ fare, config, userId }) {
    return await this.promoService.getAvailableCoupons({
      fare,
      config,
      userId
    });
  }

  /**
   * Get driver incentives
   * @param {Object} params
   * @param {Object} params.driverMeta - Driver metadata
   * @param {Object} params.config - Fare configuration
   * @returns {Object} Driver incentives
   */
  getDriverIncentives({ driverMeta, config }) {
    return this.incentiveService.getIncentives({
      driverMeta,
      config
    });
  }

  /**
   * Get surge multiplier
   * @param {Object} params
   * @param {Date} params.time - Current time
   * @param {string} params.zone - Zone type
   * @param {Object} params.config - Fare configuration
   * @returns {number} Surge multiplier
   */
  getSurgeMultiplier({ time, zone, config }) {
    return this.surgeService.getSurgeMultiplier({
      time,
      zone,
      config
    });
  }

  /**
   * Get available vehicle types
   * @param {Object} config - Fare configuration
   * @returns {Array} Available vehicle types
   */
  getAvailableVehicleTypes(config) {
    if (!config.vehicleTypes) {
      return ['SEDAN']; // Default fallback
    }
    
    // Handle Map structure (new dynamic approach)
    if (config.vehicleTypes instanceof Map) {
      return Array.from(config.vehicleTypes.keys());
    }
    
    // Handle object structure (legacy approach)
    return Object.keys(config.vehicleTypes);
  }

  /**
   * Validate fare calculation parameters
   * @param {Object} params - Calculation parameters
   * @returns {Object} Validation result
   */
  validateParameters(params) {
    const errors = [];

    if (!params.distance || params.distance <= 0) {
      errors.push('Distance must be positive');
    }

    if (!params.duration || params.duration <= 0) {
      errors.push('Duration must be positive');
    }

    if (params.waitTime && params.waitTime < 0) {
      errors.push('Wait time cannot be negative');
    }

    if (!params.config) {
      errors.push('Configuration is required');
    }

    // Dynamic vehicle type validation - check against available types in config
    if (params.vehicleType && params.config) {
      const availableVehicleTypes = this.getAvailableVehicleTypes(params.config);
      if (!availableVehicleTypes.includes(params.vehicleType)) {
        errors.push(`Invalid vehicle type. Available types: ${availableVehicleTypes.join(', ')}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

module.exports = new FareCalculatorService(); 