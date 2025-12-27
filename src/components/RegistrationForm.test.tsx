// import React from 'react'; // Not needed with new JSX transform
import { render, screen } from '@testing-library/react';
import { RegistrationForm } from './RegistrationForm';

describe('RegistrationForm', () => {
  describe('Component Rendering', () => {
    it('renders registration form with basic elements', () => {
      render(<RegistrationForm />);
      
      // Should display the form title
      expect(screen.getByText('Register Workout')).toBeInTheDocument();
      
      // Should display date input with current date pre-filled
      const dateInput = screen.getByLabelText('Workout Date');
      expect(dateInput).toBeInTheDocument();
      expect(dateInput).toHaveAttribute('type', 'date');
      
      // Should display workout types section
      expect(screen.getByText('Workout Types')).toBeInTheDocument();
      
      // Should display add new workout type button
      expect(screen.getByText('+ Add New Workout Type')).toBeInTheDocument();
      
      // Should display submit button
      expect(screen.getByText('Save Workout')).toBeInTheDocument();
    });

    it('pre-fills date input with current date', () => {
      render(<RegistrationForm />);
      
      const dateInput = screen.getByLabelText('Workout Date') as HTMLInputElement;
      const today = new Date().toISOString().split('T')[0];
      
      expect(dateInput.value).toBe(today);
    });
  });
});