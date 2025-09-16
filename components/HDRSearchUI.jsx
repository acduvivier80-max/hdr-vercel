<div style={{ display: "grid", gap: 12, gridTemplateColumns: "1fr 1fr 1fr" }}>
  {/* Secteur */}
  <div>
    <label>Secteur d’activité</label>
    <input
      placeholder="Ex. Immobilier, Auto, Banque…"
      value={sector}
      onChange={(e) => setSector(e.target.value)}
      style={{ width: "100%", marginTop: 6, padding: "10px 12px", borderRadius: 10 }}
    />
  </div>

  {/* Zone */}
  <div>
    <label>Zone géographique</label>
    <input
      placeholder="Ex. Lille Métropole, HDF, France"
      value={geo}
      onChange={(e) => setGeo(e.target.value)}
      style={{ width: "100%", marginTop: 6, padding: "10px 12px", borderRadius: 10 }}
    />
  </div>

  {/* Objectifs */}
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

  {/* Budget */}
  <div>
    <label>Budget (€)</label>
    <input
      placeholder="Ex. 20 000"
      value={budget}
      onChange={(e) => setBudget(e.target.value)}
      style={{ width: "100%", marginTop: 6, padding: "10px 12px", borderRadius: 10 }}
    />
  </div>

  {/* Prospect */}
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
</div>
