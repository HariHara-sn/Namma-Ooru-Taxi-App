const express = require('express');
const Router = express.Router();
const CheckAdminAuthenticated = require('../MiddleWares/CheckAdminAuthenticated');
const AdminUserController = require('../Controllers/Admin/UserController');
const adminUserController = new AdminUserController();

// PATCH /admin/users/:id - update showApiKey
Router.patch('/users/:id', CheckAdminAuthenticated, async (req, res) => {
    // Only allow { showApiKey } in body
    const { showApiKey } = req.body;
    if (typeof showApiKey !== 'boolean') {
        return res.status(400).json({ success: false, message: 'showApiKey must be boolean' });
    }
    try {
        await adminUserController.updateShowApiKey(req, res);
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = Router;
