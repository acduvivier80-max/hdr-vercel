"use client";
import React, { useMemo, useState } from "react";

// --- Constantes
const GOALS = ["Notoriété", "Image", "Leads", "Conversion"];
const MEDIAS = ["La Voix du Nord", "SudInfo", "Courrier Picard", "Le Soir"];

// Couleurs par objectif
const goalColors = {
  Notoriété: "#7c3aed",
  Image: "#2563eb",
  Leads: "#16a34a",
  Conversion: "#f97316"
};

// Cas par défaut
const DEFAULT_CASES = [
  {
    title: "Immobilier – Leads x1.6",
    kpis: { cpl: 32, leads: 240 },
    budget: "20–40k",
    reach: "350k",
    formats: ["Vidéo locale", "Native"]
  },
  {
    title: "Auto – +35% d'intentions d'achat",
    kpis: { uplift: "+35%", reach: "450k" },
    budget: "30–60k",
    reach: "500k",
    formats: ["Display", "Vidéo"]
  }
];

// Fonctions utilitaires
function hashScore(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h % 100;
}

function buildPitch({ sector, geo, goals, budget, prospectType, media, opportunityFloor }) {
  const g = goals.join(" · ") || "Objectifs";
  const headline = `${sector || "Secteur"} – ${g} dans ${geo || "votre zone"} via ${media || "Média Rossel"}`;
  const bullets = [
    `Budget cible : ${budget || "N/A"} · Prospect : ${prospectType === "ancien" ? "Ancien" : "Nouveau"}`,
    `Média choisi : ${media || "N/A"}`,
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
  const reach = goals.includes("Notoriété") ? "500k+" : "200–400k";
  return { headline, bullets, score: Math.max(opportunityFloor, 55), reach };
}

// --- Composant principal
export default function HDRSearchUI() {
  const [sector, setSector] = useState("");
  const [geo, setGeo] = useState("");
  const [goals, setGoals] = useState([]);
  const [budget, setBudget] = useState("");
  const [prospectType, setProspectType] = useState("nouveau");
  const [media, setMedia] = useState("");

  const [loading, setLoading] = useState(false);
  const [minScore, setMinScore] = useState(40);
  const [results, setResults] = useState(null);

  const canSearch = sector.trim() && geo.trim() && goals.length > 0;

  const opportunitySeed = useMemo(
    () => hashScore(`${sector}|${geo}|${goals.sort().join("-")}|${budget}|${prospectType}|${media}`),
    [sector, geo, goals, budget, prospectType, media]
  );

  const segments = useMemo(() => {
    const base = [
      { name: "Promoteurs régionaux", size: "M", seasonality: "Q4+" },
      { name: "Agences locales", size: "S", seasonality: "Q2" },
      { name: "Groupes nationaux", size: "L", seasonality: "Q3" }
    ];
    const bonus = (prospectType === "ancien" ? 6 : 0) + (budget ? 4 : 0);
    return base
      .map((s, i) => ({
        ...s,
        score: Math.min(99, Math.floor(((opportunitySeed + i * 13) % 100) + bonus))
      }))
      .filter((s) => s.score >= minScore)
      .sort((a, b) => b.score - a.score);
  }, [opportunitySeed, minScore, budget, prospectType]);

  const advertisers = useMemo(() => {
    const names = ["Promoteur Axia", "ImmoNova", "Résidences du Nord", "Habitat+", "Groupe Pierre&Co", "Logis Métropole"];
    const bonus = (prospectType === "ancien" ? 8 : 0) + (budget ? 3 : 0);
    return names
      .map((n, i) => ({
        name: n,
        zone: geo || "",
        signals: [i % 2 === 0 ? "Nouvelle résidence" : "Campagne social active"],
        fit: Math.min(99, Math.floor(((opportunitySeed * (i + 2)) % 100) + bonus))
      }))
      .filter((a) => a.fit >= minScore)
      .sort((a, b) => b.fit - a.fit);
  }, [geo, opportunitySeed, minScore, budget, prospectType]);

  const recos = useMemo(
    () =>
      buildPitch({
        sector,
        geo,
        goals,
        budget,
        prospectType,
        media,
        opportunityFloor: Math.max(segments[0]?.score || 0, 40)
      }),
    [sector, geo, goals, budget, prospectType, media, segments]
  );

  // --- actions
  function onToggleGoal(g) {
    setGoals((prev) => (prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]));
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
    setBudget("");
    setProspectType("nouveau");
    setMedia("");
    setMinScore(40);
    setResults(null);
  }

  function downloadPitch() {
    const content = `
# Pitch Pack — ${recos.headline}

Budget cible : ${budget || "N/A"}
Prospect : ${prospectType}
Média choisi : ${media || "N/A"}

• ${recos.bullets.join("\n• ")}

Portée prévue : ${recos.reach}

Segments prioritaires :
${segments.map((s) => `- ${s.name} — Score ${s.score}`).join("\n")}

Annonceurs suggérés :
${advertisers.map((a) => `- ${a.name} (${a.zone}) — Fit ${a.fit}`).join("\n")}
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
      `Lead → Secteur: ${sector} | Zone: ${geo} | Objectifs: ${goals.join(
        ", "
      )} | Budget: ${budget || "N/A"} | Prospect: ${prospectType} | Média: ${media || "N/A"}`
    );
  }

  function shareSearch() {
    const url = new URL(window.location.href);
    url.searchParams.set("sector", sector);
    url.searchParams.set("geo", geo);
    url.searchParams.set("goals", goals.join(","));
    if (budget) url.searchParams.set("budget", budget);
    url.searchParams.set("prospect", prospectType);
    if (media) url.searchParams.set("media", media);
    navigator.clipboard.writeText(url.toString());
    alert("Lien de recherche copié ✅");
  }

  // --- styles
  const btn = {
    padding: "10px 14px",
    borderRadius: 10,
    border: "none",
    background: "linear-gradient(90deg,#3b82f6,#2563eb)",
    color: "#fff",
    fontWeight: 600,
    cursor: "pointer",
    boxShadow: "0 2px 6px rgba(0,0,0,0.15)"
  };
  const btnGhost = { ...btn, background: "#fff", color: "#2563eb", border: "1px solid #2563eb", boxShadow: "none" };
  const card = { border: "1px solid #e5e7eb", borderRadius: 12, padding: 16, background: "#fff" };

  return (
    <div style={{ background: "#f0f9ff", minHeight: "100vh" }}>
      <div style={{ maxWidth: 1100, margin: "24px auto", padding: "0 16px" }}>
        {/* HEADER */}
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 24,
            background: "linear-gradient(90deg, #2563eb, #1d4ed8)",
            color: "white",
            padding: "16px 24px",
            borderRadius: "12px"
          }}
        >
          <h1 style={{ fontSize: 26, margin: 0 }}>✨ ORIA</h1>
          <span style={{ fontSize: 14, opacity: 0.9 }}>Prototype</span>
        </header>

        {/* Formulaire */}
        <div style={{ ...card, marginBottom: 16 }}>
          <h2 style={{ margin: 0, marginBottom: 12, fontSize: 18, color: "#1e3a8a" }}>Critères de recherche</h2>

          <div style={{ display: "grid", gap: 12, gridTemplateColumns: "1fr 1fr 1fr" }}>
            <div>
              <label>Secteur d’activité</label>
              <input
                placeholder="Ex. Immobilier, Auto, Banque…"
                value={sector}
                onChange={(e) => setSector(e.target.value)}
                style={{ width: "100%", marginTop: 6, padding: "10px 12px", borderRadius: 10 }}
              />
            </div>
            <div>
              <label>Zone géographique</label>
              <input
                placeholder="Ex. Lille, HDF, France"
                value={geo}
                onChange={(e) => setGeo(e.target.value)}
                style={{ width: "100%", marginTop: 6, padding: "10px 12px", borderRadius: 10 }}
              />
            </div>
            <div>
              <label>Objectif annonceur</label>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 6 }}>
                {GOALS.map((g) => {
                  const active = goals.includes(g);
                  return (
                    <span
                      key={g}
                      onClick={() => onToggleGoal(g)}
                      style={{
                        padding: "6px 10px",
                        border: "1px solid #e5e7eb",
                        borderRadius: 999,
                        cursor: "pointer",
                        background: active ? goalColors[g] : "#fff",
                        color: active ? "#fff" : "#111827",
                        fontWeight: active ? 600 : 400
                      }}
                    >
                      {g}
                    </span>
                  );
                })}
              </div>
            </div>
            <div>
              <label>Budget (€)</label>
              <input
                placeholder="Ex. 20 000"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                style={{ width: "100%", marginTop: 6, padding: "10px 12px", borderRadius: 10 }}
              />
            </div>
            <div>
              <label>Prospect</label>
              <select
                value={prospectType}
                onChange={(e) => setProspectType(e.target.value)}
                style={{ width: "100%", marginTop: 6, padding: "10px 12px", borderRadius: 10 }}
              >
                <option value="nouveau">Nouveau</option>
                <option value="ancien">Ancien</option>
              </select>
            </div>
            <div>
              <label>Média Rossel</label>
              <select
                value={media}
                onChange={(e) => setMedia(e.target.value)}
                style={{ width: "100%", marginTop: 6, padding: "10px 12px", borderRadius: 10 }}
              >
                <option value="">-- Choisir --</option>
                {MEDIAS.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Actions */}
          <div style={{ marginTop: 16, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <label>Score minimum</label>
              <input
                type="range"
                min={0}
                max={90}
                step={5}
                value={minScore}
                onChange={(e) => setMinScore(parseInt(e.target.value, 10))}
              />
              <span>{minScore}</span>
            </div>
            <button style={btnGhost} onClick={resetAll}>↺ Réinitialiser</button>
            <button style={{ ...btn, opacity: canSearch && !loading ? 1 : 0.6 }} disabled={!canSearch || loading} onClick={handleSearch}>
              {loading ? "Recherche…" : "🔎 Lancer la recherche"}
            </button>
          </div>
        </div>

        {/* Résultats */}
        {results && (
          <div style={{ display: "grid", gap: 16, gridTemplateColumns: "1fr 1fr 1fr" }}>
            <div style={card}>
              <h3>Segments & annonceurs</h3>
              {results.segments.map((s, idx) => (
                <div key={idx}><b>{s.name}</b> — Score {s.score}</div>
              ))}
            </div>
            <div style={card}>
              <h3>Cas & Benchmarks</h3>
              {DEFAULT_CASES.map((c, idx) => (
                <div key={idx} style={{ marginBottom: 8 }}>
                  <b>{c.title}</b><br />
                  Budget {c.budget} · Portée {c.reach}
                </div>
              ))}
            </div>
            <div style={card}>
              <h3>Recommandations & actions</h3>
              <div><b>{results.recos.headline}</b></div>
              <ul>{results.recos.bullets.map((b, i) => <li key={i}>{b}</li>)}</ul>
              <p><b>Budget estimé :</b> {budget || "N/A"} · <b>Portée prévue :</b> {results.recos.reach}</p>
              <div style={{ display: "grid", gap: 8, gridTemplateColumns: "1fr 1fr 1fr", marginTop: 8 }}>
                <button style={btn} onClick={downloadPitch}>⬇️ Télécharger le pitch pack</button>
                <button style={btnGhost} onClick={createLead}>➕ Créer un lead</button>
                <button style={btnGhost} onClick={shareSearch}>🔗 Partager la recherche</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
