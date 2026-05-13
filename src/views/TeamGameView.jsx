import { useState, useEffect, useRef, useCallback } from 'react'
import { CHANNEL_NAME } from '../App'
import { supabase } from '../lib/supabase'

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F']

// Fisher-Yates shuffle
function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// Build the alternating turn list for the full game
// turns[i] = { teamIdx, memberName }
function buildTurns(teams, numQuestions, startingTeamIdx) {
  // Shuffle members within each team
  const shuffledTeams = teams.map(t => ({ ...t, members: shuffle(t.members) }))
  const memberCursors = shuffledTeams.map(() => 0)
  // Reorder so the starting team comes first in rotation
  const teamOrder = []
  for (let i = 0; i < shuffledTeams.length; i++) {
    teamOrder.push((startingTeamIdx + i) % shuffledTeams.length)
  }

  const turns = []
  for (let i = 0; i < numQuestions; i++) {
    const teamIdx = teamOrder[i % teamOrder.length]
    const team = shuffledTeams[teamIdx]
    const memberName = team.members[memberCursors[teamIdx] % team.members.length]
    memberCursors[teamIdx]++
    turns.push({ teamIdx, memberName })
  }
  return turns
}

// ── Countdown overlay shown at start ──────────────────
function CountdownOverlay({ startingTeam, onDone }) {
  const [count, setCount] = useState(3)
  useEffect(() => {
    if (count <= 0) { onDone(); return }
    const t = setTimeout(() => setCount(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [count, onDone])

  return (
    <div className="result-overlay">
      <div className="result-bubble" style={{ minWidth: 320 }}>
        <span style={{ fontSize: '3rem', display: 'block', marginBottom: 12 }}>
          {startingTeam.emoji}
        </span>
        <h2 style={{ marginBottom: 6 }}>{startingTeam.name} starts!</h2>
        <p className="text-muted" style={{ marginBottom: 20 }}>Game begins in…</p>
        <div style={{
          fontSize: '5rem', fontWeight: 900,
          background: 'var(--g-primary)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          lineHeight: 1,
        }}>
          {count > 0 ? count : '🎉'}
        </div>
      </div>
    </div>
  )
}

// ── Result overlay after answering ───────────────────
function ResultOverlay({ correct, points, teamName, teamEmoji, memberName, onContinue, isLast }) {
  return (
    <div className="result-overlay">
      <div className="result-bubble" style={{ minWidth: 340 }}>
        <span className="emoji">{correct ? '🎉' : '😬'}</span>
        <h2 style={{ color: correct ? 'var(--c-success)' : 'var(--c-danger)', marginBottom: 4 }}>
          {correct ? 'Correct!' : 'Wrong!'}
        </h2>
        <p style={{ marginBottom: 4 }}>
          {correct
            ? <><strong>{memberName}</strong> earned <strong style={{ color: 'var(--c-warn)' }}>{points} pts</strong> for <strong>{teamEmoji} {teamName}</strong>!</>
            : <>No points for <strong>{teamName}</strong> this round.</>
          }
        </p>
        <p className="text-muted text-sm" style={{ marginBottom: 24 }}>
          {correct ? 'Great answer!' : `Correct was: check the scoreboard.`}
        </p>
        <button
          id="btn-team-next-question"
          className={`btn btn--${correct ? 'success' : 'danger'} btn--lg`}
          onClick={onContinue}
        >
          {isLast ? '🏁 See Final Scores' : 'Next Turn →'}
        </button>
      </div>
    </div>
  )
}

// ── Team score bar ────────────────────────────────────
function TeamScoreBar({ teams, scores }) {
  const maxScore = Math.max(...scores, 1)
  return (
    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
      {teams.map((team, i) => (
        <div key={i} style={{
          flex: 1, minWidth: 110,
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid var(--c-border)',
          borderRadius: 12, padding: '12px 14px',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '1.6rem', marginBottom: 4 }}>{team.emoji}</div>
          <div style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{team.name}</div>
          <div style={{
            height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 99, marginBottom: 6, overflow: 'hidden',
          }}>
            <div style={{
              height: '100%', borderRadius: 99,
              width: `${(scores[i] / maxScore) * 100}%`,
              background: 'var(--g-primary)',
              transition: 'width 0.5s cubic-bezier(0.4,0,0.2,1)',
            }} />
          </div>
          <div style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--c-warn)' }}>{scores[i]}</div>
        </div>
      ))}
    </div>
  )
}

// ── Final Screen ──────────────────────────────────────
function FinalScreen({ teams, scores, results }) {
  const maxScore = Math.max(...scores)
  const winnerIndices = scores.reduce((acc, s, i) => s === maxScore ? [...acc, i] : acc, [])
  const isTie = winnerIndices.length > 1

  return (
    <div className="page">
      <div className="container" style={{ maxWidth: 580, textAlign: 'center' }}>
        <div style={{ fontSize: '4rem', marginBottom: 16 }}>🏆</div>
        <h1 className="heading-xl" style={{ marginBottom: 8 }}>Game Over!</h1>
        {isTie ? (
          <p className="text-muted" style={{ marginBottom: 32 }}>
            It's a tie between {winnerIndices.map(i => `${teams[i].emoji} ${teams[i].name}`).join(' & ')}!
          </p>
        ) : (
          <p className="text-muted" style={{ marginBottom: 32 }}>
            {teams[winnerIndices[0]].emoji} <strong style={{ color: 'var(--c-text)' }}>{teams[winnerIndices[0]].name}</strong> wins!
          </p>
        )}

        {/* Team scores */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 40 }}>
          {teams
            .map((t, i) => ({ ...t, score: scores[i], idx: i }))
            .sort((a, b) => b.score - a.score)
            .map((team, rank) => (
              <div key={team.idx} style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '16px 20px',
                borderRadius: 14,
                background: rank === 0 ? 'rgba(247,201,72,0.1)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${rank === 0 ? 'rgba(247,201,72,0.35)' : 'var(--c-border)'}`,
              }}>
                <span style={{ fontSize: '1.8rem', minWidth: 40, textAlign: 'center' }}>
                  {rank === 0 ? '🥇' : rank === 1 ? '🥈' : '🥉'}
                </span>
                <span style={{ fontSize: '1.8rem' }}>{team.emoji}</span>
                <span style={{ flex: 1, fontWeight: 700, textAlign: 'left' }}>{team.name}</span>
                <span style={{ fontWeight: 800, fontSize: '1.4rem', color: 'var(--c-warn)' }}>{team.score} pts</span>
              </div>
            ))}
        </div>

        {/* Per-question breakdown */}
        <div style={{ textAlign: 'left', marginBottom: 32 }}>
          <h3 className="heading-md" style={{ marginBottom: 14 }}>Question Breakdown</h3>
          {results.map((r, i) => (
            <div key={i} style={{
              display: 'flex', gap: 10, alignItems: 'center',
              padding: '8px 12px', marginBottom: 6,
              borderRadius: 8,
              background: r.correct ? 'rgba(0,229,160,0.07)' : 'rgba(255,78,106,0.07)',
              border: `1px solid ${r.correct ? 'rgba(0,229,160,0.2)' : 'rgba(255,78,106,0.2)'}`,
            }}>
              <span>{r.correct ? '✅' : '❌'}</span>
              <span className="text-sm" style={{ flex: 1 }}>Q{i + 1}</span>
              <span style={{ fontSize: '1rem' }}>{teams[r.teamIdx]?.emoji}</span>
              <span className="text-sm">{r.memberName}</span>
              {r.correct && <span className="text-xs" style={{ color: 'var(--c-warn)' }}>+{r.points} pts</span>}
            </div>
          ))}
        </div>

        <button id="btn-close-team-game" className="btn btn--ghost" onClick={() => window.close()}>
          Close Tab
        </button>
      </div>
    </div>
  )
}

