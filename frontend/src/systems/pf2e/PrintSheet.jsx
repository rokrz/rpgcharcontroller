import { PF2E_SKILLS, PF2E_RANKS } from "./schema.js";

const S = {
  page:      { fontFamily: "Georgia, serif", color: "#111", background: "#fff", fontSize: "11px", lineHeight: "1.3" },
  header:    { borderBottom: "2px solid #4A2800", paddingBottom: "8px", marginBottom: "12px" },
  charName:  { fontSize: "20px", fontWeight: "bold" },
  subheader: { display: "flex", flexWrap: "wrap", gap: "12px", marginTop: "4px", fontSize: "10px", color: "#444" },
  grid:      { display: "grid", gap: "10px" },
  box:       { border: "1px solid #bbb", borderRadius: "3px", padding: "5px 7px", marginBottom: "6px" },
  boxLabel:  { fontSize: "8px", textTransform: "uppercase", letterSpacing: "1px", color: "#888", marginBottom: "2px" },
  row:       { display: "flex", justifyContent: "space-between", alignItems: "center" },
  sectionHdr:{ fontSize: "9px", textTransform: "uppercase", letterSpacing: "1px", color: "#4A2800", marginBottom: "5px", fontWeight: "bold" },
  statBox:   { border: "1px solid #bbb", borderRadius: "3px", padding: "5px 4px", textAlign: "center" },
  statVal:   { fontSize: "18px", fontWeight: "bold" },
  statLbl:   { fontSize: "8px", textTransform: "uppercase", color: "#888" },
  divider:   { borderTop: "1px solid #ccc", margin: "10px 0 8px" },
};

const AB_PT = { str: "FOR", dex: "DES", con: "CON", int: "INT", wis: "SAB", cha: "CAR" };
const AB_FULL = { str: "Força", dex: "Destreza", con: "Constituição", int: "Inteligência", wis: "Sabedoria", cha: "Carisma" };
const AB_KEYS = ["str", "dex", "con", "int", "wis", "cha"];

const mod   = (s) => Math.floor(((s ?? 10) - 10) / 2);
const mStr  = (s) => { const m = mod(s ?? 10); return (m >= 0 ? "+" : "") + m; };

function rankBonus(rank, level) {
  if (!rank) return 0;
  return level + (rank * 2);
}

function rankLabel(rank) {
  return PF2E_RANKS[rank] ?? "Sem Treino";
}

