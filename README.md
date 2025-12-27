# Workout Tracker

A React-based workout tracking application that allows users to register and view their daily workouts through a calendar interface.

## Features

- Calendar view for visualizing workouts by date
- Registration form for adding new workouts
- Local storage for offline data persistence
- Responsive design for mobile and desktop
- TypeScript for type safety

## Development

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Setup

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Run tests:
```bash
npm test
```

### Project Structure

```
src/
├── components/     # React components
├── hooks/         # Custom React hooks
├── utils/         # Utility functions
├── App.tsx        # Main application component
└── main.tsx       # Application entry point
```

## Testing

The project uses Jest and React Testing Library for unit tests, and fast-check for property-based testing.

- Run tests: `npm test`
- Run tests in watch mode: `npm run test:watch`

## Build

```bash
npm run build
```

The built application will be in the `dist` directory.