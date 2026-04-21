/**
 * Shared email validation utilities.
 * Disposable domain list blocks throwaway addresses at signup and sync-user.
 */

const DISPOSABLE_DOMAINS = new Set([
  'mailinator.com','guerrillamail.com','10minutemail.com','tempmail.com',
  'throwam.com','yopmail.com','sharklasers.com','guerrillamailblock.com',
  'grr.la','guerrillamail.info','guerrillamail.biz','guerrillamail.de',
  'guerrillamail.net','guerrillamail.org','spam4.me','trashmail.com',
  'trashmail.me','trashmail.net','trashmail.at','trashmail.io',
  'fakeinbox.com','mailnull.com','maildrop.cc','dispostable.com',
  'temp-mail.org','tempmail.net','throwaway.email','getnada.com',
  'mailnesia.com','spamgourmet.com','discard.email','filzmail.com',
  'owlpic.com','mintemail.com','moakt.com','mohmal.com','zetmail.com',
]);

export function isDisposableEmail(email: string): boolean {
  const domain = email.split('@')[1]?.toLowerCase() ?? '';
  return DISPOSABLE_DOMAINS.has(domain);
}

export function isValidEmailFormat(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
}
