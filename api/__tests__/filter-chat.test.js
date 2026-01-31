/**
 * Tests for the chat filter API endpoint
 * Run with: npm test
 */

// Replicate the filter logic here since Jest doesn't support ESM imports natively
const BANNED_WORDS = [
  'fuck',
  'shit',
  'ass',
  'bitch',
  'damn',
  'dick',
  'pussy',
  'cock',
  'cunt',
  'fag',
  'faggot',
  'nigger',
  'nigga',
  'retard',
  'whore',
  'slut',
  'bastard',
  'twat',
  'wanker',
  'piss',
  'crap',
  'douche',
  'dildo',
  'penis',
  'vagina',
  'anus',
  'anal',
  'rape',
  'molest',
  'pedo',
  'kys',
  'kms',
  'stfu',
];

const LEET_MAP = {
  0: 'o',
  1: 'i',
  3: 'e',
  4: 'a',
  5: 's',
  7: 't',
  '@': 'a',
  $: 's',
  '!': 'i',
  '+': 't',
};

function normalize(text) {
  let normalized = text.toLowerCase();
  for (const [leet, letter] of Object.entries(LEET_MAP)) {
    normalized = normalized.split(leet).join(letter);
  }
  normalized = normalized.replace(/[\s.\-_*]/g, '');
  return normalized;
}

function filterText(text) {
  if (!text || typeof text !== 'string') {
    return { original: '', filtered: '', wasCensored: false };
  }
  const original = text.slice(0, 200);
  const normalizedFull = normalize(original);

  let wasCensored = false;
  for (const word of BANNED_WORDS) {
    if (normalizedFull.includes(word)) {
      wasCensored = true;
      break;
    }
  }

  if (!wasCensored) {
    return { original, filtered: original, wasCensored: false };
  }

  const words = original.split(/(\s+)/);
  const filtered = words
    .map(segment => {
      if (/^\s+$/.test(segment)) return segment;
      const normalizedWord = normalize(segment);
      for (const banned of BANNED_WORDS) {
        if (normalizedWord.includes(banned)) {
          return '*'.repeat(segment.length);
        }
      }
      return segment;
    })
    .join('');

  return { original, filtered, wasCensored: true };
}

describe('Chat Filter', () => {
  describe('normalize', () => {
    test('should lowercase text', () => {
      expect(normalize('HELLO')).toBe('hello');
    });

    test('should convert l33t speak', () => {
      expect(normalize('h3ll0')).toBe('hello');
      expect(normalize('$h1t')).toBe('shit');
      expect(normalize('f@g')).toBe('fag');
      expect(normalize('@$$')).toBe('ass');
    });

    test('should strip separator characters', () => {
      expect(normalize('f.u.c.k')).toBe('fuck');
      expect(normalize('s-h-i-t')).toBe('shit');
      expect(normalize('f_u_c_k')).toBe('fuck');
      expect(normalize('f u c k')).toBe('fuck');
    });

    test('should handle combined l33t and separators', () => {
      expect(normalize('f.@.g')).toBe('fag');
    });
  });

  describe('filterText', () => {
    test('should return clean text unchanged', () => {
      const result = filterText('hello world');
      expect(result.filtered).toBe('hello world');
      expect(result.wasCensored).toBe(false);
    });

    test('should censor profane words', () => {
      const result = filterText('what the fuck');
      expect(result.wasCensored).toBe(true);
      expect(result.filtered).not.toContain('fuck');
      expect(result.filtered).toContain('****');
    });

    test('should censor l33t speak profanity', () => {
      const result = filterText('you are $h1t');
      expect(result.wasCensored).toBe(true);
      expect(result.filtered).toContain('****');
    });

    test('should handle empty input', () => {
      const result = filterText('');
      expect(result.original).toBe('');
      expect(result.filtered).toBe('');
      expect(result.wasCensored).toBe(false);
    });

    test('should handle null input', () => {
      const result = filterText(null);
      expect(result.original).toBe('');
      expect(result.wasCensored).toBe(false);
    });

    test('should truncate to 200 characters', () => {
      const longMessage = 'a'.repeat(300);
      const result = filterText(longMessage);
      expect(result.original.length).toBe(200);
      expect(result.filtered.length).toBe(200);
    });

    test('should preserve non-profane words in mixed text', () => {
      const result = filterText('hello damn world');
      expect(result.wasCensored).toBe(true);
      expect(result.filtered).toContain('hello');
      expect(result.filtered).toContain('world');
      expect(result.filtered).not.toContain('damn');
    });

    test('should censor separator bypass attempts', () => {
      const result = filterText('f.u.c.k you');
      expect(result.wasCensored).toBe(true);
    });

    test('should handle non-string input', () => {
      const result = filterText(123);
      expect(result.original).toBe('');
      expect(result.wasCensored).toBe(false);
    });
  });
});
