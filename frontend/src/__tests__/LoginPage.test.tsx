import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import LoginPage from '../pages/LoginPage'
import api from '../api'

const apiMock = api as any

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  function renderLogin() {
    return render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    )
  }

  // Helpers: inputs have no id/htmlFor so query by type
  function emailInput()    { return document.querySelector('input[type="email"]') as HTMLInputElement }
  function passwordInput() { return document.querySelector('input[type="password"]') as HTMLInputElement }

  it('renders the SALON heading', () => {
    renderLogin()
    expect(screen.getByRole('heading', { name: /SALON/i })).toBeInTheDocument()
  })

  it('renders email and password inputs', () => {
    renderLogin()
    expect(emailInput()).toBeInTheDocument()
    expect(passwordInput()).toBeInTheDocument()
  })

  it('renders submit button', () => {
    renderLogin()
    expect(screen.getByRole('button', { name: /Anmelden/i })).toBeInTheDocument()
  })

  it('renders link to register page', () => {
    renderLogin()
    expect(screen.getByRole('link', { name: /Registrieren/i })).toBeInTheDocument()
  })

  it('stores token in localStorage on successful login', async () => {
    apiMock.post.mockResolvedValue({
      data: { token: 'test-jwt', user: { id: '1', email: 'test@example.com' } },
    })

    renderLogin()
    await userEvent.type(emailInput()!, 'test@example.com')
    await userEvent.type(passwordInput()!, 'password123')
    fireEvent.submit(screen.getByRole('button', { name: /Anmelden/i }))

    await waitFor(() => {
      expect(localStorage.getItem('salon_token')).toBe('test-jwt')
    })
  })

  it('calls api.post with email and password', async () => {
    apiMock.post.mockResolvedValue({
      data: { token: 'jwt', user: { id: '1', email: 'u@example.com' } },
    })

    renderLogin()
    await userEvent.type(emailInput()!, 'u@example.com')
    await userEvent.type(passwordInput()!, 'mypass123')
    fireEvent.submit(screen.getByRole('button', { name: /Anmelden/i }))

    await waitFor(() => {
      expect(apiMock.post).toHaveBeenCalledWith('/auth/login', {
        email: 'u@example.com',
        password: 'mypass123',
      })
    })
  })

  it('shows error message on failed login', async () => {
    apiMock.post.mockRejectedValue({
      response: { data: { error: 'Ungültige Anmeldedaten' } },
    })

    renderLogin()
    await userEvent.type(emailInput()!, 'bad@example.com')
    await userEvent.type(passwordInput()!, 'wrongpass')
    fireEvent.submit(screen.getByRole('button', { name: /Anmelden/i }))

    await waitFor(() => {
      expect(screen.getByText(/Ungültige Anmeldedaten/i)).toBeInTheDocument()
    })
  })

  it('shows generic error when response has no error message', async () => {
    apiMock.post.mockRejectedValue(new Error('Network Error'))

    renderLogin()
    await userEvent.type(emailInput()!, 'test@example.com')
    await userEvent.type(passwordInput()!, 'password123')
    fireEvent.submit(screen.getByRole('button', { name: /Anmelden/i }))

    await waitFor(() => {
      expect(screen.getByText(/fehlgeschlagen/i)).toBeInTheDocument()
    })
  })

  it('disables button while loading', async () => {
    apiMock.post.mockReturnValue(new Promise(() => {}))

    renderLogin()
    await userEvent.type(emailInput()!, 'test@example.com')
    await userEvent.type(passwordInput()!, 'password123')
    fireEvent.submit(screen.getByRole('button', { name: /Anmelden/i }))

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Anmelden/i })).toBeDisabled()
    })
  })
})
