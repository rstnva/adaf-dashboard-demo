/* eslint-disable no-unused-vars */
/// <reference types="vitest" />

declare module 'vitest' {
  interface Assertion<T = unknown> {
    toBeOneOf(_expected: readonly T[]): void;
  }
}

export {};
