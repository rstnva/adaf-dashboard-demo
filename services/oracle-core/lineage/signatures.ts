export interface SignatureContext {
  signalId: string;
  signer: string;
  digest: string;
}

export interface SignatureRecord extends SignatureContext {
  signedAt: string;
}

const signatures = new Map<string, SignatureRecord>();

export function recordSignature(input: SignatureContext) {
  signatures.set(input.signalId, {
    ...input,
    signedAt: new Date().toISOString(),
  });
}

export function getSignature(signalId: string): SignatureRecord | undefined {
  return signatures.get(signalId);
}
