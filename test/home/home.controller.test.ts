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
