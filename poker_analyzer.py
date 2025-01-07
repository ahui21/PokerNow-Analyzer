from dataclasses import dataclass, field
from typing import Dict, List, Set, Optional
import csv
import re

@dataclass
class PlayerStats:
    total_hands: int = 0
    hands_played: int = 0
    preflop_raise_hands: int = 0
    three_bet_hands: int = 0
    four_bet_hands: int = 0
    five_bet_hands: int = 0
    showdown_hands: int = 0
    flop_hands: int = 0
    total_bets: int = 0
    total_raises: int = 0
    total_calls: int = 0
    
    game_type_stats: Dict[str, Dict[str, int]] = field(default_factory=dict)
    table_size_stats: Dict[int, Dict[str, int]] = field(default_factory=dict)
    combined_stats: Dict[str, Dict[str, int]] = field(default_factory=dict)

    def __post_init__(self):
        """Initialize the nested stats after the object is created"""
        self.game_type_stats = {
            'NLHE': self._create_empty_stats(),
            'PLO': self._create_empty_stats()
        }
        
        self.table_size_stats = {
            size: self._create_empty_stats()
            for size in range(2, 11)
        }
        
        self.combined_stats = {
            f"{game_type}_{size}h": self._create_empty_stats()
            for game_type in ['NLHE', 'PLO']
            for size in range(2, 11)
        }

    def _create_empty_stats(self) -> Dict[str, int]:
        """Helper method to create empty stats dictionary."""
        return {
            'total_hands': 0,
            'hands_played': 0,
            'preflop_raise_hands': 0,
            'showdown_hands': 0,
            'three_bet_hands': 0,
            'four_bet_hands': 0,
            'five_bet_hands': 0,
            'flop_hands': 0,
            'total_bets': 0,
            'total_raises': 0,
            'total_calls': 0
        }

