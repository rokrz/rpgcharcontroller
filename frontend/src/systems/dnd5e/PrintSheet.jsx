import { DND5E_SKILLS } from "./schema.js";

const S = {
  page:       { fontFamily: "Georgia, serif", color: "#111", background: "#fff", fontSize: "11px", lineHeight: "1.3" },
  header:     { borderBottom: "2px solid #6B1A1A", paddingBottom: "8px", marginBottom: "12px" },
  charName:   { fontSize: "20px", fontWeight: "bold", letterSpacing: "0.5px" },
  subheader:  { display: "flex", flexWrap: "wrap", gap: "12px", marginTop: "4px", fontSize: "10px", color: "#444" },
  grid3:      { display: "grid", gridTemplateColumns: "110px 1fr 1fr", gap: "10px" },
  box:        { border: "1px solid #bbb", borderRadius: "3px", padding: "5px 7px", marginBottom: "6px" },
  boxLabel:   { fontSize: "8px", textTransform: "uppercase", letterSpacing: "1px", color: "#888", marginBottom: "2px" },
  row:        { display: "flex", justifyContent: "space-between", alignItems: "center" },
  statGrid:   { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "6px", marginBottom: "8px" },
  statBox:    { border: "1px solid #bbb", borderRadius: "3px", padding: "5px 4px", textAlign: "center" },
  statVal:    { fontSize: "18px", fontWeight: "bold" },
  statLbl:    { fontSize: "8px", textTransform: "uppercase", color: "#888", letterSpacing: "0.5px" },
  divider:    { borderTop: "1px solid #ccc", margin: "10px 0 8px" },
  sectionHdr: { fontSize: "9px", textTransform: "uppercase", letterSpacing: "1px", color: "#6B1A1A", marginBottom: "5px", fontWeight: "bold" },
};

const ab    = (d, k) => (d?.abilities?.[k] ?? 10);
const mod   = (s)    => Math.floor((s - 10) / 2);
const mStr  = (s)    => { const m = mod(s); return (m >= 0 ? "+" : "") + m; };

const AB_PT = { str: "FOR", dex: "DES", con: "CON", int: "INT", wis: "SAB", cha: "CAR" };
const AB_FULL = { str: "Força", dex: "Destreza", con: "Constituição", int: "Inteligência", wis: "Sabedoria", cha: "Carisma" };
const AB_KEYS = ["str", "dex", "con", "int", "wis", "cha"];

