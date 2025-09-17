"use client";
import React, { useMemo, useState } from "react";

/** =========================
 *  Constantes & utilitaires
 *  ========================= */
const PRIMARY_OBJECTIVES = [
  "Notoriété",
  "Considération",
  "Génération de trafic",
  "Leads",
];

// Couleurs par objectif
const objectiveColors = {
  Notoriété: "#7c3aed",         // violet
  Considération: "#2563eb",     // bleu
  "Génération de trafic": "#0ea5e9", // cyan
  Leads: "#16a34a",             // vert
};

// Médias Rossel (multi-choix)
const MEDIA_ROSSEL = ["La Voix du Nord", "Sudinfo", "Courrier picard", "Le Soir"];

// Mix media souhaité (multi-choix)
const MIX_MEDIA_OPTIONS = ["Quotidien", "Magazine", "Radio", "TV", "Digital", "Je ne sais pas"];

const DEFAULT_CASES = [
  {
    title: "Immobilier – Leads x1.6",
    kpis: { cpl: 32, leads: 240 },
    budget: "20–40k",
    formats: ["Vidéo locale", "Native"],
  },
  {
    title: "Auto – +35% d'intentions d'achat",
    kpis: { uplift: "+35%", reach: "450k" },
    budget: "30–60k",
    formats: ["Display", "Vidéo"],
  },
];

function hashScore(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h % 100;
}

function parseEurosToNumber(input) {
  if (!input) return NaN;
  const clean = String(input).replace(/[^\d]/g, "");
  return clean ? parseInt(clean, 10) : NaN;
}

// Estimation simple Budget / Portée (indicative)
function estimateBudgetAndReach({ budgetApprox, budgetEngage, primaryObjectives, mediaRossel, mixMedia }) {
  const provided =
    parseEurosToNumber(budgetApprox) ||
    parseEurosToNumber(budgetEngage) ||
    NaN;

  // Base par média Rossel (indicative)
  const rosselBase = {
    "La Voix du Nord": 140000,
    Sudinfo: 220000,
    "Courrier picard": 90000,
    "Le Soir": 180000,
  };
  // Base par mix média (indicative)
  const mixBase = {
    Quotidien: 120000,
    Magazine: 80000,
    Radio: 100000,
    TV: 300000,
    Digital: 150000,
    "Je ne sais pas": 60000,
  };

  const rosselReach =
    mediaRossel.length > 0
      ? mediaRossel.reduce((sum, m) => sum + (rosselBase[m] || 100000), 0)
      : 0;

  const mixReach =
    mixMedia.length > 0
      ? mixMedia.reduce((sum, m) => sum + (mixBase[m] || 80000), 0)
      : 0;

  let baseReach = Math.max(150000, rosselReach + mixReach || 0);

  // Ajustements selon objectif
  let reachMultiplier = 1;
  if (primaryObjectives.includes("Notoriété")) reachMultiplier += 0.25;
  if (primaryObjectives.includes("Considération")) reachMultiplier += 0.1;
  if (primaryObjectives.includes("Génération de trafic")) reachMultiplier -= 0.05;
  if (primaryObjectives.includes("Leads")) reachMultiplier -= 0.1;

  const estimatedReach = Math.round(baseReach * reachMultiplier);

  // Budget estimé si non fourni : CPM indicatif
  const cpm = 8;
  const suggestedBudget = Math.max(5000, Math.round((estimatedReach / 1000) * cpm));
  const estimatedBudget = Number.isFinite(provided) ? provided : suggestedBudget;

  return { estimatedBudget, estimatedReach };
}

