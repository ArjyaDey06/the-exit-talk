import { useState } from 'react'
import { supabase } from '../supabase'
import dsaLogo from '/dsa-logo white bar.png'

export default function SubmitPage() {
  const [question, setQuestion] = useState('')
  const [status, setStatus] = useState('idle') // idle | loading | success | error
  const [error, setError] = useState('')
  const charLimit = 500

  async function handleSubmit(e) {
    e.preventDefault()
    const trimmed = question.trim()
    if (!trimmed) return
    setStatus('loading')
    setError('')

    const { error: sbError } = await supabase
      .from('questions')
      .insert({ question: trimmed })

    if (sbError) {
      setError('Something went wrong. Please try again.')
      setStatus('error')
    } else {
      setStatus('success')
      setQuestion('')
    }
  }

  return (
    <div className="stars-bg page-submit">
      <ShootingStars />

      {/* Navbar */}
      <nav className="navbar">
        <img src={dsaLogo} alt="DSA Club" className="nav-logo" />
      </nav>

      {/* Card */}
      <main className="submit-container">
        {status === 'success' ? (
          <div className="success-card">
            <div className="success-icon">🚀</div>
            <h2>Question Submitted!</h2>
            <p>Your question has been sent to the panel. We'll get to it during the Q&amp;A session.</p>
            <button className="btn-primary" onClick={() => setStatus('idle')}>
              Ask Another
            </button>
          </div>
        ) : (
          <div className="glass-card">
            <div className="card-header">
              <h1>Ask the Panel</h1>
              <p className="subtitle">
                Submit your DSA question anonymously — the best ones get answered live.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="submit-form">
              <div className="textarea-wrap">
                <textarea
                  id="question-input"
                  placeholder="Type your question here…"
                  value={question}
                  onChange={e => setQuestion(e.target.value.slice(0, charLimit))}
                  rows={5}
                  required
                />
                <span className={`char-count ${question.length >= charLimit ? 'limit' : ''}`}>
                  {question.length}/{charLimit}
                </span>
              </div>

              {status === 'error' && <p className="form-error">{error}</p>}

              <button
                type="submit"
                className="btn-primary"
                disabled={status === 'loading' || !question.trim()}
              >
                {status === 'loading' ? (
                  <span className="btn-spinner" />
                ) : (
                  'Submit Question →'
                )}
              </button>
            </form>

            <p className="anon-note">100% anonymous · No login required</p>
          </div>
        )}
      </main>
    </div>
  )
}

/* ── Shooting Stars ────────────────────────────────── */
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
