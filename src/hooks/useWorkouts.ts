import { useCallback } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { Workout, STORAGE_KEYS } from '../types';

/**
 * Custom hook for managing workouts with localStorage persistence
 * Provides functions to add workouts and retrieve workouts by date/month
 */
export function useWorkouts() {
  const [workouts, setWorkouts] = useLocalStorage<Workout[]>(STORAGE_KEYS.WORKOUTS, []);

  /**
   * Add a new workout with validation
   * Validates that the workout has required fields and generates a unique ID
   */
  const addWorkout = useCallback((workoutData: Omit<Workout, 'id' | 'createdAt'>) => {
    // Validation
    if (!workoutData.date) {
      throw new Error('Workout date is required');
    }
    
    if (!workoutData.workoutTypes || workoutData.workoutTypes.length === 0) {
      throw new Error('At least one workout type is required');
    }

    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(workoutData.date)) {
      throw new Error('Invalid date format. Expected YYYY-MM-DD');
    }

    // Generate unique ID and timestamp
    const newWorkout: Workout = {
      id: crypto.randomUUID(),
      date: workoutData.date,
      workoutTypes: [...workoutData.workoutTypes], // Create a copy to avoid mutations
      createdAt: new Date().toISOString()
    };

    // Add to workouts array
    setWorkouts(prevWorkouts => [...prevWorkouts, newWorkout]);
    
    return newWorkout;
  }, [setWorkouts]);

  /**
   * Get all workouts for a specific date
   * Returns workouts sorted by creation time (newest first)
   */
  const getWorkoutsForDate = useCallback((date: string): Workout[] => {
    return workouts
      .filter(workout => workout.date === date)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [workouts]);

  /**
   * Get all workouts for a specific month and year
   * Returns workouts sorted by date (newest first)
   */
  const getWorkoutsForMonth = useCallback((month: number, year: number): Workout[] => {
    // Convert month to 1-based (JavaScript Date uses 0-based months)
    const monthStr = month.toString().padStart(2, '0');
    const yearStr = year.toString();
    const monthPrefix = `${yearStr}-${monthStr}`;

    return workouts
      .filter(workout => workout.date.startsWith(monthPrefix))
      .sort((a, b) => {
        // Sort by date first, then by creation time
        const dateComparison = b.date.localeCompare(a.date);
        if (dateComparison !== 0) return dateComparison;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [workouts]);

  return {
    workouts,
    addWorkout,
    getWorkoutsForDate,
    getWorkoutsForMonth
  };
}