function buildPitch({
  clientName,
  brand,
  sector,
  geo,
  primaryObjectives,
  budgetApprox,
  budgetEngage,
  dejaClient,
  mediaRossel,
  mixMedia,
  opportunityFloor,
}) {
  const g = primaryObjectives.join(" · ") || "Objectifs";
  const mRossel = mediaRossel.length ? ` · Médias Rossel : ${mediaRossel.join(", ")}` : "";
  const mMix = mixMedia.length ? ` · Mix : ${mixMedia.join(", ")}` : "";
  const headline = `${clientName || brand || "Client"} – ${sector || "Secteur"} – ${g} (${geo || "zone"})${mRossel}${mMix}`;

  const budgetLine = dejaClient === "oui"
    ? `Budget engagé (historique) : ${budgetEngage || "N/A"}`
    : `Budget approximatif : ${budgetApprox || "N/A"}`;

  const bullets = [
    budgetLine,
    `Prospect : ${dejaClient === "oui" ? "Ancien" : "Nouveau"}`,
    `Formats recommandés : ${
      primaryObjectives.includes("Leads") || primaryObjectives.includes("Génération de trafic")
        ? "Native + Formulaire/Drive-to-web + Retargeting"
        : "Vidéo + Display + Sponsoring + Native"
    }`,
    `KPI attendus : ${
      primaryObjectives.includes("Leads") || primaryObjectives.includes("Génération de trafic")
        ? "CPL 30–45€ / CTR > 0,8%"
        : "Reach 200–500k / VTR > 65%"
    }`,
  ];
  return { headline, bullets, score: Math.max(opportunityFloor, 55) };
}

/** =========================
 *  Composant principal
 *  ========================= */
