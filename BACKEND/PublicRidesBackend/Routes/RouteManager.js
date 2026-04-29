const User = require('../Models/User')

const PassangerPublicRidesRoute = require('./PassangerPublicRides')
const DriverPublicRidesRoute = require('./DriverPublicRides')
const ActingDriverPublicRidesRoute = require('./ActingDriverPublicRidesRoute')
const generatePresignedUrlRoute = require('./secureserver/PresignedURL')

const PublicRidesPaymentRoutes = require('./PublicRidesPayments')
const VendorPublicRidesRoute = require('./VendorPublicRides')






const includeParams = () => (req, res, next) => {
    req.useNotPushNotification = true
    next()
}

module.exports = (app) => {

    app.use('/secureserver/presignedurl', generatePresignedUrlRoute)

    /* PUBLIC RIDES SECTIONS */
    app.use('/publicrides/customer', PassangerPublicRidesRoute)
    app.use('/publicrides/driver', DriverPublicRidesRoute)
    app.use('/publicrides/customer/v2', includeParams(), PassangerPublicRidesRoute)
    app.use('/publicrides/driver/v2', includeParams(), DriverPublicRidesRoute)
    app.use('/publicrides/actingDriver/v2', includeParams(), ActingDriverPublicRidesRoute)
    app.use('/publicrides/payments', PublicRidesPaymentRoutes)
    app.use('/publicrides/vendor', VendorPublicRidesRoute)
}
