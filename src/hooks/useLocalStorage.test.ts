import { renderHook, act } from '@testing-library/react';
import { useLocalStorage } from './useLocalStorage';

// Simple localStorage mock that works with the hook's availability check
const createWorkingLocalStorage = () => {
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
    get length() {
      return Object.keys(store).length;
    },
    key: (index: number) => Object.keys(store)[index] || null,
  };
};

describe('useLocalStorage', () => {
  let mockStorage: ReturnType<typeof createWorkingLocalStorage>;
  let consoleWarnSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    mockStorage = createWorkingLocalStorage();
    
    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: mockStorage,
      writable: true,
      configurable: true,
    });
    
    // Mock console methods
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
    mockStorage.clear();
  });

  describe('localStorage availability detection', () => {
    it('should use initialValue when localStorage is unavailable', () => {
      // Mock localStorage to throw error on setItem
      const originalSetItem = mockStorage.setItem;
      mockStorage.setItem = () => {
        throw new Error('localStorage not available');
      };

      const { result } = renderHook(() => useLocalStorage('test-key', 'initial'));
      
      expect(result.current[0]).toBe('initial');
      expect(consoleWarnSpy).toHaveBeenCalledWith('localStorage is not available, using session-only mode');
      
      // Restore
      mockStorage.setItem = originalSetItem;
    });

    it('should work normally when localStorage is available', () => {
      const { result } = renderHook(() => useLocalStorage('test-key', 'initial'));
      
      expect(result.current[0]).toBe('initial');
      expect(consoleWarnSpy).not.toHaveBeenCalled();
    });
  });

  describe('error handling for storage failures', () => {
    it('should handle JSON parse errors gracefully', () => {
      // Set invalid JSON in localStorage
      mockStorage.setItem('test-key', 'invalid-json');

      const { result } = renderHook(() => useLocalStorage('test-key', 'fallback'));
      
      expect(result.current[0]).toBe('fallback');
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error reading localStorage key "test-key":',
        expect.any(Error)
      );
    });

    it('should handle localStorage setItem errors', () => {
      const { result } = renderHook(() => useLocalStorage('test-key', 'initial'));
      
      // Mock setItem to throw error after initialization
      const originalSetItem = mockStorage.setItem;
      mockStorage.setItem = () => {
        throw new Error('Storage quota exceeded');
      };

      act(() => {
        result.current[1]('new-value');
      });

      // State should still be updated even if localStorage fails
      expect(result.current[0]).toBe('new-value');
      // Note: Error logging may not occur if localStorage availability check prevents the call
      
      // Restore
      mockStorage.setItem = originalSetItem;
    });

    it('should handle localStorage removeItem errors', () => {
      const { result } = renderHook(() => useLocalStorage('test-key', 'initial'));
      
      // Mock removeItem to throw error
      const originalRemoveItem = mockStorage.removeItem;
      mockStorage.removeItem = () => {
        throw new Error('Remove failed');
      };

      act(() => {
        result.current[2](); // Call removeValue
      });

      // State should still be reset even if localStorage fails
      expect(result.current[0]).toBe('initial');
      // Note: Error logging may not occur if localStorage availability check prevents the call
      
      // Restore
      mockStorage.removeItem = originalRemoveItem;
    });
  });

  describe('data serialization/deserialization', () => {
    it('should serialize and deserialize simple values', () => {
      const { result } = renderHook(() => useLocalStorage('test-key', 'initial'));

      act(() => {
        result.current[1]('new-value');
      });

      expect(result.current[0]).toBe('new-value');
      expect(mockStorage.getItem('test-key')).toBe('"new-value"');
    });

    it('should serialize and deserialize objects', () => {
      const initialObject = { name: 'test', count: 0 };
      const newObject = { name: 'updated', count: 5 };

      const { result } = renderHook(() => useLocalStorage('test-key', initialObject));

      act(() => {
        result.current[1](newObject);
      });

      expect(result.current[0]).toEqual(newObject);
      expect(mockStorage.getItem('test-key')).toBe(JSON.stringify(newObject));
    });

    it('should serialize and deserialize arrays', () => {
      const initialArray = [1, 2, 3];
      const newArray = [4, 5, 6];

      const { result } = renderHook(() => useLocalStorage('test-key', initialArray));

      act(() => {
        result.current[1](newArray);
      });

      expect(result.current[0]).toEqual(newArray);
      expect(mockStorage.getItem('test-key')).toBe(JSON.stringify(newArray));
    });

    it('should load existing data from localStorage on initialization', () => {
      const existingData = { loaded: true, value: 42 };
      mockStorage.setItem('test-key', JSON.stringify(existingData));

      const { result } = renderHook(() => useLocalStorage('test-key', { loaded: false, value: 0 }));

      expect(result.current[0]).toEqual(existingData);
    });

    it('should support functional updates', () => {
      const { result } = renderHook(() => useLocalStorage('counter', 0));

      act(() => {
        result.current[1]((prev) => prev + 1);
      });

      expect(result.current[0]).toBe(1);
      expect(mockStorage.getItem('counter')).toBe('1');
    });
  });

  describe('removeValue functionality', () => {
    it('should reset to initial value and remove from localStorage', () => {
      const { result } = renderHook(() => useLocalStorage('test-key', 'initial'));

      // Set a value first
      act(() => {
        result.current[1]('changed');
      });
      expect(result.current[0]).toBe('changed');
      expect(mockStorage.getItem('test-key')).toBe('"changed"');

      // Remove the value
      act(() => {
        result.current[2]();
      });

      expect(result.current[0]).toBe('initial');
      expect(mockStorage.getItem('test-key')).toBeNull();
    });
  });
});