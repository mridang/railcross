/**
 * @file Tests that the compiled stylesheet ships with the app.
 */
import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { describe, expect, it } from '@jest/globals';

const css = await readFile(
  path.join(process.cwd(), 'src', 'styles', 'app.css'),
  'utf8',
);

/** The rule that gives every clickable control a pointer cursor. */
const CURSOR_RULE_PATTERN =
  /(button:not\(:disabled\),[^{]*)\{\s*cursor: pointer;/u;

/** A button rule that is not left alone when its control is disabled. */
const UNDISABLED_BUTTON_PATTERN = /(^|,)\s*button,/u;

describe('app.css', () => {
  describe('cursor', () => {
    const rule = CURSOR_RULE_PATTERN.exec(css)?.[1];

    it('is the pointer for anything clickable, since Tailwind 4 no longer gives buttons one', () => {
      for (const selector of [
        'button:not(:disabled)',
        'summary',
        'select:not(:disabled)',
      ]) {
        expect(rule).toContain(selector);
      }
      expect(rule).toContain("[role='button']");
    });

    it('is left alone for disabled controls', () => {
      expect(rule).not.toMatch(UNDISABLED_BUTTON_PATTERN);
      expect(rule).toContain(':not(:disabled)');
    });
  });
});
