from supabase import create_client
import os
from datetime import datetime
from typing import Dict, List
from dotenv import load_dotenv
import pytz

class SupabaseService:
    def __init__(self):
        load_dotenv()
        
        supabase_url = os.getenv('SUPABASE_URL')
        supabase_key = os.getenv('SUPABASE_KEY')
        
        if not supabase_url or not supabase_key:
            raise Exception("Supabase credentials not found in environment variables")
            
        self.supabase = create_client(
            supabase_url,
            supabase_key
        )
        self.pst_timezone = pytz.timezone('America/Los_Angeles')

    async def create_session(self, file_data: Dict) -> Dict:
        """Create a new session in Supabase."""
        try:
            data = {
                'file_name': file_data['file_id'],
                'start_time': file_data['start_time'].isoformat(),
                'end_time': file_data['end_time'].isoformat(),
                'upload_time': datetime.utcnow().isoformat()
            }
            
            response = self.supabase.table('sessions').insert(data).execute()
            return response.data[0]
        except Exception as e:
            raise Exception(f"Error creating session: {str(e)}")

    async def check_file_exists(self, file_name: str) -> bool:
        """Check if a file has already been uploaded."""
        try:
            response = self.supabase.table('sessions').select('id').eq('file_name', file_name).execute()
            return len(response.data) > 0
        except Exception as e:
            raise Exception(f"Error checking file existence: {str(e)}")

    def format_date(self, date_str):
        try:
            # Parse the date string and format it consistently
            date_obj = datetime.fromisoformat(date_str.replace('Z', '+00:00'))
            return date_obj.isoformat()
        except Exception as e:
            print(f"Error formatting date {date_str}: {e}")
            return date_str

    async def get_sessions(self):
        """Get all sessions."""
        try:
            print("Fetching sessions from Supabase...")
            response = self.supabase.table('sessions').select('*').order('start_time.desc').execute()
            print(f"Got {len(response.data)} sessions")
            
            # Format the data for frontend
            formatted_sessions = []
            for session in response.data:
                try:
                    # Convert timestamps to PST
                    start_time = datetime.fromisoformat(session['start_time'].replace('Z', '+00:00'))
                    start_time_pst = start_time.astimezone(self.pst_timezone)
                    
                    # Use the stored upload_time from database
                    upload_time = datetime.fromisoformat(session['upload_time'].replace('Z', '+00:00'))
                    upload_time_pst = upload_time.astimezone(self.pst_timezone)
                    
                    formatted_session = {
                        'id': session['id'],
                        'display_name': f"{start_time_pst.strftime('%B %-d, %Y %-I:%M%p')}",
                        'file_id': session['file_name'],
                        'upload_date': upload_time_pst.strftime('%B %-d, %Y %-I:%M%p'),
                        'start_time': self.format_date(session['start_time']),
                        'end_time': self.format_date(session['end_time']),
                        'is_active': session['active'],
                        'tags': session['tags'] or [],
                        'players': [],
                        'game_stats': {
                            'game_types': {},
                            'table_sizes': {}
                        }
                    }
                    formatted_sessions.append(formatted_session)
                except Exception as e:
                    print(f"Error formatting session {session['id']}: {str(e)}")
                    print(f"Session data: {session}")
                    continue
            
            print(f"Returning {len(formatted_sessions)} formatted sessions")
            return formatted_sessions
        except Exception as e:
            print(f"Error in get_sessions: {str(e)}")
            raise Exception(f"Error fetching sessions: {str(e)}") 

    async def toggle_session_active(self, session_id: int, active: bool) -> Dict:
        """Toggle a session's active status."""
        try:
            print(f"Supabase service: Toggling session {session_id} active status to: {active}")
            response = self.supabase.table('sessions').update({
                'active': active
            }).eq('id', session_id).execute()
            print(f"Supabase response: {response.data}")
            if not response.data:
                raise Exception("No session found with that ID")
            return response.data[0]
        except Exception as e:
            print(f"Error in toggle_session_active: {str(e)}")
            raise Exception(f"Error toggling session active status: {str(e)}") 

    async def add_tag(self, session_id: int, tag: str) -> Dict:
        """Add a tag to a session."""
        try:
            # First get current tags
            response = self.supabase.table('sessions').select('tags').eq('id', session_id).execute()
            if not response.data:
                raise Exception("Session not found")
            
            current_tags = response.data[0]['tags'] or []
            
            # Add new tag if it doesn't exist
            if tag not in current_tags:
                current_tags.append(tag)
                
                # Update session with new tags
                response = self.supabase.table('sessions').update({
                    'tags': current_tags
                }).eq('id', session_id).execute()
                
            return response.data[0]
        except Exception as e:
            raise Exception(f"Error adding tag: {str(e)}")

    async def remove_tag(self, session_id: int, tag: str) -> Dict:
        """Remove a tag from a session."""
        try:
            # First get current tags
            response = self.supabase.table('sessions').select('tags').eq('id', session_id).execute()
            if not response.data:
                raise Exception("Session not found")
            
            current_tags = response.data[0]['tags'] or []
            
            # Remove tag if it exists
            if tag in current_tags:
                current_tags.remove(tag)
                
                # Update session with new tags
                response = self.supabase.table('sessions').update({
                    'tags': current_tags
                }).eq('id', session_id).execute()
                
            return response.data[0]
        except Exception as e:
            raise Exception(f"Error removing tag: {str(e)}")

    async def bulk_add_tag(self, session_ids: List[int], tag: str) -> List[Dict]:
        """Add a tag to multiple sessions."""
        try:
            results = []
            for session_id in session_ids:
                result = await self.add_tag(session_id, tag)
                results.append(result)
            return results
        except Exception as e:
            raise Exception(f"Error in bulk tag operation: {str(e)}") 