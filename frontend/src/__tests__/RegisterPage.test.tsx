import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import RegisterPage from '../pages/RegisterPage'
import api from '../api'

const apiMock = api as any

describe('RegisterPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  function renderRegister() {
    return render(
      <MemoryRouter>
        <RegisterPage />
      </MemoryRouter>
    )
  }

  // Helpers: inputs have no id/htmlFor — query by type/placeholder
  function nameInput()     { return document.querySelector('input[type="text"]') as HTMLInputElement }
  function emailInput()    { return document.querySelector('input[type="email"]') as HTMLInputElement }
  function passwordInput() { return document.querySelector('input[type="password"]') as HTMLInputElement }

  it('renders heading "Konto erstellen"', () => {
    renderRegister()
    expect(screen.getByRole('heading', { name: /Konto erstellen/i })).toBeInTheDocument()
  })

  it('renders name, email, and password inputs', () => {
    renderRegister()
    expect(nameInput()).toBeInTheDocument()
    expect(emailInput()).toBeInTheDocument()
    expect(passwordInput()).toBeInTheDocument()
  })

  it('renders submit button', () => {
    renderRegister()
    expect(screen.getByRole('button', { name: /kostenlos starten/i })).toBeInTheDocument()
  })

  it('renders link to login page', () => {
    renderRegister()
    expect(screen.getByRole('link', { name: /Anmelden/i })).toBeInTheDocument()
  })

  it('shows pricing info (99 € / Jahr)', () => {
    renderRegister()
    // "99" appears in both the price display and plan description
    expect(screen.getAllByText(/99/).length).toBeGreaterThan(0)
  })

  it('stores token in localStorage on successful registration', async () => {
    apiMock.post.mockResolvedValue({
      data: { token: 'new-jwt', user: { id: '2', email: 'new@example.com' } },
    })

    renderRegister()
    await userEvent.type(nameInput()!, 'Anja Müller')
    await userEvent.type(emailInput()!, 'new@example.com')
    await userEvent.type(passwordInput()!, 'securepass123')
    fireEvent.submit(screen.getByRole('button', { name: /kostenlos starten/i }))

    await waitFor(() => {
      expect(localStorage.getItem('salon_token')).toBe('new-jwt')
    })
  })

  it('shows error when email already exists', async () => {
    apiMock.post.mockRejectedValue({
      response: { data: { error: 'E-Mail bereits vergeben' } },
    })

    renderRegister()
    await userEvent.type(nameInput()!, 'Test')
    await userEvent.type(emailInput()!, 'taken@example.com')
    await userEvent.type(passwordInput()!, 'password123')
    fireEvent.submit(screen.getByRole('button', { name: /kostenlos starten/i }))

    await waitFor(() => {
      expect(screen.getByText(/E-Mail bereits vergeben/i)).toBeInTheDocument()
    })
  })

  it('posts to /auth/register with name, email, password', async () => {
    apiMock.post.mockResolvedValue({
      data: { token: 'tok', user: { id: '3', email: 'max@example.com' } },
    })

    renderRegister()
    await userEvent.type(nameInput()!, 'Max')
    await userEvent.type(emailInput()!, 'max@example.com')
    await userEvent.type(passwordInput()!, 'password123')
    fireEvent.submit(screen.getByRole('button', { name: /kostenlos starten/i }))

    await waitFor(() => {
      expect(apiMock.post).toHaveBeenCalledWith('/auth/register', {
        name: 'Max',
        email: 'max@example.com',
        password: 'password123',
      })
    })
  })

  it('shows generic fallback error when no response message', async () => {
    apiMock.post.mockRejectedValue(new Error('Network Error'))

    renderRegister()
    await userEvent.type(nameInput()!, 'Test')
    await userEvent.type(emailInput()!, 'test@example.com')
    await userEvent.type(passwordInput()!, 'password123')
    fireEvent.submit(screen.getByRole('button', { name: /kostenlos starten/i }))

    await waitFor(() => {
      expect(screen.getByText(/fehlgeschlagen/i)).toBeInTheDocument()
    })
  })
})
