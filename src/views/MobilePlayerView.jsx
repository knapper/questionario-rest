import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F']

export default function MobilePlayerView() {
  const urlParams = new URLSearchParams(window.location.search)
  const hexCode = urlParams.get('join')?.toUpperCase()
  
  const [playerName, setPlayerName] = useState('')
  const [role, setRole] = useState(null) // 'player' | 'spectator'
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

  useEffect(() => {
    if (joined && channel && role === 'player' && playerName.trim()) {
      channel.send({ type: 'broadcast', event: 'player_joined', payload: { name: playerName.trim() } })
    }
  }, [joined, channel, role, playerName])

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
            
            {!role ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 24 }}>
                <button 
                  className="btn btn--primary btn--full btn--lg"
                  onClick={() => setRole('player')}
                >
                  🎮 Join as Player
                </button>
                <button 
                  className="btn btn--ghost btn--full btn--lg"
                  onClick={() => {
                    setRole('spectator')
                    setJoined(true)
                  }}
                  style={{ border: '1px solid var(--c-border)' }}
                >
                  👀 Join as Spectator
                </button>
              </div>
            ) : (
              <div className="anim-fade-up" style={{ marginTop: 24 }}>
                <p className="text-muted text-sm" style={{ marginBottom: 16 }}>Enter your name to play.</p>
                <input 
                  className="form-input" 
                  placeholder="Your Name" 
                  value={playerName}
                  onChange={e => setPlayerName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && playerName.trim() && setJoined(true)}
                  style={{ marginBottom: 16 }}
                  autoFocus
                />
                
                <button 
                  className="btn btn--primary btn--full btn--lg" 
                  disabled={!playerName.trim()}
                  onClick={() => setJoined(true)}
                  style={{ marginBottom: 12 }}
                >
                  Start Playing
                </button>
                <button 
                  className="btn btn--ghost btn--sm text-muted" 
                  onClick={() => setRole(null)}
                >
                  ← Back
                </button>
              </div>
            )}
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
  const isMyTurn = currentTurn && role === 'player' ? currentTurn.memberName.toLowerCase() === playerName.toLowerCase() : true
  
  const handleSelect = (i) => {
    if (revealed || !channel || role === 'spectator') return
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
          <div style={{ background: isMyTurn && role === 'player' ? 'rgba(0,229,160,0.1)' : 'rgba(255,255,255,0.05)', padding: 12, borderRadius: 12, marginBottom: 20, border: `1px solid ${isMyTurn && role === 'player' ? 'var(--c-success)' : 'var(--c-border)'}` }}>
            <p className="text-sm text-center">
              Current Turn: <strong>{currentTurn.memberName}</strong> ({currentTeamName})
              {isMyTurn && role === 'player' && <span style={{ display: 'block', color: 'var(--c-success)', marginTop: 4, fontWeight: 700 }}>It's your turn!</span>}
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
                  disabled={revealed || role === 'spectator'}
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
