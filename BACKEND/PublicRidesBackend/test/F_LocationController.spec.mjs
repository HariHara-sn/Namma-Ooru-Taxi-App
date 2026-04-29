import request from 'supertest';
import { assert, expect } from 'chai';
import {firtsUserData} from './A_UserController.spec.mjs';

const firstUserLoginCredential = {
    "email": firtsUserData.email,
    "password": firtsUserData.password
}

const baseurl = 'http://localhost:3000';

const newVehicle = {
    "imei": Math.random().toString().slice(2, 17),
    "name": "Test Vehicle for LC" + Math.random().toString().slice(2, 12),
    "type": "vehicle",
    "deviceInfo" : {
        "attributes": {
            "brandName": "Maruthi",
            "vehicleModel": "100x",
            "vehicleType": "car",
            "registrationNo": "TN 49 3749",
            "color": "white",
            "manufactureYear": "2024",
            "fuelType": "petrol",
            "mileageRange": "0-10",
            "maxAllowedSpeed": ""
          }
        }
}

let token, userId, vehicleId, vehicleDeviceToken, geofenceId;

describe('Location Controller API Testcases', () => {
    
    describe('Post - /user/login', () => {
        it('1 - Valid login', (done) => {
            request(baseurl)
                .post('/user/login')
                .send(firstUserLoginCredential)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(200);
                    expect(res.body.success).to.be.equal(true);
                    expect(res.body).to.have.property('message').that.equals("Logged in");
                    expect(res.body).to.have.property('user').to.have.property('name');
                    expect(res.body).to.have.property('user').to.have.property('_id').with.lengthOf(24);
                    expect(res.body).to.have.property('user').to.have.property('token').with.lengthOf(183);
                    token = res.body.user.token;
                    userId = res.body.user._id;
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })
    })

    describe('Post - /user/device/add', () => {
        it('2 - Add a GPS Device using valid vehicle details for add location api', (done) => {
            request(baseurl)
                .post('/user/device/add')
                .send(newVehicle)
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
                .set('Authorization', 'Bearer ' + token)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(200);
                    expect(res.body.success).to.be.equal(true);
                    expect(res.body).to.have.property('deviceId').with.lengthOf(24);
                    expect(res.body).to.have.property('message').that.equals("Device Added to the Database");     
                    vehicleId = res.body.deviceId;
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })
    })

    describe('Post - /user/geofence/add', () => {
        it('3 - Create a Geofene for testing the api for the add Alert controller', (done) => {
            request(baseurl)
                .post('/user/geofence/add')
                .send({
                    "type": "Circle",
                    "name": "test circle for location controller",
                    "coordinates": {
                        "center": [80.26260145429173, 13.01381719446696],
                        "radius": 454
                    }
                })
                .set('Authorization', 'Bearer ' + token)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(200);
                    expect(res.body.success).to.be.equal(true);
                    expect(res.body).to.have.property('message').that.equals("Geofence added successfully");
                    expect(res.body).to.have.property('geofenceId').with.lengthOf(24);
                    geofenceId = res.body.geofenceId
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })
    })

    describe('Post - /user/geofence/addToDevices', () => {
        it('4 - update a Geofene valid data for location controller', (done) => {
            request(baseurl)
                .post('/user/geofence/addToDevices')
                .send({
                    "geofenceId": geofenceId,
                    "deviceIds": [vehicleId]
                })
                .set('Authorization', 'Bearer ' + token)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(200);
                    expect(res.body.success).to.be.equal(true);
                    expect(res.body).to.have.property('message').that.equals("Geofence added to owned devices successfully");
                    expect(res.body).to.have.property('geofenceAddedDevices').that.is.an('array');
                    expect(res.body).to.have.property('unownedDevices').that.is.an('array');
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })
    })

    describe('Get - /user/device/getDeviceToken', () => {
        it('5 - Get the Device token using valid data for add location controller', (done) => {
            request(baseurl)
                .get('/user/device/getDeviceToken?deviceId=' + vehicleId)
                .set('Authorization', 'Bearer ' + token)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(200);
                    expect(res.body.success).to.be.equal(true);
                    expect(res.body).to.have.property('token');
                    vehicleDeviceToken = res.body.token;
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })
    })

    describe('Post - /location/save', () => {
        it('6 - save location using empty id for the device to the DB', (done) => {
            request(baseurl)
                .post('/location/save')
                .send({
                    "id": "", // This acts as a unique identifier for the device or user
                    "deviceType": "vehicle", // Specifies the type of device
                    "sessionId": "session1234",
                    "completed": false,
                    "locations": [
                    {
                        "time": "2024-03-08T21:12:01.000Z",
                        "location": [80.26260145429173, 13.01381719446696],//in //[80.23704236698228, 12.980652872370136], //out
                        "speed": 6.0,
                        "accuracy": 8,
                        "altitude": 105.0,
                        "altitudeAccuracy": 10,
                        "bearing": 275,
                        "battery": 0.83
                    },
                    {
                        "time": "2024-03-08T21:12:01.000Z",
                        "location": [80.23704236698228, 12.980652872370136], //out
                        "speed": 6.0,
                        "accuracy": 8,
                        "altitude": 105.0,
                        "altitudeAccuracy": 10,
                        "bearing": 275,
                        "battery": 0.83
                    }
                    ]
                })
                .set('x-device-auth', 'Bearer ' + vehicleDeviceToken)
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(400);
                    expect(res.body.success).to.be.equal(false);
                    expect(res.body).to.have.property('error');
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

        it('7 - save location using empty type for the device to the DB', (done) => {
            request(baseurl)
                .post('/location/save')
                .send({
                    "id": vehicleId, // This acts as a unique identifier for the device or user
                    "deviceType": "", // Specifies the type of device
                    "sessionId": "session1234",
                    "completed": false,
                    "locations": [
                    {
                        "time": "2024-03-08T21:12:01.000Z",
                        "location": [80.26260145429173, 13.01381719446696],//in //[80.23704236698228, 12.980652872370136], //out
                        "speed": 6.0,
                        "accuracy": 8,
                        "altitude": 105.0,
                        "altitudeAccuracy": 10,
                        "bearing": 275,
                        "battery": 0.83
                    },
                    {
                        "time": "2024-03-08T21:12:01.000Z",
                        "location": [80.23704236698228, 12.980652872370136], //out
                        "speed": 6.0,
                        "accuracy": 8,
                        "altitude": 105.0,
                        "altitudeAccuracy": 10,
                        "bearing": 275,
                        "battery": 0.83
                    }
                    ]
                })
                .set('x-device-auth', 'Bearer ' + vehicleDeviceToken)
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(400);
                    expect(res.body.success).to.be.equal(false);
                    expect(res.body).to.have.property('error');
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

        it('8 - save location using with out location', (done) => {
            request(baseurl)
                .post('/location/save')
                .send({
                    "id": vehicleId, // This acts as a unique identifier for the device or user
                    "deviceType": "vehicle", // Specifies the type of device
                    "sessionId": "session1234",
                    "completed": false,
                })
                .set('x-device-auth', 'Bearer ' + vehicleDeviceToken)
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(400);
                    expect(res.body.success).to.be.equal(false);
                    expect(res.body).to.have.property('error');
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

        it('9 - save location for the device to the DB using valid data with completed false', (done) => {
            request(baseurl)
                .post('/location/save')
                .send({
                    "id": vehicleId, // This acts as a unique identifier for the device or user
                    "deviceType": "vehicle", // Specifies the type of device
                    "sessionId": "session1234",
                    "completed": false,
                    "locations": [
                    {
                        "time": new Date().toISOString(),
                        "location": [80.26260145429173, 13.01381719446696],//in //[80.23704236698228, 12.980652872370136], //out
                        "speed": 6.0,
                        "accuracy": 8,
                        "altitude": 105.0,
                        "altitudeAccuracy": 10,
                        "bearing": 275,
                        "battery": 0.83
                    },
                    {
                        "time": new Date().toISOString(),
                        "location": [80.23704236698228, 12.980652872370136], //out
                        "speed": 6.0,
                        "accuracy": 8,
                        "altitude": 105.0,
                        "altitudeAccuracy": 10,
                        "bearing": 275,
                        "battery": 0.83
                    }
                    ]
                })
                .set('x-device-auth', 'Bearer ' + vehicleDeviceToken)
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(200);
                    expect(res.body.success).to.be.equal(true);
                    expect(res.body).to.have.property('message').that.equals("Locations added");
                    expect(res.body).to.have.property('details').that.is.an('array');
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

        it('10 - save location for the device to the DB using valid data with completed true', (done) => {
            request(baseurl)
                .post('/location/save')
                .send({
                    "id": vehicleId, // This acts as a unique identifier for the device or user
                    "deviceType": "vehicle", // Specifies the type of device
                    "sessionId": "session1234",
                    "completed": false,
                    "locations": [
                    {
                        "time": new Date().toISOString(),
                        "location": [80.26260145429173, 13.01381719446696],//in //[80.23704236698228, 12.980652872370136], //out
                        "speed": 6.0,
                        "accuracy": 8,
                        "altitude": 105.0,
                        "altitudeAccuracy": 10,
                        "bearing": 275,
                        "battery": 0.83
                    },
                    {
                        "time": new Date().toISOString(),
                        "location": [80.23704236698228, 12.980652872370136], //out
                        "speed": 6.0,
                        "accuracy": 8,
                        "altitude": 105.0,
                        "altitudeAccuracy": 10,
                        "bearing": 275,
                        "battery": 0.83
                    },
                    ]
                })
                .set('x-device-auth', 'Bearer ' + vehicleDeviceToken)
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(200);
                    expect(res.body.success).to.be.equal(true);
                    expect(res.body).to.have.property('message').that.equals("Locations added");
                    expect(res.body).to.have.property('details').that.is.an('array');
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })
    })
});