class FinalDueCalculator {
    /**
     * Dynamically calculates the driver's final due based on a base amount and a set of adjustment rules.
     * Each adjustment can be of type:
     *  - fixed: directly added to the due
     *  - percentage: percentage of the current baseAmount
     *  - multiplier: multiplies the baseAmount (extra portion added)
     * Taxes for an adjustment (e.g. CGST/SGST) are calculated on the adjustment amount itself.
     * Platform fee GST components are returned explicitly.
     *
     * @param {number} baseAmount - The starting amount (e.g. trip fare net of discounts).
     * @param {Object} adjustments - Map of adjustment items.
    * @param {boolean} useCompoundedPercentages - If true, percentage adjustments are applied sequentially on running due; otherwise on original baseAmount.
    * @returns {Object} Detailed breakdown including base amount, fee totals, fee taxes, and final driver due.
     */
    static calculateFinalDue(
        baseAmount,
        adjustments,
        useCompoundedPercentages = false
    ) {
        const toNumber = (n) => (isNaN(n) ? 0 : Number(n));
        const round2 = (n) => Number((n).toFixed(2));

        const originalBase = toNumber(baseAmount);
        let runningBaseForPercentage = originalBase;
        let totalAdjustmentAmount = 0;

        const detail = {};
        let totalTax = 0;

        Object.entries(adjustments || {}).forEach(([key, cfg]) => {
            if (!cfg || typeof cfg !== 'object') return;
            const type = cfg.type;
            const value = toNumber(cfg.value);
            let amount = 0;

            switch (type) {
            case 'fixed':
                amount = value; // direct addition
                break;
            case 'percentage':
                // apply on original base or compounded running base
                amount = (useCompoundedPercentages ? runningBaseForPercentage : originalBase) * (value / 100);
                if (useCompoundedPercentages) runningBaseForPercentage += amount;
                break;
            case 'multiplier':
                // multiplier of base; only the incremental part is added
                amount = originalBase * (value - 1);
                break;
            default:
                amount = 0; // unknown type
            }

            amount = round2(amount);
            totalAdjustmentAmount += amount;

            // Compute taxes on this adjustment
            const taxDetail = {};
            let adjustmentTaxTotal = 0;
            if (cfg.tax && typeof cfg.tax === 'object') {
                Object.entries(cfg.tax).forEach(([taxName, taxCfg]) => {
                    if (!taxCfg) return;
                    const taxType = taxCfg.type;
                    const taxVal = toNumber(taxCfg.value);
                    let taxAmount = 0;
                    switch (taxType) {
                    case 'percentage':
                        taxAmount = amount * (taxVal / 100);
                        break;
                    case 'fixed':
                        taxAmount = taxVal;
                        break;
                    case 'multiplier':
                        taxAmount = amount * (taxVal - 1);
                        break;
                    default:
                        taxAmount = 0;
                    }
                    taxAmount = round2(taxAmount);
                    taxDetail[taxName] = {
                        type: taxType,
                        value: taxVal,
                        amount: taxAmount
                    };
                    adjustmentTaxTotal += taxAmount;
                });
            }

            totalTax += adjustmentTaxTotal;
            detail[key] = {
                type,
                baseAmount: originalBase,
                appliedOn: useCompoundedPercentages && type === 'percentage' ? 'compounded' : 'original',
                value,
                amount,
                tax: taxDetail,
                taxTotal: round2(adjustmentTaxTotal),
                totalWithTax: round2(amount + adjustmentTaxTotal)
            };
        });

        const amountWithFeesBeforeTax = round2(originalBase + totalAdjustmentAmount);
        const feesTax = round2(totalTax);
        const amountWithFees = round2(amountWithFeesBeforeTax + feesTax);
        const driverDue = amountWithFees;

        return {
            baseAmount: round2(originalBase),
            driverDue,
            adjustments: detail
        };
    }
}

module.exports = FinalDueCalculator;