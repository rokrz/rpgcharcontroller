import { useState } from "react";
import { Plus, Trash2, Star, Zap, Heart, Wind } from "lucide-react";
import Card from "../../components/ui/Card.jsx";
import Button from "../../components/ui/Button.jsx";
import Input from "../../components/ui/Input.jsx";
import Badge from "../../components/ui/Badge.jsx";
import BrowserPanel from "../../components/browsers/BrowserPanel.jsx";
import ClassSuggestions from "../../components/ClassSuggestions.jsx";
import { daggerheartApi } from "./api.js";
import { DH_TRAITS, DH_DOMAINS } from "./schema.js";
import { DH_CLASSES, findClassSlug, DH_ANCESTRIES, DH_COMMUNITIES } from "./classes.js";
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

const TABS = ["Personagem", "Habilidades", "Inventário", "Notas"];

const DOMAIN_COLORS = {
  Arcana: "magic", Blade: "debuff", Bone: "neutral", Codex: "buff",
  Grace: "buff", Midnight: "neutral", Sage: "buff", Splendor: "burn",
  Valor: "debuff", Wanderer: "neutral",
};

function ResourceTracker({ label, current, max, color, onChangeCurrent, onChangeMax, icon: Icon }) {
  const pct = max > 0 ? Math.min(100, (current / max) * 100) : 0;
  const bars = Math.max(0, Number(max) || 0);

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {Icon && <Icon size={12} className={color} />}
          <span className="font-display text-[9px] uppercase tracking-widest text-ink-muted">{label}</span>
        </div>
        <div className="flex items-center gap-1 text-xs text-ink-muted">
          <input type="number" value={current} onChange={(e) => onChangeCurrent(Number(e.target.value))}
            className="w-8 text-center bg-transparent border-b border-ink/30 text-ink focus:border-burgundy focus:outline-none tabular-nums" min={0} max={max} />
          <span>/</span>
          <input type="number" value={max} onChange={(e) => onChangeMax(Number(e.target.value))}
            className="w-8 text-center bg-transparent border-b border-ink/30 text-ink focus:border-burgundy focus:outline-none tabular-nums" min={0} />
        </div>
      </div>
      <div className="flex gap-0.5">
        {Array.from({ length: Math.min(bars, 12) }).map((_, i) => (
          <button
            key={i}
            onClick={() => onChangeCurrent(i < current ? i : i + 1)}
            className={`flex-1 h-3 rounded-full border transition ${i < current ? `bg-current border-current ${color}` : "bg-transparent border-parchment-edge"}`}
          />
        ))}
      </div>
    </div>
  );
}

function TraitBox({ label, value, onChange }) {
  const sign = value >= 0 ? "+" : "";
  return (
    <div className="flex flex-col items-center gap-0.5 bg-parchment-deep border border-parchment-edge rounded-sheet p-2 min-w-[60px]">
      <span className="font-display text-[9px] uppercase tracking-widest text-ink-muted">{label}</span>
      <input type="number" value={value} onChange={(e) => onChange(Number(e.target.value))}
        className="w-full text-center text-xl font-display bg-transparent text-ink focus:outline-none tabular-nums" min={-3} max={5} />
      <span className="font-display text-xs text-ink-muted">{sign}{value}</span>
    </div>
  );
}

