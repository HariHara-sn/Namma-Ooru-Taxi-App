const express = require("express");
const GeneratePresignedUrl = require("../../Controllers/GeneratePresignedUrl");
const Router = express.Router();

const generatePresignedUrlController = new GeneratePresignedUrl()

Router.get('/generatePresignedURL', generatePresignedUrlController.generatePresignedURL)

module.exports = Router

