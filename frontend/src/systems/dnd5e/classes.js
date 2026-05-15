export const DND5E_RACES = [
  { label: "Dragonborn", slug: "dragonborn" },
  { label: "Anão",       slug: "dwarf" },
  { label: "Elfo",       slug: "elf" },
  { label: "Gnomo",      slug: "gnome" },
  { label: "Meio-Elfo",  slug: "half-elf" },
  { label: "Meio-Orc",   slug: "half-orc" },
  { label: "Halfling",   slug: "halfling" },
  { label: "Humano",          slug: "human" },
  { label: "Humano Variante", slug: "human-variant" },
  { label: "Tiefling",        slug: "tiefling" },
];

export function findRaceSlug(input) {
  if (!input) return null;
  const low = input.toLowerCase().trim();
  return DND5E_RACES.find((r) => r.label.toLowerCase() === low || r.slug === low)?.slug ?? null;
}

export const DND5E_BACKGROUNDS = [
  { label: "Acólito",          slug: "acolyte" },
  { label: "Charlatão",        slug: "charlatan" },
  { label: "Criminal",         slug: "criminal" },
  { label: "Artista",          slug: "entertainer" },
  { label: "Herói do Povo",    slug: "folk-hero" },
  { label: "Artesão de Guilda", slug: "guild-artisan" },
  { label: "Eremita",          slug: "hermit" },
  { label: "Nobre",            slug: "noble" },
  { label: "Forasteiro",       slug: "outlander" },
  { label: "Sábio",            slug: "sage" },
  { label: "Marinheiro",       slug: "sailor" },
  { label: "Soldado",          slug: "soldier" },
  { label: "Pivete",           slug: "urchin" },
];

export function findBackgroundSlug(input) {
  if (!input) return null;
  const low = input.toLowerCase().trim();
  return DND5E_BACKGROUNDS.find((b) => b.label.toLowerCase() === low || b.slug === low)?.slug ?? null;
}

export const DND5E_CLASSES = [
  { label: "Artífice",    slug: "artificer" },
  { label: "Bárbaro",     slug: "barbarian" },
  { label: "Bardo",       slug: "bard" },
  { label: "Clérigo",     slug: "cleric" },
  { label: "Druida",      slug: "druid" },
  { label: "Guerreiro",   slug: "fighter" },
  { label: "Monge",       slug: "monk" },
  { label: "Paladino",    slug: "paladin" },
  { label: "Patrulheiro", slug: "ranger" },
  { label: "Ladino",      slug: "rogue" },
  { label: "Feiticeiro",  slug: "sorcerer" },
  { label: "Bruxo",       slug: "warlock" },
  { label: "Mago",        slug: "wizard" },
];

export function findClassSlug(input) {
  if (!input) return null;
  const low = input.toLowerCase().trim();
  const match = DND5E_CLASSES.find(
    (c) => c.label.toLowerCase() === low || c.slug === low
  );
  return match?.slug ?? null;
}
