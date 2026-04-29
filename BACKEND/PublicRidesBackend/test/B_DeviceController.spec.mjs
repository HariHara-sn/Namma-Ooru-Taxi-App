import request from 'supertest';
import { assert, expect } from 'chai';
import {firtsUserData, thirdUserData, secondUserData} from './A_UserController.spec.mjs';

const firstUserLoginCredential = {
    "email": firtsUserData.email,
    "password": firtsUserData.password
}

const secondUserLoginCredential = {
    "email": secondUserData.email,
    "password": secondUserData.password
}

const thirdUserLoginCredential = {
    "email": thirdUserData.email,
    "password": thirdUserData.password
}

const baseurl = 'http://localhost:3000';

function rand(min, max) {
    return Math.random().toString().slice(min, max);
}

const createVehicle = (brandName = "Maruthi", vehicleModel = "100x", vehicleType = "car", registrationNo = "TN 49 3749", color = "white", manufactureYear = "2024", fuelType = "petrol", mileageRange = "0-10", maxAllowedSpeed = "") => ({
    "imei": rand(2, 17),
    "name": "Test Vehicle" + rand(2, 12),
    "type": "vehicle",
    "deviceInfo": {
        "attributes": {
            brandName,
            vehicleModel,
            vehicleType,
            registrationNo,
            color,
            manufactureYear,
            fuelType,
            mileageRange,
            maxAllowedSpeed
        }
    }
});

const newVehicle = createVehicle();
const newVehicle2 = createVehicle("Maruthi", "100x", "car", "TN 49 3799", "white", "2024", "petrol", "0-10", "");
const newVehicle3 = createVehicle("Maruthi", "100x", "car", "TN 49 3799", "white", "2024", "petrol", "0-10", "");

const newMobile = {
    "imei": rand(2, 17),
    "name": "Test Mobile " + rand(2, 12),
    "type": "mobile",
    "deviceInfo" : {
        "attributes": {
            "type": "android"
          }
        }
}

const newGeofence = {
    "type": "Circle",
    "name": "test circle for device controller" + rand(2, 5),
    "coordinates": {
        "center": [80.26260145429173, 13.01381719446696],
        "radius": 454
    }
}

const invalidDeviceId = "invalidDeviceId";
const invalidUserId = "invalidUserId";
const invalidGeofenceId = "66ac85e7e45de257b2267e40";
const startDate = 1704393060;
const endDate = 1735669862;
export let vehicleId, mobileId, secondUserVehicleId;
let firstUserToken, firstUserId, deleteVehicleId, mobileDeviceToken, geofenceId, groupId, requestIdForAccept, requestIdForReject;
let secondUserToken, secondUserId, secondUserMobileId;
let thirdUserToken, thirdUserId, thirdUserMobileId;

