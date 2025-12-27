import React, { useState, useCallback, memo } from 'react';
import { useWorkouts } from '../hooks/useWorkouts';
import { useWorkoutTypes } from '../hooks/useWorkoutTypes';
import styles from './RegistrationForm.module.css';

interface RegistrationFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

interface FormData {
  date: string;
  workoutTypes: string[];
  newWorkoutType: string;
}

interface FormErrors {
  date?: string;
  workoutTypes?: string;
  newWorkoutType?: string;
  general?: string;
}

export const RegistrationForm = memo<RegistrationFormProps>(({ onSuccess, onCancel }) => {
  // Get current date in YYYY-MM-DD format for pre-filling
  const getCurrentDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const [formData, setFormData] = useState<FormData>({
    date: getCurrentDate(),
    workoutTypes: [],
    newWorkoutType: ''
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAddType, setShowAddType] = useState(false);

  const { addWorkout } = useWorkouts();
  const { addWorkoutType, getWorkoutTypes } = useWorkoutTypes();

  // Get available workout types
  const availableTypes = getWorkoutTypes();

  // Handle date input change
  const handleDateChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, date: e.target.value }));
    // Clear date error when user starts typing
    if (errors.date) {
      setErrors(prev => ({ ...prev, date: undefined }));
    }
  }, [errors.date]);

  // Handle workout type selection (checkbox)
  const handleWorkoutTypeChange = useCallback((typeName: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      workoutTypes: checked
        ? [...prev.workoutTypes, typeName]
        : prev.workoutTypes.filter(type => type !== typeName)
    }));
    // Clear workout types error when user makes selection
    if (errors.workoutTypes) {
      setErrors(prev => ({ ...prev, workoutTypes: undefined }));
    }
  }, [errors.workoutTypes]);

  // Handle new workout type input
  const handleNewWorkoutTypeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, newWorkoutType: e.target.value }));
    // Clear new workout type error when user starts typing
    if (errors.newWorkoutType) {
      setErrors(prev => ({ ...prev, newWorkoutType: undefined }));
    }
  }, [errors.newWorkoutType]);

  // Add new workout type
  const handleAddWorkoutType = useCallback(async () => {
    const typeName = formData.newWorkoutType.trim();
    
    if (!typeName) {
      setErrors(prev => ({ ...prev, newWorkoutType: 'Workout type name is required' }));
      return;
    }

    try {
      const newType = addWorkoutType(typeName);
      // Automatically select the newly added type
      setFormData(prev => ({
        ...prev,
        workoutTypes: [...prev.workoutTypes, newType.name],
        newWorkoutType: ''
      }));
      setShowAddType(false);
      setErrors(prev => ({ ...prev, newWorkoutType: undefined }));
    } catch (error) {
      setErrors(prev => ({ 
        ...prev, 
        newWorkoutType: error instanceof Error ? error.message : 'Failed to add workout type' 
      }));
    }
  }, [formData.newWorkoutType, addWorkoutType]);

  // Validate form data
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Validate date
    if (!formData.date) {
      newErrors.date = 'Date is required';
    } else {
      // Validate date format
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(formData.date)) {
        newErrors.date = 'Invalid date format';
      }
    }

    // Validate workout types selection
    if (formData.workoutTypes.length === 0) {
      newErrors.workoutTypes = 'Please select at least one workout type';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      await addWorkout({
        date: formData.date,
        workoutTypes: formData.workoutTypes
      });

      // Success - call onSuccess callback
      onSuccess?.();
    } catch (error) {
      setErrors({
        general: error instanceof Error ? error.message : 'Failed to save workout'
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, addWorkout, onSuccess]);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Register Workout</h1>
        {onCancel && (
          <button 
            type="button" 
            onClick={onCancel}
            className={styles.cancelButton}
            aria-label="Cancel registration"
          >
            ×
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        {/* Date Input */}
        <div className={styles.field}>
          <label htmlFor="workout-date" className={styles.label}>
            Workout Date
          </label>
          <input
            id="workout-date"
            type="date"
            value={formData.date}
            onChange={handleDateChange}
            className={`${styles.input} ${errors.date ? styles.inputError : ''}`}
            required
          />
          {errors.date && (
            <span className={styles.error} role="alert">
              {errors.date}
            </span>
          )}
        </div>

        {/* Workout Types Selection */}
        <div className={styles.field}>
          <label className={styles.label}>
            Workout Types
          </label>
          
          {availableTypes.length > 0 ? (
            <div className={styles.checkboxGroup}>
              {availableTypes.map(type => (
                <label key={type.id} className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={formData.workoutTypes.includes(type.name)}
                    onChange={(e) => handleWorkoutTypeChange(type.name, e.target.checked)}
                    className={styles.checkbox}
                  />
                  <span className={styles.checkboxText}>{type.name}</span>
                </label>
              ))}
            </div>
          ) : (
            <p className={styles.noTypes}>
              No workout types available. Add your first workout type below.
            </p>
          )}

          {errors.workoutTypes && (
            <span className={styles.error} role="alert">
              {errors.workoutTypes}
            </span>
          )}
        </div>

        {/* Add New Workout Type */}
        <div className={styles.field}>
          {!showAddType ? (
            <button
              type="button"
              onClick={() => setShowAddType(true)}
              className={styles.addTypeButton}
            >
              + Add New Workout Type
            </button>
          ) : (
            <div className={styles.addTypeForm}>
              <label htmlFor="new-workout-type" className={styles.label}>
                New Workout Type
              </label>
              <div className={styles.addTypeInputGroup}>
                <input
                  id="new-workout-type"
                  type="text"
                  value={formData.newWorkoutType}
                  onChange={handleNewWorkoutTypeChange}
                  placeholder="e.g., Running, Weight Training"
                  className={`${styles.input} ${errors.newWorkoutType ? styles.inputError : ''}`}
                />
                <button
                  type="button"
                  onClick={handleAddWorkoutType}
                  className={styles.addButton}
                >
                  Add
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddType(false);
                    setFormData(prev => ({ ...prev, newWorkoutType: '' }));
                    setErrors(prev => ({ ...prev, newWorkoutType: undefined }));
                  }}
                  className={styles.cancelAddButton}
                >
                  Cancel
                </button>
              </div>
              {errors.newWorkoutType && (
                <span className={styles.error} role="alert">
                  {errors.newWorkoutType}
                </span>
              )}
            </div>
          )}
        </div>

        {/* General Error */}
        {errors.general && (
          <div className={styles.generalError} role="alert">
            {errors.general}
          </div>
        )}

        {/* Submit Button */}
        <div className={styles.actions}>
          <button
            type="submit"
            disabled={isSubmitting}
            className={styles.submitButton}
          >
            {isSubmitting ? 'Saving...' : 'Save Workout'}
          </button>
        </div>
      </form>
    </div>
  );
});