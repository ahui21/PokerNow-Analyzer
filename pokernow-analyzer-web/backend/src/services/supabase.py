from supabase import create_client
from datetime import datetime
import os
from dotenv import load_dotenv
from typing import Dict, List, Optional

load_dotenv()

class SupabaseService:
    _instance = None

    @staticmethod
    def get_instance():
        if SupabaseService._instance is None:
            SupabaseService._instance = SupabaseService()
        return SupabaseService._instance

    def __init__(self):
        self.supabase = create_client(
            os.getenv('SUPABASE_URL'),
            os.getenv('SUPABASE_KEY')
        )

    def create_session(self, start_time: datetime, end_time: datetime) -> Dict:
        """Create a new poker session."""
        try:
            data = {
                'start_time': start_time.isoformat(),
                'end_time': end_time.isoformat(),
                'upload_time': datetime.utcnow().isoformat()
            }
            response = self.supabase.table('sessions').insert(data).execute()
            return response.data[0]
        except Exception as e:
            print(f"Error creating session: {e}")
            raise

    def create_hand(self, session_id: int, hand_data: Dict) -> Dict:
        """Create a new hand."""
        try:
            data = {
                'session_id': session_id,
                'hand_number': hand_data['hand_number'],
                'start_time': hand_data['start_time'].isoformat(),
                'end_time': hand_data['end_time'].isoformat(),
                'game_type': hand_data['game_type'],
                'table_size': hand_data['table_size']
            }
            response = self.supabase.table('hands').insert(data).execute()
            return response.data[0]
        except Exception as e:
            print(f"Error creating hand: {e}")
            raise

    def create_player(self, name: str, pseudonyms: Optional[List[str]] = None) -> Dict:
        """Create a new player."""
        try:
            data = {
                'name': name,
                'pseudonyms': pseudonyms or []
            }
            response = self.supabase.table('players').insert(data).execute()
            return response.data[0]
        except Exception as e:
            print(f"Error creating player: {e}")
            raise

    def create_action(self, action_data: Dict) -> Dict:
        """Create a new action."""
        try:
            data = {
                'hand_id': action_data['hand_id'],
                'player_id': action_data['player_id'],
                'action_type': action_data['action_type'],
                'amount': action_data.get('amount'),
                'timestamp': action_data['timestamp'].isoformat(),
                'special_action_type': action_data.get('special_action_type'),
                'percentage_of_pot': action_data.get('percentage_of_pot'),
                'street': action_data['street']
            }
            response = self.supabase.table('actions').insert(data).execute()
            return response.data[0]
        except Exception as e:
            print(f"Error creating action: {e}")
            raise

    def get_sessions(self) -> List[Dict]:
        """Get all sessions."""
        try:
            response = self.supabase.table('sessions').select('*').execute()
            return response.data
        except Exception as e:
            print(f"Error fetching sessions: {e}")
            raise

    def get_session_hands(self, session_id: int) -> List[Dict]:
        """Get all hands for a session."""
        try:
            response = self.supabase.table('hands').select('*').eq('session_id', session_id).execute()
            return response.data
        except Exception as e:
            print(f"Error fetching hands: {e}")
            raise

    def get_hand_actions(self, hand_id: int) -> List[Dict]:
        """Get all actions for a hand."""
        try:
            response = self.supabase.table('actions').select('''
                *,
                players (name)
            ''').eq('hand_id', hand_id).execute()
            return response.data
        except Exception as e:
            print(f"Error fetching actions: {e}")
            raise

    def get_or_create_player(self, name: str) -> Dict:
        """Get a player by name or create if doesn't exist."""
        try:
            # Try to find existing player
            response = self.supabase.table('players').select('*').eq('name', name).execute()
            if response.data:
                return response.data[0]
            
            # Create new player if not found
            return self.create_player(name)
        except Exception as e:
            print(f"Error getting/creating player: {e}")
            raise 