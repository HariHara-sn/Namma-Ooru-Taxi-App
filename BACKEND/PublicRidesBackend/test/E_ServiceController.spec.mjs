import request from 'supertest';
import { assert, expect } from 'chai';

const baseurl = 'http://localhost:3000';

describe('Service Controller API Testcases', () => {
    
    describe('Post - /services/search/reverse', () => {
        it('1 - get the address of the geo coordinates using empty lon', (done) => {
            request(baseurl)
                .post('/services/search/reverse?lat=13&lon=') 
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(400);
                    expect(res.body.success).to.be.equal(false);
                    expect(res.body).to.have.property('message').with.equals("Latitude and Longitude are required");
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

        it('2 - get the address of the geo coordinates using empty lat', (done) => {
            request(baseurl)
                .post('/services/search/reverse?lat=&lon=80') 
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(400);
                    expect(res.body.success).to.be.equal(false);
                    expect(res.body).to.have.property('message').with.equals("Latitude and Longitude are required");
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

        it('3 - get the address of the geo coordinates using non valid lat', (done) => {
            request(baseurl)
                .post('/services/search/reverse?lat=-130&lon=-80') 
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(400);
                    expect(res.body.success).to.be.equal(false);
                    expect(res.body).to.have.property('message').with.equals("Latitude and Longitude should be in valid range");
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

        it('4 - get the address of the geo coordinates using non valid lon', (done) => {
            request(baseurl)
                .post('/services/search/reverse?lat=-13&lon=-800') 
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(400);
                    expect(res.body.success).to.be.equal(false);
                    expect(res.body).to.have.property('message').with.equals("Latitude and Longitude should be in valid range");
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

        it('5 - get the address of the geo coordinates using string', (done) => {
            request(baseurl)
                .post('/services/search/reverse?lat=`rkk`&lon=-80') 
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(400);
                    expect(res.body.success).to.be.equal(false);
                    expect(res.body).to.have.property('message').with.equals("Latitude and Longitude should be numbers, not strings");
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })

        it('6 - get the address of the geo coordinates using both valid lat and lon', (done) => {
            request(baseurl)
                .post('/services/search/reverse?lat=13&lon=80') 
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
                .end(function(err, res) {
                    expect(res.statusCode).to.be.equal(200);
                    expect(res.body.success).to.be.equal(true);
                    expect(res.body).to.have.property('address');
                    if (err) {
                        throw err;
                    }
                    done();
                });
        })
    })
});