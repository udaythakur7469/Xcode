import jwt from "jsonwebtoken";
export const generateAccessTokenAndSetCookie = (res, userId) => {
    const token = jwt.sign({ userId }, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "7d",
    });
    res.cookie("accessToken", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    return token;
};
export const generateRefreshTokenAndSetCookie = (res, userId) => {
    const token = jwt.sign({ userId }, process.env.REFRESH_TOKEN_SECRET, {
        expiresIn: "30d",
    });
    res.cookie("refreshToken", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
        maxAge: 30 * 24 * 60 * 60 * 1000,
    });
    return token;
};
export const verifyAccessToken = (token) => {
    try {
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        return decoded;
    }
    catch (error) {
        // Token is invalid or expired
        return null;
    }
};
export const verifyRefreshToken = (token) => {
    try {
        const decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
        return decoded;
    }
    catch (error) {
        // Token is invalid or expired
        return null;
    }
};
