import { useState, useEffect } from "react";
import { Sparkles, ChevronDown, ChevronUp, Plus, Check, BookOpen } from "lucide-react";
import Card from "./ui/Card.jsx";
import Badge from "./ui/Badge.jsx";
import { useRulesWindow } from "../context/RulesWindowContext.jsx";

function buildContent(item) {
  const lines = [];
  if (item.level !== undefined) lines.push(`**Nível:** ${item.level}`);
  if (item.class) lines.push(`**Classe:** ${item.class}`);
  if (item.type) lines.push(`**Tipo:** ${item.type}`);
  if (item.traits) lines.push(`**Características:** ${item.traits}`);
  if (item.description) lines.push("", item.description);
  if (item.mechanics) lines.push("", `*${item.mechanics}*`);
  return lines.join("\n");
}

export default function ClassSuggestions({ className, level, fetchFn, addedNames, onAdd }) {
  const [open, setOpen] = useState(true);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const { openWindow } = useRulesWindow();

  useEffect(() => {
    if (!className) { setItems([]); return; }
    setLoading(true);
    fetchFn(className, level)
      .then((r) => setItems(r.results || r || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [className, level]);

  if (!className || (!loading && items.length === 0)) return null;

  const addedSet = new Set(addedNames || []);

  return (
    <Card className="border-gold/30">
      <Card.Header>
        <div className="flex items-center gap-2">
          <Sparkles size={14} className="text-gold" />
          <p className="font-display text-xs uppercase tracking-widest text-ink-muted">
            Habilidades de {className}
          </p>
          {!loading && items.length > 0 && (
            <Badge tone="neutral">{items.length}</Badge>
          )}
        </div>
        <button
          onClick={() => setOpen((v) => !v)}
          className="text-ink-muted hover:text-ink transition"
        >
          {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </Card.Header>

      {open && (
        <Card.Body className="space-y-0 max-h-72 overflow-y-auto">
          {loading && (
            <p className="text-ink-muted italic text-sm py-4 text-center font-serif">
              Carregando...
            </p>
          )}
          {!loading && items.map((item, i) => {
            const already = addedSet.has(item.name);
            return (
              <div
                key={i}
                className="flex items-start gap-2 py-2 border-b border-parchment-edge/40 last:border-0"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-serif text-sm text-ink">{item.name}</span>
                    {item.level !== undefined && (
                      <span className="text-[10px] text-ink-faded font-display uppercase tracking-widest shrink-0">
                        Nv.{item.level}
                      </span>
                    )}
                  </div>
                  {item.description && (
                    <p className="text-xs text-ink-muted font-serif mt-0.5 line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>
                  )}
                </div>
                <div className="flex gap-1.5 shrink-0 mt-0.5">
                  <button
                    onClick={() => openWindow({ title: item.name, content: buildContent(item) })}
                    className="text-ink-faded hover:text-gold transition"
                    title="Ver regras"
                  >
                    <BookOpen size={13} />
                  </button>
                  <button
                    onClick={() => !already && onAdd(item)}
                    disabled={already}
                    className={`transition ${already ? "text-hp-healthy cursor-default" : "text-ink-faded hover:text-burgundy"}`}
                    title={already ? "Já adicionado" : "Adicionar à ficha"}
                  >
                    {already ? <Check size={13} /> : <Plus size={13} />}
                  </button>
                </div>
              </div>
            );
          })}
        </Card.Body>
      )}
    </Card>
  );
}
