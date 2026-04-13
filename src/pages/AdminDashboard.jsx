import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import QuestionCard from '../components/QuestionCard'
import dsaLogo from '/dsa-logo white bar-converted-from-png.svg'
import Stars from '../components/Stars'

export default function AdminDashboard() {
  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // all | unread | read
  const [selectedQuestion, setSelectedQuestion] = useState(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const navigate = useNavigate()

  useEffect(() => {
    fetchQuestions()
    const channel = supabase
      .channel('questions-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'questions' }, fetchQuestions)
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

  /* Filter */
  const filtered = questions.filter(q => {
    if (filter === 'unread') return !q.is_read
    if (filter === 'read') return q.is_read
    return true
  })

  const unreadCount = questions.filter(q => !q.is_read).length

  function openQuestion(question, index) {
    setSelectedQuestion(question)
    setCurrentIndex(index)
  }

  function goToPrevious() {
    if (filtered.length === 0) return
    const newIndex = currentIndex > 0 ? currentIndex - 1 : filtered.length - 1
    setSelectedQuestion(filtered[newIndex])
    setCurrentIndex(newIndex)
  }

  function goToNext() {
    if (filtered.length === 0) return
    const newIndex = currentIndex < filtered.length - 1 ? currentIndex + 1 : 0
    setSelectedQuestion(filtered[newIndex])
    setCurrentIndex(newIndex)
  }

  useEffect(() => {
    function handleKeyDown(e) {
      if (!selectedQuestion) return
      if (e.key === 'ArrowLeft') goToPrevious()
      else if (e.key === 'ArrowRight') goToNext()
      else if (e.key === 'Escape') setSelectedQuestion(null)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedQuestion, currentIndex, filtered])

  return (
    <div className="stars-bg page-dashboard">
      <Stars />
      <img src={dsaLogo} alt="DSA Club" className="site-logo" />
      <span className="page-title">The Exit Talk</span>

      {/* Header */}
      <header className="dashboard-header">
        <div className="nav-right">
          <button className="btn-logout" onClick={handleLogout}>
            Sign Out
          </button>
        </div>
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
          filtered.map((q, index) => (
            <QuestionCard
              key={q.id}
              q={q}
              onToggleRead={handleToggleRead}
              onDelete={handleDelete}
              onSelect={() => openQuestion(q, index)}
            />
          ))
        )}
      </main>

      {/* Focus Overlay */}
      {selectedQuestion && (
        <div className="focus-overlay" onClick={() => setSelectedQuestion(null)}>
          {/* Navigation Outside Card */}
          <div className="focus-nav-overlay" onClick={e => e.stopPropagation()}>
            <button className="focus-arrow focus-prev" onClick={e => {
              e.stopPropagation()
              goToPrevious()
            }} disabled={filtered.length <= 1}>
              &#8249;
            </button>
            <span className="focus-counter">{currentIndex + 1} / {filtered.length}</span>
            <button className="focus-arrow focus-next" onClick={e => {
              e.stopPropagation()
              goToNext()
            }} disabled={filtered.length <= 1}>
              &#8250;
            </button>
          </div>
          
          <div className="focus-card" onClick={e => e.stopPropagation()}>
            <button className="focus-close" onClick={() => setSelectedQuestion(null)}>
              &times;
            </button>
            
            <div className="focus-content">
              <span className={`badge ${selectedQuestion.is_read ? 'badge-read' : 'badge-unread'}`}>
                {selectedQuestion.is_read ? ' Read' : ' Unread'}
              </span>
              <p className="focus-text">{selectedQuestion.question}</p>
              <div className="focus-actions">
                <button
                  className="btn-primary focus-btn"
                  onClick={() => {
                    handleToggleRead(selectedQuestion.id, selectedQuestion.is_read)
                    // Update the selected question state without closing the modal
                    setSelectedQuestion(prev => ({ 
                      ...prev, 
                      is_read: !prev.is_read 
                    }))
                  }}
                >
                  {selectedQuestion.is_read ? 'Mark Unread' : 'Mark Read'}
                </button>
                <button
                  className="btn-danger focus-btn"
                  onClick={() => {
                    handleDelete(selectedQuestion.id)
                    setSelectedQuestion(null)
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}