import { expect } from '@jest/globals';
import { HomeController } from '../../src/home/home.controller.js';

describe('HomeController', () => {
  const controller = new HomeController();

  test('serves a complete HTML document', () => {
    const html = controller.getHome();
    expect(html.startsWith('<!doctype html>')).toBe(true);
    expect(html.trimEnd().endsWith('</html>')).toBe(true);
    expect(html).toContain('<title>Railcross');
  });

  test('includes the social and SEO metadata', () => {
    const html = controller.getHome();
    expect(html).toContain('rel="canonical"');
    expect(html).toContain('property="og:title"');
    expect(html).toContain('property="og:image"');
    expect(html).toContain('name="twitter:card"');
    expect(html).toContain('application/ld+json');
  });
});

describe('HomeController og.png', () => {
  const controller = new HomeController();

  test('serves the share card as PNG bytes', () => {
    const png = controller.getOgImage();
    expect(Buffer.isBuffer(png)).toBe(true);
    expect(png.subarray(1, 4).toString()).toBe('PNG');
  });

  test('lets other sites embed the share card', () => {
    const headers: Array<{ name: string; value: string }> = Reflect.getMetadata(
      '__headers__',
      HomeController.prototype.getOgImage,
    );
    expect(headers).toContainEqual({
      name: 'Cross-Origin-Resource-Policy',
      value: 'cross-origin',
    });
    expect(headers).toContainEqual({
      name: 'Content-Type',
      value: 'image/png',
    });
  });
});