class PokerAnalyzer:
    def __init__(self):
        self.players: Dict[str, PlayerStats] = {}
        self.current_hand_players: Set[str] = set()
        self.current_hand_played: Set[str] = set()
        self.current_hand_raised_preflop: Set[str] = set()
        self.current_hand_showdown: Set[str] = set()
        self.current_hand_3bet_preflop: Set[str] = set()
        self.current_hand_4bet_preflop: Set[str] = set()
        self.current_hand_5bet_preflop: Set[str] = set()

    def split_text_by_commas(self, text: str) -> tuple[str, str, str]:
        """
        Split text into three parts based on the last two commas.
        Returns (first_part, middle_part, last_part)
        """
        # Find the last comma
        last_comma = text.rfind(',')
        if last_comma == -1:
            return text, "", ""
            
        # Find the second to last comma
        second_last_comma = text.rfind(',', 0, last_comma)
        if second_last_comma == -1:
            return "", text[:last_comma], text[last_comma + 1:]
            
        # Split into three parts
        first_part = text[:second_last_comma]
        middle_part = text[second_last_comma + 1:last_comma]
        last_part = text[last_comma + 1:]
        
        return first_part.strip(), middle_part.strip(), last_part.strip()

    def clean_player_name(self, name: str) -> str:
        """Remove the @ identifier from player names."""
        return re.sub(r' @ .*$', '', name.strip('"'))

    def extract_player_name(self, text: str) -> Optional[str]:
        """Extract player name from text with error handling."""
        # Try to match the full pattern first
        match = re.search(r'"([^"]+)(?:\s*@\s*[^"]+)"', text)
        if not match:
            # Try simpler pattern as fallback
            match = re.search(r'"([^"]+)"', text)
        
        if match:
            name = match.group(1).strip()
            # Remove any trailing numbers in parentheses and the @ part
            name = re.sub(r'\s*\(\d+\)\s*$', '', name)
            name = re.sub(r'\s*@.*$', '', name)
            return name.strip()
        return None

    def process_hand(self, hand_lines: List[str]) -> None:
        """Process a single hand of poker."""
        self.current_hand_players.clear()
        self.current_hand_played.clear()
        self.current_hand_raised_preflop.clear()
        self.current_hand_showdown.clear()
        self.current_hand_3bet_preflop.clear()
        self.current_hand_4bet_preflop.clear()
        self.current_hand_5bet_preflop.clear()
        
        game_type = 'NLHE'  # Default to NLHE
        table_size = 0
        current_street = 'preflop'
        flop_players = set()
        folded_players = set()  # Track folded players
        
        current_preflop = 1
        
        # First pass: get hand ID, players, and context
        for line in hand_lines:
            split_text = self.split_text_by_commas(line)
            text = split_text[0].lower()
            
            # Detect PLO
            if "omaha" in text.lower():
                game_type = 'PLO'
            
            if "player stacks:" in text:
                stack_info = text.split("player stacks:")[1]
                players = [self.extract_player_name(stack) for stack in stack_info.split('|')]
                table_size = len([p for p in players if p])  # Count valid players
                
                for player in players:
                    if player:
                        if player not in self.players:
                            self.players[player] = PlayerStats()
                        self.current_hand_players.add(player)
        
            # Track street changes
            if "flop:" in text.lower():
                current_street = 'flop'
                # Add all players who haven't folded to flop_players
                flop_players = self.current_hand_played - folded_players
                print(f"DEBUG: Players who see flop: {flop_players}")  # Debug print
                continue
            elif "turn:" in text.lower():
                current_street = 'turn'
                continue
            elif "river:" in text.lower():
                current_street = 'river'
                continue
            
            # Extract player and action
            player = self.extract_player_name(text)
            if not player:
                continue

            # Track preflop actions to determine who sees the flop
            if current_street == 'preflop':
                if "calls" in text or "raises" in text or "bets" in text or "posts" in text:  # Added "posts"
                    self.current_hand_played.add(player)
                elif "folds" in text:
                    folded_players.add(player)
                    if player in self.current_hand_played:
                        self.current_hand_played.remove(player)

            # Track actions
            if "shows" in text:
                self.current_hand_showdown.add(player)
                self.players[player].showdown_hands += 1
                self.players[player].game_type_stats[game_type]['showdown_hands'] += 1
                self.players[player].table_size_stats[table_size]['showdown_hands'] += 1
                self.players[player].combined_stats[f"{game_type}_{table_size}h"]['showdown_hands'] += 1
                
            elif "raises to" in text or "raises" in text:
                if "posts" not in text:  # Don't count blind posts
                    self.players[player].total_raises += 1
                    self.players[player].game_type_stats[game_type]['total_raises'] += 1
                    self.players[player].table_size_stats[table_size]['total_raises'] += 1
                    self.players[player].combined_stats[f"{game_type}_{table_size}h"]['total_raises'] += 1
                    
                    if current_street == 'preflop':
                        self.current_hand_raised_preflop.add(player)
                        self.current_hand_played.add(player)

                        if current_preflop == 2:
                            self.current_hand_3bet_preflop.add(player)
                        elif current_preflop == 3:
                            self.current_hand_4bet_preflop.add(player)
                        elif current_preflop >= 4:
                            self.current_hand_5bet_preflop.add(player)

                        current_preflop += 1
            
            elif "calls" in text:
                if not any(x in text.lower() for x in ["small blind", "big blind", "posts"]):
                    self.players[player].total_calls += 1
                    self.players[player].game_type_stats[game_type]['total_calls'] += 1
                    self.players[player].table_size_stats[table_size]['total_calls'] += 1
                    self.players[player].combined_stats[f"{game_type}_{table_size}h"]['total_calls'] += 1
                    
                    if current_street == 'preflop':
                        self.current_hand_played.add(player)
            
            elif "bets" in text:
                self.players[player].total_bets += 1
                self.players[player].game_type_stats[game_type]['total_bets'] += 1
                self.players[player].table_size_stats[table_size]['total_bets'] += 1
                self.players[player].combined_stats[f"{game_type}_{table_size}h"]['total_bets'] += 1
                
                if current_street == 'preflop':
                    self.current_hand_played.add(player)

        # Define combined_key before using it
        combined_key = f"{game_type}_{table_size}h"
        
        # Update stats for all contexts
        for player in self.current_hand_players:
            # Update main stats
            self.players[player].total_hands += 1
            
            # Update game type stats
            self.players[player].game_type_stats[game_type]['total_hands'] += 1
            
            # Update table size stats
            self.players[player].table_size_stats[table_size]['total_hands'] += 1
            
            # Update combined stats
            self.players[player].combined_stats[combined_key]['total_hands'] += 1
        
        for player in self.current_hand_played:
            # Update main stats
            self.players[player].hands_played += 1
            
            # Update game type stats
            self.players[player].game_type_stats[game_type]['hands_played'] += 1
            
            # Update table size stats
            self.players[player].table_size_stats[table_size]['hands_played'] += 1
            
            # Update combined stats
            self.players[player].combined_stats[combined_key]['hands_played'] += 1
        
        for player in self.current_hand_raised_preflop:
            # Update main stats
            self.players[player].preflop_raise_hands += 1
            
            # Update game type stats
            self.players[player].game_type_stats[game_type]['preflop_raise_hands'] += 1
            
            # Update table size stats
            self.players[player].table_size_stats[table_size]['preflop_raise_hands'] += 1
            
            # Update combined stats
            self.players[player].combined_stats[combined_key]['preflop_raise_hands'] += 1

        # Add updates for 3bets, 4bets, and 5bets
        for player in self.current_hand_3bet_preflop:
            # Update main stats
            self.players[player].three_bet_hands += 1
            
            # Update game type stats
            self.players[player].game_type_stats[game_type]['three_bet_hands'] += 1
            
            # Update table size stats
            self.players[player].table_size_stats[table_size]['three_bet_hands'] += 1
            
            # Update combined stats
            self.players[player].combined_stats[combined_key]['three_bet_hands'] += 1

        for player in self.current_hand_4bet_preflop:
            # Update main stats
            self.players[player].four_bet_hands += 1
            
            # Update game type stats
            self.players[player].game_type_stats[game_type]['four_bet_hands'] += 1
            
            # Update table size stats
            self.players[player].table_size_stats[table_size]['four_bet_hands'] += 1
            
            # Update combined stats
            self.players[player].combined_stats[combined_key]['four_bet_hands'] += 1

        for player in self.current_hand_5bet_preflop:
            # Update main stats
            self.players[player].five_bet_hands += 1
            
            # Update game type stats
            self.players[player].game_type_stats[game_type]['five_bet_hands'] += 1
            
            # Update table size stats
            self.players[player].table_size_stats[table_size]['five_bet_hands'] += 1
            
            # Update combined stats
            self.players[player].combined_stats[combined_key]['five_bet_hands'] += 1

        # After the loop, update flop hands stats
        print(f"DEBUG: Final flop players: {flop_players}")  # Debug print
        for player in flop_players:
            print(f"DEBUG: Updating flop hands for {player}")  # Debug print
            # Update main stats
            self.players[player].flop_hands += 1
            
            # Update game type stats
            self.players[player].game_type_stats[game_type]['flop_hands'] += 1
            
            # Update table size stats
            self.players[player].table_size_stats[table_size]['flop_hands'] += 1
            
            # Update combined stats
            self.players[player].combined_stats[combined_key]['flop_hands'] += 1

    def parse_log(self, filename: str) -> None:
        """Parse the entire log file."""
        with open(filename, 'r', encoding='utf-8') as f:
            all_lines = list(csv.reader(f))
            hands = []
            current_hand = []
            
            # Skip header
            all_lines = all_lines[1:]
            
            # Collect hands based on "starting hand #" and "ending hand #"
            for row in reversed(all_lines):
                line = row[0]
                
                if "starting hand #" in line:
                    current_hand.append(row)
                
                if current_hand:
                    current_hand.append(row)  # Add the current line to the ongoing hand
                
                    if "ending hand #" in line:  # Check for the end of the hand
                        hands.append(current_hand)
                        current_hand = []  # Reset for the next hand
            
            # Process each hand
            for hand in hands:
                # Convert hand lines to proper format
                hand_lines = [','.join(row) for row in hand]
                self.process_hand(hand_lines)

    def calculate_context_stats(self, stats: Dict[str, int]) -> Dict[str, float]:
        """Calculate stats for a specific context (game type or table size)."""
        if stats['total_hands'] == 0:
            return {}
        
        return {
            'PFR': (stats['preflop_raise_hands'] / stats['total_hands']) * 100,
            'VPIP': (stats['hands_played'] / stats['total_hands']) * 100,
            'AF': (stats['total_bets'] + stats['total_raises']) / (stats['total_calls'] or 1),
            'WTSD': (stats['showdown_hands'] / stats['flop_hands'] * 100) if stats['flop_hands'] > 0 else 0,
            'Hands': stats['total_hands'],
            'Hands Played': stats['hands_played'],
            'Preflop Raises': stats['preflop_raise_hands'],
            'Showdowns': stats['showdown_hands'],
            'Flop Hands': stats['flop_hands'],
            'Bets': stats['total_bets'],
            'Raises': stats['total_raises'],
            'Calls': stats['total_calls'],
            '3Bets': stats['three_bet_hands'],
            '4Bets': stats['four_bet_hands'],
            '5Bets': stats['five_bet_hands']
        }

    def get_stats(self) -> Dict[str, Dict[str, Dict[str, float]]]:
        """Calculate and return stats for all players and contexts."""
        stats = {}
        for player, data in self.players.items():
            if data.total_hands == 0:
                continue
            
            # Calculate overall stats
            overall_stats = self.calculate_player_stats(data)
            
            # Calculate game type stats
            game_type_stats = {
                game_type: self.calculate_context_stats(stats)
                for game_type, stats in data.game_type_stats.items()
                if stats['total_hands'] > 0
            }
            
            # Calculate table size stats
            table_size_stats = {
                f"{size}-handed": self.calculate_context_stats(stats)
                for size, stats in data.table_size_stats.items()
                if stats['total_hands'] > 0
            }
            
            # Calculate combined stats
            combined_stats = {
                context: self.calculate_context_stats(stats)
                for context, stats in data.combined_stats.items()
                if stats['total_hands'] > 0
            }
            
            stats[player] = {
                'overall': overall_stats,
                'by_game_type': game_type_stats,
                'by_table_size': table_size_stats,
                'by_combined': combined_stats
            }
        
        return stats

    def calculate_player_stats(self, data: PlayerStats) -> Dict[str, float]:
        """Calculate stats for a single PlayerStats object."""
        if data.total_hands == 0:
            return {}
            
        return {
            'PFR': (data.preflop_raise_hands / data.total_hands) * 100,
            'VPIP': (data.hands_played / data.total_hands) * 100,
            'AF': (data.total_bets + data.total_raises) / (data.total_calls or 1),
            'WTSD': (data.showdown_hands / data.flop_hands * 100) if data.flop_hands > 0 else 0,
            'Hands': data.total_hands,
            'Hands Played': data.hands_played,
            'Preflop Raises': data.preflop_raise_hands,
            'Showdowns': data.showdown_hands,
            'Flop Hands': data.flop_hands,
            'Bets': data.total_bets,
            'Raises': data.total_raises,
            'Calls': data.total_calls,
            '3Bets': data.three_bet_hands,
            '4Bets': data.four_bet_hands,
            '5Bets': data.five_bet_hands
        }

