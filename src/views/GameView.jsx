import { useState, useEffect, useRef, useCallback } from 'react'
import { CHANNEL_NAME } from '../App'
import { supabase } from '../lib/supabase'

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F']

function ResultOverlay({ correct, points, onContinue, isLast }) {
  return (
    <div className="result-overlay">
      <div className="result-bubble">
        <span className="emoji">{correct ? '🎉' : '😬'}</span>
        <h2 style={{ color: correct ? 'var(--c-success)' : 'var(--c-danger)' }}>
          {correct ? 'Correct!' : 'Wrong!'}
        </h2>
        <p>{correct ? `You earned ${points} points!` : 'Better luck next time.'}</p>
        <button
          id="btn-next-question"
          className={`btn btn--${correct ? 'success' : 'danger'} btn--lg`}
          onClick={onContinue}
        >
          {isLast ? '🏁 See Final Score' : 'Next Question →'}
        </button>
      </div>
    </div>
  )
}

function FinalScreen({ score, total, questions, results }) {
  const pct = total > 0 ? Math.round((score / total) * 100) : 0
  const emoji = pct >= 80 ? '🏆' : pct >= 50 ? '🥈' : '🤔'

  return (
    <div className="page">
      <div className="container" style={{ maxWidth: 540, textAlign: 'center' }}>
        <div style={{ fontSize: '5rem', marginBottom: 20 }}>{emoji}</div>
        <h1 className="heading-xl" style={{ marginBottom: 8 }}>Game Over!</h1>
        <p className="text-muted" style={{ marginBottom: 32 }}>Here's how you did:</p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginBottom: 40 }}>
          <div className="stat-card">
            <div className="stat-card__value">{score}</div>
            <div className="stat-card__label">Points</div>
          </div>
          <div className="stat-card">
            <div className="stat-card__value" style={{ background: 'var(--g-success)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              {results.filter(r => r).length}
            </div>
            <div className="stat-card__label">Correct</div>
          </div>
          <div className="stat-card">
            <div className="stat-card__value">{pct}%</div>
            <div className="stat-card__label">Accuracy</div>
          </div>
        </div>

        <div style={{ textAlign: 'left', marginBottom: 32 }}>
          {questions.map((q, i) => (
            <div key={i} style={{
              display: 'flex', gap: 12, alignItems: 'flex-start',
              padding: '10px 14px', marginBottom: 8,
              borderRadius: 10,
              background: results[i] ? 'rgba(0,229,160,0.07)' : 'rgba(255,78,106,0.07)',
              border: `1px solid ${results[i] ? 'rgba(0,229,160,0.2)' : 'rgba(255,78,106,0.2)'}`,
            }}>
              <span style={{ marginTop: 2 }}>{results[i] ? '✅' : '❌'}</span>
              <div>
                <p style={{ fontSize: '0.9rem', fontWeight: 500 }}>{q.text}</p>
                <p className="text-xs text-muted" style={{ marginTop: 3 }}>Correct: <span style={{ color: 'var(--c-success)' }}>{q.options[q.correctIndex]}</span></p>
              </div>
            </div>
          ))}
        </div>

        <button id="btn-close-game" className="btn btn--ghost" onClick={() => window.close()}>
          Close Tab
        </button>
      </div>
    </div>
  )
}

export default function GameView() {
  const [questionSet, setQuestionSet] = useState(null)
  const [qIndex, setQIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [selected, setSelected] = useState(null)      // index of chosen option
  const [revealed, setRevealed] = useState(false)
  const [showResult, setShowResult] = useState(false)
  const [results, setResults] = useState([])           // booleans per question
  const [gameFinished, setGameFinished] = useState(false)
  const channelRef = useRef(null)
  const [supabaseChannel, setSupabaseChannel] = useState(null)

  const stateRef = useRef({ qIndex: 0, revealed: false, questions: [] })
  useEffect(() => {
    stateRef.current = { qIndex, revealed, questions: questionSet?.questions || [] }
  }, [qIndex, revealed, questionSet])

  const handleSelectRef = useRef(null)

  useEffect(() => {
    // Read question set from sessionStorage
    const raw = sessionStorage.getItem('questionario_set')
    if (raw) {
      try { 
        const qs = JSON.parse(raw)
        setQuestionSet(qs) 
        
        if (qs.hexCode && supabase.supabaseUrl) {
          const ch = supabase.channel(`game-${qs.hexCode}`)
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
    // Open broadcast channel
    channelRef.current = new BroadcastChannel(CHANNEL_NAME)
    return () => {
      channelRef.current?.close()
      if (supabaseChannel) supabase.removeChannel(supabaseChannel)
    }
  }, [])

  useEffect(() => {
    if (supabaseChannel && questionSet && !gameFinished) {
      supabaseChannel.send({
        type: 'broadcast',
        event: 'sync_state',
        payload: {
          currentQ: questionSet.questions[qIndex],
          revealed,
          selected,
          gameOver: false
        }
      })
    }
  }, [qIndex, revealed, selected, gameFinished, supabaseChannel, questionSet])

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
    if (revealed || !questionSet) return
    const current = questionSet.questions[qIndex]
    setSelected(i)
    setRevealed(true)

    const correct = i === current.correctIndex
    const earned = correct ? current.points : 0
    const newScore = score + earned
    const newResults = [...results, correct]

    setResults(newResults)
    setScore(newScore)

    // Broadcast to admin
    channelRef.current?.postMessage({
      type: 'answer',
      qIndex,
      correct,
      points: earned,
      score: newScore,
    })

    // Short delay then show overlay
    setTimeout(() => setShowResult(true), 350)
  }, [revealed, questionSet, score, results, qIndex])

  useEffect(() => {
    handleSelectRef.current = handleSelect
  }, [handleSelect])

  if (!questionSet) {
    return (
      <div className="page" style={{ justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <div style={{ textAlign: 'center' }}>
          <p className="text-muted">Loading question set…</p>
          <p className="text-xs text-muted" style={{ marginTop: 8 }}>Make sure to open this tab from the Admin Dashboard.</p>
        </div>
      </div>
    )
  }

  if (gameFinished) {
    return (
      <>
        <FinalScreen
          score={score}
          total={questionSet.questions.reduce((s, q) => s + q.points, 0)}
          questions={questionSet.questions}
          results={results}
        />
      </>
    )
  }

  const questions = questionSet.questions
  const current = questions[qIndex]
  const progress = ((qIndex) / questions.length) * 100



  const handleContinue = () => {
    setShowResult(false)
    const nextIndex = qIndex + 1
    if (nextIndex >= questions.length) {
      // Game over
      channelRef.current?.postMessage({
        type: 'game_over',
        score: score + (results[results.length - 1] ? 0 : 0), // already updated
      })
      setGameFinished(true)
    } else {
      setQIndex(nextIndex)
      setSelected(null)
      setRevealed(false)
    }
  }

  return (
    <div className="page">
      <div className="container" style={{ maxWidth: 680 }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 10 }}>
          <div className="logo">
            <span className="logo__icon">🎯</span>
            {questionSet.name}
          </div>
          <div className="score-ticker">⭐ {score} pts</div>
        </div>

        {/* Progress */}
        <div style={{ marginBottom: 6, display: 'flex', justifyContent: 'space-between' }}>
          <span className="text-muted text-sm">Question {qIndex + 1} of {questions.length}</span>
          <span className="text-muted text-sm">{Math.round(progress)}%</span>
        </div>
        <div className="progress-bar" style={{ marginBottom: 28 }}>
          <div className="progress-bar__fill" style={{ width: `${progress}%` }} />
        </div>

        {/* Question card */}
        <div className="card anim-fade-up" key={qIndex} style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
            <span className={`badge badge--${current.type === 'truefalse' ? 'primary' : 'gold'}`}>
              {current.type === 'truefalse' ? '⚖️ True / False' : '🔘 Multiple Choice'}
            </span>
            <span className="badge badge--success">⭐ {current.points} pts</span>
          </div>

          <h2 style={{ fontSize: 'clamp(1.1rem, 3vw, 1.5rem)', fontWeight: 700, marginBottom: 28, lineHeight: 1.4 }}>
            {current.text}
          </h2>

          {/* Options */}
          <div>
            {current.options.map((opt, i) => {
              const isSelected = selected === i
              const isCorrect  = i === current.correctIndex
              let cls = 'option-btn'
              if (revealed) {
                if (isCorrect) cls += ' correct'
                else if (isSelected && !isCorrect) cls += ' wrong'
                else cls += ' revealed'
              }
              return (
                <button
                  key={i}
                  id={`game-opt-${i}`}
                  className={cls}
                  onClick={() => handleSelect(i)}
                  disabled={revealed}
                >
                  <span className="option-btn__letter">{LETTERS[i]}</span>
                  <span>{opt}</span>
                  {revealed && isCorrect && <span style={{ marginLeft: 'auto', fontSize: '1.2rem' }}>✓</span>}
                  {revealed && isSelected && !isCorrect && <span style={{ marginLeft: 'auto', fontSize: '1.2rem' }}>✗</span>}
                </button>
              )
            })}
          </div>
        </div>

        {/* Q dot map */}
        <div className="q-dots">
          {questions.map((_, i) => {
            let cls = 'q-dot'
            if (i < results.length) cls += results[i] ? ' done' : ' wrong'
            else if (i === qIndex) cls += ' active'
            return <div key={i} className={cls} />
          })}
        </div>
      </div>

      {/* Result overlay */}
      {showResult && (
        <ResultOverlay
          correct={results[results.length - 1]}
          points={current.points}
          onContinue={handleContinue}
          isLast={qIndex + 1 >= questions.length}
        />
      )}
    </div>
  )
}
