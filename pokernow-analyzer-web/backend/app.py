from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.utils import secure_filename
import os
from src.poker_analyzer import PokerNowParser
from src.models import Database
import logging
import json

app = Flask(__name__)
CORS(app, resources={
    r"/*": {
        "origins": ["http://localhost:3000"],
        "methods": ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type"]
    }
})

app.config['UPLOAD_FOLDER'] = 'uploads'
if not os.path.exists(app.config['UPLOAD_FOLDER']):
    os.makedirs(app.config['UPLOAD_FOLDER'])

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

db = Database()

def allowed_file(filename):
    return filename.endswith('.csv')

@app.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    
    files = request.files.getlist('file')
    results = {
        'processed': [],
        'skipped': [],
        'failed': []
    }
    
    for file in files:
        if file.filename == '':
            continue
            
        try:
            filename = secure_filename(file.filename)
            file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            file.save(file_path)
            
            parser = PokerNowParser(db)
            result = parser.parse_file(file_path)
            
            if result:
                if result.get('status') == 'skipped':
                    results['skipped'].append(filename)
                else:
                    results['processed'].append({
                        'filename': filename,
                        'game_id': result['game_id']
                    })
            else:
                results['failed'].append({
                    'filename': filename,
                    'error': 'Parser returned invalid result'
                })
                
            os.remove(file_path)  # Clean up
            
        except Exception as e:
            logger.error(f"Error processing {file.filename}: {str(e)}")
            results['failed'].append({
                'filename': file.filename,
                'error': str(e)
            })
            
    response = {
        'status': 'success' if len(results['processed']) > 0 else 'error',
        'processed': [r['filename'] for r in results['processed']],
        'skipped': results['skipped'],
        'failed': results['failed']
    }
    
    if len(results['processed']) == 0 and len(results['failed']) > 0:
        return jsonify(response), 400
        
    return jsonify(response)

@app.route('/games', methods=['GET'])
def get_games():
    """Get list of all games."""
    try:
        games = db.get_games()
        return jsonify(games)
    except Exception as e:
        logger.error(f"Error fetching games: {str(e)}")
        return jsonify({
            'error': 'Error fetching games',
            'message': str(e)
        }), 500

@app.route('/games/<game_id>/stats', methods=['GET'])
def get_game_stats(game_id):
    try:
        # First try to get stats from the database
        with db.get_connection() as conn:
            cursor = conn.cursor()
            # Try to get cached stats first
            cursor.execute('''
                SELECT player_stats FROM game_stats 
                WHERE game_id = ?
            ''', (game_id,))
            stats_result = cursor.fetchone()
            
            if stats_result and stats_result[0]:
                # If we have cached stats, return them
                return jsonify({
                    'session_id': game_id,
                    'players': json.loads(stats_result[0])
                })

            # If no cached stats, get file_id and parse the file
            cursor.execute('SELECT file_id FROM games WHERE game_id = ?', (game_id,))
            result = cursor.fetchone()
            
            if not result:
                logger.error(f"Session not found for game_id: {game_id}")
                return jsonify({'error': 'Session not found'}), 404

            file_id = result[0]
            file_path = os.path.join(app.config['UPLOAD_FOLDER'], file_id)
            
            logger.debug(f"Looking for file at path: {file_path}")
            if not os.path.exists(file_path):
                logger.error(f"File not found at path: {file_path}")
                return jsonify({'error': 'Game file not found'}), 404
            
            # Parse the file with skip_db_check=True to force parsing
            parser = PokerNowParser(db)
            game_data = parser.parse_file(file_path, skip_db_check=True)
            
            if not game_data:
                logger.error("parse_file returned no data")
                return jsonify({'error': 'No game data available'}), 404
                
            if not game_data.get('player_stats'):
                logger.error("No player_stats in game_data")
                logger.debug(f"game_data contents: {game_data}")
                return jsonify({'error': 'No stats available'}), 404

            # Format the response
            players_stats = []
            for player_name, stats in game_data['player_stats'].items():
                players_stats.append({
                    'name': player_name,
                    'vpip': stats.get('vpip', 0) * 100,
                    'pfr': stats.get('pfr', 0) * 100,
                    'af': stats.get('af', 0),
                    'wtsd': stats.get('wtsd', 0) * 100,
                    'threebet': stats.get('3bet', 0) * 100,
                    'fourbet': stats.get('4bet', 0) * 100,
                    'fivebet': stats.get('5bet', 0) * 100,
                    'hands': stats.get('total_hands', 0)
                })

            # Cache the stats for future use
            cursor.execute('''
                INSERT OR REPLACE INTO game_stats (game_id, player_stats)
                VALUES (?, ?)
            ''', (game_id, json.dumps(players_stats)))
            conn.commit()

            return jsonify({
                'session_id': game_id,
                'players': players_stats
            })

    except Exception as e:
        logger.error(f"Error in get_game_stats: {str(e)}", exc_info=True)
        return jsonify({'error': str(e)}), 500

