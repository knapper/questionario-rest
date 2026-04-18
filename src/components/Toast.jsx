export function ToastContainer({ toasts }) {
  if (!toasts.length) return null
  return (
    <div className="toast-wrap" role="status" aria-live="polite">
      {toasts.map(t => (
        <div key={t.id} className={`toast toast--${t.type}`}>{t.msg}</div>
      ))}
    </div>
  )
}
