// import React from 'react'; // Not needed with new JSX transform
import { render, screen, fireEvent } from '@testing-library/react';
import App from './App';

describe('App', () => {
  describe('View Navigation Functionality', () => {
    test('should start with calendar view by default', () => {
      render(<App />);
      
      // Should show calendar navigation button as active
      const calendarButton = screen.getByRole('button', { name: /calendar/i });
      expect(calendarButton).toHaveClass('active');
      
      // Should show registration button as inactive (specifically the nav button)
      const navButtons = screen.getAllByRole('button', { name: /register workout/i });
      const navRegistrationButton = navButtons.find(button => button.classList.contains('nav-button'));
      expect(navRegistrationButton).not.toHaveClass('active');
    });

    test('should navigate to registration view when registration button is clicked', () => {
      render(<App />);
      
      const navButtons = screen.getAllByRole('button', { name: /register workout/i });
      const navRegistrationButton = navButtons.find(button => button.classList.contains('nav-button'));
      fireEvent.click(navRegistrationButton!);
      
      // Registration button should now be active
      expect(navRegistrationButton).toHaveClass('active');
      
      // Calendar button should no longer be active
      const calendarButton = screen.getByRole('button', { name: /calendar/i });
      expect(calendarButton).not.toHaveClass('active');
    });

    test('should navigate back to calendar view when calendar button is clicked', () => {
      render(<App />);
      
      // First navigate to registration
      const navButtons = screen.getAllByRole('button', { name: /register workout/i });
      const navRegistrationButton = navButtons.find(button => button.classList.contains('nav-button'));
      fireEvent.click(navRegistrationButton!);
      
      // Then navigate back to calendar
      const calendarButton = screen.getByRole('button', { name: /calendar/i });
      fireEvent.click(calendarButton);
      
      // Calendar button should be active again
      expect(calendarButton).toHaveClass('active');
      expect(navRegistrationButton).not.toHaveClass('active');
    });

    test('should allow users to return to calendar from registration page', () => {
      render(<App />);
      
      // Navigate to registration
      const navButtons = screen.getAllByRole('button', { name: /register workout/i });
      const navRegistrationButton = navButtons.find(button => button.classList.contains('nav-button'));
      fireEvent.click(navRegistrationButton!);
      
      // Verify we can navigate back to calendar
      const calendarButton = screen.getByRole('button', { name: /calendar/i });
      expect(calendarButton).toBeInTheDocument();
      
      fireEvent.click(calendarButton);
      expect(calendarButton).toHaveClass('active');
    });
  });

  describe('Consistent Navigation Elements', () => {
    test('should display navigation buttons in both calendar and registration views', () => {
      render(<App />);
      
      // Check navigation elements are present in calendar view
      expect(screen.getByRole('button', { name: /calendar/i })).toBeInTheDocument();
      
      const navButtons = screen.getAllByRole('button', { name: /register workout/i });
      const navRegistrationButton = navButtons.find(button => button.classList.contains('nav-button'));
      expect(navRegistrationButton).toBeInTheDocument();
      
      // Navigate to registration view
      fireEvent.click(navRegistrationButton!);
      
      // Check navigation elements are still present in registration view
      expect(screen.getByRole('button', { name: /calendar/i })).toBeInTheDocument();
      
      const navButtonsAfterNavigation = screen.getAllByRole('button', { name: /register workout/i });
      const navRegistrationButtonAfterNavigation = navButtonsAfterNavigation.find(button => button.classList.contains('nav-button'));
      expect(navRegistrationButtonAfterNavigation).toBeInTheDocument();
    });

    test('should maintain consistent navigation structure across views', () => {
      render(<App />);
      
      // Check navigation structure in calendar view
      const nav = screen.getByRole('navigation');
      expect(nav).toBeInTheDocument();
      
      const calendarButton = screen.getByRole('button', { name: /calendar/i });
      const navButtons = screen.getAllByRole('button', { name: /register workout/i });
      const navRegistrationButton = navButtons.find(button => button.classList.contains('nav-button'));
      
      expect(nav).toContainElement(calendarButton);
      expect(nav).toContainElement(navRegistrationButton!);
      
      // Navigate to registration view
      fireEvent.click(navRegistrationButton!);
      
      // Check navigation structure is maintained
      const navAfterNavigation = screen.getByRole('navigation');
      expect(navAfterNavigation).toBeInTheDocument();
      expect(navAfterNavigation).toContainElement(screen.getByRole('button', { name: /calendar/i }));
      
      const navButtonsAfterNavigation = screen.getAllByRole('button', { name: /register workout/i });
      const navRegistrationButtonAfterNavigation = navButtonsAfterNavigation.find(button => button.classList.contains('nav-button'));
      expect(navAfterNavigation).toContainElement(navRegistrationButtonAfterNavigation!);
    });

    test('should provide visual feedback for current page through active state', () => {
      render(<App />);
      
      // Calendar should be active initially
      const calendarButton = screen.getByRole('button', { name: /calendar/i });
      const navButtons = screen.getAllByRole('button', { name: /register workout/i });
      const navRegistrationButton = navButtons.find(button => button.classList.contains('nav-button'));
      
      expect(calendarButton).toHaveClass('active');
      expect(navRegistrationButton).not.toHaveClass('active');
      
      // Switch to registration
      fireEvent.click(navRegistrationButton!);
      
      expect(navRegistrationButton).toHaveClass('active');
      expect(calendarButton).not.toHaveClass('active');
      
      // Switch back to calendar
      fireEvent.click(calendarButton);
      
      expect(calendarButton).toHaveClass('active');
      expect(navRegistrationButton).not.toHaveClass('active');
    });
  });
});