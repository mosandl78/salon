import { Routes, Route, Navigate } from 'react-router-dom'
import DashboardPage from './pages/DashboardPage'
import SalonPage     from './pages/SalonPage'
import AdminPage     from './pages/AdminPage'
import LoginPage     from './pages/LoginPage'
import RegisterPage  from './pages/RegisterPage'
import LandingPage          from './pages/LandingPage'
import DemoPage             from './pages/DemoPage'
import ImpressumPage        from './pages/ImpressumPage'
import DatenschutzPage      from './pages/DatenschutzPage'
import ForgotPasswordPage   from './pages/ForgotPasswordPage'
import ResetPasswordPage    from './pages/ResetPasswordPage'
import AccountPage          from './pages/AccountPage'
import KontaktPage          from './pages/KontaktPage'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('salon_token')
  if (!token) return <Navigate to="/start" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <Routes>
      <Route path="/start"     element={<LandingPage />} />
      <Route path="/login"     element={<LoginPage />} />
      <Route path="/register"  element={<RegisterPage />} />
      <Route path="/demo"      element={<DemoPage />} />
      <Route path="/"          element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      <Route path="/salon/:id" element={<ProtectedRoute><SalonPage /></ProtectedRoute>} />
      <Route path="/admin"       element={<ProtectedRoute><AdminPage /></ProtectedRoute>} />
      <Route path="/impressum"        element={<ImpressumPage />} />
      <Route path="/datenschutz"      element={<DatenschutzPage />} />
      <Route path="/forgot-password"  element={<ForgotPasswordPage />} />
      <Route path="/reset-password"   element={<ResetPasswordPage />} />
      <Route path="/account"           element={<ProtectedRoute><AccountPage /></ProtectedRoute>} />
      <Route path="/kontakt"           element={<KontaktPage />} />
    </Routes>
  )
}
