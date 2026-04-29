const { vendorSchema, vendorApproveStatusSchema, removeVendorSchema } = require('../../Schemas/VendorSchema');
const { vehicleSchema, vehicleUpdateSchema, vehicleDeleteSchema, vehicleStatusSchema } = require('../../Schemas/Vehicle');
const { fleetDriverInsertSchema, fleetDriverUpdateSchema, fleetDriverDeleteSchema, fleetDriverGetSchema } = require('../../Schemas/DriverSchema');
const Controller = require('../Controller');
const Vendors = require('../../Models/Vendor');
const Drivers = require('../../Models/Driver');
const Vehicles = require('../../Models/Vehicle');
const { ObjectId } = require('mongodb');


class PublicRideVendorsController extends Controller {

    constructor() {
        super()
    }

    createVendor = async (req, res) => {

        const [payload, errRes] = await this.validate(req.body, vendorSchema);
        if (!payload) return res.status(400).json(errRes);
        try {
            const existingVendor = await Vendors.checkVendorExist(payload);
            if(existingVendor && existingVendor.isDeleted) {
                payload.isDeleted = false;
                payload.isActive = true;
                payload.removeDeletedAt = true;
                const result = await Vendors.updateVendor(payload.fleetSysId, payload);
                if(result.acknowledged && result.modifiedCount > 0) return res.json({ success: true, message: 'Account Reactivated Successfully' });
                else return res.status(400).json({ success: false, message: 'Failed to insert vendor' });
            }
            if (existingVendor) return res.status(400).json({ success: false, message: 'Vendor with same email / phone / fleetSysId already exists' });
            payload.isActive = false;
            payload.isApproved = false;
            const result = await Vendors.addVendor(payload);
            console.log(result);
            if(result.acknowledged && result.insertedId) return res.json({ success: true, message: 'Account Created Successfully' });
            else return res.status(400).json({ success: false, message: 'Failed to create vendor' });

        } catch (err) {
            return this.handleError(err, res);
        }
    }

   
    deleteVendor = async (req, res) => {

        // const userId = req.user.id;
        // if (!userId) return res.status(400).json({ success: false, message: 'User Id is Required' });
        const [payload, errRes] = await this.validate(req.body, removeVendorSchema);
        if (!payload) return res.status(400).json(errRes);

        const fleetSysId = req.body.fleetSysId;
        if (!fleetSysId) return res.status(400).json({ success: false, message: 'fleetSysId is required' });
        
        try {
            const vendor = await Vendors.getVendor(fleetSysId);
            if (!vendor) return res.status(400).json({ success: false, message: 'Vendor not found' });
            if(vendor.isDeleted) return res.status(400).json({ success: false, message: 'Vendor is already deleted' });

            const deletedDrivers = await Drivers.removeDriverFromVendor(vendor._id);
            const deletedVehicles = await Vehicles.removeVehicleFromVendor(vendor._id);
            const deletedVendor = await Vendors.deleteVendor(fleetSysId);
            console.log(deletedVendor);
            if (deletedVendor.acknowledged) {
                let message = 'Vendor deleted successfully';
                if (deletedDrivers.modifiedCount > 0 || deletedVehicles.modifiedCount > 0) {
                    message += ' and attached ';
                    if (deletedDrivers.modifiedCount > 0) {
                        message += 'drivers';
                    }
                    if (deletedDrivers.modifiedCount > 0 && deletedVehicles.modifiedCount > 0) {
                        message += ' and ';
                    }
                    if (deletedVehicles.modifiedCount > 0) {
                        message += 'vehicles';
                    }
                    message += ' also removed';
                }
                return res.json({ success: true, message });
            } else {
                return res.status(400).json({ success: false, message: 'Failed to delete vendor' });
            }

        } catch (err) {
            return this.handleError(err, res);
        }
    }

   
    getApprovalStatus = async (req, res) => {
        const [payload, errRes] = await this.validate(req.query, vendorApproveStatusSchema);
        if (!payload) return res.status(400).json(errRes);

        try {
            const vendor = await Vendors.getVendor(payload.fleetSysId);
            if (!vendor) return res.status(400).json({ success: false, message: 'Vendor not found' });
            const approvalStatus = {
                isApproved: vendor.isApproved || false,
                isActive: vendor.isActive || false,
                isBlocked: vendor.isBlocked || false
            }
            return res.json({ success: true, ...approvalStatus});
        } catch (err) {
            return this.handleError(err, res);
        }
    }

    //Add Vehicles Mapping with Vendors

