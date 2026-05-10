import { useState, useEffect, useRef } from "react";
import { X, Search, Plus, BookOpen } from "lucide-react";
import Button from "../ui/Button.jsx";
import { useRulesWindow } from "../../context/RulesWindowContext.jsx";

export default function BrowserPanel({ open, onClose, title, searchFn, renderResult, onAdd }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const debounceRef = useRef(null);
  const { openWindow } = useRulesWindow();

  useEffect(() => {
    if (!open) return;
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await searchFn(query);
        setResults(data.results || data || []);
      } catch (e) {
        setError("Erro ao buscar. Verifique a conexão.");
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 350);
    return () => clearTimeout(debounceRef.current);
  }, [query, open, searchFn]);

  useEffect(() => {
    if (!open) { setQuery(""); setResults([]); }
  }, [open]);

  function handleView(item) {
    const label = renderResult ? renderResult(item)?.label : item.name;
    const content = buildContent(item);
    openWindow({ title: item.name, content, source: item.source || item.type || "" });
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-ink/20" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-parchment border-l border-parchment-edge shadow-[−4px_0_24px_rgba(0,0,0,0.15)] flex flex-col h-full">
        <div className="flex items-center justify-between px-4 py-3 border-b border-parchment-edge bg-parchment-deep shrink-0">
          <span className="font-display text-sm uppercase tracking-widest text-ink">{title}</span>
          <button onClick={onClose} className="text-ink-muted hover:text-burgundy transition">
            <X size={18} />
          </button>
        </div>

        <div className="px-4 py-3 border-b border-parchment-edge shrink-0">
          <div className="relative">
            <Search size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-ink-muted" />
            <input
              autoFocus
              type="text"
              placeholder="Buscar..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-7 pr-3 py-1.5 text-sm bg-parchment border border-parchment-edge rounded-sheet text-ink placeholder:text-ink-faded focus:border-burgundy focus:outline-none"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-2 py-2">
          {loading && (
            <p className="text-center text-ink-muted text-sm py-8 font-serif italic">Buscando...</p>
          )}
          {error && (
            <p className="text-center text-burgundy text-sm py-8 font-serif">{error}</p>
          )}
          {!loading && !error && results.length === 0 && (
            <p className="text-center text-ink-muted text-sm py-8 font-serif italic">
              {query ? "Nenhum resultado." : "Digite para buscar."}
            </p>
          )}
          {results.map((item, i) => (
            <div
              key={item.index || item.name || i}
              className="flex items-start gap-2 px-3 py-2.5 rounded-sheet hover:bg-parchment-deep transition mb-1 group"
            >
              <div className="flex-1 min-w-0">
                <p className="font-display text-sm text-ink truncate">{item.name}</p>
                {renderResult && renderResult(item)}
              </div>
              <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition">
                <button
                  onClick={() => handleView(item)}
                  className="text-ink-muted hover:text-gold transition"
                  title="Ver regras"
                >
                  <BookOpen size={14} />
                </button>
                <button
                  onClick={() => { onAdd(item); onClose(); }}
                  className="text-ink-muted hover:text-burgundy transition"
                  title="Adicionar à ficha"
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function buildContent(item) {
  const lines = [];
  if (item.level !== undefined) lines.push(`**Nível:** ${item.level}`);
  if (item.school) lines.push(`**Escola:** ${item.school}`);
  if (item.tradition) lines.push(`**Tradição:** ${item.tradition}`);
  if (item.castingTime) lines.push(`**Tempo de conjuração:** ${item.castingTime}`);
  if (item.range) lines.push(`**Alcance:** ${item.range}`);
  if (item.components) lines.push(`**Componentes:** ${item.components}`);
  if (item.duration) lines.push(`**Duração:** ${item.duration}`);
  if (item.concentration) lines.push(`**Concentração:** Sim`);
  if (item.ritual) lines.push(`**Ritual:** Sim`);
  if (item.traits) lines.push(`**Características:** ${item.traits}`);
  if (item.prerequisites) lines.push(`**Pré-requisitos:** ${item.prerequisites}`);
  if (item.category) lines.push(`**Categoria:** ${item.category}`);
  if (item.cost) lines.push(`**Custo:** ${item.cost}`);
  if (item.weight) lines.push(`**Peso:** ${item.weight} lb`);
  if (item.damage) lines.push(`**Dano:** ${item.damage}`);
  if (item.properties) lines.push(`**Propriedades:** ${item.properties}`);
  if (item.bulk) lines.push(`**Bulk:** ${item.bulk}`);
  if (item.class) lines.push(`**Classe:** ${item.class}`);
  if (item.description) lines.push("", item.description);
  if (item.higherLevel) lines.push("", `**Em níveis superiores:** ${item.higherLevel}`);
  if (item.mechanics) lines.push("", `**Mecânica:** ${item.mechanics}`);
  return lines.join("\n");
}
