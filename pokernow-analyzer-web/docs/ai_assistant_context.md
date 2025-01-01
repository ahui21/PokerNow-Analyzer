# Poker Analyzer Web - AI Assistant Context

## Project Overview
A web application for analyzing poker session logs from PokerNow.club, built with Flask backend and React frontend.

## Recent Work History

### Bug Fixes
1. CSV Parsing Issues
   - Fixed timestamp parsing to use 'at' column with ISO format
   - Added proper error handling for invalid rows
   - Implemented DictReader for more reliable column access

2. Database Schema Updates
   - Added upload_date column to games table
   - Created migration script for existing records
   - Separated game session date from upload date

3. Frontend Display Issues
   - Fixed session sorting by start_time
   - Added proper date formatting for both game and upload dates
   - Improved error handling in stats parsing

### Current State

#### Backend
1. Core Parser (`poker_analyzer.py`)
   - Handles PokerNow CSV format
   - Extracts game type, stakes, player info
   - Processes hands sequentially
   - Calculates player statistics

2. Database (`models.py`)
   - SQLite with thread-safe implementation
   - Games table structure:
     - game_id (PK)
     - date (game session time)
     - upload_date (file processing time)
     - player_list
     - game_type
     - stakes
     - file_id (unique)
     - is_active
     - tags
     - game_stats

3. API (`app.py`)
   - File upload and processing
   - Session management
   - Tag management
   - Statistics retrieval

#### Frontend
1. Active Components
   - SessionsManager: Main session list and management
   - GameByGame: Detailed game statistics
   - Theme system with dark/light mode

2. Placeholder Components
   - PlayerTendencies
   - GameStatistics
   - LifetimeStatistics

### Areas Needing Work
1. Statistics Implementation
   - Complete player tendency analysis
   - Implement lifetime statistics
   - Add game-type specific analysis

2. UI Enhancements
   - Implement placeholder components
   - Add more detailed hand analysis views
   - Improve mobile responsiveness

3. Performance Optimization
   - Add caching for frequently accessed data
   - Optimize database queries
   - Implement pagination for large datasets

### Key Learnings
1. File Format
   - PokerNow CSV structure uses ISO timestamps in 'at' column
   - Game type and stakes info embedded in hand start messages
   - Player information format: "Name @ ID"

2. Critical Features
   - Multi-session analysis capability
   - Player tracking across sessions
   - Game type and table size statistics
   - Tag-based organization

3. Technical Considerations
   - Thread-safe database operations important
   - Proper timezone handling needed
   - Error handling crucial for file parsing
   - Frontend state management patterns

## Next Steps
1. Implement remaining placeholder components
2. Add more detailed player statistics
3. Improve error messaging and handling
4. Add session filtering and sorting options
5. Implement real-time updates
6. Add player tracking across sessions

## Important Files
1. Backend
   - poker_analyzer.py: Core parsing logic
   - models.py: Database operations
   - app.py: API endpoints

2. Frontend
   - SessionsManager.js: Main session handling
   - GameByGame.js: Detailed game view
   - ThemeContext.js: Theme management

## Database Migrations
Latest migration: add_upload_date.py
- Adds upload_date column
- Sets default values for existing records
- Maintains backwards compatibility

## Known Issues
1. Session display sometimes shows game date instead of upload date
2. Need better error handling for malformed CSV files
3. Statistics calculations need optimization
4. Frontend needs better loading states

## Configuration
1. Backend runs on port 5001
2. Frontend runs on port 3000
3. SQLite database for data storage
4. Dark mode as default theme 