import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import axios from 'axios';
import PlayerHistory from '../PlayerHistory';

jest.mock('axios');

const mockHistory = {
  player_name: 'TestPlayer',
  total_sessions: 10,
  total_hands: 500,
  aggregate_stats: {
    VPIP: 25.5,
    PFR: 20.2,
    ThreeB: 6.5,
    AF: 2.2,
    WTSD: 35.5,
    TotalWinnings: 1000,
    BiggestPot: 300,
    HandsPlayed: 150
  },
  sessions: [
    {
      session_start: '2024-03-21T15:30:00Z',
      session_end: '2024-03-21T18:30:00Z',
      game_type: 'NLHE',
      table_size: 6,
      stats: {
        VPIP: 26.0,
        PFR: 21.0,
        ThreeB: 7.0,
        AF: 2.3,
        WTSD: 36.0,
        WinRate: 2.5,
        Hands: 50
      }
    }
  ]
};

describe('PlayerHistory', () => {
  beforeEach(() => {
    axios.get.mockReset();
  });

  it('renders loading state initially', () => {
    render(<PlayerHistory playerName="TestPlayer" timezone="America/Los_Angeles" />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('renders error state when API fails', async () => {
    axios.get.mockRejectedValue(new Error('API Error'));
    render(<PlayerHistory playerName="TestPlayer" timezone="America/Los_Angeles" />);
    
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Error fetching player history');
    });
  });

  it('renders player stats when data is loaded', async () => {
    axios.get.mockResolvedValue({ data: mockHistory });
    render(<PlayerHistory playerName="TestPlayer" timezone="America/Los_Angeles" />);
    
    await waitFor(() => {
      expect(screen.getByText('TestPlayer\'s History')).toBeInTheDocument();
      expect(screen.getByText('Total Sessions: 10')).toBeInTheDocument();
      expect(screen.getByText('Total Hands: 500')).toBeInTheDocument();
    });
  });

  it('displays aggregate stats correctly', async () => {
    axios.get.mockResolvedValue({ data: mockHistory });
    render(<PlayerHistory playerName="TestPlayer" timezone="America/Los_Angeles" />);
    
    await waitFor(() => {
      expect(screen.getByText('VPIP: 25.5%')).toBeInTheDocument();
      expect(screen.getByText('PFR: 20.2%')).toBeInTheDocument();
      expect(screen.getByText('Total Winnings: $1000')).toBeInTheDocument();
    });
  });

  it('shows session history in table', async () => {
    axios.get.mockResolvedValue({ data: mockHistory });
    render(<PlayerHistory playerName="TestPlayer" timezone="America/Los_Angeles" />);
    
    await waitFor(() => {
      expect(screen.getByText('NLHE')).toBeInTheDocument();
      expect(screen.getByText('6')).toBeInTheDocument();
      expect(screen.getByText('$2.50/hand')).toBeInTheDocument();
    });
  });
}); 