if __name__ == "__main__":
    import sys
    import csv
    from typing import List, Dict
    
    if len(sys.argv) != 2:
        print("Usage: python poker_analyzer.py <pokernow_log_file>")
        sys.exit(1)

    analyzer = PokerAnalyzer()
    analyzer.parse_log(sys.argv[1])
    
    stats = analyzer.get_stats()
    
    # Define CSV headers
    headers = [
        'Name',
        'Game Type',
        'Table Size',
        'Hands',
        'Hands Played',
        'Hands PFR',
        'Hands Flop',
        'Hands Showdown',
        'Bets',
        'Raises',
        'Calls',
        '3Bets',
        '4Bets',
        '5Bets'
    ]
    
    # Prepare rows for CSV
    rows = []
    for player, contexts in sorted(stats.items()):
        for context, combined_stats in contexts['by_combined'].items():
            # Parse game type and table size from context (e.g., "NLHE_9h")
            game_type, table_info = context.split('_')
            table_size = table_info[:-1]  # Remove the 'h' suffix
            
            # Only add row if there are hands played
            if combined_stats['Hands'] > 0:
                row = [
                    player,
                    game_type,
                    table_size,
                    int(combined_stats['Hands']),
                    int(combined_stats['Hands Played']),
                    int(combined_stats['Preflop Raises']),
                    int(combined_stats['Flop Hands']),
                    int(combined_stats['Showdowns']),
                    int(combined_stats['Bets']),
                    int(combined_stats['Raises']),
                    int(combined_stats['Calls']),
                    int(combined_stats['3Bets']),
                    int(combined_stats['4Bets']),
                    int(combined_stats['5Bets'])
                ]
                rows.append(row)
    
    # Write to CSV
    output_file = 'stats.csv'
    with open(output_file, 'w', newline='') as f:
        writer = csv.writer(f)
        writer.writerow(headers)
        writer.writerows(rows)
    
    print(f"Stats written to {output_file}")