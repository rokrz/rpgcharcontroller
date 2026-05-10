import { useState, useEffect } from "react";
import { Plus, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import Card from "../../components/ui/Card.jsx";
import Button from "../../components/ui/Button.jsx";
import Input from "../../components/ui/Input.jsx";
import HPBar from "../../components/ui/HPBar.jsx";
import StatBox, { abilityMod, modStr } from "../../components/ui/StatBox.jsx";
import BrowserPanel from "../../components/browsers/BrowserPanel.jsx";
import ClassSuggestions from "../../components/ClassSuggestions.jsx";
import TraitInfoPanel from "../../components/TraitInfoPanel.jsx";
import { dnd5eApi } from "./api.js";
import { DND5E_ABILITIES, DND5E_SKILLS } from "./schema.js";
import { DND5E_CLASSES, findClassSlug, DND5E_RACES, DND5E_BACKGROUNDS, findBackgroundSlug } from "./classes.js";
import { api } from "../../services/api.js";

function ComboField({ label, value, onChange, options }) {
  const [open, setOpen] = useState(false);
  const filtered = value
    ? options.filter(
        (c) =>
          c.label.toLowerCase().includes(value.toLowerCase()) ||
          (c.slug || "").toLowerCase().includes(value.toLowerCase())
      )
    : options;
  return (
    <div className="relative">
      <Input
        label={label}
        value={value}
        onChange={(e) => { onChange(e.target.value); setOpen(true); }}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onFocus={() => setOpen(true)}
      />
      {open && filtered.length > 0 && (
        <div className="absolute z-10 top-full left-0 right-0 bg-parchment-deep border border-parchment-edge rounded-sheet shadow-page max-h-48 overflow-y-auto">
          {filtered.map((c) => (
            <button
              key={c.slug || c.label}
              onMouseDown={() => { onChange(c.label); setOpen(false); }}
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
// Alias para compatibilidade com a prop `classes` usada antes
function ComboClass({ value, onChange, classes }) {
  return <ComboField label="Classe" value={value} onChange={onChange} options={classes} />;
}

const TABS = ["Identidade", "Atributos", "Combate", "Ataques", "Magias", "Equipamento", "Traços", "Personalidade"];

const ABILITY_LABELS = { str: "FOR", dex: "DES", con: "CON", int: "INT", wis: "SAB", cha: "CAR" };
const ABILITY_PT = { str: "Força", dex: "Destreza", con: "Constituição", int: "Inteligência", wis: "Sabedoria", cha: "Carisma" };

export default function Dnd5eSheet({ data, onUpdate }) {
  const [tab, setTab] = useState(0);
  const [browser, setBrowser] = useState(null);
  const [subclasses, setSubclasses] = useState([]);
  const [races, setRaces] = useState(DND5E_RACES);
  const [raceDetails, setRaceDetails] = useState(null);
  const [bgDetails, setBgDetails] = useState(null);

  const classSlug = findClassSlug(data.class);
  const bgSlug = findBackgroundSlug(data.background);
  const raceLow = (data.race || "").toLowerCase().trim();
  const raceSlug = races.find((r) => r.label.toLowerCase() === raceLow || r.slug === raceLow)?.slug ?? null;
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
    if (!raceSlug) { setRaceDetails(null); return; }
    api.fetchDetail("dnd5e", "racedetail", raceSlug).then(setRaceDetails).catch(() => setRaceDetails(null));
  }, [raceSlug]);

  useEffect(() => {
    if (!bgSlug) { setBgDetails(null); return; }
    api.fetchDetail("dnd5e", "backgrounddetail", bgSlug).then(setBgDetails).catch(() => setBgDetails(null));
  }, [bgSlug]);

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

  const pb = data.proficiencyBonus || 2;

  const maxSpellLevel = Object.entries(data.spellSlots || {}).reduce(
    (max, [lvl, slots]) => ((slots?.total || 0) > 0 ? Math.max(max, Number(lvl)) : max), 0
  );
  const spellSearchFn = classSlug
    ? (q) => api.searchClassSpells(classSlug, q, maxSpellLevel || 9)
    : dnd5eApi.searchSpells;
  const spellBrowserTitle = classSlug ? `Magias de ${data.class} (D&D 5e)` : "Buscar Magia (D&D 5e)";

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
          <Input label="Nível" type="number" value={data.level || 1} onChange={(e) => set("level", Number(e.target.value))} />
          <Input label="XP" type="number" value={data.xp || 0} onChange={(e) => set("xp", Number(e.target.value))} />
          <ComboField label="Raça / Espécie" value={data.race || ""} onChange={(v) => set("race", v)} options={races} />
          <ComboField label="Antecedente" value={data.background || ""} onChange={(v) => set("background", v)} options={DND5E_BACKGROUNDS} />
          {raceDetails && (
            <div className="sm:col-span-2">
              <TraitInfoPanel
                details={raceDetails}
                type="race"
                data={data}
                onApplySkill={(key) => { const n = structuredClone(data); n.skills[key] = true; onUpdate(n); }}
                onAppendLanguage={(lang) => { const n = structuredClone(data); n.languages = n.languages ? `${n.languages}, ${lang}` : lang; onUpdate(n); }}
                onAppendProficiency={(prof) => { const n = structuredClone(data); n.otherProficiencies = n.otherProficiencies ? `${n.otherProficiencies}, ${prof}` : prof; onUpdate(n); }}
              />
            </div>
          )}
          {bgDetails && (
            <div className="sm:col-span-2">
              <TraitInfoPanel
                details={bgDetails}
                type="background"
                data={data}
                onApplySkill={(key) => { const n = structuredClone(data); n.skills[key] = true; onUpdate(n); }}
                onAppendLanguage={(lang) => { const n = structuredClone(data); n.languages = n.languages ? `${n.languages}, ${lang}` : lang; onUpdate(n); }}
                onAppendProficiency={(prof) => { const n = structuredClone(data); n.otherProficiencies = n.otherProficiencies ? `${n.otherProficiencies}, ${prof}` : prof; onUpdate(n); }}
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
            <Input label="Proficiências e idiomas" value={data.languages || ""} onChange={(e) => set("languages", e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <label className="flex flex-col gap-1">
              <span className="font-display text-[10px] uppercase tracking-widest text-ink-muted">Outras proficiências</span>
              <textarea
                value={data.otherProficiencies || ""}
                onChange={(e) => set("otherProficiencies", e.target.value)}
                rows={3}
                className="bg-transparent border border-parchment-edge rounded-sheet px-2 py-1.5 text-sm text-ink placeholder:text-ink-faded focus:border-burgundy focus:outline-none resize-none w-full"
              />
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
              { label: "Bônus de Proficiência", key: "proficiencyBonus", type: "number" },
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
          </div>

          <Card>
            <Card.Header><p className="font-display text-xs uppercase tracking-widest text-ink-muted">Pontos de Vida</p></Card.Header>
            <Card.Body className="space-y-3">
              <HPBar current={data.hp?.current || 0} max={data.hp?.max || 0} />
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
            fetchFn={(cls, lvl) => api.searchByClass("dnd5e", "classfeatures", findClassSlug(cls) || cls, lvl)}
            addedNames={(data.features || []).map((f) => f.name)}
            onAdd={addFeature}
          />
          {subclassSlug && (
            <ClassSuggestions
              className={data.subclass}
              level={data.level || 1}
              fetchFn={(_, lvl) => api.searchByClass("dnd5e", "subclassfeatures", subclassSlug, lvl)}
              addedNames={(data.features || []).map((f) => f.name)}
              onAdd={addFeature}
            />
          )}
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
        searchFn={dnd5eApi.searchFeats}
        renderResult={(r) => (
          <p className="text-xs text-ink-muted font-serif">
            {r.class}{r.level ? ` · Nível ${r.level}` : ""}
          </p>
        )}
        onAdd={addFeature}
      />
    </div>
  );
}
