const admin = require('firebase-admin');

const caches = {
    vmtrackers: null,
    vmtaxicustomer: null,
};

const initApp = (appName, serviceAccountPath) => {
    try {
        return admin.app(appName);
    } catch (error) {
        try {
            const serviceAccount = require(serviceAccountPath);
            return admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
                projectId: serviceAccount.project_id,
            }, appName);
        } catch (e) {
            console.warn(`Firebase app "${appName}" not initialized: ${e.message}`);
            return null;
        }
    }
};

const getVmtrackersApp = () => {
    if (!caches.vmtrackers) {
        caches.vmtrackers = initApp('vmtrackers', '../../creds/serviceAccount.json');
    }
    return caches.vmtrackers;
};

const getVmtaxicustomerApp = () => {
    if (!caches.vmtaxicustomer) {
        caches.vmtaxicustomer = initApp('vmtaxicustomer', '../../creds/notserviceAccount.json');
    }
    return caches.vmtaxicustomer;
};

module.exports = { getVmtrackersApp, getVmtaxicustomerApp };
