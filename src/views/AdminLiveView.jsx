import { useState, useEffect, useRef } from 'react'
import { CHANNEL_NAME } from '../App'
import { QRCodeSVG } from 'qrcode.react'
import { supabase } from '../lib/supabase'

function MobileAccessControl({ questionSet, addToast }) {
  const [isMobileActive, setIsMobileActive] = useState(false)
  const hexCode = questionSet.hexCode
  const joinUrl = hexCode ? `${window.location.origin}${window.location.pathname}?join=${hexCode}` : ''

  const toggleMobileAccess = async () => {
    if (!hexCode) {
      addToast('Save this game to the database first to use Mobile Access.', 'error')
      return
    }
    if (!supabase.supabaseUrl) {
      addToast('Supabase is not configured.', 'error')
      return
    }

    const newState = !isMobileActive
    setIsMobileActive(newState)

    try {
      await supabase.from('games').update({ is_mobile_active: newState }).eq('short_code', hexCode)
      addToast(newState ? 'Mobile access ON' : 'Mobile access OFF', 'info')
    } catch (err) {
      console.error(err)
      setIsMobileActive(!newState)
      addToast('Error updating mobile access.', 'error')
    }
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      <button 
        className={`btn btn--sm ${isMobileActive ? 'btn--success' : 'btn--ghost'}`} 
        onClick={toggleMobileAccess}
        style={{ border: isMobileActive ? 'none' : '1px solid var(--c-border)' }}
      >
        📱 Mobile Access {isMobileActive ? 'ON' : 'OFF'}
      </button>

      {isMobileActive && hexCode && (
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(255,255,255,0.05)', padding: '4px 10px', borderRadius: 8 }}>
          <div style={{ background: 'white', padding: 4, borderRadius: 4, display: 'flex' }}>
            <QRCodeSVG value={joinUrl} size={40} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span className="text-xs text-muted">Join at:</span>
            <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{hexCode}</span>
          </div>
        </div>
      )}
    </div>
  )
}

