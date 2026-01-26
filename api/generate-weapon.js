// Procedural weapon generation without AI dependency
import { setCorsHeaders, handleOptions } from './_lib/cors.js';

const weaponPrefixes = [
    'Ancient', 'Blazing', 'Crystal', 'Dark', 'Enchanted', 'Frozen', 'Golden',
    'Holy', 'Infernal', 'Jade', 'Kraken', 'Lightning', 'Mystic', 'Nether',
    'Obsidian', 'Phantom', 'Radiant', 'Shadow', 'Thunder', 'Void', 'Wicked',
    'Zealous', 'Celestial', 'Demonic', 'Ethereal', 'Spectral', 'Cursed'
];

const weaponTypes = {
    weapon: [
        { base: 'Blade', icon: '🗡️', damage: [20, 35], cooldown: [400, 600] },
        { base: 'Axe', icon: '🪓', damage: [25, 40], cooldown: [600, 800] },
        { base: 'Hammer', icon: '🔨', damage: [30, 50], cooldown: [800, 1000] },
        { base: 'Scythe', icon: '🔪', damage: [28, 45], cooldown: [500, 700] },
        { base: 'Katana', icon: '⚔️', damage: [22, 38], cooldown: [350, 500] },
        { base: 'Mace', icon: '🏏', damage: [26, 42], cooldown: [550, 750] },
        { base: 'Glaive', icon: '🔱', damage: [24, 40], cooldown: [450, 650] },
        { base: 'Claymore', icon: '🗡️', damage: [35, 55], cooldown: [900, 1200] }
    ],
    ranged: [
        { base: 'Bow', icon: '🏹', damage: [18, 30], cooldown: [600, 900] },
        { base: 'Crossbow', icon: '🎯', damage: [25, 40], cooldown: [800, 1100] },
        { base: 'Throwing Stars', icon: '✴️', damage: [12, 22], cooldown: [200, 400] },
        { base: 'Javelin', icon: '🎋', damage: [28, 45], cooldown: [1000, 1400] },
        { base: 'Cannon', icon: '💥', damage: [40, 60], cooldown: [1500, 2000] }
    ],
    ability: [
        { base: 'Blast', icon: '💫', damage: [30, 50], cooldown: [1000, 1500], energy: [10, 20] },
        { base: 'Storm', icon: '🌪️', damage: [35, 55], cooldown: [1200, 1800], energy: [15, 25] },
        { base: 'Nova', icon: '✨', damage: [40, 65], cooldown: [1500, 2200], energy: [20, 30] },
        { base: 'Beam', icon: '⚡', damage: [25, 42], cooldown: [800, 1200], energy: [8, 15] },
        { base: 'Orb', icon: '🔮', damage: [22, 38], cooldown: [600, 1000], energy: [5, 12] }
    ]
};

const rarities = [
    { name: 'common', weight: 40, multiplier: 1.0, priceBase: 100 },
    { name: 'uncommon', weight: 30, multiplier: 1.2, priceBase: 250 },
    { name: 'rare', weight: 18, multiplier: 1.5, priceBase: 500 },
    { name: 'epic', weight: 9, multiplier: 1.8, priceBase: 1000 },
    { name: 'legendary', weight: 3, multiplier: 2.2, priceBase: 2500 }
];

const specialEffects = [
    'Burns enemies on hit',
    'Freezes targets briefly',
    'Chains to nearby enemies',
    'Life steal on hit',
    'Knockback effect',
    'Armor piercing',
    'Critical hit bonus',
    'Poisons enemies',
    'Stuns on critical',
    'Area damage',
    'Heals on kill',
    'Speed boost on hit'
];

function random(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickRarity() {
    const totalWeight = rarities.reduce((sum, r) => sum + r.weight, 0);
    let roll = Math.random() * totalWeight;
    for (const rarity of rarities) {
        roll -= rarity.weight;
        if (roll <= 0) return rarity;
    }
    return rarities[0];
}

function generateWeapon(preferredType) {
    // Pick type
    const types = ['weapon', 'ranged', 'ability'];
    const type = preferredType && types.includes(preferredType) ? preferredType : types[random(0, 2)];

    // Pick base weapon
    const bases = weaponTypes[type];
    const base = bases[random(0, bases.length - 1)];

    // Pick rarity
    const rarity = pickRarity();

    // Pick prefix
    const prefix = weaponPrefixes[random(0, weaponPrefixes.length - 1)];

    // Generate stats
    const baseDamage = random(base.damage[0], base.damage[1]);
    const damage = Math.round(baseDamage * rarity.multiplier);
    const cooldown = random(base.cooldown[0], base.cooldown[1]);
    const energy = base.energy ? random(base.energy[0], base.energy[1]) : 0;
    const price = Math.round(rarity.priceBase * (1 + Math.random() * 0.5));

    // Generate ID
    const id = `${prefix.toLowerCase()}_${base.base.toLowerCase().replace(/\s+/g, '_')}_${Date.now().toString(36)}`;

    // Maybe add special effect for rare+
    let special = null;
    if (['rare', 'epic', 'legendary'].includes(rarity.name)) {
        special = specialEffects[random(0, specialEffects.length - 1)];
    }

    // Generate description
    const descriptions = [
        `A ${rarity.name} ${base.base.toLowerCase()} infused with ${prefix.toLowerCase()} power`,
        `${prefix} energy courses through this ${base.base.toLowerCase()}`,
        `Forged in ${prefix.toLowerCase()} flames, this ${base.base.toLowerCase()} deals ${damage} damage`,
        `This ${rarity.name} ${base.base.toLowerCase()} was blessed with ${prefix.toLowerCase()} magic`
    ];

    return {
        id,
        name: `${prefix} ${base.base}`,
        icon: base.icon,
        type,
        damage,
        cooldown,
        energy,
        desc: descriptions[random(0, descriptions.length - 1)].substring(0, 50),
        price,
        rarity: rarity.name,
        special
    };
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
        const { preferredType } = req.body;

        const weapon = generateWeapon(preferredType);

        return res.status(200).json({
            success: true,
            weapon
        });

    } catch (error) {
        console.error('Weapon Generation Error:', error);
        return res.status(500).json({ error: 'Failed to generate weapon' });
    }
}