    addVehicle = async (req, res) => {
        const [payload, errRes] = await this.validate(req.body, vehicleSchema);
        if (!payload) return res.status(400).json(errRes);

        try {
            const vendor = await Vendors.getVendor(payload.fleetSysId);
            if(!vendor || vendor.isDeleted) return res.status(400).json({ success: false, message: 'Vendor not found or deleted' });
            payload.vendorId = vendor._id
            payload.regionalOffice = vendor.regionalOffice;
            const existingVehicle = await Vehicles.getVehicleByVehicleNumber(payload.regNo);
            console.log(existingVehicle);
            if(existingVehicle && existingVehicle.isDeleted) {
                payload.isDeleted = false;
                payload.isActive = true;
                payload.removeDeletedAt = true;
                const result = await Vehicles.reactivateVehicle(payload);
                if(result.acknowledged && result.modifiedCount > 0) return res.json({ success: true, message: 'Vehicle Reactivated successfully' });
                else return res.status(400).json({ success: false, message: 'Failed to reactivate vehicle' });
            }

            if (existingVehicle && (existingVehicle.isDeleted === null || existingVehicle.isDeleted === false )) return res.status(400).json({ success: false, message: 'Vehicle with same vehicle number already exists and is mapped with another vendor' });
            payload.isActive = false;
            payload.isApproved = false;
            const result = await Vehicles.addVehicleToPublicRide(payload);
            if(result.acknowledged && result.insertedId) return res.json({ success: true, message: 'Vehicle added successfully' });
            else return res.status(400).json({ success: false, message: 'Failed to add vehicle' });
        } catch (err) {
            return this.handleError(err, res);
        }
    }

    updateVehicle = async (req, res) => {
        const [payload, errRes] = await this.validate(req.body, vehicleUpdateSchema);
        if (!payload) return res.status(400).json(errRes);

        try {
            const vendor = await Vendors.getVendor(payload.fleetSysId);
            if(!vendor || vendor.isDeleted) return res.status(400).json({ success: false, message: 'Vendor not found or deleted' });
            payload.vendorId = vendor._id;
            payload.regionalOffice = vendor.regionalOffice;
            const existingVehicle = await Vehicles.getVehicleStatusForVMFleets(payload);
            if(!existingVehicle) return res.status(400).json({ success: false, message: 'Vehicle not found' });
            const result = await Vehicles.updateVehicleForVMFleets(payload);
            if(result.acknowledged && result.modifiedCount > 0) return res.json({ success: true, message: 'Vehicle updated successfully' });
            else return res.status(400).json({ success: false, message: 'Failed to update vehicle' });
        } catch (err) {
            return this.handleError(err, res);
        }
    }

    getVehicleStatus = async (req, res) => {
        const [payload, errRes] = await this.validate(req.query, vehicleStatusSchema);
        if (!payload) return res.status(400).json(errRes);

        try {
            const vendor = await Vendors.getVendor(payload.fleetSysId);
            if(!vendor || vendor.isDeleted) return res.status(400).json({ success: false, message: 'Vendor not found or deleted' });
            const existingVehicle = await Vehicles.getVehicleStatusForVMFleets(payload);
            if(!existingVehicle) return res.status(400).json({ success: false, message: 'Vehicle not found' });
            const data={
                isActive: existingVehicle.isActive || false,
                isDeleted: existingVehicle.isDeleted || false,
                isApproved: existingVehicle.isApproved || false,
                isBlocked: existingVehicle.isBlocked || false,
                blockReason: existingVehicle.blockReason || "",
                rejectReason: existingVehicle.rejectReason || "",
            }
            return res.json({ success: true, data });
        } catch (err) {
            return this.handleError(err, res);
        }
    }

    deleteVehicle = async (req, res) => {
        const [payload, errRes] = await this.validate(req.body, vehicleDeleteSchema);
        if (!payload) return res.status(400).json(errRes);

        try {
            const existingVehicle = await Vehicles.getVehicleStatusForVMFleets(payload);
            if(!existingVehicle) return res.status(400).json({ success: false, message: 'Vehicle not found' });
            let deletedDriver = false;
            console.log(existingVehicle);
            const driverId = existingVehicle.driverId;
            if(driverId) {
                const driver = await Drivers.updateDriver(new ObjectId(driverId), { vehicleId: "" });
                if(driver.acknowledged && driver.modifiedCount > 0) deletedDriver = true;
            }
            const result = await Vehicles.deleteVehicleForVMFleets(payload);
            //Remove Driver from Vehicle
           
            if(result.acknowledged && result.modifiedCount > 0) {
                let message = 'Vehicle deleted successfully';
                if(deletedDriver) message += ' and matched driver removed from vehicle';
                return res.json({ success: true, message });
            }
            else return res.status(400).json({ success: false, message: 'Failed to delete vehicle' });
        } catch (err) {
            return this.handleError(err, res);
        }
    }

