import React, { useState, useCallback, memo } from 'react';
import { useWorkouts } from '../hooks/useWorkouts';
import styles from './CalendarView.module.css';

interface CalendarViewProps {
  onRegisterClick?: () => void;
}

export const CalendarView: React.FC<CalendarViewProps> = memo(({ onRegisterClick }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [error, setError] = useState<string | null>(null);
  const { getWorkoutsForDate } = useWorkouts();

  // Get current month and year
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  // Navigation functions with error handling
  const navigateToPreviousMonth = useCallback(() => {
    try {
      setError(null);
      const newDate = new Date(currentYear, currentMonth - 1, 1);
      // Validate the date is reasonable (not too far in the past)
      if (newDate.getFullYear() < 1900) {
        setError('Cannot navigate to dates before 1900');
        return;
      }
      setCurrentDate(newDate);
    } catch (err) {
      setError('Failed to navigate to previous month');
      console.error('Calendar navigation error:', err);
    }
  }, [currentYear, currentMonth]);

  const navigateToNextMonth = useCallback(() => {
    try {
      setError(null);
      const newDate = new Date(currentYear, currentMonth + 1, 1);
      // Validate the date is reasonable (not too far in the future)
      if (newDate.getFullYear() > 2100) {
        setError('Cannot navigate to dates after 2100');
        return;
      }
      setCurrentDate(newDate);
    } catch (err) {
      setError('Failed to navigate to next month');
      console.error('Calendar navigation error:', err);
    }
  }, [currentYear, currentMonth]);

  // Calendar grid generation with error handling
  const generateCalendarDays = () => {
    try {
      const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
      const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
      const firstDayWeekday = firstDayOfMonth.getDay(); // 0 = Sunday
      const daysInMonth = lastDayOfMonth.getDate();

      // Validate date calculations
      if (isNaN(firstDayOfMonth.getTime()) || isNaN(lastDayOfMonth.getTime())) {
        throw new Error('Invalid date calculation');
      }

      if (daysInMonth < 1 || daysInMonth > 31) {
        throw new Error('Invalid days in month');
      }

      const days = [];

      // Add empty cells for days before the first day of the month
      for (let i = 0; i < firstDayWeekday; i++) {
        days.push(null);
      }

      // Add all days of the month
      for (let day = 1; day <= daysInMonth; day++) {
        days.push(day);
      }

      return days;
    } catch (err) {
      console.error('Calendar generation error:', err);
      setError('Failed to generate calendar');
      return [];
    }
  };

  const calendarDays = generateCalendarDays();
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Helper function to format date as YYYY-MM-DD
  const formatDate = (day: number) => {
    const month = (currentMonth + 1).toString().padStart(2, '0');
    const dayStr = day.toString().padStart(2, '0');
    return `${currentYear}-${month}-${dayStr}`;
  };

  // Check if a date has workouts with error handling
  const hasWorkouts = (day: number) => {
    try {
      const dateStr = formatDate(day);
      return getWorkoutsForDate(dateStr).length > 0;
    } catch (err) {
      console.error('Error checking workouts for date:', err);
      return false;
    }
  };

  // Get workouts for display with error handling
  const getWorkoutsForDisplay = (day: number) => {
    try {
      const dateStr = formatDate(day);
      return getWorkoutsForDate(dateStr);
    } catch (err) {
      console.error('Error getting workouts for display:', err);
      return [];
    }
  };

  return (
    <div className={styles.calendarView}>
      <header className={styles.header}>
        <h1>Workout Tracker</h1>
        <button 
          className={styles.registerButton}
          onClick={onRegisterClick}
          type="button"
        >
          Register Workout
        </button>
      </header>

      {error && (
        <div className={styles.errorMessage} role="alert">
          {error}
          <button 
            onClick={() => setError(null)}
            className={styles.dismissError}
            type="button"
            aria-label="Dismiss error"
          >
            ×
          </button>
        </div>
      )}

      <div className={styles.calendarContainer}>
        <div className={styles.calendarHeader}>
          <button 
            className={styles.navButton}
            onClick={navigateToPreviousMonth}
            type="button"
            aria-label="Previous month"
          >
            &#8249;
          </button>
          
          <h2 className={styles.monthYear}>
            {monthNames[currentMonth]} {currentYear}
          </h2>
          
          <button 
            className={styles.navButton}
            onClick={navigateToNextMonth}
            type="button"
            aria-label="Next month"
          >
            &#8250;
          </button>
        </div>

        <div className={styles.calendarGrid}>
          {/* Day headers */}
          {dayNames.map(dayName => (
            <div key={dayName} className={styles.dayHeader}>
              {dayName}
            </div>
          ))}
          
          {/* Calendar days */}
          {calendarDays.map((day, index) => (
            <div 
              key={index} 
              className={`${styles.calendarDay} ${
                day ? styles.validDay : styles.emptyDay
              } ${
                day && hasWorkouts(day) ? styles.hasWorkouts : ''
              }`}
            >
              {day && (
                <>
                  <span className={styles.dayNumber}>{day}</span>
                  {hasWorkouts(day) && (
                    <div className={styles.workoutIndicator}>
                      {getWorkoutsForDisplay(day).map(workout => (
                        <div key={workout.id} className={styles.workoutItem}>
                          {workout.workoutTypes.join(', ')}
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});