export const DH_ANCESTRIES = [
  { label: "Clank",    slug: "Clank" },
  { label: "Anão",     slug: "Dwarf" },
  { label: "Elfo",     slug: "Elf" },
  { label: "Fauno",    slug: "Faun" },
  { label: "Fungril",  slug: "Fungril" },
  { label: "Galapa",   slug: "Galapa" },
  { label: "Halfling", slug: "Halfling" },
  { label: "Humano",   slug: "Human" },
  { label: "Infernis", slug: "Infernis" },
  { label: "Katari",   slug: "Katari" },
  { label: "Orc",      slug: "Orc" },
  { label: "Ribbet",   slug: "Ribbet" },
  { label: "Simiah",   slug: "Simiah" },
];

export const DH_COMMUNITIES = [
  { label: "Cosmopolita",   slug: "Cosmopolitan" },
  { label: "Erudito",       slug: "Loreborne" },
  { label: "Nômade",        slug: "Nomadic" },
  { label: "Ordenado",      slug: "Orderborne" },
  { label: "Ridículo",      slug: "Ridiculous" },
  { label: "Marítimo",      slug: "Seaborne" },
  { label: "Astuto",        slug: "Slyborne" },
  { label: "Subterrâneo",   slug: "Underborne" },
  { label: "Errante",       slug: "Wanderborne" },
  { label: "Selvagem",      slug: "Wildborne" },
];

export const DH_CLASSES = [
  { label: "Bardo",      slug: "Bard" },
  { label: "Druida",     slug: "Druid" },
  { label: "Guardião",   slug: "Guardian" },
  { label: "Patrulheiro", slug: "Ranger" },
  { label: "Ladino",     slug: "Rogue" },
  { label: "Serafim",    slug: "Seraph" },
  { label: "Feiticeiro", slug: "Sorcerer" },
  { label: "Guerreiro",  slug: "Warrior" },
  { label: "Mago",       slug: "Wizard" },
];

export const DH_SUBCLASSES = {
  Bard:     [{ label: "Wordsmith",  slug: "wordsmith"  }, { label: "Performer",   slug: "performer"   }, { label: "Galvanist",  slug: "galvanist"  }],
  Druid:    [{ label: "Warden of the Crags",    slug: "warden-crags"    }, { label: "Warden of the Elements", slug: "warden-elements" }, { label: "Warden of Renewal", slug: "warden-renewal" }],
  Guardian: [{ label: "Stalwart",   slug: "stalwart"   }, { label: "Vengeance",   slug: "vengeance"   }, { label: "Winged Sentinel", slug: "winged-sentinel" }],
  Ranger:   [{ label: "Beastbound", slug: "beastbound" }, { label: "Wayfinder",   slug: "wayfinder"   }, { label: "Nightwalker", slug: "nightwalker" }],
  Rogue:    [{ label: "Nightsong",  slug: "nightsong"  }, { label: "Syndicate",   slug: "syndicate"   }, { label: "Scoundrel",  slug: "scoundrel"  }],
  Seraph:   [{ label: "Ardent",     slug: "ardent"     }, { label: "Nightsong",   slug: "seraph-nightsong" }, { label: "Winged Sentinel", slug: "seraph-winged" }],
  Sorcerer: [{ label: "Elemental Origin", slug: "elemental-origin" }, { label: "Emergent Magic", slug: "emergent-magic" }, { label: "Primal Origin", slug: "primal-origin" }],
  Warrior:  [{ label: "Call of the Slaughter", slug: "call-slaughter" }, { label: "Call of the Brave", slug: "call-brave" }, { label: "Call of the Iron", slug: "call-iron" }],
  Wizard:   [{ label: "School of Knowledge", slug: "school-knowledge" }, { label: "School of War", slug: "school-war" }, { label: "School of Arcana", slug: "school-arcana" }],
};

export function findClassSlug(input) {
  if (!input) return null;
  const low = input.toLowerCase().trim();
  const match = DH_CLASSES.find(
    (c) => c.label.toLowerCase() === low || c.slug.toLowerCase() === low
  );
  return match?.slug ?? null;
}
