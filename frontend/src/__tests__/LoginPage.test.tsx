import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import LoginPage from '@/app/login/page';
import { AuthProvider } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { IApiClient } from '@/services/api-client';
import { USER_ROLE } from '@/types/inquiry.types';

const pushMock = vi.fn();
const replaceMock = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: pushMock,
    replace: replaceMock,
  }),
}));

describe('LoginPage Split-Card Component', () => {
  it('renders Coffee Ninja split-card sign-in UI, switches demo accounts, and signs in', async () => {
    const user = userEvent.setup();
    const loginMock = vi.fn().mockResolvedValue({
      id: '33333333-3333-4333-8333-333333333333',
      email: 'manager@coffeeninja.local',
      name: 'Nadia Fernando',
      role: USER_ROLE.MANAGER,
    });

    const mockClient: IApiClient = {
      login: loginMock,
      logout: vi.fn(),
      getCurrentUser: vi.fn().mockRejectedValue(new Error('Not signed in')),
      listInquiries: vi.fn(),
      getInquiryById: vi.fn(),
      createInquiry: vi.fn(),
      updateInquiryStatus: vi.fn(),
    };

    render(
      <ThemeProvider>
        <AuthProvider client={mockClient}>
          <LoginPage />
        </AuthProvider>
      </ThemeProvider>
    );

    expect(
      screen.getByRole('img', {
        name: /Coffee Ninja customer inquiry workflow illustration/i,
      })
    ).toBeInTheDocument();

    await user.type(
      screen.getByLabelText(/Staff Email Address/i),
      'manager@coffeeninja.local'
    );
    await user.type(screen.getByLabelText(/Password/i), 'ManagerPass123!');
    expect(screen.getByText('MANAGER')).toBeInTheDocument();

    await user.click(
      screen.getByRole('button', { name: /Sign In to Workspace!/i })
    );

    expect(loginMock).toHaveBeenCalledWith(
      'manager@coffeeninja.local',
      'ManagerPass123!'
    );
    expect(pushMock).toHaveBeenCalledWith('/inquiries');
  });
});

