import * as fc from 'fast-check';
import { Workout, WorkoutType, StorageSchema, STORAGE_KEYS, APP_VERSION } from './index';

// Generators for property-based testing
const workoutTypeGenerator = fc.record({
  id: fc.uuid(),
  name: fc.string({ minLength: 1, maxLength: 50 }),
  createdAt: fc.date().map(d => d.toISOString()),
});

const workoutGenerator = fc.record({
  id: fc.uuid(),
  date: fc.date().map(d => d.toISOString().split('T')[0]), // YYYY-MM-DD format
  workoutTypes: fc.array(fc.string({ minLength: 1, maxLength: 50 }), { minLength: 1, maxLength: 10 }),
  createdAt: fc.date().map(d => d.toISOString()),
});

const storageSchemaGenerator = fc.record({
  workouts: fc.array(workoutGenerator, { maxLength: 100 }),
  workoutTypes: fc.array(workoutTypeGenerator, { maxLength: 50 }),
  appVersion: fc.constant(APP_VERSION),
});

// Mock localStorage for testing
const createMockLocalStorage = () => {
  let store: Record<string, string> = {};
  
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    get store() {
      return { ...store };
    }
  };
};

describe('Data Model Property Tests', () => {
  let mockLocalStorage: ReturnType<typeof createMockLocalStorage>;

  beforeEach(() => {
    mockLocalStorage = createMockLocalStorage();
    Object.defineProperty(window, 'localStorage', {
      value: mockLocalStorage,
      writable: true,
    });
  });

  /**
   * Feature: workout-tracker, Property 11: Data Persistence Round Trip
   * Validates: Requirements 4.1, 4.2, 4.3, 4.5
   */
  describe('Property 11: Data Persistence Round Trip', () => {
    it('should preserve workout data integrity through save/load cycle', () => {
      fc.assert(
        fc.property(fc.array(workoutGenerator, { maxLength: 50 }), (workouts) => {
          // Save workouts to localStorage
          const serializedWorkouts = JSON.stringify(workouts);
          mockLocalStorage.setItem(STORAGE_KEYS.WORKOUTS, serializedWorkouts);

          // Load workouts from localStorage
          const loadedData = mockLocalStorage.getItem(STORAGE_KEYS.WORKOUTS);
          const deserializedWorkouts: Workout[] = loadedData ? JSON.parse(loadedData) : [];

          // Verify data integrity
          expect(deserializedWorkouts).toEqual(workouts);
          expect(deserializedWorkouts.length).toBe(workouts.length);

          // Verify each workout maintains its structure
          deserializedWorkouts.forEach((workout, index) => {
            expect(workout.id).toBe(workouts[index].id);
            expect(workout.date).toBe(workouts[index].date);
            expect(workout.workoutTypes).toEqual(workouts[index].workoutTypes);
            expect(workout.createdAt).toBe(workouts[index].createdAt);
          });
        }),
        { numRuns: 100 }
      );
    });

    it('should preserve workout type data integrity through save/load cycle', () => {
      fc.assert(
        fc.property(fc.array(workoutTypeGenerator, { maxLength: 50 }), (workoutTypes) => {
          // Save workout types to localStorage
          const serializedTypes = JSON.stringify(workoutTypes);
          mockLocalStorage.setItem(STORAGE_KEYS.WORKOUT_TYPES, serializedTypes);

          // Load workout types from localStorage
          const loadedData = mockLocalStorage.getItem(STORAGE_KEYS.WORKOUT_TYPES);
          const deserializedTypes: WorkoutType[] = loadedData ? JSON.parse(loadedData) : [];

          // Verify data integrity
          expect(deserializedTypes).toEqual(workoutTypes);
          expect(deserializedTypes.length).toBe(workoutTypes.length);

          // Verify each workout type maintains its structure
          deserializedTypes.forEach((type, index) => {
            expect(type.id).toBe(workoutTypes[index].id);
            expect(type.name).toBe(workoutTypes[index].name);
            expect(type.createdAt).toBe(workoutTypes[index].createdAt);
          });
        }),
        { numRuns: 100 }
      );
    });

    it('should preserve complete storage schema integrity through save/load cycle', () => {
      fc.assert(
        fc.property(storageSchemaGenerator, (schema) => {
          // Save complete schema to localStorage
          mockLocalStorage.setItem(STORAGE_KEYS.WORKOUTS, JSON.stringify(schema.workouts));
          mockLocalStorage.setItem(STORAGE_KEYS.WORKOUT_TYPES, JSON.stringify(schema.workoutTypes));
          mockLocalStorage.setItem(STORAGE_KEYS.APP_VERSION, JSON.stringify(schema.appVersion));

          // Load complete schema from localStorage
          const loadedWorkouts = JSON.parse(mockLocalStorage.getItem(STORAGE_KEYS.WORKOUTS) || '[]');
          const loadedTypes = JSON.parse(mockLocalStorage.getItem(STORAGE_KEYS.WORKOUT_TYPES) || '[]');
          const loadedVersion = JSON.parse(mockLocalStorage.getItem(STORAGE_KEYS.APP_VERSION) || '""');

          const reconstructedSchema: StorageSchema = {
            workouts: loadedWorkouts,
            workoutTypes: loadedTypes,
            appVersion: loadedVersion,
          };

          // Verify complete schema integrity
          expect(reconstructedSchema).toEqual(schema);
          expect(reconstructedSchema.workouts).toEqual(schema.workouts);
          expect(reconstructedSchema.workoutTypes).toEqual(schema.workoutTypes);
          expect(reconstructedSchema.appVersion).toBe(schema.appVersion);
        }),
        { numRuns: 100 }
      );
    });

    it('should handle empty data gracefully in round trip', () => {
      const emptySchema: StorageSchema = {
        workouts: [],
        workoutTypes: [],
        appVersion: APP_VERSION,
      };

      // Save empty schema
      mockLocalStorage.setItem(STORAGE_KEYS.WORKOUTS, JSON.stringify(emptySchema.workouts));
      mockLocalStorage.setItem(STORAGE_KEYS.WORKOUT_TYPES, JSON.stringify(emptySchema.workoutTypes));
      mockLocalStorage.setItem(STORAGE_KEYS.APP_VERSION, JSON.stringify(emptySchema.appVersion));

      // Load and verify
      const loadedWorkouts = JSON.parse(mockLocalStorage.getItem(STORAGE_KEYS.WORKOUTS) || '[]');
      const loadedTypes = JSON.parse(mockLocalStorage.getItem(STORAGE_KEYS.WORKOUT_TYPES) || '[]');
      const loadedVersion = JSON.parse(mockLocalStorage.getItem(STORAGE_KEYS.APP_VERSION) || '""');

      expect(loadedWorkouts).toEqual([]);
      expect(loadedTypes).toEqual([]);
      expect(loadedVersion).toBe(APP_VERSION);
    });
  });
});