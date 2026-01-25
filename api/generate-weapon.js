import Anthropic from '@anthropic-ai/sdk';

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { ownedWeapons, playerLevel, preferredType } = req.body;

        const anthropic = new Anthropic({
            apiKey: process.env.ANTHROPIC_API_KEY
        });

        const weaponPrompt = `You are a game designer creating unique weapons for ShatterRealms, a fantasy combat game.

The player already owns these weapons: ${JSON.stringify(ownedWeapons || [])}
Player level/progress: ${playerLevel || 1}
Preferred weapon type (optional): ${preferredType || 'any'}

Create a NEW unique weapon that doesn't exist yet. Be creative with fantasy/sci-fi themes.

Weapon types available: weapon (melee), ranged, ability

Respond with ONLY a JSON object in this exact format:
{
    "id": "unique_snake_case_id",
    "name": "Display Name",
    "icon": "single emoji",
    "type": "weapon|ranged|ability",
    "damage": 15-100,
    "cooldown": 200-3000,
    "energy": 0-30,
    "desc": "Short description under 50 chars",
    "price": 100-5000,
    "rarity": "common|uncommon|rare|epic|legendary",
    "special": "optional special effect description"
}

Make it balanced but interesting. Higher rarity = higher stats and price.`;

        const response = await anthropic.messages.create({
            model: 'claude-3-haiku-20240307',
            max_tokens: 300,
            messages: [{ role: 'user', content: weaponPrompt }]
        });

        let weaponData;
        try {
            const responseText = response.content[0].text.trim();
            // Extract JSON from response
            const jsonMatch = responseText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                weaponData = JSON.parse(jsonMatch[0]);
            } else {
                throw new Error('No JSON found');
            }
        } catch (e) {
            // Fallback weapon if parsing fails
            weaponData = {
                id: 'mystery_blade_' + Date.now(),
                name: 'Mystery Blade',
                icon: '🗡️',
                type: 'weapon',
                damage: 25,
                cooldown: 500,
                energy: 0,
                desc: 'A blade shrouded in mystery',
                price: 500,
                rarity: 'uncommon',
                special: 'Randomly generated'
            };
        }

        // Validate and sanitize the weapon data
        weaponData.id = weaponData.id || 'generated_' + Date.now();
        weaponData.damage = Math.min(100, Math.max(15, weaponData.damage || 20));
        weaponData.cooldown = Math.min(3000, Math.max(200, weaponData.cooldown || 500));
        weaponData.energy = Math.min(30, Math.max(0, weaponData.energy || 0));
        weaponData.price = Math.min(5000, Math.max(100, weaponData.price || 500));

        return res.status(200).json({
            success: true,
            weapon: weaponData
        });

    } catch (error) {
        console.error('Weapon Generation Error:', error);
        return res.status(500).json({ error: 'Failed to generate weapon' });
    }
}
