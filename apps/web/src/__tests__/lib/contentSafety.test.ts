/**
 * Content safety + input validation — emailValidation and profanityFilter.
 * These gate signup (disposable emails) and review moderation (abuse/spam).
 */
import { isDisposableEmail, isValidEmailFormat } from '@/lib/emailValidation';
import { checkContent } from '@/lib/profanityFilter';

describe('emailValidation', () => {
  it('accepts normal addresses', () => {
    expect(isValidEmailFormat('ashok@example.com')).toBe(true);
    expect(isDisposableEmail('ashok@example.com')).toBe(false);
  });

  it('blocks disposable domains (case-insensitive)', () => {
    expect(isDisposableEmail('x@mailinator.com')).toBe(true);
    expect(isDisposableEmail('x@MAILINATOR.COM')).toBe(true);
    expect(isDisposableEmail('x@yopmail.com')).toBe(true);
  });

  it('rejects malformed formats', () => {
    for (const bad of ['no-at-sign', 'a@b', 'a b@c.com', 'a@b .com', '@x.com', 'a@.c']) {
      expect(isValidEmailFormat(bad)).toBe(false);
    }
  });

  it('handles missing domain without throwing', () => {
    expect(isDisposableEmail('nodomain')).toBe(false);
  });
});

describe('profanityFilter', () => {
  it('passes clean review text', () => {
    expect(checkContent('Great quiz, learned a lot about VPC peering!').flagged).toBe(false);
  });

  it('passes empty/whitespace text', () => {
    expect(checkContent('').flagged).toBe(false);
    expect(checkContent('   ').flagged).toBe(false);
  });

  it('flags blocklisted words', () => {
    expect(checkContent('this is shit').flagged).toBe(true);
  });

  it('flags leet-speak evasion (sh1t / f0ck patterns)', () => {
    expect(checkContent('this is sh1t').flagged).toBe(true);
  });

  it('flags repeated-char evasion (shiiiit)', () => {
    expect(checkContent('shiiiit').flagged).toBe(true);
  });

  it('flags multi-word abusive phrases', () => {
    const r = checkContent('you should kill yourself');
    expect(r.flagged).toBe(true);
    expect(r.reason).toMatch(/phrase/i);
  });

  it('flags external links as spam', () => {
    expect(checkContent('check out https://spam.example.com').flagged).toBe(true);
    expect(checkContent('visit www.spam.example').flagged).toBe(true);
  });

  it('flags ALL-CAPS shouting over 20 chars', () => {
    expect(checkContent('THIS APP IS TERRIBLE AND I HATE EVERYTHING').flagged).toBe(true);
  });

  it('does not flag short acronym-heavy text (AWS EC2 S3)', () => {
    expect(checkContent('AWS EC2 S3 VPC').flagged).toBe(false);
  });
});
