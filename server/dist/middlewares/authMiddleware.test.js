import { jest, describe, it, expect, beforeEach, beforeAll, } from "@jest/globals";
jest.unstable_mockModule("../utils/tokenAndCookie.js", () => ({
    verifyAccessToken: jest.fn(),
    verifyRefreshToken: jest.fn(),
    generateAccessTokenAndSetCookie: jest.fn(),
    generateRefreshTokenAndSetCookie: jest.fn(),
}));
jest.unstable_mockModule("../configs/db.js", () => ({
    default: {
        user: {
            findUnique: jest.fn(),
            update: jest.fn(),
        },
    },
}));
jest.unstable_mockModule("../configs/loggerConfig.js", () => ({
    default: { error: jest.fn(), info: jest.fn() },
}));
// --- Helpers ---
let mocks;
let authMiddleware;
beforeAll(async () => {
    const tokenModule = await import("../utils/tokenAndCookie.js");
    const dbModule = await import("../configs/db.js");
    const middlewareModule = await import("./authMiddleware.js");
    authMiddleware = middlewareModule.authMiddleware;
    mocks = {
        verifyAccessToken: tokenModule.verifyAccessToken,
        verifyRefreshToken: tokenModule.verifyRefreshToken,
        generateAccessTokenAndSetCookie: tokenModule.generateAccessTokenAndSetCookie,
        generateRefreshTokenAndSetCookie: tokenModule.generateRefreshTokenAndSetCookie,
        findUnique: dbModule.default.user.findUnique,
        update: dbModule.default.user.update,
    };
});
function buildReqRes(cookies) {
    const req = { cookies };
    const res = {};
    const next = jest.fn();
    return { req, res, next };
}
// --- Tests ---
describe("authMiddleware", () => {
    beforeEach(() => Object.values(mocks).forEach((m) => m.mockReset()));
    // ── 1. Valid access token ──────────────────────────────────────────────────
    describe("when a valid access token is present", () => {
        it("attaches userId to req.user and calls next()", async () => {
            mocks.verifyAccessToken.mockReturnValue({ userId: 1 });
            const { req, res, next } = buildReqRes({
                accessToken: "valid.access.token",
            });
            await authMiddleware(req, res, next);
            expect(req.user).toEqual({ userId: 1 });
            expect(next).toHaveBeenCalledWith( /* nothing — no error */);
            expect(next).toHaveBeenCalledTimes(1);
            // Should NOT touch refresh-token logic at all
            expect(mocks.verifyRefreshToken).not.toHaveBeenCalled();
        });
    });
    // ── 2. Access token present but invalid (expired / tampered) ──────────────
    describe("when the access token is invalid", () => {
        it("falls through to refresh-token logic", async () => {
            mocks.verifyAccessToken.mockReturnValue(null);
            // No refresh token either → expect 401
            const { req, res, next } = buildReqRes({ accessToken: "bad.token" });
            await authMiddleware(req, res, next);
            expect(next).toHaveBeenCalledWith(expect.objectContaining({ status: 401 }));
        });
    });
    // ── 3. No tokens at all ────────────────────────────────────────────────────
    describe("when no tokens are present", () => {
        it("returns 401 Authentication required", async () => {
            const { req, res, next } = buildReqRes({});
            await authMiddleware(req, res, next);
            expect(next).toHaveBeenCalledWith(expect.objectContaining({
                status: 401,
                message: "Authentication required",
            }));
        });
    });
    // ── 4. Invalid refresh token ───────────────────────────────────────────────
    describe("when the refresh token is invalid", () => {
        it("returns 401 Invalid session", async () => {
            mocks.verifyRefreshToken.mockReturnValue(null);
            const { req, res, next } = buildReqRes({ refreshToken: "bad.refresh" });
            await authMiddleware(req, res, next);
            expect(next).toHaveBeenCalledWith(expect.objectContaining({
                status: 401,
                message: "Invalid session. Please sign in again",
            }));
        });
    });
    // ── 5. Valid refresh token but user not in DB ──────────────────────────────
    describe("when the refresh token is valid but user does not exist", () => {
        it("returns 401 Invalid session", async () => {
            mocks.verifyRefreshToken.mockReturnValue({ userId: 99 });
            mocks.findUnique.mockResolvedValue(null);
            const { req, res, next } = buildReqRes({ refreshToken: "valid.refresh" });
            await authMiddleware(req, res, next);
            expect(next).toHaveBeenCalledWith(expect.objectContaining({ status: 401 }));
        });
    });
    // ── 6. Refresh token mismatch (token rotation / reuse detection) ───────────
    describe("when the refresh token does not match the stored one", () => {
        it("returns 401 Invalid session (token reuse detected)", async () => {
            mocks.verifyRefreshToken.mockReturnValue({ userId: 2 });
            mocks.findUnique.mockResolvedValue({
                id: 2,
                refreshToken: "stored.token.different",
            });
            const { req, res, next } = buildReqRes({
                refreshToken: "incoming.token",
            });
            await authMiddleware(req, res, next);
            expect(next).toHaveBeenCalledWith(expect.objectContaining({ status: 401 }));
        });
    });
    // ── 7. Happy-path refresh (silent token rotation) ─────────────────────────
    describe("when the refresh token is valid and matches the stored one", () => {
        it("rotates tokens, updates DB, sets req.user, and calls next()", async () => {
            mocks.verifyRefreshToken.mockReturnValue({ userId: 3 });
            mocks.findUnique.mockResolvedValue({
                id: 3,
                refreshToken: "matching.refresh.token",
            });
            mocks.generateRefreshTokenAndSetCookie.mockReturnValue("new.refresh.token");
            mocks.update.mockResolvedValue({});
            const { req, res, next } = buildReqRes({
                refreshToken: "matching.refresh.token",
            });
            await authMiddleware(req, res, next);
            // New tokens issued
            expect(mocks.generateAccessTokenAndSetCookie).toHaveBeenCalledWith(res, 3);
            expect(mocks.generateRefreshTokenAndSetCookie).toHaveBeenCalledWith(res, 3);
            // DB updated with new refresh token
            expect(mocks.update).toHaveBeenCalledWith({
                where: { id: 3 },
                data: { refreshToken: "new.refresh.token" },
            });
            expect(req.user).toEqual({ userId: 3 });
            expect(next).toHaveBeenCalledWith( /* no error */);
        });
    });
    // ── 8. Unexpected error (e.g. DB throws) ──────────────────────────────────
    describe("when an unexpected error is thrown", () => {
        it("returns 500 Authentication failed", async () => {
            mocks.verifyRefreshToken.mockReturnValue({ userId: 4 });
            mocks.findUnique.mockImplementation(() => {
                throw new Error("DB connection lost");
            });
            const { req, res, next } = buildReqRes({ refreshToken: "some.token" });
            await authMiddleware(req, res, next);
            expect(next).toHaveBeenCalledWith(expect.objectContaining({
                status: 500,
                message: "Authentication failed",
            }));
        });
    });
});
