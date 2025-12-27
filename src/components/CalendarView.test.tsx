// import React from 'react'; // Not needed with new JSX transform
import { render, screen, fireEvent } from '@testing-library/react';
import { CalendarView } from './CalendarView';
import { useWorkouts } from '../hooks/useWorkouts';

// Mock the useWorkouts hook
jest.mock('../hooks/useWorkouts');
const mockUseWorkouts = useWorkouts as jest.MockedFunction<typeof useWorkouts>;

describe('CalendarView', () => {
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
    
    // Default to no workouts
    mockGetWorkoutsForDate.mockReturnValue([]);
    mockGetWorkoutsForMonth.mockReturnValue([]);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Calendar Rendering', () => {
    it('renders calendar with current month and year', () => {
      render(<CalendarView />);
      
      // Should display the current month and year
      const currentDate = new Date();
      const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];
      const expectedMonth = monthNames[currentDate.getMonth()];
      const expectedYear = currentDate.getFullYear().toString();
      
      expect(screen.getByText(new RegExp(`${expectedMonth}.*${expectedYear}`))).toBeInTheDocument();
    });

    it('renders all day headers', () => {
      render(<CalendarView />);
      
      const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      dayHeaders.forEach(day => {
        expect(screen.getByText(day)).toBeInTheDocument();
      });
    });

    it('renders register workout button', () => {
      render(<CalendarView />);
      
      expect(screen.getByRole('button', { name: /register workout/i })).toBeInTheDocument();
    });

    it('renders navigation buttons', () => {
      render(<CalendarView />);
      
      expect(screen.getByRole('button', { name: /previous month/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /next month/i })).toBeInTheDocument();
    });
  });

  describe('Calendar Navigation', () => {
    it('navigates to previous month when previous button is clicked', () => {
      render(<CalendarView />);
      
      const currentDate = new Date();
      const prevButton = screen.getByRole('button', { name: /previous month/i });
      
      fireEvent.click(prevButton);
      
      // Calculate expected previous month
      const prevMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
      const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];
      const expectedMonth = monthNames[prevMonth.getMonth()];
      const expectedYear = prevMonth.getFullYear().toString();
      
      expect(screen.getByText(new RegExp(`${expectedMonth}.*${expectedYear}`))).toBeInTheDocument();
    });

    it('navigates to next month when next button is clicked', () => {
      render(<CalendarView />);
      
      const currentDate = new Date();
      const nextButton = screen.getByRole('button', { name: /next month/i });
      
      fireEvent.click(nextButton);
      
      // Calculate expected next month
      const nextMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
      const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];
      const expectedMonth = monthNames[nextMonth.getMonth()];
      const expectedYear = nextMonth.getFullYear().toString();
      
      expect(screen.getByText(new RegExp(`${expectedMonth}.*${expectedYear}`))).toBeInTheDocument();
    });

    it('calls getWorkoutsForDate when checking for workouts after navigation', () => {
      render(<CalendarView />);
      
      // Clear previous calls from initial render
      mockGetWorkoutsForDate.mockClear();
      
      const nextButton = screen.getByRole('button', { name: /next month/i });
      fireEvent.click(nextButton);
      
      // The component should call getWorkoutsForDate for each day when rendering
      expect(mockGetWorkoutsForDate).toHaveBeenCalled();
    });
  });

  describe('Register Button Interaction', () => {
    it('calls onRegisterClick when register button is clicked', () => {
      const mockOnRegisterClick = jest.fn();
      render(<CalendarView onRegisterClick={mockOnRegisterClick} />);
      
      const registerButton = screen.getByRole('button', { name: /register workout/i });
      fireEvent.click(registerButton);
      
      expect(mockOnRegisterClick).toHaveBeenCalledTimes(1);
    });

    it('does not crash when onRegisterClick is not provided', () => {
      render(<CalendarView />);
      
      const registerButton = screen.getByRole('button', { name: /register workout/i });
      
      expect(() => fireEvent.click(registerButton)).not.toThrow();
    });
  });

  describe('Responsive Layout', () => {
    it('renders main calendar structure', () => {
      const { container } = render(<CalendarView />);
      
      // Check that the main container exists
      expect(container.firstChild).toBeInTheDocument();
      
      // Check that essential elements are present
      expect(screen.getByText(/workout tracker/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /register workout/i })).toBeInTheDocument();
    });

    it('renders calendar grid with proper structure', () => {
      render(<CalendarView />);
      
      // Should have day headers
      const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      dayHeaders.forEach(day => {
        expect(screen.getByText(day)).toBeInTheDocument();
      });
      
      // Should have navigation elements
      expect(screen.getByRole('button', { name: /previous month/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /next month/i })).toBeInTheDocument();
    });
  });

  describe('Workout Display Integration', () => {
    it('displays workouts on appropriate dates', () => {
      const mockWorkouts = [
        {
          id: '1',
          date: '2025-01-15',
          workoutTypes: ['Running', 'Strength'],
          createdAt: '2025-01-15T10:00:00Z'
        }
      ];

      mockGetWorkoutsForDate.mockImplementation((date) => {
        return date === '2025-01-15' ? mockWorkouts : [];
      });

      // Set current date to January 2025 to ensure the workout date is visible
      jest.spyOn(Date.prototype, 'getMonth').mockReturnValue(0); // January
      jest.spyOn(Date.prototype, 'getFullYear').mockReturnValue(2025);

      render(<CalendarView />);

      // Should display the workout types
      expect(screen.getByText('Running, Strength')).toBeInTheDocument();
    });

    it('handles multiple workouts per date', () => {
      const mockWorkouts = [
        {
          id: '1',
          date: '2025-01-15',
          workoutTypes: ['Running'],
          createdAt: '2025-01-15T10:00:00Z'
        },
        {
          id: '2',
          date: '2025-01-15',
          workoutTypes: ['Yoga'],
          createdAt: '2025-01-15T14:00:00Z'
        }
      ];

      mockGetWorkoutsForDate.mockImplementation((date) => {
        return date === '2025-01-15' ? mockWorkouts : [];
      });

      // Set current date to January 2025
      jest.spyOn(Date.prototype, 'getMonth').mockReturnValue(0);
      jest.spyOn(Date.prototype, 'getFullYear').mockReturnValue(2025);

      render(<CalendarView />);

      // Should display both workouts
      expect(screen.getByText('Running')).toBeInTheDocument();
      expect(screen.getByText('Yoga')).toBeInTheDocument();
    });

    it('shows no workouts when date has no workouts', () => {
      mockGetWorkoutsForDate.mockReturnValue([]);

      render(<CalendarView />);

      // Should not display any workout indicators
      expect(screen.queryByText('Running')).not.toBeInTheDocument();
      expect(screen.queryByText('Yoga')).not.toBeInTheDocument();
    });
  });
});