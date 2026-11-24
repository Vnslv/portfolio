import { describe, expect, it } from 'vitest';
import { SITE_TITLE } from './site';

describe('site', () => {
  it('uses "portfolio" as the title until the owner supplies a name', () => {
    expect(SITE_TITLE).toBe('portfolio');
  });
});
