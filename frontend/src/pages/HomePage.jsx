import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, ScrollText } from "lucide-react";
import Button from "../components/ui/Button.jsx";
import SheetCard from "../components/SheetCard.jsx";
import { api } from "../services/api.js";
import { useTutorial } from "../context/TutorialContext.jsx";

export default function HomePage() {
  const [sheets, setSheets]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const { startTutorial, completed } = useTutorial();

  useEffect(() => {
    api.listSheets()
      .then(setSheets)
      .catch(() => setError("Não foi possível carregar as fichas. O backend está rodando?"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!loading && !error && sheets.length === 0 && !completed) {
      const t = setTimeout(startTutorial, 300);
      return () => clearTimeout(t);
    }
  }, [loading, error, sheets.length, completed, startTutorial]);

  function handleDelete(id) {
    setSheets((prev) => prev.filter((s) => s.id !== id));
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="font-display text-3xl text-ink">Minhas Fichas</h1>
        <p className="text-ink-muted font-serif mt-1">Gerencie seus personagens de RPG</p>
      </div>

      {loading && (
        <p className="text-center text-ink-muted font-serif italic py-16">Carregando fichas...</p>
      )}

      {error && (
        <div className="text-center py-16">
          <p className="text-burgundy font-serif mb-4">{error}</p>
          <Button variant="ghost" onClick={() => window.location.reload()}>Tentar novamente</Button>
        </div>
      )}

      {!loading && !error && sheets.length === 0 && (
        <div data-tutorial="empty-state" className="text-center py-16">
          <ScrollText size={48} className="text-parchment-edge mx-auto mb-4" />
          <p className="text-ink-muted font-serif text-lg mb-6">Nenhuma ficha ainda.</p>
          <Link to="/new">
            <Button icon={<Plus size={16} />}>Criar primeira ficha</Button>
          </Link>
        </div>
      )}

      {!loading && !error && sheets.length > 0 && (
        <div data-tutorial="sheet-list" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sheets.map((sheet) => (
            <SheetCard key={sheet.id} sheet={sheet} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  );
}
