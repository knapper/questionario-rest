import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F']

export default function MobilePlayerView() {
  const urlParams = new URLSearchParams(window.location.search)
  const hexCode = urlParams.get('join')?.toUpperCase()
  
  const [playerName, setPlayerName] = useState('')
  const [joined, setJoined] = useState(false)
  const [gameState, setGameState] = useState(null)
  const [channel, setChannel] = useState(null)
  
  useEffect(() => {
    if (!hexCode || !supabase.supabaseUrl) return
    
    const ch = supabase.channel(`game-${hexCode}`)
    ch.on('broadcast', { event: 'sync_state' }, (payload) => {
      setGameState(payload.payload)
    }).subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        setChannel(ch)
        // Request current state from the host
        ch.send({ type: 'broadcast', event: 'request_state', payload: {} })
      }
    })
    
    return () => {
      supabase.removeChannel(ch)
    }
  }, [hexCode])

  if (!supabase.supabaseUrl) {
    return <div className="page"><div className="container" style={{textAlign: 'center', marginTop: 40}}>Supabase is not configured.</div></div>
  }

  if (!hexCode) {
    return <div className="page"><div className="container" style={{textAlign: 'center', marginTop: 40}}>Invalid Join URL.</div></div>
  }

  if (!joined) {
    return (
      <div className="page">
        <div className="container" style={{ maxWidth: 400, marginTop: '10vh' }}>
          <div className="card anim-fade-up" style={{ textAlign: 'center' }}>
            <div className="logo" style={{ justifyContent: 'center', marginBottom: 20 }}>
              <span className="logo__icon">📱</span>Questionario
            </div>
            <h2 className="heading-md" style={{ marginBottom: 8 }}>Join Game: {hexCode}</h2>
            <p className="text-muted text-sm" style={{ marginBottom: 24 }}>Enter your name to play.</p>
            
            <input 
              className="form-input" 
              placeholder="Your Name" 
              value={playerName}
              onChange={e => setPlayerName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && playerName.trim() && setJoined(true)}
              style={{ marginBottom: 16 }}
            />
            
            <button 
              className="btn btn--primary btn--full btn--lg" 
              disabled={!playerName.trim()}
              onClick={() => setJoined(true)}
            >
              Join Game
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!gameState) {
    return (
      <div className="page">
        <div className="container" style={{ textAlign: 'center', marginTop: '20vh' }}>
          <div className="anim-pulse" style={{ fontSize: '3rem', marginBottom: 16 }}>⏳</div>
          <h3 className="heading-md" style={{ marginBottom: 8 }}>Waiting for host...</h3>
          <p className="text-muted text-sm">The game will appear here when the host starts a question.</p>
        </div>
      </div>
    )
  }

  if (gameState.gameOver) {
    return (
      <div className="page">
        <div className="container" style={{ textAlign: 'center', marginTop: '20vh' }}>
          <div className="anim-bounce" style={{ fontSize: '4rem', marginBottom: 16 }}>🏁</div>
          <h2 className="heading-lg">Game Over!</h2>
          <p className="text-muted" style={{ marginTop: 8 }}>Look at the main screen for final results.</p>
        </div>
      </div>
    )
  }

  const { currentQ, revealed, selected, currentTurn, currentTeamName } = gameState

  // In team mode, only the current turn member should ideally answer, but we'll let anyone answer and log who did it.
  const isMyTurn = currentTurn ? currentTurn.memberName.toLowerCase() === playerName.toLowerCase() : true
  
  const handleSelect = (i) => {
    if (revealed || !channel) return
    channel.send({
      type: 'broadcast',
      event: 'mobile_answer',
      payload: { index: i, player: playerName }
    })
  }

  return (
    <div className="page">
      <div className="container" style={{ maxWidth: 500, padding: 16 }}>
        {currentTurn && (
          <div style={{ background: isMyTurn ? 'rgba(0,229,160,0.1)' : 'rgba(255,255,255,0.05)', padding: 12, borderRadius: 12, marginBottom: 20, border: `1px solid ${isMyTurn ? 'var(--c-success)' : 'var(--c-border)'}` }}>
            <p className="text-sm text-center">
              Current Turn: <strong>{currentTurn.memberName}</strong> ({currentTeamName})
              {isMyTurn && <span style={{ display: 'block', color: 'var(--c-success)', marginTop: 4, fontWeight: 700 }}>It's your turn!</span>}
            </p>
          </div>
        )}

        <div className="card anim-fade-up">
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 20 }}>{currentQ.text}</h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
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
                  className={cls}
                  onClick={() => handleSelect(i)}
                  disabled={revealed}
                  style={{ padding: '16px', fontSize: '1.1rem' }}
                >
                  <span className="option-btn__letter">{LETTERS[i]}</span>
                  <span style={{ flex: 1, textAlign: 'left' }}>{opt}</span>
                  {revealed && isCorrect && <span style={{ marginLeft: 'auto', fontSize: '1.2rem' }}>✓</span>}
                  {revealed && isSelected && !isCorrect && <span style={{ marginLeft: 'auto', fontSize: '1.2rem' }}>✗</span>}
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
