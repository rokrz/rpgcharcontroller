import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight, Sword, Flame, Star } from "lucide-react";
import Button from "../components/ui/Button.jsx";
import Input from "../components/ui/Input.jsx";
import { SYSTEM_LIST } from "../systems/index.js";
import { api } from "../services/api.js";

const ICONS = { dnd5e: Sword, pf2e: Flame, daggerheart: Star };
const COLORS = {
  dnd5e: "border-cond-debuff/40 hover:border-cond-debuff/80 hover:bg-cond-debuff/5",
  pf2e: "border-cond-burn/40 hover:border-cond-burn/80 hover:bg-cond-burn/5",
  daggerheart: "border-cond-magic/40 hover:border-cond-magic/80 hover:bg-cond-magic/5",
};
const ACTIVE_COLORS = {
  dnd5e: "border-cond-debuff bg-cond-debuff/10 ring-2 ring-cond-debuff/30",
  pf2e: "border-cond-burn bg-cond-burn/10 ring-2 ring-cond-burn/30",
  daggerheart: "border-cond-magic bg-cond-magic/10 ring-2 ring-cond-magic/30",
};

export default function CreateSheetPage() {
  const navigate = useNavigate();
  const [selectedSystem, setSelectedSystem] = useState(null);
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState(null);

  async function handleCreate() {
    if (!selectedSystem) return;
    setCreating(true);
    setError(null);
    try {
      const sys = SYSTEM_LIST.find((s) => s.id === selectedSystem);
      const data = sys.createSheet(name || "Personagem");
      const sheet = await api.createSheet({ system: selectedSystem, data });
      navigate(`/sheet/${sheet.id}`);
    } catch (e) {
      setError("Erro ao criar ficha. O backend está rodando?");
      setCreating(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h2 className="font-display text-2xl text-ink mb-1">Nova Ficha</h2>
      <p className="text-ink-muted font-serif mb-8">Escolha o sistema de RPG para sua ficha.</p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {SYSTEM_LIST.map((sys) => {
          const Icon = ICONS[sys.id] || Sword;
          const isActive = selectedSystem === sys.id;
          return (
            <button
              key={sys.id}
              onClick={() => setSelectedSystem(sys.id)}
              className={`text-left p-5 rounded-sheet border-2 transition ${isActive ? ACTIVE_COLORS[sys.id] : `bg-parchment-deep ${COLORS[sys.id]}`}`}
            >
              <Icon size={28} className={`mb-3 ${sys.color}`} />
              <p className={`font-display text-lg ${sys.color}`}>{sys.label}</p>
              <p className="text-xs text-ink-muted font-serif mt-1 leading-relaxed">{sys.description}</p>
            </button>
          );
        })}
      </div>

      {selectedSystem && (
        <div className="space-y-6">
          <Input
            label="Nome do personagem"
            placeholder="Ex: Aragorn, Seoni, Zephyr..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
          />
          {error && <p className="text-burgundy text-sm font-serif">{error}</p>}
          <div className="flex gap-3">
            <Button
              onClick={handleCreate}
              disabled={creating}
              icon={<ChevronRight size={16} />}
            >
              {creating ? "Criando..." : "Criar Ficha"}
            </Button>
            <Button variant="ghost" onClick={() => navigate("/")}>Cancelar</Button>
          </div>
        </div>
      )}
    </div>
  );
}
