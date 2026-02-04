/* global fetch */
import { setCorsHeaders, handleOptions } from './_lib/cors.js';

export default async function handler(req, res) {
  setCorsHeaders(res);

  if (handleOptions(req, res)) {
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { username } = req.body;

    if (!username || typeof username !== 'string') {
      return res.status(400).json({ valid: false, reason: 'Username is required.' });
    }

    const trimmed = username.trim();

    // Basic validation
    if (trimmed.length < 3 || trimmed.length > 20) {
      return res.status(200).json({ valid: false, reason: 'Username must be 3-20 characters.' });
    }

    if (!/^[a-zA-Z0-9_]+$/.test(trimmed)) {
      return res.status(200).json({
        valid: false,
        reason: 'Username can only contain letters, numbers, and underscores.',
      });
    }

    // Server-side profanity blocklist
    const blockedWords = [
      'admin',
      'moderator',
      'staff',
      'fuck',
      'shit',
      'ass',
      'dick',
      'cock',
      'pussy',
      'bitch',
      'nigger',
      'nigga',
      'faggot',
      'retard',
      'whore',
      'slut',
      'cunt',
      'porn',
      'sex',
      'rape',
      'nazi',
      'hitler',
      'kill',
      'murder',
      'suicide',
      'drug',
      'weed',
      'cocaine',
    ];
    const lower = trimmed.toLowerCase();
    const normalized = lower
      .replace(/0/g, 'o')
      .replace(/1/g, 'i')
      .replace(/3/g, 'e')
      .replace(/4/g, 'a')
      .replace(/5/g, 's')
      .replace(/7/g, 't')
      .replace(/@/g, 'a')
      .replace(/\$/g, 's');
    const hasBlocked = blockedWords.some(w => normalized.includes(w) || lower.includes(w));
    if (hasBlocked) {
      return res
        .status(200)
        .json({ valid: false, reason: 'Username contains inappropriate content.' });
    }

    // If Anthropic API key is set, use Claude to check appropriateness
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (apiKey) {
      try {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 150,
            messages: [
              {
                role: 'user',
                content: `You are a content moderator for a children's game called ShatterRealms. Check if this username is appropriate: "${trimmed}"

A username is INAPPROPRIATE if it:
- Contains profanity, slurs, or hate speech (even with letter substitutions like 0 for O, @ for A, etc.)
- References drugs, alcohol, violence, or sexual content
- Impersonates admin/moderator roles (e.g. "Admin", "Moderator", "Staff")
- Contains personal information patterns (emails, phone numbers)

Respond with ONLY a JSON object, no other text:
{"appropriate": true/false, "reason": "brief explanation"}`,
              },
            ],
          }),
        });

        if (response.ok) {
          const result = await response.json();
          const text = result.content[0].text.trim();
          const parsed = JSON.parse(text);

          if (!parsed.appropriate) {
            return res
              .status(200)
              .json({ valid: false, reason: parsed.reason || 'Username is not appropriate.' });
          }
        }
      } catch (_aiError) {
        // AI check failed - fall through to basic validation (fail open)
        console.error('AI username validation failed, using basic validation only');
      }
    }

    return res.status(200).json({ valid: true, reason: 'Username looks good!' });
  } catch (error) {
    console.error('Username validation error:', error);
    return res.status(500).json({ valid: false, reason: 'Validation service error.' });
  }
}
