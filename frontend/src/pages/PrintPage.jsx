import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
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
      <PrintSheet data={sheet.data} />
    </div>
  );
}
