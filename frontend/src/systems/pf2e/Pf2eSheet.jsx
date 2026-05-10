import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import Card from "../../components/ui/Card.jsx";
import Button from "../../components/ui/Button.jsx";
import Input from "../../components/ui/Input.jsx";
import HPBar from "../../components/ui/HPBar.jsx";
import StatBox, { abilityMod } from "../../components/ui/StatBox.jsx";
import BrowserPanel from "../../components/browsers/BrowserPanel.jsx";
import ClassSuggestions from "../../components/ClassSuggestions.jsx";
import { pf2eApi } from "./api.js";
import { PF2E_ABILITIES, PF2E_SKILLS, PF2E_RANKS } from "./schema.js";
import { PF2E_CLASSES, findClassSlug, PF2E_ANCESTRIES, PF2E_BACKGROUNDS } from "./classes.js";
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
              className="w-full text-left px-3 py-1.5 text-sm font-serif text-ink hover:bg-parchment-edge/40"
            >
              {c.label}
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

const TABS = ["Identidade", "Atributos", "Combate", "Perícias", "Ações", "Magias", "Inventário", "Feats"];
const ABILITY_LABELS = { str: "FOR", dex: "DES", con: "CON", int: "INT", wis: "SAB", cha: "CAR" };
const ABILITY_PT = { str: "Força", dex: "Destreza", con: "Constituição", int: "Inteligência", wis: "Sabedoria", cha: "Carisma" };
const FEAT_CATS = { ancestry: "Ancestralidade", class: "Classe", general: "Geral", skill: "Perícia", bonus: "Bônus" };
const TRADITION_COLORS = { arcane: "text-cond-magic", divine: "text-gold", occult: "text-cond-debuff", primal: "text-hp-healthy" };

function rankBonus(rank, level = 1) {
  if (rank === 0) return -2;
  if (rank === 1) return level;
  if (rank === 2) return level + 2;
  if (rank === 3) return level + 4;
  if (rank === 4) return level + 6;
  return 0;
}

function RankSelector({ value, onChange }) {
  return (
    <div className="flex gap-0.5">
      {PF2E_RANKS.map((r, i) => (
        <button
          key={i}
          title={r}
          onClick={() => onChange(i)}
          className={`w-3.5 h-3.5 rounded-full border transition ${value >= i + 1 ? "bg-burgundy border-burgundy" : "bg-transparent border-parchment-edge hover:border-ink-muted"}`}
        />
      ))}
    </div>
  );
}

