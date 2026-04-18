export default function ModeSelectView({ questionSet, onSimple, onTeam, onBack }) {
  const { name, questions } = questionSet

  return (
    <div className="page">
      <div className="container" style={{ maxWidth: 640 }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 40 }}>
          <div className="logo">
            <span className="logo__icon">🎯</span>
            Questionario
          </div>
          <button id="btn-mode-back" className="btn btn--ghost btn--sm" onClick={onBack}>← Dashboard</button>
        </div>

        {/* Title */}
        <div className="anim-fade-up" style={{ textAlign: 'center', marginBottom: 40 }}>
          <span className="badge badge--primary" style={{ marginBottom: 12 }}>Game Mode</span>
          <h1 className="heading-xl" style={{ marginBottom: 10 }}>Choose How to Play</h1>
          <p className="text-muted">
            <strong style={{ color: 'var(--c-text)' }}>{name}</strong> · {questions.length} questions
          </p>
        </div>

        {/* Mode cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Simple Game */}
          <div className="card anim-fade-up" style={{ animationDelay: '0.1s' }}>
            <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap' }}>
              <div style={{
                minWidth: 64, height: 64,
                background: 'linear-gradient(135deg, rgba(108,99,255,0.2), rgba(108,99,255,0.05))',
                border: '1px solid rgba(108,99,255,0.35)',
                borderRadius: 18,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '2rem', flexShrink: 0,
              }}>🎮</div>
              <div style={{ flex: 1 }}>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 8 }}>Simple Game</h2>
                <p className="text-muted text-sm" style={{ marginBottom: 16, lineHeight: 1.6 }}>
                  One player answers all questions one by one in a new browser tab.
                  Questions appear in order and points are accumulated on a personal scoreboard.
                  The admin tab shows live progress and a real-time event log.
                </p>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
                  <span className="badge badge--primary">👤 Solo</span>
                  <span className="badge badge--gold">📋 All Questions</span>
                  <span className="badge badge--success">📊 Live Monitor</span>
                </div>
                <button
                  id="btn-mode-simple"
                  className="btn btn--primary"
                  onClick={onSimple}
                >
                  Play Simple Game →
                </button>
              </div>
            </div>
          </div>

          {/* Team vs Team */}
          <div className="card anim-fade-up" style={{ animationDelay: '0.2s' }}>
            <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap' }}>
              <div style={{
                minWidth: 64, height: 64,
                background: 'linear-gradient(135deg, rgba(0,229,160,0.2), rgba(0,184,217,0.05))',
                border: '1px solid rgba(0,229,160,0.35)',
                borderRadius: 18,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '2rem', flexShrink: 0,
              }}>⚔️</div>
              <div style={{ flex: 1 }}>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 8 }}>Team vs Team</h2>
                <p className="text-muted text-sm" style={{ marginBottom: 16, lineHeight: 1.6 }}>
                  Create 2+ teams, each with their own members. A random team starts first and teams
                  alternate answering shuffled questions. Points go to the team whose member answers correctly.
                  The game ends when all questions are answered — the team with the most points wins!
                </p>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
                  <span className="badge badge--success">👥 Multiplayer</span>
                  <span className="badge badge--gold">🔀 Shuffled Q's</span>
                  <span className="badge badge--primary">🏆 Team Scores</span>
                </div>
                <button
                  id="btn-mode-team"
                  className="btn btn--success"
                  onClick={onTeam}
                >
                  Set Up Teams →
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
