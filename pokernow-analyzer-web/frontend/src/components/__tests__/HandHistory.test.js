import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axios from 'axios';
import HandHistory from '../HandHistory';

jest.mock('axios');

const mockHands = [
  {
    hand_number: 1,
    timestamp: '2024-03-21T15:30:00Z',
    pot_size: 100,
    players: ['Player1', 'Player2', 'Player3'],
    positions: {
      'Player1': 'BTN',
      'Player2': 'SB',
      'Player3': 'BB'
    },
    actions: [
      {
        player: 'Player1',
        action: 'raise',
        amount: 10,
        street: 'preflop',
        position: 'BTN'
      },
      {
        player: 'Player2',
        action: 'call',
        amount: 10,
        street: 'preflop',
        position: 'SB'
      }
    ],
    board: ['As', 'Ks', 'Qs'],
    winners: [['Player1', 100]]
  }
];

describe('HandHistory', () => {
  beforeEach(() => {
    axios.get.mockReset();
  });

  it('renders loading state initially', () => {
    render(<HandHistory sessionId={1} timezone="America/Los_Angeles" />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('renders error state when API fails', async () => {
    axios.get.mockRejectedValue(new Error('API Error'));
    render(<HandHistory sessionId={1} timezone="America/Los_Angeles" />);
    
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Error fetching hands');
    });
  });

  it('renders hand history when data is loaded', async () => {
    axios.get.mockResolvedValue({ data: mockHands });
    render(<HandHistory sessionId={1} timezone="America/Los_Angeles" />);
    
    await waitFor(() => {
      expect(screen.getByText('Hand #1')).toBeInTheDocument();
      expect(screen.getByText('Pot: $100')).toBeInTheDocument();
    });
  });

  it('shows hand details when expanded', async () => {
    axios.get.mockResolvedValue({ data: mockHands });
    render(<HandHistory sessionId={1} timezone="America/Los_Angeles" />);
    
    await waitFor(() => {
      expect(screen.getByText('Hand #1')).toBeInTheDocument();
    });

    const expandButton = screen.getByRole('button', { name: /Hand #1/i });
    userEvent.click(expandButton);

    expect(screen.getByText('Player1 (BTN)')).toBeInTheDocument();
    expect(screen.getByText('Player1 raise $10')).toBeInTheDocument();
  });

  it('displays board cards correctly', async () => {
    axios.get.mockResolvedValue({ data: mockHands });
    render(<HandHistory sessionId={1} timezone="America/Los_Angeles" />);
    
    await waitFor(() => {
      const expandButton = screen.getByRole('button', { name: /Hand #1/i });
      userEvent.click(expandButton);
    });

    expect(screen.getByText('As')).toBeInTheDocument();
    expect(screen.getByText('Ks')).toBeInTheDocument();
    expect(screen.getByText('Qs')).toBeInTheDocument();
  });
}); 