export default function Pf2eSheet({ data, onUpdate }) {
  const [tab, setTab] = useState(0);
  const [browser, setBrowser] = useState(null);

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

  function addAction(item) {
    const entry = { id: crypto.randomUUID(), name: item.name, type: item.actionType || "action", actionCount: 1, description: item.description || "" };
    onUpdate({ ...data, actions: [...(data.actions || []), entry] });
  }

  function removeAction(id) {
    onUpdate({ ...data, actions: (data.actions || []).filter((a) => a.id !== id) });
  }

  function addSpell(item) {
    const level = item.level ?? 0;
    const key = level === 0 ? "cantrips" : String(level);
    const existing = data.spells?.[key] || [];
    const spell = { id: crypto.randomUUID(), name: item.name, level, prepared: false, ...item };
    onUpdate({ ...data, spells: { ...data.spells, [key]: [...existing, spell] } });
  }

  function removeSpell(key, spellId) {
    onUpdate({ ...data, spells: { ...data.spells, [key]: (data.spells?.[key] || []).filter((s) => s.id !== spellId) } });
  }

  function addItem(item) {
    const entry = { id: crypto.randomUUID(), name: item.name, qty: 1, bulk: item.bulk || "L", invested: false, worn: false, rulesText: item.description || "" };
    onUpdate({ ...data, inventory: [...(data.inventory || []), entry] });
  }

  function removeItem(id) {
    onUpdate({ ...data, inventory: (data.inventory || []).filter((i) => i.id !== id) });
  }

  function addFeat(cat, item) {
    const entry = { id: crypto.randomUUID(), name: item.name, level: item.level, description: item.description || "" };
    const next = structuredClone(data);
    if (!next.feats[cat]) next.feats[cat] = [];
    next.feats[cat].push(entry);
    onUpdate(next);
  }

  function removeFeat(cat, id) {
    const next = structuredClone(data);
    next.feats[cat] = (next.feats[cat] || []).filter((f) => f.id !== id);
    onUpdate(next);
  }

  const level = data.level || 1;

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
          <ComboClass classes={PF2E_CLASSES} value={data.class || ""} onChange={(v) => set("class", v)} />
          <ComboField label="Ancestralidade" value={data.ancestry || ""} onChange={(v) => set("ancestry", v)} options={PF2E_ANCESTRIES} />
          <Input label="Herança" value={data.heritage || ""} onChange={(e) => set("heritage", e.target.value)} />
          <ComboField label="Antecedente" value={data.background || ""} onChange={(v) => set("background", v)} options={PF2E_BACKGROUNDS} />
          <Input label="Nível" type="number" value={data.level || 1} onChange={(e) => set("level", Number(e.target.value))} />
          <Input label="Divindade" value={data.deity || ""} onChange={(e) => set("deity", e.target.value)} />
          <Input label="Alinhamento" value={data.alignment || ""} onChange={(e) => set("alignment", e.target.value)} />
          <div className="sm:col-span-2">
            <label className="flex flex-col gap-1">
              <span className="font-display text-[10px] uppercase tracking-widest text-ink-muted">Notas gerais</span>
              <textarea value={data.notes || ""} onChange={(e) => set("notes", e.target.value)} rows={5}
                className="bg-parchment-deep border border-parchment-edge rounded-sheet px-2 py-1.5 text-sm text-ink placeholder:text-ink-faded focus:border-burgundy focus:outline-none resize-none w-full" />
            </label>
          </div>
        </div>
      )}

      {/* TAB 1: ATRIBUTOS */}
      {tab === 1 && (
        <div className="space-y-4">
          <div>
            <p className="font-display text-xs uppercase tracking-widest text-ink-muted mb-3">Atributos</p>
            <div className="flex flex-wrap gap-3">
              {PF2E_ABILITIES.map((ab) => (
                <StatBox key={ab} name={ABILITY_LABELS[ab]} value={data.abilities?.[ab] || 10} onChange={(v) => setAbility(ab, v)} />
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card>
              <Card.Header><p className="font-display text-xs uppercase tracking-widest text-ink-muted">Fortitude</p></Card.Header>
              <Card.Body>
                <RankSelector value={data.saves?.fort?.rank || 0} onChange={(r) => { const n = structuredClone(data); n.saves.fort.rank = r; onUpdate(n); }} />
                <p className="text-xs text-ink-muted font-serif mt-1">{PF2E_RANKS[data.saves?.fort?.rank || 0]}</p>
              </Card.Body>
            </Card>
            <Card>
              <Card.Header><p className="font-display text-xs uppercase tracking-widest text-ink-muted">Reflexo</p></Card.Header>
              <Card.Body>
                <RankSelector value={data.saves?.ref?.rank || 0} onChange={(r) => { const n = structuredClone(data); n.saves.ref.rank = r; onUpdate(n); }} />
                <p className="text-xs text-ink-muted font-serif mt-1">{PF2E_RANKS[data.saves?.ref?.rank || 0]}</p>
              </Card.Body>
            </Card>
            <Card>
              <Card.Header><p className="font-display text-xs uppercase tracking-widest text-ink-muted">Vontade</p></Card.Header>
              <Card.Body>
                <RankSelector value={data.saves?.will?.rank || 0} onChange={(r) => { const n = structuredClone(data); n.saves.will.rank = r; onUpdate(n); }} />
                <p className="text-xs text-ink-muted font-serif mt-1">{PF2E_RANKS[data.saves?.will?.rank || 0]}</p>
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
              { label: "CA", key: "ac" },
              { label: "Class DC", key: "classDC" },
              { label: "Velocidade", key: "speed" },
            ].map(({ label, key }) => (
              <label key={key} className="flex flex-col items-center gap-1 bg-parchment-deep border border-parchment-edge rounded-sheet p-3">
                <span className="font-display text-[9px] uppercase tracking-widest text-ink-muted">{label}</span>
                <input type="number" value={data[key] ?? 0} onChange={(e) => set(key, Number(e.target.value))}
                  className="w-full text-center text-xl font-display bg-transparent text-ink focus:outline-none tabular-nums" />
              </label>
            ))}
            <label className="flex flex-col items-center gap-1 bg-parchment-deep border border-parchment-edge rounded-sheet p-3">
              <span className="font-display text-[9px] uppercase tracking-widest text-ink-muted">Percepção</span>
              <RankSelector value={data.perception?.rank || 0} onChange={(r) => { const n = structuredClone(data); n.perception.rank = r; onUpdate(n); }} />
              <p className="text-xs text-ink-muted font-serif">{PF2E_RANKS[data.perception?.rank || 0]}</p>
            </label>
          </div>

          <Card>
            <Card.Header><p className="font-display text-xs uppercase tracking-widest text-ink-muted">Pontos de Vida</p></Card.Header>
            <Card.Body className="space-y-3">
              <HPBar current={data.hp?.current || 0} max={data.hp?.max || 0} />
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Input label="Máximo" type="number" value={data.hp?.max || 0} onChange={(e) => { const n = structuredClone(data); n.hp.max = Number(e.target.value); onUpdate(n); }} />
                <Input label="Atual" type="number" value={data.hp?.current || 0} onChange={(e) => { const n = structuredClone(data); n.hp.current = Number(e.target.value); onUpdate(n); }} />
                <Input label="Ferido" type="number" value={data.hp?.wounded || 0} onChange={(e) => { const n = structuredClone(data); n.hp.wounded = Number(e.target.value); onUpdate(n); }} />
                <Input label="Moribundo" type="number" value={data.hp?.dying || 0} onChange={(e) => { const n = structuredClone(data); n.hp.dying = Number(e.target.value); onUpdate(n); }} />
              </div>
            </Card.Body>
          </Card>
        </div>
      )}

      {/* TAB 3: PERÍCIAS */}
      {tab === 3 && (
        <Card>
          <Card.Body className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1">
            {PF2E_SKILLS.map((sk) => {
              const rank = data.skills?.[sk.key]?.rank || 0;
              const mod = abilityMod(data.abilities?.[sk.ability] || 10) + rankBonus(rank, level);
              const sign = mod >= 0 ? "+" : "";
              return (
                <div key={sk.key} className="flex items-center gap-2 py-1 border-b border-parchment-edge/40">
                  <span className="text-xs text-ink-muted w-6 tabular-nums font-display">{sign}{mod}</span>
                  <span className="font-serif text-sm text-ink flex-1">{sk.label}</span>
                  <span className="text-[9px] text-ink-faded font-display uppercase w-6">{ABILITY_LABELS[sk.ability]}</span>
                  <RankSelector
                    value={rank}
                    onChange={(r) => {
                      const n = structuredClone(data);
                      if (!n.skills[sk.key]) n.skills[sk.key] = { rank: 0, ability: sk.ability };
                      n.skills[sk.key].rank = r;
                      onUpdate(n);
                    }}
                  />
                </div>
              );
            })}
          </Card.Body>
        </Card>
      )}

      {/* TAB 4: AÇÕES */}
      {tab === 4 && (
        <div className="space-y-3">
          <div className="flex justify-end">
            <Button size="sm" variant="ghost" icon={<Plus size={14} />} onClick={() => setBrowser("actions")}>Buscar Ação</Button>
          </div>
          {(data.actions || []).length === 0 && (
            <p className="text-ink-muted font-serif italic text-sm py-8 text-center">Nenhuma ação. Clique em "Buscar Ação".</p>
          )}
          {(data.actions || []).map((action) => (
            <Card key={action.id}>
              <Card.Body>
                <div className="flex items-start gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Input value={action.name} onChange={(e) => {
                        const n = structuredClone(data); const idx = n.actions.findIndex((a) => a.id === action.id);
                        if (idx !== -1) n.actions[idx].name = e.target.value; onUpdate(n);
                      }} fieldClassName="font-display text-sm" />
                      <select value={action.type || "action"} onChange={(e) => {
                        const n = structuredClone(data); const idx = n.actions.findIndex((a) => a.id === action.id);
                        if (idx !== -1) n.actions[idx].type = e.target.value; onUpdate(n);
                      }} className="text-[10px] font-display uppercase bg-transparent border-b border-ink/30 text-ink-muted focus:border-burgundy focus:outline-none">
                        <option value="action">Ação</option>
                        <option value="reaction">Reação</option>
                        <option value="free">Livre</option>
                      </select>
                    </div>
                    <textarea value={action.description || ""} onChange={(e) => {
                      const n = structuredClone(data); const idx = n.actions.findIndex((a) => a.id === action.id);
                      if (idx !== -1) n.actions[idx].description = e.target.value; onUpdate(n);
                    }} rows={2} className="w-full bg-transparent border border-parchment-edge rounded-sheet px-2 py-1 text-sm text-ink placeholder:text-ink-faded focus:border-burgundy focus:outline-none resize-none" />
                  </div>
                  <button onClick={() => removeAction(action.id)} className="text-ink-faded hover:text-burgundy transition">
                    <Trash2 size={14} />
                  </button>
                </div>
              </Card.Body>
            </Card>
          ))}
          <Button size="sm" variant="ghost" icon={<Plus size={14} />} onClick={() => addAction({ name: "Nova Ação" })}>Adicionar manual</Button>
        </div>
      )}

      {/* TAB 5: MAGIAS */}
      {tab === 5 && (
        <div className="space-y-4">
          <Card>
            <Card.Header><p className="font-display text-xs uppercase tracking-widest text-ink-muted">Conjuração</p></Card.Header>
            <Card.Body className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <label className="flex flex-col gap-1">
                <span className="font-display text-[10px] uppercase tracking-widest text-ink-muted">Tradição</span>
                <select value={data.spellcasting?.tradition || ""} onChange={(e) => { const n = structuredClone(data); n.spellcasting.tradition = e.target.value; onUpdate(n); }}
                  className={`bg-transparent border-b border-ink/30 px-2 py-1 focus:border-burgundy focus:outline-none ${TRADITION_COLORS[data.spellcasting?.tradition] || "text-ink"}`}>
                  <option value="">—</option>
                  <option value="arcane">Arcana</option>
                  <option value="divine">Divina</option>
                  <option value="occult">Ocultismo</option>
                  <option value="primal">Primordial</option>
                </select>
              </label>
              <label className="flex flex-col gap-1">
                <span className="font-display text-[10px] uppercase tracking-widest text-ink-muted">Tipo</span>
                <select value={data.spellcasting?.type || "prepared"} onChange={(e) => { const n = structuredClone(data); n.spellcasting.type = e.target.value; onUpdate(n); }}
                  className="bg-transparent border-b border-ink/30 px-2 py-1 text-ink focus:border-burgundy focus:outline-none">
                  <option value="prepared">Preparadas</option>
                  <option value="spontaneous">Espontâneas</option>
                </select>
              </label>
              <label className="flex flex-col gap-1">
                <span className="font-display text-[10px] uppercase tracking-widest text-ink-muted">Atributo</span>
                <select value={data.spellcasting?.ability || ""} onChange={(e) => { const n = structuredClone(data); n.spellcasting.ability = e.target.value; onUpdate(n); }}
                  className="bg-transparent border-b border-ink/30 px-2 py-1 text-ink focus:border-burgundy focus:outline-none">
                  <option value="">—</option>
                  {PF2E_ABILITIES.map((ab) => <option key={ab} value={ab}>{ABILITY_PT[ab]}</option>)}
                </select>
              </label>
            </Card.Body>
          </Card>

          <div className="flex justify-end">
            <Button size="sm" variant="ghost" icon={<Plus size={14} />} onClick={() => setBrowser("spells")}>Buscar Magia</Button>
          </div>

          {[["Truques", "cantrips"], ...Array.from({ length: 10 }, (_, i) => [`Círculo ${i + 1}`, String(i + 1)])].map(([label, key]) => {
            const spells = data.spells?.[key] || [];
            if (key !== "cantrips" && spells.length === 0) return null;
            return (
              <Card key={key}>
                <Card.Header>
                  <p className="font-display text-xs uppercase tracking-widest text-ink-muted">{label}</p>
                </Card.Header>
                {spells.length > 0 && (
                  <Card.Body className="space-y-1">
                    {spells.map((sp) => (
                      <div key={sp.id} className="flex items-center gap-2 py-0.5">
                        <span className="font-serif text-sm text-ink flex-1">{sp.name}</span>
                        <button onClick={() => removeSpell(key, sp.id)} className="text-ink-faded hover:text-burgundy transition">
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

      {/* TAB 6: INVENTÁRIO */}
      {tab === 6 && (
        <div className="space-y-4">
          <Card>
            <Card.Header><p className="font-display text-xs uppercase tracking-widest text-ink-muted">Moeda</p></Card.Header>
            <Card.Body className="grid grid-cols-3 gap-3">
              {["cp", "sp", "gp"].map((c) => (
                <Input key={c} label={c.toUpperCase()} type="number" value={data.currency?.[c] || 0} onChange={(e) => { const n = structuredClone(data); n.currency[c] = Number(e.target.value); onUpdate(n); }} />
              ))}
            </Card.Body>
          </Card>

          <div className="flex justify-end">
            <Button size="sm" variant="ghost" icon={<Plus size={14} />} onClick={() => setBrowser("items")}>Buscar Item</Button>
          </div>

          {(data.inventory || []).map((item) => (
            <Card key={item.id}>
              <Card.Body className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div className="col-span-2">
                  <Input label="Nome" value={item.name} onChange={(e) => {
                    const n = structuredClone(data); const idx = n.inventory.findIndex((x) => x.id === item.id);
                    if (idx !== -1) n.inventory[idx].name = e.target.value; onUpdate(n);
                  }} />
                </div>
                <Input label="Qtd" type="number" value={item.qty || 1} onChange={(e) => {
                  const n = structuredClone(data); const idx = n.inventory.findIndex((x) => x.id === item.id);
                  if (idx !== -1) n.inventory[idx].qty = Number(e.target.value); onUpdate(n);
                }} />
                <Input label="Bulk" value={item.bulk || ""} onChange={(e) => {
                  const n = structuredClone(data); const idx = n.inventory.findIndex((x) => x.id === item.id);
                  if (idx !== -1) n.inventory[idx].bulk = e.target.value; onUpdate(n);
                }} />
                <div className="flex items-end gap-2 pb-1">
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input type="checkbox" checked={!!item.invested} onChange={(e) => {
                      const n = structuredClone(data); const idx = n.inventory.findIndex((x) => x.id === item.id);
                      if (idx !== -1) n.inventory[idx].invested = e.target.checked; onUpdate(n);
                    }} className="accent-gold" />
                    <span className="font-display text-[9px] uppercase tracking-widest text-ink-muted">Investido</span>
                  </label>
                  <button onClick={() => removeItem(item.id)} className="text-ink-faded hover:text-burgundy transition ml-auto">
                    <Trash2 size={14} />
                  </button>
                </div>
              </Card.Body>
            </Card>
          ))}
          <Button size="sm" variant="ghost" icon={<Plus size={14} />} onClick={() => addItem({ name: "Novo Item" })}>Adicionar manual</Button>
        </div>
      )}

      {/* TAB 7: FEATS */}
      {tab === 7 && (
        <div className="space-y-4">
          <ClassSuggestions
            className={findClassSlug(data.class) ? data.class : null}
            level={data.level || 1}
            fetchFn={(cls, lvl) => api.searchByClass("pf2e", "classfeats", findClassSlug(cls) || cls, lvl)}
            addedNames={Object.values(data.feats || {}).flat().map((f) => f.name)}
            onAdd={(item) => addFeat("class", item)}
          />
          {Object.entries(FEAT_CATS).map(([cat, label]) => (
            <Card key={cat}>
              <Card.Header>
                <p className="font-display text-xs uppercase tracking-widest text-ink-muted">{label}</p>
                <button onClick={() => setBrowser(`feat_${cat}`)} className="text-ink-muted hover:text-burgundy transition">
                  <Plus size={16} />
                </button>
              </Card.Header>
              {(data.feats?.[cat] || []).length > 0 && (
                <Card.Body className="space-y-1">
                  {(data.feats?.[cat] || []).map((feat) => (
                    <div key={feat.id} className="flex items-center gap-2">
                      <span className="font-serif text-sm text-ink flex-1">{feat.name}</span>
                      {feat.level && <span className="text-[10px] text-ink-faded font-display">Nv.{feat.level}</span>}
                      <button onClick={() => removeFeat(cat, feat.id)} className="text-ink-faded hover:text-burgundy transition">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </Card.Body>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Browsers */}
      <BrowserPanel open={browser === "spells"} onClose={() => setBrowser(null)} title="Buscar Magia (PF2e)"
        searchFn={pf2eApi.searchSpells}
        renderResult={(r) => <p className="text-xs text-ink-muted font-serif">{r.level !== undefined ? `Círculo ${r.level}` : ""}{r.tradition ? ` · ${r.tradition}` : ""}</p>}
        onAdd={addSpell} />
      <BrowserPanel open={browser === "items"} onClose={() => setBrowser(null)} title="Buscar Item (PF2e)"
        searchFn={pf2eApi.searchItems}
        renderResult={(r) => <p className="text-xs text-ink-muted font-serif">{r.category}{r.bulk ? ` · Bulk ${r.bulk}` : ""}</p>}
        onAdd={addItem} />
      <BrowserPanel open={browser === "actions"} onClose={() => setBrowser(null)} title="Buscar Ação (PF2e)"
        searchFn={pf2eApi.searchActions}
        renderResult={(r) => <p className="text-xs text-ink-muted font-serif">{r.actionType}</p>}
        onAdd={addAction} />
      {Object.keys(FEAT_CATS).map((cat) => (
        <BrowserPanel key={cat} open={browser === `feat_${cat}`} onClose={() => setBrowser(null)}
          title={`Buscar Feat de ${FEAT_CATS[cat]} (PF2e)`}
          searchFn={pf2eApi.searchFeats}
          renderResult={(r) => <p className="text-xs text-ink-muted font-serif">{r.level !== undefined ? `Nível ${r.level}` : ""}{r.traits ? ` · ${r.traits}` : ""}</p>}
          onAdd={(item) => addFeat(cat, item)} />
      ))}
    </div>
  );
}
