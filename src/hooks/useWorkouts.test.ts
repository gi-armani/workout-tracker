import { renderHook, act } from '@testing-library/react';
import { useWorkouts } from './useWorkouts';

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

describe('useWorkouts', () => {
  beforeEach(() => {
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    localStorageMock.removeItem.mockClear();
    localStorageMock.clear.mockClear();
    localStorageMock.getItem.mockReturnValue(null);
    mockUUIDCounter = 0; // Reset counter for each test
  });

  it('should initialize with empty workouts array', () => {
    const { result } = renderHook(() => useWorkouts());
    
    expect(result.current.workouts).toEqual([]);
  });

  it('should add a valid workout', () => {
    const { result } = renderHook(() => useWorkouts());
    
    act(() => {
      const workout = result.current.addWorkout({
        date: '2023-12-01',
        workoutTypes: ['Running', 'Strength Training']
      });
      
      expect(workout.id).toBe('test-uuid-1');
      expect(workout.date).toBe('2023-12-01');
      expect(workout.workoutTypes).toEqual(['Running', 'Strength Training']);
      expect(workout.createdAt).toBeDefined();
    });
    
    expect(result.current.workouts).toHaveLength(1);
  });

  it('should throw error for workout without date', () => {
    const { result } = renderHook(() => useWorkouts());
    
    expect(() => {
      act(() => {
        result.current.addWorkout({
          date: '',
          workoutTypes: ['Running']
        });
      });
    }).toThrow('Workout date is required');
  });

  it('should throw error for workout without workout types', () => {
    const { result } = renderHook(() => useWorkouts());
    
    expect(() => {
      act(() => {
        result.current.addWorkout({
          date: '2023-12-01',
          workoutTypes: []
        });
      });
    }).toThrow('At least one workout type is required');
  });

  it('should throw error for invalid date format', () => {
    const { result } = renderHook(() => useWorkouts());
    
    expect(() => {
      act(() => {
        result.current.addWorkout({
          date: '12/01/2023',
          workoutTypes: ['Running']
        });
      });
    }).toThrow('Invalid date format. Expected YYYY-MM-DD');
  });

  it('should get workouts for specific date', () => {
    const { result } = renderHook(() => useWorkouts());
    
    act(() => {
      result.current.addWorkout({
        date: '2023-12-01',
        workoutTypes: ['Running']
      });
    });
    
    act(() => {
      result.current.addWorkout({
        date: '2023-12-02',
        workoutTypes: ['Swimming']
      });
    });
    
    act(() => {
      result.current.addWorkout({
        date: '2023-12-01',
        workoutTypes: ['Cycling']
      });
    });
    
    const workoutsForDec1 = result.current.getWorkoutsForDate('2023-12-01');
    expect(workoutsForDec1).toHaveLength(2);
    expect(workoutsForDec1.every(w => w.date === '2023-12-01')).toBe(true);
  });

  it('should get workouts for specific month', () => {
    const { result } = renderHook(() => useWorkouts());
    
    act(() => {
      result.current.addWorkout({
        date: '2023-12-01',
        workoutTypes: ['Running']
      });
    });
    
    act(() => {
      result.current.addWorkout({
        date: '2023-11-30',
        workoutTypes: ['Swimming']
      });
    });
    
    act(() => {
      result.current.addWorkout({
        date: '2023-12-15',
        workoutTypes: ['Cycling']
      });
    });
    
    const workoutsForDec2023 = result.current.getWorkoutsForMonth(12, 2023);
    expect(workoutsForDec2023).toHaveLength(2);
    expect(workoutsForDec2023.every(w => w.date.startsWith('2023-12'))).toBe(true);
  });
});