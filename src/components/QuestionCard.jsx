export default function QuestionCard({ q, onToggleRead, onDelete, onSelect }) {
  const date = new Date(q.created_at).toLocaleString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })

  return (
    <div className={`question-card ${q.is_read ? 'read' : 'unread'}`}>
      <div className="card-top">
        <span className={`badge ${q.is_read ? 'badge-read' : 'badge-unread'}`}>
          {q.is_read ? '✓ Read' : '● Unread'}
        </span>
        <span className="card-time">{date}</span>
      </div>

      <p className="card-question" onClick={() => onSelect(q)} style={{ cursor: 'pointer' }}>
        {q.question}
      </p>

      <div className="card-actions">
        <button
          className="btn-ghost"
          onClick={() => onToggleRead(q.id, q.is_read)}
        >
          {q.is_read ? 'Mark Unread' : 'Mark Read'}
        </button>
        <button className="btn-danger" onClick={() => onDelete(q.id)}>
          Delete
        </button>
      </div>
    </div>
  )
}
