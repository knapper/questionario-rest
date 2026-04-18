import { useRef } from 'react'

export default function InitView({ onLoad, onCreate, addToast }) {
  const fileRef = useRef()

  const handleFile = (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (!file.name.endsWith('.json')) {
      addToast('Please upload a valid .json file.', 'error')
      return
    }
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result)
        if (!data.name || !Array.isArray(data.questions)) throw new Error('Invalid format')
        onLoad(data)
      } catch {
        addToast('Invalid backup file format.', 'error')
      }
    }
    reader.readAsText(file)
  }

  return (
    <div className="page">
      <div className="container" style={{ maxWidth: 560 }}>
        {/* Logo */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 48, marginTop: 16 }}>
          <div className="logo anim-fade-up">
            <span className="logo__icon">🎯</span>
            Questionario
          </div>
        </div>

        {/* Hero text */}
        <div className="anim-fade-up" style={{ animationDelay: '0.1s', textAlign: 'center', marginBottom: 48 }}>
          <h1 className="heading-xl" style={{ marginBottom: 16 }}>
            Build & Play<br />Trivia Games
          </h1>
          <p className="text-muted">
            Create interactive question sets, launch a live game, and track scores in real time — all in your browser.
          </p>
        </div>

        {/* Choice cards */}
        <div className="anim-fade-up" style={{ animationDelay: '0.2s', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Upload backup */}
          <div
            className="card"
            style={{ cursor: 'pointer', transition: 'all 0.22s' }}
            onClick={() => fileRef.current?.click()}
            role="button"
            tabIndex={0}
            onKeyDown={e => e.key === 'Enter' && fileRef.current?.click()}
          >
            <input
              ref={fileRef}
              type="file"
              accept=".json"
              style={{ display: 'none' }}
              onChange={handleFile}
              id="file-upload"
            />
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20 }}>
              <div style={{
                minWidth: 52, height: 52,
                background: 'rgba(108,99,255,0.15)',
                border: '1px solid rgba(108,99,255,0.3)',
                borderRadius: 14,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.6rem',
              }}>📂</div>
              <div>
                <h2 className="heading-md" style={{ marginBottom: 6 }}>Upload Backup</h2>
                <p className="text-muted text-sm">I already have a <code style={{ color: 'var(--c-primary)', background: 'rgba(108,99,255,0.1)', padding: '1px 6px', borderRadius: 4 }}>.json</code> backup file from a previous session.</p>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className="divider" style={{ flex: 1, margin: 0 }} />
            <span className="text-muted text-sm" style={{ whiteSpace: 'nowrap' }}>or</span>
            <div className="divider" style={{ flex: 1, margin: 0 }} />
          </div>

          {/* Create new */}
          <div
            className="card"
            style={{ cursor: 'pointer' }}
            onClick={onCreate}
            role="button"
            tabIndex={0}
            onKeyDown={e => e.key === 'Enter' && onCreate()}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20 }}>
              <div style={{
                minWidth: 52, height: 52,
                background: 'rgba(0,229,160,0.12)',
                border: '1px solid rgba(0,229,160,0.25)',
                borderRadius: 14,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.6rem',
              }}>✨</div>
              <div>
                <h2 className="heading-md" style={{ marginBottom: 6 }}>Create New Set</h2>
                <p className="text-muted text-sm">Build a brand new set of questions from scratch, one by one.</p>
              </div>
            </div>
          </div>
        </div>

        <p className="text-muted text-xs anim-fade-up" style={{ animationDelay: '0.3s', textAlign: 'center', marginTop: 36 }}>
          Your questions never leave your browser — everything stays local.
        </p>
      </div>
    </div>
  )
}
