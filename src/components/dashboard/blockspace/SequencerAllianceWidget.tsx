// Widget de alianzas de secuenciadores (simulado)
'use client';
import React from 'react';

export function SequencerAllianceWidget() {
  const alliances = [
    { id: 'seq-1', name: 'Alliance Uno', performance: 0.98 },
    { id: 'seq-2', name: 'Alliance Dos', performance: 0.95 },
  ];
  return (
    <div className="p-4 bg-white rounded shadow mt-4">
      <h3 className="font-bold mb-2">Alianzas de Secuenciadores</h3>
      <ul>
        {alliances.map(a => (
          <li key={a.id} className="text-sm text-gray-700">
            {a.name}: <b>{(a.performance * 100).toFixed(1)}%</b>
          </li>
        ))}
      </ul>
    </div>
  );
}
