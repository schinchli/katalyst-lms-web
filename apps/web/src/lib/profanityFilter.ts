/**
 * Server-side profanity / abuse filter.
 *
 * Strategy:
 *   1. Exact word match against a blocklist (common slurs, hate speech, spam triggers)
 *   2. Leet-speak normalisation (3=e, 0=o, 1=i/l, @=a, $=s, etc.)
 *   3. Repeated-char collapse (shiiit → shit)
 *
 * Returns `{ flagged: false }` when clean, or
 * `{ flagged: true, reason: string }` when a violation is detected.
 *
 * This list is intentionally conservative — false positives go to the
 * admin moderation queue (status='pending') rather than being silently dropped.
 */

// Core blocklist — extend this in app_settings later if needed
const BLOCKLIST = new Set([
  // Profanity
  'fuck','shit','cunt','bitch','asshole','bastard','prick','twat','wanker',
  'cock','dick','pussy','faggot','nigger','nigga','chink','spic','kike',
  'whore','slut','retard',
  // Hate / violence
  'kill yourself','kys','go die','die bitch','rape','terrorist',
  // Spam patterns
  'click here','buy now','free money','make money fast','crypto giveaway',
  'onlyfans','only fans','sex chat','xxx',
  // Abuse at the platform
  'scam','fraud','fake quiz','garbage app','worst app','delete this',
]);

const LEET: Record<string, string> = {
  '3': 'e', '0': 'o', '1': 'i', '@': 'a', '$': 's', '!': 'i',
  '5': 's', '7': 't', '4': 'a', '+': 't',
};

function normalize(text: string): string {
  return text
    .toLowerCase()
    // collapse repeated chars (fuuuck → fuck)
    .replace(/(.)\1{2,}/g, '$1$1')
    // leet-speak
    .replace(/[30@$!574+1]/g, (c) => LEET[c] ?? c)
    // strip non-alpha (except spaces)
    .replace(/[^a-z\s]/g, ' ')
    // collapse whitespace
    .replace(/\s+/g, ' ')
    .trim();
}

export interface FilterResult {
  flagged: boolean;
  reason?: string;
}

export function checkContent(text: string): FilterResult {
  if (!text || text.trim().length === 0) {
    return { flagged: false };
  }

  const norm = normalize(text);
  const words = norm.split(/\s+/);

  // Exact single-word match
  for (const word of words) {
    if (BLOCKLIST.has(word)) {
      return { flagged: true, reason: `Blocked word detected` };
    }
  }

  // Multi-word phrase match
  for (const phrase of BLOCKLIST) {
    if (phrase.includes(' ') && norm.includes(phrase)) {
      return { flagged: true, reason: `Blocked phrase detected` };
    }
  }

  // URL spam detection
  if (/https?:\/\/|www\./i.test(text)) {
    return { flagged: true, reason: 'External links not permitted in reviews' };
  }

  // ALL CAPS abuse (more than 80% uppercase in a word sequence)
  const capsRatio = (text.replace(/\s/g, '').match(/[A-Z]/g) ?? []).length / Math.max(1, text.replace(/\s/g, '').length);
  if (capsRatio > 0.8 && text.length > 20) {
    return { flagged: true, reason: 'Excessive capitals — possible shouting/spam' };
  }

  return { flagged: false };
}
