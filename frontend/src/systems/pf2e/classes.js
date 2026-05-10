export const PF2E_ANCESTRIES = [
  { label: "Anão",     slug: "dwarf" },
  { label: "Elfo",     slug: "elf" },
  { label: "Gnomo",    slug: "gnome" },
  { label: "Goblin",   slug: "goblin" },
  { label: "Halfling", slug: "halfling" },
  { label: "Humano",   slug: "human" },
  { label: "Leshy",    slug: "leshy" },
  { label: "Orc",      slug: "orc" },
];

export const PF2E_BACKGROUNDS = [
  { label: "Acólito",    slug: "acolyte" },
  { label: "Acrobata",   slug: "acrobat" },
  { label: "Caçador",    slug: "hunter" },
  { label: "Camponês",   slug: "farmhand" },
  { label: "Criminoso",  slug: "criminal" },
  { label: "Eremita",    slug: "hermit" },
  { label: "Estudante",  slug: "scholar" },
  { label: "Gladiador",  slug: "gladiator" },
  { label: "Marinheiro", slug: "sailor" },
  { label: "Nobre",      slug: "noble" },
  { label: "Nômade",     slug: "nomad" },
];

export const PF2E_CLASSES = [
  { label: "Alquimista", slug: "alchemist" },
  { label: "Bárbaro",    slug: "barbarian" },
  { label: "Bardo",      slug: "bard" },
  { label: "Campeão",    slug: "champion" },
  { label: "Clérigo",    slug: "cleric" },
  { label: "Druida",     slug: "druid" },
  { label: "Guerreiro",  slug: "fighter" },
  { label: "Monge",      slug: "monk" },
  { label: "Patrulheiro", slug: "ranger" },
  { label: "Ladino",     slug: "rogue" },
  { label: "Feiticeiro", slug: "sorcerer" },
  { label: "Mago",       slug: "wizard" },
];

export function findClassSlug(input) {
  if (!input) return null;
  const low = input.toLowerCase().trim();
  const match = PF2E_CLASSES.find(
    (c) => c.label.toLowerCase() === low || c.slug === low
  );
  return match?.slug ?? null;
}
