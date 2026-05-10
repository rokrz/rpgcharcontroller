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

export function findClassSlug(input) {
  if (!input) return null;
  const low = input.toLowerCase().trim();
  const match = DH_CLASSES.find(
    (c) => c.label.toLowerCase() === low || c.slug.toLowerCase() === low
  );
  return match?.slug ?? null;
}
