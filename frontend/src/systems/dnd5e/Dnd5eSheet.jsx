import { useState, useEffect } from "react";
import { Plus, Trash2, ChevronDown, ChevronUp, Check } from "lucide-react";
import Card from "../../components/ui/Card.jsx";
import Button from "../../components/ui/Button.jsx";
import Input from "../../components/ui/Input.jsx";
import HPBar from "../../components/ui/HPBar.jsx";
import StatBox, { abilityMod, modStr } from "../../components/ui/StatBox.jsx";
import BrowserPanel from "../../components/browsers/BrowserPanel.jsx";
import ClassSuggestions from "../../components/ClassSuggestions.jsx";
import TraitInfoPanel from "../../components/TraitInfoPanel.jsx";
import { dnd5eApi } from "./api.js";
import { DND5E_ABILITIES, DND5E_SKILLS, calcProficiencyBonus, calcTotalLevel, joinSources } from "./schema.js";
import { getMaxSpellLevel, isCaster } from "./spellProgression.js";
import { DND5E_CLASSES, findClassSlug, DND5E_RACES, DND5E_BACKGROUNDS, findBackgroundSlug } from "./classes.js";
import { api } from "../../services/api.js";

function ComboField({ label, value, onChange, options }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const filtered = search
    ? options.filter(
        (c) =>
          c.label.toLowerCase().includes(search.toLowerCase()) ||
          (c.slug || "").toLowerCase().includes(search.toLowerCase())
      )
    : options;
  function handleSelect(c) { onChange(c.label); setSearch(""); setOpen(false); }
  function handleInput(e) { setSearch(e.target.value); onChange(e.target.value); setOpen(true); }
  function handleFocus() { setSearch(""); setOpen(true); }
  function handleBlur() { setTimeout(() => { setOpen(false); setSearch(""); }, 150); }
  return (
    <div className="relative">
      <Input
        label={label}
        value={open ? search : value}
        onChange={handleInput}
        onBlur={handleBlur}
        onFocus={handleFocus}
      />
      {open && filtered.length > 0 && (
        <div className="absolute z-10 top-full left-0 right-0 bg-parchment-deep border border-parchment-edge rounded-sheet shadow-page max-h-48 overflow-y-auto">
          {filtered.map((c) => (
            <button
              key={c.slug || c.label}
              onMouseDown={() => handleSelect(c)}
              className="w-full text-left px-3 py-1.5 text-sm font-serif text-ink hover:bg-parchment-edge/40 flex items-center justify-between gap-2"
            >
              <span>{c.label}</span>
              {c.source && <span className="text-xs text-ink/40 shrink-0">{c.source}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
function ComboClass({ value, onChange, classes }) {
  return <ComboField label="Classe" value={value} onChange={onChange} options={classes} />;
}

function SkillChoicePanel({ title, choose, options, appliedSkills, onApplySkill, onRemoveSkill }) {
  const selected = options.filter((o) => appliedSkills?.[o.key]);
  const maxReached = selected.length >= choose;
  return (
    <div className="border border-gold/20 bg-parchment-deep/40 rounded-sheet p-3 space-y-2">
      <div className="flex items-center justify-between">
        <p className="font-display text-[9px] uppercase tracking-widest text-ink-faded">{title}</p>
        <span className={`text-[9px] font-display tabular-nums ${maxReached ? "text-hp-healthy" : "text-ink-faded"}`}>
          {selected.length}/{choose}
        </span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {options.map((sk) => {
          const already = !!appliedSkills?.[sk.key];
          const disabled = !already && maxReached;
          return (
            <button
              key={sk.key}
              onClick={() => already ? onRemoveSkill?.(sk.key) : (!disabled && onApplySkill(sk.key))}
              disabled={disabled}
              title={already ? "Clique para remover" : maxReached ? "Limite atingido" : "Marcar perícia"}
              className={`flex items-center gap-1 text-xs font-serif px-2 py-0.5 rounded-sheet border transition ${
                already
                  ? "border-hp-healthy/40 text-hp-healthy hover:border-burgundy hover:text-burgundy"
                  : maxReached
                  ? "border-parchment-edge text-ink-faded cursor-not-allowed opacity-40"
                  : "border-parchment-edge text-ink hover:border-burgundy hover:text-burgundy"
              }`}
            >
              {already ? <Check size={10} /> : <Plus size={10} />}
              {sk.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}

const TABS = ["Identidade", "Atributos", "Combate", "Ataques", "Magias", "Equipamento", "Traços", "Personalidade"];

const ABILITY_LABELS = { str: "FOR", dex: "DES", con: "CON", int: "INT", wis: "SAB", cha: "CAR" };
const ABILITY_PT = { str: "Força", dex: "Destreza", con: "Constituição", int: "Inteligência", wis: "Sabedoria", cha: "Carisma" };

export default function Dnd5eSheet({ data, onUpdate }) {
  const [tab, setTab] = useState(0);
  const [browser, setBrowser] = useState(null);
  const [subclasses, setSubclasses] = useState([]);
  const [races, setRaces] = useState(DND5E_RACES);
  const [raceStatus, setRaceStatus] = useState({ loading: false, data: null });
  const [bgStatus, setBgStatus] = useState({ loading: false, data: null });
  const [classStatus, setClassStatus] = useState({ loading: false, data: null });
  const [mcSubclasses, setMcSubclasses] = useState({});

  const classSlug = findClassSlug(data.class);
  const bgSlug = findBackgroundSlug(data.background);
  const raceLow = (data.race || "").toLowerCase().trim();
  const raceSlug = races.find((r) => r.label.toLowerCase() === raceLow || r.slug === raceLow)?.slug
    ?? DND5E_RACES.find((r) => r.label.toLowerCase() === raceLow || r.slug === raceLow)?.slug
    ?? null;
  const subclassSlug = subclasses.find(
    (s) => s.label.toLowerCase() === (data.subclass || "").toLowerCase()
  )?.slug;

  useEffect(() => {
    api.fetchDetail("dnd5e", "racelist", "")
      .then((r) => {
        const list = (r.results || []).map((rc) => ({ label: rc.name, slug: rc.index, source: rc.source }));
        if (list.length > 0) setRaces(list);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!classSlug) { setSubclasses([]); return; }
    api.fetchDetail("dnd5e", "subclasses", classSlug)
      .then((r) => setSubclasses((r.results || []).map((s) => ({ label: s.name, slug: s.index, source: s.source }))))
      .catch(() => setSubclasses([]));
  }, [classSlug]);

  useEffect(() => {
    if (!classSlug) { setClassStatus({ loading: false, data: null }); return; }
    setClassStatus({ loading: true, data: null });
    api.fetchDetail("dnd5e", "classdetail", classSlug)
      .then((d) => setClassStatus({ loading: false, data: d }))
      .catch(() => setClassStatus({ loading: false, data: "error" }));
  }, [classSlug]);

  useEffect(() => {
    if (!raceSlug) { setRaceStatus({ loading: false, data: null }); return; }
    setRaceStatus({ loading: true, data: null });
    api.fetchDetail("dnd5e", "racedetail", raceSlug)
      .then((d) => setRaceStatus({ loading: false, data: d }))
      .catch(() => setRaceStatus({ loading: false, data: "error" }));
  }, [raceSlug]);

  useEffect(() => {
    if (!bgSlug) { setBgStatus({ loading: false, data: null }); return; }
    setBgStatus({ loading: true, data: null });
    api.fetchDetail("dnd5e", "backgrounddetail", bgSlug)
      .then((d) => setBgStatus({ loading: false, data: d }))
      .catch(() => setBgStatus({ loading: false, data: "error" }));
  }, [bgSlug]);

  useEffect(() => {
    for (const mc of data.multiclasses || []) {
      const slug = findClassSlug(mc.class);
      if (!slug || mcSubclasses[slug]) continue;
      api.fetchDetail("dnd5e", "subclasses", slug)
        .then((r) => setMcSubclasses((prev) => ({
          ...prev,
          [slug]: (r.results || []).map((s) => ({ label: s.name, slug: s.index, source: s.source })),
        })))
        .catch(() => {});
    }
  }, [data.multiclasses]);

  function addMc() {
    const next = structuredClone(data);
    next.multiclasses = [...(next.multiclasses || []), { class: "", subclass: "", level: 1 }];
    onUpdate(next);
  }

  function removeMc(i) {
    const next = structuredClone(data);
    next.multiclasses = next.multiclasses.filter((_, idx) => idx !== i);
    onUpdate(next);
  }

  function setMc(i, field, value) {
    const next = structuredClone(data);
    next.multiclasses[i] = { ...next.multiclasses[i], [field]: value };
    if (field === "class") next.multiclasses[i].subclass = "";
    onUpdate(next);
  }

  function set(path, value) {
    const next = structuredClone(data);
    const keys = path.split(".");
    let obj = next;
    for (let i = 0; i < keys.length - 1; i++) obj = obj[keys[i]];
    obj[keys[keys.length - 1]] = value;
    onUpdate(next);
  }

  function setAbility(key, value) {
    const next = structuredClone(data);
    next.abilities[key] = value;
    onUpdate(next);
  }

  function addAttack() {
    const id = crypto.randomUUID();
    onUpdate({ ...data, attacks: [...(data.attacks || []), { id, name: "Novo Ataque", attackBonus: 0, damage: "1d6", damageType: "Cortante", notes: "" }] });
  }

  function updateAttack(id, field, val) {
    onUpdate({ ...data, attacks: data.attacks.map((a) => a.id === id ? { ...a, [field]: val } : a) });
  }

  function removeAttack(id) {
    onUpdate({ ...data, attacks: data.attacks.filter((a) => a.id !== id) });
  }

  function addSpell(item) {
    const level = item.level ?? 0;
    const key = level === 0 ? "cantrips" : String(level);
    const existing = data.spells?.[key] || [];
    const spell = { id: crypto.randomUUID(), name: item.name, level, prepared: false, ...item };
    onUpdate({ ...data, spells: { ...data.spells, [key]: [...existing, spell] } });
  }

  function removeSpell(level, spellId) {
    const key = level === 0 ? "cantrips" : String(level);
    onUpdate({ ...data, spells: { ...data.spells, [key]: (data.spells?.[key] || []).filter((s) => s.id !== spellId) } });
  }

  function addEquipment(item) {
    const entry = { id: crypto.randomUUID(), name: item.name, qty: 1, weight: item.weight || 0, equipped: false, rulesText: item.description || "" };
    onUpdate({ ...data, equipment: [...(data.equipment || []), entry] });
  }

  function removeEquipment(id) {
    onUpdate({ ...data, equipment: (data.equipment || []).filter((e) => e.id !== id) });
  }

  function addFeature(item) {
    const entry = { id: crypto.randomUUID(), name: item.name, source: item.class || item.subclass || "", description: item.description || "" };
    onUpdate({ ...data, features: [...(data.features || []), entry] });
  }

  function removeFeature(id) {
    onUpdate({ ...data, features: (data.features || []).filter((f) => f.id !== id) });
  }

  function addFeat(item) {
    const entry = { id: crypto.randomUUID(), name: item.name, prerequisite: item.prerequisite || null, description: item.description || "" };
    onUpdate({ ...data, feats: [...(data.feats || []), entry] });
  }

  function removeFeat(id) {
    onUpdate({ ...data, feats: (data.feats || []).filter((f) => f.id !== id) });
  }

  // Normalize source objects for backward-compat (old sheets only have race/background/subclass)
  function normSources(src) {
    return { race: [], subrace: [], background: [], class: [], subclass: [], feat: [], ...(src || {}) };
  }
  function profSources() { return normSources(data.proficiencySources); }
  function langSources() { return normSources(data.languageSources); }

  // Computed display strings from source arrays (union, deduped)
  const allLanguagesDisplay = (() => {
    const src = langSources();
    const arr = joinSources(src);
    if (arr.length > 0) return arr.join(", ");
    // fallback: fichas antigas armazenam string diretamente
    return data.languages || "";
  })();

  const allProficienciesDisplay = (() => {
    const src = profSources();
    const arr = joinSources(src).filter((v) => {
      // skill keys look like "perception" — exclude them, those are in data.skills
      const isSkillKey = /^[a-z][a-zA-Z]+$/.test(v) && v.length < 20;
      return !isSkillKey;
    });
    if (arr.length > 0) return arr.join(", ");
    return data.otherProficiencies || "";
  })();

  const totalLevel = calcTotalLevel(data);
  const pb = calcProficiencyBonus(totalLevel);

  // Build caster list: primary class + caster multiclasses
  const allCasters = [
    classSlug && isCaster(classSlug) ? classSlug : null,
    ...(data.multiclasses || []).map((mc) => {
      const slug = findClassSlug(mc.class);
      return slug && isCaster(slug) ? slug : null;
    }),
  ].filter(Boolean);

  const maxSpellLevel = (() => {
    let max = classSlug ? getMaxSpellLevel(classSlug, data.level || 1) : 0;
    for (const mc of data.multiclasses || []) {
      const slug = findClassSlug(mc.class);
      if (slug) max = Math.max(max, getMaxSpellLevel(slug, mc.level || 1));
    }
    return max || Object.entries(data.spellSlots || {}).reduce(
      (m, [lvl, slots]) => ((slots?.total || 0) > 0 ? Math.max(m, Number(lvl)) : m), 0
    );
  })();

  // School restriction for Eldritch Knight and Arcane Trickster subclasses
  const SCHOOL_RESTRICTIONS = {
    "eldritch-knight":   ["Abjuration", "Evocation"],
    "arcane-trickster":  ["Enchantment", "Illusion"],
  };
  const restrictedSchools = (() => {
    if (subclassSlug && SCHOOL_RESTRICTIONS[subclassSlug]) return SCHOOL_RESTRICTIONS[subclassSlug];
    for (const mc of data.multiclasses || []) {
      const mcSlug = findClassSlug(mc.class);
      const mcSubList = mcSlug ? (mcSubclasses[mcSlug] || []) : [];
      const mcSubSlug = mcSubList.find((s) => s.label.toLowerCase() === (mc.subclass || "").toLowerCase())?.slug;
      if (mcSubSlug && SCHOOL_RESTRICTIONS[mcSubSlug]) return SCHOOL_RESTRICTIONS[mcSubSlug];
    }
    return null;
  })();

  const baseSpellSearchFn = allCasters.length > 1
    ? (q, pg = 1) => api.searchMultiClassSpells(allCasters, q, maxSpellLevel || 1, pg)
    : allCasters.length === 1
    ? (q, pg = 1) => api.searchClassSpells(allCasters[0], q, maxSpellLevel || 1, pg)
    : (q, pg = 1) => dnd5eApi.searchSpells(q, pg).then((r) => {
        const results = r.results || r;
        const filtered = maxSpellLevel > 0 ? results.filter((s) => (s.level ?? 0) <= maxSpellLevel) : results;
        return { ...r, results: filtered };
      });

  const spellSearchFn = restrictedSchools
    ? (q, pg) => baseSpellSearchFn(q, pg).then((r) => ({
        ...r,
        results: (r.results || []).filter((s) => !s.school || restrictedSchools.includes(s.school)),
      }))
    : baseSpellSearchFn;

  const spellBrowserTitle = allCasters.length > 1
    ? `Magias (${allCasters.map((s) => s[0].toUpperCase() + s.slice(1)).join(" + ")}) · D&D 5e`
    : allCasters.length === 1
    ? `Magias de ${data.class} (D&D 5e)`
    : "Buscar Magia (D&D 5e)";

  return (
    <div className="max-w-4xl mx-auto px-3 py-4">
      <div className="flex gap-1 flex-wrap mb-4 border-b border-parchment-edge pb-2">
        {TABS.map((t, i) => (
          <button
            key={t}
            onClick={() => setTab(i)}
            className={`font-display text-[11px] uppercase tracking-widest px-3 py-1.5 rounded-sheet transition ${tab === i ? "bg-burgundy text-parchment" : "text-ink-muted hover:text-ink hover:bg-parchment-edge/40"}`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* TAB 0: IDENTIDADE */}
      {tab === 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Nome" value={data.name || ""} onChange={(e) => set("name", e.target.value)} />
          <Input label="Jogador" value={data.playerName || ""} onChange={(e) => set("playerName", e.target.value)} />
          <ComboClass classes={DND5E_CLASSES} value={data.class || ""} onChange={(v) => set("class", v)} />
          {subclasses.length > 0
            ? <ComboField label="Subclasse" value={data.subclass || ""} onChange={(v) => set("subclass", v)} options={subclasses} />
            : <Input label="Subclasse" value={data.subclass || ""} onChange={(e) => set("subclass", e.target.value)} />
          }

          {/* Multiclasses */}
          {(data.multiclasses || []).map((mc, i) => {
            const mcSlug = findClassSlug(mc.class);
            const mcSubList = mcSlug ? (mcSubclasses[mcSlug] || []) : [];
            const mcSubclassSlug = mcSubList.find(
              (s) => s.label.toLowerCase() === (mc.subclass || "").toLowerCase()
            )?.slug;
            return (
              <div key={i} className="sm:col-span-2 space-y-2">
                <div className="grid grid-cols-[1fr_1fr_4rem] gap-2 items-end">
                  <ComboField label={`Multiclasse ${i + 1}`} value={mc.class || ""} onChange={(v) => setMc(i, "class", v)} options={DND5E_CLASSES} />
                  {mcSubList.length > 0
                    ? <ComboField label="Subclasse" value={mc.subclass || ""} onChange={(v) => setMc(i, "subclass", v)} options={mcSubList} />
                    : <Input label="Subclasse" value={mc.subclass || ""} onChange={(e) => setMc(i, "subclass", e.target.value)} />
                  }
                  <Input label="Nível" type="number" min={1} max={20} value={mc.level || 1} onChange={(e) => setMc(i, "level", Number(e.target.value))} />
                  <button
                    onClick={() => removeMc(i)}
                    className="col-span-3 flex justify-end text-ink-faded hover:text-burgundy transition"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                {mcSlug && (
                  <ClassSuggestions
                    className={mc.class}
                    level={mc.level || 1}
                    fetchFn={(cls, lvl) => api.searchByClass("dnd5e", "classfeatures", mcSlug, lvl, 1, 100)}
                    addedNames={(data.features || []).map((f) => f.name)}
                    onAdd={addFeature}
                  />
                )}
                {mcSubclassSlug && (
                  <ClassSuggestions
                    className={mc.subclass}
                    level={mc.level || 1}
                    fetchFn={(_, lvl) => api.searchByClass("dnd5e", "subclassfeatures", mcSubclassSlug, lvl, 1, 100)}
                    addedNames={(data.features || []).map((f) => f.name)}
                    onAdd={addFeature}
                  />
                )}
              </div>
            );
          })}

          {(data.multiclasses || []).length < 3 && (
            <div className="sm:col-span-2">
              <button
                onClick={addMc}
                className="flex items-center gap-1.5 text-xs font-display uppercase tracking-widest text-ink-muted hover:text-ink transition"
              >
                <Plus size={13} /> Adicionar Multiclasse
              </button>
            </div>
          )}

          {/* Habilidades da Classe */}
          {classSlug && (
            <div className="sm:col-span-2">
              <ClassSuggestions
                className={data.class}
                level={data.level || 1}
                fetchFn={(cls, lvl) => api.searchByClass("dnd5e", "classfeatures", findClassSlug(cls) || cls, lvl, 1, 100)}
                addedNames={(data.features || []).map((f) => f.name)}
                onAdd={addFeature}
              />
            </div>
          )}

          {/* Escolhas de perícia da classe */}
          {classStatus.loading && (
            <p className="sm:col-span-2 text-[10px] text-ink-faded font-display uppercase tracking-widest">Carregando classe...</p>
          )}
          {classStatus.data === "error" && (
            <p className="sm:col-span-2 text-[10px] text-burgundy font-display uppercase tracking-widest">Detalhes da classe indisponíveis.</p>
          )}
          {classStatus.data && classStatus.data !== "error" && (classStatus.data.proficiencyChoices || []).map((choice, i) => (
            <div key={i} className="sm:col-span-2">
              <SkillChoicePanel
                title={`Perícias de ${data.class}`}
                choose={choice.choose}
                options={choice.from}
                appliedSkills={data.skills}
                onApplySkill={(key) => {
                  const n = structuredClone(data);
                  n.skills[key] = true;
                  if (!n.proficiencySources) n.proficiencySources = { race: [], background: [], subclass: [] };
                  if (!n.proficiencySources.subclass.includes(key)) n.proficiencySources.subclass = [...n.proficiencySources.subclass, key];
                  onUpdate(n);
                }}
                onRemoveSkill={(key) => {
                  const n = structuredClone(data);
                  n.skills[key] = false;
                  if (n.proficiencySources) n.proficiencySources.subclass = n.proficiencySources.subclass.filter((k) => k !== key);
                  onUpdate(n);
                }}
              />
            </div>
          ))}
          {classStatus.data && classStatus.data !== "error" && (classStatus.data.savingThrows || []).length > 0 && (
            <div className="sm:col-span-2">
              <SkillChoicePanel
                title={`Testes de Resistência de ${data.class}`}
                choose={classStatus.data.savingThrows.length}
                options={classStatus.data.savingThrows.map((key) => ({ key, name: ABILITY_PT[key] }))}
                appliedSkills={data.savingThrows}
                onApplySkill={(key) => { const n = structuredClone(data); n.savingThrows[key] = true; onUpdate(n); }}
                onRemoveSkill={(key) => { const n = structuredClone(data); n.savingThrows[key] = false; onUpdate(n); }}
              />
            </div>
          )}

          {/* Habilidades da Subclasse */}
          {subclassSlug && (
            <div className="sm:col-span-2">
              <ClassSuggestions
                className={data.subclass}
                level={data.level || 1}
                fetchFn={(_, lvl) => api.searchByClass("dnd5e", "subclassfeatures", subclassSlug, lvl, 1, 100)}
                addedNames={(data.features || []).map((f) => f.name)}
                onAdd={addFeature}
              />
            </div>
          )}

          <Input label="Nível" type="number" value={data.level || 1} onChange={(e) => set("level", Number(e.target.value))} />
          <Input label="XP" type="number" value={data.xp || 0} onChange={(e) => set("xp", Number(e.target.value))} />
          <ComboField label="Raça / Espécie" value={data.race || ""} onChange={(v) => set("race", v)} options={races} />
          <ComboField label="Antecedente" value={data.background || ""} onChange={(v) => set("background", v)} options={DND5E_BACKGROUNDS} />
          {raceStatus.loading && (
            <p className="sm:col-span-2 text-[10px] text-ink-faded font-display uppercase tracking-widest">Carregando raça...</p>
          )}
          {raceStatus.data === "error" && (
            <p className="sm:col-span-2 text-[10px] text-burgundy font-display uppercase tracking-widest">Detalhes da raça indisponíveis.</p>
          )}
          {raceStatus.data && raceStatus.data !== "error" && (
            <div className="sm:col-span-2">
              <TraitInfoPanel
                details={raceStatus.data}
                type="race"
                data={data}
                proficiencySources={profSources()}
                languageSources={langSources()}
                onApplySkill={(key) => {
                  const n = structuredClone(data);
                  n.skills[key] = true;
                  const ps = normSources(n.proficiencySources);
                  if (!ps.race.includes(key)) ps.race = [...ps.race, key];
                  n.proficiencySources = ps;
                  onUpdate(n);
                }}
                onRemoveSkill={(key) => {
                  const n = structuredClone(data);
                  const ps = normSources(n.proficiencySources);
                  ps.race = ps.race.filter((k) => k !== key);
                  n.proficiencySources = ps;
                  const inOther = Object.entries(ps).some(([src, arr]) => src !== "race" && arr.includes(key));
                  if (!inOther) n.skills[key] = false;
                  onUpdate(n);
                }}
                onAppendLanguage={(lang) => {
                  const n = structuredClone(data);
                  const ls = normSources(n.languageSources);
                  if (!ls.race.includes(lang)) ls.race = [...ls.race, lang];
                  n.languageSources = ls;
                  onUpdate(n);
                }}
                onRemoveLanguage={(lang) => {
                  const n = structuredClone(data);
                  const ls = normSources(n.languageSources);
                  ls.race = ls.race.filter((l) => l !== lang);
                  n.languageSources = ls;
                  onUpdate(n);
                }}
                onAppendProficiency={(prof) => {
                  const n = structuredClone(data);
                  const ps = normSources(n.proficiencySources);
                  if (!ps.race.includes(prof)) ps.race = [...ps.race, prof];
                  n.proficiencySources = ps;
                  onUpdate(n);
                }}
                onRemoveProficiency={(prof) => {
                  const n = structuredClone(data);
                  const ps = normSources(n.proficiencySources);
                  ps.race = ps.race.filter((p) => p !== prof);
                  n.proficiencySources = ps;
                  onUpdate(n);
                }}
                onAddTrait={(name) => addFeature({ name, source: raceStatus.data?.name || "" })}
                onApplyAbilityBonus={(key, bonus, sourceIndex) => {
                  const n = structuredClone(data);
                  n.abilities[key] = (n.abilities[key] || 10) + bonus;
                  if (sourceIndex) {
                    if (!n.appliedRaceBonuses) n.appliedRaceBonuses = {};
                    n.appliedRaceBonuses[sourceIndex] = [...(n.appliedRaceBonuses[sourceIndex] || []), key];
                  }
                  onUpdate(n);
                }}
              />
            </div>
          )}
          {bgStatus.loading && (
            <p className="sm:col-span-2 text-[10px] text-ink-faded font-display uppercase tracking-widest">Carregando antecedente...</p>
          )}
          {bgStatus.data === "error" && (
            <p className="sm:col-span-2 text-[10px] text-burgundy font-display uppercase tracking-widest">Detalhes do antecedente indisponíveis.</p>
          )}
          {bgStatus.data && bgStatus.data !== "error" && (
            <div className="sm:col-span-2">
              <TraitInfoPanel
                details={bgStatus.data}
                type="background"
                data={data}
                proficiencySources={profSources()}
                languageSources={langSources()}
                onApplySkill={(key) => {
                  const n = structuredClone(data);
                  n.skills[key] = true;
                  const ps = normSources(n.proficiencySources);
                  if (!ps.background.includes(key)) ps.background = [...ps.background, key];
                  n.proficiencySources = ps;
                  onUpdate(n);
                }}
                onRemoveSkill={(key) => {
                  const n = structuredClone(data);
                  const ps = normSources(n.proficiencySources);
                  ps.background = ps.background.filter((k) => k !== key);
                  n.proficiencySources = ps;
                  const inOther = Object.entries(ps).some(([src, arr]) => src !== "background" && arr.includes(key));
                  if (!inOther) n.skills[key] = false;
                  onUpdate(n);
                }}
                onAppendLanguage={(lang) => {
                  const n = structuredClone(data);
                  const ls = normSources(n.languageSources);
                  if (!ls.background.includes(lang)) ls.background = [...ls.background, lang];
                  n.languageSources = ls;
                  onUpdate(n);
                }}
                onRemoveLanguage={(lang) => {
                  const n = structuredClone(data);
                  const ls = normSources(n.languageSources);
                  ls.background = ls.background.filter((l) => l !== lang);
                  n.languageSources = ls;
                  onUpdate(n);
                }}
                onAppendProficiency={(prof) => {
                  const n = structuredClone(data);
                  const ps = normSources(n.proficiencySources);
                  if (!ps.background.includes(prof)) ps.background = [...ps.background, prof];
                  n.proficiencySources = ps;
                  onUpdate(n);
                }}
                onRemoveProficiency={(prof) => {
                  const n = structuredClone(data);
                  const ps = normSources(n.proficiencySources);
                  ps.background = ps.background.filter((p) => p !== prof);
                  n.proficiencySources = ps;
                  onUpdate(n);
                }}
                onAddTrait={(name) => addFeature({ name, source: bgStatus.data?.name || "" })}
                onApplyAbilityBonus={(key, bonus, sourceIndex) => {
                  const n = structuredClone(data);
                  n.abilities[key] = (n.abilities[key] || 10) + bonus;
                  if (sourceIndex) {
                    if (!n.appliedRaceBonuses) n.appliedRaceBonuses = {};
                    n.appliedRaceBonuses[sourceIndex] = [...(n.appliedRaceBonuses[sourceIndex] || []), key];
                  }
                  onUpdate(n);
                }}
              />
            </div>
          )}
          <Input label="Alinhamento" value={data.alignment || ""} onChange={(e) => set("alignment", e.target.value)} />
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={!!data.inspiration} onChange={(e) => set("inspiration", e.target.checked)} className="accent-burgundy w-4 h-4" />
              <span className="font-display text-xs uppercase tracking-widest text-ink-muted">Inspiração</span>
            </label>
          </div>
          <div className="sm:col-span-2">
            <label className="flex flex-col gap-1">
              <span className="font-display text-[10px] uppercase tracking-widest text-ink-muted">Idiomas</span>
              <p className="text-sm font-serif text-ink min-h-[1.5rem]">{allLanguagesDisplay || <span className="text-ink-faded italic">Nenhum</span>}</p>
            </label>
          </div>
          <div className="sm:col-span-2">
            <label className="flex flex-col gap-1">
              <span className="font-display text-[10px] uppercase tracking-widest text-ink-muted">Outras proficiências</span>
              <p className="text-sm font-serif text-ink min-h-[1.5rem]">{allProficienciesDisplay || <span className="text-ink-faded italic">Nenhuma</span>}</p>
            </label>
          </div>
        </div>
      )}

      {/* TAB 1: ATRIBUTOS */}
      {tab === 1 && (
        <div className="space-y-6">
          <div>
            <p className="font-display text-xs uppercase tracking-widest text-ink-muted mb-3">Atributos</p>
            <div className="flex flex-wrap gap-3">
              {DND5E_ABILITIES.map((ab) => (
                <StatBox
                  key={ab}
                  name={ABILITY_LABELS[ab]}
                  value={data.abilities?.[ab] || 10}
                  onChange={(v) => setAbility(ab, v)}
                />
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card>
              <Card.Header><p className="font-display text-xs uppercase tracking-widest text-ink-muted">Testes de Resistência</p></Card.Header>
              <Card.Body className="space-y-1">
                {DND5E_ABILITIES.map((ab) => {
                  const prof = data.savingThrows?.[ab];
                  const mod = abilityMod(data.abilities?.[ab] || 10) + (prof ? pb : 0);
                  const sign = mod >= 0 ? "+" : "";
                  return (
                    <label key={ab} className="flex items-center gap-2 cursor-pointer py-0.5">
                      <input type="checkbox" checked={!!prof} onChange={(e) => {
                        const next = structuredClone(data);
                        next.savingThrows[ab] = e.target.checked;
                        onUpdate(next);
                      }} className="accent-burgundy" />
                      <span className="text-sm text-ink-muted w-6 font-display">{sign}{mod}</span>
                      <span className="text-sm text-ink font-serif">{ABILITY_PT[ab]}</span>
                    </label>
                  );
                })}
              </Card.Body>
            </Card>

            <Card>
              <Card.Header><p className="font-display text-xs uppercase tracking-widest text-ink-muted">Perícias</p></Card.Header>
              <Card.Body className="space-y-0.5 max-h-72 overflow-y-auto">
                {DND5E_SKILLS.map((sk) => {
                  const prof = data.skills?.[sk.key];
                  const bonus = abilityMod(data.abilities?.[sk.ability] || 10) + (prof === "expertise" ? pb * 2 : prof ? pb : 0);
                  const sign = bonus >= 0 ? "+" : "";
                  return (
                    <label key={sk.key} className="flex items-center gap-2 cursor-pointer py-0.5">
                      <input
                        type="checkbox"
                        checked={!!prof}
                        onChange={(e) => {
                          const next = structuredClone(data);
                          next.skills[sk.key] = e.target.checked;
                          onUpdate(next);
                        }}
                        className="accent-burgundy"
                      />
                      <span className="text-xs text-ink-muted w-6 font-display tabular-nums">{sign}{bonus}</span>
                      <span className="text-sm text-ink font-serif flex-1">{sk.label}</span>
                      <span className="text-[10px] text-ink-faded font-display uppercase">{ABILITY_LABELS[sk.ability]}</span>
                    </label>
                  );
                })}
              </Card.Body>
            </Card>
          </div>
        </div>
      )}

      {/* TAB 2: COMBATE */}
      {tab === 2 && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
            {[
              { label: "CA", key: "ac", type: "number" },
              { label: "Iniciativa", key: "initiative", type: "number" },
              { label: "Velocidade", key: "speed", type: "number" },
            ].map(({ label, key, type }) => (
              <label key={key} className="flex flex-col items-center gap-1 bg-parchment-deep border border-parchment-edge rounded-sheet p-3">
                <span className="font-display text-[9px] uppercase tracking-widest text-ink-muted">{label}</span>
                <input
                  type={type}
                  value={data[key] ?? 0}
                  onChange={(e) => set(key, Number(e.target.value))}
                  className="w-full text-center text-xl font-display bg-transparent text-ink focus:outline-none focus:border-b focus:border-burgundy tabular-nums"
                />
              </label>
            ))}
            <div className="flex flex-col items-center gap-1 bg-parchment-deep border border-gold/30 rounded-sheet p-3">
              <span className="font-display text-[9px] uppercase tracking-widest text-ink-muted">Bônus de Proficiência</span>
              <span className="text-xl font-display text-gold tabular-nums">+{pb}</span>
              <span className="text-[8px] font-display uppercase tracking-widest text-ink-faded">Nível {totalLevel}</span>
            </div>
          </div>

          <Card>
            <Card.Header><p className="font-display text-xs uppercase tracking-widest text-ink-muted">Pontos de Vida</p></Card.Header>
            <Card.Body className="space-y-3">
              <HPBar current={data.hp?.current || 0} max={data.hp?.max || 0} temp={data.hp?.temp || 0} />
              <div className="grid grid-cols-3 gap-3">
                <Input label="Máximo" type="number" value={data.hp?.max || 0} onChange={(e) => { const n = structuredClone(data); n.hp.max = Number(e.target.value); onUpdate(n); }} />
                <Input label="Atual" type="number" value={data.hp?.current || 0} onChange={(e) => { const n = structuredClone(data); n.hp.current = Number(e.target.value); onUpdate(n); }} />
                <Input label="Temporário" type="number" value={data.hp?.temp || 0} onChange={(e) => { const n = structuredClone(data); n.hp.temp = Number(e.target.value); onUpdate(n); }} />
              </div>
            </Card.Body>
          </Card>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card>
              <Card.Header><p className="font-display text-xs uppercase tracking-widest text-ink-muted">Dados de Vida</p></Card.Header>
              <Card.Body className="grid grid-cols-3 gap-3">
                <Input label="Total" type="number" value={data.hitDice?.total || 1} onChange={(e) => { const n = structuredClone(data); n.hitDice.total = Number(e.target.value); onUpdate(n); }} />
                <Input label="Restantes" type="number" value={data.hitDice?.remaining || 1} onChange={(e) => { const n = structuredClone(data); n.hitDice.remaining = Number(e.target.value); onUpdate(n); }} />
                <label className="flex flex-col gap-1">
                  <span className="font-display text-[10px] uppercase tracking-widest text-ink-muted">Dado</span>
                  <select value={data.hitDice?.die || "d8"} onChange={(e) => { const n = structuredClone(data); n.hitDice.die = e.target.value; onUpdate(n); }} className="bg-transparent border-b border-ink/30 px-2 py-1 text-ink focus:border-burgundy focus:outline-none">
                    {["d6", "d8", "d10", "d12"].map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                </label>
              </Card.Body>
            </Card>

            <Card>
              <Card.Header><p className="font-display text-xs uppercase tracking-widest text-ink-muted">Testes de Morte</p></Card.Header>
              <Card.Body className="space-y-2">
                {["successes", "failures"].map((key) => (
                  <div key={key} className="flex items-center gap-2">
                    <span className="font-serif text-sm text-ink-muted w-20">{key === "successes" ? "Sucessos" : "Falhas"}</span>
                    {[0, 1, 2].map((i) => (
                      <input
                        key={i}
                        type="checkbox"
                        checked={i < (data.deathSaves?.[key] || 0)}
                        onChange={(e) => {
                          const n = structuredClone(data);
                          n.deathSaves[key] = e.target.checked ? i + 1 : i;
                          onUpdate(n);
                        }}
                        className={key === "successes" ? "accent-hp-healthy w-4 h-4" : "accent-hp-critical w-4 h-4"}
                      />
                    ))}
                  </div>
                ))}
              </Card.Body>
            </Card>
          </div>
        </div>
      )}

      {/* TAB 3: ATAQUES */}
      {tab === 3 && (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <p className="font-display text-xs uppercase tracking-widest text-ink-muted">Ataques & Ações</p>
            <Button size="sm" variant="ghost" icon={<Plus size={14} />} onClick={addAttack}>Adicionar</Button>
          </div>

          {(data.attacks || []).length === 0 && (
            <p className="text-ink-muted font-serif italic text-sm py-8 text-center">Nenhum ataque. Clique em "Adicionar".</p>
          )}

          {(data.attacks || []).map((atk) => (
            <Card key={atk.id}>
              <Card.Body className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="col-span-2 sm:col-span-1">
                  <Input label="Nome" value={atk.name} onChange={(e) => updateAttack(atk.id, "name", e.target.value)} />
                </div>
                <Input label="Bônus de Ataque" type="number" value={atk.attackBonus || 0} onChange={(e) => updateAttack(atk.id, "attackBonus", Number(e.target.value))} />
                <Input label="Dano" value={atk.damage || ""} onChange={(e) => updateAttack(atk.id, "damage", e.target.value)} />
                <Input label="Tipo" value={atk.damageType || ""} onChange={(e) => updateAttack(atk.id, "damageType", e.target.value)} />
                <div className="col-span-2 sm:col-span-3">
                  <Input label="Notas" value={atk.notes || ""} onChange={(e) => updateAttack(atk.id, "notes", e.target.value)} />
                </div>
                <div className="flex items-end pb-1">
                  <button onClick={() => removeAttack(atk.id)} className="text-ink-faded hover:text-burgundy transition">
                    <Trash2 size={14} />
                  </button>
                </div>
              </Card.Body>
            </Card>
          ))}
        </div>
      )}

      {/* TAB 4: MAGIAS */}
      {tab === 4 && (
        <div className="space-y-4">
          <Card>
            <Card.Header><p className="font-display text-xs uppercase tracking-widest text-ink-muted">Conjuração</p></Card.Header>
            <Card.Body className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <label className="flex flex-col gap-1">
                <span className="font-display text-[10px] uppercase tracking-widest text-ink-muted">Atributo</span>
                <select value={data.spellcasting?.ability || ""} onChange={(e) => { const n = structuredClone(data); n.spellcasting.ability = e.target.value; onUpdate(n); }} className="bg-transparent border-b border-ink/30 px-2 py-1 text-ink focus:border-burgundy focus:outline-none">
                  <option value="">—</option>
                  {DND5E_ABILITIES.map((ab) => <option key={ab} value={ab}>{ABILITY_PT[ab]}</option>)}
                </select>
              </label>
              <Input label="CD Magia" type="number" value={data.spellcasting?.saveDC || 8} onChange={(e) => { const n = structuredClone(data); n.spellcasting.saveDC = Number(e.target.value); onUpdate(n); }} />
              <Input label="Bônus Ataque" type="number" value={data.spellcasting?.attackBonus || 0} onChange={(e) => { const n = structuredClone(data); n.spellcasting.attackBonus = Number(e.target.value); onUpdate(n); }} />
            </Card.Body>
          </Card>

          <div className="flex justify-end">
            <Button size="sm" variant="ghost" icon={<Plus size={14} />} onClick={() => setBrowser("spells")}>Buscar Magia</Button>
          </div>

          {[["Truques", "cantrips"], ...Array.from({ length: 9 }, (_, i) => [`Nível ${i + 1}`, String(i + 1)])].map(([label, key]) => {
            const spellLevel = key === "cantrips" ? 0 : Number(key);
            if (spellLevel > 0 && maxSpellLevel > 0 && spellLevel > maxSpellLevel) return null;
            const spells = data.spells?.[key] || [];
            const slot = data.spellSlots?.[key];
            return (
              <Card key={key}>
                <Card.Header>
                  <p className="font-display text-xs uppercase tracking-widest text-ink-muted">{label}</p>
                  {slot && (
                    <div className="flex items-center gap-2 text-xs font-serif text-ink-muted">
                      <Input type="number" size="sm" fieldClassName="w-8 text-center" value={slot.used || 0} onChange={(e) => { const n = structuredClone(data); n.spellSlots[key].used = Number(e.target.value); onUpdate(n); }} />
                      <span>/</span>
                      <Input type="number" size="sm" fieldClassName="w-8 text-center" value={slot.total || 0} onChange={(e) => { const n = structuredClone(data); n.spellSlots[key].total = Number(e.target.value); onUpdate(n); }} />
                      <span className="font-display text-[9px] uppercase tracking-widest">espaços</span>
                    </div>
                  )}
                </Card.Header>
                {spells.length > 0 && (
                  <Card.Body className="space-y-1">
                    {spells.map((sp) => (
                      <div key={sp.id} className="flex items-center gap-2 py-0.5">
                        {key !== "cantrips" && (
                          <input type="checkbox" checked={!!sp.prepared} onChange={(e) => {
                            const n = structuredClone(data);
                            const idx = n.spells[key].findIndex((s) => s.id === sp.id);
                            if (idx !== -1) n.spells[key][idx].prepared = e.target.checked;
                            onUpdate(n);
                          }} className="accent-gold" title="Preparada" />
                        )}
                        <span className="font-serif text-sm text-ink flex-1">{sp.name}</span>
                        <button onClick={() => removeSpell(key === "cantrips" ? 0 : Number(key), sp.id)} className="text-ink-faded hover:text-burgundy transition">
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                  </Card.Body>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* TAB 5: EQUIPAMENTO */}
      {tab === 5 && (
        <div className="space-y-4">
          <Card>
            <Card.Header><p className="font-display text-xs uppercase tracking-widest text-ink-muted">Moeda</p></Card.Header>
            <Card.Body className="grid grid-cols-5 gap-2">
              {["cp", "sp", "ep", "gp", "pp"].map((c) => (
                <Input key={c} label={c.toUpperCase()} type="number" value={data.currency?.[c] || 0} onChange={(e) => { const n = structuredClone(data); n.currency[c] = Number(e.target.value); onUpdate(n); }} />
              ))}
            </Card.Body>
          </Card>

          <div className="flex justify-end">
            <Button size="sm" variant="ghost" icon={<Plus size={14} />} onClick={() => setBrowser("items")}>Buscar Item</Button>
          </div>

          {(data.equipment || []).length === 0 && (
            <p className="text-ink-muted font-serif italic text-sm py-8 text-center">Nenhum item. Clique em "Buscar Item".</p>
          )}

          <div className="space-y-2">
            {(data.equipment || []).map((item) => (
              <Card key={item.id}>
                <Card.Body className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="col-span-2">
                    <Input label="Nome" value={item.name} onChange={(e) => {
                      const n = structuredClone(data);
                      const idx = n.equipment.findIndex((x) => x.id === item.id);
                      if (idx !== -1) n.equipment[idx].name = e.target.value;
                      onUpdate(n);
                    }} />
                  </div>
                  <Input label="Qtd" type="number" value={item.qty || 1} onChange={(e) => {
                    const n = structuredClone(data);
                    const idx = n.equipment.findIndex((x) => x.id === item.id);
                    if (idx !== -1) n.equipment[idx].qty = Number(e.target.value);
                    onUpdate(n);
                  }} />
                  <div className="flex items-end gap-2 pb-1">
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input type="checkbox" checked={!!item.equipped} onChange={(e) => {
                        const n = structuredClone(data);
                        const idx = n.equipment.findIndex((x) => x.id === item.id);
                        if (idx !== -1) n.equipment[idx].equipped = e.target.checked;
                        onUpdate(n);
                      }} className="accent-gold" />
                      <span className="font-display text-[9px] uppercase tracking-widest text-ink-muted">Equipado</span>
                    </label>
                    <button onClick={() => removeEquipment(item.id)} className="text-ink-faded hover:text-burgundy transition ml-auto">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </Card.Body>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* TAB 6: TRAÇOS */}
      {tab === 6 && (
        <div className="space-y-3">
          <ClassSuggestions
            className={findClassSlug(data.class) ? data.class : null}
            level={data.level || 1}
            fetchFn={(cls, lvl) => api.searchByClass("dnd5e", "classfeatures", findClassSlug(cls) || cls, lvl, 1, 100)}
            addedNames={(data.features || []).map((f) => f.name)}
            onAdd={addFeature}
          />
          {subclassSlug && (
            <ClassSuggestions
              className={data.subclass}
              level={data.level || 1}
              fetchFn={(_, lvl) => api.searchByClass("dnd5e", "subclassfeatures", subclassSlug, lvl, 1, 100)}
              addedNames={(data.features || []).map((f) => f.name)}
              onAdd={addFeature}
            />
          )}
          {(data.multiclasses || []).map((mc, i) => {
            const mcSlug = findClassSlug(mc.class);
            if (!mcSlug) return null;
            const mcSubclassSlug = mcSubclasses[mcSlug]?.find(
              (s) => s.label.toLowerCase() === (mc.subclass || "").toLowerCase()
            )?.slug;
            return (
              <div key={i} className="space-y-2">
                <ClassSuggestions
                  className={mc.class}
                  level={data.level || 1}
                  fetchFn={(cls, lvl) => api.searchByClass("dnd5e", "classfeatures", mcSlug, lvl, 1, 100)}
                  addedNames={(data.features || []).map((f) => f.name)}
                  onAdd={addFeature}
                />
                {mcSubclassSlug && (
                  <ClassSuggestions
                    className={mc.subclass}
                    level={data.level || 1}
                    fetchFn={(_, lvl) => api.searchByClass("dnd5e", "subclassfeatures", mcSubclassSlug, lvl, 1, 100)}
                    addedNames={(data.features || []).map((f) => f.name)}
                    onAdd={addFeature}
                  />
                )}
              </div>
            );
          })}
          <div className="flex justify-end">
            <Button size="sm" variant="ghost" icon={<Plus size={14} />} onClick={() => setBrowser("features")}>Buscar Habilidade</Button>
          </div>

          {(data.features || []).length === 0 && (
            <p className="text-ink-muted font-serif italic text-sm py-8 text-center">Nenhum traço. Clique em "Buscar Habilidade".</p>
          )}

          {(data.features || []).map((feat) => (
            <Card key={feat.id}>
              <Card.Body>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <Input value={feat.name} onChange={(e) => {
                      const n = structuredClone(data);
                      const idx = n.features.findIndex((f) => f.id === feat.id);
                      if (idx !== -1) n.features[idx].name = e.target.value;
                      onUpdate(n);
                    }} fieldClassName="font-display text-sm" />
                    {feat.source && <p className="text-[10px] text-ink-muted font-display uppercase tracking-widest mt-1">{feat.source}</p>}
                  </div>
                  <button onClick={() => removeFeature(feat.id)} className="text-ink-faded hover:text-burgundy transition shrink-0">
                    <Trash2 size={14} />
                  </button>
                </div>
                <textarea
                  value={feat.description || ""}
                  onChange={(e) => {
                    const n = structuredClone(data);
                    const idx = n.features.findIndex((f) => f.id === feat.id);
                    if (idx !== -1) n.features[idx].description = e.target.value;
                    onUpdate(n);
                  }}
                  rows={3}
                  placeholder="Descrição..."
                  className="mt-2 w-full bg-transparent border border-parchment-edge rounded-sheet px-2 py-1.5 text-sm text-ink placeholder:text-ink-faded focus:border-burgundy focus:outline-none resize-none"
                />
              </Card.Body>
            </Card>
          ))}

          <Button size="sm" variant="ghost" icon={<Plus size={14} />} onClick={() => addFeature({ name: "Novo Traço" })}>Adicionar manual</Button>

          {/* Feats */}
          <div className="border-t border-parchment-edge pt-3 space-y-2">
            <div className="flex items-center justify-between">
              <p className="font-display text-xs uppercase tracking-widest text-ink-muted">Talentos (Feats)</p>
              <Button size="sm" variant="ghost" icon={<Plus size={14} />} onClick={() => setBrowser("feats")}>Buscar Talento</Button>
            </div>
            {(data.feats || []).length === 0 && (
              <p className="text-ink-muted font-serif italic text-sm py-2 text-center">Nenhum talento. Clique em "Buscar Talento".</p>
            )}
            {(data.feats || []).map((feat) => (
              <Card key={feat.id}>
                <Card.Body>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className="font-display text-sm text-ink">{feat.name}</p>
                      {feat.prerequisite && (
                        <p className="text-[10px] text-ink-muted font-display uppercase tracking-widest mt-0.5">Pré-requisito: {feat.prerequisite}</p>
                      )}
                    </div>
                    <button onClick={() => removeFeat(feat.id)} className="text-ink-faded hover:text-burgundy transition shrink-0">
                      <Trash2 size={14} />
                    </button>
                  </div>
                  {feat.description && (
                    <p className="mt-1.5 text-sm text-ink font-serif leading-relaxed">{feat.description}</p>
                  )}
                </Card.Body>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* TAB 7: PERSONALIDADE */}
      {tab === 7 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            ["Traços de Personalidade", "traits"],
            ["Ideais", "ideals"],
            ["Vínculos", "bonds"],
            ["Fraquezas", "flaws"],
          ].map(([label, key]) => (
            <label key={key} className="flex flex-col gap-1">
              <span className="font-display text-[10px] uppercase tracking-widest text-ink-muted">{label}</span>
              <textarea
                value={data.personality?.[key] || ""}
                onChange={(e) => { const n = structuredClone(data); n.personality[key] = e.target.value; onUpdate(n); }}
                rows={5}
                className="bg-parchment-deep border border-parchment-edge rounded-sheet px-2 py-1.5 text-sm text-ink placeholder:text-ink-faded focus:border-burgundy focus:outline-none resize-none w-full"
              />
            </label>
          ))}
          <div className="sm:col-span-2">
            <label className="flex flex-col gap-1">
              <span className="font-display text-[10px] uppercase tracking-widest text-ink-muted">Histórico / Backstory</span>
              <textarea
                value={data.appearance?.backstory || ""}
                onChange={(e) => { const n = structuredClone(data); n.appearance.backstory = e.target.value; onUpdate(n); }}
                rows={8}
                className="bg-parchment-deep border border-parchment-edge rounded-sheet px-2 py-1.5 text-sm text-ink placeholder:text-ink-faded focus:border-burgundy focus:outline-none resize-none w-full"
              />
            </label>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 sm:col-span-2">
            {["age", "height", "weight", "eyes", "skin", "hair"].map((key) => {
              const labels = { age: "Idade", height: "Altura", weight: "Peso", eyes: "Olhos", skin: "Pele", hair: "Cabelo" };
              return <Input key={key} label={labels[key]} value={data.appearance?.[key] || ""} onChange={(e) => { const n = structuredClone(data); n.appearance[key] = e.target.value; onUpdate(n); }} />;
            })}
          </div>
        </div>
      )}

      {/* Browsers */}
      <BrowserPanel
        open={browser === "spells"}
        onClose={() => setBrowser(null)}
        title={spellBrowserTitle}
        searchFn={spellSearchFn}
        renderResult={(r) => (
          <p className="text-xs text-ink-muted font-serif">
            {r.level === 0 ? "Truque" : `Nível ${r.level}`}{r.school ? ` · ${r.school}` : ""}
          </p>
        )}
        onAdd={addSpell}
      />
      <BrowserPanel
        open={browser === "items"}
        onClose={() => setBrowser(null)}
        title="Buscar Item (D&D 5e)"
        searchFn={dnd5eApi.searchItems}
        renderResult={(r) => (
          <p className="text-xs text-ink-muted font-serif">
            {r.category}{r.cost ? ` · ${r.cost}` : ""}
          </p>
        )}
        onAdd={addEquipment}
      />
      <BrowserPanel
        open={browser === "features"}
        onClose={() => setBrowser(null)}
        title="Buscar Habilidade (D&D 5e)"
        searchFn={dnd5eApi.searchClassFeatures}
        renderResult={(r) => (
          <p className="text-xs text-ink-muted font-serif">
            {r.class}{r.level ? ` · Nível ${r.level}` : ""}
          </p>
        )}
        onAdd={addFeature}
      />
      <BrowserPanel
        open={browser === "feats"}
        onClose={() => setBrowser(null)}
        title="Buscar Talento (D&D 5e)"
        searchFn={dnd5eApi.searchFeats}
        renderResult={(r) => (
          <p className="text-xs text-ink-muted font-serif">
            {r.prerequisite ? `Pré-req: ${r.prerequisite}` : "Sem pré-requisito"}
          </p>
        )}
        onAdd={addFeat}
      />
    </div>
  );
}
