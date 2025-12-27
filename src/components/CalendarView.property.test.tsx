// import React from 'react'; // Not needed with new JSX transform
import { render, act } from '@testing-library/react';
import fc from 'fast-check';
import { CalendarView } from './CalendarView';
import { useWorkouts } from '../hooks/useWorkouts';
// import { Workout } from '../types'; // Not used in this test

// Mock the useWorkouts hook
jest.mock('../hooks/useWorkouts');
const mockUseWorkouts = useWorkouts as jest.MockedFunction<typeof useWorkouts>;

describe('CalendarView Property Tests', () => {
  const mockGetWorkoutsForDate = jest.fn();
  const mockGetWorkoutsForMonth = jest.fn();
  const mockAddWorkout = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseWorkouts.mockReturnValue({
      workouts: [],
      addWorkout: mockAddWorkout,
      getWorkoutsForDate: mockGetWorkoutsForDate,
      getWorkoutsForMonth: mockGetWorkoutsForMonth,
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  /**
   * Feature: workout-tracker, Property 2: Visual Date Indication
   * **Validates: Requirements 1.4**
   * 
   * For any date in the calendar, dates with registered workouts should have 
   * different visual styling than dates without workouts.
   */
  it('Property 2: Visual Date Indication - dates with workouts have different styling than dates without workouts', () => {
    fc.assert(
      fc.property(
        // Generate random workout data for testing
        fc.record({
          workoutsMap: fc.dictionary(
            // Generate date strings in YYYY-MM-DD format for current month
            fc.integer({ min: 1, max: 31 }).map(day => {
              const currentDate = new Date();
              const year = currentDate.getFullYear();
              const month = (currentDate.getMonth() + 1).toString().padStart(2, '0');
              const dayStr = day.toString().padStart(2, '0');
              return `${year}-${month}-${dayStr}`;
            }),
            // Generate arrays of workouts for each date
            fc.array(
              fc.record({
                id: fc.uuid(),
                date: fc.string(),
                workoutTypes: fc.array(fc.string({ minLength: 1 }), { minLength: 1 }),
                createdAt: fc.date().map(d => d.toISOString())
              } as const),
              { minLength: 0, maxLength: 3 }
            )
          )
        }),
        ({ workoutsMap }) => {
          // Setup mock to return workouts based on the generated data
          mockGetWorkoutsForDate.mockImplementation((date: string) => {
            return workoutsMap[date] || [];
          });

          const { container } = render(<CalendarView />);

          // Get all calendar day elements
          const calendarDays = container.querySelectorAll('[class*="calendarDay"]');
          
          // For each day in the calendar
          calendarDays.forEach((dayElement) => {
            const dayNumber = dayElement.textContent?.match(/^\d+/)?.[0];
            
            if (dayNumber) {
              const currentDate = new Date();
              const year = currentDate.getFullYear();
              const month = (currentDate.getMonth() + 1).toString().padStart(2, '0');
              const dayStr = dayNumber.padStart(2, '0');
              const dateStr = `${year}-${month}-${dayStr}`;
              
              const workoutsForDate = workoutsMap[dateStr] || [];
              const hasWorkouts = workoutsForDate.length > 0;
              
              if (hasWorkouts) {
                // Days with workouts should have different styling
                // Check for workout indicator elements or special CSS classes
                const workoutIndicators = dayElement.querySelectorAll('[class*="workoutItem"]');
                const hasWorkoutClass = dayElement.className.includes('hasWorkouts');
                
                // At least one of these should be true for days with workouts
                expect(workoutIndicators.length > 0 || hasWorkoutClass).toBe(true);
                
                // Should display workout information
                workoutsForDate.forEach(workout => {
                  const workoutText = workout.workoutTypes.join(', ');
                  if (workoutText) {
                    expect(dayElement.textContent).toContain(workoutText);
                  }
                });
              } else {
                // Days without workouts should not have workout indicators
                const workoutIndicators = dayElement.querySelectorAll('[class*="workoutItem"]');
                expect(workoutIndicators.length).toBe(0);
              }
            }
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: workout-tracker, Property 3: Calendar Navigation
   * **Validates: Requirements 1.5**
   * 
   * For any month/year navigation action, the calendar should correctly update 
   * to display the requested month and year.
   */
  it('Property 3: Calendar Navigation - navigation correctly updates displayed month and year', () => {
    fc.assert(
      fc.property(
        // Generate random navigation sequences
        fc.array(
          fc.oneof(
            fc.constant('next'),
            fc.constant('previous')
          ),
          { minLength: 1, maxLength: 24 } // Test up to 2 years of navigation
        ),
        (navigationSequence) => {
          mockGetWorkoutsForDate.mockReturnValue([]);

          const { container } = render(<CalendarView />);

          // Track expected month and year based on navigation
          const startDate = new Date();
          let expectedMonth = startDate.getMonth();
          let expectedYear = startDate.getFullYear();

          // Apply each navigation step
          navigationSequence.forEach(direction => {
            if (direction === 'next') {
              expectedMonth++;
              if (expectedMonth > 11) {
                expectedMonth = 0;
                expectedYear++;
              }
            } else { // previous
              expectedMonth--;
              if (expectedMonth < 0) {
                expectedMonth = 11;
                expectedYear--;
              }
            }

            // Perform the navigation action
            const button = direction === 'next' 
              ? container.querySelector('[aria-label="Next month"]')
              : container.querySelector('[aria-label="Previous month"]');
            
            expect(button).not.toBeNull();
            if (button) {
              act(() => {
                button.dispatchEvent(new MouseEvent('click', { bubbles: true }));
              });
            }
          });

          // Verify the final displayed month and year
          const monthNames = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
          ];
          
          const expectedMonthName = monthNames[expectedMonth];
          
          // Use a more reliable selector that doesn't depend on CSS modules
          const monthYearElement = container.querySelector('h2') || 
                                   container.querySelector('[class*="month"]') ||
                                   Array.from(container.querySelectorAll('*')).find(el => 
                                     el.textContent && el.textContent.includes(expectedMonthName)
                                   );
          
          expect(monthYearElement).not.toBeNull();
          if (monthYearElement) {
            const displayedText = monthYearElement.textContent;
            expect(displayedText).toContain(expectedMonthName);
            expect(displayedText).toContain(expectedYear.toString());
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});