    addDriver = async (req, res) => {   
        const [payload, errRes] = await this.validate(req.body, fleetDriverInsertSchema);
        if (!payload) return res.status(400).json(errRes);
        try {
            const vendor = await Vendors.getVendor(payload.fleetSysId);
            if(!vendor || vendor.isDeleted) return res.status(400).json({ success: false, message: 'Vendor not found or deleted' });
            payload.vendorId = vendor._id;
            payload.regionalOffice = vendor.regionalOffice;
            payload.bankDetails = vendor.bankDetails;
            const existingDriver = await Drivers.getFleetDriverByPhone(payload);
            if(existingDriver && existingDriver.isDeleted) {
                payload.isDeleted = false;
                payload.isActive = true;
                payload.removeDeletedAt = true;
                const result = await Drivers.reactivateFleetDriver(payload);
                if(result.acknowledged && result.modifiedCount > 0) return res.json({ success: true, message: 'Driver Reactivated successfully' });
                else return res.status(400).json({ success: false, message: 'Failed to reactivate driver' });
            }
            if(existingDriver && (existingDriver.isDeleted === null || existingDriver.isDeleted === false )) return res.status(400).json({ success: false, message: 'Driver with same phone already exists and is mapped with another vendor' });
            payload.isActive = false;
            payload.isApproved = false;
            const result = await Drivers.addFleetDriver(payload);
            if(result.acknowledged && result.insertedId) return res.json({ success: true, message: 'Driver added successfully' });
            else return res.status(400).json({ success: false, message: 'Failed to add driver' });
        } catch (err) {
            return this.handleError(err, res);
        }
    }

    updateDriver = async (req, res) => {
        const [payload, errRes] = await this.validate(req.body, fleetDriverUpdateSchema);
        if (!payload) return res.status(400).json(errRes);
        try {
            const vendor = await Vendors.getVendor(payload.fleetSysId);
            if(!vendor || vendor.isDeleted) return res.status(400).json({ success: false, message: 'Vendor not found or deleted' });
            payload.vendorId = vendor._id;
            payload.regionalOffice = vendor.regionalOffice;
            const existingDriver = await Drivers.getFleetDriver(payload);
            if(!existingDriver) return res.status(400).json({ success: false, message: 'Driver not found' });
            const result = await Drivers.updateFleetDriver(payload);
            if(result.acknowledged && result.modifiedCount > 0) return res.json({ success: true, message: 'Driver updated successfully' });
            else return res.status(400).json({ success: false, message: 'Failed to update driver' });
        } catch (err) {
            return this.handleError(err, res);
        }
    }
    getDriverStatus = async (req, res) => {
        const [payload, errRes] = await this.validate(req.query, fleetDriverGetSchema);
        if (!payload) return res.status(400).json(errRes);
        try {
            const vendor = await Vendors.getVendor(payload.fleetSysId);
            if(!vendor || vendor.isDeleted) return res.status(400).json({ success: false, message: 'Vendor not found or deleted' });
            const existingDriver = await Drivers.getFleetDriver(payload);
            if(!existingDriver) return res.status(400).json({ success: false, message: 'Driver not found' });
            const data = {
                isActive: existingDriver.isActive || false,
                isDeleted: existingDriver.isDeleted || false,
                isApproved: existingDriver.isApproved || false,
                isBlocked: existingDriver.isBlocked || false,
                blockReason: existingDriver.blockReason || "",
                rejectReason: existingDriver.rejectReason || "",
            }
            return res.json({ success: true, data });
        } catch (err) {
            return this.handleError(err, res);
        }
    }

    deleteDriver = async (req, res) => {
        const [payload, errRes] = await this.validate(req.body, fleetDriverDeleteSchema);
        if (!payload) return res.status(400).json(errRes);
        try {
            const existingDriver = await Drivers.getFleetDriver(payload);
            if(!existingDriver) return res.status(400).json({ success: false, message: 'Driver not found' });
            let deletedVehicle = false;
            const vehicleId = existingDriver.vehicleId;
            if(vehicleId) {
                const vehicle = await Vehicles.updateVehicle(new ObjectId(vehicleId), { driverId: "" });
                if(vehicle.acknowledged && vehicle.modifiedCount > 0) deletedVehicle = true;
            }
            const result = await Drivers.deleteFleetDriver(payload);
            if(result.acknowledged && result.modifiedCount > 0) {
                let message = 'Driver deleted successfully';
                if(deletedVehicle) message += ' and matched vehicle removed from driver';
                return res.json({ success: true, message });
            }
            else return res.status(400).json({ success: false, message: 'Failed to delete driver' });
        } catch (err) {
            return this.handleError(err, res);
        }
    }
}

module.exports = PublicRideVendorsController