import pytest
from datetime import datetime
import pytz
from src.poker_analyzer import PokerAnalyzer, Hand, HandAction, PlayerStats

@pytest.fixture
def analyzer():
    return PokerAnalyzer(timezone='America/Los_Angeles')

@pytest.fixture
def sample_hand():
    return Hand(
        hand_number=1,
        timestamp=datetime.now(pytz.UTC),
        players=['Player1', 'Player2', 'Player3'],
        positions={'Player1': 'BTN', 'Player2': 'SB', 'Player3': 'BB'},
        actions=[],
        pot_size=0,
        board=[],
        winners=[]
    )

def test_parse_timestamp(analyzer):
    ts = "2024-03-21T15:30:00Z"
    result = analyzer._parse_timestamp(ts)
    assert result.tzinfo is not None
    assert result.tzname() == 'PDT'

def test_create_new_hand(analyzer):
    event = '-- starting hand #1 "Player1" (100) "Player2" (100) "Player3" (100)'
    timestamp = datetime.now(pytz.UTC)
    hand = analyzer._create_new_hand(event, timestamp)
    
    assert hand.hand_number == 1
    assert len(hand.players) == 3
    assert all(pos in hand.positions.values() for pos in ['BTN', 'SB', 'BB'])

def test_handle_player_action(analyzer, sample_hand):
    event = '"Player1" raises 10'
    analyzer._handle_player_action(sample_hand, event, 'preflop')
    
    assert len(sample_hand.actions) == 1
    assert sample_hand.actions[0].player == 'Player1'
    assert sample_hand.actions[0].amount == 10
    assert sample_hand.pot_size == 10

def test_process_completed_hand(analyzer, sample_hand):
    # Add some actions
    actions = [
        ('Player1', 'raise', 10, 'preflop'),
        ('Player2', 'call', 10, 'preflop'),
        ('Player3', 'fold', 0, 'preflop'),
        ('Player1', 'bet', 20, 'flop'),
        ('Player2', 'call', 20, 'flop')
    ]
    
    for player, action, amount, street in actions:
        sample_hand.actions.append(HandAction(
            player=player,
            action=action,
            amount=amount,
            street=street,
            position=sample_hand.positions[player]
        ))
    
    sample_hand.winners = [('Player1', 60)]
    analyzer._process_completed_hand(sample_hand)
    
    stats = analyzer.player_stats['Player1']
    assert stats.total_hands == 1
    assert stats.hands_played == 1
    assert stats.preflop_raise_hands == 1
    assert stats.won_money == 60

def test_calculate_derived_stats(analyzer):
    stats = PlayerStats()
    stats.total_hands = 100
    stats.hands_played = 30
    stats.preflop_raise_hands = 20
    stats.three_bet_hands = 5
    stats.showdown_hands = 15
    stats.total_bets = 40
    stats.total_raises = 30
    stats.total_calls = 35
    
    result = analyzer._calculate_derived_stats(stats)
    
    assert result['VPIP'] == 30.0
    assert result['PFR'] == 20.0
    assert result['ThreeB'] == 5.0
    assert result['AF'] == 2.0  # (40 + 30) / 35
    assert result['WTSD'] == 50.0  # 15 / 30 * 100 