describe('Device Controller API Testcases', () => {
    

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
                    firstUserToken = res.body.user.token;
                    firstUserId = res.body.user._id;
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

        it('2 - login of 2nd user using valid details for device request controller', (done) => {
            request(baseurl)
                .post('/user/login')
                .send(secondUserLoginCredential)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(200);
                    expect(res.body.success).to.be.equal(true);
                    expect(res.body).to.have.property('message').that.equals("Logged in");
                    expect(res.body).to.have.property('user').to.have.property('name');
                    expect(res.body).to.have.property('user').to.have.property('_id').with.lengthOf(24);
                    expect(res.body).to.have.property('user').to.have.property('token').with.lengthOf(183);
                    secondUserToken = res.body.user.token;
                    secondUserId = res.body.user._id;
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

        it('3 - login of 3rd user using valid details for device request controller', (done) => {
            request(baseurl)
                .post('/user/login')
                .send(thirdUserLoginCredential)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(200);
                    expect(res.body.success).to.be.equal(true);
                    expect(res.body).to.have.property('message').that.equals("Logged in");
                    expect(res.body).to.have.property('user').to.have.property('name');
                    expect(res.body).to.have.property('user').to.have.property('_id').with.lengthOf(24);
                    expect(res.body).to.have.property('user').to.have.property('token').with.lengthOf(183);
                    thirdUserToken = res.body.user.token;
                    thirdUserId = res.body.user._id;
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })
    })

    describe('Post - /user/device/add', () => {
        it('4 - Add a GPS Device using valid vehicle details', (done) => {
            request(baseurl)
                .post('/user/device/add')
                .send(newVehicle)
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
                .set('Authorization', 'Bearer ' + firstUserToken)
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

        it('5 - Add a GPS Device using valid Mobile details', (done) => {
            request(baseurl)
                .post('/user/device/add')
                .send(newMobile)
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
                .set('Authorization', 'Bearer ' + firstUserToken)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(200);
                    expect(res.body.success).to.be.equal(true);
                    expect(res.body).to.have.property('deviceId').with.lengthOf(24);
                    expect(res.body).to.have.property('message').that.equals("Device Added to the Database");     
                    mobileId = res.body.deviceId;
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

        it('6 - Add a GPS Device for second user of device request controller', (done) => {
            request(baseurl)
                .post('/user/device/add')
                .send({
                    "imei": Math.random().toString().slice(2, 17),
                    "name": "Test Mobile " + Math.random().toString().slice(2, 12),
                    "type": "mobile",
                    "deviceInfo" : {
                        "attributes": {
                            "type": "android"
                        }
                        }
                })
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
                .set('Authorization', 'Bearer ' + secondUserToken)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(200);
                    expect(res.body.success).to.be.equal(true);
                    expect(res.body).to.have.property('deviceId').with.lengthOf(24);
                    expect(res.body).to.have.property('message').that.equals("Device Added to the Database");     
                    secondUserMobileId = res.body.deviceId;
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

        it('6 - Add a GPS Device for second user of device request controller', (done) => {
            request(baseurl)
                .post('/user/device/add')
                .send(newVehicle3)
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
                .set('Authorization', 'Bearer ' + secondUserToken)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(200);
                    expect(res.body.success).to.be.equal(true);
                    expect(res.body).to.have.property('deviceId').with.lengthOf(24);
                    expect(res.body).to.have.property('message').that.equals("Device Added to the Database");     
                    secondUserVehicleId = res.body.deviceId;
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

        it('7 - Add a GPS Device for third user device request controller', (done) => {
            request(baseurl)
                .post('/user/device/add')
                .send({
                    "imei": Math.random().toString().slice(2, 17),
                    "name": "Test Mobile " + Math.random().toString().slice(2, 12),
                    "type": "mobile",
                    "deviceInfo" : {
                        "attributes": {
                            "type": "android"
                        }
                        }
                })
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
                .set('Authorization', 'Bearer ' + thirdUserToken)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(200);
                    expect(res.body.success).to.be.equal(true);
                    expect(res.body).to.have.property('deviceId').with.lengthOf(24);
                    expect(res.body).to.have.property('message').that.equals("Device Added to the Database");     
                    thirdUserMobileId = res.body.deviceId;
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

        it('8 - Add a GPS Device only to check the device for delete API', (done) => {
            request(baseurl)
                .post('/user/device/add')
                .send(newVehicle2)
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
                .set('Authorization', 'Bearer ' + firstUserToken)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(200);
                    expect(res.body.success).to.be.equal(true);
                    expect(res.body).to.have.property('deviceId').with.lengthOf(24);
                    expect(res.body).to.have.property('message').that.equals("Device Added to the Database");     
                    deleteVehicleId = res.body.deviceId;
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

        it('9 - Add a GPS Device with already existing device name', (done) => {
            request(baseurl)
                .post('/user/device/add')
                .send({
                    "imei": Math.random().toString().slice(2, 17),
                    "name": newMobile.name,
                    "type": "mobile",
                    "deviceInfo" : {
                        "attributes": {
                            "type": "android"
                          }
                        }
                })
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
                .set('Authorization', 'Bearer ' + firstUserToken)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(400);
                    expect(res.body.success).to.be.equal(false);
                    expect(res.body).to.have.property('message').that.equals("Device with Same Name already exists");
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

        it('10 - Add a GPS Device with already existing device Imei number', (done) => {
            request(baseurl)
                .post('/user/device/add')
                .send({
                    "imei": newMobile.imei,
                    "name": "Test Mobile " + "2",
                    "type": "mobile",
                    "deviceInfo" : {
                        "attributes": {
                            "type": "android"
                          }
                        }
                })
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
                .set('Authorization', 'Bearer ' + firstUserToken)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(400);
                    expect(res.body.success).to.be.equal(false);
                    expect(res.body).to.have.property('message').that.equals("Device with same IMEI number already registered");
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

        it('11 - Add a GPS Device with false type', (done) => {
            request(baseurl)
                .post('/user/device/add')
                .send({
                    "imei": Math.random().toString().slice(2, 17),
                    "name": "Test Mobile " + Math.random().toString().slice(2, 12),
                    "type": "heavy vechile",
                    "deviceInfo" : {
                        "attributes": {
                            "type": "android"
                          }
                        }
                })
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
                .set('Authorization', 'Bearer ' + firstUserToken)
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

        it('12 - Add GPS device with empty Device info', (done) => {
            request(baseurl)
                .post('/user/device/add')
                .send({
                    "imei": Math.random().toString().slice(2, 17),
                    "name": "Test Mobile " + Math.random().toString().slice(2, 12),
                    "type": "mobile",
                    "deviceInfo" : {

                    }
                })
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
                .set('Authorization', 'Bearer ' + firstUserToken)
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

        it('13 - Add a GPS device with Invalid token', (done) => {
            request(baseurl)
                .post('/user/device/add')
                .send({
                    "imei": Math.random().toString().slice(2, 17),
                    "name": "Test Mobile " + Math.random().toString().slice(2, 12),
                    "type": "mobile",
                    "deviceInfo" : {
                        "attributes": {
                            "type": "android"
                          }
                        }
                })
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
                .set('Authorization', 'Bearer ' + firstUserToken + 'p')
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
    })

    describe('Post - /user/device/update', () => {
        it('14 - Update the device details with valid details except Device Id', (done) => {
            request(baseurl)
                .post('/user/device/update')
                .send({
                    "deviceId" : mobileId + 'p', 
                    "name": "Changed mobile name",
                    "type": "asset"
                })
                .set('Authorization', 'Bearer ' + firstUserToken)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(400);
                    expect(res.body.success).to.be.equal(false);
                    expect(res.body).to.have.property('error').that.equals("Invalid data");;
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

        it('15 - Update the non registered device details', (done) => {
            request(baseurl)
                .post('/user/device/update')
                .send({
                    "deviceId" : firstUserId, 
                    "name": "Changed mobile name",
                    "type": "asset"
                })
                .set('Authorization', 'Bearer ' + firstUserToken)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(400);
                    expect(res.body.success).to.be.equal(false);
                    expect(res.body).to.have.property('message').that.equals("Device ID Not Available In Database");
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

        it('16 - Update the Device details with invalid User', (done) => {
            request(baseurl)
                .post('/user/device/update')
                .send({
                    "deviceId" : mobileId, 
                    "name": "Changed mobile name",
                    "type": "asset"
                })
                .set('Authorization', 'Bearer ' + invalidUserId)
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

        it('17 - Update the Device details with valid details', (done) => {
            request(baseurl)
                .post('/user/device/update')
                .send({
                    "deviceId" : mobileId, 
                    "name": "Changed mobile name",
                    "type": "asset"
                })
                .set('Authorization', 'Bearer ' + firstUserToken)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(200);
                    expect(res.body.success).to.be.equal(true);
                    expect(res.body).to.have.property('deviceId').with.lengthOf(24);
                    expect(res.body).to.have.property('message').that.equals("Device Information Updated to the Database");
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })
    })

    describe('Get - /user/device/getDeviceToken', () => {
        it('18 - Get the Device token using valid data', (done) => {
            request(baseurl)
                .get('/user/device/getDeviceToken?deviceId=' + mobileId)
                .set('Authorization', 'Bearer ' + firstUserToken)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(200);
                    expect(res.body.success).to.be.equal(true);
                    expect(res.body).to.have.property('token');
                    mobileDeviceToken = res.body.token;
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })
    
        it('19 - /user/device/getDeviceToken - Get the Device token using invalid device ID', (done) => {
            request(baseurl)
                .get('/user/device/getDeviceToken?deviceId=' + invalidDeviceId)
                .set('Authorization', 'Bearer ' + firstUserToken)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(400);
                    expect(res.body.success).to.be.equal(false);
                    expect(res.body).to.have.property('error').that.equals("Invalid data");;
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

        it('20 - /user/device/getDeviceToken - Get the Device token using not registered device', (done) => {
            request(baseurl)
                .get('/user/device/getDeviceToken?deviceId=' + firstUserId)
                .set('Authorization', 'Bearer ' + firstUserToken)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(400);
                    expect(res.body.success).to.be.equal(false);
                    expect(res.body).to.have.property('message').that.equals("Device not yet registered");
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })
    })

    describe('Get - /user/device/getAll', () => {
        it('21 - Get the devices of the existing User', (done) => {
            request(baseurl)
                .get('/user/device/getAll')
                .set('Authorization', 'Bearer ' + firstUserToken)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(200);
                    expect(res.body.success).to.be.equal(true);
                    expect(res.body).to.have.property('userDevices').that.is.an('array');
                    expect(res.body).to.have.property('message').that.equals("User Devices Retrieved From Database");
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

        it('22 - Get the devices using invalid user ID', (done) => {
            request(baseurl)
                .get('/user/device/getAll')
                .set('Authorization', 'Bearer ' + invalidUserId)
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
    })

    describe('Get - /user/device/get', () => {
        it('23 -  - Get the device details based on valid data', (done) => {
            request(baseurl)
                .get('/user/device/get')
                .send({"deviceId": mobileId})
                .set('Authorization', 'Bearer ' + firstUserToken)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(200);
                    expect(res.body.success).to.be.equal(true);
                    expect(res.body).to.have.property('deviceDetail').to.have.property('_id').with.lengthOf(24);
                    expect(res.body).to.have.property('message').that.equals("Device Details Retrived From Database");
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

        it('24 - Get the devices using invalid user ID and valid Device Id', (done) => {
            request(baseurl)
                .get('/user/device/get')
                .send({"deviceId": mobileId})
                .set('Authorization', 'Bearer ' + invalidUserId)
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

        it('25 - Get the devices using valid user ID and invalid Device Id', (done) => {
            request(baseurl)
                .get('/user/device/get')
                .send({"deviceId": invalidDeviceId})
                .set('Authorization', 'Bearer ' + firstUserToken)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(400);
                    expect(res.body.success).to.be.equal(false);
                    expect(res.body).to.have.property('error').that.equals("Invalid data");
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

        it('26 - Get the device using non registered Device Id', (done) => {
            request(baseurl)
                .get('/user/device/get')
                .send({"deviceId": firstUserId})
                .set('Authorization', 'Bearer ' + firstUserToken)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(400);
                    expect(res.body.success).to.be.equal(false);
                    expect(res.body).to.have.property('message').that.equals("Device ID Not Available In Database");
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })
    })

    describe('Get - /user/device/getImage', () => {
        it('27 - Get the device image based on the Device ID', (done) => {
            request(baseurl)
                .get('/user/device/getImage?deviceId=' + vehicleId)
                .set('Authorization', 'Bearer ' + firstUserToken)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(200);
                    expect(res.body.success).to.be.equal(true);
                    expect(res.body.data).to.have.property('_id').with.lengthOf(24);
                    expect(res.body).to.have.property('message').that.equals("Device Image Retrieved From Database");
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

        it('28 - Get the devices image using invalid user ID and valid Device Id', (done) => {
            request(baseurl)
                .get('/user/device/getImage?deviceId=' + vehicleId)
                .set('Authorization', 'Bearer ' + invalidUserId)
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

        it('29 - Get the devices image using valid user ID and invalid Device Id', (done) => {
            request(baseurl)
                .get('/user/device/getImage?deviceId=' + invalidDeviceId)
                .send({})
                .set('Authorization', 'Bearer ' + firstUserToken)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(400);
                    expect(res.body.success).to.be.equal(false);
                    expect(res.body).to.have.property('error').that.equals("Invalid data");
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

        it('30 - Get the devices image using non registered Device Id', (done) => {
            request(baseurl)
                .get('/user/device/getImage?deviceId=' + firstUserId)
                .send({})
                .set('Authorization', 'Bearer ' + firstUserToken)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(400);
                    expect(res.body.success).to.be.equal(false);
                    expect(res.body).to.have.property('message').that.equals('Device ID not available from the database');;
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })
    })

    describe('Post - /user/device/searchDevice', () => {
        it('31 - Search the device using valid search string and valid User', (done) => {
            request(baseurl)
                .post('/user/device/searchDevice')
                .send({"searchString" : "test"})
                .set('Authorization', 'Bearer ' + firstUserToken)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(200);
                    expect(res.body.success).to.be.equal(true);
                    expect(res.body).to.have.property('data').that.is.an('array');
                    expect(res.body).to.have.property('message').that.equals("Devices for your Search");
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

        it('32 - Search the device using invalid user ID', (done) => {
            request(baseurl)
                .post('/user/device/searchDevice')
                .send(
                    {
                        "searchString" : "test"
                    }
                )
                .set('Authorization', 'Bearer ' + invalidUserId)
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

        it('33 - Search the device using valid user ID and empty string', (done) => {
            request(baseurl)
                .post('/user/device/searchDevice')
                .send(
                    {
                        "searchString" : ""
                    }
                )
                .set('Authorization', 'Bearer ' + firstUserToken)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(400);
                    expect(res.body.success).to.be.equal(false);
                    expect(res.body).to.have.property('message').that.equals("Search String Empty");
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })
    })

    describe('Post - /user/geofence/add', () => {
        it('34 -  - Create a Geofene for testing the api "/user/device/addGeofence"', (done) => {
            request(baseurl)
                .post('/user/geofence/add')
                .send(newGeofence)
                .set('Authorization', 'Bearer ' + firstUserToken)
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

    describe('Post - /user/device/addGeofence', () => {
        it('35 - Add Geofence to the Device using valid Ids', (done) => {
            request(baseurl)
                .post('/user/device/addGeofence')
                .send({
                    "deviceId": vehicleId,
                    "geoFenceId" : geofenceId
                })
                .set('Authorization', 'Bearer ' + firstUserToken)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(200);
                    expect(res.body.success).to.be.equal(true);
                    expect(res.body).to.have.property('message').that.equals('GeoFence Added To The Device');
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

        it('36 - Add Geofence to the Device using valid device ID and empty geofence id', (done) => {
            request(baseurl)
                .post('/user/device/addGeofence')
                .send({
                    "deviceId": vehicleId,
                    "geoFenceId" : ""
                })
                .set('Authorization', 'Bearer ' + firstUserToken)
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

        it('37 - Add Geofence to the Device using empty device ID and valid geofence id', (done) => {
            request(baseurl)
                .post('/user/device/addGeofence')
                .send({
                    "deviceId": "",
                    "geoFenceId" : geofenceId
                })
                .set('Authorization', 'Bearer ' + firstUserToken)
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

        it('38 - Add non stored Geofence ID in dB to the device', (done) => {
            request(baseurl)
                .post('/user/device/addGeofence')
                .send({
                    "deviceId": vehicleId,
                    "geoFenceId" : invalidGeofenceId
                })
                .set('Authorization', 'Bearer ' + firstUserToken)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(400);
                    expect(res.body.success).to.be.equal(false);
                    expect(res.body).to.have.property('message').that.equals("GeoFence ID Not Exits In Database");
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

        it('39 - Add already linked Geofence ID to the same device', (done) => {
            request(baseurl)
                .post('/user/device/addGeofence')
                .send({
                    "deviceId": vehicleId,
                    "geoFenceId" : geofenceId
                })
                .set('Authorization', 'Bearer ' + firstUserToken)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(400);
                    expect(res.body.success).to.be.equal(false);
                    expect(res.body).to.have.property('message').that.equals("GeoFence ID Already Linked With Device");
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })
    })

    describe('Post - /user/device/deleteGeofence', () => {
        it('40 - Delete Geofence from the Device using valid device ID and empty geofence id', (done) => {
            request(baseurl)
                .delete('/user/device/deleteGeofence')
                .send({
                    "deviceId": vehicleId,
                    "geoFenceId" : ""
                })
                .set('Authorization', 'Bearer ' + firstUserToken)
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

        it('41 - Delete Geofence from the Device using empty device ID and valid geofence ID', (done) => {
            request(baseurl)
                .delete('/user/device/deleteGeofence')
                .send({
                    "deviceId": "",
                    "geoFenceId" : geofenceId
                })
                .set('Authorization', 'Bearer ' + firstUserToken)
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

        it('42 - Delete non stored Geofence ID in DB from the Device', (done) => {
            request(baseurl)
                .delete('/user/device/deleteGeofence')
                .send({
                    "deviceId": vehicleId,
                    "geoFenceId" : invalidGeofenceId
                })
                .set('Authorization', 'Bearer ' + firstUserToken)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(400);
                    expect(res.body.success).to.be.equal(false);
                    expect(res.body).to.have.property('message').that.equals("Geofene ID Not Available In Database");
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

        it('43 - Delete Geofence Id from the Device using Ids', (done) => {
            request(baseurl)
                .delete('/user/device/deleteGeofence')
                .send({
                    "deviceId": vehicleId,
                    "geoFenceId" : geofenceId
                })
                .set('Authorization', 'Bearer ' + firstUserToken)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(200);
                    expect(res.body.success).to.be.equal(true);
                    expect(res.body).to.have.property('message').that.equals("GeoFence ID Deleted From The Device");
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

        it('44 - Delete non linked Geofence ID from the same device', (done) => {
            request(baseurl)
                .delete('/user/device/deleteGeofence')
                .send({
                    "deviceId": vehicleId,
                    "geoFenceId" : geofenceId
                })
                .set('Authorization', 'Bearer ' + firstUserToken)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(400);
                    expect(res.body.success).to.be.equal(false);
                    expect(res.body).to.have.property('message').that.equals("GeoFence ID Not Linked With Current Device");
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })
    })

    describe('Get - /user/device/getGeofenceAlerts', () => {
        it('46 - Get the Alerts for the devices with page value lessthan 1', (done) => {
            request(baseurl)
                .get('/user/device/getGeofenceAlerts?page=0&limit=100&deviceId=' + vehicleId)
                .set('Authorization', 'Bearer ' + firstUserToken)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(400);
                    expect(res.body.success).to.be.equal(false);
                    expect(res.body).to.have.property('message').that.equals("Page must be a positive integer starting from 1.");
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

        it('47 - Get the Alerts for the devices with limit value lessthan 1', (done) => {
            request(baseurl)
                .get('/user/device/getGeofenceAlerts?page=1&limit=0&deviceId=' + vehicleId)
                .set('Authorization', 'Bearer ' + firstUserToken)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(400);
                    expect(res.body.success).to.be.equal(false);
                    expect(res.body).to.have.property('message').that.equals("Limit must be a positive integer.");
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

        it('48 - Get the Alerts for the devices with limit value greaterthan 100', (done) => {
            request(baseurl)
                .get('/user/device/getGeofenceAlerts?page=1&limit=1000&deviceId=' + vehicleId)
                .set('Authorization', 'Bearer ' + firstUserToken)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(400);
                    expect(res.body.success).to.be.equal(false);
                    expect(res.body).to.have.property('message').that.equals("Limit cannot be greater than 100.");
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

        it('49 - Get the Alerts for the devices with empty device id', (done) => {
            request(baseurl)
                .get('/user/device/getGeofenceAlerts?page=1&limit=10&deviceId=')
                .set('Authorization', 'Bearer ' + firstUserToken)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(400);
                    expect(res.body.success).to.be.equal(false);
                    expect(res.body).to.have.property('message').that.equals("DeviceId is required.");
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

        it('50 - Get the Alerts for the devices all correct details', (done) => {
            request(baseurl)
                .get('/user/device/getGeofenceAlerts?page=1&limit=100&deviceId=' + vehicleId)
                .set('Authorization', 'Bearer ' + firstUserToken)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(200);
                    expect(res.body.success).to.be.equal(true);
                    expect(res.body).to.have.property('data').that.is.an('array');
                    expect(res.body).to.have.property('pagination').to.have.property('totalPages');
                    expect(res.body).to.have.property('pagination').to.have.property('currentPage');
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })
    })

    describe('Get - /user/device/getAlerts', () => {
        it('51 - Get the Alerts for the devices with page value lessthan 1', (done) => {
            request(baseurl)
                .get('/user/device/getAlerts?page=0&limit=100&deviceId=' + vehicleId)
                .set('Authorization', 'Bearer ' + firstUserToken)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(400);
                    expect(res.body.success).to.be.equal(false);
                    expect(res.body).to.have.property('message').that.equals("Page must be a positive integer starting from 1.");
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

        it('52 - Get the Alerts for the devices with limit value lessthan 1', (done) => {
            request(baseurl)
                .get('/user/device/getAlerts?page=1&limit=0&deviceId=' + vehicleId)
                .set('Authorization', 'Bearer ' + firstUserToken)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(400);
                    expect(res.body.success).to.be.equal(false);
                    expect(res.body).to.have.property('message').that.equals("Limit must be a positive integer.");
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

        it('53 - Get the Alerts for the devices with limit value greaterthan 100', (done) => {
            request(baseurl)
                .get('/user/device/getAlerts?page=1&limit=1000&deviceId=' + vehicleId)
                .set('Authorization', 'Bearer ' + firstUserToken)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(400);
                    expect(res.body.success).to.be.equal(false);
                    expect(res.body).to.have.property('message').that.equals("Limit cannot be greater than 100.");
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

        it('54 - Get the Alerts for the devices with empty device id', (done) => {
            request(baseurl)
                .get('/user/device/getAlerts?page=1&limit=10&deviceId=')
                .set('Authorization', 'Bearer ' + firstUserToken)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(400);
                    expect(res.body.success).to.be.equal(false);
                    expect(res.body).to.have.property('message').that.equals("DeviceId is required.");
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

        it('55 - Get the Alerts for the devices all correct details', (done) => {
            request(baseurl)
                .get('/user/device/getAlerts?page=1&limit=100&deviceId=' + vehicleId)
                .set('Authorization', 'Bearer ' + firstUserToken)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(200);
                    expect(res.body.success).to.be.equal(true);
                    expect(res.body).to.have.property('data').that.is.an('array');
                    expect(res.body).to.have.property('pagination').to.have.property('totalPages');
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })
    })

    describe('Get - /user/device/getDistanceStats', () => {
        it('56 - Get the getDistanceStats for the devices all correct details', (done) => {
            request(baseurl)
                .get(`/user/device/getDistanceStats?deviceId=${vehicleId}&startDate=${startDate}&endDate=${endDate}`)
                .set('Authorization', 'Bearer ' + firstUserToken)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(200);
                    expect(res.body.success).to.be.equal(true);
                    expect(res.body).to.have.property('data').that.is.an('array');
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

        it('57 - Get the getDistanceStats for the empty device id', (done) => {
            request(baseurl)
                .get(`/user/device/getDistanceStats?deviceId=&startDate=${startDate}&endDate=${endDate}`)
                .set('Authorization', 'Bearer ' + firstUserToken)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(400);
                    expect(res.body.success).to.be.equal(false);
                    expect(res.body).to.have.property('message').that.equals("DeviceId is required");
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

        it('58 - Get the getDistanceStats with invalid start and end date', (done) => {
            request(baseurl)
                .get('/user/device/getDistanceStats?deviceId=' + vehicleId + 'startDate=1704393060&endDate=1735669862')
                .set('Authorization', 'Bearer ' + firstUserToken)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(400);
                    expect(res.body.success).to.be.equal(false);
                    expect(res.body).to.have.property('message').that.equals("Invalid date format. Dates must be integers.");
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

        it('59 - Get the getDistanceStats with start date greaterthan end date', (done) => {
            request(baseurl)
                .get(`/user/device/getDistanceStats?deviceId=${vehicleId}&startDate=${endDate}&endDate=${startDate}`)
                .set('Authorization', 'Bearer ' + firstUserToken)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(400);
                    expect(res.body.success).to.be.equal(false);
                    expect(res.body).to.have.property('message').that.equals("StartDate must be less than EndDate.");
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

        it('60 - Get the getDistanceStats for the not registered devices with all correct details', (done) => {
            request(baseurl)
                .get(`/user/device/getDistanceStats?deviceId=${geofenceId}&startDate=${startDate}&endDate=${endDate}`) // geofenceId as device id
                .set('Authorization', 'Bearer ' + firstUserToken)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(404);
                    expect(res.body).to.have.property('error').that.equals("Device not found");
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

        it('61 - /user/device/getAllDistanceStats - Get the getDistanceStats for the user owned devices with all correct details', (done) => {
            request(baseurl)
                .get(`/user/device/getAllDistanceStats?startDate=${startDate}&endDate=${endDate}`)
                .set('Authorization', 'Bearer ' + firstUserToken)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(200);
                    expect(res.body.success).to.be.equal(true);
                    expect(res.body).to.have.property('data').that.is.an('array');
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

        it('62 - /user/device/getAllDistanceStats - Get the getDistanceStats with invalid start and end date', (done) => {
            request(baseurl)
                .get("/user/device/getAllDistanceStats?startDate='1704393060'&endDate='1735669862'")
                .set('Authorization', 'Bearer ' + firstUserToken)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(400);
                    expect(res.body.success).to.be.equal(false);
                    expect(res.body).to.have.property('message').that.equals("Invalid date format. Dates must be integers.");
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

        it('63 - /user/device/getAllDistanceStats - Get the getDistanceStats with start date greaterthan end date', (done) => {
            request(baseurl)
                .get(`/user/device/getAllDistanceStats?startDate=${endDate}&endDate=${startDate}`)
                .set('Authorization', 'Bearer ' + firstUserToken)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(400);
                    expect(res.body.success).to.be.equal(false);
                    expect(res.body).to.have.property('message').that.equals("StartDate must be less than EndDate.");
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

    })

    describe('Post - /user/group/create', () => {
        it('64 - Create a Group for testing the api "/user/device/getGroupDistanceStats"', (done) => {
            request(baseurl)
                .post('/user/group/create')
                .send({
                    "name": "test group " + Math.random().toString().slice(2, 5),
                    "description": "for device controller",
                    "devices": [{
                        "deviceId": vehicleId
                    },
                    {
                        "deviceId": mobileId
                    }]
                })
                .set('Authorization', 'Bearer ' + firstUserToken)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(200);
                    expect(res.body.success).to.be.equal(true);
                    expect(res.body).to.have.property('message').that.equals("Group Created with owned devices");
                    expect(res.body).to.have.property('groupId').with.lengthOf(24);
                    expect(res.body).to.have.property('groupadminId').with.lengthOf(24);
                    groupId = res.body.groupId
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })
    })

    describe('Get - /user/device/getGroupDistanceStats', () => {
        it('65 - Get the getGroupDistanceStats with all corerct details', (done) => {
            request(baseurl)
                .get(`/user/device/getGroupDistanceStats?groupId=${groupId}&startDate=${startDate}&endDate=${endDate}`)
                .set('Authorization', 'Bearer ' + firstUserToken)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(200);
                    expect(res.body.success).to.be.equal(true);
                    expect(res.body).to.have.property('data').that.is.an('array');
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

        it('66 - Get the getGroupDistanceStats with empty group if', (done) => {
            request(baseurl)
                .get(`/user/device/getGroupDistanceStats?groupId=&startDate=${startDate}&endDate=${endDate}`)
                .set('Authorization', 'Bearer ' + firstUserToken)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(400);
                    expect(res.body.success).to.be.equal(false);
                    expect(res.body).to.have.property('message').that.equals("Group Id is required");
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

        it('67 - Get the getGroupDistanceStats with non created group', (done) => {
            request(baseurl)
                .get(`/user/device/getGroupDistanceStats?groupId=${firstUserId}&startDate=${startDate}&endDate=${endDate}`)
                .set('Authorization', 'Bearer ' + firstUserToken)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(401);
                    expect(res.body.success).to.be.equal(false);
                    expect(res.body).to.have.property('message').that.equals("Unauthorized");
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

        it('68 - Get the getGroupDistanceStats with invalid dates', (done) => {
            request(baseurl)
                .get('/user/device/getGroupDistanceStats?groupId=' + groupId + '&startDate="1704393060"&endDate="1735669862"')
                .set('Authorization', 'Bearer ' + firstUserToken)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(400);
                    expect(res.body.success).to.be.equal(false);
                    expect(res.body).to.have.property('message').that.equals("Invalid date format. Dates must be integers.");
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

        it('69 - Get the getGroupDistanceStats with start date > end date', (done) => {
            request(baseurl)
            .get(`/user/device/getGroupDistanceStats?groupId=${groupId}&startDate=${endDate}&endDate=${startDate}`)
                .set('Authorization', 'Bearer ' + firstUserToken)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(400);
                    expect(res.body.success).to.be.equal(false);
                    expect(res.body).to.have.property('message').that.equals("StartDate must be less than EndDate.");
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })
    })

    describe('Post - /user/device/request', () => {

        it('69 - Request a Device Access from other user for accept', (done) => {
            request(baseurl)
                .post('/user/device/request')
                .send({
                    "deviceId": secondUserMobileId,
                    "to": secondUserId // USer id of the device owner
                })
                .set('Authorization', 'Bearer ' + firstUserToken)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(200);
                    expect(res.body.success).to.be.equal(true);
                    expect(res.body).to.have.property('message').that.equals("Request sent");
                    expect(res.body).to.have.property('requestId').with.lengthOf(24);
                    requestIdForAccept = res.body.requestId;
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

        it('70 - Request a Device Access from other user for reject', (done) => {
            request(baseurl)
                .post('/user/device/request')
                .send({
                    "deviceId": thirdUserMobileId,
                    "to": thirdUserId // USer id of the device owner
                })
                .set('Authorization', 'Bearer ' + firstUserToken)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(200);
                    expect(res.body.success).to.be.equal(true);
                    expect(res.body).to.have.property('message').that.equals("Request sent");
                    expect(res.body).to.have.property('requestId').with.lengthOf(24);
                    requestIdForReject = res.body.requestId;
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

        it('71 - Request a Device Access to the non existing user', (done) => {
            request(baseurl)
                .post('/user/device/request')
                .send({
                    "deviceId": secondUserMobileId,
                    "to": geofenceId // geofenceId is act as an to user id
                })
                .set('Authorization', 'Bearer ' + firstUserToken)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(400);
                    expect(res.body.success).to.be.equal(false);
                    expect(res.body).to.have.property('message').that.equals("User does not exists");
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

        it("72 - Request a Device Access to the non existing user's device", (done) => {
            request(baseurl)
                .post('/user/device/request')
                .send({
                    "deviceId": geofenceId, // geofenceId is act as an to device id
                    "to": secondUserId 
                })
                .set('Authorization', 'Bearer ' + firstUserToken)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(400);
                    expect(res.body.success).to.be.equal(false);
                    expect(res.body).to.have.property('message').that.equals("Device does not exists");
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

        it("73 - Request a Device Access to own device", (done) => {
            request(baseurl)
                .post('/user/device/request')
                .send({
                    "deviceId": vehicleId, // geofenceId is act as an to device id
                    "to": secondUserId
                })
                .set('Authorization', 'Bearer ' + firstUserToken)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(400);
                    expect(res.body.success).to.be.equal(false);
                    expect(res.body).to.have.property('message').that.equals("You cannot send request to your own device");
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

        it("74 - Request a Device Access other owner devices", (done) => {
            request(baseurl)
                .post('/user/device/request')
                .send({
                    "deviceId": thirdUserMobileId, 
                    "to": secondUserId
                })
                .set('Authorization', 'Bearer ' + firstUserToken)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(400);
                    expect(res.body.success).to.be.equal(false);
                    expect(res.body).to.have.property('message').that.equals("Owner does not exists");
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

    })

    describe('Post - /user/device/acceptRequest', () => {
        it("75 - Accept a Request for the device access", (done) => {
            request(baseurl)
                .post('/user/device/acceptRequest')
                .send({
                    "requestId": requestIdForAccept
                })
                .set('Authorization', 'Bearer ' + secondUserToken)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(200);
                    expect(res.body.success).to.be.equal(true);
                    expect(res.body).to.have.property('message').that.equals("Request accepted");
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

        it("76 - Accept a already accepted Request", (done) => {
            request(baseurl)
                .post('/user/device/acceptRequest')
                .send({
                    "requestId": requestIdForAccept
                })
                .set('Authorization', 'Bearer ' + secondUserToken)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(400);
                    expect(res.body.success).to.be.equal(false);
                    expect(res.body).to.have.property('error').that.equals("Request cannot be updated");
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

        it("77 - Accept a non existing request", (done) => {
            request(baseurl)
                .post('/user/device/acceptRequest')
                .send({
                    "requestId": firstUserId //user id act as an non existing request id
                })
                .set('Authorization', 'Bearer ' + secondUserToken)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(400);
                    expect(res.body.success).to.be.equal(false);
                    expect(res.body).to.have.property('message').that.equals("Request does not exists");
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

        it("78 - Accept a empty request id", (done) => {
            request(baseurl)
                .post('/user/device/acceptRequest')
                .send({
                    "requestId": ""
                })
                .set('Authorization', 'Bearer ' + secondUserToken)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(400);
                    expect(res.body.success).to.be.equal(false);
                    expect(res.body).to.have.property('error').that.equals("Invalid data");
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })
    })

    describe('Post - /user/device/rejectRequest', () => {
        it("79 - /user/device/rejectRequest - Reject a Request for the device access", (done) => {
            request(baseurl)
                .post('/user/device/rejectRequest')
                .send({
                    "requestId": requestIdForReject
                })
                .set('Authorization', 'Bearer ' + thirdUserToken)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(200);
                    expect(res.body.success).to.be.equal(true);
                    expect(res.body).to.have.property('message').that.equals("Request rejected");
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

        it("80 - /user/device/rejectRequest - Reject a already Rejected Request", (done) => {
            request(baseurl)
                .post('/user/device/rejectRequest')
                .send({
                    "requestId": requestIdForReject
                })
                .set('Authorization', 'Bearer ' + thirdUserToken)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(400);
                    expect(res.body.success).to.be.equal(false);
                    expect(res.body).to.have.property('error').that.equals("Request cannot be updated");
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

        it("81 - /user/device/rejectRequest - Reject a non existing request", (done) => {
            request(baseurl)
                .post('/user/device/rejectRequest')
                .send({
                    "requestId": firstUserId //user id act as an non existing request id
                })
                .set('Authorization', 'Bearer ' + thirdUserToken)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(400);
                    expect(res.body.success).to.be.equal(false);
                    expect(res.body).to.have.property('message').that.equals("Request does not exists");
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

        it("82 - /user/device/rejectRequest - Reject a empty request id", (done) => {
            request(baseurl)
                .post('/user/device/rejectRequest')
                .send({
                    "requestId": ""
                })
                .set('Authorization', 'Bearer ' + secondUserToken)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(400);
                    expect(res.body.success).to.be.equal(false);
                    expect(res.body).to.have.property('error').that.equals("Invalid data");
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })
    })

    describe('Get - /user/device/getRequests', () => {
        it('83 - Get the request for the user with type all and status invited', (done) => {
            request(baseurl)
                .get('/user/device/getRequests?type=all&status=invited')
                .set('Authorization', 'Bearer ' + firstUserToken)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(200);
                    expect(res.body.success).to.be.equal(true);
                    expect(res.body).to.have.property('requests').that.is.an('array');
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })
        
        it('84 - Get the request for the user with type all and status accepted', (done) => {
            request(baseurl)
                .get('/user/device/getRequests?type=all&status=accepted')
                .set('Authorization', 'Bearer ' + firstUserToken)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(200);
                    expect(res.body.success).to.be.equal(true);
                    expect(res.body).to.have.property('requests').that.is.an('array');
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

        it('85 - Get the request for the user with type all and status rejected', (done) => {
            request(baseurl)
                .get('/user/device/getRequests?type=all&status=rejected')
                .set('Authorization', 'Bearer ' + firstUserToken)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(200);
                    expect(res.body.success).to.be.equal(true);
                    expect(res.body).to.have.property('requests').that.is.an('array');
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

        it('86 - Get the request for the user with type sent and status invited', (done) => {
            request(baseurl)
                .get('/user/device/getRequests?type=sent&status=invited')
                .set('Authorization', 'Bearer ' + firstUserToken)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(200);
                    expect(res.body.success).to.be.equal(true);
                    expect(res.body).to.have.property('requests').that.is.an('array');
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })
        
        it('87 - Get the request for the user with type sent and status accepted', (done) => {
            request(baseurl)
                .get('/user/device/getRequests?type=sent&status=accepted')
                .set('Authorization', 'Bearer ' + firstUserToken)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(200);
                    expect(res.body.success).to.be.equal(true);
                    expect(res.body).to.have.property('requests').that.is.an('array');
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

        it('88 - Get the request for the user with type sent and status rejected', (done) => {
            request(baseurl)
                .get('/user/device/getRequests?type=sent&status=rejected')
                .set('Authorization', 'Bearer ' + firstUserToken)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(200);
                    expect(res.body.success).to.be.equal(true);
                    expect(res.body).to.have.property('requests').that.is.an('array');
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

        it('89 - Get the request for the user with type received and status invited', (done) => {
            request(baseurl)
                .get('/user/device/getRequests?type=received&status=invited')
                .set('Authorization', 'Bearer ' + firstUserToken)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(200);
                    expect(res.body.success).to.be.equal(true);
                    expect(res.body).to.have.property('requests').that.is.an('array');
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })
        
        it('90 - Get the request for the user with type received and status accepted', (done) => {
            request(baseurl)
                .get('/user/device/getRequests?type=received&status=accepted')
                .set('Authorization', 'Bearer ' + firstUserToken)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(200);
                    expect(res.body.success).to.be.equal(true);
                    expect(res.body).to.have.property('requests').that.is.an('array');
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

        it('91 - Get the request for the user with type received and status rejected', (done) => {
            request(baseurl)
                .get('/user/device/getRequests?type=received&status=rejected')
                .set('Authorization', 'Bearer ' + firstUserToken)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(200);
                    expect(res.body.success).to.be.equal(true);
                    expect(res.body).to.have.property('requests').that.is.an('array');
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

        it('92 - Get the request for the user with  worng type', (done) => {
            request(baseurl)
                .get('/user/device/getRequests?type=notall&status=invited')
                .set('Authorization', 'Bearer ' + firstUserToken)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(400);
                    expect(res.body.success).to.be.equal(false);
                    expect(res.body).to.have.property('message').that.equals("Invalid request type");
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

        it('93 - Get the request for the user with worng status', (done) => {
            request(baseurl)
                .get('/user/device/getRequests?type=all&status=call')
                .set('Authorization', 'Bearer ' + firstUserToken)
                .end(function(err, res) {                
                    expect(res.statusCode).to.be.equal(400);
                    expect(res.body.success).to.be.equal(false);
                    expect(res.body).to.have.property('message').that.equals("Invalid request status");
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })
    })

    describe('Get - /user/device/getUsersWhoHasSharedAccess', () => {
        it('94 - Get the Users Who Has SharedAccess', (done) => {
            request(baseurl)
                .get('/user/device/getUsersWhoHasSharedAccess?deviceId=' + mobileId)
                .set('Authorization', 'Bearer ' + firstUserToken)
                .end(function(err, res) {                
                    expect(res.statusCode).to.be.equal(200);
                    expect(res.body.success).to.be.equal(true);
                    expect(res.body).to.have.property('users');
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

        it('95 - Get the Users Who Has SharedAccess with non existing device', (done) => {
            request(baseurl)
                .get('/user/device/getUsersWhoHasSharedAccess?deviceId=' + firstUserId)
                .set('Authorization', 'Bearer ' + firstUserToken)
                .end(function(err, res) {                
                    expect(res.statusCode).to.be.equal(400);
                    expect(res.body.success).to.be.equal(false);
                    expect(res.body).to.have.property('message').that.equals("Device does not exists");
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

        it('96 - Get the Users Who Has SharedAccess with other`s devices', (done) => {
            request(baseurl)
                .get('/user/device/getUsersWhoHasSharedAccess?deviceId=' + secondUserMobileId)
                .set('Authorization', 'Bearer ' + firstUserToken)
                .end(function(err, res) {                
                    expect(res.statusCode).to.be.equal(400);
                    expect(res.body.success).to.be.equal(false);
                    expect(res.body).to.have.property('message').that.equals("You are not allowed to access this device");
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

        it('97 - Get the Users Who Has SharedAccess', (done) => {
            request(baseurl)
                .get('/user/device/getUsersWhoHasSharedAccess?deviceId=')
                .set('Authorization', 'Bearer ' + firstUserToken)
                .end(function(err, res) {                
                    expect(res.statusCode).to.be.equal(400);
                    expect(res.body.success).to.be.equal(false);
                    expect(res.body).to.have.property('error').that.equals("Invalid data");
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })
    })

    describe('Delete - /user/device/removeShareAccess', () => {
        it('98 - Remove shared Access from the user with non existinf device', (done) => {
            request(baseurl)
                .delete(`/user/device/removeShareAccess?deviceId=${firstUserId}&firstUserId=${firstUserId}`)
                .set('Authorization', 'Bearer ' + secondUserToken)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(400);
                    expect(res.body.success).to.be.equal(false);
                    expect(res.body).to.have.property('message').that.equals("Device does not exists");
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

        it('99 - Remove shared Access to the others devices', (done) => {
            request(baseurl)
                .delete(`/user/device/removeShareAccess?deviceId=${thirdUserMobileId}&firstUserId=${firstUserId}`)
                .set('Authorization', 'Bearer ' + secondUserToken)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(400);
                    expect(res.body.success).to.be.equal(false);
                    expect(res.body).to.have.property('message').that.equals("You are not allowed to remove access");
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

        it('100 - Remove shared Access from the non existing user', (done) => {
            request(baseurl)
                .delete(`/user/device/removeShareAccess?deviceId=${secondUserMobileId}&firstUserId=${geofenceId}`) //geofence id act as an non existing userid
                .set('Authorization', 'Bearer ' + secondUserToken)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(400);
                    expect(res.body.success).to.be.equal(false);
                    expect(res.body).to.have.property('message').that.equals("User does not exists");
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

        it('101 - Remove shared Access from correct data', (done) => {
            request(baseurl)
                .delete(`/user/device/removeShareAccess?deviceId=${secondUserMobileId}&userId=${firstUserId}`)
                .set('Authorization', 'Bearer ' + secondUserToken)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(200);
                    expect(res.body.success).to.be.equal(true);
                    expect(res.body).to.have.property('message').that.equals("Access removed");
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })
    })

    describe('Post - /user/device/generateShareableLink', () => {
        it('102 - Generate a Shareable Link for the device', (done) => {
            request(baseurl)
                .post('/user/device/generateShareableLink')
                .send({
                    "deviceId": vehicleId,
                    "expiry": 30 , // in minutes
                    "name": "test link"
                })
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
                .set('Authorization', 'Bearer ' + firstUserToken)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(200);
                    expect(res.body.success).to.be.equal(true);
                    expect(res.body).to.have.property('message').that.equals("Shareable Link Generated");
                    expect(res.body).to.have.property('data');
                    expect(res.body).to.have.property('token');
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

        it('103 - Generate a Shareable Link for the non existing device', (done) => {
            request(baseurl)
                .post('/user/device/generateShareableLink')
                .send({
                    "deviceId": firstUserId,
                    "expiry": 30 , // in minutes
                    "name": "test link"
                })
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
                .set('Authorization', 'Bearer ' + firstUserToken)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(400);
                    expect(res.body.success).to.be.equal(false);
                    expect(res.body).to.have.property('message').that.equals("Device ID Not Available In Database");
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

        it('104 - Generate a Shareable Link for device without device id', (done) => {
            request(baseurl)
                .post('/user/device/generateShareableLink')
                .send({
                    "expiry": 30 , // in minutes
                    "name": "test link"
                })
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
                .set('Authorization', 'Bearer ' + firstUserToken)
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

        it('105 - Generate a Shareable Link for device without expiry', (done) => {
            request(baseurl)
                .post('/user/device/generateShareableLink')
                .send({
                    "deviceId": firstUserId,
                    "name": "test link"
                })
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
                .set('Authorization', 'Bearer ' + firstUserToken)
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

        it('106 - Generate a Shareable Link for device without name', (done) => {
            request(baseurl)
                .post('/user/device/generateShareableLink')
                .send({
                    "deviceId": firstUserId,
                    "expiry": 30
                })
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
                .set('Authorization', 'Bearer ' + firstUserToken)
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
    })

    describe('Get - /user/device/getDeviceWithShareableLink', () => {
        it('107 - Get the Device With ShareableLink using device token', (done) => {
            request(baseurl)
                .get('/user/device/getDeviceWithShareableLink?token=' + mobileDeviceToken)
                .send({
                    "deviceId": vehicleId, 
                    "firstUserId": firstUserId
                })
                .end(function(err, res) {                
                    expect(res.statusCode).to.be.equal(200);
                    expect(res.body.success).to.be.equal(true);
                    expect(res.body).to.have.property('message').that.equals("Device Details Retrived From Database");
                    expect(res.body).to.have.property('data');
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

        it('108 - Get the Device With ShareableLink using empty device token', (done) => {
            request(baseurl)
                .get('/user/device/getDeviceWithShareableLink?token=')
                .set('Authorization', 'Bearer ' + firstUserToken)
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
    })

    describe('Get - /user/device/getShareableLinks', () => {
        it('109 - Get the Shareable Links using valid data', (done) => {
            request(baseurl)
                .get('/user/device/getShareableLinks?deviceId=' + mobileId)
                .set('Authorization', 'Bearer ' + firstUserToken)
                .end(function(err, res) {                
                    expect(res.statusCode).to.be.equal(200);
                    expect(res.body.success).to.be.equal(true);
                    expect(res.body).to.have.property('message').that.equals("Shareable Links Retrived From Database");
                    expect(res.body).to.have.property('data').that.is.an('array');
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

        it('110 - Get the Shareable Links using empty device id', (done) => {
            request(baseurl)
                .get('/user/device/getShareableLinks?deviceId=')
                .set('Authorization', 'Bearer ' + firstUserToken)
                .end(function(err, res) {                
                    expect(res.statusCode).to.be.equal(400);
                    expect(res.body.success).to.be.equal(false);
                    expect(res.body).to.have.property('message').that.equals("Device ID is required");
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

        it('111 - Get the Shareable Links using non register device', (done) => {
            request(baseurl)
                .get('/user/device/getShareableLinks?deviceId=' + geofenceId) //geofence id act as an device id
                .set('Authorization', 'Bearer ' + firstUserToken)
                .end(function(err, res) {                
                    expect(res.statusCode).to.be.equal(400);
                    expect(res.body.success).to.be.equal(false);
                    expect(res.body).to.have.property('message').that.equals("Device ID Not Available In Database");
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })
    })

    describe('Delete - /user/device/delete', () => {

        it('112 - Delete the other owner Device from the database', (done) => {
            request(baseurl)
                .delete('/user/device/delete?deviceId=' + secondUserMobileId)
                .send({})
                .set('Authorization', 'Bearer ' + firstUserToken)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(400);
                    expect(res.body.success).to.be.equal(false);
                    expect(res.body).to.have.property('message').that.equals("User doesn't own a device");
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

        it('113 - Delete the Device from the database using empty device id', (done) => {
            request(baseurl)
                .delete('/user/device/delete?deviceId=')
                .send({})
                .set('Authorization', 'Bearer ' + firstUserToken)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(400);
                    expect(res.body.success).to.be.equal(false);
                    expect(res.body).to.have.property('message').that.equals("Device ID is required");
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

        it('114 - Delete the Device from the database using invalid device id', (done) => {
            request(baseurl)
                .delete('/user/device/delete?deviceId=' + geofenceId) //geofence id act as an device id
                .send({})
                .set('Authorization', 'Bearer ' + firstUserToken)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(400);
                    expect(res.body.success).to.be.equal(false);
                    expect(res.body).to.have.property('message').that.equals("User doesn't own a device");
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

        it('115 - Delete the Device from the database', (done) => {
            request(baseurl)
                .delete('/user/device/delete?deviceId=' + deleteVehicleId) //geofence id act as an device id
                .send({})
                .set('Authorization', 'Bearer ' + firstUserToken)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(200);
                    expect(res.body.success).to.be.equal(true);
                    expect(res.body).to.have.property('message').that.equals("Device Deleted From The Database");
                    expect(res.body).to.have.property('deviceId').with.lengthOf(24);
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })
    })
    
});

