// import React from 'react'; // Not needed with new JSX transform
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';

// Mock crypto.randomUUID for testing environment
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: () => 'test-uuid-' + Math.random().toString(36).substr(2, 9)
  }
});

// Mock localStorage for testing
const mockLocalStorage = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

describe('Workout Tracker Integration Tests', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    mockLocalStorage.clear();
  });

  describe('Basic App Functionality', () => {
    test('should render app and navigate between views', async () => {
      const user = userEvent.setup();
      render(<App />);

      // Verify we start on calendar view
      expect(screen.getByText('Workout Tracker')).toBeInTheDocument();
      
      // Navigate to registration using nav button
      const navButtons = screen.getAllByText('Register Workout');
      await user.click(navButtons[1]); // Nav button

      // Verify we're on registration form
      expect(screen.getByRole('heading', { name: 'Register Workout' })).toBeInTheDocument();
      expect(screen.getByLabelText(/workout date/i)).toBeInTheDocument();

      // Navigate back to calendar
      await user.click(screen.getByText('Calendar'));
      
      // Verify we're back on calendar
      expect(screen.getByText('Workout Tracker')).toBeInTheDocument();
    });

    test('should handle basic workout registration workflow', async () => {
      const user = userEvent.setup();
      render(<App />);

      // Navigate to registration
      const navButtons = screen.getAllByText('Register Workout');
      await user.click(navButtons[1]);

      // Add a workout type by clicking the add button first
      await user.click(screen.getByText('+ Add New Workout Type'));
      
      // Type in the input field
      const input = screen.getByLabelText(/new workout type/i);
      await user.type(input, 'Running');
      
      // Click Add button
      await user.click(screen.getByText('Add'));

      // Verify the workout type was added and is selected
      await waitFor(() => {
        expect(screen.getByText('Running')).toBeInTheDocument();
      });

      // Submit the form
      await user.click(screen.getByText('Save Workout'));

      // Should navigate back to calendar
      await waitFor(() => {
        expect(screen.getByText('Workout Tracker')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    test('should handle form validation errors', async () => {
      const user = userEvent.setup();
      render(<App />);

      // Navigate to registration
      const navButtons = screen.getAllByText('Register Workout');
      await user.click(navButtons[1]);

      // Try to submit without selecting workout types
      await user.click(screen.getByText('Save Workout'));

      // Should show validation error
      await waitFor(() => {
        expect(screen.getByText(/please select at least one workout type/i)).toBeInTheDocument();
      });

      // Should still be on registration form
      expect(screen.getByRole('heading', { name: 'Register Workout' })).toBeInTheDocument();
    });

    test('should handle localStorage unavailable gracefully', async () => {
      // Mock localStorage to throw errors
      const originalLocalStorage = window.localStorage;
      Object.defineProperty(window, 'localStorage', {
        value: {
          getItem: () => { throw new Error('localStorage unavailable'); },
          setItem: () => { throw new Error('localStorage unavailable'); },
          removeItem: () => { throw new Error('localStorage unavailable'); },
        },
        configurable: true,
      });

      const user = userEvent.setup();
      render(<App />);

      // App should still render
      expect(screen.getByText('Workout Tracker')).toBeInTheDocument();

      // Try to navigate to registration
      const navButtons = screen.getAllByText('Register Workout');
      await user.click(navButtons[1]);
      
      // Form should still work
      expect(screen.getByRole('heading', { name: 'Register Workout' })).toBeInTheDocument();

      // Restore original localStorage
      Object.defineProperty(window, 'localStorage', {
        value: originalLocalStorage,
        configurable: true,
      });
    });
  });

  describe('Calendar Navigation', () => {
    test('should navigate between months', async () => {
      const user = userEvent.setup();
      render(<App />);

      const currentMonth = new Date().toLocaleString('default', { month: 'long' });
      const currentYear = new Date().getFullYear();

      // Verify current month is displayed
      expect(screen.getByText(`${currentMonth} ${currentYear}`)).toBeInTheDocument();

      // Navigate to next month
      await user.click(screen.getByRole('button', { name: /next month/i }));

      // Verify month changed
      const nextMonth = new Date(currentYear, new Date().getMonth() + 1);
      const nextMonthName = nextMonth.toLocaleString('default', { month: 'long' });
      const nextYear = nextMonth.getFullYear();
      
      await waitFor(() => {
        expect(screen.getByText(`${nextMonthName} ${nextYear}`)).toBeInTheDocument();
      });

      // Navigate back to current month
      await user.click(screen.getByRole('button', { name: /previous month/i }));

      // Verify we're back to current month
      await waitFor(() => {
        expect(screen.getByText(`${currentMonth} ${currentYear}`)).toBeInTheDocument();
      });
    });
  });
});