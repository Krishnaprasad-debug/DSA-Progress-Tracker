import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { AuthProvider } from '../context/AuthContext';
import { AuthModal } from '../components/auth/AuthModal';
import { ProtectedRoute } from '../components/auth/ProtectedRoute';
import api from '../services/api';

vi.mock('../services/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

describe('Frontend Authentication Component Test Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(api.get).mockRejectedValue(new Error('Unauthenticated'));
  });

  it('renders AuthModal in login mode with email and password fields', async () => {
    await act(async () => {
      render(
        <AuthProvider>
          <AuthModal isOpen={true} onClose={vi.fn()} initialMode="login" />
        </AuthProvider>
      );
    });

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Welcome Back' })).toBeInTheDocument();
    expect(screen.getByLabelText(/Email Address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/Full Name/i)).not.toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Sign In' }).length).toBe(2);
  });

  it('toggles to register mode and displays Full Name input', async () => {
    await act(async () => {
      render(
        <AuthProvider>
          <AuthModal isOpen={true} onClose={vi.fn()} initialMode="login" />
        </AuthProvider>
      );
    });

    const registerTab = screen.getByRole('button', { name: 'Register' });
    fireEvent.click(registerTab);

    expect(screen.getByRole('heading', { name: 'Create an Account' })).toBeInTheDocument();
    expect(screen.getByLabelText(/Full Name/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create Account' })).toBeInTheDocument();
  });

  it('validates client-side inputs and shows error for short name in register mode', async () => {
    let container: HTMLElement;
    await act(async () => {
      const rendered = render(
        <AuthProvider>
          <AuthModal isOpen={true} onClose={vi.fn()} initialMode="register" />
        </AuthProvider>
      );
      container = rendered.container;
    });

    const nameInput = screen.getByLabelText(/Full Name/i);
    const emailInput = screen.getByLabelText(/Email Address/i);
    const passwordInput = screen.getByLabelText(/Password/i);
    const form = container!.querySelector('form')!;

    fireEvent.change(nameInput, { target: { value: 'A' } });
    fireEvent.change(emailInput, { target: { value: 'ada@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.submit(form);

    expect(screen.getByText(/Name must be at least 2 characters long/i)).toBeInTheDocument();
  });

  it('validates client-side inputs and shows error for invalid email', async () => {
    let container: HTMLElement;
    await act(async () => {
      const rendered = render(
        <AuthProvider>
          <AuthModal isOpen={true} onClose={vi.fn()} initialMode="login" />
        </AuthProvider>
      );
      container = rendered.container;
    });

    const emailInput = screen.getByLabelText(/Email Address/i);
    const passwordInput = screen.getByLabelText(/Password/i);
    const form = container!.querySelector('form')!;

    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.submit(form);

    expect(screen.getByText(/Please enter a valid email address/i)).toBeInTheDocument();
  });

  it('validates client-side inputs and shows error for short password', async () => {
    let container: HTMLElement;
    await act(async () => {
      const rendered = render(
        <AuthProvider>
          <AuthModal isOpen={true} onClose={vi.fn()} initialMode="login" />
        </AuthProvider>
      );
      container = rendered.container;
    });

    const emailInput = screen.getByLabelText(/Email Address/i);
    const passwordInput = screen.getByLabelText(/Password/i);
    const form = container!.querySelector('form')!;

    fireEvent.change(emailInput, { target: { value: 'ada@example.com' } });
    fireEvent.change(passwordInput, { target: { value: '123' } });
    fireEvent.submit(form);

    expect(screen.getByText(/Password must be at least 6 characters long/i)).toBeInTheDocument();
  });

  it('renders fallback content in ProtectedRoute when unauthenticated after initial auth check', async () => {
    render(
      <AuthProvider>
        <ProtectedRoute fallback={<div data-testid="guest-view">Guest Content</div>}>
          <div>Protected Content</div>
        </ProtectedRoute>
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('guest-view')).toBeInTheDocument();
    });
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });
});
