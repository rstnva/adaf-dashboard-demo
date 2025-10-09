/**
 * Tests for Summer.fi Layout Migration
 */

import { describe, it, expect } from 'vitest';
import { 
  applySummerMigration, 
  revertSummerMigration,
  WSPLayoutConfig 
} from '@/lib/migrations/summer-layout';

describe('🔄 Summer.fi Layout Migration', () => {
  describe('applySummerMigration', () => {
    it('should create new layout when none exists', () => {
      const result = applySummerMigration();
      
      expect(result.version).toBe('v1.1');
      expect(result.lanes['onchain-yield-leverage']).toBeDefined();
      expect(result.lanes['onchain-yield-leverage'].widgets).toEqual([
        'SummerLazyVaultsWidget',
        'SummerMultiplyWidget'
      ]);
      expect(result.migrations).toHaveLength(1);
      expect(result.migrations[0].version).toBe('summer-v1.0');
      expect(result.migrations[0].applied).toBe(true);
    });

    it('should not modify layout if migration already applied', () => {
      const existingLayout: WSPLayoutConfig = {
        version: 'v1.0',
        lanes: {
          'onchain-yield-leverage': {
            widgets: ['SummerLazyVaultsWidget', 'SummerMultiplyWidget', 'ExistingWidget'],
            order: 0
          }
        },
        migrations: [{
          version: 'summer-v1.0',
          applied: true,
          timestamp: '2024-10-07T10:00:00Z'
        }]
      };

      const result = applySummerMigration(existingLayout);
      expect(result).toEqual(existingLayout);
    });

    it('should add widgets to existing lane without duplicates', () => {
      const existingLayout: WSPLayoutConfig = {
        version: 'v1.0',
        lanes: {
          'onchain-yield-leverage': {
            widgets: ['ExistingWidget', 'SummerLazyVaultsWidget'], // Already has one Summer widget
            order: 0
          }
        },
        migrations: []
      };

      const result = applySummerMigration(existingLayout);
      
      expect(result.lanes['onchain-yield-leverage'].widgets).toEqual([
        'ExistingWidget',
        'SummerLazyVaultsWidget',
        'SummerMultiplyWidget' // Only adds the missing one
      ]);
      expect(result.migrations).toHaveLength(1);
    });

    it('should create target lane if it does not exist', () => {
      const existingLayout: WSPLayoutConfig = {
        version: 'v1.0',
        lanes: {
          'other-lane': {
            widgets: ['OtherWidget'],
            order: 0
          }
        },
        migrations: []
      };

      const result = applySummerMigration(existingLayout);
      
      expect(result.lanes['onchain-yield-leverage']).toBeDefined();
      expect(result.lanes['onchain-yield-leverage'].widgets).toEqual([
        'SummerLazyVaultsWidget',
        'SummerMultiplyWidget'
      ]);
      expect(result.lanes['onchain-yield-leverage'].order).toBe(1); // After existing lane
    });

    it('should preserve user customizations', () => {
      const existingLayout: WSPLayoutConfig = {
        version: 'v1.0',
        lanes: {
          'onchain-yield-leverage': {
            widgets: ['CustomWidget1', 'CustomWidget2'],
            order: 0,
            collapsed: true // User customization
          },
          'other-lane': {
            widgets: ['OtherWidget'],
            order: 1
          }
        },
        migrations: []
      };

      const result = applySummerMigration(existingLayout);
      
      expect(result.lanes['onchain-yield-leverage'].collapsed).toBe(true); // Preserved
      expect(result.lanes['onchain-yield-leverage'].widgets).toEqual([
        'CustomWidget1',
        'CustomWidget2',
        'SummerLazyVaultsWidget',
        'SummerMultiplyWidget'
      ]);
      expect(result.lanes['other-lane']).toEqual(existingLayout.lanes['other-lane']); // Untouched
    });
  });

  describe('revertSummerMigration', () => {
    it('should remove Summer.fi widgets from layout', () => {
      const layoutWithSummer: WSPLayoutConfig = {
        version: 'v1.1',
        lanes: {
          'onchain-yield-leverage': {
            widgets: [
              'ExistingWidget',
              'SummerLazyVaultsWidget',
              'SummerMultiplyWidget',
              'AnotherWidget'
            ],
            order: 0
          }
        },
        migrations: [{
          version: 'summer-v1.0',
          applied: true,
          timestamp: '2024-10-07T10:00:00Z'
        }]
      };

      const result = revertSummerMigration(layoutWithSummer);
      
      expect(result.lanes['onchain-yield-leverage'].widgets).toEqual([
        'ExistingWidget',
        'AnotherWidget'
      ]);
      expect(result.migrations[0].applied).toBe(false);
    });

    it('should handle layout without Summer.fi widgets gracefully', () => {
      const layoutWithoutSummer: WSPLayoutConfig = {
        version: 'v1.0',
        lanes: {
          'onchain-yield-leverage': {
            widgets: ['ExistingWidget'],
            order: 0
          }
        },
        migrations: []
      };

      const result = revertSummerMigration(layoutWithoutSummer);
      
      expect(result.lanes['onchain-yield-leverage'].widgets).toEqual(['ExistingWidget']);
      expect(result.migrations).toHaveLength(0);
    });
  });
});