export default function HDRSearchUI() {
  // Identité & contexte
  const [clientName, setClientName] = useState("");
  const [brand, setBrand] = useState("");
  const [sector, setSector] = useState("");

  // Ciblage
  const [geo, setGeo] = useState("");

  // Objectifs (nouvelle liste)
  const [primaryObjectives, setPrimaryObjectives] = useState([]);

  // Historique
  const [dejaClient, setDejaClient] = useState("non"); // "oui" | "non"
  const [budgetEngage, setBudgetEngage] = useState("");

  // Fichiers (client-side only)
  const [docs, setDocs] = useState([]); // File[]

  // Campagne
  const [campaignType, setCampaignType] = useState("ponctuelle"); // "ponctuelle" | "fil rouge"
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");

  // Budgets
  const [budgetApprox, setBudgetApprox] = useState("");

  // Sélections média
  const [mediaRossel, setMediaRossel] = useState([]); // multi
  const [mixMedia, setMixMedia] = useState([]); // multi

  // Moteur
  const [loading, setLoading] = useState(false);
  const [minScore, setMinScore] = useState(40);
  const [results, setResults] = useState(null);

  // Condition minimale pour lancer (comme avant : secteur/zone/objectifs)
  const canSearch = sector.trim() && geo.trim() && primaryObjectives.length > 0;

  // Seed inclut tout le nouveau contexte
  const opportunitySeed = useMemo(
    () =>
      hashScore(
        [
          clientName,
          brand,
          sector,
          geo,
          primaryObjectives.slice().sort().join("-"),
          dejaClient,
          budgetEngage,
          budgetApprox,
          mediaRossel.slice().sort().join("+"),
          mixMedia.slice().sort().join("+"),
          campaignType,
          periodStart,
          periodEnd,
        ].join("|")
      ),
    [
      clientName,
      brand,
      sector,
      geo,
      primaryObjectives,
      dejaClient,
      budgetEngage,
      budgetApprox,
      mediaRossel,
      mixMedia,
      campaignType,
      periodStart,
      periodEnd,
    ]
  );

  const segments = useMemo(() => {
    const base = [
      { name: "Promoteurs régionaux", size: "M", seasonality: "Q4+" },
      { name: "Agences locales", size: "S", seasonality: "Q2" },
      { name: "Groupes nationaux", size: "L", seasonality: "Q3" },
    ];
    const bonus =
      (dejaClient === "oui" ? 6 : 0) +
      (mediaRossel.length ? 3 : 0) +
      (mixMedia.length ? 2 : 0);
    return base
      .map((s, i) => ({
        ...s,
        score: Math.min(99, Math.floor(((opportunitySeed + i * 13) % 100) + bonus)),
      }))
      .filter((s) => s.score >= minScore)
      .sort((a, b) => b.score - a.score);
  }, [opportunitySeed, minScore, dejaClient, mediaRossel.length, mixMedia.length]);

  const advertisers = useMemo(() => {
    const names = [
      "Promoteur Axia",
      "ImmoNova",
      "Résidences du Nord",
      "Habitat+",
      "Groupe Pierre&Co",
      "Logis Métropole",
    ];
    const bonus =
      (dejaClient === "oui" ? 8 : 0) +
      (mediaRossel.length ? 3 : 0) +
      (mixMedia.length ? 2 : 0);
    return names
      .map((n, i) => ({
        name: n,
        zone: geo || "",
        signals: [i % 2 === 0 ? "Nouvelle résidence" : "Campagne social active"],
        fit: Math.min(99, Math.floor(((opportunitySeed * (i + 2)) % 100) + bonus)),
      }))
      .filter((a) => a.fit >= minScore)
      .sort((a, b) => b.fit - a.fit);
  }, [geo, opportunitySeed, minScore, dejaClient, mediaRossel.length, mixMedia.length]);

  const { estimatedBudget, estimatedReach } = useMemo(
    () =>
      estimateBudgetAndReach({
        budgetApprox,
        budgetEngage,
        primaryObjectives,
        mediaRossel,
        mixMedia,
      }),
    [budgetApprox, budgetEngage, primaryObjectives, mediaRossel, mixMedia]
  );

  const recos = useMemo(
    () =>
      buildPitch({
        clientName,
        brand,
        sector,
        geo,
        primaryObjectives,
        budgetApprox,
        budgetEngage,
        dejaClient,
        mediaRossel,
        mixMedia,
        opportunityFloor: Math.max(segments[0]?.score || 0, 40),
      }),
    [
      clientName,
      brand,
      sector,
      geo,
      primaryObjectives,
      budgetApprox,
      budgetEngage,
      dejaClient,
      mediaRossel,
      mixMedia,
      segments,
    ]
  );

  /** ===== Actions ===== */
  const toggleFromArray = (value, arrSetter, arr) =>
    arrSetter(arr.includes(value) ? arr.filter((x) => x !== value) : [...arr, value]);

  function onToggleObjective(o) {
    toggleFromArray(o, setPrimaryObjectives, primaryObjectives);
  }
  function onToggleRossel(m) {
    toggleFromArray(m, setMediaRossel, mediaRossel);
  }
  function onToggleMix(m) {
    toggleFromArray(m, setMixMedia, mixMedia);
  }

  function handleDocsChange(e) {
    const files = Array.from(e.target.files || []);
    setDocs(files);
  }

  function handleSearch() {
    if (!canSearch) return;
    setLoading(true);
    setTimeout(() => {
      setResults({
        segments,
        advertisers,
        cases: DEFAULT_CASES,
        recos,
        estimates: { budget: estimatedBudget, reach: estimatedReach },
        context: {
          clientName,
          brand,
          sector,
          geo,
          primaryObjectives,
          dejaClient,
          budgetEngage,
          budgetApprox,
          mediaRossel,
          mixMedia,
          campaignType,
          periodStart,
          periodEnd,
          docs: docs.map((f) => f.name),
        },
      });
      setLoading(false);
    }, 600);
  }

  function resetAll() {
    setClientName("");
    setBrand("");
    setSector("");
    setGeo("");
    setPrimaryObjectives([]);
    setDejaClient("non");
    setBudgetEngage("");
    setDocs([]);
    setCampaignType("ponctuelle");
    setPeriodStart("");
    setPeriodEnd("");
    setBudgetApprox("");
    setMediaRossel([]);
    setMixMedia([]);
    setMinScore(40);
    setResults(null);
  }

  function downloadPitch() {
    const content = `
# Pitch Pack — ${recos.headline}

Client : ${clientName || "N/A"} · Marque : ${brand || "N/A"}
Campagne : ${campaignType}${periodStart || periodEnd ? ` · Période : ${periodStart || "?"} → ${periodEnd || "?"}` : ""}

Objectifs : ${primaryObjectives.join(", ") || "N/A"}
Médias Rossel : ${mediaRossel.join(", ") || "N/A"}
Mix média souhaité : ${mixMedia.join(", ") || "N/A"}

Budget (approx./engagé) : ${
      budgetApprox || budgetEngage
        ? `${budgetApprox || budgetEngage}`
        : `${estimatedBudget.toLocaleString("fr-FR")} € (estimé)`
    }
Portée prévue : ${estimatedReach.toLocaleString("fr-FR")} personnes (estimation)

Documents fournis : ${docs.length ? docs.map((f) => f.name).join(", ") : "Aucun"}

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
    link.download = `PitchPack_${clientName || brand || sector || "Client"}_${geo || "Zone"}.md`;
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  function createLead() {
    alert(
      `Lead → Client: ${clientName || "N/A"} | Marque: ${brand || "N/A"} | Secteur: ${sector} | Zone: ${geo}
Objectifs: ${primaryObjectives.join(", ")}
Déjà client: ${dejaClient} ${dejaClient === "oui" ? `(Budget engagé: ${budgetEngage || "N/A"})` : ""}
Budget approximatif: ${budgetApprox || "N/A"}
Médias Rossel: ${mediaRossel.join(", ") || "N/A"}
Mix media: ${mixMedia.join(", ") || "N/A"}
Campagne: ${campaignType} ${
        periodStart || periodEnd ? `(${periodStart || "?"} → ${periodEnd || "?"})` : ""
      }
Portée prévue: ${estimatedReach.toLocaleString("fr-FR")} | Budget estimé: ${estimatedBudget.toLocaleString("fr-FR")} €`
    );
  }

  function shareSearch() {
    const url = new URL(window.location.href);
    url.searchParams.set("client", clientName);
    url.searchParams.set("brand", brand);
    url.searchParams.set("sector", sector);
    url.searchParams.set("geo", geo);
    url.searchParams.set("goals", primaryObjectives.join(","));
    url.searchParams.set("deja", dejaClient);
    if (budgetEngage) url.searchParams.set("budget_engage", budgetEngage);
    if (budgetApprox) url.searchParams.set("budget_approx", budgetApprox);
    if (mediaRossel.length) url.searchParams.set("media_rossel", mediaRossel.join(","));
    if (mixMedia.length) url.searchParams.set("mix", mixMedia.join(","));
    url.searchParams.set("type", campaignType);
    if (periodStart) url.searchParams.set("start", periodStart);
    if (periodEnd) url.searchParams.set("end", periodEnd);
    url.searchParams.set("reach_est", String(estimatedReach));
    navigator.clipboard.writeText(url.toString());
    alert("Lien copié dans le presse-papiers ✅");
  }

  /** ===== Styles ===== */
  const btn = {
    padding: "10px 14px",
    borderRadius: 10,
    border: "none",
    background: "linear-gradient(90deg,#3b82f6,#2563eb)",
    color: "#fff",
    fontWeight: 600,
    cursor: "pointer",
    boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
  };
  const btnGhost = {
    ...btn,
    background: "#fff",
    color: "#2563eb",
    border: "1px solid #2563eb",
    boxShadow: "none",
  };
  const card = {
    border: "1px solid #e5e7eb",
    borderRadius: 12,
    padding: 16,
    background: "#fff",
  };
  const chip = {
    padding: "6px 10px",
    border: "1px solid #e5e7eb",
    borderRadius: 999,
    cursor: "pointer",
    background: "#fff",
  };

  /** ===== Render ===== */
  return (
    <div style={{ background: "#f0f9ff", minHeight: "100vh" }}>
      <div style={{ maxWidth: 1180, margin: "24px auto", padding: "0 16px" }}>
        {/* HEADER - ORIA */}
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 24,
            background: "linear-gradient(90deg, #2563eb, #1d4ed8)",
            color: "white",
            padding: "16px 24px",
            borderRadius: "12px",
          }}
        >
          <h1 style={{ fontSize: 26, margin: 0 }}>✨ ORIA</h1>
          <span style={{ fontSize: 14, opacity: 0.9 }}>Prototype</span>
        </header>

        {/* FORMULAIRE – Recherche initiale */}
        <div style={{ ...card, marginBottom: 16 }}>
          <h2 style={{ margin: 0, marginBottom: 12, fontSize: 18, color: "#1e3a8a" }}>
            Critères de recherche
          </h2>

          {/* Ligne 1 : Client / Marque / Secteur */}
          <div style={{ display: "grid", gap: 12, gridTemplateColumns: "1fr 1fr 1fr" }}>
            <div>
              <label>Nom du client</label>
              <input
                placeholder="Ex. Groupe X"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                style={{ width: "100%", marginTop: 6, padding: "10px 12px", borderRadius: 10 }}
              />
            </div>
            <div>
              <label>Marque</label>
              <input
                placeholder="Ex. Marque Y"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                style={{ width: "100%", marginTop: 6, padding: "10px 12px", borderRadius: 10 }}
              />
            </div>
            <div>
              <label>Secteur</label>
              <input
                placeholder="Ex. Immobilier, Auto, Banque…"
                value={sector}
                onChange={(e) => setSector(e.target.value)}
                style={{ width: "100%", marginTop: 6, padding: "10px 12px", borderRadius: 10 }}
              />
            </div>
          </div>

          {/* Ligne 2 : Zone / Objectif prioritaire / Déjà client */}
          <div style={{ display: "grid", gap: 12, gridTemplateColumns: "1fr 1fr 1fr", marginTop: 12 }}>
            <div>
              <label>Zone géographique</label>
              <input
                placeholder="Ex. Lille Métropole, HDF, Belgique…"
                value={geo}
                onChange={(e) => setGeo(e.target.value)}
                style={{ width: "100%", marginTop: 6, padding: "10px 12px", borderRadius: 10 }}
              />
            </div>
            <div>
              <label>Objectif prioritaire</label>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 6 }}>
                {PRIMARY_OBJECTIVES.map((o) => {
                  const active = primaryObjectives.includes(o);
                  return (
                    <span
                      key={o}
                      onClick={() => onToggleObjective(o)}
                      style={{
                        ...chip,
                        background: active ? objectiveColors[o] : "#fff",
                        color: active ? "#fff" : "#111827",
                        borderColor: active ? objectiveColors[o] : "#e5e7eb",
                        fontWeight: active ? 600 : 400,
                      }}
                    >
                      {o}
                    </span>
                  );
                })}
              </div>
            </div>
            <div>
              <label>Déjà client</label>
              <select
                value={dejaClient}
                onChange={(e) => setDejaClient(e.target.value)}
                style={{ width: "100%", marginTop: 6, padding: "10px 12px", borderRadius: 10 }}
              >
                <option value="non">Non</option>
                <option value="oui">Oui</option>
              </select>
            </div>
          </div>

          {/* Ligne 3 : Budget engagé (si oui) / Upload docs */}
          <div style={{ display: "grid", gap: 12, gridTemplateColumns: "1fr 2fr", marginTop: 12 }}>
            <div>
              <label>Si oui, budget engagé</label>
              <input
                placeholder="Ex. 50 000 €"
                value={budgetEngage}
                onChange={(e) => setBudgetEngage(e.target.value)}
                disabled={dejaClient !== "oui"}
                style={{
                  width: "100%",
                  marginTop: 6,
                  padding: "10px 12px",
                  borderRadius: 10,
                  opacity: dejaClient === "oui" ? 1 : 0.6,
                }}
              />
            </div>
            <div>
              <label>Documents liés aux campagnes précédentes (PDF/Docs)</label>
              <input
                type="file"
                multiple
                onChange={handleDocsChange}
                style={{ width: "100%", marginTop: 6 }}
              />
              {docs.length > 0 && (
                <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
                  {docs.length} fichier(s) chargé(s) : {docs.map((f) => f.name).join(", ")}
                </div>
              )}
            </div>
          </div>

          {/* Ligne 4 : Type de campagne / Période / Budget approximatif */}
          <div style={{ display: "grid", gap: 12, gridTemplateColumns: "1fr 1fr 1fr 1fr", marginTop: 12 }}>
            <div>
              <label>Type de campagne</label>
              <select
                value={campaignType}
                onChange={(e) => setCampaignType(e.target.value)}
                style={{ width: "100%", marginTop: 6, padding: "10px 12px", borderRadius: 10 }}
              >
                <option value="ponctuelle">Ponctuelle</option>
                <option value="fil rouge">Fil rouge</option>
              </select>
            </div>
            <div>
              <label>Période – Début</label>
              <input
                type="date"
                value={periodStart}
                onChange={(e) => setPeriodStart(e.target.value)}
                style={{ width: "100%", marginTop: 6, padding: "10px 12px", borderRadius: 10 }}
              />
            </div>
            <div>
              <label>Période – Fin</label>
              <input
                type="date"
                value={periodEnd}
                onChange={(e) => setPeriodEnd(e.target.value)}
                style={{ width: "100%", marginTop: 6, padding: "10px 12px", borderRadius: 10 }}
              />
            </div>
            <div>
              <label>Budget approximatif</label>
              <input
                placeholder="Ex. 30 000 €"
                value={budgetApprox}
                onChange={(e) => setBudgetApprox(e.target.value)}
                style={{ width: "100%", marginTop: 6, padding: "10px 12px", borderRadius: 10 }}
              />
            </div>
          </div>

          {/* Ligne 5 : Mix média souhaité / Médias Rossel */}
          <div style={{ display: "grid", gap: 12, gridTemplateColumns: "1fr 1fr", marginTop: 12 }}>
            <div>
              <label>Mix média souhaité</label>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 6 }}>
                {MIX_MEDIA_OPTIONS.map((m) => {
                  const active = mixMedia.includes(m);
                  return (
                    <span
                      key={m}
                      onClick={() => onToggleMix(m)}
                      style={{
                        ...chip,
                        borderColor: active ? "#2563eb" : "#e5e7eb",
                        color: active ? "#2563eb" : "#111827",
                        background: active ? "#e0e7ff" : "#fff",
                        fontWeight: active ? 600 : 400,
                      }}
                    >
                      {m}
                    </span>
                  );
                })}
              </div>
            </div>
            <div>
              <label>Médias Rossel</label>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 6 }}>
                {MEDIA_ROSSEL.map((m) => {
                  const active = mediaRossel.includes(m);
                  return (
                    <span
                      key={m}
                      onClick={() => onToggleRossel(m)}
                      style={{
                        ...chip,
                        borderColor: active ? "#2563eb" : "#e5e7eb",
                        color: active ? "#2563eb" : "#111827",
                        background: active ? "#e0e7ff" : "#fff",
                        fontWeight: active ? 600 : 400,
                      }}
                    >
                      {m}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Ligne 6 : Score + Actions */}
          <div style={{ marginTop: 16, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <label>Score d’opportunité minimum</label>
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
            <button style={btnGhost} onClick={resetAll}>
              ↺ Réinitialiser
            </button>
            <button
              style={{ ...btn, opacity: canSearch && !loading ? 1 : 0.6 }}
              disabled={!canSearch || loading}
              onClick={handleSearch}
            >
              {loading ? "Recherche…" : "🔎 Lancer la recherche"}
            </button>
          </div>
        </div>

        {/* RÉSULTATS */}
        {results && (
          <div style={{ display: "grid", gap: 16, gridTemplateColumns: "1fr 1fr 1fr" }}>
            {/* Col A */}
            <div style={card}>
              <h3>Segments & annonceurs</h3>
              <div style={{ marginBottom: 8, color: "#64748b" }}>Filtré sur score ≥ {minScore}</div>
              {results.segments.map((s, idx) => (
                <div key={idx} style={{ marginBottom: 8 }}>
                  <b>{s.name}</b> — Score {s.score}
                </div>
              ))}
              <div style={{ marginTop: 12 }}>
                <h4>Annonceurs suggérés</h4>
                {results.advertisers.map((a, idx) => (
                  <div key={idx} style={{ marginBottom: 6 }}>
                    <b>{a.name}</b> · {a.zone} · {a.signals[0]} · Fit {a.fit}
                  </div>
                ))}
              </div>
            </div>

            {/* Col B */}
            <div style={card}>
              <h3>Cas & Benchmarks</h3>
              {DEFAULT_CASES.map((c, idx) => (
                <div key={idx} style={{ marginBottom: 8 }}>
                  <b>{c.title}</b>
                  <br />
                  Budget {c.budget} · Formats: {c.formats.join(", ")}
                </div>
              ))}
            </div>

            {/* Col C */}
            <div style={card}>
              <h3>Recommandations & actions</h3>

              {/* Bloc estimations */}
              <div
                style={{
                  marginBottom: 12,
                  padding: 12,
                  border: "1px solid #dbeafe",
                  background: "#eff6ff",
                  borderRadius: 10,
                }}
              >
                <div>
                  <b>Budget estimé :</b> {results.estimates.budget.toLocaleString("fr-FR")} €
                </div>
                <div>
                  <b>Portée prévue :</b> {results.estimates.reach.toLocaleString("fr-FR")} personnes
                </div>
                {(mediaRossel.length > 0 || mixMedia.length > 0) && (
                  <div style={{ marginTop: 4, fontSize: 12, color: "#1e40af" }}>
                    {mediaRossel.length > 0 ? `Rossel : ${mediaRossel.join(", ")}` : ""}
                    {mediaRossel.length > 0 && mixMedia.length > 0 ? " · " : ""}
                    {mixMedia.length > 0 ? `Mix : ${mixMedia.join(", ")}` : ""}
                  </div>
                )}
              </div>

              <div>
                <b>{results.recos.headline}</b>
              </div>
              <ul>
                {results.recos.bullets.map((b, i) => (
                  <li key={i}>{b}</li>
                ))}
              </ul>

              <div
                style={{
                  display: "grid",
                  gap: 8,
                  gridTemplateColumns: "1fr 1fr 1fr",
                  marginTop: 8,
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

              {/* Rappel du contexte clé */}
              <div style={{ marginTop: 12, fontSize: 12, color: "#64748b" }}>
                {results.context.clientName || results.context.brand ? (
                  <>Client : <b>{results.context.clientName || results.context.brand}</b> · </>
                ) : null}
                Objectifs : {results.context.primaryObjectives.join(", ")}
                {results.context.periodStart || results.context.periodEnd
                  ? ` · Période : ${results.context.periodStart || "?"} → ${results.context.periodEnd || "?"}`
                  : ""}
              </div>
            </div>
          </div>
        )}

        {/* État vide */}
        {!results && !loading && (
          <div
            style={{
              ...card,
              borderStyle: "dashed",
              textAlign: "center",
              padding: 40,
              background: "#fafafa",
              marginTop: 8,
            }}
          >
            <p style={{ fontSize: 16 }}>
              Renseignez le <b>client</b>, la <b>marque</b>, le <b>secteur</b>, la <b>zone</b>, les
              <b> objectifs</b>, puis (si possible) les <b>budgets</b>, le <b>mix média</b> et les <b>médias Rossel</b>.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
