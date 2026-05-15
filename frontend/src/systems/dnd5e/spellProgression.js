// Maximum spell slot level available by class and character level.
// Returns 0 for non-spellcasters. Warlock uses Pact Magic slots (max 5th).
const FULL_CASTERS = ["wizard", "sorcerer", "cleric", "druid", "bard"];
const HALF_CASTERS = ["paladin", "ranger"];
const THIRD_CASTERS_ROGUE = ["rogue"]; // Arcane Trickster only from L3
const THIRD_CASTERS_FIGHTER = ["fighter"]; // Eldritch Knight only from L3

function fullCasterMax(level) {
  if (level >= 17) return 9;
  if (level >= 15) return 8;
  if (level >= 13) return 7;
  if (level >= 11) return 6;
  if (level >= 9)  return 5;
  if (level >= 7)  return 4;
  if (level >= 5)  return 3;
  if (level >= 3)  return 2;
  if (level >= 1)  return 1;
  return 0;
}

function halfCasterMax(level) {
  if (level >= 17) return 5;
  if (level >= 13) return 4;
  if (level >= 9)  return 3;
  if (level >= 5)  return 2;
  if (level >= 2)  return 1;
  return 0;
}

function thirdCasterMax(level) {
  if (level >= 19) return 4;
  if (level >= 13) return 3;
  if (level >= 7)  return 2;
  if (level >= 3)  return 1;
  return 0;
}

function warlockMax(level) {
  if (level >= 9)  return 5;
  if (level >= 7)  return 4;
  if (level >= 5)  return 3;
  if (level >= 3)  return 2;
  if (level >= 1)  return 1;
  return 0;
}

export function isCaster(classSlug) {
  return getMaxSpellLevel(classSlug, 1) > 0;
}

export function getMaxSpellLevel(classSlug, level) {
  if (!classSlug || !level) return 0;
  const slug = classSlug.toLowerCase();
  if (slug === "warlock") return warlockMax(level);
  if (FULL_CASTERS.includes(slug)) return fullCasterMax(level);
  if (HALF_CASTERS.includes(slug)) return halfCasterMax(level);
  if (THIRD_CASTERS_ROGUE.includes(slug)) return thirdCasterMax(level);
  if (THIRD_CASTERS_FIGHTER.includes(slug)) return thirdCasterMax(level);
  return 0;
}

// Canonical PHB spell slot tables. Returns [s1,s2,...,s9] for each slot level.
// Full-caster (PHB Table: Spell Slots per Spell Level)
const FULL_SLOTS = [
  //  1  2  3  4  5  6  7  8  9
  [   2, 0, 0, 0, 0, 0, 0, 0, 0 ], // 1
  [   3, 0, 0, 0, 0, 0, 0, 0, 0 ], // 2
  [   4, 2, 0, 0, 0, 0, 0, 0, 0 ], // 3
  [   4, 3, 0, 0, 0, 0, 0, 0, 0 ], // 4
  [   4, 3, 2, 0, 0, 0, 0, 0, 0 ], // 5
  [   4, 3, 3, 0, 0, 0, 0, 0, 0 ], // 6
  [   4, 3, 3, 1, 0, 0, 0, 0, 0 ], // 7
  [   4, 3, 3, 2, 0, 0, 0, 0, 0 ], // 8
  [   4, 3, 3, 3, 1, 0, 0, 0, 0 ], // 9
  [   4, 3, 3, 3, 2, 0, 0, 0, 0 ], // 10
  [   4, 3, 3, 3, 2, 1, 0, 0, 0 ], // 11
  [   4, 3, 3, 3, 2, 1, 0, 0, 0 ], // 12
  [   4, 3, 3, 3, 2, 1, 1, 0, 0 ], // 13
  [   4, 3, 3, 3, 2, 1, 1, 0, 0 ], // 14
  [   4, 3, 3, 3, 2, 1, 1, 1, 0 ], // 15
  [   4, 3, 3, 3, 2, 1, 1, 1, 0 ], // 16
  [   4, 3, 3, 3, 2, 1, 1, 1, 1 ], // 17
  [   4, 3, 3, 3, 3, 1, 1, 1, 1 ], // 18
  [   4, 3, 3, 3, 3, 2, 1, 1, 1 ], // 19
  [   4, 3, 3, 3, 3, 2, 2, 1, 1 ], // 20
];

