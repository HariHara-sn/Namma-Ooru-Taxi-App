const Joi = require('joi');


const publicridesFeedbackSchema = Joi.object({
    screen: Joi.string().allow('', null).optional(),
    searchIssue: Joi.string().allow('', null).optional(),
    pickLocationIssue: Joi.string().allow('', null).optional(),
    pickLocationCoords: Joi.alternatives().try(
        Joi.array().items(Joi.number()).length(2),
        Joi.object(),
        Joi.string()
    ).allow('', null).optional(),
    tripIssue: Joi.string().allow('', null).optional(),
    tripStart: Joi.object({
        address: Joi.string().allow('', null).optional(),
        coords: Joi.alternatives().try(
            Joi.array().items(Joi.number()).length(2),
            Joi.object(),
            Joi.string()
        ).allow('', null).optional()
    }).optional(),
    tripEnd: Joi.object({
        address: Joi.string().allow('', null).optional(),
        coords: Joi.alternatives().try(
            Joi.array().items(Joi.number()).length(2),
            Joi.object(),
            Joi.string()
        ).allow('', null).optional()
    }).optional(),
    tripDistanceKm: Joi.alternatives().try(Joi.number(), Joi.string()).allow('', null).optional(),
    pickupCoords: Joi.alternatives().try(
        Joi.array().items(Joi.number()).length(2),
        Joi.object(),
        Joi.string()
    ).allow('', null).optional(),
    dropCoords: Joi.alternatives().try(
        Joi.array().items(Joi.number()).length(2),
        Joi.object(),
        Joi.string()
    ).allow('', null).optional(),
    goodThings: Joi.string().allow('', null).optional(),
    badThings: Joi.string().allow('', null).optional(),
    improvements: Joi.string().allow('', null).optional(),
    issueMessage: Joi.string().allow('', null).optional(),
    email: Joi.string().email().allow('', null).optional(),
    tripId: Joi.string().optional(),
    stops: Joi.array().items(Joi.object()).optional()
});


module.exports = { publicridesFeedbackSchema };


