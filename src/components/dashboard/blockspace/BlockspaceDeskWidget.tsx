// Widget de escritorio para métricas de blockspace (simulado)
'use client';
import React from 'react';

export function BlockspaceDeskWidget() {
  return (
    <div className="p-4 bg-white rounded shadow">
      <h3 className="font-bold mb-2">Blockspace Desk (Simulación)</h3>
      <div className="text-sm text-gray-600">Bundles enviados: <b>1</b></div>
      <div className="text-sm text-gray-600">Último bundle: <b>mock-bundle-001</b></div>
    </div>
  );
}
