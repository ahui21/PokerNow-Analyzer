from datetime import datetime
import re
import logging
import json
import os

logger = logging.getLogger(__name__)

class PokerNowParser:
    def __init__(self, db):
        self.db = db
        self.current_hand = None
        self.current_game_id = None
        self.current_hand_lines = []
        self.players = set()
        self.game_types = {}
        self.table_sizes = {}
        self.processed_hands = set()  # Track which hands we've processed

    def parse_file(self, file_path):
        """Parse a PokerNow log file."""
        try:
            # Initialize stats tracking
            self.game_types = {}
            self.table_sizes = {}
            self.players = set()
            self.processed_hands = set()  # Track which hands we've processed
            
            # Check if file has already been processed
            filename = os.path.basename(file_path)
            with self.db.get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute('SELECT game_id FROM games WHERE file_id = ?', (filename,))
                if cursor.fetchone():
                    return {
                        'status': 'skipped',
                        'message': f'File {filename} has already been uploaded'
                    }

            # Read and process the file
            with open(file_path, 'r', encoding='utf-8') as f:
                # Skip header
                next(f)
                lines = f.readlines()

            # First pass: Get game info and create game record
            game_start_time = None
            game_type = None
            stakes = None
            
            for line in reversed(lines):
                try:
                    # Split the line into columns
                    parts = [p.strip().strip('"') for p in line.strip().split(',')]
                    if len(parts) < 3:
                        continue
                    
                    entry_text = parts[0]
                    timestamp = parts[1]
                    
                    # Extract player names
                    player_match = re.search(r'"([^"]+) @\s*([^"]+)"', entry_text)
                    if player_match:
                        player_name = player_match.group(1).strip()
                        player_id = player_match.group(2).strip()
                        self.players.add(player_name)
                        self.db.create_or_get_player(player_id, player_name)
                    
                    # Convert ISO format to datetime
                    if timestamp and not game_start_time:
                        try:
                            dt = datetime.strptime(timestamp, '%Y-%m-%dT%H:%M:%S.%fZ')
                            game_start_time = dt.strftime('%Y-%m-%d %H:%M:%S')
                        except ValueError:
                            continue
                    
                    # Extract game type and stakes
                    if "starting hand #" in entry_text.lower():
                        if not game_type:
                            if "(pot limit omaha" in entry_text.lower():
                                game_type = "PLO"
                            elif "(no limit texas hold'em)" in entry_text.lower():
                                game_type = "NLHE"
                        
                        if not stakes:
                            stakes_match = re.search(r'\$(\d+)/\$(\d+)', entry_text)
                            if stakes_match:
                                stakes = f"${stakes_match.group(1)}/${stakes_match.group(2)}"
                                
                    if game_start_time and game_type and stakes:
                        break
                        
                except Exception as e:
                    logger.error(f"Error parsing line: {e}")
                    continue

            if not game_start_time:
                raise ValueError("Could not find valid timestamp in file")

            # Create game record
            self.current_game_id = self.db.create_game(
                game_start_time,
                game_type or 'Unknown',
                stakes or '$0/$0',
                filename,
                list(self.players)
            )

            # Second pass: Process hands
            current_hand_lines = []
            current_hand_number = None
            
            for line in reversed(lines):
                try:
                    parts = [p.strip().strip('"') for p in line.strip().split(',')]
                    if len(parts) < 3:
                        continue
                    
                    entry_text = parts[0]
                    
                    if "starting hand #" in entry_text.lower():
                        hand_number = self._extract_hand_number(entry_text)
                        if hand_number and hand_number not in self.processed_hands:
                            current_hand_lines = [line]
                            current_hand_number = hand_number
                            
                    elif "ending hand #" in entry_text.lower():
                        if current_hand_lines and current_hand_number:
                            current_hand_lines.append(line)
                            self._process_hand(current_hand_lines)
                            self.processed_hands.add(current_hand_number)
                            current_hand_lines = []
                            current_hand_number = None
                            
                    elif current_hand_lines and current_hand_number:
                        current_hand_lines.append(line)
                        
                except Exception as e:
                    logger.error(f"Error processing line: {e}")
                    continue

            # Calculate final stats
            total_hands = sum(self.game_types.values())
            total_sized_hands = sum(self.table_sizes.values())
            
            game_stats = {
                'game_types': {
                    gt: {
                        'count': count,
                        'percentage': round(count * 100.0 / total_hands, 1)
                    }
                    for gt, count in self.game_types.items()
                },
                'table_sizes': {
                    str(size): {
                        'count': count,
                        'percentage': round(count * 100.0 / total_sized_hands, 1)
                    }
                    for size, count in self.table_sizes.items()
                }
            }
            
            logger.debug(f"Game types before stats: {self.game_types}")
            logger.debug(f"Calculated game stats: {game_stats}")
            
            # Update game with final stats
            with self.db.get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute('''
                    UPDATE games
                    SET game_stats = ?
                    WHERE game_id = ?
                ''', (json.dumps(game_stats), self.current_game_id))
                conn.commit()
            
            return {
                'game_id': self.current_game_id,
                'game_stats': game_stats,
                'players': sorted(list(self.players))
            }

        except Exception as e:
            logger.error(f"Error parsing file: {str(e)}", exc_info=True)
            return None

    def _extract_hand_number(self, line):
        """Extract hand number from the line."""
        match = re.search(r'hand #(\d+)', line.lower())
        if match:
            return int(match.group(1))
        return None

    def _extract_timestamp(self, line):
        """Extract timestamp from the line."""
        match = re.search(r'(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2})', line)
        if match:
            return match.group(1)
        return None

    def _extract_game_type(self, line):
        """Extract game type from hand start line."""
        try:
            line_lower = line.lower()
            if "(pot limit omaha)" in line_lower or "pot limit omaha" in line_lower:
                return "PLO"
            elif "(no limit texas hold'em)" in line_lower:
                return "NLHE"
            else:
                return "Unknown"
        except Exception as e:
            logger.error(f"Error extracting game type: {e}")
            return "Unknown"

    def _extract_stakes(self, line):
        """Extract stakes from the line."""
        match = re.search(r'(\$\d+/\$\d+)', line)
        if match:
            return match.group(1)
        return 'Unknown'

    def _extract_player_name(self, text):
        """Extract player name from text."""
        match = re.search(r'"([^"]+)(?:\s*@\s*[^"]+)"', text)
        if not match:
            match = re.search(r'"([^"]+)"', text)
        if match:
            name = match.group(1).strip()
            name = re.sub(r'\s*\(\d+\)\s*$', '', name)
            name = re.sub(r'\s*@.*$', '', name)
            return name.strip()
        return None

    def _create_game(self, start_time, game_type, stakes, file_id):
        """Create a new game record."""
        try:
            return self.db.create_game(
                date=start_time,
                game_type=game_type,
                stakes=stakes,
                file_id=file_id
            )
        except Exception as e:
            logger.error(f"Error creating game: {str(e)}")
            raise

    def _extract_table_size(self, line):
        """Extract table size from Player stacks line."""
        try:
            if "Player stacks:" in line:
                # Split by pipe character to get individual player entries
                players_part = line.split("Player stacks:")[1].strip().strip('"')
                # Split by | and count non-empty entries
                players = [p.strip() for p in players_part.split("|") if "@" in p]
                table_size = len(players)
                logger.debug(f"Found table size: {table_size} from line: {line}")
                # Only return if it's a valid table size (2-10 players)
                if 2 <= table_size <= 10:
                    return table_size
            return None
        except Exception as e:
            logger.error(f"Error extracting table size: {e}")
            return None

    def _process_hand(self, lines):
        """Process a complete hand."""
        try:
            # Extract hand info from first line
            first_line = lines[0]
            hand_number = self._extract_hand_number(first_line)
            if not hand_number:
                return

            # Generate unique hand ID
            hand_id = f"{self.current_game_id}_{hand_number}"
            
            # Extract game type and stakes
            game_type = self._extract_game_type(first_line)
            stakes = self._extract_stakes(first_line)
            
            # Track game types for stats
            if game_type not in self.game_types:
                self.game_types[game_type] = 0
            self.game_types[game_type] += 1
            
            # Get table size from "Player stacks:" line
            for line in lines:
                if "Player stacks:" in line:
                    # Count number of players by counting pipe separators + 1
                    table_size = line.count("|") + 1
                    # Only count valid table sizes (2-10 players)
                    if 2 <= table_size <= 10:
                        if table_size not in self.table_sizes:
                            self.table_sizes[table_size] = 0
                        self.table_sizes[table_size] += 1
                    break
            
            # Create hand record
            self.db.create_hand(
                hand_id=hand_id,
                hand_number=hand_number,
                game_id=self.current_game_id,
                game_type=game_type,
                stakes=stakes
            )
            
            # Process actions
            current_round = "preflop"
            for line in lines[1:]:  # Skip first line (hand start)
                if "-- dealing" in line.lower():
                    current_round = self._determine_round(line)
                    continue
                    
                player_name = self._extract_player_name(line)
                if not player_name:
                    continue
                    
                # Add player to overall game players set
                self.players.add(player_name)
                    
                # Generate unique action ID
                action_id = f"{hand_id}_{player_name}_{current_round}"
                
                # Get timestamp
                timestamp = line.split(',')[1].strip().strip('"')
                
                # Create action record
                self.db.create_action(
                    action_id=action_id,
                    hand_id=hand_id,
                    game_id=self.current_game_id,
                    player_id=player_name,
                    action_type=self._determine_action_type(line),
                    action_time=timestamp,
                    round=current_round
                )
                
        except Exception as e:
            logger.error(f"Error processing hand: {e}")
            raise

    def _create_or_get_player(self, player_name):
        """Create a player record if it doesn't exist."""
        try:
            with self.db.get_connection() as conn:
                cursor = conn.cursor()
                
                # Use player name as ID for simplicity
                player_id = player_name
                
                # Check if player exists
                cursor.execute('SELECT player_id FROM players WHERE player_id = ?', (player_id,))
                if not cursor.fetchone():
                    cursor.execute('''
                        INSERT INTO players (player_id, name, lifetime_stats)
                        VALUES (?, ?, ?)
                    ''', (player_id, player_name, json.dumps({})))
                    conn.commit()
                
                return player_id
                
        except Exception as e:
            logger.error(f"Error creating/getting player: {str(e)}")
            raise

    def _create_hand(self, hand_id, hand_number, game_type, stakes, starting_pot=0):
        """Create a hand record."""
        try:
            if not self.current_game_id:
                raise ValueError("No game_id available")

            with self.db.get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute('''
                    INSERT INTO hands (
                        hand_id, hand_number, game_id, game_type, stakes,
                        starting_pot, net_changes
                    )
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                ''', (
                    hand_id,
                    hand_number,
                    self.current_game_id,  # Use the stored game_id
                    game_type,
                    stakes,
                    starting_pot,
                    json.dumps({})
                ))
                conn.commit()
                
        except Exception as e:
            logger.error(f"Error creating hand: {str(e)}")
            raise

    def _process_action(self, action_id, hand_id, player_name, text, timestamp, current_round, position):
        """Process and store a player action."""
        try:
            # Determine action type and amount
            action_type = self._determine_action_type(text)
            bet_amount = self._extract_bet_amount(text)
            special_action = self._determine_special_action(text, current_round, hand_context)
            
            with self.db.get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute('''
                    INSERT INTO actions (
                        action_id, hand_id, game_id, player_id,
                        action_type, special_action_type, bet_amount,
                        action_time, position, round
                    )
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ''', (
                    action_id,
                    hand_id,
                    self.current_game_id,
                    player_name,
                    action_type,
                    special_action,
                    bet_amount,
                    timestamp,
                    position,
                    current_round
                ))
                conn.commit()
                
        except Exception as e:
            logger.error(f"Error processing action: {str(e)}")
            raise

    def _determine_action_type(self, text):
        """Determine the type of action from the text."""
        text = text.lower()
        if "raises" in text:
            return "raise"
        elif "calls" in text:
            return "call"
        elif "checks" in text:
            return "check"
        elif "folds" in text:
            return "fold"
        elif "bets" in text:
            return "bet"
        return "unknown"

    def _extract_bet_amount(self, text):
        """Extract bet amount from text."""
        match = re.search(r'\$(\d+(?:\.\d{2})?)', text)
        if match:
            return float(match.group(1))
        return None

    def _determine_special_action(self, text, current_round, hand_context):
        """Determine if this is a special type of action."""
        special_actions = []
        text = text.lower()
        
        # Track preflop raises
        if current_round == "preflop":
            if "raises" in text:
                if hand_context['preflop_raises'] == 1:
                    special_actions.append("3bet")
                elif hand_context['preflop_raises'] == 2:
                    special_actions.append("4bet")
                elif hand_context['preflop_raises'] >= 3:
                    special_actions.append("5bet")
                hand_context['preflop_raises'] += 1
                
        # Track postflop actions
        elif "bets" in text:
            if current_round == "flop":
                special_actions.append("cbet")
            elif current_round == "turn" and hand_context.get('bet_on_flop'):
                special_actions.append("double_barrel")
            elif current_round == "river" and hand_context.get('bet_on_turn'):
                special_actions.append("triple_barrel")
            hand_context[f'bet_on_{current_round}'] = True
            
        # Track check-raises
        elif "raises" in text and hand_context.get(f'check_on_{current_round}'):
            special_actions.append("check_raise")
            
        # Track check actions
        elif "checks" in text:
            hand_context[f'check_on_{current_round}'] = True
            
        # Track folds to specific actions
        elif "folds" in text:
            if current_round == "preflop":
                if hand_context.get('last_action') == "raise":
                    special_actions.append("fold_to_preflop_raise")
                elif hand_context.get('last_action') == "3bet":
                    special_actions.append("fold_to_3bet")
                elif hand_context.get('last_action') == "4bet":
                    special_actions.append("fold_to_4bet")
            else:
                if hand_context.get('last_action') == "cbet":
                    special_actions.append("fold_to_cbet")
                elif hand_context.get('last_action') == "double_barrel":
                    special_actions.append("fold_to_double_barrel")
                elif hand_context.get('last_action') == "triple_barrel":
                    special_actions.append("fold_to_triple_barrel")
                elif hand_context.get('last_action') == "check_raise":
                    special_actions.append("fold_to_check_raise")
                
        return ",".join(special_actions) if special_actions else None

    def _determine_position(self, player_name, hand_context):
        """Determine player's position at the table."""
        if not hand_context.get('positions'):
            return None
        
        positions = hand_context['positions']
        if player_name not in positions:
            return None
        
        idx = positions.index(player_name)
        num_players = len(positions)
        
        if idx == 0:
            return "BTN"
        elif idx == 1:
            return "SB"
        elif idx == 2:
            return "BB"
        elif idx == num_players - 1:
            return "CO"
        elif idx == num_players - 2:
            return "HJ"
        elif idx == 3:
            return "UTG"
        elif idx == 4:
            return "UTG+1"
        else:
            return f"MP{idx-4}"

    def _calculate_pot_percentage(self, bet_amount, current_pot):
        """Calculate bet as percentage of current pot."""
        if not bet_amount or not current_pot:
            return None
        return round((bet_amount / current_pot) * 100, 2)

    def update_game_players(self):
        """Update the game's player list after processing all hands."""
        try:
            with self.db.get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute('''
                    UPDATE games 
                    SET player_list = ?
                    WHERE game_id = ?
                ''', (json.dumps(list(self.players)), self.current_game_id))
                conn.commit()
                
        except Exception as e:
            logger.error(f"Error updating game players: {str(e)}")
            raise