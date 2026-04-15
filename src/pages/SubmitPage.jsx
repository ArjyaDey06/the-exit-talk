import { useState } from 'react'
import { supabase } from '../supabase'
import dsaLogo from '/dsa-logo white bar-converted-from-png.svg'
import Stars from '../components/Stars'

export default function SubmitPage() {
  const [question, setQuestion] = useState('')
  const [status, setStatus] = useState('idle') // idle | loading | success | error
  const [error, setError] = useState('')

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
      <Stars />
      <img src={dsaLogo} alt="DSA Club" className="site-logo" />
      <span className="page-title">The Exit Talk</span>

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
              <h1>Ask the panel as many questions as you want.</h1>
            </div>

            <form onSubmit={handleSubmit} className="submit-form">
              <div className="textarea-wrap">
                <textarea
                  id="question-input"
                  placeholder="Type your question here…"
                  value={question}
                  onChange={e => setQuestion(e.target.value)}
                  rows={5}
                  required
                />
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
                  'Submit Question'
                )}
              </button>
            </form>


          </div>
        )}
      </main>
    </div>
  )
}
