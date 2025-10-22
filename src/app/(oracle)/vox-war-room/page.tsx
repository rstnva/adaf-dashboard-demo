'use client';

import React from 'react';
import { TopMovers } from '@/components/oracle/vox/TopMovers';
import { HypeVsPrice } from '@/components/oracle/vox/HypeVsPrice';
import { BrigadingHeatmap } from '@/components/oracle/vox/BrigadingHeatmap';
import { NarrativesTreemap } from '@/components/oracle/vox/NarrativesTreemap';
import { InfluencersBoard } from '@/components/oracle/vox/InfluencersBoard';

export default function VoxWarRoomPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Vox War Room</h1>
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-2 rounded">
          🎭 DEMO (MOCK DATA)
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <TopMovers />
        <HypeVsPrice />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <BrigadingHeatmap />
        <NarrativesTreemap />
      </div>
      
      <div className="grid grid-cols-1 gap-6">
        <InfluencersBoard />
      </div>
    </div>
  );
}
