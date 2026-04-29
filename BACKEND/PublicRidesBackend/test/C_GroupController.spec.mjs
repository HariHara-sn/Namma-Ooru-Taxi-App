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

const newVehicle = {
    "imei": Math.random().toString().slice(2, 17),
    "name": "Test Vehicle for GVC " + Math.random().toString().slice(2, 12),
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

let token, userId, vehicleId, mobileId, geofenceId, groupId;
let secondGroupId, secondUserToken, secondUserId, secondUserMobileId, thirdUserToken, thirdUserId;

describe('Group Controller API Testcases', () => {

    describe('Post - /user/login', () => {

        it('1 - /user/login - Valid login of first user', (done) => {
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

        it('2  - /user/login - Valid login of seconf user', (done) => {
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

        it('3  - /user/login - Valid login of third user', (done) => {
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

        it('4 - Add a GPS Device for first user using valid vehicle details for the "Group controller"', (done) => {
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

        it('5 - Add a GPS Device for first user using valid Mobile details for the "Group controller"', (done) => {
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

        it('6 - Add a GPS Device for second user using valid Mobile details for the "Group controller"', (done) => {
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

    })

    describe('Post - /user/group/create', () => {

        it('7 - Create a Group for testing the api', (done) => {
            request(baseurl)
                .post('/user/group/create')
                .send({
                    "name": "Test group of GVC",
                    "description": "for group controller",
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
                    groupId = res.body.groupId
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

        it('8 - Create a Group valid without devices and users', (done) => {
            request(baseurl)
                .post('/user/group/create')
                .send({
                    "name": "second group",
                    "description": "without devices and users"
                })
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
                .set('Authorization', 'Bearer ' + token)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(200);
                    expect(res.body.success).to.be.equal(true);
                    expect(res.body).to.have.property('message').that.equals("Group Created with owned devices");
                    expect(res.body).to.have.property('groupId').with.lengthOf(24);
                    expect(res.body).to.have.property('groupadminId').with.lengthOf(24);
                    secondGroupId = res.body.groupId
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

        it('9 - Create a Group with already available group name', (done) => {
            request(baseurl)
                .post('/user/group/create')
                .send({
                    "name": "second group",
                    "description": "without devices and users"
                })
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
                .set('Authorization', 'Bearer ' + token)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(400);
                    expect(res.body.success).to.be.equal(false);
                    expect(res.body).to.have.property('message').that.equals("Group with the same name already exists");
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

        it('10 - Create a Group details with empty name and desc', (done) => {
            request(baseurl)
                .post('/user/group/create')
                .send({
                    "name": "",
                    "description": ""
                })
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
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

        it('11 - Create a Group for with other owner devices', (done) => {
            request(baseurl)
                .post('/user/group/create')
                .send({
                    "name": "test group for others owned devices",
                    "description": "Create a Group for with other owner devices",
                    "devices": [{
                        "deviceId": secondUserMobileId
                    }]
                })
                .set('Authorization', 'Bearer ' + token)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(400);
                    expect(res.body.success).to.be.equal(false);
                    expect(res.body).to.have.property('message').that.equals("User does not have ownership of these devices");
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

    })

    describe('Post - /user/group/update', () => {

        it('12 - Update a group with vaild data', (done) => {
            request(baseurl)
                .post('/user/group/update')
                .send({
                    "name": "Changed 1st group name",
                    "groupId": groupId,
                    "description": "Changed tested group"
                })
                .set('Authorization', 'Bearer ' + token)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(200);
                    expect(res.body.success).to.be.equal(true);
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

        it('13 - Update a group details with invalid data', (done) => {
            request(baseurl)
                .post('/user/group/update')
                .send({
                    "name": "",
                    "groupId": groupId,
                    "description": "tested group"
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

        it('14 - Update a group details empty group ID', (done) => {
            request(baseurl)
                .post('/user/group/update')
                .send({
                    "name": "tested update Group",
                    "groupId": "",
                    "description": "tested group"
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

        it('15 - Update a group details non existing group ID', (done) => {
            request(baseurl)
                .post('/user/group/update')
                .send({
                    "name": "tested update Group",
                    "groupId": userId, //userid act as an invalid group id
                    "description": "tested group"
                })
                .set('Authorization', 'Bearer ' + token)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(400);
                    expect(res.body.success).to.be.equal(false);
                    expect(res.body).to.have.property('message').that.equals("Group does not exist");
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

    })

    describe('Post - /user/group/addUser', () => {

        it('16 - /user/group/addUser - add non register user ID to the group', (done) => {
            request(baseurl)
                .post('/user/group/addUser')
                .send({
                    "groupId": secondGroupId,
                    "userId": secondGroupId, //groupid act as an user id
                    "role": "viewer"
                })
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
                .set('Authorization', 'Bearer ' + token)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(400);
                    expect(res.body.success).to.be.equal(false);
                    expect(res.body).to.have.property('message').that.equals("User does not exist");
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

        it('17 - /user/group/addUser - add user with wrong role to the group', (done) => {
            request(baseurl)
                .post('/user/group/addUser')
                .send({
                    "groupId": secondGroupId,
                    "userId": secondUserId,
                    "role": "modifier"
                })
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
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

        it('18 - /user/group/addUser - add user to the group using valid data for accept', (done) => {
            request(baseurl)
                .post('/user/group/addUser')
                .send({
                    "groupId": secondGroupId,
                    "userId": secondUserId,
                    "role": "viewer"
                })
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
                .set('Authorization', 'Bearer ' + token)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(200);
                    expect(res.body.success).to.be.equal(true);
                    expect(res.body).to.have.property('userId').with.lengthOf(24);
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

        it('19- /user/group/addUser - add user with existing member to the group', (done) => {
            request(baseurl)
                .post('/user/group/addUser')
                .send({
                    "groupId": secondGroupId,
                    "userId": secondUserId,
                    "role": "viewer"
                })
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
                .set('Authorization', 'Bearer ' + token)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(400);
                    expect(res.body.success).to.be.equal(false);
                    expect(res.body).to.have.property('message').that.equals("User already in group");
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })  

        it('20 - /user/group/addUser - add user to the group using valid data for reject', (done) => {
            request(baseurl)
                .post('/user/group/addUser')
                .send({
                    "groupId": secondGroupId,
                    "userId": thirdUserId,
                    "role": "viewer"
                })
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
                .set('Authorization', 'Bearer ' + token)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(200);
                    expect(res.body.success).to.be.equal(true);
                    expect(res.body).to.have.property('userId').with.lengthOf(24);
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

    })

    describe('Post - /user/group/acceptRequest', () => {
        
        it('20 - accept the group request with non existing grpup', (done) => {
            request(baseurl)
                .post('/user/group/acceptRequest')
                .send({
                    "groupId": userId //user id act as an group id
                })
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
                .set('Authorization', 'Bearer ' + secondUserToken)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(400);
                    expect(res.body.success).to.be.equal(false);
                    expect(res.body).to.have.property('message').that.equals("Group does not exist");
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

        it('21 - accept the group request with empty group id', (done) => {
            request(baseurl)
                .post('/user/group/acceptRequest')
                .send({
                    "groupId": ""
                })
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
                .set('Authorization', 'Bearer ' + secondUserToken)
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

        it('22 - accept the group request with valid data', (done) => {
            request(baseurl)
                .post('/user/group/acceptRequest')
                .send({
                    "groupId": secondGroupId
                })
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
                .set('Authorization', 'Bearer ' + secondUserToken)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(200);
                    expect(res.body.success).to.be.equal(true);
                    expect(res.body).to.have.property('userId').with.lengthOf(24);
                    expect(res.body).to.have.property('groupId').with.lengthOf(24);
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

    })

    describe('Post - /user/group/rejectRequest', () => {

        it('23 - reject the group request with non existing grpup', (done) => {
            request(baseurl)
                .post('/user/group/rejectRequest')
                .send({
                    "groupId": userId //user id act as an group id
                })
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
                .set('Authorization', 'Bearer ' + token)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(400);
                    expect(res.body.success).to.be.equal(false);
                    expect(res.body).to.have.property('message').that.equals("Group does not exist");
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

        it('24 - reject the group request with empty group id', (done) => {
            request(baseurl)
                .post('/user/group/rejectRequest')
                .send({
                    "groupId": ""
                })
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
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

        it('25 - reject the group request correct data', (done) => {
            request(baseurl)
                .post('/user/group/rejectRequest')
                .send({
                    "groupId": secondGroupId
                })
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
                .set('Authorization', 'Bearer ' + thirdUserToken)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(200);
                    expect(res.body.success).to.be.equal(true);
                    expect(res.body).to.have.property('message').that.equals("Group Request Rejected");
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })
    
    })

    describe('Post - /user/group/addUser', () => {

        it('26 - add user to the group using valid data for leavegroup api', (done) => {
            request(baseurl)
                .post('/user/group/addUser')
                .send({
                    "groupId": secondGroupId,
                    "userId": thirdUserId,
                    "role": "viewer"
                })
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
                .set('Authorization', 'Bearer ' + token)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(200);
                    expect(res.body.success).to.be.equal(true);
                    expect(res.body).to.have.property('userId').with.lengthOf(24);
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })
        
        it('27 - accept the group request with valid data for leavegroup api', (done) => {
            request(baseurl)
                .post('/user/group/acceptRequest')
                .send({
                    "groupId": secondGroupId
                })
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
                .set('Authorization', 'Bearer ' + thirdUserToken)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(200);
                    expect(res.body.success).to.be.equal(true);
                    expect(res.body).to.have.property('userId').with.lengthOf(24);
                    expect(res.body).to.have.property('groupId').with.lengthOf(24);
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

        it('28 - leave the group request with empty group id', (done) => {
            request(baseurl)
                .post('/user/group//leaveGroup?groupId=')
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
                .set('Authorization', 'Bearer ' + thirdUserToken)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(400);
                    expect(res.body.success).to.be.equal(false);
                    expect(res.body).to.have.property('message').that.equals("Group ID is required");
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

        it('29 - leave the group request with non existing group id', (done) => {
            request(baseurl)
                .post('/user/group//leaveGroup?groupId=' + userId) //user id acta as an group id
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
                .set('Authorization', 'Bearer ' + thirdUserToken)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(400);
                    expect(res.body.success).to.be.equal(false);
                    expect(res.body).to.have.property('message').that.equals("Group does not exist");
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

        it('30 - admin leave the group request', (done) => {
            request(baseurl)
                .post('/user/group/leaveGroup?groupId=' + secondGroupId)
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
                .set('Authorization', 'Bearer ' + token)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(400);
                    expect(res.body.success).to.be.equal(false);
                    expect(res.body).to.have.property('message').that.equals("Admin cannot leave the group");
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

        it('31 - leave the group request with correct data', (done) => {
            request(baseurl)
                .post('/user/group/leaveGroup?groupId=' + secondGroupId)
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
                .set('Authorization', 'Bearer ' + thirdUserToken)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(200);
                    expect(res.body.success).to.be.equal(true);
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

    })
    
    describe('Post - /user/group/updateUser', () => {

        it('32 - /user/group/updateUser - Update the user with on non existing user', (done) => {
            request(baseurl)
                .post('/user/group/updateUser')
                .send({
                    "groupId": secondGroupId,
                    "userId": groupId, //group id act as an user id
                    "role": "member"
                })
                .set('Authorization', 'Bearer ' + token)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(400);
                    expect(res.body.success).to.be.equal(false);
                    expect(res.body).to.have.property('message').that.equals("User does not exist");
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

        it('33 - /user/group/updateUser - Update the user with non existing member of the group', (done) => {
            request(baseurl)
                .post('/user/group/updateUser')
                .send({
                    "groupId": secondGroupId,
                    "userId": thirdUserId, 
                    "role": "member"
                })
                .set('Authorization', 'Bearer ' + token)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(400);
                    expect(res.body.success).to.be.equal(false);
                    expect(res.body).to.have.property('message').that.equals("User not exists in group");
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

        it('34 - /user/group/updateUser - Update the user with non existing role data', (done) => {
            request(baseurl)
                .post('/user/group/updateUser')
                .send({
                    "groupId": secondGroupId,
                    "userId": secondUserId,
                    "role": "creater"
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

        it('35 - /user/group/updateUser - Update the user with vaild data', (done) => {
            request(baseurl)
                .post('/user/group/updateUser')
                .send({
                    "groupId": secondGroupId,
                    "userId": secondUserId,
                    "role": "member"
                })
                .set('Authorization', 'Bearer ' + token)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(200);
                    expect(res.body.success).to.be.equal(true);
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

    })

    describe('Delete -  /user/group/deleteUser', () => {

        it('36 - /user/group/deleteUser - Delete member using invalid data', (done) => {
            request(baseurl)
                .delete('/user/group/deleteUser?groupId=&userId=')
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
                .set('Authorization', 'Bearer ' + token)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(400);
                    expect(res.body.success).to.be.equal(false);
                    expect(res.body).to.have.property('message').with.equals("Group ID and User ID are required");
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

        it('37 /user/group/deleteUser - Delete non existing user ID to the group', (done) => {
            request(baseurl)
                .delete('/user/group/deleteUser?groupId='+ secondGroupId +'&userId=' + groupId) //groupid act as an user id
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
                .set('Authorization', 'Bearer ' + token)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(400);
                    expect(res.body.success).to.be.equal(false);
                    expect(res.body).to.have.property('error').with.equals("User not found in group");
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })    

        it('38 - /user/group/deleteUser - Delete user to the group using valid data', (done) => {
            request(baseurl)
            .delete('/user/group/deleteUser?groupId='+ secondGroupId +'&userId=' + secondUserId)
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
                .set('Authorization', 'Bearer ' + token)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(200);
                    expect(res.body.success).to.be.equal(true);
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

        it('39 - /user/group/deleteUser - Delete non existing user ID to the group', (done) => {
            request(baseurl)
                .delete('/user/group/deleteUser?groupId='+ secondGroupId +'&userId=' + secondUserId)
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
                .set('Authorization', 'Bearer ' + token)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(400);
                    expect(res.body.success).to.be.equal(false);
                    expect(res.body).to.have.property('error').with.equals("User not found in group");
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

    })

    describe('Post -  /user/group/addDevices', () => {

        it('40 - Add Devices to the non existing group', (done) => {
            request(baseurl)
                .post('/user/group/addDevices')
                .send({
                    "groupId": userId,
                    "deviceIds": [vehicleId, mobileId]
                })
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
                .set('Authorization', 'Bearer ' + token)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(400);
                    expect(res.body.success).to.be.equal(false);
                    expect(res.body).to.have.property('message').that.equals("Group does not exist");
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

        it('41 - Add Devices to the existing group with non admin user', (done) => {
            request(baseurl)
                .post('/user/group/addDevices')
                .send({
                    "groupId": secondGroupId,
                    "deviceIds": [vehicleId, mobileId]
                })
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
                .set('Authorization', 'Bearer ' + secondUserToken)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(400);
                    expect(res.body.success).to.be.equal(false);
                    expect(res.body).to.have.property('message').that.equals("user does not have admin access to add devices to group");
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

        it('42 - Add Devices to the existing group with single device', (done) => {
            request(baseurl)
                .post('/user/group/addDevices')
                .send({
                    "groupId": secondGroupId[0],
                    "deviceIds": vehicleId
                })
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
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

        it('43 - Add Devices to the group with valid data', (done) => {
            request(baseurl)
                .post('/user/group/addDevices')
                .send({
                    "groupId": secondGroupId,
                    "deviceIds": [vehicleId, mobileId]
                })
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
                .set('Authorization', 'Bearer ' + token)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(200);
                    expect(res.body.success).to.be.equal(true);
                    expect(res.body).to.have.property('message').that.equals("Devices added to the group");
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

        it('44 - Add existing Devices to the group', (done) => {
            request(baseurl)
                .post('/user/group/addDevices')
                .send({
                    "groupId": secondGroupId,
                    "deviceIds": [vehicleId, mobileId]
                })
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
                .set('Authorization', 'Bearer ' + token)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(400);
                    expect(res.body.success).to.be.equal(false);
                    expect(res.body).to.have.property('message').that.equals("All devices already exist in group");
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

    })

    describe('Delete -  /user/group/deleteDevice', () => {

        it('45 - Delete device using invalid data', (done) => {
            request(baseurl)
                .delete('/user/group/deleteDevice?deviceId=&groupId=')
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
                .set('Authorization', 'Bearer ' + token)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(400);
                    expect(res.body.success).to.be.equal(false);
                    expect(res.body).to.have.property('message').with.equals("Group ID and Device ID are required");
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

        it('46 - Delete device using non existing group', (done) => {
            request(baseurl)
                .delete('/user/group/deleteDevice?deviceId=' + vehicleId + '&groupId=' + userId) //user id act as an group id
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
                .set('Authorization', 'Bearer ' + token)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(400);
                    expect(res.body.success).to.be.equal(false);
                    expect(res.body).to.have.property('message').with.equals("Group does not exist");
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

        it('47 - Delete non existing device ID from the DB', (done) => {
            request(baseurl)
                .delete('/user/group/deleteDevice?deviceId=' + userId + '&groupId=' + secondGroupId) //user id act as an device id
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
                .set('Authorization', 'Bearer ' + token)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(400);
                    expect(res.body.success).to.be.equal(false);
                    expect(res.body).to.have.property('message').with.equals("Device does not exist");
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

        it('48 - Delete device from the group non admin user', (done) => {
            request(baseurl)
                .delete('/user/group/deleteDevice?deviceId=' + vehicleId + '&groupId=' + secondGroupId)
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
                .set('Authorization', 'Bearer ' + secondUserToken)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(400);
                    expect(res.body.success).to.be.equal(false);
                    expect(res.body).to.have.property('message').with.equals('Group does not exist');
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

        it('49 - Delete device from the group using valid data', (done) => {
            request(baseurl)
                .delete('/user/group/deleteDevice?deviceId=' + vehicleId + '&groupId=' + secondGroupId)
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
                .set('Authorization', 'Bearer ' + token)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(200);
                    expect(res.body.success).to.be.equal(true);
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

    })

    describe('Post -  /user/group/addDevice', () => {

        it('50 - /user/group/addDevice - Add Device to the group with empty values', (done) => {
            request(baseurl)
                .post('/user/group/addDevice')
                .send({
                    "groupId": "",
                    "deviceId": ""
                })
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
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

        it('51 - /user/group/addDevice - Add device to the non existing group', (done) => {
            request(baseurl)
                .post('/user/group/addDevice')
                .send({
                    "groupId": userId, //user id act as an groupid
                    "deviceId": mobileId
                })
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
                .set('Authorization', 'Bearer ' + token)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(400);
                    expect(res.body.success).to.be.equal(false);
                    expect(res.body).to.have.property('message').that.equals("Group does not exist");
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

        it('52 - /user/group/addDevice - Add non registered Device to the group', (done) => {
            request(baseurl)
                .post('/user/group/addDevice')
                .send({
                    "groupId": secondGroupId,
                    "deviceId": userId //user id act as an deviceid
                })
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
                .set('Authorization', 'Bearer ' + token)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(400);
                    expect(res.body.success).to.be.equal(false);
                    expect(res.body).to.have.property('message').that.equals("Device does not exist");
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

        it('53 - /user/group/addDevice - non owner adding a device to their group', (done) => {
            request(baseurl)
                .post('/user/group/addDevice')
                .send({
                    "groupId": secondGroupId,
                    "deviceId": secondUserMobileId
                })
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
                .set('Authorization', 'Bearer ' + token)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(400);
                    expect(res.body.success).to.be.equal(false);
                    expect(res.body).to.have.property('message').that.equals("User does not have ownership of this device");
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

        it('54 - /user/group/addDevice - Non admin menter Adding Device to the group', (done) => {
            request(baseurl)
                .post('/user/group/addDevice')
                .send({
                    "groupId": secondGroupId,
                    "deviceId": secondUserMobileId
                })
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
                .set('Authorization', 'Bearer ' + secondUserToken)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(400);
                    expect(res.body.success).to.be.equal(false);
                    expect(res.body).to.have.property('message').that.equals("user does not have admin access to add device to group");
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

        it('55 - /user/group/addDevice - Add Device to the group with valid data', (done) => {
            request(baseurl)
                .post('/user/group/addDevice')
                .send({
                    "groupId": secondGroupId,
                    "deviceId": vehicleId
                })
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
                .set('Authorization', 'Bearer ' + token)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(200);
                    expect(res.body.success).to.be.equal(true);
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

        it('56 - /user/group/addDevice - Add existing Device to the group with valid data', (done) => {
            request(baseurl)
                .post('/user/group/addDevice')
                .send({
                    "groupId": secondGroupId,
                    "deviceId": mobileId
                })
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
                .set('Authorization', 'Bearer ' + token)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(400);
                    expect(res.body.success).to.be.equal(false);
                    expect(res.body).to.have.property('message').that.equals("Device already exist in group");
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

    })

    describe('Get -  /user/group/getGroup', () => {

        it('57 - Get the group data using empty group ID', (done) => {
            request(baseurl)
                .get('/user/group/getGroup?id=')
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
                .set('Authorization', 'Bearer ' + token)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(400);
                    expect(res.body.success).to.be.equal(false);
                    expect(res.body).to.have.property('message').that.equals("Group ID is required");
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

        it('58 - Get the group data for non existing group ID', (done) => {
            request(baseurl)
                .get('/user/group/getGroup?id=' + userId) //user id act as an group id
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
                .set('Authorization', 'Bearer ' + token)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(400);
                    expect(res.body.success).to.be.equal(false);
                    expect(res.body).to.have.property('message').that.equals("Group does not exist");
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

        it('59 - Get the group data for existing group ID', (done) => {
            request(baseurl)
                .get('/user/group/getGroup?id=' + secondGroupId)
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
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
    
    })

    describe('Get -  /user/group/getGroups', () => {

        it('60 - Get the group with valid user Id using Token', (done) => {
            request(baseurl)
                .get('/user/group/getGroups')
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
                .set('Authorization', 'Bearer ' + token)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(200);
                    expect(res.body.success).to.be.equal(true);
                    expect(res.body).to.have.property('groups').that.is.an('array');
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })
        
        it('61 - Get the group with invalid user Id using Token', (done) => {
            request(baseurl)
                .get('/user/group/getGroups')
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
                .set('Authorization', 'Bearer ' + token + 'o')
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

    describe('Post -  /user/group/searchGroups', () => {

        it('62 - Search the grouo using valid search string', (done) => {
            request(baseurl)
                .post('/user/group/searchGroups')
                .send({"searchString" : "group"})
                .set('Authorization', 'Bearer ' + token)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(200);
                    expect(res.body.success).to.be.equal(true);
                    expect(res.body).to.have.property('data').that.is.an('array');
                    expect(res.body).to.have.property('message').that.equals("Groups for your Search");
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

        it('63 - Search the group using invalid user ID', (done) => {
            request(baseurl)
            .post('/user/group/searchGroups')
            .send({"searchString" : "test"})
            .set('Authorization', 'Bearer ' + token + 'o')
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

        it('64 - Search the device empty search string', (done) => {
            request(baseurl)
            .post('/user/group/searchGroups')
            .send({"searchString" : ""})
                .set('Authorization', 'Bearer ' + token)
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

    describe('Post -  /user/group/addGeofence', () => {

        it('65 - Create a Geofene for testing the api "/user/group/addGeofence"', (done) => {
            request(baseurl)
                .post('/user/geofence/add')
                .send({
                    "type": "Circle",
                    "name": "test circle for group controller",
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

        it('66 - add geofence to the group using empty ids', (done) => {
            request(baseurl)
                .post('/user/group/addGeofence')
                .send({
                    "groupId": "",
                    "geofenceId": ""
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

        it('67 - add geofence to the non existing group', (done) => {
            request(baseurl)
                .post('/user/group/addGeofence')
                .send({
                    "groupId": userId, //user id act as an group id
                    "geofenceId": geofenceId
                })
                .set('Authorization', 'Bearer ' + token)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(400);
                    expect(res.body.success).to.be.equal(false);
                    expect(res.body).to.have.property('message').that.equals("Group not found");
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

        it('68 - add non existing geofence to the group', (done) => {
            request(baseurl)
                .post('/user/group/addGeofence')
                .send({
                    "groupId": secondGroupId, //user id act as an geofence id
                    "geofenceId": userId
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

        it('69 - add geofence to the existing group', (done) => {
            request(baseurl)
                .post('/user/group/addGeofence')
                .send({
                    "groupId": secondGroupId, //user id act as an geofence id
                    "geofenceId": geofenceId
                })
                .set('Authorization', 'Bearer ' + token)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(200);
                    expect(res.body.success).to.be.equal(true);
                    expect(res.body).to.have.property('message').that.equals("Geofence added to group successfully");
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

        it('70 - add existing added geofence to the group', (done) => {
            request(baseurl)
                .post('/user/group/addGeofence')
                .send({
                    "groupId": secondGroupId, //user id act as an geofence id
                    "geofenceId": geofenceId
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

    })

    describe('Delete -  /user/group/deleteGeofence', () => {

        it('71 - Delete geofence using empty ids', (done) => {
            request(baseurl)
                .delete('/user/group/deleteGeofence?groupId=' + '&geofenceId=')
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
                .set('Authorization', 'Bearer ' + token)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(400);
                    expect(res.body.success).to.be.equal(false);
                    expect(res.body).to.have.property('message').that.equals("Group ID and Geofence ID are required");
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

        it('72 - Delete geofence using non existing group id', (done) => {
            request(baseurl)
                .delete('/user/group/deleteGeofence?groupId=' + userId + '&geofenceId=' + geofenceId) //user id act as an group id
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
                .set('Authorization', 'Bearer ' + token)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(400);
                    expect(res.body.success).to.be.equal(false);
                    expect(res.body).to.have.property('message').that.equals("Group does not exist");
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

        it('73 - Delete geofence from the group', (done) => {
            request(baseurl)
                .delete('/user/group/deleteGeofence?groupId=' + secondGroupId + '&geofenceId=' + geofenceId) //user id act as an group id
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
                .set('Authorization', 'Bearer ' + token)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(200);
                    expect(res.body.success).to.be.equal(true);
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })
    
    })

    describe('Delete -  /user/group/delete', () => {

        it('74 - Delete the group with non existing group ID', (done) => {
            request(baseurl)
                .delete('/user/group/delete?id=' + userId) //user id act as an group id
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
                .set('Authorization', 'Bearer ' + token)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(400);
                    expect(res.body.success).to.be.equal(false);
                    expect(res.body).to.have.property('message').that.equals("Group does not exist");
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

        it('75 - Delete the group with empty group ID', (done) => {
            request(baseurl)
                .delete('/user/group/delete?id=')
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
                .set('Authorization', 'Bearer ' + token)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(400);
                    expect(res.body.success).to.be.equal(false);
                    expect(res.body).to.have.property('message').that.equals("Group ID is required");
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

        it('76 - Delete the group with non admin of the group', (done) => {
            request(baseurl)
                .delete('/user/group/delete?id=' + secondGroupId)
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
                .set('Authorization', 'Bearer ' + secondUserToken)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(401);
                    expect(res.body.success).to.be.equal(false);
                    expect(res.body).to.have.property('message').that.equals('You do not have permission to delete this group');
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

        it('77 - Delete the group with valid data', (done) => {
            request(baseurl)
                .delete('/user/group/delete?id=' + secondGroupId)
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
                .set('Authorization', 'Bearer ' + token)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(200);
                    expect(res.body.success).to.be.equal(true);
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

    })
});