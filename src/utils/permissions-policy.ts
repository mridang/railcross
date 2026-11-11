/**
 * @file Middleware that sends a Permissions-Policy header switching off every browser feature.
 */
import type { NextFunction, Request, Response } from 'express';

/**
 * Every browser feature the OWASP Secure Headers Project lists, switched off with an
 * empty allowlist. Railcross has no copy button, so clipboard-write is off too, and
 * interest-cohort stays off. The shared defaults library only covers six features.
 */
export const PERMISSIONS_POLICY =
  'accelerometer=(), autoplay=(), camera=(), clipboard-read=(), clipboard-write=(), cross-origin-isolated=(), display-capture=(), encrypted-media=(), fullscreen=(), gamepad=(), geolocation=(), gyroscope=(), hid=(), idle-detection=(), interest-cohort=(), keyboard-map=(), magnetometer=(), microphone=(), midi=(), payment=(), picture-in-picture=(), publickey-credentials-get=(), screen-wake-lock=(), serial=(), sync-xhr=(), unload=(), usb=(), web-share=(), xr-spatial-tracking=()';

/**
 * Replaces the library's shorter Permissions-Policy header with the full one.
 * @param _req - The incoming request, which this middleware does not read.
 * @param res - The response that receives the header.
 * @param next - Callback that passes the request to the next handler.
 * @example
 * ```ts
 * app.use(permissionsPolicy);
 * ```
 */
export function permissionsPolicy(
  _req: Request,
  res: Response,
  next: NextFunction,
): void {
  res.setHeader('Permissions-Policy', PERMISSIONS_POLICY);
  next();
}