export default function Dnd5ePrintSheet({ data }) {
  const d   = data || {};
  const pb  = d.proficiencyBonus || 2;
  const hp  = d.hp || {};
  const ds  = d.deathSaves || {};

  const passivePerc = 10 + mod(ab(d, "wis")) + (d.skills?.perception ? pb : 0);

  function saveTotal(key) {
    return mod(ab(d, key)) + (d.savingThrows?.[key] ? pb : 0);
  }
  function skillTotal(sk) {
    return mod(ab(d, sk.ability)) + (d.skills?.[sk.key] ? pb : 0);
  }

  return (
    <div style={S.page}>
      {/* ── Header ── */}
      <div style={S.header}>
        <div style={S.charName}>{d.name || "—"}</div>
        <div style={S.subheader}>
          <span><b>Classe</b> {[d.class, d.subclass].filter(Boolean).join(" · ")} · Nv. {d.level || 1}</span>
          {d.background  && <span><b>Antecedente</b> {d.background}</span>}
          {d.race        && <span><b>Raça</b> {d.race}</span>}
          {d.alignment   && <span><b>Alinhamento</b> {d.alignment}</span>}
          <span><b>XP</b> {d.xp || 0}</span>
          {d.playerName  && <span><b>Jogador</b> {d.playerName}</span>}
        </div>
      </div>

      {/* ── 3-column body ── */}
      <div style={S.grid3}>

        {/* Col 1 — Ability scores */}
        <div>
          {AB_KEYS.map((k) => (
            <div key={k} style={{ ...S.box, textAlign: "center" }}>
              <div style={S.boxLabel}>{AB_PT[k]}</div>
              <div style={{ fontSize: "20px", fontWeight: "bold" }}>{mStr(ab(d, k))}</div>
              <div style={{ fontSize: "12px", color: "#555" }}>{ab(d, k)}</div>
            </div>
          ))}
        </div>

        {/* Col 2 — PB, Saves, Skills */}
        <div>
          <div style={{ display: "flex", gap: "6px", marginBottom: "8px" }}>
            <div style={{ ...S.box, flex: 1, textAlign: "center" }}>
              <div style={S.boxLabel}>Bônus Prof.</div>
              <div style={S.statVal}>+{pb}</div>
            </div>
            <div style={{ ...S.box, flex: 1, textAlign: "center" }}>
              <div style={S.boxLabel}>Inspiração</div>
              <div style={S.statVal}>{d.inspiration ? "✓" : "□"}</div>
            </div>
          </div>

          <div style={S.box}>
            <div style={S.sectionHdr}>Testes de Resistência</div>
            {AB_KEYS.map((k) => {
              const t = saveTotal(k);
              return (
                <div key={k} style={{ ...S.row, fontSize: "10px", marginBottom: "1px" }}>
                  <span>{d.savingThrows?.[k] ? "●" : "○"} {AB_FULL[k]}</span>
                  <b>{t >= 0 ? "+" : ""}{t}</b>
                </div>
              );
            })}
          </div>

          <div style={S.box}>
            <div style={S.sectionHdr}>Perícias</div>
            {DND5E_SKILLS.map((sk) => {
              const t = skillTotal(sk);
              return (
                <div key={sk.key} style={{ ...S.row, fontSize: "9.5px", marginBottom: "1px" }}>
                  <span>{d.skills?.[sk.key] ? "●" : "○"} {sk.label} <span style={{ color: "#999" }}>({AB_PT[sk.ability]})</span></span>
                  <b>{t >= 0 ? "+" : ""}{t}</b>
                </div>
              );
            })}
            <div style={{ ...S.divider, marginTop: "6px" }} />
            <div style={{ fontSize: "9.5px" }}>Percepção Passiva: <b>{passivePerc}</b></div>
          </div>
        </div>

        {/* Col 3 — Combat + Attacks */}
        <div>
          <div style={S.statGrid}>
            {[
              ["CA", d.ac ?? 10],
              ["Iniciativa", mStr(ab(d, "dex"))],
              ["Desloc.", `${d.speed || 30} ft`],
            ].map(([l, v]) => (
              <div key={l} style={S.statBox}>
                <div style={S.statLbl}>{l}</div>
                <div style={S.statVal}>{v}</div>
              </div>
            ))}
          </div>

          <div style={S.box}>
            <div style={S.sectionHdr}>Pontos de Vida</div>
            <div style={{ fontSize: "18px", fontWeight: "bold" }}>{hp.current ?? 0} <span style={{ color: "#888", fontSize: "13px" }}>/ {hp.max ?? 0}</span></div>
            {(hp.temp || 0) > 0 && <div style={{ fontSize: "10px", color: "#555" }}>+{hp.temp} temp.</div>}
            <div style={{ fontSize: "10px", marginTop: "4px" }}>
              Dado de Vida: {d.hitDice?.remaining ?? 1}/{d.hitDice?.total ?? 1} {d.hitDice?.die || "d8"}
            </div>
          </div>

          <div style={S.box}>
            <div style={S.sectionHdr}>Testes de Morte</div>
            <div style={{ fontSize: "10px" }}>
              Sucessos: {"●".repeat(ds.successes || 0)}{"○".repeat(3 - (ds.successes || 0))}
            </div>
            <div style={{ fontSize: "10px" }}>
              Falhas: {"●".repeat(ds.failures || 0)}{"○".repeat(3 - (ds.failures || 0))}
            </div>
          </div>

          {d.attacks?.length > 0 && (
            <div style={S.box}>
              <div style={S.sectionHdr}>Ataques</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr auto auto", gap: "3px 8px", fontSize: "10px" }}>
                <b style={{ color: "#888" }}>Nome</b><b style={{ color: "#888" }}>Bônus</b><b style={{ color: "#888" }}>Dano</b>
                {d.attacks.map((a, i) => (
                  <><span key={`n${i}`}>{a.name}</span><span key={`b${i}`}>{a.bonus}</span><span key={`d${i}`}>{a.damage}</span></>
                ))}
              </div>
            </div>
          )}

          {d.equipment?.length > 0 && (
            <div style={S.box}>
              <div style={S.sectionHdr}>Equipamento</div>
              {d.equipment.map((e, i) => (
                <div key={i} style={{ fontSize: "10px" }}>
                  {(e.quantity > 1 ? `${e.quantity}× ` : "")}{e.name}
                </div>
              ))}
            </div>
          )}

          {d.currency && Object.values(d.currency).some(Boolean) && (
            <div style={S.box}>
              <div style={S.sectionHdr}>Moedas</div>
              <div style={{ fontSize: "10px" }}>
                {["pp", "gp", "ep", "sp", "cp"].map((c) =>
                  d.currency[c] ? <span key={c} style={{ marginRight: "8px" }}>{d.currency[c]} {c.toUpperCase()}</span> : null
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Bottom rows ── */}
      {(d.otherProficiencies || d.languages) && (
        <div style={{ ...S.divider }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            {d.otherProficiencies && (
              <div>
                <div style={S.sectionHdr}>Proficiências</div>
                <div style={{ fontSize: "10px" }}>{d.otherProficiencies}</div>
              </div>
            )}
            {d.languages && (
              <div>
                <div style={S.sectionHdr}>Idiomas</div>
                <div style={{ fontSize: "10px" }}>{d.languages}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {d.features?.length > 0 && (
        <div style={S.divider}>
          <div style={S.sectionHdr}>Habilidades e Traços</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
            {d.features.map((f, i) => (
              <div key={i} style={{ fontSize: "10px" }}>
                <b>{f.name}</b>
                {f.source && <span style={{ color: "#888", fontSize: "9px" }}> · {f.source}</span>}
                {f.description && <div style={{ color: "#444", marginTop: "1px" }}>{f.description}</div>}
              </div>
            ))}
          </div>
        </div>
      )}

      {(d.personality?.traits || d.personality?.ideals || d.personality?.bonds || d.personality?.flaws || d.appearance?.backstory) && (
        <div style={S.divider}>
          <div style={S.sectionHdr}>Personalidade e Aparência</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "8px" }}>
            {[
              ["Traços", d.personality?.traits],
              ["Ideais", d.personality?.ideals],
              ["Vínculos", d.personality?.bonds],
              ["Fraquezas", d.personality?.flaws],
            ].map(([l, v]) => v ? (
              <div key={l}>
                <div style={{ fontSize: "9px", color: "#888", textTransform: "uppercase" }}>{l}</div>
                <div style={{ fontSize: "10px" }}>{v}</div>
              </div>
            ) : null)}
          </div>
          {d.appearance?.backstory && (
            <div style={{ marginTop: "6px" }}>
              <div style={{ fontSize: "9px", color: "#888", textTransform: "uppercase" }}>Histórico</div>
              <div style={{ fontSize: "10px" }}>{d.appearance.backstory}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