export default function DaggerheartSheet({ data, onUpdate }) {
  const [tab, setTab] = useState(0);
  const [browser, setBrowser] = useState(false);

  function set(path, value) {
    const next = structuredClone(data);
    const keys = path.split(".");
    let obj = next;
    for (let i = 0; i < keys.length - 1; i++) obj = obj[keys[i]];
    obj[keys[keys.length - 1]] = value;
    onUpdate(next);
  }

  function setTrait(key, value) {
    onUpdate({ ...data, [key]: value });
  }

  const ancestry = typeof data.ancestry === "object" && data.ancestry !== null
    ? data.ancestry
    : { primary: data.ancestry || "", secondary: "" };

  function setAncestry(key, value) {
    onUpdate({ ...data, ancestry: { ...ancestry, [key]: value } });
  }

  function addCard(item) {
    const entry = {
      id: crypto.randomUUID(),
      domain: item.domain || "",
      name: item.name,
      tier: item.type || "Foundation",
      type: item.type || "ability",
      level: item.level || 1,
      description: item.description || "",
      mechanics: item.mechanics || "",
    };
    onUpdate({ ...data, domainCards: [...(data.domainCards || []), entry] });
  }

  function removeCard(id) {
    onUpdate({ ...data, domainCards: (data.domainCards || []).filter((c) => c.id !== id) });
  }

  function addExperience() {
    onUpdate({ ...data, experiences: [...(data.experiences || []), { id: crypto.randomUUID(), name: "", bonus: 0 }] });
  }

  function removeExperience(id) {
    onUpdate({ ...data, experiences: (data.experiences || []).filter((e) => e.id !== id) });
  }

  function addItem() {
    onUpdate({ ...data, inventory: [...(data.inventory || []), { id: crypto.randomUUID(), name: "", qty: 1, description: "" }] });
  }

  function removeItem(id) {
    onUpdate({ ...data, inventory: (data.inventory || []).filter((i) => i.id !== id) });
  }

  return (
    <div className="max-w-4xl mx-auto px-3 py-4">
      <div className="flex gap-1 flex-wrap mb-4 border-b border-parchment-edge pb-2">
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setTab(i)}
            className={`font-display text-[11px] uppercase tracking-widest px-3 py-1.5 rounded-sheet transition ${tab === i ? "bg-burgundy text-parchment" : "text-ink-muted hover:text-ink hover:bg-parchment-edge/40"}`}>
            {t}
          </button>
        ))}
      </div>

      {/* TAB 0: PERSONAGEM */}
      {tab === 0 && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Nome" value={data.name || ""} onChange={(e) => set("name", e.target.value)} />
            <Input label="Pronomes" value={data.pronouns || ""} onChange={(e) => set("pronouns", e.target.value)} />
            <ComboClass classes={DH_CLASSES} value={data.class || ""} onChange={(v) => set("class", v)} />
            <Input label="Subclasse" value={data.subclass || ""} onChange={(e) => set("subclass", e.target.value)} />
            <ComboField label="Ancestralidade Primária" value={ancestry.primary} onChange={(v) => setAncestry("primary", v)} options={DH_ANCESTRIES} />
            <ComboField label="Ancestralidade Secundária" value={ancestry.secondary} onChange={(v) => setAncestry("secondary", v)} options={DH_ANCESTRIES} />
            <ComboField label="Comunidade" value={data.community || ""} onChange={(v) => set("community", v)} options={DH_COMMUNITIES} />
            <Input label="Nível" type="number" value={data.level || 1} onChange={(e) => set("level", Number(e.target.value))} />
            <Input label="Proficiência" type="number" value={data.proficiency || 1} onChange={(e) => set("proficiency", Number(e.target.value))} />
          </div>

          {/* Recursos vitais */}
          <Card>
            <Card.Header><p className="font-display text-xs uppercase tracking-widest text-ink-muted">Recursos</p></Card.Header>
            <Card.Body className="space-y-4">
              <ResourceTracker label="HP" current={data.hp?.current ?? 6} max={data.hp?.max ?? 6} color="text-hp-healthy" icon={Heart}
                onChangeCurrent={(v) => { const n = structuredClone(data); n.hp.current = v; onUpdate(n); }}
                onChangeMax={(v) => { const n = structuredClone(data); n.hp.max = v; onUpdate(n); }} />
              <ResourceTracker label="Estresse" current={data.stress?.current ?? 0} max={data.stress?.max ?? 6} color="text-cond-burn" icon={Zap}
                onChangeCurrent={(v) => { const n = structuredClone(data); n.stress.current = v; onUpdate(n); }}
                onChangeMax={(v) => { const n = structuredClone(data); n.stress.max = v; onUpdate(n); }} />
            </Card.Body>
          </Card>

          {/* Hope, Fear, Armor */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Esperança", key: "hope", icon: Star, color: "text-gold" },
              { label: "Medo", key: "fear", icon: Wind, color: "text-cond-magic" },
              { label: "Evasão", key: "evasion", icon: null, color: "" },
              { label: "Armadura", key: "armorScore", icon: null, color: "" },
            ].map(({ label, key, icon: Icon, color }) => (
              <label key={key} className="flex flex-col items-center gap-1 bg-parchment-deep border border-parchment-edge rounded-sheet p-3">
                <div className="flex items-center gap-1">
                  {Icon && <Icon size={12} className={color} />}
                  <span className="font-display text-[9px] uppercase tracking-widest text-ink-muted">{label}</span>
                </div>
                <input type="number" value={data[key] ?? 0} onChange={(e) => set(key, Number(e.target.value))}
                  className="w-full text-center text-2xl font-display bg-transparent text-ink focus:outline-none tabular-nums" />
              </label>
            ))}
          </div>

          {/* Slots de armadura */}
          <Card>
            <Card.Header>
              <p className="font-display text-xs uppercase tracking-widest text-ink-muted">Slots de Armadura</p>
              <div className="flex gap-1">
                {Array.from({ length: Math.min(data.armorSlots?.total || 0, 8) }).map((_, i) => (
                  <button key={i} onClick={() => set("armorSlots.marked", i < (data.armorSlots?.marked || 0) ? i : i + 1)}
                    className={`w-4 h-4 rounded border transition ${i < (data.armorSlots?.marked || 0) ? "bg-ink border-ink" : "bg-transparent border-parchment-edge"}`} />
                ))}
                <input type="number" value={data.armorSlots?.total || 0} onChange={(e) => { const n = structuredClone(data); n.armorSlots.total = Number(e.target.value); onUpdate(n); }}
                  className="w-8 text-center text-xs bg-transparent border-b border-ink/30 text-ink-muted focus:outline-none ml-2" min={0} max={8} />
              </div>
            </Card.Header>
          </Card>

          {/* Experiências */}
          <Card>
            <Card.Header>
              <p className="font-display text-xs uppercase tracking-widest text-ink-muted">Experiências</p>
              <button onClick={addExperience} className="text-ink-muted hover:text-burgundy transition"><Plus size={16} /></button>
            </Card.Header>
            <Card.Body className="space-y-2">
              {(data.experiences || []).map((exp) => (
                <div key={exp.id} className="flex items-center gap-2">
                  <Input value={exp.name} placeholder="Nome da experiência" onChange={(e) => {
                    const n = structuredClone(data); const idx = n.experiences.findIndex((x) => x.id === exp.id);
                    if (idx !== -1) n.experiences[idx].name = e.target.value; onUpdate(n);
                  }} className="flex-1" />
                  <input type="number" value={exp.bonus || 0} onChange={(e) => {
                    const n = structuredClone(data); const idx = n.experiences.findIndex((x) => x.id === exp.id);
                    if (idx !== -1) n.experiences[idx].bonus = Number(e.target.value); onUpdate(n);
                  }} className="w-12 text-center text-sm bg-transparent border-b border-ink/30 text-ink focus:border-burgundy focus:outline-none" min={-3} max={5} />
                  <button onClick={() => removeExperience(exp.id)} className="text-ink-faded hover:text-burgundy transition">
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
              {(data.experiences || []).length === 0 && (
                <p className="text-ink-muted font-serif italic text-sm">Clique em + para adicionar experiências.</p>
              )}
            </Card.Body>
          </Card>
        </div>
      )}

      {/* TAB 1: HABILIDADES (Domain Cards + Class Features) */}
      {tab === 1 && (
        <div className="space-y-4">
          <ClassSuggestions
            className={findClassSlug(data.class) ? data.class : null}
            level={data.level || 1}
            fetchFn={(cls) => api.searchByClass("daggerheart", "classcards", findClassSlug(cls) || cls, 20)}
            addedNames={(data.domainCards || []).map((c) => c.name)}
            onAdd={addCard}
          />
          {/* Traits */}
          <div>
            <p className="font-display text-xs uppercase tracking-widest text-ink-muted mb-3">Características</p>
            <div className="flex flex-wrap gap-2">
              {DH_TRAITS.map((t) => (
                <TraitBox key={t.key} label={t.label} value={data[t.key] ?? 0} onChange={(v) => setTrait(t.key, v)} />
              ))}
            </div>
          </div>

          {/* Class features */}
          <Card>
            <Card.Header><p className="font-display text-xs uppercase tracking-widest text-ink-muted">Traços de Classe</p></Card.Header>
            <Card.Body className="space-y-3">
              {[["foundation", "Fundação"], ["specialty", "Especialidade"], ["mastery", "Maestria"]].map(([key, label]) => (
                <div key={key}>
                  <p className="font-display text-[10px] uppercase tracking-widest text-ink-muted mb-1">{label}</p>
                  <Input value={data.classFeatures?.[key]?.name || ""} placeholder="Nome..." onChange={(e) => { const n = structuredClone(data); n.classFeatures[key].name = e.target.value; onUpdate(n); }} className="mb-1" />
                  <textarea value={data.classFeatures?.[key]?.description || ""} placeholder="Descrição..." onChange={(e) => { const n = structuredClone(data); n.classFeatures[key].description = e.target.value; onUpdate(n); }}
                    rows={2} className="w-full bg-transparent border border-parchment-edge rounded-sheet px-2 py-1 text-sm text-ink placeholder:text-ink-faded focus:border-burgundy focus:outline-none resize-none" />
                </div>
              ))}
            </Card.Body>
          </Card>

          {/* Domain Cards */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="font-display text-xs uppercase tracking-widest text-ink-muted">Cards de Domínio</p>
              <Button size="sm" variant="ghost" icon={<Plus size={14} />} onClick={() => setBrowser(true)}>Buscar Card</Button>
            </div>

            {(data.domainCards || []).length === 0 && (
              <p className="text-ink-muted font-serif italic text-sm py-6 text-center">Nenhum card. Clique em "Buscar Card".</p>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(data.domainCards || []).map((card) => (
                <div key={card.id}
                  className={`relative bg-parchment-deep border-2 rounded-sheet p-3 border-cond-${DOMAIN_COLORS[card.domain] || "neutral"}/40`}>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <p className="font-display text-sm text-ink">{card.name}</p>
                      <div className="flex gap-2 mt-0.5">
                        {card.domain && <Badge tone={DOMAIN_COLORS[card.domain] || "neutral"}>{card.domain}</Badge>}
                        {card.tier && <Badge tone="neutral">{card.tier}</Badge>}
                        {card.level && <span className="text-[10px] text-ink-faded font-display uppercase tracking-widest">Nv.{card.level}</span>}
                      </div>
                    </div>
                    <button onClick={() => removeCard(card.id)} className="text-ink-faded hover:text-burgundy transition shrink-0">
                      <Trash2 size={14} />
                    </button>
                  </div>
                  {card.description && <p className="text-xs text-ink-muted font-serif leading-relaxed">{card.description}</p>}
                  {card.mechanics && <p className="text-xs text-cond-magic font-serif mt-1 italic">{card.mechanics}</p>}
                </div>
              ))}
            </div>

            <Button size="sm" variant="ghost" icon={<Plus size={14} />} className="mt-3" onClick={() => addCard({ name: "Novo Card", tier: "Foundation" })}>Adicionar manual</Button>
          </div>
        </div>
      )}

      {/* TAB 2: INVENTÁRIO */}
      {tab === 2 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Input label="Gold" type="number" value={data.gold || 0} onChange={(e) => set("gold", Number(e.target.value))} className="w-32" />
            <Button size="sm" variant="ghost" icon={<Plus size={14} />} onClick={addItem}>Adicionar Item</Button>
          </div>

          {(data.inventory || []).length === 0 && (
            <p className="text-ink-muted font-serif italic text-sm py-8 text-center">Nenhum item.</p>
          )}

          {(data.inventory || []).map((item) => (
            <Card key={item.id}>
              <Card.Body className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="col-span-2">
                  <Input label="Item" value={item.name} onChange={(e) => {
                    const n = structuredClone(data); const idx = n.inventory.findIndex((x) => x.id === item.id);
                    if (idx !== -1) n.inventory[idx].name = e.target.value; onUpdate(n);
                  }} />
                </div>
                <Input label="Qtd" type="number" value={item.qty || 1} onChange={(e) => {
                  const n = structuredClone(data); const idx = n.inventory.findIndex((x) => x.id === item.id);
                  if (idx !== -1) n.inventory[idx].qty = Number(e.target.value); onUpdate(n);
                }} />
                <div className="flex items-end pb-1">
                  <button onClick={() => removeItem(item.id)} className="text-ink-faded hover:text-burgundy transition ml-auto">
                    <Trash2 size={14} />
                  </button>
                </div>
                <div className="col-span-2 sm:col-span-4">
                  <Input label="Descrição" value={item.description || ""} onChange={(e) => {
                    const n = structuredClone(data); const idx = n.inventory.findIndex((x) => x.id === item.id);
                    if (idx !== -1) n.inventory[idx].description = e.target.value; onUpdate(n);
                  }} />
                </div>
              </Card.Body>
            </Card>
          ))}
        </div>
      )}

      {/* TAB 3: NOTAS */}
      {tab === 3 && (
        <div className="space-y-4">
          {[["backstory", "Backstory"], ["connections", "Conexões"], ["notes", "Notas"]].map(([key, label]) => (
            <label key={key} className="flex flex-col gap-1">
              <span className="font-display text-[10px] uppercase tracking-widest text-ink-muted">{label}</span>
              <textarea value={data[key] || ""} onChange={(e) => set(key, e.target.value)} rows={6}
                className="bg-parchment-deep border border-parchment-edge rounded-sheet px-2 py-1.5 text-sm text-ink placeholder:text-ink-faded focus:border-burgundy focus:outline-none resize-none w-full" />
            </label>
          ))}
        </div>
      )}

      <BrowserPanel
        open={browser === true}
        onClose={() => setBrowser(false)}
        title="Buscar Card de Domínio"
        searchFn={daggerheartApi.searchCards}
        renderResult={(r) => (
          <p className="text-xs text-ink-muted font-serif">
            {r.class}{r.tier ? ` · ${r.tier}` : ""}
          </p>
        )}
        onAdd={addCard}
      />
    </div>
  );
}
