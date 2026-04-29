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
    "name": "Test Vehicle for AC" + Math.random().toString().slice(2, 12),
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

const startDate = 1704393060;
const endDate = 1735669862;

let token, userId, vehicleId, vehicleDeviceToken;

describe('Alerts Controller API Testcases', () => {

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

    describe('Get - /user/alerts/get', () => {
        it('2 - Get user devices alerts using invalid token', (done) => {
            request(baseurl)
                .get('/user/alerts/get')
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
                .set('Authorization', 'Bearer ' + token + 'p')
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(401);
                    expect(res.body.success).to.be.equal(false);
                    expect(res.body).to.have.property('error').that.equals("Unauthorized");
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

        it('3 - Get user devices alerts using invalid token', (done) => {
            request(baseurl)
                .get('/user/alerts/get')
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
                .set('Authorization', 'Bearer ' + token)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(200);
                    expect(res.body.success).to.be.equal(true);
                    expect(res.body).to.have.property('alerts').that.is.an('array');
                    expect(res.body).to.have.property('pagination');
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })
    })

    describe('Post - /user/device/add', () => {
        it('4 - Add a GPS Device using valid vehicle details for alerts controller', (done) => {
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

    describe('Get - /user/device/getDeviceToken', () => {
        it('5 - Get the Device token using valid data for alerts controller', (done) => {
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
        it('6 - save location for the device for allert controller', (done) => {
            request(baseurl)
                .post('/location/save')
                .send({
                    "id": vehicleId, // This acts as a unique identifier for the device or user
                    "deviceType": "vehicle", // Specifies the type of device
                    "sessionId": "sessionAC",
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
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
                .set('x-device-auth', 'Bearer ' + vehicleDeviceToken)
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

    describe('Get - /user/alerts/getAlertSection', () => {
        it('7 - Get user devices alerts by empty time ', (done) => {
            request(baseurl)
                .get(`/user/alerts/getAlertSection?startTime=&endTime=&deviceId=${vehicleId}&type=sosPress`)
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
                .set('Authorization', 'Bearer ' + token)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(400);
                    expect(res.body.success).to.be.equal(false);
                    expect(res.body).to.have.property('message').that.equals("Missing Parameters");
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

        it('8 - Get user devices alerts by non existing devicee ', (done) => {
            request(baseurl)
                .get(`/user/alerts/getAlertSection?startTime=${startDate}&endTime=${endDate}&deviceId=${userId}`)
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
                .set('Authorization', 'Bearer ' + token)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(200);
                    expect(res.body.success).to.be.equal(true);
                    expect(res.body).to.have.property('alerts').that.is.an('array').with.lengthOf(0);
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

        it('9 - Get user devices alerts by existing device with empty type ', (done) => {
            request(baseurl)
                .get(`/user/alerts/getAlertSection?startTime=${startDate}&endTime=${endDate}&deviceId=${vehicleId}&type=`)
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
                .set('Authorization', 'Bearer ' + token)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(200);
                    expect(res.body.success).to.be.equal(true);
                    expect(res.body).to.have.property('alerts').that.is.an('array');
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

        it('10 - Get user devices alerts by existing device with specific type ', (done) => {
            request(baseurl)
                .get(`/user/alerts/getAlertSection?startTime=${startDate}&endTime=${endDate}&deviceId=${vehicleId}&type=Geofence`)
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
                .set('Authorization', 'Bearer ' + token)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(200);
                    expect(res.body.success).to.be.equal(true);
                    expect(res.body).to.have.property('alerts').that.is.an('array');
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })
    })
});