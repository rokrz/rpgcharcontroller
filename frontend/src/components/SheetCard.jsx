import { Link } from "react-router-dom";
import { Trash2 } from "lucide-react";
import Card from "./ui/Card.jsx";
import HPBar from "./ui/HPBar.jsx";
import Badge from "./ui/Badge.jsx";
import { SYSTEMS } from "../systems/index.js";
import { api } from "../services/api.js";

export default function SheetCard({ sheet, onDelete }) {
  const sys = SYSTEMS[sheet.system] || { label: sheet.system, badge: "neutral" };
  const d = sheet.data || {};
  const hp = d.hp || {};

  async function handleDelete(e) {
    e.preventDefault();
    if (!confirm(`Deletar a ficha "${d.name || "sem nome"}"?`)) return;
    await api.deleteSheet(sheet.id);
    onDelete(sheet.id);
  }

  return (
    <Link to={`/sheet/${sheet.id}`} className="no-underline block">
      <Card className="hover:ring-2 hover:ring-gold/40 transition cursor-pointer h-full">
        <Card.Header>
          <div className="flex-1 min-w-0">
            <p className="font-display text-base text-ink truncate">{d.name || "Sem nome"}</p>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <Badge tone={sys.badge}>{sys.label}</Badge>
              {d.class && (
                <span className="text-xs text-ink-muted font-serif">
                  {d.class}{d.level ? ` ${d.level}` : ""}
                </span>
              )}
              {d.ancestry && (
                <span className="text-xs text-ink-muted font-serif">{d.ancestry}</span>
              )}
            </div>
          </div>
          <button
            onClick={handleDelete}
            className="text-ink-faded hover:text-burgundy transition shrink-0"
            title="Excluir ficha"
          >
            <Trash2 size={14} />
          </button>
        </Card.Header>
        {hp.max > 0 && (
          <Card.Body>
            <HPBar current={hp.current ?? hp.max} max={hp.max} />
          </Card.Body>
        )}
        <Card.Footer>
          <p className="text-[10px] text-ink-faded font-display uppercase tracking-widest">
            {new Date(sheet.updatedAt).toLocaleDateString("pt-BR")}
          </p>
        </Card.Footer>
      </Card>
    </Link>
  );
}
