import pytest
import sqlite3
import json
from datetime import datetime
import pytz
from src.models import Database

@pytest.fixture
def test_db():
    db = Database(db_file=":memory:")
    return db

@pytest.fixture
def sample_session_data():
    return {
        'filename': 'test.csv',
        'display_name': '3/21/2024 3:30pm - 5:30pm',
        'stats': {
            'player_stats': {
                'Player1': {
                    'position': 'BTN',
                    'vpip': 30.0,
                    'pfr': 25.0,
                    'threeb': 5.0,
                    'af': 2.0,
                    'wtsd': 40.0,
                    'won_money': 100,
                    'total_hands': 50,
                    'hands_played': 15,
                    'biggest_pot': 200
                }
            },
            'hands': [
                {
                    'hand_number': 1,
                    'timestamp': '2024-03-21T15:30:00Z',
                    'pot_size': 100,
                    'players': ['Player1', 'Player2'],
                    'actions': [],
                    'board': ['As', 'Ks', 'Qs'],
                    'winners': [['Player1', 100]]
                }
            ]
        }
    }

def test_init_db(test_db):
    # Check if tables were created
    with sqlite3.connect(":memory:") as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
        tables = {row[0] for row in cursor.fetchall()}
        
        assert 'sessions' in tables
        assert 'players' in tables
        assert 'player_session_stats' in tables
        assert 'hands' in tables

def test_save_session(test_db, sample_session_data):
    session_id = test_db.save_session(
        filename=sample_session_data['filename'],
        display_name=sample_session_data['display_name'],
        stats=sample_session_data['stats'],
        session_start=datetime.now(pytz.UTC),
        session_end=datetime.now(pytz.UTC),
        timezone='America/Los_Angeles',
        file_hash='test_hash',
        game_type='NLHE',
        table_size=6
    )
    
    assert session_id is not None
    assert session_id > 0

def test_get_session_stats(test_db, sample_session_data):
    # First save a session
    session_id = test_db.save_session(
        filename=sample_session_data['filename'],
        display_name=sample_session_data['display_name'],
        stats=sample_session_data['stats'],
        session_start=datetime.now(pytz.UTC),
        session_end=datetime.now(pytz.UTC),
        timezone='America/Los_Angeles',
        file_hash='test_hash',
        game_type='NLHE',
        table_size=6
    )
    
    # Then retrieve it
    stats = test_db.get_session_stats(session_id)
    assert stats is not None
    assert 'player_stats' in stats
    assert 'Player1' in stats['player_stats']

def test_get_player_history(test_db, sample_session_data):
    # Save a session first
    test_db.save_session(
        filename=sample_session_data['filename'],
        display_name=sample_session_data['display_name'],
        stats=sample_session_data['stats'],
        session_start=datetime.now(pytz.UTC),
        session_end=datetime.now(pytz.UTC),
        timezone='America/Los_Angeles',
        file_hash='test_hash',
        game_type='NLHE',
        table_size=6
    )
    
    history = test_db.get_player_history('Player1')
    assert history is not None
    assert history['player_name'] == 'Player1'
    assert history['total_sessions'] == 1
    assert 'aggregate_stats' in history 