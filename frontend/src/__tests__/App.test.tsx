import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from '../App';

// Mock matchMedia for recharts/jsdom
window.matchMedia = window.matchMedia || function() {
  return {
    matches: false,
    addListener: function() {},
    removeListener: function() {}
  };
};

describe('AEGIS OS App', () => {
  it('renders the initial loading state correctly', () => {
    render(<App />);
    expect(screen.getAllByText('AEGIS OS').length).toBeGreaterThan(0);
    expect(screen.getByText('Autonomous Event Governance & Intelligence System')).toBeDefined();
  });
});
