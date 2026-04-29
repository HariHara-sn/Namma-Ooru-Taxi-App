import request from 'supertest';
import { assert, expect } from 'chai';
import { firtsUserData, secondUserData, thirdUserData } from './A_UserController.spec.mjs';
import { vehicleId, mobileId, secondUserVehicleId } from './B_DeviceController.spec.mjs';
import { driverData, driverData2, driverId, driver2Id } from './I_DriverController.spec.mjs';
import { passangerId, passanger2Id, passanger3Id } from './J_PassangerController.spec.mjs';

const baseurl = 'http://localhost:3000';

const user1LoginCredential = {
    "email": firtsUserData.email,
    "password": firtsUserData.password
}

const user2LoginCredential = {
    "email": secondUserData.email,
    "password": secondUserData.password
}

describe('Ride Group Controller API Testcases', () => {
    let userId, user2Id, userToken, user2Token, rideGroupId, rideGroupIdUser2, routeId;

    describe('Users Loing', () => {
        
        it('/user/login - User 1 login', (done) => {
            request(baseurl)
                .post('/user/login')
                .send(user1LoginCredential)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(200);
                    expect(res.body.success).to.be.equal(true);
                    expect(res.body).to.have.property('message').that.equals("Logged in");
                    expect(res.body).to.have.property('user').to.have.property('name');
                    expect(res.body).to.have.property('user').to.have.property('_id').with.lengthOf(24);
                    expect(res.body).to.have.property('user').to.have.property('token').with.lengthOf(183);
                    userToken = res.body.user.token;
                    userId = res.body.user._id;
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

        it('/user/login - User 2 login', (done) => {
            request(baseurl)
                .post('/user/login')
                .send(user2LoginCredential)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(200);
                    expect(res.body.success).to.be.equal(true);
                    expect(res.body).to.have.property('message').that.equals("Logged in");
                    expect(res.body).to.have.property('user').to.have.property('name');
                    expect(res.body).to.have.property('user').to.have.property('_id').with.lengthOf(24);
                    expect(res.body).to.have.property('user').to.have.property('token').with.lengthOf(183);
                    user2Token = res.body.user.token;
                    user2Id = res.body.user._id;
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })
    })

    describe('Post - /user/rideGroup/create', () => {

        it('1 - Should fail for using non string for name and Desc', (done) => {
            request(baseurl)
                .post('/user/rideGroup/create')
                .send({
                    "name": "Backend Test for Ride Group",
                    "description": 8979696
                })
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
                .set('Authorization', 'Bearer ' + userToken)
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

        it('2 - Should fail for using non string for name', (done) => {
            request(baseurl)
                .post('/user/rideGroup/create')
                .send({
                    "name": 9797,
                    "description": "Backend Test for Ride Group"
                })
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
                .set('Authorization', 'Bearer ' + userToken)
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

        it('3 - Should fail for using non existing Driver', (done) => {
            request(baseurl)
                .post('/user/rideGroup/create')
                .send({
                    "name": "Backend Test for Ride Group",
                    "description": "Backend Test for Ride Group",
                    "driver": "67da8d15d2e048b6eebe84a1"
                })
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
                .set('Authorization', 'Bearer ' + userToken)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(400);
                    expect(res.body.success).to.be.equal(false);
                    expect(res.body).to.have.property('message').that.equals("Driver does not exist");
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

        it('4 - Should fail for using non existing vehicle', (done) => {
            request(baseurl)
                .post('/user/rideGroup/create')
                .send({
                    "name": "Backend Test for Ride Group",
                    "description": "Backend Test for Ride Group",
                    "vehicle": "67da8d15d2e048b6eebe84a1" 
                })
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
                .set('Authorization', 'Bearer ' + userToken)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(400);
                    expect(res.body.success).to.be.equal(false);
                    expect(res.body).to.have.property('message').that.equals("Vehicle does not exist");
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

        it('5 - Should fail for using invalid token', (done) => {
            request(baseurl)
                .post('/user/rideGroup/create')
                .send({
                    "name": "Backend Test for Ride Group",
                    "description": "Backend Test for Ride Group",
                    "vehicle": "Non Existing ID" 
                })
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
                .set('Authorization', 'Bearer ' + userToken + 'w')
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(401);
                    expect(res.body.success).to.be.equal(false);
                    expect(res.body).to.have.property('error').that.equals('Unauthorized');
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

        it('6 - Should fail for using Both drive and vehicle', (done) => {
            request(baseurl)
                .post('/user/rideGroup/create')
                .send({
                    "name": "Backend Test for Ride Group",
                    "description": "Backend Test for Ride Group",
                    "driver": "Non Existing ID",
                    "vehicle": "Non Existing ID" 
                })
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
                .set('Authorization', 'Bearer ' + userToken)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(400);
                    expect(res.body.success).to.be.equal(false);
                    expect(res.body).to.have.property('message').that.equals('Please choose either a vehicle or a driver and not both');
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

        it('7 - Should fail for using other users driver', (done) => {
            request(baseurl)
                .post('/user/rideGroup/create')
                .send({
                    "name": "Backend Test for Ride Group",
                    "description": "Backend Test for Ride Group",
                    "driver": driverId
                })
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
                .set('Authorization', 'Bearer ' + user2Token)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(400);
                    expect(res.body.success).to.be.equal(false);
                    expect(res.body).to.have.property('message').that.equals('You are not allowed to set this driver to this ride group');
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

        it('8 - Should fail for using other users vehicle', (done) => {
            request(baseurl)
                .post('/user/rideGroup/create')
                .send({
                    "name": "Backend Test for Ride Group",
                    "description": "Backend Test for Ride Group",
                    "vehicle": vehicleId
                })
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
                .set('Authorization', 'Bearer ' + user2Token)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(400);
                    expect(res.body.success).to.be.equal(false);
                    expect(res.body).to.have.property('message').that.equals('You are not allowed to set this vehicle to this ride group');
                    if (err) {
                        throw err;
                    }
                    done();
                    
                });
        })

        it('9 - Should fail for using mobile device instead of vehicle', (done) => {
            request(baseurl)
                .post('/user/rideGroup/create')
                .send({
                    "name": "Backend Test for Ride Group",
                    "description": "Backend Test for Ride Group",
                    "vehicle": mobileId
                })
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
                .set('Authorization', 'Bearer ' + userToken)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(400);
                    expect(res.body.success).to.be.equal(false);
                    expect(res.body).to.have.property('message').that.equals('You are allowed to set only vehicle not any other devices');
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

        it('10 - Should Success using valid Data for user 1', (done) => {
            request(baseurl)
                .post('/user/rideGroup/create')
                .send({
                    "name": "Backend Test for Ride Group",
                    "description": "Backend Test for Ride Group",
                    "driver": driverId
                })
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
                .set('Authorization', 'Bearer ' + userToken)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(200);
                    expect(res.body.success).to.be.equal(true);
                    expect(res.body).to.have.property('rideGroupId');
                    expect(res.body).to.have.property('message').that.equals('Ride group created successfully');
                    rideGroupId = res.body.rideGroupId
                    if (err) {
                        throw err;
                    }
                    done();
                });
        });

        it('11 - Should Sucess using valid Data for user 2', (done) => {
            request(baseurl)
                .post('/user/rideGroup/create')
                .send({
                    "name": "Backend Test for Ride Group for user 2",
                    "description": "Backend Test for Ride Group user 2",
                    "vehicle": secondUserVehicleId
                })
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
                .set('Authorization', 'Bearer ' + user2Token)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(200);
                    expect(res.body.success).to.be.equal(true);
                    expect(res.body).to.have.property('rideGroupId');
                    expect(res.body).to.have.property('message').that.equals('Ride group created successfully');
                    rideGroupIdUser2 = res.body.rideGroupId
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

    })

    describe('Post - /user/rideGroup/update', () => {

        it('12 - Should fail without using ridegroupId', (done) => {
            request(baseurl)
                .post('/user/rideGroup/update')
                .send({
                    "name": "Backend Test for Ride Group",
                    "description": 8979696
                })
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
                .set('Authorization', 'Bearer ' + userToken)
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

        it('13 - Should fail for using non string for name and Desc', (done) => {
            request(baseurl)
                .post('/user/rideGroup/update')
                .send({
                    "rideGroupId": rideGroupId,
                    "name": "Backend Test for Ride Group",
                    "description": 8979696
                })
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
                .set('Authorization', 'Bearer ' + userToken)
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

        it('14 - Should fail for using non string for name', (done) => {
            request(baseurl)
                .post('/user/rideGroup/update')
                .send({
                    "rideGroupId": rideGroupId,
                    "name": 9797,
                    "description": "Backend Test for Ride Group"
                })
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
                .set('Authorization', 'Bearer ' + userToken)
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

        it('15 - Should fail for using non existing Ride group Id', (done) => {
            request(baseurl)
                .post('/user/rideGroup/update')
                .send({
                    "name": "Backend Test for Ride Group - updated",
                    "description": "Backend Test for Ride Group - updated",
                    "rideGroupId": "67d27f0f2fe79731191c2c99",
                })
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
                .set('Authorization', 'Bearer ' + userToken)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(400);
                    expect(res.body.success).to.be.equal(false);
                    expect(res.body).to.have.property('message').that.equals("Ride group does not exist");
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

        it('16 - Should fail for using invalid key', (done) => {
            request(baseurl)
                .post('/user/rideGroup/update')
                .send({
                    "name": "Backend Test for Ride Group",
                    "description": "Backend Test for Ride Group",
                    "vehicle": "67da8d15d2e048b6eebe84a1" 
                })
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
                .set('Authorization', 'Bearer ' + userToken)
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

        it('17 - Should fail for using invalid token', (done) => {
            request(baseurl)
                .post('/user/rideGroup/update')
                .send({
                    "name": "Backend Test for Ride Group - updated",
                    "description": "Backend Test for Ride Group - updated",
                    "rideGroupId": rideGroupId,
                })
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
                .set('Authorization', 'Bearer ' + userToken + 'w')
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(401);
                    expect(res.body.success).to.be.equal(false);
                    expect(res.body).to.have.property('error').that.equals('Unauthorized');
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

        it('18 - Should Sucess using valid Data', (done) => {
            request(baseurl)
                .post('/user/rideGroup/update')
                .send({
                    "name": "Backend Test for Ride Group - updated",
                    "description": "Backend Test for Ride Group - updated",
                    "rideGroupId": rideGroupId
                })
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
                .set('Authorization', 'Bearer ' + userToken)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(200);
                    expect(res.body.success).to.be.equal(true);
                    expect(res.body).to.have.property('message').that.equals('Ride group updated successfully');
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

    })

    describe('Post - /user/rideGroup/addPassangers', () => {

        it('19 - Should fail using invalid Ride Group', (done) => {
            request(baseurl)
                .post('/user/rideGroup/addPassangers')
                .send({
                    "passangers": [
                        "67bda7229c63c26ef3adcfa2"
                    ],
                    "rideGroupId": 111
                })
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
                .set('Authorization', 'Bearer ' + userToken)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(400);
                    expect(res.body.success).to.be.equal(false);
                    expect(res.body).to.have.property('message').that.equals("Ride group id must a string");
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

        it('20 - Should fail using Non Existing Ride Group', (done) => {
            request(baseurl)
                .post('/user/rideGroup/addPassangers')
                .send({
                    "passangers": [
                        "67bda7229c63c26ef3adcfa2"
                    ],
                    "rideGroupId": "67bda7229c63c26ef3adcfa2"
                })
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
                .set('Authorization', 'Bearer ' + userToken)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(400);
                    expect(res.body.success).to.be.equal(false);
                    expect(res.body).to.have.property('message').that.equals("Ride group does not exist");
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

        it('21 - Should fail using other user ride group', (done) => {
            request(baseurl)
                .post('/user/rideGroup/addPassangers')
                .send({
                    "passangers": [
                        "67bda7229c63c26ef3adcfa2"
                    ],
                    "rideGroupId": rideGroupIdUser2
                })
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
                .set('Authorization', 'Bearer ' + userToken)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(400);
                    expect(res.body.success).to.be.equal(false);
                    expect(res.body).to.have.property('message').that.equals("You are not allowed to add passangers to this ride group");
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

        it('22 - Should fail for using empty Array of Passanger', (done) => {
            request(baseurl)
                .post('/user/rideGroup/addPassangers')
                .send({
                    "passangers": [
                        
                    ],
                    "rideGroupId": rideGroupId
                })
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
                .set('Authorization', 'Bearer ' + userToken)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(400);
                    expect(res.body.success).to.be.equal(false);
                    expect(res.body).to.have.property('message').that.equals("No passangers to add");
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

        it('23 - Should fail for using missing Passangers data', (done) => {
            request(baseurl)
                .post('/user/rideGroup/addPassangers')
                .send({
                    "rideGroupId": rideGroupId
                })
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
                .set('Authorization', 'Bearer ' + userToken)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(400);
                    expect(res.body.success).to.be.equal(false);
                    expect(res.body).to.have.property('message').that.equals("No passangers provided");
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

        it('24 - Should fail for using 50+ Passangers data', (done) => {
            request(baseurl)
                .post('/user/rideGroup/addPassangers')
                .send({
                    "passangers": [
                        "67bda7229c63c26ef3adcfa2",
                        "67bda7229c63c26ef3adcfa3",
                        "67bda7229c63c26ef3adcfa4",
                        "67bda7229c63c26ef3adcfa5",
                        "67bda7229c63c26ef3adcfa6",
                        "67bda7229c63c26ef3adcfa7",
                        "67bda7229c63c26ef3adcfa8",
                        "67bda7229c63c26ef3adcfa9",
                        "67bda7229c63c26ef3adcfaa",
                        "67bda7229c63c26ef3adcfab",
                        "67bda7229c63c26ef3adcfac",
                        "67bda7229c63c26ef3adcfad",
                        "67bda7229c63c26ef3adcfae",
                        "67bda7229c63c26ef3adcfaf",
                        "67bda7229c63c26ef3adcfb0",
                        "67bda7229c63c26ef3adcfb1",
                        "67bda7229c63c26ef3adcfb2",
                        "67bda7229c63c26ef3adcfb3",
                        "67bda7229c63c26ef3adcfb4",
                        "67bda7229c63c26ef3adcfb5",
                        "67bda7229c63c26ef3adcfb6",
                        "67bda7229c63c26ef3adcfb7",
                        "67bda7229c63c26ef3adcfb8",
                        "67bda7229c63c26ef3adcfb9",
                        "67bda7229c63c26ef3adcfba",
                        "67bda7229c63c26ef3adcfbb",
                        "67bda7229c63c26ef3adcfbc",
                        "67bda7229c63c26ef3adcfbd",
                        "67bda7229c63c26ef3adcfbe",
                        "67bda7229c63c26ef3adcfbf",
                        "67bda7229c63c26ef3adcfc0",
                        "67bda7229c63c26ef3adcfc1",
                        "67bda7229c63c26ef3adcfc2",
                        "67bda7229c63c26ef3adcfc3",
                        "67bda7229c63c26ef3adcfc4",
                        "67bda7229c63c26ef3adcfc5",
                        "67bda7229c63c26ef3adcfc6",
                        "67bda7229c63c26ef3adcfc7",
                        "67bda7229c63c26ef3adcfc8",
                        "67bda7229c63c26ef3adcfc9",
                        "67bda7229c63c26ef3adcfca",
                        "67bda7229c63c26ef3adcfcb",
                        "67bda7229c63c26ef3adcfcc",
                        "67bda7229c63c26ef3adcfcd",
                        "67bda7229c63c26ef3adcfce",
                        "67bda7229c63c26ef3adcfcf",
                        "67bda7229c63c26ef3adcfd0",
                        "67bda7229c63c26ef3adcfd1",
                        "67bda7229c63c26ef3adcfd2",
                        "67bda7229c63c26ef3adcfd3",
                        "67bda7229c63c26ef3adcfd4",
                        "67bda7229c63c26ef3adcfd5",
                        "67bda7229c63c26ef3adcfd6",
                        "67bda7229c63c26ef3adcfd7"
                    ],
                    "rideGroupId": rideGroupId
                })
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
                .set('Authorization', 'Bearer ' + userToken)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(400);
                    expect(res.body.success).to.be.equal(false);
                    expect(res.body).to.have.property('message').that.equals("Cannot add more than 50 passangers at once in a ride group");
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

        it('25 - Should fail for using Non Existing Passanger', (done) => {
            request(baseurl)
                .post('/user/rideGroup/addPassangers')
                .send({
                    "passangers": [
                        "67bda7229c63c26ef3adcff7"
                    ],
                    "rideGroupId": rideGroupId
                })
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
                .set('Authorization', 'Bearer ' + userToken)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(400);
                    expect(res.body.success).to.be.equal(false);
                    expect(res.body).to.have.property('message').that.equals("One or more passangers do not exist");
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

        it('26 - Should Success for Valid Data', (done) => {
            request(baseurl)
                .post('/user/rideGroup/addPassangers')
                .send({
                    "passangers": [
                        passanger2Id, passanger3Id
                    ],
                    "rideGroupId": rideGroupId
                })
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
                .set('Authorization', 'Bearer ' + userToken)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(200);
                    expect(res.body.success).to.be.equal(true);
                    expect(res.body).to.have.property('message').that.equals("Passangers added to ride group successfully");
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

        it('27 - Should Fail for Adding exisiting passangers in ride group', (done) => {
            request(baseurl)
                .post('/user/rideGroup/addPassangers')
                .send({
                    "passangers": [
                        passanger2Id, passanger3Id
                    ],
                    "rideGroupId": rideGroupId
                })
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
                .set('Authorization', 'Bearer ' + userToken)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(400);
                    expect(res.body.success).to.be.equal(false);
                    expect(res.body).to.have.property('message').that.equals("Some Passanger Already Existing in the RideGroup");
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })
    })

    describe('Post - /user/rideGroup/removePassangers', () => {

        it('28 - Should fail using invalid Ride Group', (done) => {
            request(baseurl)
                .post('/user/rideGroup/removePassangers')
                .send({
                    "passangers": [
                        "67bda7229c63c26ef3adcfa2"
                    ],
                    "rideGroupId": 111
                })
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
                .set('Authorization', 'Bearer ' + userToken)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(400);
                    expect(res.body.success).to.be.equal(false);
                    expect(res.body).to.have.property('message').that.equals("Ride group id must a string");
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

        it('29 - Should fail using Non Existing Ride Group', (done) => {
            request(baseurl)
                .post('/user/rideGroup/removePassangers')
                .send({
                    "passangers": [
                        "67bda7229c63c26ef3adcfa2"
                    ],
                    "rideGroupId": "67bda7229c63c26ef3adcfa2"
                })
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
                .set('Authorization', 'Bearer ' + userToken)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(400);
                    expect(res.body.success).to.be.equal(false);
                    expect(res.body).to.have.property('message').that.equals("Ride group does not exist");
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

        it('30 - Should fail using other user ride group', (done) => {
            request(baseurl)
                .post('/user/rideGroup/removePassangers')
                .send({
                    "passangers": [
                        "67bda7229c63c26ef3adcfa2"
                    ],
                    "rideGroupId": rideGroupIdUser2
                })
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
                .set('Authorization', 'Bearer ' + userToken)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(400);
                    expect(res.body.success).to.be.equal(false);
                    expect(res.body).to.have.property('message').that.equals("You are not allowed to remove passangers from this ride group");
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

        it('31 - Should fail for using empty Array of Passanger', (done) => {
            request(baseurl)
                .post('/user/rideGroup/removePassangers')
                .send({
                    "passangers": [
                        
                    ],
                    "rideGroupId": rideGroupId
                })
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
                .set('Authorization', 'Bearer ' + userToken)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(400);
                    expect(res.body.success).to.be.equal(false);
                    expect(res.body).to.have.property('message').that.equals("No passangers to Remove");
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

        it('32 - Should fail for using missing Passangers data', (done) => {
            request(baseurl)
                .post('/user/rideGroup/removePassangers')
                .send({
                    "rideGroupId": rideGroupId
                })
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
                .set('Authorization', 'Bearer ' + userToken)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(400);
                    expect(res.body.success).to.be.equal(false);
                    expect(res.body).to.have.property('message').that.equals("No passangers provided");
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

        it('33 - Should fail for using 50+ Passangers data', (done) => {
            request(baseurl)
                .post('/user/rideGroup/removePassangers')
                .send({
                    "passangers": [
                        "67bda7229c63c26ef3adcfa2",
                        "67bda7229c63c26ef3adcfa3",
                        "67bda7229c63c26ef3adcfa4",
                        "67bda7229c63c26ef3adcfa5",
                        "67bda7229c63c26ef3adcfa6",
                        "67bda7229c63c26ef3adcfa7",
                        "67bda7229c63c26ef3adcfa8",
                        "67bda7229c63c26ef3adcfa9",
                        "67bda7229c63c26ef3adcfaa",
                        "67bda7229c63c26ef3adcfab",
                        "67bda7229c63c26ef3adcfac",
                        "67bda7229c63c26ef3adcfad",
                        "67bda7229c63c26ef3adcfae",
                        "67bda7229c63c26ef3adcfaf",
                        "67bda7229c63c26ef3adcfb0",
                        "67bda7229c63c26ef3adcfb1",
                        "67bda7229c63c26ef3adcfb2",
                        "67bda7229c63c26ef3adcfb3",
                        "67bda7229c63c26ef3adcfb4",
                        "67bda7229c63c26ef3adcfb5",
                        "67bda7229c63c26ef3adcfb6",
                        "67bda7229c63c26ef3adcfb7",
                        "67bda7229c63c26ef3adcfb8",
                        "67bda7229c63c26ef3adcfb9",
                        "67bda7229c63c26ef3adcfba",
                        "67bda7229c63c26ef3adcfbb",
                        "67bda7229c63c26ef3adcfbc",
                        "67bda7229c63c26ef3adcfbd",
                        "67bda7229c63c26ef3adcfbe",
                        "67bda7229c63c26ef3adcfbf",
                        "67bda7229c63c26ef3adcfc0",
                        "67bda7229c63c26ef3adcfc1",
                        "67bda7229c63c26ef3adcfc2",
                        "67bda7229c63c26ef3adcfc3",
                        "67bda7229c63c26ef3adcfc4",
                        "67bda7229c63c26ef3adcfc5",
                        "67bda7229c63c26ef3adcfc6",
                        "67bda7229c63c26ef3adcfc7",
                        "67bda7229c63c26ef3adcfc8",
                        "67bda7229c63c26ef3adcfc9",
                        "67bda7229c63c26ef3adcfca",
                        "67bda7229c63c26ef3adcfcb",
                        "67bda7229c63c26ef3adcfcc",
                        "67bda7229c63c26ef3adcfcd",
                        "67bda7229c63c26ef3adcfce",
                        "67bda7229c63c26ef3adcfcf",
                        "67bda7229c63c26ef3adcfd0",
                        "67bda7229c63c26ef3adcfd1",
                        "67bda7229c63c26ef3adcfd2",
                        "67bda7229c63c26ef3adcfd3",
                        "67bda7229c63c26ef3adcfd4",
                        "67bda7229c63c26ef3adcfd5",
                        "67bda7229c63c26ef3adcfd6",
                        "67bda7229c63c26ef3adcfd7"
                    ],
                    "rideGroupId": rideGroupId
                })
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
                .set('Authorization', 'Bearer ' + userToken)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(400);
                    expect(res.body.success).to.be.equal(false);
                    expect(res.body).to.have.property('message').that.equals("Cannot remove more than 50 passangers at once in a ride group");
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

        it('34 - Should fail for using Non Existing Passanger', (done) => {
            request(baseurl)
                .post('/user/rideGroup/removePassangers')
                .send({
                    "passangers": [
                        "67bda7229c63c26ef3adcff7"
                    ],
                    "rideGroupId": rideGroupId
                })
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
                .set('Authorization', 'Bearer ' + userToken)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(400);
                    expect(res.body.success).to.be.equal(false);
                    expect(res.body).to.have.property('message').that.equals("One or more passangers do not exist");
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

        it('35 - Should Success for Valid Data', (done) => {
            request(baseurl)
                .post('/user/rideGroup/removePassangers')
                .send({
                    "passangers": [
                        passanger3Id
                    ],
                    "rideGroupId": rideGroupId
                })
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
                .set('Authorization', 'Bearer ' + userToken)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(200);
                    expect(res.body.success).to.be.equal(true);
                    expect(res.body).to.have.property('message').that.equals("Passangers removed from ride group successfully");
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })
    })

    describe('Post - /user/rideGroup/addRoute', () => {

        it('36 - Should fail using non Existing ridegroupId', (done) => {
            request(baseurl)
                .post('/user/rideGroup/addRoute')
                .send({
                    "rideGroupId": "67bda7889c63c26ef3adcf11",
                    "name": "Test Ride Group Route",
                    "timezone": "Asia/Calcutta",
                    "routeType": "pickup",
                    "description": "pickup route for passangers",
                    "startLocation": [
                        80.27423280214649,
                        13.024259860617297
                    ],
                    "endLocation": [
                        80.266222328166,
                        13.018530112907827
                    ],
                    "startTime": "07:50 PM",
                    "endTime": "05:55 PM",
                    "stops": [
                        {
                            "name": "stop-1",
                            "passangers": [
                                "67bda73b9c63c26ef3adcfa7",
                                "67bda7339c63c26ef3adcfa6"
                            ],
                            "location": [
                                80.26914677686771,
                                13.026079228280414
                            ],
                            "address": "4th Trust Cross Street, Chennai, zone 9 teynampet, Tamil Nadu, India, pincode:600001",
                            "arrivalTime": "02:31 PM"
                        },
                        {
                            "name": "stop-2",
                            "passangers": [
                                "67bda7229c63c26ef3adcfa5"
                            ],
                            "location": [
                                80.26914677686771,
                                13.026079228280414
                            ],
                            "address": "4th Trust Cross Street, Chennai, zone 9 teynampet, Tamil Nadu, India, pincode:600001",
                            "arrivalTime": "02:39 PM"
                        }
                    ],
                    "days": [
                        "Sunday",
                        "Monday",
                        "Tuesday",
                        "Wednesday",
                        "Thursday",
                        "Friday",
                        "Saturday"
                    ]
                })
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
                .set('Authorization', 'Bearer ' + userToken)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(400);
                    expect(res.body.success).to.be.equal(false);
                    expect(res.body).to.have.property('message').that.equals("Ride group not found");
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

        it('37 - Should fail using Invalid ridegroupId', (done) => {
            request(baseurl)
                .post('/user/rideGroup/addRoute')
                .send({
                    "rideGroupId": 11111,
                    "name": "Test Ride Group Route",
                    "timezone": "Asia/Calcutta",
                    "routeType": "pickup",
                    "description": "pickup route for passangers",
                    "startLocation": [
                        80.27423280214649,
                        13.024259860617297
                    ],
                    "endLocation": [
                        80.266222328166,
                        13.018530112907827
                    ],
                    "startTime": "07:50 PM",
                    "endTime": "05:55 PM",
                    "stops": [
                        {
                            "name": "stop-1",
                            "passangers": [
                                "67bda73b9c63c26ef3adcfa7",
                                "67bda7339c63c26ef3adcfa6"
                            ],
                            "location": [
                                80.26914677686771,
                                13.026079228280414
                            ],
                            "address": "4th Trust Cross Street, Chennai, zone 9 teynampet, Tamil Nadu, India, pincode:600001",
                            "arrivalTime": "02:31 PM"
                        },
                        {
                            "name": "stop-2",
                            "passangers": [
                                "67bda7229c63c26ef3adcfa5"
                            ],
                            "location": [
                                80.26914677686771,
                                13.026079228280414
                            ],
                            "address": "4th Trust Cross Street, Chennai, zone 9 teynampet, Tamil Nadu, India, pincode:600001",
                            "arrivalTime": "02:39 PM"
                        }
                    ],
                    "days": [
                        "Sunday",
                        "Monday",
                        "Tuesday",
                        "Wednesday",
                        "Thursday",
                        "Friday",
                        "Saturday"
                    ]
                })
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
                .set('Authorization', 'Bearer ' + userToken)
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

        it('38 - Should fail using route as int', (done) => {
            request(baseurl)
                .post('/user/rideGroup/addRoute')
                .send({
                    "rideGroupId": rideGroupId,
                    "name": 1111,
                    "timezone": "Asia/Calcutta",
                    "routeType": "pickup",
                    "description": "pickup route for passangers",
                    "startLocation": [
                        80.27423280214649,
                        13.024259860617297
                    ],
                    "endLocation": [
                        80.266222328166,
                        13.018530112907827
                    ],
                    "startTime": "07:50 PM",
                    "endTime": "05:55 PM",
                    "stops": [
                        {
                            "name": "stop-1",
                            "passangers": [
                                "67bda73b9c63c26ef3adcfa7",
                                "67bda7339c63c26ef3adcfa6"
                            ],
                            "location": [
                                80.26914677686771,
                                13.026079228280414
                            ],
                            "address": "4th Trust Cross Street, Chennai, zone 9 teynampet, Tamil Nadu, India, pincode:600001",
                            "arrivalTime": "02:31 PM"
                        },
                        {
                            "name": "stop-2",
                            "passangers": [
                                "67bda7229c63c26ef3adcfa5"
                            ],
                            "location": [
                                80.26914677686771,
                                13.026079228280414
                            ],
                            "address": "4th Trust Cross Street, Chennai, zone 9 teynampet, Tamil Nadu, India, pincode:600001",
                            "arrivalTime": "02:39 PM"
                        }
                    ],
                    "days": [
                        "Sunday",
                        "Monday",
                        "Tuesday",
                        "Wednesday",
                        "Thursday",
                        "Friday",
                        "Saturday"
                    ]
                })
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
                .set('Authorization', 'Bearer ' + userToken)
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

        it('39 - Should fail using route Type other than pickup and drop', (done) => {
            request(baseurl)
                .post('/user/rideGroup/addRoute')
                .send({
                    "rideGroupId": rideGroupId,
                    "name": "test route",
                    "timezone": "Asia/Calcutta",
                    "routeType": "test",
                    "description": "pickup route for passangers",
                    "startLocation": [
                        80.27423280214649,
                        13.024259860617297
                    ],
                    "endLocation": [
                        80.266222328166,
                        13.018530112907827
                    ],
                    "startTime": "07:50 PM",
                    "endTime": "05:55 PM",
                    "stops": [
                        {
                            "name": "stop-1",
                            "passangers": [
                                "67bda73b9c63c26ef3adcfa7",
                                "67bda7339c63c26ef3adcfa6"
                            ],
                            "location": [
                                80.26914677686771,
                                13.026079228280414
                            ],
                            "address": "4th Trust Cross Street, Chennai, zone 9 teynampet, Tamil Nadu, India, pincode:600001",
                            "arrivalTime": "02:31 PM"
                        },
                        {
                            "name": "stop-2",
                            "passangers": [
                                "67bda7229c63c26ef3adcfa5"
                            ],
                            "location": [
                                80.26914677686771,
                                13.026079228280414
                            ],
                            "address": "4th Trust Cross Street, Chennai, zone 9 teynampet, Tamil Nadu, India, pincode:600001",
                            "arrivalTime": "02:39 PM"
                        }
                    ],
                    "days": [
                        "Sunday",
                        "Monday",
                        "Tuesday",
                        "Wednesday",
                        "Thursday",
                        "Friday",
                        "Saturday"
                    ]
                })
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
                .set('Authorization', 'Bearer ' + userToken)
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

        it('40 - Should fail using invalid route time zone', (done) => {
            request(baseurl)
                .post('/user/rideGroup/addRoute')
                .send({
                    "rideGroupId": rideGroupId,
                    "name": "test route",
                    "timezone": 533,
                    "routeType": "pickup",
                    "description": "pickup route for passangers",
                    "startLocation": [
                        80.27423280214649,
                        13.024259860617297
                    ],
                    "endLocation": [
                        80.266222328166,
                        13.018530112907827
                    ],
                    "startTime": "07:50 PM",
                    "endTime": "05:55 PM",
                    "stops": [
                        {
                            "name": "stop-1",
                            "passangers": [
                                "67bda73b9c63c26ef3adcfa7",
                                "67bda7339c63c26ef3adcfa6"
                            ],
                            "location": [
                                80.26914677686771,
                                13.026079228280414
                            ],
                            "address": "4th Trust Cross Street, Chennai, zone 9 teynampet, Tamil Nadu, India, pincode:600001",
                            "arrivalTime": "02:31 PM"
                        },
                        {
                            "name": "stop-2",
                            "passangers": [
                                "67bda7229c63c26ef3adcfa5"
                            ],
                            "location": [
                                80.26914677686771,
                                13.026079228280414
                            ],
                            "address": "4th Trust Cross Street, Chennai, zone 9 teynampet, Tamil Nadu, India, pincode:600001",
                            "arrivalTime": "02:39 PM"
                        }
                    ],
                    "days": [
                        "Sunday",
                        "Monday",
                        "Tuesday",
                        "Wednesday",
                        "Thursday",
                        "Friday",
                        "Saturday"
                    ]
                })
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
                .set('Authorization', 'Bearer ' + userToken)
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

        it('41 - Should fail using startLocation and endLocation as Object', (done) => {
            request(baseurl)
                .post('/user/rideGroup/addRoute')
                .send({
                    "rideGroupId": rideGroupId,
                    "name": "test route",
                    "timezone": "Asia/Calcutta",
                    "routeType": "drop",
                    "description": "pickup route for passangers",
                    "startLocation": {
                        lng: 12.423280214649,
                        lat: 90.4259860617297
                    },
                    "endLocation": {
                        lng: 12.423280214649,
                        lat: 90.4259860617297
                    },
                    "startTime": "07:50 PM",
                    "endTime": "05:55 PM",
                    "stops": [
                        {
                            "name": "stop-1",
                            "passangers": [
                                "67bda73b9c63c26ef3adcfa7",
                                "67bda7339c63c26ef3adcfa6"
                            ],
                            "location": [
                                80.26914677686771,
                                13.026079228280414
                            ],
                            "address": "4th Trust Cross Street, Chennai, zone 9 teynampet, Tamil Nadu, India, pincode:600001",
                            "arrivalTime": "02:31 PM"
                        },
                        {
                            "name": "stop-2",
                            "passangers": [
                                "67bda7229c63c26ef3adcfa5"
                            ],
                            "location": [
                                80.26914677686771,
                                13.026079228280414
                            ],
                            "address": "4th Trust Cross Street, Chennai, zone 9 teynampet, Tamil Nadu, India, pincode:600001",
                            "arrivalTime": "02:39 PM"
                        }
                    ],
                    "days": [
                        "Sunday",
                        "Monday",
                        "Tuesday",
                        "Wednesday",
                        "Thursday",
                        "Friday",
                        "Saturday"
                    ]
                })
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
                .set('Authorization', 'Bearer ' + userToken)
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

        it('42 - Should fail using startTime and endTime as millisecond', (done) => {
            request(baseurl)
                .post('/user/rideGroup/addRoute')
                .send({
                    "rideGroupId": rideGroupId,
                    "name": "Test route",
                    "timezone": "Asia/Calcutta",
                    "routeType": "pickup",
                    "description": "pickup route for passangers",
                    "startLocation": [
                        12.423280214649,
                        90.4259860617297
                    ],
                    "endLocation": [
                        12.423280214649,
                        90.4259860617297
                    ],
                    "startTime": 122423535,
                    "endTime": 142352352323,
                    "stops": [
                        {
                            "name": "stop-1",
                            "passangers": [
                                "67bda73b9c63c26ef3adcfa7",
                                "67bda7339c63c26ef3adcfa6"
                            ],
                            "location": [
                                80.26914677686771,
                                13.026079228280414
                            ],
                            "address": "4th Trust Cross Street, Chennai, zone 9 teynampet, Tamil Nadu, India, pincode:600001",
                            "arrivalTime": "02:31 PM"
                        },
                        {
                            "name": "stop-2",
                            "passangers": [
                                "67bda7229c63c26ef3adcfa5"
                            ],
                            "location": [
                                80.26914677686771,
                                13.026079228280414
                            ],
                            "address": "4th Trust Cross Street, Chennai, zone 9 teynampet, Tamil Nadu, India, pincode:600001",
                            "arrivalTime": "02:39 PM"
                        }
                    ],
                    "days": [
                        "Sunday",
                        "Monday",
                        "Tuesday",
                        "Wednesday",
                        "Thursday",
                        "Friday",
                        "Saturday"
                    ]
                })
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
                .set('Authorization', 'Bearer ' + userToken)
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

        it('43 - Should fail using Stop as Object', (done) => {
            request(baseurl)
                .post('/user/rideGroup/addRoute')
                .send({
                    "rideGroupId": rideGroupId,
                    "name": "Test route",
                    "timezone": "Asia/Calcutta",
                    "routeType": "pickup",
                    "description": "pickup route for passangers",
                    "startLocation": [
                        12.423280214649,
                        90.4259860617297
                    ],
                    "endLocation": [
                        12.423280214649,
                        90.4259860617297
                    ],
                    "startTime": "07:50 PM",
                    "endTime": "05:55 PM",
                    "stops": {
                        "name": "stop-1",
                        "passangers": [
                            "67bda73b9c63c26ef3adcfa7",
                            "67bda7339c63c26ef3adcfa6"
                        ],
                        "location": [
                            80.26914677686771,
                            13.026079228280414
                        ],
                        "address": "4th Trust Cross Street, Chennai, zone 9 teynampet, Tamil Nadu, India, pincode:600001",
                        "arrivalTime": "02:31 PM"
                    },
                    "days": [
                        "Sunday",
                        "Monday",
                        "Tuesday",
                        "Wednesday",
                        "Thursday",
                        "Friday",
                        "Saturday"
                    ]
                })
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
                .set('Authorization', 'Bearer ' + userToken)
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

        it('44 - Should fail using non existing passanger at ride group in Stops array', (done) => {
            request(baseurl)
                .post('/user/rideGroup/addRoute')
                .send({
                    "rideGroupId": rideGroupId,
                    "name": "Test route",
                    "timezone": "Asia/Calcutta",
                    "routeType": "pickup",
                    "description": "pickup route for passangers",
                    "startLocation": [
                        12.423280214649,
                        90.4259860617297
                    ],
                    "endLocation": [
                        12.423280214649,
                        90.4259860617297
                    ],
                    "startTime": "10:33 AM",
                    "endTime": "10:33 PM",
                    "stops": [
                        {
                            "name": "stop-1",
                            "passangers": [
                                "67bda73b9c63c26ef3adcfa7",
                                "67bda7339c63c26ef3adcfa6"
                            ],
                            "location": [
                                80.26914677686771,
                                13.026079228280414
                            ],
                            "address": "4th Trust Cross Street, Chennai, zone 9 teynampet, Tamil Nadu, India, pincode:600001",
                            "arrivalTime": "02:31 PM"
                        }
                    ],
                    "days": [
                        "Sunday",
                        "Monday",
                        "Tuesday",
                        "Wednesday",
                        "Thursday",
                        "Friday",
                        "Saturday"
                    ]
                })
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
                .set('Authorization', 'Bearer ' + userToken)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(400);
                    expect(res.body.success).to.be.equal(false);
                    expect(res.body).to.have.property('message').that.equals("One or more passangers in the stops are not part of the ride group");
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

        it('45 - Should fail using on location as object in Stops array', (done) => {
            request(baseurl)
                .post('/user/rideGroup/addRoute')
                .send({
                    "rideGroupId": rideGroupId,
                    "name": "Test route",
                    "timezone": "Asia/Calcutta",
                    "routeType": "pickup",
                    "description": "pickup route for passangers",
                    "startLocation": [
                        12.423280214649,
                        90.4259860617297
                    ],
                    "endLocation": [
                        12.423280214649,
                        90.4259860617297
                    ],
                    "startTime": "07:50 PM",
                    "endTime": "05:55 PM",
                    "stops": [
                        {
                            "name": "stop-1",
                            "passangers": [
                                "67bda73b9c63c26ef3adcfa7",
                                "67bda7339c63c26ef3adcfa6"
                            ],
                            "location": {
                                "lng": 80.26914677686771,
                                "lat": 13.026079228280414
                            },
                            "address": "4th Trust Cross Street, Chennai, zone 9 teynampet, Tamil Nadu, India, pincode:600001",
                            "arrivalTime": "02:31 PM"
                        }
                    ],
                    "days": [
                        "Sunday",
                        "Monday",
                        "Tuesday",
                        "Wednesday",
                        "Thursday",
                        "Friday",
                        "Saturday"
                    ]
                })
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
                .set('Authorization', 'Bearer ' + userToken)
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
        
        it('46 - Should fail using on arrival time as ms in Stops array', (done) => {
            request(baseurl)
                .post('/user/rideGroup/addRoute')
                .send({
                    "rideGroupId": rideGroupId,
                    "name": "Test route",
                    "timezone": "Asia/Calcutta",
                    "routeType": "pickup",
                    "description": "pickup route for passangers",
                    "startLocation": [
                        12.423280214649,
                        90.4259860617297
                    ],
                    "endLocation": [
                        12.423280214649,
                        90.4259860617297
                    ],
                    "startTime": "07:50 PM",
                    "endTime": "05:55 PM",
                    "stops": [
                        {
                            "name": "stop-1",
                            "passangers": [
                                "67bda73b9c63c26ef3adcfa7",
                                "67bda7339c63c26ef3adcfa6"
                            ],
                            "location": [
                                80.26914677686771,
                                13.026079228280414
                            ],
                            "address": "4th Trust Cross Street, Chennai, zone 9 teynampet, Tamil Nadu, India, pincode:600001",
                            "arrivalTime": 574745
                        }
                    ],
                    "days": [
                        "Sunday",
                        "Monday",
                        "Tuesday",
                        "Wednesday",
                        "Thursday",
                        "Friday",
                        "Saturday"
                    ]
                })
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
                .set('Authorization', 'Bearer ' + userToken)
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

        it('47 - Should fail using invalid Days', (done) => {
            request(baseurl)
                .post('/user/rideGroup/addRoute')
                .send({
                    "rideGroupId": rideGroupId,
                    "name": "Test route",
                    "timezone": "Asia/Calcutta",
                    "routeType": "pickup",
                    "description": "pickup route for passangers",
                    "startLocation": [
                        12.423280214649,
                        90.4259860617297
                    ],
                    "endLocation": [
                        12.423280214649,
                        90.4259860617297
                    ],
                    "startTime": "07:50 PM",
                    "endTime": "05:55 PM",
                    "stops": [
                        {
                            "name": "stop-1",
                            "passangers": [
                                "67bda73b9c63c26ef3adcfa7",
                                "67bda7339c63c26ef3adcfa6"
                            ],
                            "location": [
                                80.26914677686771,
                                13.026079228280414
                            ],
                            "address": "4th Trust Cross Street, Chennai, zone 9 teynampet, Tamil Nadu, India, pincode:600001",
                            "arrivalTime": "09:49 AM"
                        }
                    ],
                    "days": [
                        "jan"
                    ]
                })
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
                .set('Authorization', 'Bearer ' + userToken)
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

        it('48 - Should Success for the Valid Data', (done) => {
            request(baseurl)
                .post('/user/rideGroup/addRoute')
                .send({
                    "rideGroupId": rideGroupId,
                    "name": "Test route",
                    "timezone": "Asia/Calcutta",
                    "routeType": "pickup",
                    "description": "pickup route for passangers",
                    "startLocation": [
                        12.423280214649,
                        90.4259860617297
                    ],
                    "endLocation": [
                        12.423280214649,
                        90.4259860617297
                    ],
                    "startTime": "07:50 PM",
                    "endTime": "05:55 PM",
                    "stops": [
                        {
                            "name": "stop-1",
                            "passangers": [
                                passanger2Id
                            ],
                            "location": [
                                80.26914677686771,
                                13.026079228280414
                            ],
                            "address": "4th Trust Cross Street, Chennai, zone 9 teynampet, Tamil Nadu, India, pincode:600001",
                            "arrivalTime": "09:49 AM"
                        }
                    ],
                    "days": [
                        "Sunday"
                    ]
                })
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
                .set('Authorization', 'Bearer ' + userToken)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(200);
                    expect(res.body.success).to.be.equal(true);
                    expect(res.body).to.have.property('message').that.equals("Route added to ride group successfully");
                    expect(res.body).to.have.property('routeId');
                    routeId = res.body.routeId
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })
    })
});