// ──────────────────────────────────────────────
//  SIMPLE GAME ADMIN VIEW
// ──────────────────────────────────────────────
function SimpleAdminView({ questionSet, onBack, addToast }) {
  const { name, questions } = questionSet
  const totalPoints = questions.reduce((s, q) => s + (q.points || 0), 0)

  const [events, setEvents] = useState([])
  const [gameOver, setGameOver] = useState(false)
  const [finalScore, setFinalScore] = useState(0)
  const channelRef = useRef(null)
  const logRef = useRef(null)

  useEffect(() => {
    const ch = new BroadcastChannel(CHANNEL_NAME)
    channelRef.current = ch
    ch.onmessage = (e) => {
      const msg = e.data
      if (msg.type === 'answer') {
        setEvents(prev => [...prev, { ...msg, ts: Date.now() }])
        if (msg.correct) addToast(`✅ Q${msg.qIndex + 1} correct! +${msg.points} pts`, 'success')
        else addToast(`❌ Q${msg.qIndex + 1} wrong.`, 'error')
      }
      if (msg.type === 'game_over') {
        setGameOver(true)
        setFinalScore(msg.score)
        addToast('🏁 Game finished!', 'info')
      }
    }
    return () => ch.close()
  }, [addToast])

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight
  }, [events])

  const answered = events.length
  const score = events.reduce((s, e) => s + (e.correct ? e.points : 0), 0)
  const pct = totalPoints > 0 ? Math.round((score / totalPoints) * 100) : 0
  const currentQ = answered < questions.length ? questions[answered] : null

  return (
    <div className="page">
      <div className="container--wide">
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 36, flexWrap: 'wrap', gap: 12 }}>
          <div className="logo"><span className="logo__icon">🎯</span>Questionario</div>
          <MobileAccessControl questionSet={questionSet} addToast={addToast} />
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <span className="badge badge--primary" style={{ animation: gameOver ? 'none' : 'pulse-ring 2s infinite' }}>
              {gameOver ? '🏁 Finished' : '🔴 Live'}
            </span>
            <button id="btn-back-dashboard" className="btn btn--ghost btn--sm" onClick={onBack}>← Dashboard</button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 24, alignItems: 'start' }}>
          {/* Left */}
          <div>
            <div className="card anim-fade-up" style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
                <div>
                  <h2 className="heading-lg">{name}</h2>
                  <p className="text-muted text-sm">Simple Game · Admin Monitor</p>
                </div>
                <div className="score-ticker">⭐ {score} / {totalPoints} pts</div>
              </div>
              <div style={{ marginBottom: 6, display: 'flex', justifyContent: 'space-between' }}>
                <span className="text-muted text-sm">Progress</span>
                <span className="text-muted text-sm">{answered} / {questions.length}</span>
              </div>
              <div className="progress-bar" style={{ marginBottom: 20 }}>
                <div className="progress-bar__fill" style={{ width: `${questions.length > 0 ? (answered / questions.length) * 100 : 0}%` }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span className="text-muted text-sm">Score</span>
                <span className="text-muted text-sm">{pct}%</span>
              </div>
              <div className="progress-bar" style={{ marginBottom: 24 }}>
                <div className="progress-bar__fill" style={{ width: `${pct}%`, background: pct >= 70 ? 'var(--g-success)' : pct >= 40 ? 'var(--g-gold)' : 'var(--g-danger)' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
                <div className="stat-card"><div className="stat-card__value">{score}</div><div className="stat-card__label">Points</div></div>
                <div className="stat-card">
                  <div className="stat-card__value" style={{ background: 'var(--g-success)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                    {events.filter(e => e.correct).length}
                  </div>
                  <div className="stat-card__label">Correct</div>
                </div>
                <div className="stat-card">
                  <div className="stat-card__value" style={{ background: 'var(--g-danger)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                    {events.filter(e => !e.correct).length}
                  </div>
                  <div className="stat-card__label">Wrong</div>
                </div>
              </div>
            </div>

            <div className="card anim-fade-up" style={{ animationDelay: '0.1s' }}>
              <h3 className="heading-md" style={{ marginBottom: 14 }}>Question Map</h3>
              <div className="q-dots" style={{ justifyContent: 'flex-start' }}>
                {questions.map((q, i) => {
                  const ev = events[i]
                  let cls = 'q-dot'
                  if (!ev && i === answered) cls += ' active'
                  else if (ev && ev.correct) cls += ' done'
                  else if (ev && !ev.correct) cls += ' wrong'
                  return <div key={i} className={cls} title={`Q${i + 1}`} style={{ width: 14, height: 14 }} />
                })}
              </div>
              <div style={{ display: 'flex', gap: 16, marginTop: 14 }}>
                <span className="text-xs text-muted">🟢 Correct</span>
                <span className="text-xs text-muted">🔴 Wrong</span>
                <span className="text-xs text-muted">⚪ Pending</span>
              </div>
            </div>
          </div>

          {/* Right */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {!gameOver && currentQ ? (
              <div className="card anim-fade-up">
                <span className="badge badge--primary" style={{ marginBottom: 12 }}>Current Question</span>
                <h3 className="heading-md" style={{ marginBottom: 8 }}>Q{answered + 1} of {questions.length}</h3>
                <p style={{ fontSize: '0.95rem', color: 'var(--c-text-muted)', marginBottom: 14 }}>{currentQ.text}</p>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <span className="badge badge--gold">⭐ {currentQ.points} pts</span>
                  <span className={`badge badge--${currentQ.type === 'truefalse' ? 'primary' : 'gold'}`}>
                    {currentQ.type === 'truefalse' ? '⚖️ T/F' : '🔘 MC'}
                  </span>
                </div>
              </div>
            ) : gameOver ? (
              <div className="card anim-bounce" style={{ textAlign: 'center' }}>
                <span style={{ fontSize: '3rem', display: 'block', marginBottom: 12 }}>{pct >= 70 ? '🏆' : pct >= 40 ? '👏' : '😅'}</span>
                <h3 className="heading-md" style={{ marginBottom: 6 }}>Game Over!</h3>
                <div className="stat-card__value" style={{ fontSize: '2.4rem' }}>{finalScore}</div>
                <div className="text-muted text-sm" style={{ marginTop: 4 }}>out of {totalPoints} pts ({pct}%)</div>
              </div>
            ) : null}

            <div className="card">
              <h3 className="heading-md" style={{ marginBottom: 14 }}>Event Log</h3>
              <div ref={logRef} style={{ maxHeight: 260, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {events.length === 0 ? (
                  <p className="text-muted text-sm">Waiting for the player to start…</p>
                ) : events.map((ev, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '8px 12px', borderRadius: 8,
                    background: ev.correct ? 'rgba(0,229,160,0.07)' : 'rgba(255,78,106,0.07)',
                    border: `1px solid ${ev.correct ? 'rgba(0,229,160,0.2)' : 'rgba(255,78,106,0.2)'}`,
                  }}>
                    <span>{ev.correct ? '✅' : '❌'}</span>
                    <span className="text-sm" style={{ flex: 1 }}>Q{ev.qIndex + 1} — {ev.correct ? `+${ev.points} pts` : 'No points'}</span>
                    <span className="text-xs text-muted">{new Date(ev.ts).toLocaleTimeString()}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ──────────────────────────────────────────────
//  TEAM GAME ADMIN VIEW
// ──────────────────────────────────────────────
function TeamAdminView({ questionSet, teams, onBack, addToast }) {
  const { name } = questionSet
  const totalPoints = questionSet.questions.reduce((s, q) => s + (q.points || 0), 0)

  const [events, setEvents] = useState([])
  const [teamScores, setTeamScores] = useState(teams.map(() => 0))
  const [gameOver, setGameOver] = useState(false)
  const [currentInfo, setCurrentInfo] = useState(null) // {teamName, teamEmoji, memberName}
  const logRef = useRef(null)

  useEffect(() => {
    const ch = new BroadcastChannel(CHANNEL_NAME)
    ch.onmessage = (e) => {
      const msg = e.data
      if (msg.type === 'team_answer') {
        setTeamScores(msg.teamScores)
        setEvents(prev => [...prev, { ...msg, ts: Date.now() }])
        setCurrentInfo({ teamName: msg.teamName, teamEmoji: msg.teamEmoji, memberName: msg.memberName })
        if (msg.correct) addToast(`✅ ${msg.memberName} (${msg.teamName}) +${msg.points} pts`, 'success')
        else addToast(`❌ ${msg.memberName} (${msg.teamName}) missed.`, 'error')
      }
      if (msg.type === 'team_game_over') {
        setTeamScores(msg.teamScores)
        setGameOver(true)
        addToast('🏁 Team game finished!', 'info')
      }
    }
    return () => ch.close()
  }, [addToast])

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight
  }, [events])

  const totalQuestions = questionSet.questions.length
  const answered = events.length
  const maxScore = Math.max(...teamScores, 1)
  const winnerIdx = teamScores.indexOf(Math.max(...teamScores))

  return (
    <div className="page">
      <div className="container--wide">
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 36, flexWrap: 'wrap', gap: 12 }}>
          <div className="logo"><span className="logo__icon">🎯</span>Questionario</div>
          <MobileAccessControl questionSet={questionSet} addToast={addToast} />
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <span className="badge badge--success" style={{ animation: gameOver ? 'none' : 'pulse-ring 2s infinite' }}>
              {gameOver ? '🏁 Finished' : '⚔️ Live'}
            </span>
            <button id="btn-team-back-dashboard" className="btn btn--ghost btn--sm" onClick={onBack}>← Dashboard</button>
          </div>
        </div>

        <h2 className="heading-lg" style={{ marginBottom: 6 }}>{name}</h2>
        <p className="text-muted text-sm" style={{ marginBottom: 24 }}>Team vs Team · {answered} / {totalQuestions} questions answered</p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24, alignItems: 'start' }}>
          {/* Left: team scores */}
          <div>
            {/* Team leaderboard */}
            <div className="card anim-fade-up" style={{ marginBottom: 20 }}>
              <h3 className="heading-md" style={{ marginBottom: 16 }}>Team Scores</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {teams
                  .map((t, i) => ({ ...t, score: teamScores[i], idx: i }))
                  .sort((a, b) => b.score - a.score)
                  .map((team, rank) => (
                    <div key={team.idx} style={{
                      display: 'flex', alignItems: 'center', gap: 14,
                      padding: '14px 18px', borderRadius: 12,
                      background: rank === 0 && gameOver ? 'rgba(247,201,72,0.1)' : 'rgba(255,255,255,0.04)',
                      border: `1px solid ${rank === 0 && gameOver ? 'rgba(247,201,72,0.35)' : 'var(--c-border)'}`,
                    }}>
                      <span style={{ fontSize: '1.5rem' }}>{rank === 0 ? (gameOver ? '🏆' : '⭐') : rank === 1 ? '🥈' : '🥉'}</span>
                      <span style={{ fontSize: '1.5rem' }}>{team.emoji}</span>
                      <span style={{ flex: 1, fontWeight: 600 }}>{team.name}</span>
                      <div style={{ width: 100, marginRight: 12 }}>
                        <div style={{ height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 99, overflow: 'hidden' }}>
                          <div style={{
                            height: '100%', borderRadius: 99,
                            width: `${(team.score / maxScore) * 100}%`,
                            background: 'var(--g-primary)',
                            transition: 'width 0.5s ease',
                          }} />
                        </div>
                      </div>
                      <span style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--c-warn)', minWidth: 60, textAlign: 'right' }}>
                        {team.score} pts
                      </span>
                    </div>
                  ))}
              </div>
            </div>

            {/* Progress bar */}
            <div className="card anim-fade-up" style={{ animationDelay: '0.1s' }}>
              <h3 className="heading-md" style={{ marginBottom: 14 }}>Match Progress</h3>
              <div style={{ marginBottom: 6, display: 'flex', justifyContent: 'space-between' }}>
                <span className="text-muted text-sm">Questions</span>
                <span className="text-muted text-sm">{answered} / {totalQuestions}</span>
              </div>
              <div className="progress-bar" style={{ marginBottom: 16 }}>
                <div className="progress-bar__fill" style={{ width: `${totalQuestions > 0 ? (answered / totalQuestions) * 100 : 0}%` }} />
              </div>

              {/* Q dots colored by team */}
              <div className="q-dots" style={{ justifyContent: 'flex-start' }}>
                {questionSet.questions.map((_, i) => {
                  const ev = events[i]
                  return (
                    <div
                      key={i}
                      className={`q-dot${!ev && i === answered ? ' active' : ''}`}
                      style={{
                        width: 14, height: 14,
                        background: ev
                          ? (ev.correct ? 'var(--c-success)' : 'var(--c-danger)')
                          : (i === answered ? 'white' : undefined),
                      }}
                      title={ev ? `Q${i + 1}: ${ev.teamName} — ${ev.correct ? 'correct' : 'wrong'}` : `Q${i + 1}`}
                    />
                  )
                })}
              </div>
            </div>
          </div>

          {/* Right: current turn + event log */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {!gameOver && currentInfo && (
              <div className="card anim-fade-up">
                <span className="badge badge--primary" style={{ marginBottom: 12 }}>Last Action</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: '2rem' }}>{currentInfo.teamEmoji}</span>
                  <div>
                    <div style={{ fontWeight: 700 }}>{currentInfo.memberName}</div>
                    <div className="text-muted text-sm">{currentInfo.teamName}</div>
                  </div>
                </div>
              </div>
            )}

            {gameOver && (
              <div className="card anim-bounce" style={{ textAlign: 'center' }}>
                <span style={{ fontSize: '3rem', display: 'block', marginBottom: 10 }}>🏆</span>
                <h3 className="heading-md" style={{ marginBottom: 4 }}>Winner!</h3>
                <span style={{ fontSize: '2rem' }}>{teams[winnerIdx]?.emoji}</span>
                <div style={{ fontWeight: 800, fontSize: '1.3rem', marginTop: 4 }}>{teams[winnerIdx]?.name}</div>
                <div className="text-muted text-sm" style={{ marginTop: 4 }}>{teamScores[winnerIdx]} pts</div>
              </div>
            )}

            <div className="card">
              <h3 className="heading-md" style={{ marginBottom: 14 }}>Event Log</h3>
              <div ref={logRef} style={{ maxHeight: 300, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {events.length === 0 ? (
                  <p className="text-muted text-sm">Waiting for the game to start…</p>
                ) : events.map((ev, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '8px 12px', borderRadius: 8,
                    background: ev.correct ? 'rgba(0,229,160,0.07)' : 'rgba(255,78,106,0.07)',
                    border: `1px solid ${ev.correct ? 'rgba(0,229,160,0.2)' : 'rgba(255,78,106,0.2)'}`,
                  }}>
                    <span>{ev.correct ? '✅' : '❌'}</span>
                    <span style={{ fontSize: '1rem' }}>{ev.teamEmoji}</span>
                    <span className="text-sm" style={{ flex: 1 }}>
                      {ev.memberName} {ev.correct ? `+${ev.points}` : '—'}
                    </span>
                    <span className="text-xs text-muted">{new Date(ev.ts).toLocaleTimeString()}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ──────────────────────────────────────────────
//  EXPORTED WRAPPER — picks correct view
// ──────────────────────────────────────────────
export default function AdminLiveView({ questionSet, gameConfig, onBack, addToast }) {
  if (gameConfig?.mode === 'team') {
    return (
      <TeamAdminView
        questionSet={questionSet}
        teams={gameConfig.teams}
        onBack={onBack}
        addToast={addToast}
      />
    )
  }
  return (
    <SimpleAdminView
      questionSet={questionSet}
      onBack={onBack}
      addToast={addToast}
    />
  )
}
