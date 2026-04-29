const express = require('express');
const CheckDriverAuthenticated = require('../MiddleWares/CheckDriverAuthenticated');
const PublicRidesPaymentsController = require('../Controllers/Payments/PublicRidesPaymentsController');
const CheckPassangerAuthenticated = require('../MiddleWares/CheckPassangerAuthenticated');
const Router = express.Router();
const paymentsController = new PublicRidesPaymentsController()

Router.post('/driver/getPayments', CheckDriverAuthenticated, paymentsController.getDriverPayments)
Router.post('/PhonepayCreateOrder', CheckDriverAuthenticated, paymentsController.PhonepayInitPayment)
Router.post('/PhonepayStatusCheck', CheckDriverAuthenticated, paymentsController.checkandUpdatePaymentStatus)
Router.get('/driver/get-Payments', CheckDriverAuthenticated, paymentsController.publicridesGetPayments)
Router.get('/driver/getTransactionHistory', CheckDriverAuthenticated, paymentsController.getTransactionHistory)
Router.get('/driver/getDriverDueDate', CheckDriverAuthenticated, paymentsController.getDriverDueDate)
Router.post('/customer/create-order', CheckPassangerAuthenticated, paymentsController.customerRazorpayCreateOrder)
//Razorpay
Router.post('/driver/create-order', CheckDriverAuthenticated, paymentsController.razorpayCreateOrder)
Router.post('/driver/duePayStatusCheck', CheckDriverAuthenticated, paymentsController.duePayStatusCheck)
Router.post('/driver/updateDriverPaymentID', CheckDriverAuthenticated, paymentsController.updateDriverPaymentID)
module.exports = Router