import React from "react";

export default function PnlPage() {
  return (
    <div style={{ padding: 32 }}>
      <h1 style={{ fontSize: 32, fontWeight: 700 }}>PnL (Profit & Loss)</h1>
      <p style={{ marginTop: 16, fontSize: 18 }}>
        Página central de métricas y visualizaciones de PnL. Aquí se mostrarán los gráficos, tablas y KPIs relacionados con la evolución de utilidades y pérdidas.
      </p>
      <div style={{ marginTop: 32, color: '#888' }}>
        <em>Placeholder: Integra aquí los componentes de PnL, como PnlLine, PnlBucketsChart, etc.</em>
      </div>
    </div>
  );
}
