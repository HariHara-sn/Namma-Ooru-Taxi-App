import request from 'supertest';
import { assert, expect } from 'chai';
import { firtsUserData } from './A_UserController.spec.mjs';
import { vehicleId } from './B_DeviceController.spec.mjs';

const baseurl = 'http://localhost:3000';
const userLoginCredential = {
    "email": firtsUserData.email,
    "password": firtsUserData.password
}

function generatePassangerData() {
    const mobile = Math.random().toString().slice(2, 12);
    return {
        email: "passanger" + mobile + "@gmail.com",
        phone: "+91" + mobile,
        gender: "male",
        username: "+91" + mobile,
        name: "Backend Test for Passanger",
        password: "Qwerty@1234"
    };
}

export const passangerData = generatePassangerData();
export const passangerData2 = generatePassangerData();
export const passangerData3 = generatePassangerData();
export let passangerId, passanger2Id, passanger3Id;


describe('Passanger Controller API Testcases', () => {
    let passangerToken, passanger2Token, userToken, userId;

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

    describe('Post - /user/passanger/create', () => {
        it('2 - Register passanger using Invalid email', (done) => {
            request(baseurl)
                .post('/user/passanger/create')
                .send({
                    "email": "passangerData.email",
                    "phone": passangerData.phone,
                    "name": passangerData.name,
                    "gender": "male",
                    "username": passangerData.phone,
                    "password": passangerData.password
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

        it('3 - Register passanger using Invalid phone', (done) => {
            request(baseurl)
                .post('/user/passanger/create')
                .send({
                    "email": passangerData.email,
                    "phone": "9090908787",
                    "name": passangerData.name,
                    "gender": "male",
                    "username": passangerData.phone,
                    "password": passangerData.password
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

        it('4 - Register passanger using valid data and invalid user token', (done) => {
            request(baseurl)
                .post('/user/passanger/create')
                .send(passangerData)
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
                .set('Authorization', 'Bearer ' + userToken + 'q')
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

        it('5 - Register passanger using valid details', (done) => {
            request(baseurl)
                .post('/user/passanger/create')
                .send(passangerData)
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
                .set('Authorization', 'Bearer ' + userToken)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(200);
                    expect(res.body.success).to.be.equal(true);
                    expect(res.body).to.have.property('message').that.equals("Passanger created successfully");
                    expect(res.body.passangerId).not.to.be.null;
                    passangerId = res.body.passangerId;
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

        it('6 - Register user using existing registered email', (done) => {
            request(baseurl)
                .post('/user/passanger/create')
                .send({
                    "email": passangerData.email,
                    "phone": "+917689098177",
                    "name": "existing registered email of Backend Test",
                    "gender": "male",
                    "username": "kk6",
                    "password": "Qwerty@1234"
                })
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
                .set('Authorization', 'Bearer ' + userToken)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(400);
                    expect(res.body.success).to.be.equal(false);
                    expect(res.body).to.have.property('message').that.equals("Passanger with same email / phone / username already exists");
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

        it('7 - Register passanger using Invalid Password', (done) => {
            request(baseurl)
                .post('/user/passanger/create')
                .send({
                    "email": passangerData.email,
                    "phone": passangerData.phone,
                    "name": passangerData.name,
                    "gender": "male",
                    "username": passangerData.phone,
                    "password": "qwerty@1234"
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

        it('8 -Register user using existing registered Phone number', (done) => {
            request(baseurl)
                .post('/user/passanger/create')
                .send({
                    "email": "passangertest1@gmail.com",
                    "phone": passangerData.phone,
                    "name": "existing registered email of Backend Test",
                    "gender": "male",
                    "username": "kk6",
                    "password": "Qwerty@1234"
                })
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
                .set('Authorization', 'Bearer ' + userToken)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(400);
                    expect(res.body.success).to.be.equal(false);
                    expect(res.body).to.have.property('message').that.equals("Passanger with same email / phone / username already exists");
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })
    })

    describe('Post - /user/passanger/bulkCreate', () => {

        it('9 - Register bulk passangers using Invalid Passwords', (done) => {
            request(baseurl)
                .post('/user/passanger/bulkCreate')
                .send([{
                    "email": passangerData.email,
                    "phone": passangerData.phone,
                    "name": passangerData.name,
                    "gender": "male",
                    "username": passangerData.phone,
                    "password": "qwertaya1234"
                },
                {
                    "email": passangerData.email,
                    "phone": passangerData.phone,
                    "name": passangerData.name,
                    "gender": "male",
                    "username": passangerData.phone,
                    "password": "qwertaya1234"
                }])
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
                .set('Authorization', 'Bearer ' + userToken)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(400);
                    expect(res.body.success).to.be.equal(false);
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

        it('10 - Register passanger using Invalid emails', (done) => {
            request(baseurl)
                .post('/user/passanger/bulkCreate')
                .send([{
                    "email": "passangerData.email",
                    "phone": passangerData.phone,
                    "name": passangerData.name,
                    "gender": "male",
                    "username": passangerData.phone,
                    "password": passangerData.password
                },
                {
                    "email": "passangerData.email",
                    "phone": passangerData.phone,
                    "name": passangerData.name,
                    "gender": "male",
                    "username": passangerData.phone,
                    "password": "qwertaya1234"
                }])
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
                .set('Authorization', 'Bearer ' + userToken)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(400);
                    expect(res.body.success).to.be.equal(false);
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

        it('11 - Register passanger using Invalid phone', (done) => {
            request(baseurl)
                .post('/user/passanger/bulkCreate')
                .send([{
                    "email": passangerData.email,
                    "phone": "passangerData.phone",
                    "name": passangerData.name,
                    "gender": "male",
                    "username": passangerData.phone,
                    "password": passangerData.password
                },
                {
                    "email": passangerData.email,
                    "phone": "passangerData.phone",
                    "name": passangerData.name,
                    "gender": "male",
                    "username": passangerData.phone,
                    "password": "qwertaya1234"
                }])
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
                .set('Authorization', 'Bearer ' + userToken)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(400);
                    expect(res.body.success).to.be.equal(false);
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

        it('12 - Register passanger using valid data and invalid user token', (done) => {
            request(baseurl)
                .post('/user/passanger/bulkCreate')
                .send([passangerData2])
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
                .set('Authorization', 'Bearer ' + userToken + 'q')
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

        it('13 - Register passangers with some existing passenger data and new passenger data', (done) => {
            request(baseurl)
                .post('/user/passanger/bulkCreate')
                .send([ passangerData, passangerData2])
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
                .set('Authorization', 'Bearer ' + userToken)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(200);
                    expect(res.body.success).to.be.equal(true);
                    expect(res.body).to.have.property('existing');
                    expect(res.body).to.have.property('existing').to.have.property('emails').that.is.an('array').with.lengthOf.greaterThan(0);
                    expect(res.body).to.have.property('existing').to.have.property('phones').that.is.an('array').with.lengthOf.greaterThan(0);
                    expect(res.body).to.have.property('existing').to.have.property('usernames').that.is.an('array').with.lengthOf.greaterThan(0);
                    expect(res.body).to.have.property('createdPassangers').to.have.property('0');
                    expect(res.body).to.have.property('message').that.equals('Passanger created successfully');
                    passanger2Id = res.body.createdPassangers['0']
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

        it('14 - Register passangers with only new passenger data', (done) => {
            request(baseurl)
                .post('/user/passanger/bulkCreate')
                .send([ passangerData3 ])
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
                .set('Authorization', 'Bearer ' + userToken)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(200);
                    expect(res.body.success).to.be.equal(true);
                    expect(res.body).to.have.property('existing');
                    expect(res.body).to.have.property('existing').to.have.property('emails').that.is.an('array').with.lengthOf(0);
                    expect(res.body).to.have.property('existing').to.have.property('phones').that.is.an('array').with.lengthOf(0);
                    expect(res.body).to.have.property('existing').to.have.property('usernames').that.is.an('array').with.lengthOf(0);
                    expect(res.body).to.have.property('createdPassangers').to.have.property('0');
                    expect(res.body).to.have.property('message').that.equals('Passanger created successfully');
                    passanger3Id = res.body.createdPassangers['0']
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })
        
    })

    describe('Post - /user/passanger/update', () => {

        it('15 - update the passanger details with invalid user token', (done) => {
            request(baseurl)
                .post('/user/passanger/update')
                .send({
                    "passangerId": passangerId,
                    "name": "updated passanger",
                    "phone": "+919286527378"
                })
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
                .set('Authorization', 'Bearer ' + userToken + 'q')
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

        it('16 - update the passanger details with out passanger ID', (done) => {
            request(baseurl)
                .post('/user/passanger/update')
                .send({
                    "name": "updated passanger",
                    "phone": "+919286527378"
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

        it('17 - update the passanger details with invalid phone', (done) => {
            request(baseurl)
                .post('/user/passanger/update')
                .send({
                    "passangerId": passangerId,
                    "name": "updated passanger",
                    "phone": "919286527378"
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

        it('18 - update the passanger details with empty phone', (done) => {
            request(baseurl)
                .post('/user/passanger/update')
                .send({
                    "passangerId": passangerId,
                    "name": "updated passanger",
                    "phone": ""
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

        it('19 - update the passanger details with empty name', (done) => {
            request(baseurl)
                .post('/user/passanger/update')
                .send({
                    "passangerId": passangerId,
                    "name": "",
                    "phone": "+918889992323"
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

        it('20 - update the passanger valid details', (done) => {
            request(baseurl)
                .post('/user/passanger/update')
                .send({
                    "passangerId": passangerId,
                    "name": "updated passanger name"
                })
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
                .set('Authorization', 'Bearer ' + userToken)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(200);
                    expect(res.body.success).to.be.equal(true);
                    expect(res.body).to.have.property('message').that.equals("Passanger updated successfully");
                    expect(res.body).to.have.property('passangerId').with.lengthOf(24);
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

    })

    describe('Get - /user/passanger/getAll', () => {

        it('21 - Get All user passanger detail with invalid token', (done) => {
            request(baseurl)
                .get('/user/passanger/getAll')
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

        it('22 - Get All user passanger detail with valid token', (done) => {
            request(baseurl)
                .get('/user/passanger/getAll')
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
                .set('Authorization', 'Bearer ' + userToken)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(200);
                    expect(res.body.success).to.be.equal(true);
                    expect(res.body).to.have.property("message").to.be.equal("Your Passanger Details");
                    expect(res.body).to.have.property("passangersDetails");
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })
    
    })

    describe('Post - /user/passanger/login', () => {

        it('23 - Invalid login using Wrong Password', (done) => {
            request(baseurl)
                .post('/user/passanger/login')
                .send({
                    "username": passangerData.username,
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
        
        it('24 - Invalid login using non existing username', (done) => {
            request(baseurl)
                .post('/user/passanger/login')
                .send({
                    "username": "non username",
                    "password": passangerData.password
                })
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(400);
                    expect(res.body.success).to.be.equal(false);
                    expect(res.body).to.have.property('message').that.equals("Passanger does not exists");
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

        it('25 - Valid login using username', (done) => {
            request(baseurl)
                .post('/user/passanger/login')
                .send({
                    "username": passangerData.username,
                    "password": passangerData.password
                })
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(200);
                    expect(res.body.success).to.be.equal(true);
                    expect(res.body).to.have.property('message').that.equals("Passanger Logged in");
                    expect(res.body).to.have.property('user').to.have.property('name');
                    expect(res.body).to.have.property('user').to.have.property('_id').with.lengthOf(24);
                    expect(res.body).to.have.property('user').to.have.property('token');
                    passangerToken = res.body.user.token;
                    passangerId = res.body.user._id;
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

    })
    
    describe('Post - /user/passanger/getPassangers', () => {

        it('26 - Get passangers detail with invalid token', (done) => {
            request(baseurl)
                .post('/user/passanger/getPassangers')
                .send({
                    "passangerIds": [passangerId]
                })
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
                .set('Authorization', 'Bearer ' + userToken + 'w')
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

        it('27 - Get All passangers detail with valid token', (done) => {
            request(baseurl)
                .post('/user/passanger/getPassangers')
                .send({
                    "passangerIds": [passangerId]
                })
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
                .set('Authorization', 'Bearer ' + userToken)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(200);
                    expect(res.body.success).to.be.equal(true);
                    expect(res.body).to.have.property("passangersDetails").that.is.an('array');
                    expect(res.body).to.have.property('message').that.equals("Your Passanger Details");
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })
    
    })

    describe('Delete - /user/passanger/delete', () => {

        it('28 - delete passanger with invalid user token', (done) => {
            request(baseurl)
                .post('/user/passanger/delete?passangerId=' + passangerId)
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
                .set('Authorization', 'Bearer ' + userToken + 'q')
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

        it('29 - delete passanger with valid user token and empty passanger id', (done) => {
            request(baseurl)
                .post('/user/passanger/delete?passangerId=')
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
                .set('Authorization', 'Bearer ' + userToken)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(400);
                    expect(res.body.success).to.be.equal(false);
                    expect(res.body).to.have.property('message').that.equals('Passanger id is required');
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

        it('30 - delete passanger with valid user token and invalid passanger id', (done) => {
            request(baseurl)
                .post('/user/passanger/delete?passangerId=' + passangerId + '1')
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
                .set('Authorization', 'Bearer ' + userToken)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(400);
                    expect(res.body.success).to.be.equal(false);
                    expect(res.body).to.have.property('message').that.equals('Passanger ID should be Hex decimal 24');
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

        it('31 - delete passanger with valid user token and passanger id', (done) => {
            request(baseurl)
                .post('/user/passanger/delete?passangerId=' + passangerId)
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
                .set('Authorization', 'Bearer ' + userToken)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(200);
                    expect(res.body.success).to.be.equal(true);
                    expect(res.body).to.have.property('message').that.equals('Passanger deleted successfully');
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

    })

});