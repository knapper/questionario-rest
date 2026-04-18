
export default function DashboardView({ questionSet, onStartGame, onNewSet, addToast }) {
  const { name, questions } = questionSet
  const totalPoints = questions.reduce((s, q) => s + (q.points || 0), 0)

  const downloadJSON = () => {
    const blob = new Blob([JSON.stringify(questionSet, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${name.replace(/\s+/g, '_')}_backup.json`
    a.click()
    URL.revokeObjectURL(url)
    addToast('Backup downloaded!', 'success')
  }

  return (
    <div className="page">
      <div className="container--wide">
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 40, flexWrap: 'wrap', gap: 16 }}>
          <div className="logo">
            <span className="logo__icon">🎯</span>
            Questionario
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button id="btn-new-set" className="btn btn--ghost btn--sm" onClick={onNewSet}>
              ← New Set
            </button>
            <button id="btn-download-json" className="btn btn--ghost btn--sm" onClick={downloadJSON}>
              ⬇ Download Backup
            </button>
          </div>
        </div>

        {/* Title */}
        <div className="anim-fade-up" style={{ textAlign: 'center', marginBottom: 40 }}>
          <span className="badge badge--primary" style={{ marginBottom: 12 }}>Dashboard</span>
          <h1 className="heading-xl">{name}</h1>
          <p className="text-muted" style={{ marginTop: 8 }}>Ready to play — review the details and start the game.</p>
        </div>

        {/* Stats */}
        <div className="anim-fade-up" style={{ animationDelay: '0.1s', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, marginBottom: 40 }}>
          <div className="stat-card">
            <div className="stat-card__value">{questions.length}</div>
            <div className="stat-card__label">Questions</div>
          </div>
          <div className="stat-card">
            <div className="stat-card__value">{totalPoints}</div>
            <div className="stat-card__label">Max Points</div>
          </div>
          <div className="stat-card">
            <div className="stat-card__value">{questions.filter(q => q.type === 'multiple').length}</div>
            <div className="stat-card__label">Multiple Choice</div>
          </div>
          <div className="stat-card">
            <div className="stat-card__value">{questions.filter(q => q.type === 'truefalse').length}</div>
            <div className="stat-card__label">True / False</div>
          </div>
        </div>

        {/* Game Mode CTA */}
        <div className="anim-fade-up" style={{ animationDelay: '0.15s', textAlign: 'center', marginBottom: 48 }}>
          <button
            id="btn-choose-mode"
            className="btn btn--primary btn--lg"
            onClick={onStartGame}
            style={{ animation: 'pulse-ring 2s infinite', fontSize: '1.2rem', padding: '18px 56px' }}
          >
            🎮 Choose Game Mode
          </button>
          <p className="text-muted text-sm" style={{ marginTop: 12 }}>
            Pick a game style — Solo or Team vs Team.
          </p>
        </div>


      </div>
    </div>
  )
}
