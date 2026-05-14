import { useState } from "react";
import { Info, ChevronDown, ChevronUp, Plus, Check } from "lucide-react";
import Card from "./ui/Card.jsx";

const ABILITY_PT = {
  Strength: "Força",        STR: "Força",
  Dexterity: "Destreza",    DEX: "Destreza",
  Constitution: "Constituição", CON: "Constituição",
  Intelligence: "Inteligência", INT: "Inteligência",
  Wisdom: "Sabedoria",      WIS: "Sabedoria",
  Charisma: "Carisma",      CHA: "Carisma",
};

const ABILITY_KEY = {
  Strength: "str", STR: "str",
  Dexterity: "dex", DEX: "dex",
  Constitution: "con", CON: "con",
  Intelligence: "int", INT: "int",
  Wisdom: "wis", WIS: "wis",
  Charisma: "cha", CHA: "cha",
};

const DND5E_LANGUAGES = [
  "Comum", "Anão", "Élfico", "Gigante", "Gnômico", "Goblin",
  "Halfling", "Orc", "Abissal", "Celestial", "Dracônico",
  "Fala Profunda", "Infernal", "Primordial", "Silvano", "Subcomum",
];

function alreadyIn(field, value) {
  return (field || "").toLowerCase().includes(value.toLowerCase());
}

