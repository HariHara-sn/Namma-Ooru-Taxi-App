const jwt = require("jsonwebtoken");

/**
 * Middleware to check if the user is authenticated.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Function} next - The next function.
 */

module.exports = function checkPassangerAuthenticated(req, res, next) {
  const authHeader =
    req.headers.authorization ||
    req.headers["x-access-token"] ||
    req.headers["x-access_token"] ||
    req.body?.token ||
    req.query?.token;

  if (!authHeader) {
    return res.status(401).json({ success: false, error: "Unauthorized" });
  }

  const token =
    typeof authHeader === "string" && authHeader.includes(" ")
      ? authHeader.split(" ")[1]
      : authHeader;

  if (!token) {
    return res.status(401).json({ success: false, error: "Unauthorized" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET_PASSANGER);
    req.passanger = decoded.passanger;
    if (!decoded?.passanger?.id)
      return res.status(401).json({ success: false, error: "Unauthorized" });
    next();
  } catch (error) {
    return res.status(401).json({ success: false, error: "Unauthorized" });
  }
};
