import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plus, ScrollText, Upload } from "lucide-react";
import Button from "../components/ui/Button.jsx";
import SheetCard from "../components/SheetCard.jsx";
import { api } from "../services/api.js";
import { parseImportFile } from "../services/importService.js";

export default function HomePage() {
  const navigate = useNavigate();
  const [sheets, setSheets]         = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [importing, setImporting]   = useState(false);
  const [importError, setImportError] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    api.listSheets()
      .then(setSheets)
      .catch(() => setError("Não foi possível carregar as fichas. O backend está rodando?"))
      .finally(() => setLoading(false));
  }, []);

  function handleDelete(id) {
    setSheets((prev) => prev.filter((s) => s.id !== id));
  }

  async function handleImportFile(e) {
    const file = e.target.files?.[0];
    if (!fileInputRef.current) return;
    fileInputRef.current.value = "";
    if (!file) return;

    setImporting(true);
    setImportError(null);
    try {
      const text = await file.text();
      const json = JSON.parse(text);
      const sheets = parseImportFile(json);

      const created = await Promise.all(
        sheets.map((s) => api.createSheet({ system: s.system, data: s.data }))
      );

      if (created.length === 1) {
        navigate(`/sheet/${created[0].id}`);
      } else {
        const fresh = await api.listSheets();
        setSheets(fresh);
      }
    } catch (err) {
      setImportError(err.message || "Erro ao importar o arquivo.");
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl text-ink">Minhas Fichas</h1>
          <p className="text-ink-muted font-serif mt-1">Gerencie seus personagens de RPG</p>
        </div>
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={handleImportFile}
          />
          <Button
            variant="ghost"
            icon={<Upload size={15} />}
            onClick={() => fileInputRef.current?.click()}
            disabled={importing}
          >
            {importing ? "Importando…" : "Importar"}
          </Button>
          <Link to="/new">
            <Button icon={<Plus size={16} />}>Nova Ficha</Button>
          </Link>
        </div>
      </div>

      {importError && (
        <div className="mb-4 px-4 py-3 rounded-sheet border border-burgundy/40 bg-burgundy/5 text-sm text-burgundy font-serif">
          {importError}
        </div>
      )}

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
        <div className="text-center py-16">
          <ScrollText size={48} className="text-parchment-edge mx-auto mb-4" />
          <p className="text-ink-muted font-serif text-lg mb-6">Nenhuma ficha ainda.</p>
          <Link to="/new">
            <Button icon={<Plus size={16} />}>Criar primeira ficha</Button>
          </Link>
        </div>
      )}

      {!loading && !error && sheets.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sheets.map((sheet) => (
            <SheetCard key={sheet.id} sheet={sheet} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  );
}
