import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import dsaLogo from '/dsa-logo white bar.png'

export default function AdminLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  async function handleLogin(e) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error: sbError } = await supabase.auth.signInWithPassword({ email, password })

    if (sbError) {
      setError('Invalid credentials. Please try again.')
      setLoading(false)
    } else {
      navigate('/admin/dashboard')
    }
  }

  return (
    <div className="stars-bg page-admin-login">
      <ShootingStars />

      <nav className="navbar">
        <img src={dsaLogo} alt="DSA Club" className="nav-logo" />
      </nav>

      <main className="login-container">
        <div className="glass-card login-card">
          <div className="card-header">
            <div className="lock-icon">🔐</div>
            <h1>Admin Access</h1>
            <p className="subtitle">DSA Club — Q&amp;A Panel</p>
          </div>

          <form onSubmit={handleLogin} className="login-form">
            <div className="field">
              <label htmlFor="admin-email">Email</label>
              <input
                id="admin-email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <div className="field">
              <label htmlFor="admin-password">Password</label>
              <input
                id="admin-password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>

            {error && <p className="form-error">{error}</p>}

            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
            >
              {loading ? <span className="btn-spinner" /> : 'Sign In →'}
            </button>
          </form>
        </div>
      </main>
    </div>
  )
}

function ShootingStars() {
  const stars = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    top: `${Math.random() * 100}%`,
    left: `${Math.random() * 100}%`,
    delay: `${Math.random() * 10}s`,
    duration: `${3 + Math.random() * 5}s`,
  }))

  return (
    <div className="shooting-stars" aria-hidden="true">
      {stars.map(s => (
        <span
          key={s.id}
          className="star"
          style={{
            top: s.top,
            left: s.left,
            animationDelay: s.delay,
            animationDuration: s.duration,
          }}
        />
      ))}
    </div>
  )
}
