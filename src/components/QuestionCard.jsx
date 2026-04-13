export default function QuestionCard({ q, onToggleRead, onDelete, onSelect }) {
  const date = new Date(q.created_at).toLocaleString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })

  return (
    <div 
      className={`question-card ${q.is_read ? 'read' : 'unread'}`}
      onClick={() => onSelect(q)}
      style={{ cursor: 'pointer' }}
    >
      <div className="card-top">
        <span className={`badge ${q.is_read ? 'badge-read' : 'badge-unread'}`}>
          {q.is_read ? 'Read' : 'Unread'}
        </span>
        <span className="card-time">{date}</span>
      </div>

      <p className="card-question">
        {q.question}
      </p>

      <div className="card-actions" onClick={e => e.stopPropagation()}>
        <button
          className="btn-ghost"
          onClick={e => {
            e.stopPropagation()
            onToggleRead(q.id, q.is_read)
          }}
        >
          {q.is_read ? 'Unread' : 'Read'}
        </button>
        <button 
          className="btn-danger" 
          onClick={e => {
            e.stopPropagation()
            onDelete(q.id)
          }}
        >
          Delete
        </button>
      </div>
    </div>
  )
}
