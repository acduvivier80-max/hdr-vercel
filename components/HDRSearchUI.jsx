"use client";
import React, { useMemo, useState } from "react";

// --- Mini helpers
const GOALS = ["Notoriété", "Image", "Leads", "Conversion"];

const DEFAULT_CASES = [
  {
    title: "Immobilier – Leads x1.6",
    kpis: { cpl: 32, leads: 240 },
    budget: "20–40k",
    formats: ["Vidéo locale", "Native"]
  },
  {
    title: "Auto – +35% d'intentions d'achat",
    kpis: { uplift: "+35%", reach: "450k" },
    budget: "30–60k",
    formats: ["Display", "Vidéo"]
  }
];

function hashScore(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h % 100;
}

function buildPitch({ sector, geo, goals, opportunityFloor }) {
  const g = goals.join(" · ") || "Objectifs";
  const headline = `${sector || "Secteur"} – ${g} dans ${geo || "votre zone"}`;
  const bullets = [
    `Audience qualifiée sur ${geo || "la zone cible"}`,
    `Formats recommandés : ${
      goals.includes("Conversion") || goals.includes("Leads")
        ? "Native + Formulaire + Retargeting"
        : "Vidéo + Display + Sponsoring"
    }`,
    `KPI attendus : ${
      goals.includes("Leads") || goals.includes("Conversion")
        ? "CPL 30–45€"
        : "Reach 200–500k / VTR > 65%"
    }`
  ];
  return { headline, bullets, score: Math.max(opportunityFloor, 55) };
}

