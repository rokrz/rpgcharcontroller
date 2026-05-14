import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../services/api.js";

import Dnd5ePrintSheet       from "../systems/dnd5e/PrintSheet.jsx";
import Pf2ePrintSheet        from "../systems/pf2e/PrintSheet.jsx";
import DaggerheartPrintSheet from "../systems/daggerheart/PrintSheet.jsx";

const PRINT_SHEETS = {
  dnd5e:       Dnd5ePrintSheet,
  pf2e:        Pf2ePrintSheet,
  daggerheart: DaggerheartPrintSheet,
};

export default function PrintPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [sheet, setSheet]   = useState(null);
  const [error, setError]   = useState(null);

  useEffect(() => {
    api.getSheet(id)
      .then(setSheet)
      .catch(() => setError("Ficha não encontrada."));
  }, [id]);

  useEffect(() => {
    if (!sheet) return;
    const t = setTimeout(() => window.print(), 400);
    return () => clearTimeout(t);
  }, [sheet]);

  if (error) {
    return <p style={{ padding: "16px", color: "#a00" }}>{error}</p>;
  }
  if (!sheet) {
    return <p style={{ padding: "16px", fontFamily: "Georgia, serif" }}>Carregando ficha para impressão…</p>;
  }

  const PrintSheet = PRINT_SHEETS[sheet.system];
  if (!PrintSheet) {
    return <p style={{ padding: "16px" }}>Sistema "{sheet.system}" não suportado para impressão.</p>;
  }

  return (
    <div style={{ padding: "12px", maxWidth: "960px", margin: "0 auto" }}>
      <div className="print:hidden" style={{ marginBottom: "16px" }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            fontFamily: "var(--font-display, Georgia, serif)",
            fontSize: "12px",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            color: "#5a4a3a",
            background: "none",
            border: "1px solid #c8b89a",
            borderRadius: "4px",
            padding: "6px 14px",
            cursor: "pointer",
          }}
        >
          ← Voltar ao app
        </button>
      </div>
      <PrintSheet data={sheet.data} />
    </div>
  );
}
