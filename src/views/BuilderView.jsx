import { useState } from 'react'
import { supabase } from '../lib/supabase'

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F']

function generateHexCode() {
  return Math.random().toString(16).substring(2, 8).toUpperCase()
}

function getDefaultQuestion(type) {
  if (type === 'truefalse') {
    return {
      type: 'truefalse',
      text: '',
      options: ['True', 'False'],
      correctIndex: 0,
      points: 10,
    }
  }
  return {
    type: 'multiple',
    text: '',
    options: ['', ''],
    correctIndex: 0,
    points: 10,
  }
}

// Step 0 – name the set
function SetNameStep({ name, setName, onNext }) {
  return (
    <div className="anim-fade-up">
      <h2 className="heading-lg" style={{ marginBottom: 8 }}>Name your set</h2>
      <p className="text-muted" style={{ marginBottom: 28 }}>Give your question set a title before adding questions.</p>
      <div className="form-group">
        <label className="form-label" htmlFor="set-name">Set Name</label>
        <input
          id="set-name"
          className="form-input"
          placeholder="e.g. History Quiz 2024"
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && name.trim() && onNext()}
          autoFocus
        />
      </div>
      <button
        id="btn-set-name-next"
        className="btn btn--primary btn--full btn--lg"
        disabled={!name.trim()}
        onClick={onNext}
      >
        Start Adding Questions →
      </button>
    </div>
  )
}

// Step 1 – pick question type
function TypeStep({ onPick }) {
  return (
    <div className="anim-fade-up">
      <h2 className="heading-lg" style={{ marginBottom: 8 }}>Question type</h2>
      <p className="text-muted" style={{ marginBottom: 28 }}>Choose the type for this question.</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <button
          id="btn-type-multiple"
          className="btn btn--ghost btn--full"
          style={{ padding: '22px 20px', justifyContent: 'flex-start', gap: 16 }}
          onClick={() => onPick('multiple')}
        >
          <span style={{ fontSize: '1.8rem' }}>🔘</span>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontWeight: 700, fontSize: '1rem' }}>Multiple Choice</div>
            <div className="text-muted text-sm">2–6 options with one correct answer</div>
          </div>
        </button>
        <button
          id="btn-type-truefalse"
          className="btn btn--ghost btn--full"
          style={{ padding: '22px 20px', justifyContent: 'flex-start', gap: 16 }}
          onClick={() => onPick('truefalse')}
        >
          <span style={{ fontSize: '1.8rem' }}>⚖️</span>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontWeight: 700, fontSize: '1rem' }}>True / False</div>
            <div className="text-muted text-sm">Binary yes/no style question</div>
          </div>
        </button>
      </div>
    </div>
  )
}

