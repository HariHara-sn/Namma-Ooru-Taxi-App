import request from 'supertest';
import { assert, expect } from 'chai';
import {firtsUserData, thirdUserData, secondUserData} from './A_UserController.spec.mjs';

const baseurl = 'http://localhost:3000';

function generateUserData() {
    const mobile = Math.random().toString().slice(2, 12);
    return {
        email: "backendTestAdmin" + mobile + "@gmail.com",
        phone: "+91" + mobile,
        name: "Admin Backend Test Admin",
        password: "Qwerty@1234",
        role: "admin"
    };
}

export const adminData = generateUserData();

describe('Admin Controller API Testcases', () => {
    let token, userToken;

    // describe('Post - /admin/registerAdmin', () => {
    //     it('1 - Register admin using Invalid Password', (done) => {
    //         request(baseurl)
    //             .post('/admin/registerAdmin')
    //             .send({
    //                 "email": "backendtestadmin@gmail.com",
    //                 "phone": "+917689098176",
    //                 "name": "Backend Test Admin",
    //                 "password": "qwerty",
    //                 "role": "admin"
    //             })
    //             .end(function(err, res) {
    //                 expect(res.statusCode).to.be.equal(400);
    //                 expect(res.body.success).to.be.equal(false);
    //                 expect(res.body).to.have.property('message').to.have.property('error');
    //                 if (err) {
    //                     throw err;
    //                 }
    //                 done();
    //             });
    //     })

    //     it('2 - Register admin using Invalid email', (done) => {
    //         request(baseurl)
    //             .post('/admin/registerAdmin')
    //             .send({
    //                 "email": "backendtestadmingmail.com",
    //                 "phone": "+917689098176",
    //                 "name": "Backend Test Admin",
    //                 "password": "Qwerty@1234",
    //                 "role": "admin"
    //             })
    //             .end(function(err, res) {
    //                 expect(res.statusCode).to.be.equal(400);
    //                 expect(res.body.success).to.be.equal(false);
    //                 expect(res.body).to.have.property('message').to.have.property('error');
    //                 if (err) {
    //                     throw err;
    //                 }
    //                 done();
    //             });
    //     })

    //     it('3 - Register admin using Invalid role', (done) => {
    //         request(baseurl)
    //             .post('/admin/registerAdmin')
    //             .send({
    //                 "email": "backendtestadmin10@gmail.com",
    //                 "phone": "+917689098176",
    //                 "name": "Backend Test Admin",
    //                 "password": "Qwerty@1234",
    //                 "role": "worker"
    //             })
    //             .end(function(err, res) {
    //                 expect(res.statusCode).to.be.equal(400);
    //                 expect(res.body.success).to.be.equal(false);
    //                 expect(res.body).to.have.property('message').to.have.property('error');
    //                 if (err) {
    //                     throw err;
    //                 }
    //                 done();
    //             });
    //     })

    //     it('4 - Register admin using empty name', (done) => {
    //         request(baseurl)
    //             .post('/admin/registerAdmin')
    //             .send({
    //                 "email": "backendtestadmin10@gmail.com",
    //                 "phone": "+917689098176",
    //                 "name": "",
    //                 "password": "Qwerty@1234",
    //                 "role": "admin"
    //             })
    //             .end(function(err, res) {
    //                 expect(res.statusCode).to.be.equal(400);
    //                 expect(res.body.success).to.be.equal(false);
    //                 expect(res.body).to.have.property('message').to.have.property('error');
    //                 if (err) {
    //                     throw err;
    //                 }
    //                 done();
    //             });
    //     })

    //     it('5 - Register admin using valid details', (done) => {
    //         request(baseurl)
    //             .post('/admin/registerAdmin')
    //             .send(adminData)
    //             .end(function(err, res) {
    //                 expect(res.statusCode).to.be.equal(200);
    //                 expect(res.body.success).to.be.equal(true);
    //                 expect(res.body).to.have.property('message').that.equals("Admin added");
    //                 expect(res.body.adminId).not.to.be.null;
    //                 expect(res.body.token).not.to.be.null;
    //                 token = res.body.token;
    //                 if (err) {
    //                     throw err;
    //                 }
    //                 done();
    //             });
    //     })

    //     it('6 - Register admin using existing registered email', (done) => {
    //         request(baseurl)
    //             .post('/admin/registerAdmin')
    //             .send({
    //                 "email": adminData.email,
    //                 "phone": "+917689098177",
    //                 "name": "Backend Test Admin",
    //                 "password": "Qwerty@1234",
    //                 "role": "admin"
    //             })
    //             .end(function(err, res) {
    //                 expect(res.statusCode).to.be.equal(400);
    //                 expect(res.body.success).to.be.equal(false);
    //                 expect(res.body).to.have.property('message').that.equals("Admin mobile or email already exists");
    //                 if (err) {
    //                     throw err;
    //                 }
    //                 done();
    //             });
    //     })

    //     it('7 -Register admin using existing registered Phone number', (done) => {
    //         request(baseurl)
    //             .post('/admin/registerAdmin')
    //             .send({
    //                 "email": "backendtestadmin1@gmail.com",
    //                 "phone": adminData.phone,
    //                 "name": "Backend Test Admin",
    //                 "password": "Qwerty@1234",
    //                 "role": "admin"
    //             })
    //             .end(function(err, res) {
    //                 expect(res.statusCode).to.be.equal(400);
    //                 expect(res.body.success).to.be.equal(false);
    //                 expect(res.body).to.have.property('message').that.equals("Admin mobile or email already exists");
    //                 if (err) {
    //                     throw err;
    //                 }
    //                 done();
    //             });
    //     })   
    // })

    /* we don't have any route to create Admin, bit had API. 
    Hence, Please create a admin with role: "admin", isAdmin: true in any user to act as admin.
    then, place the credential in the admin login test cases*/

    describe('Post - /user/login', () => {
        it('1 - User login for the testing Admin Controller api', (done) => {
            request(baseurl)
                .post('/user/login')
                .send({
                    "email": firtsUserData.email,
                    "password": firtsUserData.password
                })
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(200);
                    expect(res.body.success).to.be.equal(true);
                    expect(res.body).to.have.property('message').that.equals("Logged in");
                    expect(res.body).to.have.property('user').to.have.property('name');
                    expect(res.body).to.have.property('user').to.have.property('_id').with.lengthOf(24);
                    expect(res.body).to.have.property('user').to.have.property('token').with.lengthOf(183);
                    userToken = res.body.user.token;
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })
    })
    
    describe('Post - /admin/adminLogin', () => {
        it('2 - Invalid login using Wrong Password', (done) => {
            request(baseurl)
                .post('/admin/adminLogin')
                .send({
                    "email": "user@gmail.com",
                    "password": "222222"
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

        it('3 - Invalid login using non existing admin email', (done) => {
            request(baseurl)
                .post('/admin/adminLogin')
                .send({
                    "email": "nonexistingemail@gmail.com",
                    "password": "Qwerty@123"
                })
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(400);
                    expect(res.body.success).to.be.equal(false);
                    expect(res.body).to.have.property('message').that.equals("Admin does not exists");
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

        it('4 - Invalid login using existing User email', (done) => {
            request(baseurl)
                .post('/admin/adminLogin')
                .send({
                    "email": firtsUserData.email,
                    "password": firtsUserData.password
                })
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(400);
                    expect(res.body.success).to.be.equal(false);
                    expect(res.body).to.have.property('message').that.equals("Admin does not exists");
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })
        
        it('5 - Invalid login using undefined value in fcmToken object', (done) => {
            request(baseurl)
                .post('/admin/adminLogin')
                .send({
                    "email": "invalidEmail@gmail.com",
                    "password": adminData.password,
                    "fcmToken": {
                        "deviceImei": "3d1435ed96953828",
                        "token": undefined
                    },
                })
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(400);
                    expect(res.body.success).to.be.equal(false);
                    expect(res.body).to.have.property('message').to.have.property('error');
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

        it('6 - Valid login', (done) => {
            request(baseurl)
                .post('/admin/adminLogin')
                .send({
                    "email": "user@gmail.com",
                    "password": "Qwerty@1234"
                })
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(200);
                    expect(res.body.success).to.be.equal(true);
                    expect(res.body).to.have.property('message').that.equals("Admin Logged in");
                    expect(res.body).to.have.property('admin').to.have.property('adminName');
                    expect(res.body).to.have.property('admin').to.have.property('role');
                    expect(res.body).to.have.property('admin').to.have.property('_id').with.lengthOf(24);
                    expect(res.body).to.have.property('admin').to.have.property('token').with.lengthOf(184);
                    token = res.body.admin.token;
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })
    })

    describe('Get - /admin/devices/getAllDevices', () => {
        it('7 - Get All devices details with invalid token', (done) => {
            request(baseurl)
                .get('/admin/devices/getAllDevices?type=vehicle&startDate=1724092201&endDate=1755628201')
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
                .set('Authorization', 'Bearer ' + token + '3')
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
        
        it('8 - Get All devices details with non existence Admin', (done) => {
            request(baseurl)
                .get('/admin/devices/getAllDevices?type=vehicle&startDate=1724092201&endDate=1755628201')
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
                .set('Authorization', 'Bearer ' + userToken)
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

        it('9 - Get All devices details with valid data', (done) => {
            request(baseurl)
                .get('/admin/devices/getAllDevices')
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
                .set('Authorization', 'Bearer ' + token)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(200);
                    expect(res.body.success).to.be.equal(true);
                    expect(res.body).to.have.property('adminId').with.lengthOf(24);
                    expect(res.body).to.have.property('message').to.be.equal("All Devices Were Retrived From DB");
                    expect(res.body).to.have.property('devices').that.is.an('array');
                    expect(res.body).to.have.property('pagination');
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

        it('10 - Get All devices details with type filter', (done) => {
            request(baseurl)
                .get('/admin/devices/getAllDevices?type=vehicle')
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
                .set('Authorization', 'Bearer ' + token)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(200);
                    expect(res.body.success).to.be.equal(true);
                    expect(res.body).to.have.property('adminId').with.lengthOf(24);
                    expect(res.body).to.have.property('message').to.be.equal("All Devices Were Retrived From DB");
                    expect(res.body).to.have.property('devices').that.is.an('array');
                    expect(res.body).to.have.property('pagination');
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

        it('11 - Get All devices details with Start and End date filter', (done) => {
            request(baseurl)
                .get('/admin/devices/getAllDevices?startDate=1724092201&endDate=1755628201')
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
                .set('Authorization', 'Bearer ' + token)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(200);
                    expect(res.body.success).to.be.equal(true);
                    expect(res.body).to.have.property('adminId').with.lengthOf(24);
                    expect(res.body).to.have.property('message').to.be.equal("All Devices Were Retrived From DB");
                    expect(res.body).to.have.property('devices').that.is.an('array');
                    expect(res.body).to.have.property('pagination');
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

        it('12 - Get All devices details with either start / end date filter', (done) => {
            request(baseurl)
                .get('/admin/devices/getAllDevices?endDate=1755628201')
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
                .set('Authorization', 'Bearer ' + token)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(200);
                    expect(res.body.success).to.be.equal(true);
                    expect(res.body).to.have.property('adminId').with.lengthOf(24);
                    expect(res.body).to.have.property('message').to.be.equal("All Devices Were Retrived From DB");
                    expect(res.body).to.have.property('devices').that.is.an('array');
                    expect(res.body).to.have.property('pagination');
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

        it('13 - Get All devices details with invalid type filter', (done) => {
            request(baseurl)
                .get('/admin/devices/getAllDevices?type=rocket')
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
                .set('Authorization', 'Bearer ' + token)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(400);
                    expect(res.body.success).to.be.equal(false);
                    expect(res.body).to.have.property('message').to.be.equal("Type must be either Mobile, Valid Vehicle type, or Asset");
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })
    })

    describe('Get - /admin/users/getAllUsers', () => {

        it('14 - Get All users details with invalid token', (done) => {
            request(baseurl)
                .get('/admin/users/getAllUsers?minDevices=1&maxDevices=10&startDate=1724092201&endDate=1755628201')
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
                .set('Authorization', 'Bearer ' + token + '3')
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

        it('15 - Get All user details with non existence Admin', (done) => {
            request(baseurl)
                .get('/admin/users/getAllUsers?minDevices=1&maxDevices=10&startDate=1724092201&endDate=1755628201')
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
                .set('Authorization', 'Bearer ' + userToken)
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

        it('16 - Get all user details with valid data', (done) => {
            request(baseurl)
                .get('/admin/users/getAllUsers?minDevices=1&maxDevices=10&startDate=1724092201&endDate=1755628201')
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
                .set('Authorization', 'Bearer ' + token)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(200);
                    expect(res.body.success).to.be.equal(true);
                    expect(res.body).to.have.property('adminId').with.lengthOf(24);
                    expect(res.body).to.have.property("message").to.be.equal("All Users Were Retrived From DB");
                    expect(res.body).to.have.property('users').that.is.an('array');
                    expect(res.body).to.have.property('pagination');
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

        it('17 - Get all user details with Start and End date filter', (done) => {
            request(baseurl)
                .get('/admin/users/getAllUsers?startDate=1724092201&endDate=1755628201')
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
                .set('Authorization', 'Bearer ' + token)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(200);
                    expect(res.body.success).to.be.equal(true);
                    expect(res.body).to.have.property('adminId').with.lengthOf(24);
                    expect(res.body).to.have.property("message").to.be.equal("All Users Were Retrived From DB");
                    expect(res.body).to.have.property('users').that.is.an('array');
                    expect(res.body).to.have.property('pagination');
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

        it('18 - Get all user details with no of devices filter', (done) => {
            request(baseurl)
                .get('/admin/users/getAllUsers?minDevices=1&maxDevices=10')
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
                .set('Authorization', 'Bearer ' + token)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(200);
                    expect(res.body.success).to.be.equal(true);
                    expect(res.body).to.have.property('adminId').with.lengthOf(24);
                    expect(res.body).to.have.property("message").to.be.equal("All Users Were Retrived From DB");
                    expect(res.body).to.have.property('users').that.is.an('array');
                    expect(res.body).to.have.property('pagination');
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

        it('19 - Get all user details with only min no of devices', (done) => {
            request(baseurl)
                .get('/admin/users/getAllUsers?minDevices=1')
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
                .set('Authorization', 'Bearer ' + token)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(200);
                    expect(res.body.success).to.be.equal(true);
                    expect(res.body).to.have.property('adminId').with.lengthOf(24);
                    expect(res.body).to.have.property("message").to.be.equal("All Users Were Retrived From DB");
                    expect(res.body).to.have.property('users').that.is.an('array');
                    expect(res.body).to.have.property('pagination');
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

        it('20 - Get all user details with only max no of devices', (done) => {
            request(baseurl)
                .get('/admin/users/getAllUsers?maxDevices=1')
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
                .set('Authorization', 'Bearer ' + token)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(200);
                    expect(res.body.success).to.be.equal(true);
                    expect(res.body).to.have.property('adminId').with.lengthOf(24);
                    expect(res.body).to.have.property("message").to.be.equal("All Users Were Retrived From DB");
                    expect(res.body).to.have.property('users').that.is.an('array');
                    expect(res.body).to.have.property('pagination');
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

        it('21 - Get all user details with only eithier start or end date', (done) => {
            request(baseurl)
                .get('/admin/users/getAllUsers?startDate=1724092201')
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
                .set('Authorization', 'Bearer ' + token)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(200);
                    expect(res.body.success).to.be.equal(true);
                    expect(res.body).to.have.property("message").to.be.equal("All Users Were Retrived From DB");
                    expect(res.body).to.have.property('users').that.is.an('array');
                    expect(res.body).to.have.property('pagination');
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })
    })
});