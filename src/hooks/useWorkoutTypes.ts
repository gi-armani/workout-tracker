import { useCallback } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { WorkoutType, STORAGE_KEYS } from '../types';

/**
 * Custom hook for managing workout types with localStorage persistence
 * Provides functions to add workout types with duplicate prevention and retrieve all types
 */
export function useWorkoutTypes() {
  const [workoutTypes, setWorkoutTypes] = useLocalStorage<WorkoutType[]>(STORAGE_KEYS.WORKOUT_TYPES, []);

  /**
   * Add a new workout type with duplicate prevention
   * Prevents duplicate workout type names (case-insensitive comparison)
   */
  const addWorkoutType = useCallback((typeName: string): WorkoutType => {
    // Validation
    if (!typeName || typeof typeName !== 'string') {
      throw new Error('Workout type name is required and must be a string');
    }

    const trimmedName = typeName.trim();
    if (trimmedName.length === 0) {
      throw new Error('Workout type name cannot be empty');
    }

    // Check for duplicates (case-insensitive)
    const existingType = workoutTypes.find(
      type => type.name.toLowerCase() === trimmedName.toLowerCase()
    );

    if (existingType) {
      throw new Error(`Workout type "${trimmedName}" already exists`);
    }

    // Generate new workout type
    const newWorkoutType: WorkoutType = {
      id: crypto.randomUUID(),
      name: trimmedName,
      createdAt: new Date().toISOString()
    };

    // Add to workout types array
    setWorkoutTypes(prevTypes => [...prevTypes, newWorkoutType]);
    
    return newWorkoutType;
  }, [workoutTypes, setWorkoutTypes]);

  /**
   * Get all workout types
   * Returns workout types sorted alphabetically by name
   */
  const getWorkoutTypes = useCallback((): WorkoutType[] => {
    return [...workoutTypes].sort((a, b) => a.name.localeCompare(b.name));
  }, [workoutTypes]);

  /**
   * Check if a workout type name already exists (case-insensitive)
   */
  const workoutTypeExists = useCallback((typeName: string): boolean => {
    if (!typeName || typeof typeName !== 'string') {
      return false;
    }
    
    const trimmedName = typeName.trim();
    return workoutTypes.some(
      type => type.name.toLowerCase() === trimmedName.toLowerCase()
    );
  }, [workoutTypes]);

  return {
    workoutTypes,
    addWorkoutType,
    getWorkoutTypes,
    workoutTypeExists
  };
}