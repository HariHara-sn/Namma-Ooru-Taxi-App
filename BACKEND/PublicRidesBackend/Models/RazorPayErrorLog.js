const mongoose = require('mongoose');

const razorPayErrorLogSchema = new mongoose.Schema({
    webhook: {
        type: String,
        required: true
    },
    requestBody: {
        type: Object,
        required: true
    },
    errorMessage: {
        type: String,
        required: true
    },
    errorStack: {
        type: String
    },
    orderId: {
        type: String
    },
    tripId: {
        type: String
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    payLoaddata: {
        type: Object
    }
});

const RazorPayErrorLog = mongoose.model('RazorPayErrorLog', razorPayErrorLogSchema, 'razorPayErrorLogs');

module.exports = RazorPayErrorLog;
