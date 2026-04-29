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

const newMobile = {
    "imei": Math.random().toString().slice(2, 17),
    "name": "Test Mobile " + Math.random().toString().slice(2, 12),
    "type": "mobile",
    "deviceInfo" : {
        "attributes": {
            "type": "android"
          }
        }
}

const newVehicle = {
    "imei": Math.random().toString().slice(2, 17),
    "name": "Test Vehicle " + Math.random().toString().slice(2, 12),
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

let token, userId, vehicleId, mobileId, secondUserGeofenceId, firstGeofenceId, secondGeofenceId, firstUserGroupId;
let secondUserToken, secondUserId;


describe('Geofence Controller API Testcases', () => {
    
    describe('Post - /user/login', () => {

        it('1 - Valid login of first user', (done) => {
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

        it('2 - Valid login of second user', (done) => {
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
    
    })

    describe('Post - /user/geofence/add', () => {

        it('3 - Create a Geofene for testing the api with invalid type', (done) => {
            request(baseurl)
                .post('/user/geofence/add')
                .send({
                    "type": "rectangle",
                    "name": "test for geofence controller",
                    "coordinates": {
                        "center": [80.26260145429173, 13.01381719446696],
                        "radius": 454
                    }
                })
                .set('Authorization', 'Bearer ' + token)
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

        it('4 - Create a Geofene for testing the api with empty name', (done) => {
            request(baseurl)
                .post('/user/geofence/add')
                .send({
                    "type": "Circle",
                    "name": "",
                    "coordinates": {
                        "center": [80.26260145429173, 13.01381719446696],
                        "radius": 454
                    }
                })
                .set('Authorization', 'Bearer ' + token)
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

        it('5 - Create a Geofene for testing the api with coordinates', (done) => {
            request(baseurl)
                .post('/user/geofence/add')
                .send({
                    "type": "Circle",
                    "name": "test"
                })
                .set('Authorization', 'Bearer ' + token)
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

        it('6 - Create a Geofene for testing the api', (done) => {
            request(baseurl)
                .post('/user/geofence/add')
                .send({
                    "type": "Circle",
                    "name": "test circle for geofence controller",
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
                    firstGeofenceId = res.body.geofenceId
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

        it('7 - Create a Geofene for testing the api', (done) => {
            request(baseurl)
                .post('/user/geofence/add')
                .send({
                    "type": "Polygon",
                    "name": "test geofence for polygon",
                    "coordinates": [ [// Outer loop
                    [
                        77.6865249,
                        8.4483247
                    ],
                    [
                        76.2363296,
                        9.7074397
                    ],
                    [
                        75.7968765,
                        11.3069728
                    ],
                    [
                        74.5224624,
                        13.4541798
                    ],
                    [
                        73.7314468,
                        15.7093299
                    ],
                    [
                        74.8740249,
                        16.7225974
                    ],
                    [
                        77.554689,
                        16.7225974
                    ],
                    [
                        79.0927749,
                        17.4371052
                    ],
                    [
                        77.6865249,
                        20.2250323
                    ],
                    [
                        76.719728,
                        21.2530225
                    ],
                    [
                        79.4443374,
                        22.3145716
                    ],
                    [
                        81.5976577,
                        22.5178065
                    ],
                    [
                        83.4873062,
                        21.4577746
                    ],
                    [
                        83.5312515,
                        19.480627
                    ],
                    [
                        84.3662124,
                        18.1906022
                    ],
                    [
                        82.4326187,
                        17.1852391
                    ],
                    [
                        82.0810562,
                        16.0054025
                    ],
                    [
                        81.1582046,
                        15.2856233
                    ],
                    [
                        80.4550796,
                        14.5208036
                    ],
                    [
                        81.5976577,
                        12.2968774
                    ],
                    [
                        80.8505874,
                        12.081987
                    ],
                    [
                        80.1035171,
                        10.8323096
                    ],
                    [
                        79.4882827,
                        10.0106798
                    ],
                    [
                        78.7412124,
                        8.2308025
                    ],
                    [
                        77.9941421,
                        7.4903515
                    ],
                    [
                        76.8076187,
                        7.4467551
                    ],
                    [
                        76.8076187,
                        7.4467551
                    ],
                    [
                        77.7304702,
                        8.3613304
                    ],
                        [
                        77.6865249,
                        8.4483247
                    ]
                    ]]
                })
                .set('Authorization', 'Bearer ' + token)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(200);
                    expect(res.body.success).to.be.equal(true);
                    expect(res.body).to.have.property('message').that.equals("Geofence added successfully");
                    expect(res.body).to.have.property('geofenceId').with.lengthOf(24);
                    secondGeofenceId = res.body.geofenceId
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

        it('8 - Create a Geofene using existing name', (done) => {
            request(baseurl)
                .post('/user/geofence/add')
                .send({
                    "type": "Circle",
                    "name": "test circle for geofence controller",
                    "coordinates": {
                        "center": [80.26260145429173, 13.01381719446696],
                        "radius": 454
                    }
                })
                .set('Authorization', 'Bearer ' + token)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(400);
                    expect(res.body.success).to.be.equal(false);
                    expect(res.body).to.have.property('message').that.equals("Geofence with the same name already exists");
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

        it('9 - Create a Geofene for testing the api for add geofence to devices', (done) => {
            request(baseurl)
                .post('/user/geofence/add')
                .send({
                    "type": "Circle",
                    "name": "test circle for add geofence to devices",
                    "coordinates": {
                        "center": [80.26260145429173, 13.01381719446696],
                        "radius": 454
                    }
                })
                .set('Authorization', 'Bearer ' + secondUserToken)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(200);
                    expect(res.body.success).to.be.equal(true);
                    expect(res.body).to.have.property('message').that.equals("Geofence added successfully");
                    expect(res.body).to.have.property('geofenceId').with.lengthOf(24);
                    secondUserGeofenceId = res.body.geofenceId
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

    })

    describe('Post - /user/geofence/update', () => {

        it('10 - update a Geofene using empty geofence name', (done) => {
            request(baseurl)
                .post('/user/geofence/update')
                .send({
                    "name": "",
                    "geofenceId": firstGeofenceId,
                    "description": "testing"
            })
                .set('Authorization', 'Bearer ' + token)
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

        it('11 - update a Geofene using empty geofenceId', (done) => {
            request(baseurl)
                .post('/user/geofence/update')
                .send({
                    "name": "changed geofence name",
                    "geofenceId": "",
                    "description": ""
            })
                .set('Authorization', 'Bearer ' + token)
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

        it('12 - update a Geofene valid data', (done) => {
            request(baseurl)
                .post('/user/geofence/update')
                .send({
                    "name": "changed geofence name",
                    "geofenceId": firstGeofenceId,
                    "description": "tesing"
            })
                .set('Authorization', 'Bearer ' + token)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(200);
                    expect(res.body.success).to.be.equal(true);
                    expect(res.body).to.have.property('message').that.equals("Geofence Updated successfully");
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

    })

    describe('Get - /user/geofence/getAll', () => {

        it('13- get all a Geofene using valid token', (done) => {
            request(baseurl)
                .get('/user/geofence/getAll')
                .set('Authorization', 'Bearer ' + token)
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

        it('14- get all a Geofene using invalid token', (done) => {
            request(baseurl)
                .get('/user/geofence/getAll')
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

    })

    describe('Get - /user/geofence/get', () => {

        it('15 - get Geofene data using empty id', (done) => {
            request(baseurl)
                .get('/user/geofence/get?id=')
                .set('Authorization', 'Bearer ' + token)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(400);
                    expect(res.body.success).to.be.equal(false);
                    expect(res.body).to.have.property('message').that.equals("Geofence ID is required");
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

        it('16 - get non existing geofence data', (done) => {
            request(baseurl)
                .get('/user/geofence/get?id=' + userId) //user id act as an geofence id
                .set('Authorization', 'Bearer ' + token)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(400);
                    expect(res.body.success).to.be.equal(false);
                    expect(res.body).to.have.property('message').that.equals("Geofence not found");
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

        it('17 - get existing geofence data', (done) => {
            request(baseurl)
                .get('/user/geofence/get?id=' + firstGeofenceId)
                .set('Authorization', 'Bearer ' + token)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(200);
                    expect(res.body.success).to.be.equal(true);
                    expect(res.body).to.have.property('data').to.have.property('_id');
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

    })

    describe('Post - /user/device/add', () => {

        it('18 - Add a GPS Device for addToDevices', (done) => {
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

        it('19 - Add a mobile for addToDevices', (done) => {
            request(baseurl)
                .post('/user/device/add')
                .send(newMobile)
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
                .set('Authorization', 'Bearer ' + token)
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

    })

    describe('Post - /user/geofence/addToDevices', () => {

        it('20 - add geofence to the empty devices array using invalid data', (done) => {
            request(baseurl)
                .post('/user/geofence/addToDevices')
                .send({
                    "geofenceId": firstGeofenceId,
                    "deviceIds": []
                })
                .set('Authorization', 'Bearer ' + token)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(400);
                    expect(res.body.success).to.be.equal(false);
                    expect(res.body).to.have.property('error')
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

        it('21 - add empty geofence id to the devices', (done) => {
            request(baseurl)
                .post('/user/geofence/addToDevices')
                .send({
                    "geofenceId": "",
                    "deviceIds": [mobileId, vehicleId]
                })
                .set('Authorization', 'Bearer ' + token)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(400);
                    expect(res.body.success).to.be.equal(false);
                    expect(res.body).to.have.property('error')
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

        it('22 - add non existing geofence id to the devices', (done) => {
            request(baseurl)
                .post('/user/geofence/addToDevices')
                .send({
                    "geofenceId": userId, //user id act as an geofences
                    "deviceIds": [mobileId, vehicleId]
                })
                .set('Authorization', 'Bearer ' + token)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(400);
                    expect(res.body.success).to.be.equal(false);
                    expect(res.body).to.have.property('message').that.equals("Geofence not found");
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })
    
        it('23 - add existing geofence id to the unowned devices', (done) => {
            request(baseurl)
                .post('/user/geofence/addToDevices')
                .send({
                    "geofenceId": secondUserGeofenceId,
                    "deviceIds": [mobileId, vehicleId]
                })
                .set('Authorization', 'Bearer ' + secondUserToken)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(400);
                    expect(res.body.success).to.be.equal(false);
                    expect(res.body).to.have.property('message').that.equals("None of the devices do not belong to the user");
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

        it('24 - update a Geofene valid data', (done) => {
            request(baseurl)
                .post('/user/geofence/addToDevices')
                .send({
                    "geofenceId": firstGeofenceId,
                    "deviceIds": [vehicleId, mobileId]
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

    describe('Post - /user/geofence/removeFromDevices', () => {

        it('25 - remove geofence to the empty devices array using invalid data', (done) => {
            request(baseurl)
                .post('/user/geofence/removeFromDevices')
                .send({
                    "geofenceId": firstGeofenceId,
                    "deviceIds": []
                })
                .set('Authorization', 'Bearer ' + token)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(400);
                    expect(res.body.success).to.be.equal(false);
                    expect(res.body).to.have.property('error')
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

        it('26 - remove empty geofence id to the devices', (done) => {
            request(baseurl)
                .post('/user/geofence/removeFromDevices')
                .send({
                    "geofenceId": "",
                    "deviceIds": [mobileId, vehicleId]
                })
                .set('Authorization', 'Bearer ' + token)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(400);
                    expect(res.body.success).to.be.equal(false);
                    expect(res.body).to.have.property('error')
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

        it('27 - add non existing geofence id to the devices', (done) => {
            request(baseurl)
                .post('/user/geofence/removeFromDevices')
                .send({
                    "geofenceId": userId, //user id act as an geofences
                    "deviceIds": [mobileId, vehicleId]
                })
                .set('Authorization', 'Bearer ' + token)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(400);
                    expect(res.body.success).to.be.equal(false);
                    expect(res.body).to.have.property('message').that.equals("Geofence not found");
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

        it('28 - remove existing geofence id to the unowned devices', (done) => {
            request(baseurl)
                .post('/user/geofence/removeFromDevices')
                .send({
                    "geofenceId": secondUserGeofenceId,
                    "deviceIds": [mobileId, vehicleId]
                })
                .set('Authorization', 'Bearer ' + secondUserToken)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(400);
                    expect(res.body.success).to.be.equal(false);
                    expect(res.body).to.have.property('message').that.equals("None of the devices do not belong to the user");
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

        it('29 - removed a Geofene from devices', (done) => {
            request(baseurl)
                .post('/user/geofence/removeFromDevices')
                .send({
                    "geofenceId": firstGeofenceId,
                    "deviceIds": [vehicleId, mobileId]
                })
                .set('Authorization', 'Bearer ' + token)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(200);
                    expect(res.body.success).to.be.equal(true);
                    expect(res.body).to.have.property('message').that.equals("Geofence removed from owned devices successfully");
                    expect(res.body).to.have.property('geofenceRemovedDevices').that.is.an('array');
                    expect(res.body).to.have.property('unownedDevices').that.is.an('array');
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

    })

    describe('Post - /user/geofence/addToGroups', () => {
    
        it('30 - /user/group/create - Create a Group for testing the api for the add geofence to the group', (done) => {
            request(baseurl)
                .post('/user/group/create')
                .send({
                    "name": "Test group of geofence VC",
                    "description": "for geofence controller",
                    "devices": [{
                        "deviceId": vehicleId
                    },
                    {
                        "deviceId": mobileId
                    }]
                })
                .set('Authorization', 'Bearer ' + token)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(200);
                    expect(res.body.success).to.be.equal(true);
                    expect(res.body).to.have.property('message').that.equals("Group Created with owned devices");
                    expect(res.body).to.have.property('groupId').with.lengthOf(24);
                    expect(res.body).to.have.property('groupadminId').with.lengthOf(24);
                    firstUserGroupId = res.body.groupId
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

        it('31 - add Groups to the empty group array using invalid data', (done) => {
            request(baseurl)
                .post('/user/geofence/addToGroups')
                .send({
                    "geofenceId": firstGeofenceId,
                    "groupIds": []
                })
                .set('Authorization', 'Bearer ' + token)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(400);
                    expect(res.body.success).to.be.equal(false);
                    expect(res.body).to.have.property('error')
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

        it('32 - add empty geofence id to the Groups', (done) => {
            request(baseurl)
                .post('/user/geofence/addToGroups')
                .send({
                    "geofenceId": "",
                    "groupIds": [firstUserGroupId]
                })
                .set('Authorization', 'Bearer ' + token)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(400);
                    expect(res.body.success).to.be.equal(false);
                    expect(res.body).to.have.property('error')
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

        it('33 - add non existing geofence id to the Groups', (done) => {
            request(baseurl)
                .post('/user/geofence/addToGroups')
                .send({
                    "geofenceId": userId, //user id act as an geofences
                    "groupIds": [firstUserGroupId]
                })
                .set('Authorization', 'Bearer ' + token)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(400);
                    expect(res.body.success).to.be.equal(false);
                    expect(res.body).to.have.property('message').that.equals("Geofence not found");
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

        it('34 - add existing geofence id to the unowned groups', (done) => {
            request(baseurl)
                .post('/user/geofence/addToGroups')
                .send({
                    "geofenceId": secondUserGeofenceId,
                    "groupIds": [firstUserGroupId]
                })
                .set('Authorization', 'Bearer ' + secondUserToken)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(400);
                    expect(res.body.success).to.be.equal(false);
                    expect(res.body).to.have.property('message').that.equals("None of the Group do not belong to the user");
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

        it('35 - update a Geofene valid data', (done) => {
            request(baseurl)
                .post('/user/geofence/addToGroups')
                .send({
                    "geofenceId": firstGeofenceId,
                    "groupIds": [firstUserGroupId]
                })
                .set('Authorization', 'Bearer ' + token)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(200);
                    expect(res.body.success).to.be.equal(true);
                    expect(res.body).to.have.property('message').that.equals("Geofence Successfully Added To Owned Groups");
                    expect(res.body).to.have.property('geofenceAddedGroups').that.is.an('array');
                    expect(res.body).to.have.property('unownedGroups').that.is.an('array');
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

    })

    describe('Post - /user/geofence/removeFromGroups', () => {

        it('36 - remove geofence to the empty Groups array using invalid data', (done) => {
            request(baseurl)
                .post('/user/geofence/removeFromGroups')
                .send({
                    "geofenceId": firstGeofenceId,
                    "groupIds": []
                })
                .set('Authorization', 'Bearer ' + token)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(400);
                    expect(res.body.success).to.be.equal(false);
                    expect(res.body).to.have.property('error')
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

        it('37 - remove empty geofence id to the Groups', (done) => {
            request(baseurl)
                .post('/user/geofence/removeFromGroups')
                .send({
                    "geofenceId": "",
                    "groupIds": [firstUserGroupId]
                })
                .set('Authorization', 'Bearer ' + token)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(400);
                    expect(res.body.success).to.be.equal(false);
                    expect(res.body).to.have.property('error')
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

        it('38 - add non existing geofence id to the Groups', (done) => {
            request(baseurl)
                .post('/user/geofence/removeFromGroups')
                .send({
                    "geofenceId": userId, //user id act as an geofences
                    "groupIds": [firstUserGroupId]
                })
                .set('Authorization', 'Bearer ' + token)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(400);
                    expect(res.body.success).to.be.equal(false);
                    expect(res.body).to.have.property('message').that.equals("Geofence not found");
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

        it('39 - remove existing geofence id to the unowned Groups', (done) => {
            request(baseurl)
                .post('/user/geofence/removeFromGroups')
                .send({
                    "geofenceId": secondUserGeofenceId,
                    "groupIds": [firstUserGroupId]
                })
                .set('Authorization', 'Bearer ' + secondUserToken)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(400);
                    expect(res.body.success).to.be.equal(false);
                    expect(res.body).to.have.property('message').that.equals('None of the Group do not belong to the user');
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

        it('40 - removed a Geofene from Groups', (done) => {
            request(baseurl)
                .post('/user/geofence/removeFromGroups')
                .send({
                    "geofenceId": firstGeofenceId,
                    "groupIds": [firstUserGroupId]
                })
                .set('Authorization', 'Bearer ' + token)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(200);
                    expect(res.body.success).to.be.equal(true);
                    expect(res.body).to.have.property('message').that.equals("Geofence Removed From Groups");
                    expect(res.body).to.have.property('geofenceRemovedGroups').that.is.an('array');
                    expect(res.body).to.have.property('unownedGroups').that.is.an('array');
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })
    
    })

    describe('Delete - /user/geofence/delete', () => {

        it('41 - Delete geofence using empty id', (done) => {
            request(baseurl)
                .delete('/user/geofence/delete?id=')
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
                .set('Authorization', 'Bearer ' + token)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(400);
                    expect(res.body.success).to.be.equal(false);
                    expect(res.body).to.have.property('message').with.equals("Geofence ID is required");
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

        it('42 - Delete geofence using empty id', (done) => {
            request(baseurl)
                .delete('/user/geofence/delete?id=' + userId) //user id act as an geofence id
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
                .set('Authorization', 'Bearer ' + token)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(400);
                    expect(res.body.success).to.be.equal(false);
                    expect(res.body).to.have.property('message').with.equals("Geofence not found");
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

        it('43 - Delete geofence using correct id', (done) => {
            request(baseurl)
                .delete('/user/geofence/delete?id=' + firstGeofenceId) 
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
                .set('Authorization', 'Bearer ' + token)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(200);
                    expect(res.body.success).to.be.equal(true);
                    expect(res.body).to.have.property('message').with.equals("Geofence deleted successfully");
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

    })

});