export default function HDRSearchUI() {
  const [sector, setSector] = useState("");
  const [geo, setGeo] = useState("");
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [minScore, setMinScore] = useState(40);
  const [results, setResults] = useState(null);

  const canSearch = sector.trim() && geo.trim() && goals.length > 0;

  const opportunitySeed = useMemo(
    () => hashScore(`${sector}|${geo}|${goals.sort().join("-")}`),
    [sector, geo, goals]
  );

  const segments = useMemo(() => {
    const base = [
      { name: "Promoteurs régionaux", size: "M", seasonality: "Q4+" },
      { name: "Agences locales", size: "S", seasonality: "Q2" },
      { name: "Groupes nationaux", size: "L", seasonality: "Q3" }
    ];
    return base
      .map((s, i) => ({
        ...s,
        score: Math.min(99, Math.floor((opportunitySeed + i * 13) % 100))
      }))
      .filter((s) => s.score >= minScore)
      .sort((a, b) => b.score - a.score);
  }, [opportunitySeed, minScore]);

  const advertisers = useMemo(() => {
    const names = [
      "Promoteur Axia",
      "ImmoNova",
      "Résidences du Nord",
      "Habitat+",
      "Groupe Pierre&Co",
      "Logis Métropole"
    ];
    return names
      .map((n, i) => ({
        name: n,
        zone: geo || "",
        signals: [i % 2 === 0 ? "Nouvelle résidence" : "Campagne social active"],
        fit: Math.min(99, Math.floor((opportunitySeed * (i + 2)) % 100))
      }))
      .filter((a) => a.fit >= minScore)
      .sort((a, b) => b.fit - a.fit);
  }, [geo, opportunitySeed, minScore]);

  const recos = useMemo(
    () =>
      buildPitch({
        sector,
        geo,
        goals,
        opportunityFloor: Math.max(segments[0]?.score || 0, 40)
      }),
    [sector, geo, goals, segments]
  );

  function onToggleGoal(g) {
    setGoals((prev) =>
      prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]
    );
  }

  function handleSearch() {
    if (!canSearch) return;
    setLoading(true);
    setTimeout(() => {
      setResults({ segments, advertisers, cases: DEFAULT_CASES, recos });
      setLoading(false);
    }, 600);
  }

  function resetAll() {
    setSector("");
    setGeo("");
    setGoals([]);
    setMinScore(40);
    setResults(null);
  }

  function downloadPitch() {
    const content = `
# Pitch Pack — ${recos.headline}

• ${recos.bullets.join("\n• ")}

Segments prioritaires :
${segments
  .slice(0, 3)
  .map((s) => `- ${s.name} — Score ${s.score}`)
  .join("\n")}

Annonceurs suggérés :
${advertisers
  .slice(0, 5)
  .map((a) => `- ${a.name} (${a.zone}) — Fit ${a.fit}`)
  .join("\n")}
`;
    const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `PitchPack_${sector || "Secteur"}_${geo || "Zone"}.md`;
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  function createLead() {
    alert(
      `Lead pré-rempli → Secteur: ${sector} | Zone: ${geo} | Objectifs: ${goals.join(
        ", "
      )}`
    );
  }

  function shareSearch() {
    const url = new URL(window.location.href);
    url.searchParams.set("sector", sector);
    url.searchParams.set("geo", geo);
    url.searchParams.set("goals", goals.join(","));
    navigator.clipboard.writeText(url.toString());
    alert("Lien de recherche copié dans le presse-papiers ✅");
  }

  // --- Styles inline simples
  const wrap = { maxWidth: 1100, margin: "24px auto", padding: "0 16px" };
  const card = {
    border: "1px solid #e5e7eb",
    borderRadius: 12,
    padding: 16,
    background: "#fff"
  };
  const grid3 = {
    display: "grid",
    gap: 16,
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))"
  };
  const btn = {
    padding: "10px 14px",
    borderRadius: 10,
    border: "1px solid #e5e7eb",
    background: "#111827",
    color: "#fff",
    cursor: "pointer"
  };
  const btnGhost = { ...btn, background: "#fff", color: "#111827" };
  const chip = {
    padding: "6px 10px",
    border: "1px solid #e5e7eb",
    borderRadius: 999,
    cursor: "pointer",
    background: "#fff"
  };

  return (
    <div style={{ background: "#f8fafc", minHeight: "100vh" }}>
      <div style={wrap}>
        <header style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
          <h1 style={{ fontSize: 22, fontWeight: 600 }}>
            Hestia · Recherche commerciale
          </h1>
          <div style={{ display: "flex", gap: 8 }}>
            <button style={btnGhost}>Aide</button>
            <div
              style={{ width: 36, height: 36, borderRadius: "50%", background: "#e5e7eb" }}
              title="Profil"
            />
          </div>
        </header>

        {/* Filtres */}
        <div style={{ ...card, marginBottom: 16 }}>
          <h2 style={{ margin: 0, marginBottom: 12, fontSize: 18 }}>Critères de recherche</h2>
          <div style={{ display: "grid", gap: 12, gridTemplateColumns: "1fr 1fr 1fr" }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600 }}>
                Secteur d’activité
              </label>
              <input
                placeholder="Ex. Immobilier, Auto, Banque…"
                value={sector}
                onChange={(e) => setSector(e.target.value)}
                style={{
                  width: "100%",
                  marginTop: 6,
                  padding: "10px 12px",
                  borderRadius: 10,
                  border: "1px solid #e5e7eb"
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600 }}>
                Zone géographique
              </label>
              <input
                placeholder="Ex. Lille Métropole, HDF, France"
                value={geo}
                onChange={(e) => setGeo(e.target.value)}
                style={{
                  width: "100%",
                  marginTop: 6,
                  padding: "10px 12px",
                  borderRadius: 10,
                  border: "1px solid #e5e7eb"
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600 }}>
                Objectif annonceur
              </label>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 6 }}>
                {GOALS.map((g) => {
                  const active = goals.includes(g);
                  return (
                    <span
                      key={g}
                      onClick={() => onToggleGoal(g)}
                      style={{
                        ...chip,
                        background: active ? "#111827" : "#fff",
                        color: active ? "#fff" : "#111827",
                        borderColor: active ? "#111827" : "#e5e7eb"
                      }}
                      title={g}
                    >
                      {g}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Ligne actions */}
          <div
            style={{
              marginTop: 12,
              display: "flex",
              alignItems: "center",
              gap: 12,
              justifyContent: "space-between",
              flexWrap: "wrap"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <label style={{ fontSize: 13, fontWeight: 600 }}>
                Score d’opportunité minimum
              </label>
              <input
                type="range"
                min={0}
                max={90}
                step={5}
                value={minScore}
                onChange={(e) => setMinScore(parseInt(e.target.value, 10))}
              />
              <span style={{ fontSize: 12, padding: "4px 8px", border: "1px solid #e5e7eb", borderRadius: 8 }}>
                {minScore}
              </span>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button style={btnGhost} onClick={resetAll}>↺ Réinitialiser</button>
              <button
                style={{ ...btn, opacity: canSearch && !loading ? 1 : 0.6 }}
                disabled={!canSearch || loading}
                onClick={handleSearch}
              >
                {loading ? "Recherche…" : "🔎 Lancer la recherche"}
              </button>
            </div>
          </div>
        </div>

        {/* État vide */}
        {!results && !loading && (
          <div
            style={{
              ...card,
              borderStyle: "dashed",
              textAlign: "center",
              padding: 40,
              background: "#fafafa"
            }}
          >
            <p style={{ fontSize: 16 }}>
              Choisissez un <b>secteur</b>, une <b>zone</b> et un ou plusieurs{" "}
              <b>objectifs</b> pour démarrer.
            </p>
            <p style={{ fontSize: 13, color: "#6b7280" }}>
              Astuce : vous pourrez partager le lien de recherche ou générer un pitch pack.
            </p>
          </div>
        )}

        {/* Résultats */}
        {results && (
          <div style={grid3}>
            {/* Colonne A */}
            <div style={card}>
              <h3 style={{ marginTop: 0 }}>Segments & annonceurs</h3>
              <div>
                <h4>Segments prioritaires</h4>
                <div style={{ display: "grid", gap: 8 }}>
                  {results.segments.map((s, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: 12,
                        border: "1px solid #e5e7eb",
                        borderRadius: 10
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 600 }}>{s.name}</div>
                        <div style={{ fontSize: 12, color: "#6b7280" }}>
                          Taille {s.size} · Saisonnalité {s.seasonality}
                        </div>
                      </div>
                      <span
                        style={{
                          fontSize: 12,
                          border: "1px solid #e5e7eb",
                          padding: "4px 10px",
                          borderRadius: 999,
                          background: "#f3f4f6"
                        }}
                      >
                        Score {s.score}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ marginTop: 12 }}>
                <h4>Annonceurs suggérés</h4>
                <div style={{ display: "grid", gap: 8 }}>
                  {results.advertisers.map((a, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: 12,
                        border: "1px solid #e5e7eb",
                        borderRadius: 10
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 600 }}>{a.name}</div>
                        <div style={{ fontSize: 12, color: "#6b7280" }}>
                          {a.zone} · {a.signals[0]}
                        </div>
                      </div>
                      <span
                        style={{
                          fontSize: 12,
                          border: "1px solid #e5e7eb",
                          padding: "4px 10px",
                          borderRadius: 999,
                          background: "#eef2ff"
                        }}
                      >
                        Fit {a.fit}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Colonne B */}
            <div style={card}>
              <h3 style={{ marginTop: 0 }}>Cas & Benchmarks</h3>
              <div style={{ display: "grid", gap: 8 }}>
                {DEFAULT_CASES.map((c, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: 12,
                      border: "1px solid #e5e7eb",
                      borderRadius: 10,
                      background: "#fff"
                    }}
                  >
                    <div style={{ fontWeight: 600, marginBottom: 4 }}>{c.title}</div>
                    <div style={{ fontSize: 12, color: "#374151" }}>
                      Budget {c.budget} · Formats: {c.formats.join(", ")}
                    </div>
                    <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>
                      KPIs:{" "}
                      {Object.entries(c.kpis)
                        .map(([k, v]) => `${k}: ${v}`)
                        .join(" · ")}
                    </div>
                  </div>
                ))}
                <div style={{ fontSize: 12, color: "#6b7280" }}>
                  (Alimentez via DAM/BI en production)
                </div>
              </div>
            </div>

            {/* Colonne C */}
            <div style={card}>
              <h3 style={{ marginTop: 0 }}>Recommandations & actions</h3>
              <div
                style={{
                  padding: 12,
                  border: "1px solid #e5e7eb",
                  borderRadius: 10,
                  background: "#fff"
                }}
              >
                <div style={{ fontWeight: 600, marginBottom: 6 }}>Pitch recommandé</div>
                <div style={{ marginBottom: 6 }}>{results.recos.headline}</div>
                <ul style={{ marginLeft: 18 }}>
                  {results.recos.bullets.map((b, i) => (
                    <li key={i} style={{ marginBottom: 4 }}>
                      {b}
                    </li>
                  ))}
                </ul>
              </div>

              <div
                style={{
                  display: "grid",
                  gap: 8,
                  gridTemplateColumns: "1fr 1fr 1fr",
                  marginTop: 12
                }}
              >
                <button style={btn} onClick={downloadPitch}>
                  ⬇️ Pitch pack
                </button>
                <button style={btnGhost} onClick={createLead}>
                  ➕ Créer lead
                </button>
                <button style={btnGhost} onClick={shareSearch}>
                  🔗 Partager
                </button>
              </div>

              <div style={{ fontSize: 12, color: "#6b7280", marginTop: 8 }}>
                FAQ objections & offres packagées à injecter selon l’objectif sélectionné.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
