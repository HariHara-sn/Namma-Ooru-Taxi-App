import request from 'supertest';
import { assert, expect } from 'chai';

const baseurl = 'http://localhost:3000';

function generateUserData() {
    const mobile = Math.random().toString().slice(2, 12);
    return {
        email: "backendtest" + mobile + "@gmail.com",
        phone: "+91" + mobile,
        name: "Backend Test",
        password: "Qwerty@1234"
    };
}

export const firtsUserData = generateUserData();
export const secondUserData = generateUserData();
export const thirdUserData = generateUserData();

let firstUserToken, firstUserId, secondUserToken, secondUserId, thirdUserToken, thirdUserId;

const googleSignInData = {
    "email": "ajinra020307@gmail.com",
    "idToken": "eyJhbGciOiJSUzI1NiIsImtpZCI6ImYyZTExOTg2MjgyZGU5M2YyN2IyNjRmZDJhNGRlMTkyOTkzZGNiOGMiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL2FjY291bnRzLmdvb2dsZS5jb20iLCJhenAiOiIxMDYxNDk2NTI3NjI3LTdubGdobGUzNm4xNGVxMGczaHY5Ym84cm9idGlucGVoLmFwcHMuZ29vZ2xldXNlcmNvbnRlbnQuY29tIiwiYXVkIjoiMTA2MTQ5NjUyNzYyNy00bjZjOGRqZzRwODQ5YzRzZjM5M2wyaHVlcGQ0YTRuay5hcHBzLmdvb2dsZXVzZXJjb250ZW50LmNvbSIsInN1YiI6IjEwNjI1MTk4NzU2NjExMjk1Njc1OSIsImVtYWlsIjoiYWppbnJhMDIwMzA3QGdtYWlsLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJuYW1lIjoiQWppbiBSIiwicGljdHVyZSI6Imh0dHBzOi8vbGgzLmdvb2dsZXVzZXJjb250ZW50LmNvbS9hL0FDZzhvY0pPVG5RSmVVNzJfMEhNVU9VNm1GYW04WU1Bc2tmNXhrdjQ2d3lPVnZ2ZE1IMk9JY3RjPXM5Ni1jIiwiZ2l2ZW5fbmFtZSI6IkFqaW4iLCJmYW1pbHlfbmFtZSI6IlIiLCJpYXQiOjE3MjE4MDc1MDMsImV4cCI6MTcyMTgxMTEwM30.jx33bQlfcvyFD0_Z9NtBvCLx7uvgDa5v9yJ03SOxwEx8O6ZmuFOvyxY3UrGGWp2ngHhhEVWnS_6P52RlmZtoGc2YzKnHgMFIoUeltAYfyQofpJ9DlLaYVtzvme0z-mbSrjsfu7RmxzCKCKfZMwqQ6wcnBNNSiV2KatAJ_7-qDKnQMIXk3CCPjki6aWEgYtOjqPEAKyGhXRgmcBQ1ryF_Tw7E-7oB_rfKHHjqsCtT9O8hfDbOlsJnXgTFJ6xAqBmMaNIx_u6ob7qMPRNM6O5X4UyXu3RuIhWPkly_uWUxDlM5NJuB6WojtH-iDWn4Oz63Nt5Q1MgTTtkY2dStOY9YyQ",
    "imageUrl": "https://lh3.googleusercontent.com/a/ACg8ocJOTnQJeU72_0HMUOU6mFam8YMAskf5xkv46wyOVvvdMH2OIctc=s96-c",
    "name": "Ajin R",
    "uid": "106251987566112956759"
}


