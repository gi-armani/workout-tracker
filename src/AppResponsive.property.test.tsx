import { render } from '@testing-library/react';
import fc from 'fast-check';
import App from './App';

// Mock the hooks to avoid localStorage dependencies
jest.mock('./hooks/useWorkouts', () => ({
  useWorkouts: () => ({
    workouts: [],
    addWorkout: jest.fn(),
    getWorkoutsForDate: jest.fn(() => []),
    getWorkoutsForMonth: jest.fn(() => []),
  })
}));

jest.mock('./hooks/useWorkoutTypes', () => ({
  useWorkoutTypes: () => ({
    workoutTypes: [],
    addWorkoutType: jest.fn(),
    getWorkoutTypes: jest.fn(() => []),
    workoutTypeExists: jest.fn(() => false),
  })
}));

describe('App Responsive Property Tests', () => {
  /**
   * Feature: workout-tracker, Property 12: Responsive Layout Adaptation
   * **Validates: Requirements 5.2**
   * 
   * For any screen size or device orientation, the application layout should adapt 
   * appropriately while maintaining functionality.
   */
  test('Property 12: Responsive Layout Adaptation - layout maintains core functionality across different screen sizes', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 320, max: 1920 }),
        (width) => {
          // Set up the viewport dimensions
          Object.defineProperty(window, 'innerWidth', {
            writable: true,
            configurable: true,
            value: width,
          });

          const { container } = render(<App />);

          // Verify core layout elements are present regardless of screen size
          const appElement = container.querySelector('.app');
          expect(appElement).not.toBeNull();

          const navElement = container.querySelector('.app-nav') || 
                            container.querySelector('nav');
          expect(navElement).not.toBeNull();

          const mainElement = container.querySelector('.app-main') || 
                             container.querySelector('main');
          expect(mainElement).not.toBeNull();

          // Verify navigation buttons are present
          const navButtons = container.querySelectorAll('button');
          const calendarButton = Array.from(navButtons).find(btn => 
            btn.textContent?.includes('Calendar')
          );
          const registerButton = Array.from(navButtons).find(btn => 
            btn.textContent?.includes('Register')
          );
          
          expect(calendarButton).not.toBeNull();
          expect(registerButton).not.toBeNull();

          // Verify buttons are functional
          navButtons.forEach(button => {
            expect(button.disabled).toBe(false);
            expect(button.textContent).toBeTruthy();
          });

          // Verify accessibility features are maintained
          const navElement2 = container.querySelector('[role="navigation"]');
          expect(navElement2).not.toBeNull();

          // Verify responsive adaptation by checking that layout elements exist
          // regardless of screen size - this validates that the responsive CSS
          // doesn't break the fundamental layout structure
          if (width <= 480) {
            // Mobile: Core elements should still be present
            expect(navElement).toBeInTheDocument();
            expect(calendarButton).toBeInTheDocument();
            expect(registerButton).toBeInTheDocument();
          } else if (width <= 768) {
            // Tablet: Core elements should still be present
            expect(navElement).toBeInTheDocument();
            expect(calendarButton).toBeInTheDocument();
            expect(registerButton).toBeInTheDocument();
          } else {
            // Desktop: Core elements should still be present
            expect(navElement).toBeInTheDocument();
            expect(calendarButton).toBeInTheDocument();
            expect(registerButton).toBeInTheDocument();
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});