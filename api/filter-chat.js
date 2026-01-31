import { setCorsHeaders, handleOptions } from './_lib/cors.js';

const MAX_MESSAGE_LENGTH = 200;

// Core word list - kept minimal and effective
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

// L33t speak character map
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

/**
 * Normalize a string by converting l33t speak and removing separators
 */
export function normalize(text) {
  let normalized = text.toLowerCase();

  // Replace l33t speak characters
  for (const [leet, letter] of Object.entries(LEET_MAP)) {
    normalized = normalized.split(leet).join(letter);
  }

  // Remove common separator bypass characters (dots, dashes, underscores, spaces between single chars)
  normalized = normalized.replace(/[\s.\-_*]/g, '');

  return normalized;
}

/**
 * Check if text contains banned words and censor them
 */
export function filterText(text) {
  if (!text || typeof text !== 'string') {
    return { original: '', filtered: '', wasCensored: false };
  }

  // Truncate to max length
  const original = text.slice(0, MAX_MESSAGE_LENGTH);
  const normalizedFull = normalize(original);

  let wasCensored = false;

  // Check normalized text against banned words
  for (const word of BANNED_WORDS) {
    if (normalizedFull.includes(word)) {
      wasCensored = true;
      break;
    }
  }

  if (!wasCensored) {
    return { original, filtered: original, wasCensored: false };
  }

  // Build censored version word-by-word
  const words = original.split(/(\s+)/);
  const filtered = words
    .map(segment => {
      // Preserve whitespace segments
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

export default async function handler(req, res) {
  setCorsHeaders(res);

  if (handleOptions(req, res)) {
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Missing or invalid message' });
    }

    const result = filterText(message);
    return res.status(200).json(result);
  } catch (error) {
    console.error('Filter chat error:', error);
    return res.status(500).json({ error: 'Filter processing failed' });
  }
}