// ── Main TeamGameView ─────────────────────────────────
export default function TeamGameView() {
  const [ready, setReady] = useState(false)
  const [questionSet, setQuestionSet] = useState(null)
  const [teams, setTeams] = useState(null)
  const [shuffledQuestions, setShuffledQuestions] = useState([])
  const [turns, setTurns] = useState([])
  const [qIndex, setQIndex] = useState(0)
  const [scores, setScores] = useState([])
  const [selected, setSelected] = useState(null)
  const [revealed, setRevealed] = useState(false)
  const [showResult, setShowResult] = useState(false)
  const [results, setResults] = useState([])
  const [gameFinished, setGameFinished] = useState(false)
  const [startingTeamIdx, setStartingTeamIdx] = useState(0)
  const channelRef = useRef(null)
  const [supabaseChannel, setSupabaseChannel] = useState(null)

  const stateRef = useRef({ qIndex: 0, revealed: false })
  useEffect(() => {
    stateRef.current = { qIndex, revealed }
  }, [qIndex, revealed])

  const handleSelectRef = useRef(null)

  useEffect(() => {
    const raw = sessionStorage.getItem('questionario_team_game')
    if (raw) {
      try {
        const data = JSON.parse(raw)
        const sq = shuffle(data.questionSet.questions)
        const startIdx = Math.floor(Math.random() * data.teams.length)
        const t = buildTurns(data.teams, sq.length, startIdx)

        setQuestionSet(data.questionSet)
        setTeams(data.teams)
        setShuffledQuestions(sq)
        setTurns(t)
        setScores(data.teams.map(() => 0))
        setStartingTeamIdx(startIdx)
        setShowCountdown(true)

        if (data.questionSet.hexCode && supabase.supabaseUrl) {
          const ch = supabase.channel(`game-${data.questionSet.hexCode}`)
          ch.on('broadcast', { event: 'request_state' }, () => {
            // will be handled by the effect below
          })
          ch.on('broadcast', { event: 'mobile_answer' }, (payload) => {
            if (stateRef.current.revealed) return
            if (handleSelectRef.current) {
              handleSelectRef.current(payload.payload.index)
            }
          })
          ch.subscribe()
          setSupabaseChannel(ch)
        }
      } catch { /* ignore */ }
    }
    channelRef.current = new BroadcastChannel(CHANNEL_NAME)
    return () => {
      channelRef.current?.close()
      if (supabaseChannel) supabase.removeChannel(supabaseChannel)
    }
  }, [])

  useEffect(() => {
    if (supabaseChannel && shuffledQuestions.length > 0 && !gameFinished && turns.length > 0) {
      const currentQ = shuffledQuestions[qIndex]
      const currentTurn = turns[qIndex]
      const currentTeam = teams ? teams[currentTurn?.teamIdx] : null
      
      supabaseChannel.send({
        type: 'broadcast',
        event: 'sync_state',
        payload: {
          currentQ,
          currentTurn,
          currentTeamName: currentTeam?.name,
          revealed,
          selected,
          gameOver: false
        }
      })
    }
  }, [qIndex, revealed, selected, gameFinished, supabaseChannel, shuffledQuestions, turns, teams])

  useEffect(() => {
    if (gameFinished && supabaseChannel) {
      supabaseChannel.send({
        type: 'broadcast',
        event: 'sync_state',
        payload: { gameOver: true }
      })
    }
  }, [gameFinished, supabaseChannel])

  const handleSelect = useCallback((i) => {
    if (revealed || !questionSet || !teams) return
    const currentQ = shuffledQuestions[qIndex]
    const currentTurn = turns[qIndex]
    const currentTeam = teams[currentTurn?.teamIdx]

    setSelected(i)
    setRevealed(true)

    const correct = i === currentQ.correctIndex
    const earned = correct ? currentQ.points : 0
    const newScores = [...scores]
    newScores[currentTurn.teamIdx] += earned
    setScores(newScores)

    const newResults = [...results, { correct, points: earned, teamIdx: currentTurn.teamIdx, memberName: currentTurn.memberName }]
    setResults(newResults)

    channelRef.current?.postMessage({
      type: 'team_answer',
      qIndex,
      correct,
      points: earned,
      teamIdx: currentTurn.teamIdx,
      teamName: currentTeam.name,
      teamEmoji: currentTeam.emoji,
      memberName: currentTurn.memberName,
      teamScores: newScores,
    })

    setTimeout(() => setShowResult(true), 350)
  }, [revealed, shuffledQuestions, scores, results, qIndex, turns, teams, questionSet])

  useEffect(() => {
    handleSelectRef.current = handleSelect
  }, [handleSelect])

  if (!questionSet || !teams) {
    return (
      <div className="page" style={{ justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <p className="text-muted">Loading team game… Open this tab from the Admin Dashboard.</p>
      </div>
    )
  }

  if (gameFinished) {
    return <FinalScreen teams={teams} scores={scores} results={results} />
  }

  const currentQ = shuffledQuestions[qIndex]
  const currentTurn = turns[qIndex]
  const currentTeam = teams[currentTurn?.teamIdx]
  const progress = (qIndex / shuffledQuestions.length) * 100



  const handleContinue = () => {
    setShowResult(false)
    const next = qIndex + 1
    if (next >= shuffledQuestions.length) {
      const finalScores = [...scores]
      channelRef.current?.postMessage({ type: 'team_game_over', teamScores: finalScores, teams })
      setGameFinished(true)
    } else {
      setQIndex(next)
      setSelected(null)
      setRevealed(false)
    }
  }

  return (
    <div className="page">
      <div className="container" style={{ maxWidth: 720 }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
          <div className="logo">
            <span className="logo__icon">🎯</span>
            {questionSet.name}
          </div>
          <span className="badge badge--primary">⚔️ Team vs Team</span>
        </div>

        {/* Team scores bar */}
        <div style={{ marginBottom: 20 }}>
          <TeamScoreBar teams={teams} scores={scores} />
        </div>

        {/* Progress */}
        <div style={{ marginBottom: 6, display: 'flex', justifyContent: 'space-between' }}>
          <span className="text-muted text-sm">Question {qIndex + 1} of {shuffledQuestions.length}</span>
          <span className="text-muted text-sm">{Math.round(progress)}%</span>
        </div>
        <div className="progress-bar" style={{ marginBottom: 20 }}>
          <div className="progress-bar__fill" style={{ width: `${progress}%` }} />
        </div>

        {/* Current player banner */}
        {currentTurn && currentTeam && (
          <div style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid var(--c-border)',
            borderRadius: 14, padding: '14px 20px',
            display: 'flex', alignItems: 'center', gap: 14,
            marginBottom: 20,
          }}>
            <span style={{ fontSize: '2rem' }}>{currentTeam.emoji}</span>
            <div>
              <div style={{ fontWeight: 800, fontSize: '1.05rem' }}>{currentTurn.memberName}</div>
              <div className="text-muted text-sm">{currentTeam.name} · {scores[currentTurn.teamIdx]} pts</div>
            </div>
            <div style={{ marginLeft: 'auto' }}>
              <span className="badge badge--gold">🎤 Their turn</span>
            </div>
          </div>
        )}

        {/* Question card */}
        <div className="card anim-fade-up" key={qIndex} style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18, flexWrap: 'wrap' }}>
            <span className={`badge badge--${currentQ.type === 'truefalse' ? 'primary' : 'gold'}`}>
              {currentQ.type === 'truefalse' ? '⚖️ True / False' : '🔘 Multiple Choice'}
            </span>
            <span className="badge badge--success">⭐ {currentQ.points} pts</span>
          </div>
          <h2 style={{ fontSize: 'clamp(1.1rem, 3vw, 1.45rem)', fontWeight: 700, marginBottom: 26, lineHeight: 1.4 }}>
            {currentQ.text}
          </h2>
          <div>
            {currentQ.options.map((opt, i) => {
              const isSelected = selected === i
              const isCorrect = i === currentQ.correctIndex
              let cls = 'option-btn'
              if (revealed) {
                if (isCorrect) cls += ' correct'
                else if (isSelected && !isCorrect) cls += ' wrong'
                else cls += ' revealed'
              }
              return (
                <button
                  key={i}
                  id={`team-game-opt-${i}`}
                  className={cls}
                  onClick={() => handleSelect(i)}
                  disabled={revealed}
                >
                  <span className="option-btn__letter">{LETTERS[i]}</span>
                  <span>{opt}</span>
                  {revealed && isCorrect && <span style={{ marginLeft: 'auto', fontSize: '1.1rem' }}>✓</span>}
                  {revealed && isSelected && !isCorrect && <span style={{ marginLeft: 'auto', fontSize: '1.1rem' }}>✗</span>}
                </button>
              )
            })}
          </div>
        </div>

        {/* Q dot map */}
        <div className="q-dots">
          {shuffledQuestions.map((_, i) => {
            let cls = 'q-dot'
            if (i < results.length) cls += results[i].correct ? ' done' : ' wrong'
            else if (i === qIndex) cls += ' active'
            return <div key={i} className={cls} />
          })}
        </div>
      </div>

      {/* Countdown overlay */}
      {showCountdown && (
        <CountdownOverlay
          startingTeam={teams[startingTeamIdx]}
          onDone={() => setShowCountdown(false)}
        />
      )}

      {/* Answer result overlay */}
      {showResult && currentTurn && currentTeam && (
        <ResultOverlay
          correct={results[results.length - 1]?.correct}
          points={currentQ.points}
          teamName={currentTeam.name}
          teamEmoji={currentTeam.emoji}
          memberName={currentTurn.memberName}
          onContinue={handleContinue}
          isLast={qIndex + 1 >= shuffledQuestions.length}
        />
      )}
    </div>
  )
}
