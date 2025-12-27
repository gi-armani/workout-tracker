import { renderHook, act } from '@testing-library/react';
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

describe('useWorkoutTypes', () => {
  beforeEach(() => {
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    localStorageMock.removeItem.mockClear();
    localStorageMock.clear.mockClear();
    localStorageMock.getItem.mockReturnValue(null);
    mockUUIDCounter = 0; // Reset counter for each test
  });

  it('should initialize with empty workout types array', () => {
    const { result } = renderHook(() => useWorkoutTypes());
    
    expect(result.current.workoutTypes).toEqual([]);
  });

  it('should add a valid workout type', () => {
    const { result } = renderHook(() => useWorkoutTypes());
    
    act(() => {
      const workoutType = result.current.addWorkoutType('Running');
      
      expect(workoutType.id).toBe('test-uuid-1');
      expect(workoutType.name).toBe('Running');
      expect(workoutType.createdAt).toBeDefined();
    });
    
    expect(result.current.workoutTypes).toHaveLength(1);
  });

  it('should throw error for empty workout type name', () => {
    const { result } = renderHook(() => useWorkoutTypes());
    
    expect(() => {
      act(() => {
        result.current.addWorkoutType('');
      });
    }).toThrow('Workout type name is required and must be a string');
  });

  it('should throw error for whitespace-only workout type name', () => {
    const { result } = renderHook(() => useWorkoutTypes());
    
    expect(() => {
      act(() => {
        result.current.addWorkoutType('   ');
      });
    }).toThrow('Workout type name cannot be empty');
  });

  it('should prevent duplicate workout types (case-insensitive)', () => {
    const { result } = renderHook(() => useWorkoutTypes());
    
    act(() => {
      result.current.addWorkoutType('Running');
    });
    
    expect(() => {
      act(() => {
        result.current.addWorkoutType('running');
      });
    }).toThrow('Workout type "running" already exists');
  });

  it('should trim workout type names', () => {
    const { result } = renderHook(() => useWorkoutTypes());
    
    act(() => {
      const workoutType = result.current.addWorkoutType('  Swimming  ');
      expect(workoutType.name).toBe('Swimming');
    });
  });

  it('should get workout types sorted alphabetically', () => {
    const { result } = renderHook(() => useWorkoutTypes());
    
    act(() => {
      result.current.addWorkoutType('Cycling');
    });
    
    act(() => {
      result.current.addWorkoutType('Running');
    });
    
    act(() => {
      result.current.addWorkoutType('Swimming');
    });
    
    const sortedTypes = result.current.getWorkoutTypes();
    expect(sortedTypes.map(t => t.name)).toEqual(['Cycling', 'Running', 'Swimming']);
  });

  it('should check if workout type exists', () => {
    const { result } = renderHook(() => useWorkoutTypes());
    
    act(() => {
      result.current.addWorkoutType('Running');
    });
    
    expect(result.current.workoutTypeExists('Running')).toBe(true);
    expect(result.current.workoutTypeExists('running')).toBe(true);
    expect(result.current.workoutTypeExists('Swimming')).toBe(false);
  });
});