// Step 2 – fill the question
function QuestionStep({ q, setQ, questionNumber, onBack, onSave }) {
  const isMultiple = q.type === 'multiple'

  const addOption = () => {
    if (q.options.length >= 6) return
    setQ({ ...q, options: [...q.options, ''] })
  }
  const removeOption = (i) => {
    if (q.options.length <= 2) return
    const opts = q.options.filter((_, idx) => idx !== i)
    const ci = q.correctIndex >= opts.length ? opts.length - 1 : q.correctIndex
    setQ({ ...q, options: opts, correctIndex: ci })
  }
  const updateOption = (i, val) => {
    const opts = [...q.options]
    opts[i] = val
    setQ({ ...q, options: opts })
  }

  const canSave = q.text.trim() && q.options.every(o => o.trim()) && q.points > 0

  return (
    <div className="anim-fade-up">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <button id="btn-q-back" className="btn btn--ghost btn--sm" onClick={onBack}>← Back</button>
        <span className="badge badge--primary">
          {q.type === 'truefalse' ? '⚖️ True / False' : '🔘 Multiple Choice'}
        </span>
      </div>

      <h2 className="heading-lg" style={{ marginBottom: 8 }}>Question {questionNumber}</h2>
      <p className="text-muted" style={{ marginBottom: 24 }}>Fill in the details below.</p>

      {/* Question text */}
      <div className="form-group">
        <label className="form-label" htmlFor="q-text">Question Text</label>
        <textarea
          id="q-text"
          className="form-textarea"
          placeholder="Type your question here…"
          value={q.text}
          onChange={e => setQ({ ...q, text: e.target.value })}
          rows={3}
          autoFocus
        />
      </div>

      {/* Options */}
      <div className="form-group">
        <label className="form-label">Answer Options</label>
        {q.options.map((opt, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            {/* Correct radio */}
            <button
              id={`btn-correct-${i}`}
              title="Mark as correct"
              onClick={() => setQ({ ...q, correctIndex: i })}
              style={{
                minWidth: 28, height: 28, borderRadius: '50%',
                border: `2px solid ${q.correctIndex === i ? 'var(--c-success)' : 'var(--c-border)'}`,
                background: q.correctIndex === i ? 'rgba(0,229,160,0.2)' : 'transparent',
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {q.correctIndex === i && <span style={{ fontSize: '0.7rem', color: 'var(--c-success)' }}>✓</span>}
            </button>

            {/* Letter label */}
            <span style={{
              minWidth: 28, height: 28, borderRadius: 7,
              background: 'rgba(255,255,255,0.07)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.78rem', fontWeight: 700, color: 'var(--c-text-muted)',
              flexShrink: 0,
            }}>{LETTERS[i]}</span>

            {isMultiple ? (
              <input
                id={`opt-input-${i}`}
                className="form-input"
                placeholder={`Option ${LETTERS[i]}`}
                value={opt}
                onChange={e => updateOption(i, e.target.value)}
                style={{ flex: 1 }}
              />
            ) : (
              <div className="form-input" style={{ flex: 1, display: 'flex', alignItems: 'center', opacity: 0.7 }}>{opt}</div>
            )}

            {isMultiple && q.options.length > 2 && (
              <button
                id={`btn-remove-opt-${i}`}
                onClick={() => removeOption(i)}
                className="btn btn--ghost btn--sm"
                style={{ padding: '6px 10px', color: 'var(--c-danger)', borderColor: 'rgba(255,78,106,0.3)' }}
                title="Remove option"
              >✕</button>
            )}
          </div>
        ))}

        {isMultiple && q.options.length < 6 && (
          <button id="btn-add-option" className="btn btn--ghost btn--sm" style={{ marginTop: 4 }} onClick={addOption}>
            + Add Option
          </button>
        )}
      </div>

      {/* Points */}
      <div className="form-group">
        <label className="form-label" htmlFor="q-points">Points Value</label>
        <input
          id="q-points"
          type="number"
          className="form-input"
          min={1} max={1000} step={5}
          value={q.points}
          onChange={e => setQ({ ...q, points: Number(e.target.value) })}
          style={{ maxWidth: 140 }}
        />
      </div>

      <button
        id="btn-save-question"
        className="btn btn--primary btn--full btn--lg"
        disabled={!canSave}
        onClick={onSave}
        style={{ marginTop: 8 }}
      >
        Save Question ✓
      </button>
    </div>
  )
}

// Finish prompt
function FinishStep({ questionCount, onAddMore, onFinish, questions, setName, addToast }) {
  const [isSaving, setIsSaving] = useState(false)
  const [savedCode, setSavedCode] = useState(null)
  const [errorMsg, setErrorMsg] = useState(null)

  const handleSaveToDb = async () => {
    setIsSaving(true)
    setErrorMsg(null)
    const code = generateHexCode()
    try {
      if (!supabase.supabaseUrl) {
        throw new Error('Supabase is not configured yet. Set .env variables.')
      }
      
      const { error } = await supabase.from('games').insert([
        {
          short_code: code,
          name: setName,
          questions: questions,
          is_mobile_active: false,
          current_state: {}
        }
      ])

      if (error) throw error

      setSavedCode(code)
      addToast('Saved to database!', 'success')
    } catch (err) {
      console.error(err)
      setErrorMsg(err.message || 'Error saving to database')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="anim-fade-up" style={{ textAlign: 'center' }}>
      <div style={{ fontSize: '3.5rem', marginBottom: 16 }}>🎉</div>
      <h2 className="heading-lg" style={{ marginBottom: 8 }}>Questions Complete!</h2>
      <p className="text-muted" style={{ marginBottom: 32 }}>
        You have <strong style={{ color: 'var(--c-text)' }}>{questionCount}</strong> question{questionCount !== 1 ? 's' : ''} in this set.
      </p>

      {savedCode ? (
        <div style={{ marginBottom: 24, padding: 20, background: 'rgba(0,229,160,0.1)', borderRadius: 12, border: '1px solid rgba(0,229,160,0.3)' }}>
          <p style={{ color: 'var(--c-success)', fontWeight: 600, marginBottom: 8 }}>Successfully saved to database!</p>
          <p className="text-sm text-muted" style={{ marginBottom: 12 }}>Your Access Code is:</p>
          <div style={{ fontSize: '2.5rem', fontWeight: 800, letterSpacing: 4 }}>{savedCode}</div>
          <p className="text-xs text-muted" style={{ marginTop: 12 }}>Share this code or use it to load this game later.</p>
        </div>
      ) : (
        <div style={{ marginBottom: 24 }}>
          <p className="text-sm" style={{ marginBottom: 12 }}>Would you like to save this game to the database for future use?</p>
          {errorMsg && <p className="text-xs" style={{ color: 'var(--c-danger)', marginBottom: 12 }}>{errorMsg}</p>}
          <button 
            className="btn btn--ghost btn--full" 
            onClick={handleSaveToDb}
            disabled={isSaving}
            style={{ border: '1px solid var(--c-primary)', color: 'var(--c-primary)', marginBottom: 12 }}
          >
            {isSaving ? 'Saving...' : '💾 Save & Generate Code'}
          </button>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <button id="btn-add-more" className="btn btn--primary btn--full btn--lg" onClick={onAddMore} disabled={isSaving}>
          ➕ Add Another Question
        </button>
        <button id="btn-finish-set" className="btn btn--success btn--full btn--lg" onClick={() => onFinish(savedCode)} disabled={isSaving}>
          ✅ Finish & Go to Dashboard
        </button>
      </div>
    </div>
  )
}

export default function BuilderView({ onFinish, addToast }) {
  const [setName, setSetName] = useState('')
  const [step, setStep] = useState('name') // 'name' | 'type' | 'question' | 'finish'
  const [questions, setQuestions] = useState([])
  const [currentQ, setCurrentQ] = useState(null)

  const handleTypePicked = (type) => {
    setCurrentQ(getDefaultQuestion(type))
    setStep('question')
  }

  const handleSaveQuestion = () => {
    const saved = [...questions, currentQ]
    setQuestions(saved)
    addToast(`Question ${saved.length} saved!`, 'success')
    setCurrentQ(null)
    setStep('finish')
  }

  const handleAddMore = () => {
    setStep('type')
  }

  const handleFinish = (savedCode) => {
    if (questions.length === 0) {
      addToast('Add at least one question first.', 'error')
      return
    }
    onFinish({ name: setName.trim(), questions, hexCode: savedCode })
  }

  // Progress breadcrumb bar at top
  const questionNumber = questions.length + 1

  return (
    <div className="page">
      <div className="container" style={{ maxWidth: 640 }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 36 }}>
          <div className="logo">
            <span className="logo__icon">🎯</span>
            Questionario
          </div>
          {setName && (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span className="badge badge--primary">📝 {setName}</span>
              {questions.length > 0 && (
                <span className="badge badge--gold">⭐ {questions.length} Q</span>
              )}
            </div>
          )}
        </div>

        <div className="card">
          {step === 'name' && (
            <SetNameStep
              name={setName}
              setName={setSetName}
              onNext={() => setStep('type')}
            />
          )}
          {step === 'type' && (
            <TypeStep
              onPick={handleTypePicked}
            />
          )}
          {step === 'question' && currentQ && (
            <QuestionStep
              q={currentQ}
              setQ={setCurrentQ}
              questionNumber={questionNumber}
              onBack={() => setStep('type')}
              onSave={handleSaveQuestion}
            />
          )}
          {step === 'finish' && (
            <FinishStep
              questionCount={questions.length}
              onAddMore={handleAddMore}
              onFinish={handleFinish}
              questions={questions}
              setName={setName.trim()}
              addToast={addToast}
            />
          )}
        </div>

        {/* Mini question list preview */}
        {questions.length > 0 && step !== 'finish' && (
          <div style={{ marginTop: 24 }} className="anim-fade-up">
            <p className="text-muted text-sm" style={{ marginBottom: 10 }}>Questions added so far:</p>
            <div className="q-dots">
              {questions.map((_, i) => (
                <div key={i} className="q-dot done" title={`Q${i + 1}`} />
              ))}
              {step === 'question' && <div className="q-dot active" />}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
