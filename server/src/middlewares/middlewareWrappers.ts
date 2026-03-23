import { RequestHandler } from "express";
import { cacheMiddleware as _cacheMiddleware } from "@periodic/osmium";
import { rateLimit as _rateLimit } from "@periodic/titanium";

/**
 * Type-safe wrapper for @periodic/osmium's cacheMiddleware.
 *
 * The package's return type is Promise<void | Response> which TypeScript
 * rejects when used in Express router chains that expect Promise<void>.
 * Casting through `unknown` to RequestHandler resolves this without
 * changing any runtime behaviour.
 */
export const cacheMiddleware = (redis: any, config: any): RequestHandler => {
  return _cacheMiddleware(redis, config) as unknown as RequestHandler;
};

/**
 * Type-safe wrapper for @periodic/titanium's rateLimit.
 * Same issue — return type needs narrowing to RequestHandler.
 */
export const rateLimit = (config: any): RequestHandler => {
  return _rateLimit(config) as unknown as RequestHandler;
};
