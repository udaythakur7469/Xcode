import { verifyAccessToken } from "../utils/tokenAndCookie.js";

export const optionalAuthMiddleware = (req, res, next) => {
  const accessToken = req.cookies.accessToken;

  if (!accessToken) {
    req.user = null;
    return next();
  }

  const payload = verifyAccessToken(accessToken);

  if (!payload) {
    req.user = null;
    return next();
  }

  req.user = { userId: payload.userId };
  next();
};
