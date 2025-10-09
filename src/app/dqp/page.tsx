import React from "react";

export default function DqpPage() {
  return (
    <div style={{ padding: 32 }}>
      <h1 style={{ fontSize: 32, fontWeight: 700 }}>DQP Health & Overview</h1>
      <p style={{ marginTop: 16, fontSize: 18 }}>
        Página central para monitoreo y salud de DQP. Aquí se mostrarán paneles, tarjetas y métricas relevantes al estado y calidad de datos del sistema.
      </p>
      <div style={{ marginTop: 32, color: '#888' }}>
        <em>Placeholder: Integra aquí los componentes de DQP, como DqpHealthCard, paneles de incidentes, etc.</em>
      </div>
    </div>
  );
}
