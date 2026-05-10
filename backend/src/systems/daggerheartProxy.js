const DH_GRAPHQL = "https://daggerheart-srd-api.vercel.app/graphql";

async function searchDaggerheart(type, query) {
  if (type === "cards" || type === "domains") {
    return searchCards(query);
  }
  return [];
}

async function searchCards(query) {
  const gql = `
    query SearchCards($name: String) {
      classFeatures(filter: { name: $name }) {
        name
        class
        level
        type
        description
        mechanics
      }
    }
  `;

  try {
    const res = await fetch(DH_GRAPHQL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: gql, variables: { name: query || "" } }),
    });

    if (!res.ok) return fallbackCards(query);
    const json = await res.json();
    const items = json.data?.classFeatures || [];

    return items.slice(0, 20).map((item) => ({
      index: (item.name || "").toLowerCase().replace(/\s+/g, "-"),
      name: item.name,
      class: item.class,
      level: item.level,
      type: item.type,
      description: item.description,
      mechanics: item.mechanics,
    }));
  } catch {
    return fallbackCards(query);
  }
}

function fallbackCards(query) {
  const q = (query || "").toLowerCase();
  return SAMPLE_CARDS.filter((c) => !q || c.name.toLowerCase().includes(q)).slice(0, 10);
}

const SAMPLE_CARDS = [
  { index: "bravado", name: "Bravado", class: "Warrior", level: 1, type: "Foundation", description: "You gain +1 to attack rolls when outnumbered.", mechanics: "+1 attack when outnumbered." },
  { index: "second-wind", name: "Second Wind", class: "Warrior", level: 1, type: "Foundation", description: "Once per short rest, heal 1d6 + proficiency HP as a bonus action.", mechanics: "1d6+Prof HP, once per short rest." },
  { index: "precise-strike", name: "Precise Strike", class: "Rogue", level: 1, type: "Foundation", description: "Deal extra damage when you have advantage.", mechanics: "+2d6 damage with advantage." },
];

async function getClassCards(className) {
  const gql = `
    query ClassCards($class: String) {
      classFeatures(filter: { class: $class }) {
        name class level type description mechanics
      }
    }
  `;
  try {
    const res = await fetch(DH_GRAPHQL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: gql, variables: { class: className } }),
    });
    if (!res.ok) return SAMPLE_CARDS.filter((c) => c.class === className);
    const json = await res.json();
    const items = json.data?.classFeatures || [];
    if (items.length === 0) return SAMPLE_CARDS.filter((c) => c.class === className);
    return items.map((item) => ({
      index: (item.name || "").toLowerCase().replace(/\s+/g, "-"),
      name: item.name,
      class: item.class,
      level: item.level,
      type: item.type,
      description: item.description,
      mechanics: item.mechanics,
    }));
  } catch {
    return SAMPLE_CARDS.filter((c) => c.class === className);
  }
}

module.exports = { searchDaggerheart, getClassCards };
