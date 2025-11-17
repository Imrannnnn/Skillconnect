import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthContext } from '../../context/auth.js';
import DashboardProvider from '../DashboardProvider.jsx';

// Mock API calls used inside DashboardProvider
vi.mock('../../api/axios.js', () => ({
  default: {
    get: vi.fn((url) => {
      if (url === '/payments') return Promise.resolve({ data: [] });
      if (url.startsWith('/users/')) {
        const id = url.split('/').pop();
        let providerMode = 'service';
        if (id === 'u2') providerMode = 'product';
        if (id === 'u3') providerMode = 'both';
        return Promise.resolve({ data: { _id: id, name: 'Test Provider', providerMode } });
      }
      if (url === '/wallet/me') return Promise.resolve({ data: null });
      if (url.startsWith('/wallet/transactions')) return Promise.resolve({ data: { items: [] } });
      return Promise.resolve({ data: {} });
    }),
  },
}));

function renderWithAuth(user) {
  return render(
    <AuthContext.Provider value={{ user }}>
      <MemoryRouter>
        <DashboardProvider />
      </MemoryRouter>
    </AuthContext.Provider>
  );
}

describe('DashboardProvider catalog visibility', () => {
  it('hides Manage product catalog for service-only providers', async () => {
    renderWithAuth({ _id: 'u1', name: 'Service Only', providerMode: 'service' });
    // Wait for initial dashboard content to ensure effects have run
    await screen.findByText(/Provider Dashboard/i);
    expect(
      screen.queryByText(/Manage product catalog/i)
    ).not.toBeInTheDocument();
  });

  it('shows Manage product catalog for product-only providers', async () => {
    renderWithAuth({ _id: 'u2', name: 'Product Only', providerMode: 'product' });
    await screen.findByText(/Provider Dashboard/i);
    expect(
      await screen.findByText(/Manage product catalog/i)
    ).toBeInTheDocument();
  });

  it('shows Manage product catalog for providers offering both', async () => {
    renderWithAuth({ _id: 'u3', name: 'Both', providerMode: 'both' });
    await screen.findByText(/Provider Dashboard/i);
    expect(
      await screen.findByText(/Manage product catalog/i)
    ).toBeInTheDocument();
  });
});