describe('User Controller API Testcases', () => {
    
    describe('Post - /user/register', () => {
        it('1 - Register user using Invalid Password', (done) => {
            request(baseurl)
                .post('/user/register')
                .send({
                    "email": "backendtest@gmail.com",
                    "phone": "+917689098176",
                    "name": "Backend Test",
                    "password": "qwerty@1234"
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

        it('2 - Register user using Invalid email', (done) => {
            request(baseurl)
                .post('/user/register')
                .send({
                    "email": "backendtestgmail.com",
                    "phone": "+917689098176",
                    "name": "Backend Test",
                    "password": "Qwerty@1234"
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

        it('3 - Register user using valid details', (done) => {
            request(baseurl)
                .post('/user/register')
                .send(firtsUserData)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(200);
                    expect(res.body.success).to.be.equal(true);
                    expect(res.body).to.have.property('message').that.equals("User added");
                    expect(res.body.userId).not.to.be.null;
                    expect(res.body.token).not.to.be.null;
                    firstUserToken = res.body.token;
                    firstUserId = res.body.userId;
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

        it('4 - Register user using existing registered email', (done) => {
            request(baseurl)
                .post('/user/register')
                .send({
                    "email": "backendtest@gmail.com",
                    "phone": "+917689098177",
                    "name": "Backend Test",
                    "password": "Qwerty@1234"
                })
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(400);
                    expect(res.body.success).to.be.equal(false);
                    expect(res.body).to.have.property('message').that.equals("User mobile or email already exists");
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

        it('5 - Register user using existing registered Phone number', (done) => {
            request(baseurl)
                .post('/user/register')
                .send({
                    "email": "backendtest1@gmail.com",
                    "phone": "+917689098176",
                    "name": "Backend Test",
                    "password": "Qwerty@1234"
                })
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(400);
                    expect(res.body.success).to.be.equal(false);
                    expect(res.body).to.have.property('message').that.equals("User mobile or email already exists");
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })   

        it('6 - Register 2nd user using valid details for other controllers', (done) => {
            request(baseurl)
            .post('/user/register')
            .send(secondUserData)
            .end(function(err, res) {
                expect(res.statusCode).to.be.equal(200);
                expect(res.body.success).to.be.equal(true);
                expect(res.body).to.have.property('message').that.equals("User added");
                expect(res.body.userId).not.to.be.null;
                expect(res.body.token).not.to.be.null;
                secondUserToken = res.body.token;
                secondUserId = res.body.userId;
                if (err) {
                    throw err;
                }
                done();
            });
        })

        it('7 - Register 3rd user using valid details for other controllers', (done) => {
            request(baseurl)
            .post('/user/register')
            .send(thirdUserData)
            .end(function(err, res) {
                expect(res.statusCode).to.be.equal(200);
                expect(res.body.success).to.be.equal(true);
                expect(res.body).to.have.property('message').that.equals("User added");
                expect(res.body.userId).not.to.be.null;
                expect(res.body.token).not.to.be.null;
                thirdUserToken = res.body.token;
                thirdUserId = res.body.userId;
                if (err) {
                    throw err;
                }
                done();
            });
        })
    })

    describe('Post - /user/login', () => {
        it('6 - Invalid login using Wrong Password', (done) => {
            request(baseurl)
                .post('/user/login')
                .send({
                    "email": firtsUserData.email,
                    "password": "qwertqqy"
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

        it('7 - Invalid login using non existing user email', (done) => {
            request(baseurl)
                .post('/user/login')
                .send({
                    "email": "invalidEmail@gmail.com",
                    "password": firtsUserData.password
                })
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
        
        it('8 - Invalid login using undefined value in fcmToken object', (done) => {
            request(baseurl)
                .post('/user/login')
                .send({
                    "email": "invalidEmail@gmail.com",
                    "password": firtsUserData.password,
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

        it('9 - Valid login', (done) => {
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
                    firstUserToken = res.body.user.token;
                    firstUserId = res.body.user._id;
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })
    })

    describe('Post - /user/refresh', () => {
        it('12 - Refresh the token', (done) => {
            request(baseurl)
                .post('/user/refresh')
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(200);
                    expect(res.body.success).to.be.equal(true);
                    expect(res.body).to.have.property('message').to.be.equal("Token refreshed");
                    expect(res.body).to.have.property('token');
                    firstUserToken = res.body.token;
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })
    })

    describe('Post - /user/googleSignIn', () => {

        it('13 -  - googleSignIn Using Expired google token', (done) => {
            request(baseurl)
                .post('/user/googleSignIn')
                .send({
                    "email": "ajinra020307@gmail.com",
                    "idToken": "eyJhbGciOiJSUzI1NiIsImtpZCI6ImYyZTExOTg2MjgyZGU5M2YyN2IyNjRmZDJhNGRlMTkyOTkzZGNiOGMiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL2FjY291bnRzLmdvb2dsZS5jb20iLCJhenAiOiIxMDYxNDk2NTI3NjI3LTdubGdobGUzNm4xNGVxMGczaHY5Ym84cm9idGlucGVoLmFwcHMuZ29vZ2xldXNlcmNvbnRlbnQuY29tIiwiYXVkIjoiMTA2MTQ5NjUyNzYyNy00bjZjOGRqZzRwODQ5YzRzZjM5M2wyaHVlcGQ0YTRuay5hcHBzLmdvb2dsZXVzZXJjb250ZW50LmNvbSIsInN1YiI6IjEwNjI1MTk4NzU2NjExMjk1Njc1OSIsImVtYWlsIjoiYWppbnJhMDIwMzA3QGdtYWlsLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJuYW1lIjoiQWppbiBSIiwicGljdHVyZSI6Imh0dHBzOi8vbGgzLmdvb2dsZXVzZXJjb250ZW50LmNvbS9hL0FDZzhvY0pPVG5RSmVVNzJfMEhNVU9VNm1GYW04WU1Bc2tmNXhrdjQ2d3lPVnZ2ZE1IMk9JY3RjPXM5Ni1jIiwiZ2l2ZW5fbmFtZSI6IkFqaW4iLCJmYW1pbHlfbmFtZSI6IlIiLCJpYXQiOjE3MjE4MDc1MDMsImV4cCI6MTcyMTgxMTEwM30.jx33bQlfcvyFD0_Z9NtBvCLx7uvgDa5v9yJ03SOxwEx8O6ZmuFOvyxY3UrGGWp2ngHhhEVWnS_6P52RlmZtoGc2YzKnHgMFIoUeltAYfyQofpJ9DlLaYVtzvme0z-mbSrjsfu7RmxzCKCKfZMwqQ6wcnBNNSiV2KatAJ_7-qDKnQMIXk3CCPjki6aWEgYtOjqPEAKyGhXRgmcBQ1ryF_Tw7E-7oB_rfKHHjqsCtT9O8hfDbOlsJnXgTFJ6xAqBmMaNIx_u6ob7qMPRNM6O5X4UyXu3RuIhWPkly_uWUxDlM5NJuB6WojtH-iDWn4Oz63Nt5Q1MgTTtkY2dStOY9YyQ",
                    "imageUrl": "https://lh3.googleusercontent.com/a/ACg8ocJOTnQJeU72_0HMUOU6mFam8YMAskf5xkv46wyOVvvdMH2OIctc=s96-c",
                    "name": "Ajin R",
                    "uid": "106251987566112956759"
                })
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(500);
                    expect(res.body.success).to.be.equal(false);
                    expect(res.body).to.have.property('error');
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

        it('14 - /user/googleSignIn - Valid first time google sign in', (done) => {
            request(baseurl)
                .post('/user/googleSignIn')
                .send(googleSignInData)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(200);
                    expect(res.body.success).to.be.equal(true);
                    expect(res.body).to.have.property('message').that.equals("User added");
                    expect(res.body).to.have.property('_id').with.lengthOf(24);
                    expect(res.body).to.have.property('token').with.lengthOf(183);
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

        it('15 - /user/resetPassword - Send Empty Email reset password', (done) => {
            request(baseurl)
                .post('/user/resetPassword')
                .send({
                    "email": ""
                })
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(400);
                    expect(res.body.success).to.be.equal(false);
                    expect(res.body).to.have.property('message').that.equals("Email is required");
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

        it('16 - /user/resetPassword - Worng Email reset password', (done) => {
            request(baseurl)
                .post('/user/resetPassword')
                .send({
                    "email": "worngemail.gmail.com"
                })
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(400);
                    expect(res.body.success).to.be.equal(false);
                    expect(res.body).to.have.property('message').that.equals("Email not found");
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

        it('17 - /user/resetPassword - GoogleSign In user reset password', (done) => {
            request(baseurl)
                .post('/user/resetPassword')
                .send({
                    "email": googleSignInData.email
                })
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(400);
                    expect(res.body.success).to.be.equal(false);
                    expect(res.body).to.have.property('message').that.equals("Password reset cannot be done with google auth email");
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

        it('18 - /user/resetPassword - Non GoogleSign In user reset password', (done) => {
            request(baseurl)
                .post('/user/resetPassword')
                .send({
                    "email": firtsUserData.email
                })
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(200);
                    expect(res.body.success).to.be.equal(true);
                    expect(res.body).to.have.property('message').that.equals("Password reset email sent");
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

        it('19 - /user/resetPassword - Non GoogleSign In user reset password with in 5 Minutes', (done) => {
            request(baseurl)
                .post('/user/resetPassword')
                .send({
                    "email": firtsUserData.email
                })
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(400);
                    expect(res.body.success).to.be.equal(false);
                    expect(res.body).to.have.property('message').that.equals("Password reset link was sent less than 5 minutes ago. Try again later.");
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })
    })

    describe('Post - /user/changePassword ', () => {
        it('20 - Change password using Invalid Token and valid password', (done) => {
            request(baseurl)
                .post('/user/changePassword')
                .send({
                    "token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjp7ImlkIjoiNjYwZDAzNjM3NGRjYjI1NjFhOGJlZmU1IiwidXNlIjoicmVzZXQtbWFpbCJ9LCJpYXQiOjE3MTIxMjkzMDIsImV4cCI6MTcxMjEzMjkwMn0.853Gk0HM0rVS8igbtP1xK1uNk8-cTEeZMxrnUcKBzbY",
                    "password": "Hello@123"
                })
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(400);
                    expect(res.body.success).to.be.equal(false);
                    expect(res.body).to.have.property('message').that.equals("Invalid token");
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

        it('21 - Change password using empty token', (done) => {
            request(baseurl)
                .post('/user/changePassword')
                .send({
                    "token":"",
                    "password": "Hello@123"
                })
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(400);
                    expect(res.body.success).to.be.equal(false);
                    expect(res.body).to.have.property('message').to.have.property('error');
                    expect(res.body).to.have.property('message').to.have.property('success').to.be.equal(false);
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

        it('22 - Change password using empty password', (done) => {
            request(baseurl)
                .post('/user/changePassword')
                .send({
                    "token": firstUserToken,
                    "password": ""
                })
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(400);
                    expect(res.body.success).to.be.equal(false);
                    expect(res.body).to.have.property('message').to.have.property('error');
                    expect(res.body).to.have.property('message').to.have.property('success').to.be.equal(false);
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

        it('23 - Change password using valid token and Invalid password', (done) => {
            request(baseurl)
                .post('/user/changePassword')
                .send({
                    "token": firstUserToken,
                    "password": "ello@123"
                })
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(400);
                    expect(res.body.success).to.be.equal(false);
                    expect(res.body).to.have.property('message').to.have.property('error');
                    expect(res.body).to.have.property('message').to.have.property('success').to.be.equal(false);
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

        it('24 - Change password using valid token and password', (done) => {
            request(baseurl)
                .post('/user/changePassword')
                .send({
                    "token": firstUserToken,
                    "password": "Qwerty@1234"
                })
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(200);
                    expect(res.body.success).to.be.equal(true);
                    expect(res.body).to.have.property('message').to.be.equal("Password changed");
                    firtsUserData.password = "Qwerty@1234"
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })
    })
    
    describe('Post - /user/searchUsers', () => {
        it('25 - Search User using Empty String', (done) => {
            request(baseurl)
                .post('/user/searchUsers')
                .send({   
                    "searchString" : "" // phone number should be enter fully
                })
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
                .set('Authorization', 'Bearer ' + firstUserToken)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(400);
                    expect(res.body.success).to.be.equal(false);
                    expect(res.body).to.have.property('message').to.be.equal("Search String Empty");

                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

        it('26 - Search User using valid string number and with userId', (done) => {
            request(baseurl)
                .post('/user/searchUsers')
                .send({   
                    "searchString" : "768" // phone number should be enter fully
                })
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
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

        it('27 - Search User using valid string number', (done) => {
            request(baseurl)
                .post('/user/searchUsers')
                .send({   
                    "searchString" : "768" // phone number should be enter fully
                })
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
                .set('Authorization', 'Bearer ' + firstUserToken)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(200);
                    expect(res.body.success).to.be.equal(true);
                    expect(res.body).to.have.property('message').to.be.equal("Users for your Search");
                    expect(res.body).to.have.property('data').that.is.an('array');
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })
    })

    describe('Post - /user/updateUserDetail', () => {
        it('28 - Update user details without userId', (done) => {
            request(baseurl)
                .post('/user/updateUserDetail')
                .send({
                    "newName": "Backend test",
                    "newPhone": "+919809124333"
                })
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
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

        it('29 - Update user details with valid userId', (done) => {
            request(baseurl)
                .post('/user/updateUserDetail')
                .send({
                    "newName": "Backend testing",
                    "newPhone": "+919809124333"
                })
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
                .set('Authorization', 'Bearer ' + firstUserToken)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(200);
                    expect(res.body.success).to.be.equal(true);
                    expect(res.body).to.have.property('message').to.be.equal("User Detail Updated");
                    firtsUserData.name = "Backend testing"
                    firtsUserData.phone = "+919809124333"
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })
    })

    describe('Get - /user/getUserDetails', () => {
        it('30 - Get user details with invalid token', (done) => {
            request(baseurl)
                .get('/user/getUserDetails')
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
                .set('Authorization', 'Bearer ' + firstUserToken + 'w')
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

        it('31 - Get user details with valid token', (done) => {
            request(baseurl)
                .get('/user/getUserDetails')
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
                .set('Authorization', 'Bearer ' + firstUserToken)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(200);
                    expect(res.body.success).to.be.equal(true);
                    expect(res.body).to.have.property("message").to.be.equal("Users Details");
                    expect(res.body).to.have.property("data");
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })
    })

    describe('Get - /user/getUserImage', () => {
        it('32 - Get user image with invalid token', (done) => {
            request(baseurl)
                .get('/user/getUserImage')
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
                .set('Authorization', 'Bearer ' + firstUserToken + 'w')
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

        it('33 - Get user image with valid token', (done) => {
            request(baseurl)
                .get('/user/getUserImage')
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
                .set('Authorization', 'Bearer ' + firstUserToken)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(200);
                    expect(res.body.success).to.be.equal(true);
                    expect(res.body).to.have.property("image");
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })
    })

    describe('Get - /user/getUserSubscription', () => {
        it('34 - Get user subscription with invalid token', (done) => {
            request(baseurl)
                .get('/user/getUserSubscription')
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
                .set('Authorization', 'Bearer ' + firstUserToken + 'w')
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

        it('35 - Get user subscription with valid token', (done) => {
            request(baseurl)
                .get('/user/getUserSubscription')
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
                .set('Authorization', 'Bearer ' + firstUserToken)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(200);
                    expect(res.body.success).to.be.equal(true);
                    expect(res.body).to.have.property("message").to.be.equal("User Subscription");
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })
    })
    
    describe('Post - /user/dataDeleteRequest', () => {
        it('36 - Request the data delete using invalid email', (done) => {
            request(baseurl)
                .post('/user/dataDeleteRequest')
                .send({
                    "email": 'Q' + firtsUserData.email
                })
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(400);
                    expect(res.body.success).to.be.equal(false);
                    expect(res.body).to.have.property('message').to.be.equal("Email is not found");
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

        it('37 - Request the data delete using empty payload', (done) => {
            request(baseurl)
                .post('/user/dataDeleteRequest')
                .send({
                    "email": ''
                })
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(400);
                    expect(res.body.success).to.be.equal(false);
                    expect(res.body).to.have.property('message').to.be.equal("Email Id is required");
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

        it('38 - Request the data delete using valid email', (done) => {
            request(baseurl)
                .post('/user/dataDeleteRequest')
                .send({
                    "email": firtsUserData.email
                })
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(200);
                    expect(res.body.success).to.be.equal(true);
                    expect(res.body).to.have.property('message').to.be.equal("Request Submitted Successfully");
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })
    })

    describe('Post - /user/logout', () => {
        it('39 - Logout using Invalid Token', (done) => {
            request(baseurl)
                .post('/user/logout')
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
                .set('Authorization', 'Bearer ' + firstUserToken + 'q')
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

        it('40 - Logout using valid token', (done) => {
            request(baseurl)
                .post('/user/logout')
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
                .set('Authorization', 'Bearer ' + firstUserToken)
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(200);
                    expect(res.body.success).to.be.equal(true);
                    expect(res.body).to.have.property('message').that.equals("Logged out successfully");
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })
    })

});

