from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.utils import secure_filename
import os
import logging
import tempfile
from .poker_analyzer import PokerNowParser
from .models import Database
import json

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Initialize database
db = Database()

@app.route('/sessions', methods=['GET'])
def get_sessions():
    try:
        sessions = db.get_games()
        return jsonify(sessions)
    except Exception as e:
        logger.error(f"Error getting sessions: {str(e)}", exc_info=True)
        return jsonify({'error': str(e)}), 500

@app.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        logger.error("No file part in request")
        return jsonify({'error': 'No file part'}), 400
    
    files = request.files.getlist('file')
    logger.info(f"Received {len(files)} files for upload")
    
    results = {
        'processed': [],
        'skipped': [],
        'failed': []
    }
    
    # Create uploads directory if it doesn't exist
    upload_dir = os.path.join(os.path.dirname(__file__), 'uploads')
    os.makedirs(upload_dir, exist_ok=True)
    
    for index, file in enumerate(files):
        if file.filename == '':
            continue
            
        logger.info(f"Processing file {index + 1}/{len(files)}: {file.filename}")
        
        try:
            # Save file temporarily
            temp_path = os.path.join(upload_dir, secure_filename(file.filename))
            file.save(temp_path)
            logger.info(f"Saved file to {temp_path}")
            
            # Create a new parser instance for each file
            parser = PokerNowParser(db)
            result = parser.parse_file(temp_path)
            logger.info(f"Raw result from parser: {result}")
            
            try:
                os.remove(temp_path)
            except Exception as e:
                logger.warning(f"Failed to remove temp file {temp_path}: {e}")
            
            if not isinstance(result, dict):
                logger.error(f"Invalid result format for {file.filename}: {result}")
                results['failed'].append({
                    'filename': file.filename,
                    'error': 'Invalid result format from parser'
                })
                continue

            if result.get('status') == 'success':
                logger.info(f"Successfully processed {file.filename}")
                results['processed'].append(result.get('filename', file.filename))
            elif result.get('status') == 'skipped':
                logger.info(f"Skipped {file.filename} (already uploaded)")
                results['skipped'].append(result.get('filename', file.filename))
            else:
                error_msg = result.get('message', 'Unknown error')
                logger.error(f"Failed to process {file.filename}: {error_msg}")
                results['failed'].append({
                    'filename': result.get('filename', file.filename),
                    'error': error_msg
                })
                
        except Exception as e:
            logger.error(f"Error processing file {file.filename}: {str(e)}", exc_info=True)
            results['failed'].append({
                'filename': file.filename,
                'error': str(e)
            })
            try:
                os.remove(temp_path)
            except:
                pass
    
    logger.info(f"Final upload results: {results}")
    
    response_data = {
        'status': 'success' if (len(results['processed']) > 0 or len(results['skipped']) > 0) else 'error',
        'processed': results['processed'],
        'skipped': results['skipped'],
        'failed': results['failed']
    }
    
    logger.info(f"Sending response: {response_data}")
    return jsonify(response_data)

@app.route('/sessions/<int:session_id>', methods=['DELETE'])
def delete_session(session_id):
    db = Database()
    try:
        logger.info(f"Starting deletion of session {session_id}")
        
        # First check if session exists
        session = db.get_game(session_id)
        if not session:
            logger.warning(f"Session {session_id} not found")
            return jsonify({'error': 'Session not found'}), 404
            
        logger.info(f"Found session {session_id}, proceeding with deletion")
        result = db.delete_game(session_id)
        logger.info(f"Deletion result: {result}")
        
        return jsonify({
            'status': 'success',
            'message': f'Session {session_id} deleted successfully'
        })
    except Exception as e:
        logger.error(f"Error deleting session {session_id}: {str(e)}", exc_info=True)
        return jsonify({
            'status': 'error',
            'message': f"Failed to delete session: {str(e)}"
        }), 500

@app.route('/sessions/<int:session_id>/active', methods=['PATCH'])
def update_session_active(session_id):
    db = Database()
    try:
        if not request.is_json:
            return jsonify({
                'status': 'error',
                'message': 'Content-Type must be application/json'
            }), 400

        data = request.get_json()
        logger.info(f"Received visibility update request for session {session_id}: {data}")
        
        if 'is_active' not in data:
            return jsonify({
                'status': 'error',
                'message': 'is_active field is required'
            }), 400
            
        is_active = bool(data['is_active'])
        logger.info(f"Setting session {session_id} visibility to: {is_active}")
        
        # Check if session exists first
        session = db.get_game(session_id)
        if not session:
            return jsonify({
                'status': 'error',
                'message': f'Session {session_id} not found'
            }), 404
        
        result = db.update_game_active_status(session_id, is_active)
        logger.info(f"Update result: {result}")
        
        return jsonify({
            'status': 'success',
            'message': f'Session {session_id} visibility updated to {is_active}',
            'is_active': is_active
        })
    except Exception as e:
        logger.error(f"Error updating status: {str(e)}", exc_info=True)
        return jsonify({
            'status': 'error',
            'message': f"Failed to update visibility: {str(e)}"
        }), 500

@app.route('/sessions/<int:session_id>/tags', methods=['POST'])
def add_session_tag(session_id):
    try:
        data = request.json
        tag = data.get('tag')
        if not tag:
            return jsonify({'error': 'No tag provided'}), 400

        logger.info(f"Adding tag '{tag}' to session {session_id}")
        
        # Get current tags
        session = db.get_game(session_id)
        if not session:
            return jsonify({'error': 'Session not found'}), 404
            
        current_tags = json.loads(session.get('tags', '[]'))
        if tag not in current_tags:
            current_tags.append(tag)
            db.update_game_tags(session_id, current_tags)
            
        return jsonify({'message': 'Tag added successfully'})
    except Exception as e:
        logger.error(f"Error adding tag to session {session_id}: {str(e)}", exc_info=True)
        return jsonify({'error': str(e)}), 500

@app.route('/sessions/<int:session_id>/tags/<tag>', methods=['DELETE'])
def remove_session_tag(session_id, tag):
    try:
        logger.info(f"Removing tag '{tag}' from session {session_id}")
        
        # Get current tags
        session = db.get_game(session_id)
        if not session:
            return jsonify({'error': 'Session not found'}), 404
            
        current_tags = json.loads(session.get('tags', '[]'))
        if tag in current_tags:
            current_tags.remove(tag)
            db.update_game_tags(session_id, current_tags)
            
        return jsonify({'message': 'Tag removed successfully'})
    except Exception as e:
        logger.error(f"Error removing tag from session {session_id}: {str(e)}", exc_info=True)
        return jsonify({'error': str(e)}), 500

# Add other routes here... 