const EMOJI_OPTIONS = [
  '🦁','🐯','🦊','🐺','🐻','🐼','🦄','🐲','🦅','🦉',
  '🐬','🦈','🐙','🦂','🦋','🐝','🦖','🤖','👾','🧠',
  '🔥','⚡','🌊','🌪️','💎','🏆','⚔️','🛡️','🚀','🎯',
]

function EmojiPicker({ value, onChange }) {
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: 6,
      background: 'rgba(0,0,0,0.3)', padding: 12, borderRadius: 12,
      border: '1px solid var(--c-border)',
    }}>
      {EMOJI_OPTIONS.map(e => (
        <button
          key={e}
          type="button"
          onClick={() => onChange(e)}
          style={{
            fontSize: '1.4rem', background: 'none', border: 'none', cursor: 'pointer',
            borderRadius: 8, padding: '4px 2px',
            outline: value === e ? '2px solid var(--c-primary)' : 'none',
            backgroundColor: value === e ? 'rgba(108,99,255,0.2)' : 'transparent',
            transition: 'all 0.15s',
          }}
          title={e}
        >{e}</button>
      ))}
    </div>
  )
}

// ────────────── Step 1: Create Teams ──────────────
function TeamsStep({ teams, setTeams, onNext, onBack }) {
  const addTeam = () => {
    if (teams.length >= 6) return
    const usedEmojis = teams.map(t => t.emoji)
    const nextEmoji = EMOJI_OPTIONS.find(e => !usedEmojis.includes(e)) || '🎯'
    setTeams([...teams, { name: '', emoji: nextEmoji, members: [] }])
  }

  const removeTeam = (i) => {
    if (teams.length <= 2) return
    setTeams(teams.filter((_, idx) => idx !== i))
  }

  const updateTeam = (i, field, val) => {
    const updated = [...teams]
    updated[i] = { ...updated[i], [field]: val }
    setTeams(updated)
  }

  const [expandedPicker, setExpandedPicker] = useState(null)

  const canContinue = teams.length >= 2 && teams.every(t => t.name.trim())

  return (
    <div className="anim-fade-up">
      <button id="btn-team-setup-back" className="btn btn--ghost btn--sm" style={{ marginBottom: 20 }} onClick={onBack}>
        ← Back
      </button>
      <h2 className="heading-lg" style={{ marginBottom: 6 }}>Create Teams</h2>
      <p className="text-muted" style={{ marginBottom: 24 }}>Add at least 2 teams. Give each a name and pick an emoji.</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 20 }}>
        {teams.map((team, i) => (
          <div key={i} className="card" style={{ padding: '20px 22px' }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', flexWrap: 'wrap' }}>
              {/* Emoji button */}
              <button
                type="button"
                id={`btn-emoji-${i}`}
                onClick={() => setExpandedPicker(expandedPicker === i ? null : i)}
                style={{
                  fontSize: '2rem', background: 'rgba(255,255,255,0.07)',
                  border: '1px solid var(--c-border)', borderRadius: 12,
                  width: 56, height: 56, cursor: 'pointer', flexShrink: 0,
                  transition: 'all 0.2s',
                }}
                title="Pick emoji"
              >{team.emoji}</button>

              {/* Name input */}
              <div style={{ flex: 1, minWidth: 160 }}>
                <input
                  id={`input-team-name-${i}`}
                  className="form-input"
                  placeholder={`Team ${i + 1} name…`}
                  value={team.name}
                  onChange={e => updateTeam(i, 'name', e.target.value)}
                />
              </div>

              {/* Remove */}
              {teams.length > 2 && (
                <button
                  id={`btn-remove-team-${i}`}
                  className="btn btn--ghost btn--sm"
                  style={{ color: 'var(--c-danger)', borderColor: 'rgba(255,78,106,0.3)', flexShrink: 0 }}
                  onClick={() => removeTeam(i)}
                >✕</button>
              )}
            </div>

            {/* Emoji picker dropdown */}
            {expandedPicker === i && (
              <div style={{ marginTop: 14 }}>
                <EmojiPicker
                  value={team.emoji}
                  onChange={e => { updateTeam(i, 'emoji', e); setExpandedPicker(null) }}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {teams.length < 6 && (
        <button id="btn-add-team" className="btn btn--ghost btn--full" style={{ marginBottom: 24 }} onClick={addTeam}>
          + Add Team
        </button>
      )}

      <button
        id="btn-teams-next"
        className="btn btn--primary btn--full btn--lg"
        disabled={!canContinue}
        onClick={onNext}
      >
        Add Members →
      </button>
    </div>
  )
}

// ────────────── Step 2: Add Members ──────────────
function MembersStep({ teams, setTeams, onNext, onBack }) {
  const [newMember, setNewMember] = useState(teams.map(() => ''))

  const addMember = (teamIdx) => {
    const name = newMember[teamIdx].trim()
    if (!name) return
    const updated = [...teams]
    updated[teamIdx] = { ...updated[teamIdx], members: [...updated[teamIdx].members, name] }
    setTeams(updated)
    const nm = [...newMember]; nm[teamIdx] = ''; setNewMember(nm)
  }

  const removeMember = (teamIdx, memberIdx) => {
    const updated = [...teams]
    updated[teamIdx] = { ...updated[teamIdx], members: updated[teamIdx].members.filter((_, i) => i !== memberIdx) }
    setTeams(updated)
  }

  const canStart = teams.every(t => t.members.length >= 1)

  return (
    <div className="anim-fade-up">
      <button id="btn-members-back" className="btn btn--ghost btn--sm" style={{ marginBottom: 20 }} onClick={onBack}>
        ← Back to Teams
      </button>
      <h2 className="heading-lg" style={{ marginBottom: 6 }}>Add Members</h2>
      <p className="text-muted" style={{ marginBottom: 24 }}>Add at least 1 member per team.</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginBottom: 28 }}>
        {teams.map((team, ti) => (
          <div key={ti} className="card" style={{ padding: '20px 22px' }}>
            {/* Team header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <span style={{ fontSize: '1.6rem' }}>{team.emoji}</span>
              <span style={{ fontWeight: 700, fontSize: '1.05rem' }}>{team.name}</span>
              <span className="badge badge--primary">{team.members.length} members</span>
            </div>

            {/* Member list */}
            {team.members.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
                {team.members.map((m, mi) => (
                  <span key={mi} style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    background: 'rgba(255,255,255,0.07)', border: '1px solid var(--c-border)',
                    borderRadius: 99, padding: '4px 12px', fontSize: '0.875rem',
                  }}>
                    {m}
                    <button
                      id={`btn-remove-member-${ti}-${mi}`}
                      onClick={() => removeMember(ti, mi)}
                      style={{ background: 'none', border: 'none', color: 'var(--c-danger)', cursor: 'pointer', fontSize: '0.75rem', padding: 0 }}
                    >✕</button>
                  </span>
                ))}
              </div>
            )}

            {/* Add member input */}
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                id={`input-member-${ti}`}
                className="form-input"
                placeholder="Member name…"
                value={newMember[ti]}
                onChange={e => { const nm = [...newMember]; nm[ti] = e.target.value; setNewMember(nm) }}
                onKeyDown={e => e.key === 'Enter' && addMember(ti)}
                style={{ flex: 1 }}
              />
              <button
                id={`btn-add-member-${ti}`}
                className="btn btn--primary btn--sm"
                onClick={() => addMember(ti)}
                disabled={!newMember[ti].trim()}
              >Add</button>
            </div>
          </div>
        ))}
      </div>

      <button
        id="btn-launch-team-game"
        className="btn btn--success btn--full btn--lg"
        disabled={!canStart}
        onClick={onNext}
        style={{ fontSize: '1.1rem' }}
      >
        🚀 Launch Team Game
      </button>
    </div>
  )
}

