import jwt from "jsonwebtoken";
export const optionalAuthMiddleware = (req, res, next) => {
    const token = req.cookies.token;
    if (!token) {
        req.user = null;
        return next();
    }
    jwt.verify(token, process.env.JWT_SECRET, (err, payload) => {
        if (err) {
            req.user = null;
            return next();
        }
        req.user = payload;
        next();
    });
};
