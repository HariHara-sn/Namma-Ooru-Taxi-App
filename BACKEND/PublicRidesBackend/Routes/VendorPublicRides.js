const express = require('express');
const Router = express.Router();

const PublicRideVendorsController = require('../Controllers/Vendors/PublicRideVendorsController');
// const CheckPassangerAuthenticated = require('../MiddleWares/CheckPassangerAuthenticated');
// const TripController = require('../Controllers/Trip/TripController');
const publicRideVendorsController = new PublicRideVendorsController()
//sync for VMFleets
Router.post('/join', publicRideVendorsController.createVendor)
Router.post('/leave', publicRideVendorsController.deleteVendor)
Router.get('/status', publicRideVendorsController.getApprovalStatus)
Router.post('/add-vehicle', publicRideVendorsController.addVehicle)
Router.post('/update-vehicle', publicRideVendorsController.updateVehicle)
Router.get('/vehicle-status', publicRideVendorsController.getVehicleStatus)
Router.post('/delete-vehicle', publicRideVendorsController.deleteVehicle)
Router.post('/add-driver', publicRideVendorsController.addDriver)
Router.post('/update-driver', publicRideVendorsController.updateDriver)
Router.get('/driver-status', publicRideVendorsController.getDriverStatus)
Router.post('/delete-driver', publicRideVendorsController.deleteDriver)
//sync for VMFleets End 

module.exports = Router