/**
 * Core data models for the Workout Tracker application
 */

export interface Workout {
  id: string;           // Unique identifier (UUID)
  date: string;         // ISO date string (YYYY-MM-DD)
  workoutTypes: string[]; // Array of workout type names
  createdAt: string;    // ISO timestamp
}

export interface WorkoutType {
  id: string;           // Unique identifier
  name: string;         // Display name
  createdAt: string;    // ISO timestamp
}

/**
 * Storage schema for localStorage persistence
 */
export interface StorageSchema {
  workouts: Workout[];           // Array of all workouts
  workoutTypes: WorkoutType[];   // Array of all workout types
  appVersion: string;            // For data migration
}

/**
 * Storage keys used in localStorage
 */
export const STORAGE_KEYS = {
  WORKOUTS: 'workouts',
  WORKOUT_TYPES: 'workoutTypes',
  APP_VERSION: 'appVersion'
} as const;

/**
 * Current application version for data migration
 */
export const APP_VERSION = '1.0.0';