export default function TraitInfoPanel({ details, type, data, onApplySkill, onAppendLanguage, onAppendProficiency, onAddTrait, onApplyAbilityBonus }) {
  const [open, setOpen] = useState(true);
  const [featureOpen, setFeatureOpen] = useState(false);

  if (!details) return null;

  const hasContent =
    details.abilityBonuses?.length > 0 ||
    details.skillProficiencies?.length > 0 ||
    details.otherProficiencies?.length > 0 ||
    details.languages?.length > 0 ||
    details.traits?.length > 0 ||
    details.languageOptions > 0 ||
    details.feature;

  if (!hasContent) return null;

  return (
    <Card className="border-gold/20 bg-parchment-deep/40">
      <Card.Header>
        <div className="flex items-center gap-2">
          <Info size={13} className="text-gold shrink-0" />
          <p className="font-display text-xs uppercase tracking-widest text-ink-muted">
            {details.name}
            {details.speed ? ` · ${details.speed} ft` : ""}
            {details.darkvision ? ` · Visão Noturna ${details.darkvision} ft` : ""}
            {details.size ? ` · Tam. ${details.size}` : ""}
          </p>
        </div>
        <button onClick={() => setOpen((v) => !v)} className="text-ink-muted hover:text-ink transition shrink-0">
          {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </Card.Header>

      {open && (
        <Card.Body className="space-y-2.5 pt-1">
          {/* Bônus de atributo */}
          {details.abilityBonuses?.length > 0 && (
            <div>
              <p className="font-display text-[9px] uppercase tracking-widest text-ink-faded mb-1">Bônus de Atributo</p>
              <div className="flex flex-wrap gap-1.5">
                {details.abilityBonuses.map((b) => {
                  const abilityKey = ABILITY_KEY[b.abilityName];
                  const label = `${b.bonus >= 0 ? "+" : ""}${b.bonus} ${ABILITY_PT[b.abilityName] || b.abilityName}`;
                  const already = abilityKey && (data?.appliedRaceBonuses?.[details.index] || []).includes(abilityKey);
                  if (!onApplyAbilityBonus || !abilityKey) {
                    return (
                      <span key={b.abilityName} className="text-xs font-serif px-2 py-0.5 rounded-sheet border border-parchment-edge text-ink-muted">
                        {label}
                      </span>
                    );
                  }
                  return (
                    <button
                      key={b.abilityName}
                      onClick={() => !already && onApplyAbilityBonus(abilityKey, b.bonus, details.index)}
                      disabled={already}
                      title={already ? "Já aplicado" : "Aplicar bônus ao atributo"}
                      className={`flex items-center gap-1 text-xs font-serif px-2 py-0.5 rounded-sheet border transition ${
                        already
                          ? "border-hp-healthy/40 text-hp-healthy cursor-default"
                          : "border-parchment-edge text-ink hover:border-burgundy hover:text-burgundy"
                      }`}
                    >
                      {already ? <Check size={10} /> : <Plus size={10} />}
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Proficiências em perícias */}
          {details.skillProficiencies?.length > 0 && (
            <div>
              <p className="font-display text-[9px] uppercase tracking-widest text-ink-faded mb-1">Proficiência em Perícia</p>
              <div className="flex flex-wrap gap-1.5">
                {details.skillProficiencies.map((sk) => {
                  const already = data?.skills?.[sk.key] === true;
                  return (
                    <button
                      key={sk.key}
                      onClick={() => !already && onApplySkill(sk.key)}
                      disabled={already}
                      title={already ? "Já marcada" : "Marcar perícia"}
                      className={`flex items-center gap-1 text-xs font-serif px-2 py-0.5 rounded-sheet border transition ${
                        already
                          ? "border-hp-healthy/40 text-hp-healthy cursor-default"
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
          )}

          {/* Outras proficiências */}
          {details.otherProficiencies?.length > 0 && (
            <div>
              <p className="font-display text-[9px] uppercase tracking-widest text-ink-faded mb-1">Proficiências</p>
              <div className="flex flex-wrap gap-1.5">
                {details.otherProficiencies.map((prof) => {
                  const already = alreadyIn(data?.otherProficiencies, prof);
                  return (
                    <button
                      key={prof}
                      onClick={() => !already && onAppendProficiency(prof)}
                      disabled={already}
                      title={already ? "Já adicionada" : "Adicionar"}
                      className={`flex items-center gap-1 text-xs font-serif px-2 py-0.5 rounded-sheet border transition ${
                        already
                          ? "border-hp-healthy/40 text-hp-healthy cursor-default"
                          : "border-parchment-edge text-ink hover:border-burgundy hover:text-burgundy"
                      }`}
                    >
                      {already ? <Check size={10} /> : <Plus size={10} />}
                      {prof}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Idiomas */}
          {details.languages?.length > 0 && (
            <div>
              <p className="font-display text-[9px] uppercase tracking-widest text-ink-faded mb-1">Idiomas</p>
              <div className="flex flex-wrap gap-1.5">
                {details.languages.map((lang) => {
                  const already = alreadyIn(data?.languages, lang);
                  return (
                    <button
                      key={lang}
                      onClick={() => !already && onAppendLanguage(lang)}
                      disabled={already}
                      title={already ? "Já no campo" : "Adicionar ao campo Idiomas"}
                      className={`flex items-center gap-1 text-xs font-serif px-2 py-0.5 rounded-sheet border transition ${
                        already
                          ? "border-hp-healthy/40 text-hp-healthy cursor-default"
                          : "border-parchment-edge text-ink hover:border-burgundy hover:text-burgundy"
                      }`}
                    >
                      {already ? <Check size={10} /> : <Plus size={10} />}
                      {lang}
                    </button>
                  );
                })}
              </div>
              {details.languageDesc && (
                <p className="text-[10px] text-ink-faded font-serif mt-1 italic">{details.languageDesc}</p>
              )}
            </div>
          )}

          {/* Escolha de idiomas (backgrounds) */}
          {details.languageOptions > 0 && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <p className="font-display text-[9px] uppercase tracking-widest text-ink-faded">
                  Escolha de Idiomas
                </p>
                {(() => {
                  const picked = DND5E_LANGUAGES.filter((l) => alreadyIn(data?.languages, l)).length;
                  const max = details.languageOptions;
                  return (
                    <span className={`text-[9px] font-display tabular-nums ${picked >= max ? "text-hp-healthy" : "text-ink-faded"}`}>
                      {picked}/{max}
                    </span>
                  );
                })()}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {DND5E_LANGUAGES.map((lang) => {
                  const already = alreadyIn(data?.languages, lang);
                  const picked = DND5E_LANGUAGES.filter((l) => alreadyIn(data?.languages, l)).length;
                  const maxReached = picked >= details.languageOptions;
                  const disabled = already || maxReached;
                  return (
                    <button
                      key={lang}
                      onClick={() => !disabled && onAppendLanguage(lang)}
                      disabled={disabled}
                      title={already ? "Já adicionado" : maxReached ? "Limite atingido" : "Adicionar idioma"}
                      className={`flex items-center gap-1 text-xs font-serif px-2 py-0.5 rounded-sheet border transition ${
                        already
                          ? "border-hp-healthy/40 text-hp-healthy cursor-default"
                          : maxReached
                          ? "border-parchment-edge text-ink-faded cursor-not-allowed opacity-40"
                          : "border-parchment-edge text-ink hover:border-burgundy hover:text-burgundy"
                      }`}
                    >
                      {already ? <Check size={10} /> : <Plus size={10} />}
                      {lang}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Traços da raça */}
          {details.traits?.length > 0 && (
            <div>
              <p className="font-display text-[9px] uppercase tracking-widest text-ink-faded mb-1">Traços</p>
              <div className="flex flex-wrap gap-1.5">
                {details.traits.map((trait) => {
                  const already = (data?.features || []).some((f) => f.name === trait);
                  return (
                    <button
                      key={trait}
                      onClick={() => !already && onAddTrait && onAddTrait(trait)}
                      disabled={already || !onAddTrait}
                      title={already ? "Já adicionado" : "Adicionar à ficha"}
                      className={`flex items-center gap-1 text-xs font-serif px-2 py-0.5 rounded-sheet border transition ${
                        already
                          ? "border-hp-healthy/40 text-hp-healthy cursor-default"
                          : onAddTrait
                          ? "border-parchment-edge text-ink hover:border-burgundy hover:text-burgundy"
                          : "border-parchment-edge text-ink-muted cursor-default"
                      }`}
                    >
                      {already ? <Check size={10} /> : <Plus size={10} />}
                      {trait}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Feature do antecedente */}
          {details.feature && (
            <div>
              <button
                onClick={() => setFeatureOpen((v) => !v)}
                className="flex items-center gap-1.5 font-display text-[9px] uppercase tracking-widest text-ink-faded hover:text-ink transition"
              >
                {featureOpen ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                Característica: {details.feature.name}
              </button>
              {featureOpen && (
                <p className="text-xs text-ink-muted font-serif mt-1 leading-relaxed">
                  {details.feature.desc}
                </p>
              )}
            </div>
          )}
        </Card.Body>
      )}
    </Card>
  );
}
