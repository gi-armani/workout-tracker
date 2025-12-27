import { useState, useCallback } from 'react'
import { CalendarView } from './components/CalendarView'
import { RegistrationForm } from './components/RegistrationForm'
import { ErrorBoundary } from './components/ErrorBoundary'
import './App.css'

type View = 'calendar' | 'registration'

function App() {
  const [currentView, setCurrentView] = useState<View>('calendar')

  const navigateToRegistration = useCallback(() => {
    setCurrentView('registration')
  }, [])

  const navigateToCalendar = useCallback(() => {
    setCurrentView('calendar')
  }, [])

  return (
    <ErrorBoundary>
      <div className="app">
        <nav className="app-nav" role="navigation">
          <button 
            className={`nav-button ${currentView === 'calendar' ? 'active' : ''}`}
            onClick={navigateToCalendar}
            type="button"
          >
            Calendar
          </button>
          <button 
            className={`nav-button ${currentView === 'registration' ? 'active' : ''}`}
            onClick={navigateToRegistration}
            type="button"
          >
            Register Workout
          </button>
        </nav>

        <main className="app-main">
          <ErrorBoundary>
            {currentView === 'calendar' && (
              <CalendarView onRegisterClick={navigateToRegistration} />
            )}
          </ErrorBoundary>
          <ErrorBoundary>
            {currentView === 'registration' && (
              <RegistrationForm 
                onSuccess={navigateToCalendar}
                onCancel={navigateToCalendar}
              />
            )}
          </ErrorBoundary>
        </main>
      </div>
    </ErrorBoundary>
  )
}

export default App