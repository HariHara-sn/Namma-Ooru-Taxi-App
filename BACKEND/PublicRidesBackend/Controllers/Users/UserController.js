
const Controller = require('../Controller');

class UserController extends Controller {

    constructor() {
        super();
        this.accessTokenValidity = '30d'
        this.refreshTokenValidity = '14d'
    }


  
}

module.exports = UserController;