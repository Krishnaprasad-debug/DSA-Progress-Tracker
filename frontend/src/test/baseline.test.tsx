import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from '../App';

describe('Frontend Baseline CI Test Suite', () => {
  it('renders application landing header and title', () => {
    render(<App />);

    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    expect(screen.getAllByText(/DSA Progress Tracker/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/Learning Analytics Platform/i)).toBeInTheDocument();
  });

  it('renders the CI/CD pipeline job overview cards', () => {
    render(<App />);

    expect(screen.getByText('Code Quality & Linting')).toBeInTheDocument();
    expect(screen.getByText('Automated Test Suites')).toBeInTheDocument();
    expect(screen.getByText('Build & Quality Gate')).toBeInTheDocument();
  });

  it('displays the active branch badge', () => {
    render(<App />);

    const branchBadges = screen.getAllByText(/feature\/personal-goals/i);
    expect(branchBadges.length).toBeGreaterThanOrEqual(1);
    expect(branchBadges[0]).toBeInTheDocument();
  });
});
