import { Controller, Get, Header } from '@nestjs/common';
import { HOME_HTML } from './home.html.js';
import { OG_PNG_BASE64 } from './og-image.js';

/**
 * Serves the public marketing home page and its social-share assets.
 */
@Controller()
export class HomeController {
  /**
   * Return the home page as a complete HTML document.
   *
   * @returns The rendered HTML for `GET /`.
   */
  @Get()
  @Header('Content-Type', 'text/html; charset=utf-8')
  @Header('Cache-Control', 'public, max-age=300')
  getHome(): string {
    return HOME_HTML;
  }

  /**
   * Return the Open Graph / social-share card as a PNG.
   *
   * @returns The 1200×630 share image for `GET /og.png`.
   */
  @Get('og.png')
  @Header('Content-Type', 'image/png')
  @Header('Cross-Origin-Resource-Policy', 'cross-origin')
  @Header('Cache-Control', 'public, max-age=86400, immutable')
  getOgImage(): Buffer {
    return Buffer.from(OG_PNG_BASE64, 'base64');
  }
}
