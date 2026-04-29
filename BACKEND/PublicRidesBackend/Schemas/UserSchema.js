

// JOI SCHEMA
const Joi = require('joi');

const UserRegisterSchema = (platform) => {
    const imeiRule = platform === 'ios'
        ? Joi.string().min(5).max(100).required()
        : Joi.string().min(15).max(20).required();

    return Joi.object({
        name: Joi.string().min(2).max(30).required(),
        email: Joi.string().email().required(),
        phone: Joi.string().pattern(/^\+[1-9]\d{1,14}$/).required(),
        password: Joi.string().pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])(?=.{8,})')).required(),
        fcmTokens: Joi.array().items(
            Joi.object({
                deviceImei: imeiRule,
                token: Joi.string().required()
            })
        ),
    });
}

const UserGoogleSigninSchema = (platform) => {
    const imeiRule = platform === 'ios'
        ? Joi.string().min(5).max(100).required()
        : Joi.string().min(15).max(20).required();

    return Joi.object({
        idToken: Joi.string().required(),
        email: Joi.string().email().required(),
        name: Joi.string().min(2).max(30).required(),
        imageUrl: Joi.string(),
        uid: Joi.string().required(),
        fcmToken: Joi.object({
            deviceImei: imeiRule,
            token: Joi.string().required()
        })
    });
}

const UserAppleSigninSchema = (platform) => {
    const imeiRule = platform === 'ios'
        ? Joi.string().min(5).max(100).required()
        : Joi.string().min(15).max(20).required();

    return Joi.object({
        idToken: Joi.string().required(),
        userDetails: Joi.object(),
        imageUrl: Joi.string(),
        uid: Joi.string().required(),
        authorizationCode: Joi.string().required(),
        fcmToken: Joi.object({
            deviceImei: imeiRule,
            token: Joi.string().required()
        })
    });
}

const UserChangePasswordSchema = Joi.object({
    token: Joi.string().required(),
    password: Joi.string().pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])(?=.{8,})')).required(),
});


const UserLoginSchema = (platform) => {
    const imeiRule = platform === 'ios'
        ? Joi.string().min(5).max(100).required()
        : Joi.string().min(15).max(20).required();

    return Joi.object({
        email: Joi.string().email(),
        phone: Joi.string().pattern(/^\+[1-9]\d{1,14}$/),
        password: Joi.string().required(),
        socketId: Joi.string(),
        fcmToken: Joi.object({
            deviceImei: imeiRule,
            token: Joi.string().required()
        })
    });
}

const UserLogoutSchema = (platform) => {
    const imeiRule = platform === 'ios'
        ? Joi.string().min(5).max(100).required()
        : Joi.string().min(15).max(20).required();

    return Joi.object({
        fcmToken: Joi.object({
            deviceImei: imeiRule,
            token: Joi.string().required()
        }),
    })
}

const userSubscriptionSchema = Joi.object({
    subscription: Joi.object({
        packageName: Joi.string().required(),
        subscriptionId: Joi.string().required(),
        token: Joi.string().required(),
    }).required(),
    platform: Joi.string().valid('android', 'ios').required(),
    orderId: Joi.string().required()

})

const userSubscriptioniOSSchema = Joi.object({
    platform: Joi.string().valid('ios').required(),
    purchase: Joi.object().required(),
})

const userEmergencyContactsSchema = Joi.object({
    name: Joi.string().min(2).max(30).required(),
    phone: Joi.string().pattern(/^\+[1-9]\d{1,14}$/).required(),
})

module.exports = { UserRegisterSchema, UserLoginSchema, UserChangePasswordSchema, UserGoogleSigninSchema, UserAppleSigninSchema, userSubscriptionSchema, UserLogoutSchema, userEmergencyContactsSchema, userSubscriptioniOSSchema }