@app.route('/sessions', methods=['GET'])
def get_sessions():
    """Get list of all sessions."""
    try:
        games = db.get_games()
        return jsonify(games)
    except Exception as e:
        logger.error(f"Error fetching sessions: {str(e)}")
        return jsonify({
            'error': 'Error fetching sessions',
            'message': str(e)
        }), 500

@app.route('/sessions/<int:session_id>/stats', methods=['GET'])
def get_session_stats(session_id):
    """Get statistics for a specific session."""
    try:
        # For now, we'll use the game stats endpoint
        stats = db.get_game_stats(session_id)
        if not stats:
            return jsonify({'error': 'Session not found'}), 404
        return jsonify(stats)
    except Exception as e:
        logger.error(f"Error fetching session stats: {str(e)}")
        return jsonify({
            'error': 'Error fetching session stats',
            'message': str(e)
        }), 500

@app.route('/sessions/<int:session_id>/tags', methods=['POST'])
def add_session_tag(session_id):
    """Add a tag to a session."""
    try:
        tag = request.json.get('tag')
        if not tag:
            return jsonify({'message': 'No tag provided'}), 400

        # Get current tags
        with db.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('SELECT tags FROM games WHERE game_id = ?', (session_id,))
            result = cursor.fetchone()
            if not result:
                return jsonify({'message': 'Session not found'}), 404
            
            current_tags = json.loads(result[0])
            if tag not in current_tags:
                current_tags.append(tag)
                db.update_game_tags(session_id, current_tags)

        return jsonify({'message': 'Tag added successfully'})
    except Exception as e:
        logger.error(f"Error adding tag: {str(e)}")
        return jsonify({'message': f'Error adding tag: {str(e)}'}), 500

@app.route('/sessions/<int:session_id>/tags/<path:tag>', methods=['DELETE'])
def remove_session_tag(session_id, tag):
    """Remove a tag from a session."""
    try:
        with db.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('SELECT tags FROM games WHERE game_id = ?', (session_id,))
            result = cursor.fetchone()
            if not result:
                return jsonify({'message': 'Session not found'}), 404
            
            current_tags = json.loads(result[0])
            if tag in current_tags:
                current_tags.remove(tag)
                db.update_game_tags(session_id, current_tags)

        return jsonify({'message': 'Tag removed successfully'})
    except Exception as e:
        logger.error(f"Error removing tag: {str(e)}")
        return jsonify({'message': f'Error removing tag: {str(e)}'}), 500

@app.route('/sessions/<int:session_id>/active', methods=['PATCH'])
def update_session_active_status(session_id):
    """Update session active status."""
    try:
        is_active = request.json.get('is_active')
        if is_active is None:
            return jsonify({'message': 'No active status provided'}), 400

        db.update_game_active_status(session_id, is_active)
        return jsonify({'message': 'Status updated successfully'})
    except Exception as e:
        logger.error(f"Error updating status: {str(e)}")
        return jsonify({'message': f'Error updating status: {str(e)}'}), 500

@app.route('/sessions/<int:session_id>', methods=['DELETE'])
def delete_session(session_id):
    """Delete a session."""
    try:
        with db.get_connection() as conn:
            cursor = conn.cursor()
            
            # Check if session exists
            cursor.execute('SELECT 1 FROM games WHERE game_id = ?', (session_id,))
            if not cursor.fetchone():
                return jsonify({'message': 'Session not found'}), 404

            # Delete the session
            db.delete_game(session_id)
            
        return jsonify({'message': 'Session deleted successfully'})
    except Exception as e:
        logger.error(f"Error deleting session: {str(e)}")
        return jsonify({'message': f'Error deleting session: {str(e)}'}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5001)