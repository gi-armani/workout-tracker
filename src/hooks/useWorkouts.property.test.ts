import { renderHook, act } from '@testing-library/react';
import * as fc from 'fast-check';
import { useWorkouts } from './useWorkouts';
import { Workout } from '../types';

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

describe('useWorkouts Property Tests', () => {
  beforeEach(() => {
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    localStorageMock.removeItem.mockClear();
    localStorageMock.clear.mockClear();
    localStorageMock.getItem.mockReturnValue(null);
    mockUUIDCounter = 0;
  });

  /**
   * Feature: workout-tracker, Property 1: Workout Display Consistency
   * For any workout registered on any date, that workout should be visible in the calendar on the corresponding date,
   * and when multiple workouts exist for the same date, all workouts should be displayed.
   * Validates: Requirements 1.2, 1.3
   */
  it('Property 1: Workout Display Consistency', () => {
    fc.assert(
      fc.property(
        // Generate arbitrary workout data
        fc.array(
          fc.record({
            date: fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') })
              .map(d => d.toISOString().split('T')[0]), // Convert to YYYY-MM-DD format
            workoutTypes: fc.array(fc.string({ minLength: 1, maxLength: 20 }), { minLength: 1, maxLength: 5 })
          }),
          { minLength: 1, maxLength: 10 }
        ),
        (workoutDataArray) => {
          const { result } = renderHook(() => useWorkouts());
          
          // Add all workouts
          const addedWorkouts: any[] = [];
          workoutDataArray.forEach(workoutData => {
            act(() => {
              const addedWorkout = result.current.addWorkout(workoutData);
              addedWorkouts.push(addedWorkout);
            });
          });

          // Test that each workout is visible on its corresponding date
          addedWorkouts.forEach(workout => {
            const workoutsForDate = result.current.getWorkoutsForDate(workout.date);
            
            // The workout should be found in the results for its date
            const foundWorkout = workoutsForDate.find(w => w.id === workout.id);
            expect(foundWorkout).toBeDefined();
            expect(foundWorkout?.date).toBe(workout.date);
            expect(foundWorkout?.workoutTypes).toEqual(workout.workoutTypes);
          });

          // Test that multiple workouts for the same date are all displayed
          const workoutsByDate = addedWorkouts.reduce((acc, workout) => {
            if (!acc[workout.date]) {
              acc[workout.date] = [];
            }
            acc[workout.date].push(workout);
            return acc;
          }, {} as Record<string, Workout[]>);

          (Object.entries(workoutsByDate) as [string, Workout[]][]).forEach(([date, expectedWorkouts]) => {
            const workoutsForDate = result.current.getWorkoutsForDate(date);
            
            // All workouts for this date should be returned
            expect(workoutsForDate).toHaveLength(expectedWorkouts.length);
            
            // Each expected workout should be found
            expectedWorkouts.forEach((expectedWorkout) => {
              const foundWorkout = workoutsForDate.find(w => w.id === expectedWorkout.id);
              expect(foundWorkout).toBeDefined();
            });
          });
        }
      ),
      { numRuns: 100 }
    );
  });
});