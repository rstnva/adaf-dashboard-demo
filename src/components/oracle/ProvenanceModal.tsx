'use client';

import React from 'react';
/**
 * Provenance Modal - Shows signal lineage and evidence sources
 * Click on any signal → see full EvidenceRef[] chain
 */

import { useQuery } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Database, Clock } from 'lucide-react';

interface EvidenceRef {
  source_id: string;
  url?: string;
  hash?: string;
  round_id?: string;
  price_id?: string;
  block_number?: number;
  block_hash?: string;
  captured_at: string;
}

interface SignalProvenance {
  signalId: string;
  feedId: string;
  value: number;
  unit: string;
  confidence: number;
  timestamp: string;
  evidence: EvidenceRef[];
  consensusMethod: string;
  quorumPassed: boolean;
  metadata?: {
    sources_count: number;
    consensus_threshold: number;
    processing_time_ms: number;
  };
}

async function fetchProvenance(signalId: string): Promise<SignalProvenance> {
  // Call real API endpoint (mock-first implementation)
  const response = await fetch(`/api/oracle/v1/provenance/${signalId}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch provenance');
  }

  return response.json();
}

interface ProvenanceModalProps {
  signalId: string;
  onClose: () => void;
}

export function ProvenanceModal({ signalId, onClose }: ProvenanceModalProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['provenance', signalId],
    queryFn: () => fetchProvenance(signalId),
  });

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Signal Provenance</DialogTitle>
          <DialogDescription>
            Data lineage and source evidence for signal{' '}
            <code className="text-xs">{signalId}</code>
          </DialogDescription>
        </DialogHeader>

        {isLoading || !data ? (
          <div className="h-64 flex items-center justify-center">
            <div className="animate-pulse">Loading provenance data...</div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Signal Summary */}
            <div className="rounded-lg border p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">Feed ID</div>
                <div className="font-mono text-sm">{data.feedId}</div>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">Value</div>
                <div className="text-2xl font-bold">
                  {data.value.toLocaleString()} {data.unit}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">Confidence</div>
                <Badge variant={data.confidence >= 0.9 ? 'default' : 'outline'}>
                  {(data.confidence * 100).toFixed(1)}%
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Consensus Method
                </div>
                <Badge variant="outline">
                  {data.consensusMethod.replace('_', ' ')}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Quorum Status
                </div>
                <Badge variant={data.quorumPassed ? 'default' : 'destructive'}>
                  {data.quorumPassed ? 'Passed' : 'Failed'}
                </Badge>
              </div>
            </div>

            {/* Evidence Sources */}
            <div>
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Database className="h-4 w-4" />
                Evidence Sources ({data.evidence.length})
              </h3>
              <div className="space-y-3">
                {data.evidence.map((evidence, index) => (
                  <div key={index} className="rounded-lg border p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="font-medium">{evidence.source_id}</div>
                      {evidence.url && (
                        <a
                          href={evidence.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-xs"
                        >
                          View Source <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                      {evidence.round_id && (
                        <div>
                          <span className="font-medium">Round ID:</span>{' '}
                          {evidence.round_id}
                        </div>
                      )}
                      {evidence.price_id && (
                        <div>
                          <span className="font-medium">Price ID:</span>{' '}
                          <code className="text-xs">
                            {evidence.price_id.slice(0, 20)}...
                          </code>
                        </div>
                      )}
                      {evidence.hash && (
                        <div>
                          <span className="font-medium">Hash:</span>{' '}
                          <code className="text-xs">{evidence.hash}</code>
                        </div>
                      )}
                      {evidence.block_number && (
                        <div>
                          <span className="font-medium">Block:</span>{' '}
                          {evidence.block_number}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      Captured:{' '}
                      {new Date(evidence.captured_at).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
