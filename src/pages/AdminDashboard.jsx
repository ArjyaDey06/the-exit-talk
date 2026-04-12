import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import QuestionCard from '../components/QuestionCard'
import dsaLogo from '/dsa-logo white bar.png'

export default function AdminDashboard() {
  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // all | unread | read
  const navigate = useNavigate()

  /* ── Fetch + Real-time ─────────────────────────── */
  useEffect(() => {
    fetchQuestions()

    const channel = supabase
      .channel('questions-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'questions' }, () => {
        fetchQuestions()
      })
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [])

  async function fetchQuestions() {
    const { data } = await supabase
      .from('questions')
      .select('*')
      .order('created_at', { ascending: false })
    setQuestions(data || [])
    setLoading(false)
  }

  /* ── Actions ───────────────────────────────────── */
  async function handleToggleRead(id, currentValue) {
    await supabase
      .from('questions')
      .update({ is_read: !currentValue })
      .eq('id', id)
    setQuestions(prev =>
      prev.map(q => (q.id === id ? { ...q, is_read: !currentValue } : q))
    )
  }

  async function handleDelete(id) {
    await supabase.from('questions').delete().eq('id', id)
    setQuestions(prev => prev.filter(q => q.id !== id))
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/admin')
  }

  /* ── Filter ────────────────────────────────────── */
  const filtered = questions.filter(q => {
    if (filter === 'unread') return !q.is_read
    if (filter === 'read') return q.is_read
    return true
  })

  const unreadCount = questions.filter(q => !q.is_read).length

  return (
    <div className="stars-bg page-dashboard">
      <ShootingStars />

      {/* Navbar */}
      <nav className="navbar navbar-dashboard">
        <img src={dsaLogo} alt="DSA Club" className="nav-logo" />
        <div className="nav-right">
          {unreadCount > 0 && (
            <span className="unread-badge">{unreadCount} unread</span>
          )}
          <button className="btn-logout" onClick={handleLogout}>
            Sign Out
          </button>
        </div>
      </nav>

      {/* Header */}
      <header className="dashboard-header">
        <h1>Questions Inbox</h1>
        <p className="subtitle">{questions.length} question{questions.length !== 1 && 's'} received</p>
      </header>

      {/* Filter Tabs */}
      <div className="filter-tabs">
        {['all', 'unread', 'read'].map(f => (
          <button
            key={f}
            className={`tab ${filter === f ? 'tab-active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
            {f === 'unread' && unreadCount > 0 && (
              <span className="tab-count">{unreadCount}</span>
            )}
          </button>
        ))}
      </div>

      {/* Questions List */}
      <main className="dashboard-list">
        {loading ? (
          <div className="spinner" />
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <p>No {filter !== 'all' ? filter : ''} questions yet.</p>
          </div>
        ) : (
          filtered.map(q => (
            <QuestionCard
              key={q.id}
              q={q}
              onToggleRead={handleToggleRead}
              onDelete={handleDelete}
            />
          ))
        )}
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