// ────────────── Main TeamSetupView ──────────────
import { useState } from 'react'

export default function TeamSetupView({ questionSet, onStart, onBack, addToast }) {
  const [step, setStep] = useState('teams')
  const [teams, setTeams] = useState([
    { name: '', emoji: '🦁', members: [] },
    { name: '', emoji: '🦊', members: [] },
  ])

  const handleLaunch = () => {
    for (const t of teams) {
      if (!t.name.trim()) { addToast('All teams must have a name.', 'error'); return }
      if (t.members.length === 0) { addToast(`${t.name} needs at least 1 member.`, 'error'); return }
    }
    onStart(teams)
  }

  return (
    <div className="page">
      <div className="container" style={{ maxWidth: 640 }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 36 }}>
          <div className="logo">
            <span className="logo__icon">🎯</span>
            Questionario
          </div>
          <span className="badge badge--primary">⚔️ Team vs Team</span>
        </div>

        {/* Step indicator */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 32, alignItems: 'center' }}>
          {['teams', 'members'].map((s, i) => (
            <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%',
                background: step === s ? 'var(--g-primary)' : (
                  (s === 'members' && step === 'members') ? 'var(--g-primary)' : 'rgba(255,255,255,0.1)'
                ),
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.8rem', fontWeight: 700,
                border: step === s ? 'none' : '1px solid var(--c-border)',
              }}>{i + 1}</div>
              <span className="text-sm" style={{ color: step === s ? 'var(--c-text)' : 'var(--c-text-muted)' }}>
                {s === 'teams' ? 'Create Teams' : 'Add Members'}
              </span>
              {i < 1 && <div style={{ width: 40, height: 1, background: 'var(--c-border)' }} />}
            </div>
          ))}
        </div>

        <div className="card">
          {step === 'teams' && (
            <TeamsStep
              teams={teams}
              setTeams={setTeams}
              onNext={() => setStep('members')}
              onBack={onBack}
            />
          )}
          {step === 'members' && (
            <MembersStep
              teams={teams}
              setTeams={setTeams}
              onNext={handleLaunch}
              onBack={() => setStep('teams')}
            />
          )}
        </div>
      </div>
    </div>
  )
}
