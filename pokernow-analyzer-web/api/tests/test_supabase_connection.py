import os
import sys
from datetime import datetime, timedelta
from dotenv import load_dotenv
import logging

# Add the backend directory to Python path
current_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.dirname(current_dir)
sys.path.append(backend_dir)

from src.services.supabase import SupabaseService

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def test_connection():
    try:
        # Initialize Supabase service
        supabase = SupabaseService()
        
        # Create a test session
        start_time = datetime.utcnow()
        end_time = start_time + timedelta(hours=2)
        session = supabase.create_session(start_time, end_time)
        logger.info(f"Created session with ID: {session['id']}")
        
        # Create a test hand
        hand_data = {
            'hand_number': 1,
            'start_time': start_time,
            'end_time': start_time + timedelta(minutes=5),
            'game_type': 'NLHE',
            'table_size': '6-handed'
        }
        hand = supabase.create_hand(session['id'], hand_data)
        logger.info(f"Created hand with ID: {hand['id']}")
        
        # Create a test player
        player = supabase.create_player('TestPlayer', ['Player1', 'Player2'])
        logger.info(f"Created player with ID: {player['id']}")
        
        # Create a test action
        action_data = {
            'hand_id': hand['id'],
            'player_id': player['id'],
            'action_type': 'raise',
            'amount': 100,
            'timestamp': start_time + timedelta(seconds=30),
            'special_action_type': None,
            'percentage_of_pot': 75,
            'street': 'preflop'
        }
        action = supabase.create_action(action_data)
        logger.info(f"Created action with ID: {action['id']}")
        
        return True
        
    except Exception as e:
        logger.error(f"Connection test failed: {str(e)}", exc_info=True)
        return False

if __name__ == "__main__":
    load_dotenv()
    result = test_connection()
    print("Connection test passed!" if result else "Connection test failed!") 