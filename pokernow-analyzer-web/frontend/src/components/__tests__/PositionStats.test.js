import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import axios from 'axios';
import PositionStats from '../PositionStats';

jest.mock('axios');

const mockStats = {
  player_name: 'TestPlayer',
  position_stats: {
    'BTN': { hands: 100, vpip: 35.5, pfr: 28.2, threeb: 8.5 },
    'SB': { hands: 95, vpip: 32.1, pfr: 25.5, threeb: 7.2 },
    'BB': { hands: 98, vpip: 28.4, pfr: 22.1, threeb: 6.8 },
    'UTG': { hands: 92, vpip: 22.5, pfr: 18.8, threeb: 5.5 },
    'MP': { hands: 94, vpip: 25.2, pfr: 20.5, threeb: 6.2 },
    'CO': { hands: 97, vpip: 30.8, pfr: 24.2, threeb: 7.8 }
  }
};

describe('PositionStats', () => {
  beforeEach(() => {
    axios.get.mockReset();
  });

  it('renders loading state initially', () => {
    render(<PositionStats playerName="TestPlayer" />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('renders error state when API fails', async () => {
    axios.get.mockRejectedValue(new Error('API Error'));
    render(<PositionStats playerName="TestPlayer" />);
    
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Error fetching position stats');
    });
  });

  it('renders stats when data is loaded', async () => {
    axios.get.mockResolvedValue({ data: mockStats });
    render(<PositionStats playerName="TestPlayer" />);
    
    await waitFor(() => {
      expect(screen.getByText('Position Analysis for TestPlayer')).toBeInTheDocument();
      expect(screen.getByText('BTN')).toBeInTheDocument();
      expect(screen.getByText('35.5%')).toBeInTheDocument();
    });
  });

  it('shows position-specific advice', async () => {
    axios.get.mockResolvedValue({ data: mockStats });
    render(<PositionStats playerName="TestPlayer" />);
    
    await waitFor(() => {
      expect(screen.getByText(/Playing too loose\/passive/)).toBeInTheDocument();
    });
  });
}); 