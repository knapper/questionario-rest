import { useState, useCallback } from 'react'
import InitView from './views/InitView'
import BuilderView from './views/BuilderView'
import DashboardView from './views/DashboardView'
import ModeSelectView from './views/ModeSelectView'
import TeamSetupView from './views/TeamSetupView'
import AdminLiveView from './views/AdminLiveView'
import GameView from './views/GameView'
import TeamGameView from './views/TeamGameView'
import MobilePlayerView from './views/MobilePlayerView'
import { StarsBg } from './components/StarsBg'
import { ToastContainer } from './components/Toast'

// BroadcastChannel name – must match in both tabs
export const CHANNEL_NAME = 'questionario_game'

// Detect which tab mode this window is
const urlParams = new URLSearchParams(window.location.search)
const IS_GAME_TAB      = urlParams.get('mode') === 'game'
const IS_TEAM_GAME_TAB = urlParams.get('mode') === 'teamgame'
const IS_MOBILE_JOIN   = !!urlParams.get('join')

export default function App() {
  // 'init' | 'builder' | 'dashboard' | 'mode-select' | 'team-setup' | 'admin-live'
  const [view, setView] = useState('init')
  const [questionSet, setQuestionSet] = useState({ name: '', questions: [] })
  // gameConfig tracks: { mode: 'simple' | 'team', teams?: [] }
  const [gameConfig, setGameConfig] = useState({ mode: null })
  const [toasts, setToasts] = useState([])

  const addToast = useCallback((msg, type = 'info') => {
    const id = Date.now()
    setToasts(t => [...t, { id, msg, type }])
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500)
  }, [])

  // ── Game tabs render their own views immediately ─────────────────
  if (IS_GAME_TAB) {
    return (
      <>
        <StarsBg />
        <GameView />
      </>
    )
  }
  if (IS_TEAM_GAME_TAB) {
    return (
      <>
        <StarsBg />
        <TeamGameView />
      </>
    )
  }
  if (IS_MOBILE_JOIN) {
    return (
      <>
        <StarsBg />
        <MobilePlayerView />
      </>
    )
  }

  // ── Handlers ─────────────────────────────────────────────────────
  const handleSetLoaded = (set) => {
    setQuestionSet(set)
    setView('dashboard')
    addToast('Question set loaded successfully!', 'success')
  }

  const handleSetCreated = (set) => {
    setQuestionSet(set)
    setView('dashboard')
    addToast('Question set created!', 'success')
  }

  const handleNewSet = () => {
    setQuestionSet({ name: '', questions: [] })
    setView('init')
  }

  // Simple game
  const handleStartSimple = () => {
    sessionStorage.setItem('questionario_set', JSON.stringify(questionSet))
    const url = `${window.location.origin}${window.location.pathname}?mode=game`
    window.open(url, '_blank')
    setGameConfig({ mode: 'simple' })
    setView('admin-live')
    addToast('Game tab opened! Watch the live progress here.', 'info')
  }

  // Team game – receives configured teams from TeamSetupView
  const handleStartTeam = (teams) => {
    sessionStorage.setItem('questionario_team_game', JSON.stringify({ questionSet, teams }))
    const url = `${window.location.origin}${window.location.pathname}?mode=teamgame`
    window.open(url, '_blank')
    setGameConfig({ mode: 'team', teams })
    setView('admin-live')
    addToast('Team game tab opened!', 'info')
  }

  return (
    <>
      <StarsBg />

      {view === 'init' && (
        <InitView
          onLoad={handleSetLoaded}
          onCreate={() => setView('builder')}
          addToast={addToast}
        />
      )}

      {view === 'builder' && (
        <BuilderView
          onFinish={handleSetCreated}
          addToast={addToast}
        />
      )}

      {view === 'dashboard' && (
        <DashboardView
          questionSet={questionSet}
          onStartGame={() => setView('mode-select')}
          onNewSet={handleNewSet}
          addToast={addToast}
        />
      )}

      {view === 'mode-select' && (
        <ModeSelectView
          questionSet={questionSet}
          onSimple={handleStartSimple}
          onTeam={() => setView('team-setup')}
          onBack={() => setView('dashboard')}
        />
      )}

      {view === 'team-setup' && (
        <TeamSetupView
          questionSet={questionSet}
          onStart={handleStartTeam}
          onBack={() => setView('mode-select')}
          addToast={addToast}
        />
      )}

      {view === 'admin-live' && (
        <AdminLiveView
          questionSet={questionSet}
          gameConfig={gameConfig}
          onBack={() => setView('dashboard')}
          addToast={addToast}
        />
      )}

      <ToastContainer toasts={toasts} />
    </>
  )
}
