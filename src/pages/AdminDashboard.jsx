import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import QuestionCard from '../components/QuestionCard'
import dsaLogo from '/dsa-logo white bar-converted-from-png.svg'
import Stars from '../components/Stars'

export default function AdminDashboard() {
  const [questions, setQuestions] = useState([])
  const [displayQuestions, setDisplayQuestions] = useState([])
  const [loading, setLoading] = useState(true)
  const [deduping, setDeduping] = useState(false)
  const [filter, setFilter] = useState('all')
  const [focusedIndex, setFocusedIndex] = useState(null)
  const [showRaw, setShowRaw] = useState(false)
  const navigate = useNavigate()
  const aiRunningRef = useRef(false)

  useEffect(() => {
    fetchAndProcess()
    const channel = supabase
      .channel('questions-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'questions' }, fetchAndProcess)
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [])

  // ── 1. Fetch all, send only unprocessed to AI ──────────────────
  async function fetchAndProcess() {
    console.log('[Dashboard] Fetching questions...')
    const { data, error } = await supabase
      .from('questions')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) { console.error('[Dashboard] Fetch error:', error); return }

    const all = data || []
    console.log('[Dashboard] Fetched', all.length, 'total,',
      all.filter(q => !q.ai_processed).length, 'unprocessed')

    setQuestions(all)
    setLoading(false)

    const unprocessed = all.filter(q => !q.ai_processed)

    if (unprocessed.length > 0 && !aiRunningRef.current) {
      await processWithAI(unprocessed, all)
    } else {
      console.log('[Dashboard] No new questions for AI, building display from DB')
      buildDisplayList(all)
    }
  }

  // ── 2. AI groups only the new questions, aware of existing groups ──
 async function processWithAI(unprocessed, allQuestions) {
    if (aiRunningRef.current) return
    aiRunningRef.current = true
    setDeduping(true)
    console.log('[AI] Processing', unprocessed.length, 'new questions')

    // ── Models to try in order ──────────────────────────────────────
    const MODELS = [
      'openai/gpt-oss-20b:free',
      'openai/gpt-oss-120b:free',
      'meta-llama/llama-3.2-3b-instruct:free',
      'mistralai/mistral-7b-instruct:free',
      'qwen/qwen-2.5-7b-instruct:free',
    ]

    // ── Build prompt ────────────────────────────────────────────────
    const existingGroups = {}
    allQuestions
      .filter(q => q.ai_processed && q.ai_group_id)
      .forEach(q => {
        if (!existingGroups[q.ai_group_id]) existingGroups[q.ai_group_id] = q.question
      })

    const existingContext = Object.entries(existingGroups)
      .map(([gid, text]) => `  "${gid}" => "${text}"`)
      .join('\n')

    const newList = unprocessed
      .map((q, i) => `  ${i}: id="${q.id}" question="${q.question}"`)
      .join('\n')

    const prompt = `You group similar/duplicate questions for a Q&A session.

${existingContext ? `EXISTING GROUPS:\n${existingContext}\n\n` : ''}NEW QUESTIONS:\n${newList}

For each new question assign a group_id:
- If similar to an existing group, reuse that exact group_id
- Otherwise create a new short slug like "g_speaker" or "g_food"

Return ONLY a JSON array, no markdown, no explanation:
[{"id":"<uuid>","group_id":"<slug>"},...]`

    // ── Try each model until one works ──────────────────────────────
    async function tryModels() {
      for (const model of MODELS) {
        try {
          console.log('[AI] Trying model:', model)

          const controller = new AbortController()
          const timeout = setTimeout(() => controller.abort(), 10000) // 10s timeout per model

          const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            signal: controller.signal,
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${import.meta.env.VITE_OPENROUTER_API_KEY}`
            },
            body: JSON.stringify({
              model,
              messages: [
                { role: 'system', content: 'Return only valid JSON arrays. No explanation, no markdown backticks.' },
                { role: 'user', content: prompt }
              ],
              temperature: 0
            })
          })

          clearTimeout(timeout)

          const data = await response.json()

          if (!response.ok) {
            throw new Error(`${response.status}: ${data.error?.message || 'API error'}`)
          }

          const text = data.choices?.[0]?.message?.content?.trim() ?? ''
          if (!text) throw new Error('Empty response from model')

          const clean = text.replace(/```json|```/g, '').trim()

          // Extract JSON array even if model added extra text around it
          const jsonMatch = clean.match(/\[[\s\S]*\]/)
          if (!jsonMatch) throw new Error('No JSON array found in response')

          const assignments = JSON.parse(jsonMatch[0])

          if (!Array.isArray(assignments) || assignments.length === 0) {
            throw new Error('Empty or invalid assignments array')
          }

          console.log('[AI] ✅ Success with model:', model, '— got', assignments.length, 'assignments')
          return assignments

        } catch (err) {
          console.warn(`[AI] ❌ Model ${model} failed:`, err.message, '— trying next...')
          // Small delay before trying next model
          await new Promise(r => setTimeout(r, 500))
        }
      }
      return null // all models failed
    }

    try {
      const assignments = await tryModels()

      if (assignments) {
        // ── Write group_id + ai_processed=true back to DB ──────────
        await Promise.all(
          assignments.map(({ id, group_id }) =>
            supabase
              .from('questions')
              .update({ ai_processed: true, ai_group_id: group_id })
              .eq('id', id)
          )
        )
        console.log('[AI] Saved', assignments.length, 'group assignments to DB')

        // Safety net: mark anything AI missed
        const assignedIds = new Set(assignments.map(a => a.id))
        const missed = unprocessed.filter(q => !assignedIds.has(q.id))
        if (missed.length > 0) {
          console.warn('[AI] Missed', missed.length, 'questions — applying fallback group ids')
          await Promise.all(
            missed.map(q =>
              supabase
                .from('questions')
                .update({ ai_processed: true, ai_group_id: `g_misc_${q.id.slice(0, 6)}` })
                .eq('id', q.id)
            )
          )
        }
      } else {
        // ── All models failed — graceful fallback ──────────────────
        // Instead of unique group per question, do simple text-based
        // local dedup as best-effort (no AI needed)
        console.warn('[AI] All models failed — running local text dedup fallback')

        const groupMap = {} // normalized text → group_id

        const localAssignments = unprocessed.map(q => {
          // Normalize: lowercase, strip punctuation, trim
          const normalized = q.question
            .toLowerCase()
            .replace(/[^a-z0-9\s]/g, '')
            .replace(/\s+/g, ' ')
            .trim()

          // Check if very similar to existing local group (first 40 chars as key)
          const shortKey = normalized.slice(0, 40)

          // Also check against existing DB groups by comparing words
          const existingMatch = Object.entries(existingGroups).find(([, text]) => {
            const existNorm = text.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim()
            const overlap = normalized.split(' ').filter(w => w.length > 3 && existNorm.includes(w))
            return overlap.length >= 2
          })

          if (existingMatch) {
            return { id: q.id, group_id: existingMatch[0] }
          }

          if (groupMap[shortKey]) {
            return { id: q.id, group_id: groupMap[shortKey] }
          }

          // New group — create slug from first 3 meaningful words
          const slug = normalized
            .split(' ')
            .filter(w => w.length > 3)
            .slice(0, 3)
            .join('_')
            .slice(0, 30) || q.id.slice(0, 6)

          const group_id = `g_${slug}`
          groupMap[shortKey] = group_id
          return { id: q.id, group_id }
        })

        await Promise.all(
          localAssignments.map(({ id, group_id }) =>
            supabase
              .from('questions')
              .update({ ai_processed: true, ai_group_id: group_id })
              .eq('id', id)
          )
        )
        console.log('[AI] Local fallback saved', localAssignments.length, 'assignments')
      }

      // ── Re-fetch and rebuild display ──────────────────────────────
      const { data: fresh } = await supabase
        .from('questions')
        .select('*')
        .order('created_at', { ascending: false })

      const freshAll = fresh || []
      setQuestions(freshAll)
      buildDisplayList(freshAll)

    } catch (err) {
      // Last resort — just show everything unfiltered, don't mark processed
      // so it retries next time
      console.error('[AI] Critical failure:', err)
      buildDisplayList(allQuestions)
    } finally {
      aiRunningRef.current = false
      setDeduping(false)
    }
  }

  // ── 5. Pick one representative per group (oldest = most original) ──
  function buildDisplayList(all) {
    const seen = new Set()
    const deduped = []

    // go oldest→newest so the original question is kept per group
    const oldestFirst = [...all].reverse()

    for (const q of oldestFirst) {
      const key = q.ai_group_id || `solo_${q.id}`
      if (!seen.has(key)) {
        seen.add(key)
        deduped.push(q)
      }
    }

    // reverse back so newest groups appear first in list
    const final = deduped.reverse()
    console.log('[Display]', final.length, 'unique groups from', all.length, 'total questions')
    setDisplayQuestions(final)
  }

  async function handleToggleRead(id, currentValue) {
    await supabase.from('questions').update({ is_read: !currentValue }).eq('id', id)
    setQuestions(prev => prev.map(q => (q.id === id ? { ...q, is_read: !currentValue } : q)))
    setDisplayQuestions(prev => prev.map(q => (q.id === id ? { ...q, is_read: !currentValue } : q)))
  }

  async function handleDelete(id) {
    await supabase.from('questions').delete().eq('id', id)
    setQuestions(prev => prev.filter(q => q.id !== id))
    setDisplayQuestions(prev => prev.filter(q => q.id !== id))
    setFocusedIndex(null)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/admin')
  }

  const sourceQuestions = showRaw
    ? questions
    : (displayQuestions.length > 0 ? displayQuestions : questions)

  const filtered = sourceQuestions.filter(q => {
    if (filter === 'unread') return !q.is_read
    if (filter === 'read') return q.is_read
    return true
  })

  const unreadCount = sourceQuestions.filter(q => !q.is_read).length
  const removedCount = questions.length - displayQuestions.length

  function openQuestion(index) {
    console.log('[Dashboard] Opening index', index, filtered[index])
    setFocusedIndex(index)
  }

  function goPrev() {
    setFocusedIndex(i => (i > 0 ? i - 1 : filtered.length - 1))
  }

  function goNext() {
    setFocusedIndex(i => (i < filtered.length - 1 ? i + 1 : 0))
  }

  useEffect(() => {
    if (focusedIndex === null) return
    function onKey(e) {
      if (e.key === 'ArrowLeft') goPrev()
      else if (e.key === 'ArrowRight') goNext()
      else if (e.key === 'Escape') setFocusedIndex(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [focusedIndex, filtered.length])

  const focusedQuestion = focusedIndex !== null ? filtered[focusedIndex] : null
  const questionText = focusedQuestion?.question ?? ''

  return (
    <div className="stars-bg page-dashboard">
      <Stars />
      <img src={dsaLogo} alt="DSA Club" className="site-logo" />
      <span className="page-title">The Exit Talk</span>

      <header className="dashboard-header">
        <div className="nav-right">
          <button className="btn-logout" onClick={handleLogout}>Sign Out</button>
        </div>
        <h1>Questions Inbox</h1>
        <p className="subtitle">
          {showRaw ? questions.length : (displayQuestions.length || questions.length)} question
          {(showRaw ? questions.length : (displayQuestions.length || questions.length)) !== 1 && 's'}
          {!showRaw && removedCount > 0 && (
            <span className="ai-badge"> ✦ AI filtered ({removedCount} duplicates removed)</span>
          )}
        </p>
      </header>

      <div className="filter-tabs">
        {['all', 'unread', 'read'].map(f => (
          <button
            key={f}
            className={`tab ${filter === f ? 'tab-active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
            {f === 'unread' && unreadCount > 0 && <span className="tab-count">{unreadCount}</span>}
          </button>
        ))}

        <button
          className={`tab tab-ai ${!showRaw ? 'tab-active' : ''}`}
          onClick={() => setShowRaw(r => !r)}
          disabled={deduping}
          title={showRaw ? 'Show AI-filtered' : 'Show all including duplicates'}
        >
          {deduping ? '✦ Processing…' : showRaw ? '✦ Show Unique' : '✦ AI On'}
        </button>
      </div>

      <main className="dashboard-list">
        {loading ? (
          <div className="spinner" />
        ) : deduping ? (
          <div className="empty-state"><p>✦ AI is grouping new questions…</p></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state"><p>No {filter !== 'all' ? filter : ''} questions yet.</p></div>
        ) : (
          filtered.map((q, index) => (
            <QuestionCard
              key={q.id}
              q={q}
              onToggleRead={handleToggleRead}
              onDelete={handleDelete}
              onSelect={() => openQuestion(index)}
            />
          ))
        )}
      </main>

      {focusedQuestion && (
        <div className="fs-screen" onClick={() => setFocusedIndex(null)}>
          <button className="fs-close" onClick={() => setFocusedIndex(null)}>&times;</button>
          
          <div className="fs-counter">{focusedIndex + 1} / {filtered.length}</div>
          
          <div className="fs-actions">
            <button 
              className={`fs-btn ${focusedQuestion?.is_read ? 'fs-btn-unread' : 'fs-btn-read'}`}
              onClick={(e) => {
                e.stopPropagation();
                handleToggleRead(focusedQuestion.id, focusedQuestion.is_read);
              }}
            >
              {focusedQuestion?.is_read ? 'Mark Unread' : 'Mark as Read'}
            </button>
            <button 
              className="fs-btn fs-btn-delete"
              onClick={(e) => {
                e.stopPropagation();
                if(confirm('Delete this question?')) {
                  handleDelete(focusedQuestion.id);
                  setFocusedIndex(null);
                }
              }}
            >
              Delete
            </button>
          </div>

          <main className="fs-card-container" onClick={e => e.stopPropagation()}>
            <div className="fs-glass-card">
              <p className="fs-text">{questionText || '(no question text found)'}</p>
            </div>

            <div className="fs-arrows-row">
              <button className="fs-arrow-circle" onClick={goPrev} aria-label="Previous">
                &#8249;
              </button>
              <button className="fs-arrow-circle" onClick={goNext} aria-label="Next">
                &#8250;
              </button>
            </div>
          </main>
        </div>
      )}
    </div>
  )
}