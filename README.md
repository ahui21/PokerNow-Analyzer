# Poker Analyzer Web

A web application for analyzing poker session logs.

## Setup Instructions

### Backend Setup

1. Create a Python virtual environment: 

bash
cd backend
python -m venv venv
source venv/bin/activate # On Windows: venv\Scripts\activate

2. Install dependencies:

bash
pip install -r requirements.txt

3. Run tests:

bash
pytest

4. Start the backend server:

bash
python app.py

### Frontend Setup

1. Install dependencies:

bash
cd frontend
npm install

2. Run tests:

bash
npm test

3. Start the development server:

bash
npm start

## Project Structure

poker-analyzer-web/
├── backend/
│ ├── src/
│ │ ├── models.py
│ │ └── poker_analyzer.py
│ ├── tests/
│ │ ├── test_models.py
│ │ └── test_poker_analyzer.py
│ └── app.py
└── frontend/
├── src/
│ ├── components/
│ │ ├── FileUpload.js
│ │ ├── HandHistory.js
│ │ ├── PlayerHistory.js
│ │ ├── PositionStats.js
│ │ └── StatsDisplay.js
│ ├── App.js
│ └── index.js
└── package.json

## Running Tests

### Backend Tests

bash
cd backend
pytest -v

### Frontend Tests

bash
cd frontend
npm test

## Development

1. Make sure both backend and frontend servers are running
2. Backend runs on http://localhost:5001
3. Frontend runs on http://localhost:3000
4. Visit http://localhost:3000 in your browser

## Contributing

1. Create a new branch for your feature
2. Write tests for new functionality
3. Ensure all tests pass
4. Submit a pull request

## Sessions Manager Reference

## Core Functionality

### 1. Session Display
- Sessions displayed as expandable list items
- Each session shows:
  - Display name
  - File ID
  - Upload date
  - Tags (as chips)
  - Visibility status
- Hover to expand and show:
  - Game types with percentages
  - Table sizes with percentages (supports 2-10 handed tables)
  - Player list

### 2. Selection System
- Checkbox-based multi-select
- Select all checkbox for visible/filtered sessions
- Entire session row is clickable for selection
- Selected sessions count displayed at top
- Bulk actions available when sessions selected:
  - Tag multiple sessions
  - Toggle visibility for multiple sessions
  - Delete multiple sessions

### 3. Tagging System
- Individual or bulk tagging support
- Color-coded tag chips with hover effects
- Quick tag removal via chip delete button
- Tag dialog shows:
  - Existing tags for quick application
  - New tag creation option
- Tags persist across sessions

### 4. Visibility Control
- Toggle visibility icon for each session
- Invisible sessions shown at 50% opacity
- Gray background for invisible sessions
- Maintains invisible state in database

### 5. Session Management
- Delete functionality (individual and bulk)
- Filter sessions by:
  - Game type
  - Table size
  - Tags
  - Players (alphabetically sorted)
  - Visibility status

### 6. UI/UX Improvements
- Dark/Light mode support
  - Theme toggle in app bar
  - Consistent styling across modes
  - Proper contrast ratios
  - Theme-aware colors
- Glassmorphism effects:
  - Subtle transparency
  - Backdrop blur
  - Border highlights
- Animations and Transitions:
  - Smooth hover animations (300ms)
  - Expand/collapse transitions
  - Selection state changes
  - Hover effects on interactive elements
- Visual Feedback:
  - Clear hover states
  - Selection indicators
  - Active/inactive states
  - Loading states
  - Error handling with alerts
- Layout:
  - Responsive design
  - Proper spacing
  - Visual hierarchy
  - Consistent padding
- Microinteractions:
  - Button hover effects
  - Tag hover animations
  - Ripple effects
  - Checkbox animations

### 7. Data Structure

javascript
Session {
id: number,
display_name: string,
file_id: string,
start_time: string,
upload_date: string,
is_active: boolean,
tags: string[],
game_stats: {
game_types: {
[type: string]: {
percentage: number
}
},
table_sizes: { // Supports 2-10 handed tables
[size: string]: {
percentage: number
}
}
},
players: string[]
}

### 8. Theme Configuration

javascript
theme = {
palette: {
mode: 'dark' | 'light',
primary: {
main: '#2196F3',
light: '#64B5F6',
dark: '#1976D2',
},
background: {
default: '#0A1929' | '#f5f5f5',
paper: '#132f4c' | '#ffffff',
},
text: {
primary: '#fff' | 'rgba(0, 0, 0, 0.87)',
secondary: 'rgba(255, 255, 255, 0.7)' | 'rgba(0, 0, 0, 0.6)',
},
divider: 'rgba(255, 255, 255, 0.12)' | 'rgba(0, 0, 0, 0.12)',
}
}

### 9. API Endpoints

GET /sessions
POST /sessions/:id/tags
DELETE /sessions/:id/tags/:tag
PATCH /sessions/:id/active
DELETE /sessions/:id

## Implementation Notes
1. Use stopPropagation() to prevent click conflicts
2. Maintain separate hover and selection states
3. Cache session data for performance
4. Handle bulk operations with Promise.all
5. Use optimistic updates for better UX
6. Implement error boundaries for robustness
7. Use theme-aware styling for consistent look
8. Maintain accessibility standards
9. Support keyboard navigation
10. Handle loading and error states gracefully