const HALF_SLOTS = [
  //  1  2  3  4  5  6  7  8  9
  [   0, 0, 0, 0, 0, 0, 0, 0, 0 ], // 1
  [   2, 0, 0, 0, 0, 0, 0, 0, 0 ], // 2
  [   3, 0, 0, 0, 0, 0, 0, 0, 0 ], // 3
  [   3, 0, 0, 0, 0, 0, 0, 0, 0 ], // 4
  [   4, 2, 0, 0, 0, 0, 0, 0, 0 ], // 5
  [   4, 2, 0, 0, 0, 0, 0, 0, 0 ], // 6
  [   4, 3, 0, 0, 0, 0, 0, 0, 0 ], // 7
  [   4, 3, 0, 0, 0, 0, 0, 0, 0 ], // 8
  [   4, 3, 2, 0, 0, 0, 0, 0, 0 ], // 9
  [   4, 3, 2, 0, 0, 0, 0, 0, 0 ], // 10
  [   4, 3, 3, 0, 0, 0, 0, 0, 0 ], // 11
  [   4, 3, 3, 0, 0, 0, 0, 0, 0 ], // 12
  [   4, 3, 3, 1, 0, 0, 0, 0, 0 ], // 13
  [   4, 3, 3, 1, 0, 0, 0, 0, 0 ], // 14
  [   4, 3, 3, 2, 0, 0, 0, 0, 0 ], // 15
  [   4, 3, 3, 2, 0, 0, 0, 0, 0 ], // 16
  [   4, 3, 3, 3, 1, 0, 0, 0, 0 ], // 17
  [   4, 3, 3, 3, 1, 0, 0, 0, 0 ], // 18
  [   4, 3, 3, 3, 2, 0, 0, 0, 0 ], // 19
  [   4, 3, 3, 3, 2, 0, 0, 0, 0 ], // 20
];

const THIRD_SLOTS = [
  //  1  2  3  4  5  6  7  8  9
  [   0, 0, 0, 0, 0, 0, 0, 0, 0 ], // 1
  [   0, 0, 0, 0, 0, 0, 0, 0, 0 ], // 2
  [   2, 0, 0, 0, 0, 0, 0, 0, 0 ], // 3
  [   3, 0, 0, 0, 0, 0, 0, 0, 0 ], // 4
  [   3, 0, 0, 0, 0, 0, 0, 0, 0 ], // 5
  [   3, 0, 0, 0, 0, 0, 0, 0, 0 ], // 6
  [   4, 2, 0, 0, 0, 0, 0, 0, 0 ], // 7
  [   4, 2, 0, 0, 0, 0, 0, 0, 0 ], // 8
  [   4, 2, 0, 0, 0, 0, 0, 0, 0 ], // 9
  [   4, 3, 0, 0, 0, 0, 0, 0, 0 ], // 10
  [   4, 3, 0, 0, 0, 0, 0, 0, 0 ], // 11
  [   4, 3, 0, 0, 0, 0, 0, 0, 0 ], // 12
  [   4, 3, 2, 0, 0, 0, 0, 0, 0 ], // 13
  [   4, 3, 2, 0, 0, 0, 0, 0, 0 ], // 14
  [   4, 3, 2, 0, 0, 0, 0, 0, 0 ], // 15
  [   4, 3, 3, 0, 0, 0, 0, 0, 0 ], // 16
  [   4, 3, 3, 0, 0, 0, 0, 0, 0 ], // 17
  [   4, 3, 3, 0, 0, 0, 0, 0, 0 ], // 18
  [   4, 3, 3, 1, 0, 0, 0, 0, 0 ], // 19
  [   4, 3, 3, 1, 0, 0, 0, 0, 0 ], // 20
];

// Warlock uses Pact Magic slots (1 type, scales in level and count)
const WARLOCK_SLOTS = [
  // [slotLevel, count]
  [1, 1], [1, 2], [2, 2], [2, 2], [3, 2],
  [3, 2], [4, 2], [4, 2], [5, 2], [5, 2],
  [5, 3], [5, 3], [5, 3], [5, 3], [5, 3],
  [5, 3], [5, 4], [5, 4], [5, 4], [5, 4],
];

// Returns slot counts as { 1: n, 2: n, ..., 9: n } for a class at a given level.
// Returns null for non-casters or when class is not recognized.
export function getSlotsByLevel(classSlug, level) {
  if (!classSlug || !level) return null;
  const slug = classSlug.toLowerCase();
  const idx = Math.min(Math.max(1, level), 20) - 1;

  if (slug === "warlock") {
    const [slotLvl, count] = WARLOCK_SLOTS[idx];
    const slots = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 };
    slots[slotLvl] = count;
    return slots;
  }

  let table = null;
  if (FULL_CASTERS.includes(slug)) table = FULL_SLOTS;
  else if (HALF_CASTERS.includes(slug)) table = HALF_SLOTS;
  else if (THIRD_CASTERS_ROGUE.includes(slug) || THIRD_CASTERS_FIGHTER.includes(slug)) table = THIRD_SLOTS;
  if (!table) return null;

  const row = table[idx];
  return { 1: row[0], 2: row[1], 3: row[2], 4: row[3], 5: row[4], 6: row[5], 7: row[6], 8: row[7], 9: row[8] };
}
