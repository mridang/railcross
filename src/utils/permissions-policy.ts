import type { NextFunction, Request, Response } from 'express';

/**
 * Every browser feature the OWASP Secure Headers Project lists, switched off with an
 * empty allowlist. Railcross has no copy button, so clipboard-write is off too, and
 * interest-cohort stays off. The shared defaults library only covers six features.
 */
export const PERMISSIONS_POLICY =
  'accelerometer=(), autoplay=(), camera=(), clipboard-read=(), clipboard-write=(), cross-origin-isolated=(), display-capture=(), encrypted-media=(), fullscreen=(), gamepad=(), geolocation=(), gyroscope=(), hid=(), idle-detection=(), interest-cohort=(), keyboard-map=(), magnetometer=(), microphone=(), midi=(), payment=(), picture-in-picture=(), publickey-credentials-get=(), screen-wake-lock=(), serial=(), sync-xhr=(), unload=(), usb=(), web-share=(), xr-spatial-tracking=()';

/** Replaces the library's shorter Permissions-Policy with the full one. */
export function permissionsPolicy(
  _req: Request,
  res: Response,
  next: NextFunction,
): void {
  res.setHeader('Permissions-Policy', PERMISSIONS_POLICY);
  next();
}