export default function Pf2ePrintSheet({ data }) {
  const d   = data || {};
  const ab  = d.abilities || {};
  const lvl = d.level || 1;
  const hp  = d.hp || {};

  function skillTotal(sk) {
    const skillData = d.skills?.[sk.key] || { rank: 0 };
    return mod(ab[sk.ability]) + rankBonus(skillData.rank, lvl);
  }

  return (
    <div style={S.page}>
      {/* Header */}
      <div style={S.header}>
        <div style={S.charName}>{d.name || "—"}</div>
        <div style={S.subheader}>
          <span><b>Classe</b> {d.class || "—"} · Nv. {lvl}</span>
          {d.ancestry   && <span><b>Ancestralidade</b> {[d.ancestry, d.heritage].filter(Boolean).join(" · ")}</span>}
          {d.background && <span><b>Antecedente</b> {d.background}</span>}
          {d.deity      && <span><b>Divindade</b> {d.deity}</span>}
          {d.alignment  && <span><b>Alinhamento</b> {d.alignment}</span>}
        </div>
      </div>

      <div style={{ ...S.grid, gridTemplateColumns: "110px 1fr 1fr" }}>

        {/* Col 1 — Ability scores */}
        <div>
          {AB_KEYS.map((k) => (
            <div key={k} style={{ ...S.box, textAlign: "center" }}>
              <div style={S.boxLabel}>{AB_PT[k]}</div>
              <div style={{ fontSize: "20px", fontWeight: "bold" }}>{mStr(ab[k])}</div>
              <div style={{ fontSize: "12px", color: "#555" }}>{ab[k] ?? 10}</div>
            </div>
          ))}
        </div>

        {/* Col 2 — Saves + Perception + Skills */}
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "6px", marginBottom: "8px" }}>
            {[
              ["CA", d.ac ?? 10],
              ["Classe DC", d.classDC ?? 10],
              ["Veloc.", `${d.speed ?? 25} ft`],
              ["Percep.", `+${mod(ab.wis) + rankBonus(d.perception?.rank ?? 0, lvl)}`],
            ].map(([l, v]) => (
              <div key={l} style={S.statBox}>
                <div style={S.statLbl}>{l}</div>
                <div style={S.statVal}>{v}</div>
              </div>
            ))}
          </div>

          <div style={S.box}>
            <div style={S.sectionHdr}>PV · Feridos · Morrendo</div>
            <div style={{ fontSize: "16px", fontWeight: "bold" }}>{hp.current ?? 0} / {hp.max ?? 0}</div>
            <div style={{ fontSize: "10px", color: "#555", marginTop: "2px" }}>
              Ferido: {hp.wounded ?? 0} · Morrendo: {hp.dying ?? 0}
            </div>
          </div>

          <div style={S.box}>
            <div style={S.sectionHdr}>Testes de Resistência</div>
            {[
              ["Fortitude (CON)", "fort", "con"],
              ["Reflexo (DES)", "ref", "dex"],
              ["Vontade (SAB)", "will", "wis"],
            ].map(([label, key, abilKey]) => {
              const s = d.saves?.[key] || { rank: 0 };
              const t = mod(ab[abilKey]) + rankBonus(s.rank, lvl);
              return (
                <div key={key} style={{ ...S.row, fontSize: "10px", marginBottom: "2px" }}>
                  <span>{label} <span style={{ color: "#999" }}>({rankLabel(s.rank)})</span></span>
                  <b>{t >= 0 ? "+" : ""}{t}</b>
                </div>
              );
            })}
          </div>

          <div style={S.box}>
            <div style={S.sectionHdr}>Perícias</div>
            {PF2E_SKILLS.map((sk) => {
              const skillData = d.skills?.[sk.key] || { rank: 0 };
              const t = skillTotal(sk);
              return (
                <div key={sk.key} style={{ ...S.row, fontSize: "9.5px", marginBottom: "1px" }}>
                  <span>{sk.label} <span style={{ color: "#999" }}>({AB_PT[sk.ability]}, {rankLabel(skillData.rank)})</span></span>
                  <b>{t >= 0 ? "+" : ""}{t}</b>
                </div>
              );
            })}
          </div>
        </div>

        {/* Col 3 — Feats + Spells + Inventory */}
        <div>
          {Object.entries(d.feats || {}).map(([type, feats]) =>
            feats?.length > 0 ? (
              <div key={type} style={S.box}>
                <div style={S.sectionHdr}>Talentos · {type}</div>
                {feats.map((f, i) => (
                  <div key={i} style={{ fontSize: "10px" }}>
                    <b>{f.name || f}</b>
                    {f.level && <span style={{ color: "#999", fontSize: "9px" }}> Nv.{f.level}</span>}
                    {f.description && <div style={{ color: "#555", marginTop: "1px" }}>{f.description}</div>}
                  </div>
                ))}
              </div>
            ) : null
          )}

          {d.actions?.length > 0 && (
            <div style={S.box}>
              <div style={S.sectionHdr}>Ações</div>
              {d.actions.map((a, i) => (
                <div key={i} style={{ fontSize: "10px", marginBottom: "3px" }}>
                  <b>{a.name}</b>
                  {a.description && <div style={{ color: "#555", marginTop: "1px" }}>{a.description}</div>}
                </div>
              ))}
            </div>
          )}

          {d.inventory?.length > 0 && (
            <div style={S.box}>
              <div style={S.sectionHdr}>Inventário</div>
              {d.inventory.map((e, i) => (
                <div key={i} style={{ fontSize: "10px" }}>
                  {(e.quantity > 1 ? `${e.quantity}× ` : "")}{e.name}
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

          {d.notes && (
            <div style={S.box}>
              <div style={S.sectionHdr}>Notas</div>
              <div style={{ fontSize: "10px" }}>{d.notes}</div>
            </div>
          )}
        </div>
      </div>

      {/* Spells */}
      {d.spells && Object.values(d.spells).some((arr) => arr?.length > 0) && (
        <div style={S.divider}>
          <div style={S.sectionHdr}>Magias</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "6px" }}>
            {["cantrips", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10"].map((lvlKey) =>
              d.spells[lvlKey]?.length > 0 ? (
                <div key={lvlKey} style={S.box}>
                  <div style={S.boxLabel}>{lvlKey === "cantrips" ? "Truques" : `Círc. ${lvlKey}`}</div>
                  {d.spells[lvlKey].map((sp, i) => (
                    <div key={i} style={{ fontSize: "9.5px" }}>{sp.name || sp}</div>
                  ))}
                </div>
              ) : null
            )}
          </div>
        </div>
      )}
    </div>
  );
}
