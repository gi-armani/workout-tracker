import { renderHook, act } from '@testing-library/react';
import * as fc from 'fast-check';
import { useWorkoutTypes } from './useWorkoutTypes';

// Mock crypto.randomUUID for consistent testing
let mockUUIDCounter = 0;
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: () => `test-uuid-${++mockUUIDCounter}`
  }
});

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

describe('useWorkoutTypes Property Tests', () => {
  beforeEach(() => {
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    localStorageMock.removeItem.mockClear();
    localStorageMock.clear.mockClear();
    localStorageMock.getItem.mockReturnValue(null);
    mockUUIDCounter = 0;
  });

  /**
   * Feature: workout-tracker, Property 8: Dynamic Workout Type Addition
   * For any new workout type added, it should immediately appear in the selection list and be available for selection.
   * Validates: Requirements 3.3
   */
  it('Property 8: Dynamic Workout Type Addition', () => {
    fc.assert(
      fc.property(
        // Generate array of unique workout type names (case-insensitive)
        fc.array(
          fc.string({ minLength: 1, maxLength: 30 }).filter(s => s.trim().length > 0),
          { minLength: 1, maxLength: 10 }
        ).map(names => {
          // Remove duplicates (case-insensitive) and trim
          const seen = new Set<string>();
          return names
            .map(n => n.trim())
            .filter(name => {
              const lowerName = name.toLowerCase();
              if (seen.has(lowerName)) {
                return false;
              }
              seen.add(lowerName);
              return true;
            });
        }),
        (workoutTypeNames) => {
          const { result } = renderHook(() => useWorkoutTypes());
          
          // Add each workout type and verify it appears immediately
          workoutTypeNames.forEach(typeName => {
            act(() => {
              result.current.addWorkoutType(typeName);
            });
            
            // Verify the type is immediately available in the list
            const allTypes = result.current.getWorkoutTypes();
            const addedType = allTypes.find(type => type.name === typeName);
            expect(addedType).toBeDefined();
            expect(addedType?.name).toBe(typeName);
            
            // Verify it's available for selection (exists check)
            expect(result.current.workoutTypeExists(typeName)).toBe(true);
          });
          
          // Verify all types are present in the final list
          const finalTypes = result.current.getWorkoutTypes();
          expect(finalTypes).toHaveLength(workoutTypeNames.length);
          
          workoutTypeNames.forEach(typeName => {
            expect(finalTypes.some(type => type.name === typeName)).toBe(true);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: workout-tracker, Property 9: Workout Type Persistence
   * For any new workout type added, it should be persisted in storage and remain available after application reload.
   * Validates: Requirements 3.4
   */
  it('Property 9: Workout Type Persistence', () => {
    fc.assert(
      fc.property(
        // Generate array of unique workout type names (case-insensitive)
        fc.array(
          fc.string({ minLength: 1, maxLength: 30 }).filter(s => s.trim().length > 0),
          { minLength: 1, maxLength: 5 }
        ).map(names => {
          // Remove duplicates (case-insensitive) and trim
          const seen = new Set<string>();
          return names
            .map(n => n.trim())
            .filter(name => {
              const lowerName = name.toLowerCase();
              if (seen.has(lowerName)) {
                return false;
              }
              seen.add(lowerName);
              return true;
            });
        }).filter(names => names.length > 0), // Ensure we have at least one name
        (workoutTypeNames) => {
          // First hook instance - add workout types
          const { result: result1 } = renderHook(() => useWorkoutTypes());
          
          // Track successfully added workout types
          const addedTypes: string[] = [];
          
          workoutTypeNames.forEach(typeName => {
            // Only add if it doesn't already exist
            if (!result1.current.workoutTypeExists(typeName)) {
              act(() => {
                result1.current.addWorkoutType(typeName);
              });
              addedTypes.push(typeName);
            }
          });
          
          // Skip test if no types were actually added
          if (addedTypes.length === 0) {
            return;
          }
          
          // Verify localStorage was called to persist data
          expect(localStorageMock.setItem).toHaveBeenCalled();
          
          // Simulate application reload by creating a new hook instance
          // Mock localStorage to return the persisted data
          const persistedData = addedTypes.map((name, index) => ({
            id: `test-uuid-${index + 1}`,
            name,
            createdAt: new Date().toISOString()
          }));
          
          localStorageMock.getItem.mockReturnValue(JSON.stringify(persistedData));
          
          // Second hook instance - should load persisted data
          const { result: result2 } = renderHook(() => useWorkoutTypes());
          
          // Verify all workout types are still available
          const loadedTypes = result2.current.getWorkoutTypes();
          expect(loadedTypes).toHaveLength(addedTypes.length);
          
          addedTypes.forEach(typeName => {
            expect(loadedTypes.some(type => type.name === typeName)).toBe(true);
            expect(result2.current.workoutTypeExists(typeName)).toBe(true);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: workout-tracker, Property 10: Duplicate Prevention
   * For any attempt to add a workout type with a name that already exists, the system should prevent the addition.
   * Validates: Requirements 3.5
   */
  it('Property 10: Duplicate Prevention', () => {
    fc.assert(
      fc.property(
        // Generate a workout type name and variations of it (different cases, with whitespace)
        fc.string({ minLength: 1, maxLength: 20 }).filter(s => s.trim().length > 0),
        (originalName) => {
          const { result } = renderHook(() => useWorkoutTypes());
          const trimmedName = originalName.trim();
          
          // Add the original workout type
          act(() => {
            result.current.addWorkoutType(trimmedName);
          });
          
          // Verify it was added
          expect(result.current.workoutTypeExists(trimmedName)).toBe(true);
          const initialCount = result.current.getWorkoutTypes().length;
          expect(initialCount).toBe(1);
          
          // Try to add the same name (exact match)
          expect(() => {
            act(() => {
              result.current.addWorkoutType(trimmedName);
            });
          }).toThrow(`Workout type "${trimmedName}" already exists`);
          
          // Try to add with different case (should also be prevented)
          const upperCaseName = trimmedName.toUpperCase();
          const lowerCaseName = trimmedName.toLowerCase();
          
          if (upperCaseName !== trimmedName) {
            expect(() => {
              act(() => {
                result.current.addWorkoutType(upperCaseName);
              });
            }).toThrow(`Workout type "${upperCaseName}" already exists`);
          }
          
          if (lowerCaseName !== trimmedName) {
            expect(() => {
              act(() => {
                result.current.addWorkoutType(lowerCaseName);
              });
            }).toThrow(`Workout type "${lowerCaseName}" already exists`);
          }
          
          // Try to add with extra whitespace (should be prevented after trimming)
          const nameWithSpaces = `  ${trimmedName}  `;
          expect(() => {
            act(() => {
              result.current.addWorkoutType(nameWithSpaces);
            });
          }).toThrow(`Workout type "${trimmedName}" already exists`);
          
          // Verify the count hasn't changed
          expect(result.current.getWorkoutTypes()).toHaveLength(initialCount);
        }
      ),
      { numRuns: 100 }
    );
  });
});