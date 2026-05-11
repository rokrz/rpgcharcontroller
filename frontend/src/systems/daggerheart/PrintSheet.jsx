import { DH_TRAITS } from "./schema.js";

const S = {
  page:      { fontFamily: "Georgia, serif", color: "#111", background: "#fff", fontSize: "11px", lineHeight: "1.3" },
  header:    { borderBottom: "2px solid #1A3A5C", paddingBottom: "8px", marginBottom: "12px" },
  charName:  { fontSize: "20px", fontWeight: "bold" },
  subheader: { display: "flex", flexWrap: "wrap", gap: "12px", marginTop: "4px", fontSize: "10px", color: "#444" },
  box:       { border: "1px solid #bbb", borderRadius: "3px", padding: "5px 7px", marginBottom: "6px" },
  boxLabel:  { fontSize: "8px", textTransform: "uppercase", letterSpacing: "1px", color: "#888", marginBottom: "2px" },
  row:       { display: "flex", justifyContent: "space-between", alignItems: "center" },
  sectionHdr:{ fontSize: "9px", textTransform: "uppercase", letterSpacing: "1px", color: "#1A3A5C", marginBottom: "5px", fontWeight: "bold" },
  statBox:   { border: "1px solid #bbb", borderRadius: "3px", padding: "6px 4px", textAlign: "center" },
  statVal:   { fontSize: "20px", fontWeight: "bold" },
  statLbl:   { fontSize: "8px", textTransform: "uppercase", color: "#888" },
  divider:   { borderTop: "1px solid #ccc", margin: "10px 0 8px" },
};

function dot(val, max) {
  const v = Math.min(Math.max(val || 0, 0), max);
  return "●".repeat(v) + "○".repeat(max - v);
}

export default function DaggerheartPrintSheet({ data }) {
  const d  = data || {};
  const hp = d.hp || {};
  const ancestry = typeof d.ancestry === "object" && d.ancestry !== null
    ? d.ancestry
    : { primary: d.ancestry || "", secondary: "" };
  const ancestryLabel = [ancestry.primary, ancestry.secondary].filter(Boolean).join(" + ") || null;

  return (
    <div style={S.page}>
      {/* Header */}
      <div style={S.header}>
        <div style={S.charName}>{d.name || "—"}</div>
        <div style={S.subheader}>
          <span><b>Classe</b> {[d.class, d.subclass].filter(Boolean).join(" · ")} · Nv. {d.level || 1}</span>
          {ancestryLabel && <span><b>Ancestralidade</b> {ancestryLabel}</span>}
          {d.community && <span><b>Comunidade</b> {d.community}</span>}
          {d.pronouns  && <span><b>Pronomes</b> {d.pronouns}</span>}
        </div>
      </div>

      {/* Traits */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: "6px", marginBottom: "12px" }}>
        {DH_TRAITS.map(({ key, label }) => (
          <div key={key} style={{ ...S.statBox }}>
            <div style={S.statLbl}>{label}</div>
            <div style={S.statVal}>{d[key] >= 0 ? "+" : ""}{d[key] ?? 0}</div>
          </div>
        ))}
      </div>

      {/* Combat row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: "6px", marginBottom: "12px" }}>
        {[
          ["PV", `${hp.current ?? 0}/${hp.max ?? 0}`],
          ["Stress", `${d.stress?.current ?? 0}/${d.stress?.max ?? 0}`],
          ["Esperança", d.hope ?? 0],
          ["Medo", d.fear ?? 0],
          ["Evasão", d.evasion ?? 10],
          ["Armadura", `${d.armorSlots?.marked ?? 0}/${d.armorSlots?.total ?? 0} (${d.armorScore ?? 0})`],
        ].map(([l, v]) => (
          <div key={l} style={S.statBox}>
            <div style={S.statLbl}>{l}</div>
            <div style={{ fontSize: "14px", fontWeight: "bold" }}>{v}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>

        {/* Left */}
        <div>
          {d.classFeatures && (
            <div style={S.box}>
              <div style={S.sectionHdr}>Habilidades de Classe</div>
              {[
                ["Fundação", d.classFeatures.foundation],
                ["Especialidade", d.classFeatures.specialty],
                ["Maestria", d.classFeatures.mastery],
              ].map(([tier, feat]) => feat?.name ? (
                <div key={tier} style={{ marginBottom: "6px" }}>
                  <div style={{ fontSize: "9px", color: "#888", textTransform: "uppercase" }}>{tier}</div>
                  <b style={{ fontSize: "11px" }}>{feat.name}</b>
                  {feat.description && <div style={{ fontSize: "10px", color: "#555", marginTop: "1px" }}>{feat.description}</div>}
                </div>
              ) : null)}
            </div>
          )}

          {d.experiences?.length > 0 && (
            <div style={S.box}>
              <div style={S.sectionHdr}>Experiências</div>
              {d.experiences.map((e, i) => (
                <div key={i} style={{ fontSize: "10px", marginBottom: "2px" }}>
                  <b>{e.name}</b>
                  {e.value !== undefined && <span style={{ color: "#888" }}> +{e.value}</span>}
                </div>
              ))}
            </div>
          )}

          {d.conditions?.length > 0 && (
            <div style={S.box}>
              <div style={S.sectionHdr}>Condições</div>
              <div style={{ fontSize: "10px" }}>{d.conditions.join(", ")}</div>
            </div>
          )}
        </div>

        {/* Right */}
        <div>
          {d.domainCards?.length > 0 && (
            <div style={S.box}>
              <div style={S.sectionHdr}>Cartas de Domínio</div>
              {d.domainCards.map((c, i) => (
                <div key={i} style={{ marginBottom: "6px" }}>
                  <b style={{ fontSize: "11px" }}>{c.name}</b>
                  {c.domain && <span style={{ fontSize: "9px", color: "#888", marginLeft: "4px" }}>[{c.domain}]</span>}
                  {c.level !== undefined && <span style={{ fontSize: "9px", color: "#888", marginLeft: "4px" }}>Nv.{c.level}</span>}
                  {c.description && <div style={{ fontSize: "10px", color: "#555", marginTop: "1px" }}>{c.description}</div>}
                </div>
              ))}
            </div>
          )}

          {d.inventory?.length > 0 && (
            <div style={S.box}>
              <div style={S.sectionHdr}>Inventário · {d.gold ?? 0} ouro</div>
              {d.inventory.map((e, i) => (
                <div key={i} style={{ fontSize: "10px" }}>
                  {(e.quantity > 1 ? `${e.quantity}× ` : "")}{e.name}
                </div>
              ))}
            </div>
          )}

          {(d.backstory || d.connections || d.notes) && (
            <div style={S.box}>
              <div style={S.sectionHdr}>História e Notas</div>
              {d.backstory && <div style={{ fontSize: "10px", marginBottom: "4px" }}><b>Histórico:</b> {d.backstory}</div>}
              {d.connections && <div style={{ fontSize: "10px", marginBottom: "4px" }}><b>Conexões:</b> {d.connections}</div>}
              {d.notes && <div style={{ fontSize: "10px" }}><b>Notas:</b> {d.notes}</div>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
