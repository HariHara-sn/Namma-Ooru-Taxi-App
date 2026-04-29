import request from 'supertest';
import { assert, expect } from 'chai';
import { firtsUserData } from './A_UserController.spec.mjs';
import { vehicleId } from './B_DeviceController.spec.mjs';

const baseurl = 'http://localhost:3000';

const userLoginCredential = {
    "email": firtsUserData.email,
    "password": firtsUserData.password
}

function generateDriverData() {
    const mobile = Math.random().toString().slice(2, 12);
    return {
        email: "driver" + mobile + "@gmail.com",
        phone: "+91" + mobile,
        gender: "male",
        username: "+91" + mobile,
        name: "Backend Test for Driver",
        password: "Qwerty@1234"
    };
}

export const driverData = generateDriverData();
export const driverData2 = generateDriverData();
export let driverId, driver2Id, user2DriverId;

driverData2["activeDeviceId"] = vehicleId;

describe('Driver Controller API Testcases', () => {
    let driverToken, driver2Token, userToken, userId;

    describe('Post - /user/login', () => {
        it('1 - User Valid login', (done) => {
            request(baseurl)
                .post('/user/login')
                .send(userLoginCredential)
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
    })

    describe('Post - /user/driver/register', () => {
        it('2 - Register driver using Invalid Password', (done) => {
            request(baseurl)
                .post('/user/driver/register')
                .send({
                    "email": driverData.email,
                    "phone": driverData.phone,
                    "name": driverData.name,
                    "password": "qwerty@1234",
                    "gender": driverData.gender,
                    "username": driverData.username,
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

        it('3 - Register driver using Invalid email', (done) => {
            request(baseurl)
                .post('/user/driver/register')
                .send({
                    "email": "driverData.email",
                    "phone": driverData.phone,
                    "name": driverData.name,
                    "password": driverData.password,
                    "gender": driverData.gender,
                    "username": driverData.username,
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

        it('4 - Register driver using Invalid phone', (done) => {
            request(baseurl)
                .post('/user/driver/register')
                .send({
                    "email": driverData.email,
                    "phone": "9999222211",
                    "name": driverData.name,
                    "password": driverData.password,
                    "gender": driverData.gender,
                    "username": driverData.username,
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

        it('5 - Register driver using empty device ID', (done) => {
            request(baseurl)
                .post('/user/driver/register')
                .send({
                    "email": driverData.email,
                    "phone": driverData.phone,
                    "name": driverData.name,
                    "password": driverData.password,
                    "gender": driverData.gender,
                    "username": driverData.username,
                    "activeDevice": ""
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

        it('6 - Register driver using invalid device ID', (done) => {
            request(baseurl)
                .post('/user/driver/register')
                .send({
                    "email": driverData.email,
                    "phone": driverData.phone,
                    "name": driverData.name,
                    "password": driverData.password,
                    "gender": driverData.gender,
                    "username": driverData.username,
                    "activeDevice": "32425"
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

        it('7 - Register driver using invalid Gender', (done) => {
            request(baseurl)
                .post('/user/driver/register')
                .send({
                    "email": driverData.email,
                    "phone": driverData.phone,
                    "name": driverData.name,
                    "password": driverData.password,
                    "gender": "driverData.gender",
                    "username": driverData.username
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

        it('8 - Register driver without username', (done) => {
            request(baseurl)
                .post('/user/driver/register')
                .send({
                    "email": driverData.email,
                    "phone": driverData.phone,
                    "name": driverData.name,
                    "password": driverData.password,
                    "gender": driverData.gender
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

        it('9 - Register driver using valid details with out Active device', (done) => {
            request(baseurl)
                .post('/user/driver/register')
                .send(driverData)
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
                .set('Authorization', 'Bearer ' + userToken)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(200);
                    expect(res.body.success).to.be.equal(true);
                    expect(res.body).to.have.property('message').that.equals("Driver created successfully");
                    expect(res.body.driverId).not.to.be.null;
                    expect(res.body.token).not.to.be.null;
                    driverToken = res.body.token;
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

        it('10 - Register user using existing registered email', (done) => {
            request(baseurl)
                .post('/user/driver/register')
                .send({
                    "email": driverData.email,
                    "phone": "+917689098177",
                    "name": "existing registered email of Backend Test",
                    "password": "Qwerty@1234",
                    "gender": "male",
                    "username": "917689098177"
                })
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
                .set('Authorization', 'Bearer ' + userToken)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(400);
                    expect(res.body.success).to.be.equal(false);
                    expect(res.body).to.have.property('message').that.equals("Driver with same email / phone / username already exists");
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

        it('11 -Register user using existing registered Phone number', (done) => {
            request(baseurl)
                .post('/user/driver/register')
                .send({
                    "email": "drivertest1@gmail.com",
                    "phone": driverData.phone,
                    "name": "existing registered email of Backend Test",
                    "password": "Qwerty@1234",
                    "gender": "male",
                    "username": "917689098179"
                })
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
                .set('Authorization', 'Bearer ' + userToken)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(400);
                    expect(res.body.success).to.be.equal(false);
                    expect(res.body).to.have.property('message').that.equals("Driver with same email / phone / username already exists");
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

        it('12 -Register user using existing registered username', (done) => {
            request(baseurl)
                .post('/user/driver/register')
                .send({
                    "email": "drivertest1@gmail.com",
                    "phone": "+917689098179",
                    "name": "existing registered email of Backend Test",
                    "password": "Qwerty@1234",
                    "gender": "male",
                    "username": driverData.username
                })
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
                .set('Authorization', 'Bearer ' + userToken)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(400);
                    expect(res.body.success).to.be.equal(false);
                    expect(res.body).to.have.property('message').that.equals("Driver with same email / phone / username already exists");
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

        it('13 - Register driver using valid details with Active device with invalid user ID', (done) => {
            request(baseurl)
                .post('/user/driver/register')
                .send(driverData2)
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
                .set('Authorization', 'Bearer ' + userToken + '2')
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(401);
                    expect(res.body.success).to.be.equal(false);
                    expect(res.body).to.have.property('error');
                    driver2Token = res.body.token;
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

        it('14 - Register driver using valid details with Active device with valid user ID', (done) => {
            request(baseurl)
                .post('/user/driver/register')
                .send(driverData2)
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
                .set('Authorization', 'Bearer ' + userToken)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(200);
                    expect(res.body.success).to.be.equal(true);
                    expect(res.body).to.have.property('message').that.equals("Driver created successfully");
                    expect(res.body).to.have.property('driverId').with.lengthOf(24);
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })
    })

    describe('Post - /user/driver/login', () => {
        it('15 - Invalid login using Wrong Password', (done) => {
            request(baseurl)
                .post('/user/driver/login')
                .send({
                    "username": driverData.username,
                    "password": "Qwertqqy@123"
                })
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(400);
                    expect(res.body.success).to.be.equal(false);
                    expect(res.body).to.have.property('message').that.equals("You have entered Invalid Password");
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

        it('16 - Invalid login using driver email', (done) => {
            request(baseurl)
                .post('/user/driver/login')
                .send({
                    "email": driverData.email,
                    "password": driverData.password
                })
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(400);
                    expect(res.body.success).to.be.equal(false);
                    expect(res.body).to.have.property('message').to.have.property('success').to.be.equal(false);
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

        it('17 - Invalid login using drver phone number', (done) => {
            request(baseurl)
                .post('/user/driver/login')
                .send({
                    "phone": driverData.phone,
                    "password": driverData.password
                })
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(400);
                    expect(res.body.success).to.be.equal(false);
                    expect(res.body).to.have.property('message').to.have.property('success').to.be.equal(false);
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

        it('18 - Valid login using username', (done) => {
            request(baseurl)
                .post('/user/driver/login')
                .send({
                    "username": driverData.username,
                    "password": driverData.password
                })
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(200);
                    expect(res.body.success).to.be.equal(true);
                    expect(res.body).to.have.property('message').that.equals("Driver Logged in");
                    expect(res.body).to.have.property('user').to.have.property('name');
                    expect(res.body).to.have.property('user').to.have.property('_id').with.lengthOf(24);
                    expect(res.body).to.have.property('user').to.have.property('token');
                    driverToken = res.body.user.token;
                    driverId = res.body.user._id;
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })
    })

    describe('Get - /user/driver/get', () => {
        it('19 - Get driver details with invalid token and valid driver id', (done) => {
            request(baseurl)
                .get('/user/driver/get?driverId=' + driverId)
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
                .set('Authorization', 'Bearer ' + userToken + 'w')
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(401);
                    expect(res.body.success).to.be.equal(false);
                    expect(res.body).to.have.property('error').to.be.equal("Unauthorized");
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

        it('20 - Get user details with valid token and invalid driver id', (done) => {
            request(baseurl)
                .get('/user/driver/get?driverId=' + driverId + '2')
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
                .set('Authorization', 'Bearer ' + userToken)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(400);
                    expect(res.body.success).to.be.equal(false);
                    expect(res.body).to.have.property("message").to.be.equal("Driver ID should be Hex decimal 24");
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

        it('21 - Get user details with valid token and valid driver id', (done) => {
            request(baseurl)
                .get('/user/driver/get?driverId=' + driverId)
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
                .set('Authorization', 'Bearer ' + userToken)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(200);
                    expect(res.body.success).to.be.equal(true);
                    expect(res.body).to.have.property("message").to.be.equal("Driver Details");
                    expect(res.body).to.have.property("driverDetails");
                    expect(res.body).to.have.property("driverDetails").to.have.property('_id');
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })
    })

    describe('Get - /user/driver/getAll', () => {
        it('20 - Get All user drivers detail with invalid token', (done) => {
            request(baseurl)
                .get('/user/driver/getAll')
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
                .set('Authorization', 'Bearer ' + userToken + 'w')
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(401);
                    expect(res.body.success).to.be.equal(false);
                    expect(res.body).to.have.property('error').to.be.equal("Unauthorized");
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

        it('21 - Get All user drivers detail with valid token', (done) => {
            request(baseurl)
                .get('/user/driver/getAll')
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
                .set('Authorization', 'Bearer ' + userToken)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(200);
                    expect(res.body.success).to.be.equal(true);
                    expect(res.body).to.have.property("message").to.be.equal("Your Drivers Details");
                    expect(res.body).to.have.property("driversDetails").that.is.an('array');
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })
    })

    describe('Get - /user/driver/update', () => {
        it('22 - Update the driver details with invalid user token', (done) => {
            request(baseurl)
                .post('/user/driver/update')
                .send({
                    "driverId": driverId,
                    "phone": "+911234567890",
                    "name": "updated driver name",
                })
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
                .set('Authorization', 'Bearer ' + userToken + 'q')
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(401);
                    expect(res.body.success).to.be.equal(false);
                    expect(res.body).to.have.property('error').to.be.equal("Unauthorized");
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

        it('23 - Update the driver details with valid user token with invalid driver ID', (done) => {
            request(baseurl)
                .post('/user/driver/update')
                .send({
                    "driverId": "driverId",
                    "phone": "+911234567890",
                    "name": "updated driver name",
                })
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
                .set('Authorization', 'Bearer ' + userToken)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(400);
                    expect(res.body.success).to.be.equal(false);
                    expect(res.body).to.have.property('message').to.be.equal("Driver ID should be Hex decimal 24");
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

        it('24 - Update the driver details with valid user token with invalid phone', (done) => {
            request(baseurl)
                .post('/user/driver/update')
                .send({
                    "driverId": driverId,
                    "phone": "+9112345678909889789798899",
                    "name": "updated driver name",
                })
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
                .set('Authorization', 'Bearer ' + userToken)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(400);
                    expect(res.body.success).to.be.equal(false);
                    expect(res.body).to.have.property('message').to.be.equal("Driver phone should be valid");
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

        it('25 - Update the driver details with valid user token with valid data', (done) => {
            request(baseurl)
                .post('/user/driver/update')
                .send({
                    "driverId": driverId,
                    "phone": "+911234567890",
                    "name": "updated driver name",
                })
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
                .set('Authorization', 'Bearer ' + userToken)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(200);
                    expect(res.body.success).to.be.equal(true);
                    expect(res.body).to.have.property('message').to.be.equal("Driver Detail Updated");
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })
    })
});