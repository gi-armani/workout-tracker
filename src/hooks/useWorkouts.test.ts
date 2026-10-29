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

  describe('addWorkout', () => {
    it('should generate a unique id and an ISO createdAt timestamp', () => {
      const { result } = renderHook(() => useWorkouts());

      let first: ReturnType<typeof result.current.addWorkout>;
      let second: ReturnType<typeof result.current.addWorkout>;
      act(() => {
        first = result.current.addWorkout({
          date: '2023-12-01',
          workoutTypes: ['Running']
        });
      });
      act(() => {
        second = result.current.addWorkout({
          date: '2023-12-01',
          workoutTypes: ['Swimming']
        });
      });

      expect(first!.id).toBe('test-uuid-1');
      expect(second!.id).toBe('test-uuid-2');
      expect(first!.id).not.toBe(second!.id);
      // createdAt should be a valid ISO 8601 timestamp
      expect(first!.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
      expect(Number.isNaN(new Date(first!.createdAt).getTime())).toBe(false);
    });

    it('should copy the workoutTypes array so later mutations do not affect the stored workout', () => {
      const { result } = renderHook(() => useWorkouts());

      const inputTypes = ['Running', 'Cycling'];
      let added: ReturnType<typeof result.current.addWorkout>;
      act(() => {
        added = result.current.addWorkout({
          date: '2023-12-01',
          workoutTypes: inputTypes
        });
      });

      // Mutate the original input array after adding
      inputTypes.push('Mutated');
      inputTypes[0] = 'Changed';

      // The stored/returned workout must be unaffected
      expect(added!.workoutTypes).toEqual(['Running', 'Cycling']);
      expect(result.current.workouts[0].workoutTypes).toEqual(['Running', 'Cycling']);
    });

    it('should accumulate multiple workouts in insertion order', () => {
      const { result } = renderHook(() => useWorkouts());

      act(() => {
        result.current.addWorkout({ date: '2023-12-01', workoutTypes: ['Running'] });
      });
      act(() => {
        result.current.addWorkout({ date: '2023-12-02', workoutTypes: ['Swimming'] });
      });
      act(() => {
        result.current.addWorkout({ date: '2023-12-03', workoutTypes: ['Cycling'] });
      });

      expect(result.current.workouts).toHaveLength(3);
      expect(result.current.workouts.map(w => w.id)).toEqual([
        'test-uuid-1',
        'test-uuid-2',
        'test-uuid-3'
      ]);
      expect(result.current.workouts.map(w => w.date)).toEqual([
        '2023-12-01',
        '2023-12-02',
        '2023-12-03'
      ]);
    });

    it('should reject dates with an invalid number of digits', () => {
      const { result } = renderHook(() => useWorkouts());

      expect(() => {
        act(() => {
          result.current.addWorkout({ date: '2023-1-1', workoutTypes: ['Running'] });
        });
      }).toThrow('Invalid date format. Expected YYYY-MM-DD');
    });
  });

  describe('getWorkoutsForDate', () => {
    it('should return an empty array when no workouts match the date', () => {
      const { result } = renderHook(() => useWorkouts());

      act(() => {
        result.current.addWorkout({ date: '2023-12-01', workoutTypes: ['Running'] });
      });

      expect(result.current.getWorkoutsForDate('2024-01-01')).toEqual([]);
    });

    it('should sort workouts on the same date by createdAt descending (newest first)', () => {
      jest.useFakeTimers();
      try {
        const { result } = renderHook(() => useWorkouts());

        jest.setSystemTime(new Date('2023-12-01T08:00:00.000Z'));
        act(() => {
          result.current.addWorkout({ date: '2023-12-01', workoutTypes: ['Oldest'] });
        });

        jest.setSystemTime(new Date('2023-12-01T09:00:00.000Z'));
        act(() => {
          result.current.addWorkout({ date: '2023-12-01', workoutTypes: ['Middle'] });
        });

        jest.setSystemTime(new Date('2023-12-01T10:00:00.000Z'));
        act(() => {
          result.current.addWorkout({ date: '2023-12-01', workoutTypes: ['Newest'] });
        });

        const sorted = result.current.getWorkoutsForDate('2023-12-01');
        expect(sorted).toHaveLength(3);
        expect(sorted.map(w => w.workoutTypes[0])).toEqual(['Newest', 'Middle', 'Oldest']);
      } finally {
        jest.useRealTimers();
      }
    });
  });

  describe('getWorkoutsForMonth', () => {
    it('should return an empty array when no workouts fall in the month', () => {
      const { result } = renderHook(() => useWorkouts());

      act(() => {
        result.current.addWorkout({ date: '2023-12-01', workoutTypes: ['Running'] });
      });

      expect(result.current.getWorkoutsForMonth(1, 2024)).toEqual([]);
    });

    it('should zero-pad single-digit months when matching dates', () => {
      const { result } = renderHook(() => useWorkouts());

      act(() => {
        result.current.addWorkout({ date: '2023-01-15', workoutTypes: ['January'] });
      });
      act(() => {
        result.current.addWorkout({ date: '2023-11-15', workoutTypes: ['November'] });
      });

      const january = result.current.getWorkoutsForMonth(1, 2023);
      expect(january).toHaveLength(1);
      expect(january[0].workoutTypes[0]).toBe('January');
    });

    it('should sort by date descending, then by createdAt descending within a date', () => {
      jest.useFakeTimers();
      try {
        const { result } = renderHook(() => useWorkouts());

        // Two workouts on 2023-12-01 at different times
        jest.setSystemTime(new Date('2023-12-01T08:00:00.000Z'));
        act(() => {
          result.current.addWorkout({ date: '2023-12-01', workoutTypes: ['Dec1-early'] });
        });
        jest.setSystemTime(new Date('2023-12-01T12:00:00.000Z'));
        act(() => {
          result.current.addWorkout({ date: '2023-12-01', workoutTypes: ['Dec1-late'] });
        });

        // One workout on a later date
        jest.setSystemTime(new Date('2023-12-05T09:00:00.000Z'));
        act(() => {
          result.current.addWorkout({ date: '2023-12-05', workoutTypes: ['Dec5'] });
        });

        const sorted = result.current.getWorkoutsForMonth(12, 2023);
        expect(sorted.map(w => w.workoutTypes[0])).toEqual([
          'Dec5',
          'Dec1-late',
          'Dec1-early'
        ]);
      } finally {
        jest.useRealTimers();
      }
    });
  });
});