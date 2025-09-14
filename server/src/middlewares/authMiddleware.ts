import createHttpError from "http-errors";
import jwt from "jsonwebtoken";

export const authMiddleware = (req, res, next) => {
  const token: string = req.cookies.token;
  if (!token) {
    return res
      .status(401)
      .json({ success: false, message: "Unauthorized - no token provided" });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, payload) => {
    if (err) {
      return next(createHttpError.Unauthorized());
    }
    req.user = payload;
    next();
  });
};
