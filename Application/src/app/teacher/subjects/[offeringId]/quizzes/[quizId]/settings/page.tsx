'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import {
  ArrowLeft, Save, CheckCircle2, Users, Clock, HelpCircle,
  BarChart2, Shield, MessageSquare, Eye, GitBranch, Copy, AlertCircle,
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Input'
import { MOCK_QUIZZES, MOCK_OFFERINGS } from '@/lib/mock-data'
import type {
  Quiz, AttemptGradingMethod, TimerBehavior, NavigationMode,
  QuestionDisplayMode, FeedbackTiming, FeedbackLevel, QuizSecuritySettings,
} from '@/types'

// ─── Types ────────────────────────────────────────────────────────────────────

type SectionKey =
  | 'attempts'
  | 'timing'
  | 'questions'
  | 'scoring'
  | 'behavior'
  | 'security'
  | 'feedback'
  | 'release'

interface FormState {
  // Attempts
  maxAttempts: number
  gradingMethod: AttemptGradingMethod
  allowResume: boolean
  // Timing
  duration: number
  timerBehavior: TimerBehavior
  overtimePenaltyPerMin: number
  // Questions
  shuffleQuestions: boolean
  shuffleOptions: boolean
  questionDisplayMode: QuestionDisplayMode
  randomPoolSize: number
  // Scoring
  partialCreditEnabled: boolean
  negativeMarkingEnabled: boolean
  negativeMarkingPenalty: number
  // Behavior
  navigationMode: NavigationMode
  autoSaveInterval: number
  // Security
  security: QuizSecuritySettings
  // Feedback
  feedbackTiming: FeedbackTiming
  feedbackLevel: FeedbackLevel
  // Release
  visibility: 'DRAFT' | 'PUBLISHED' | 'SCHEDULED'
  scheduledReleaseDate: string
  gradeWeight: number
  allowScoreOverride: boolean
}

// ─── Nav sections ─────────────────────────────────────────────────────────────

const NAV_SECTIONS: { key: SectionKey; label: string; icon: React.ReactNode }[] = [
  { key: 'attempts',  label: 'Attempts',  icon: <Users className="h-4 w-4" /> },
  { key: 'timing',    label: 'Timing',    icon: <Clock className="h-4 w-4" /> },
  { key: 'questions', label: 'Questions', icon: <HelpCircle className="h-4 w-4" /> },
  { key: 'scoring',   label: 'Scoring',   icon: <BarChart2 className="h-4 w-4" /> },
  { key: 'behavior',  label: 'Behavior',  icon: <GitBranch className="h-4 w-4" /> },
  { key: 'security',  label: 'Security',  icon: <Shield className="h-4 w-4" /> },
  { key: 'feedback',  label: 'Feedback',  icon: <MessageSquare className="h-4 w-4" /> },
  { key: 'release',   label: 'Release',   icon: <Eye className="h-4 w-4" /> },
]

// ─── Reusable sub-components ──────────────────────────────────────────────────

function SectionHeading({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <span className="text-brand-600">{icon}</span>
      <h2 className="text-sm font-bold text-slate-900 uppercase tracking-widest">{children}</h2>
    </div>
  )
}

function InfoBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 flex gap-3">
      <AlertCircle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
      <p className="text-sm text-amber-800 leading-relaxed">{children}</p>
    </div>
  )
}

function Toggle({
  value,
  onChange,
  id,
}: {
  value: boolean
  onChange: (v: boolean) => void
  id?: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={value}
      id={id}
      onClick={() => onChange(!value)}
      className={[
        'relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-1',
        value ? 'bg-brand-500' : 'bg-slate-200',
      ].join(' ')}
    >
      <span
        className={[
          'inline-block h-4 w-4 rounded-full bg-white shadow transition-transform duration-200',
          value ? 'translate-x-6' : 'translate-x-1',
        ].join(' ')}
      />
    </button>
  )
}

function ToggleRow({
  label,
  description,
  value,
  onChange,
}: {
  label: string
  description: string
  value: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-800">{label}</p>
        <p className="text-xs text-slate-500 mt-0.5">{description}</p>
      </div>
      <Toggle value={value} onChange={onChange} />
    </div>
  )
}

interface RadioCardOption<T extends string> {
  value: T
  label: string
  description: string
}

function RadioCardGroup<T extends string>({
  options,
  value,
  onChange,
  name,
}: {
  options: RadioCardOption<T>[]
  value: T
  onChange: (v: T) => void
  name: string
}) {
  return (
    <div className="grid gap-2.5" style={{ gridTemplateColumns: `repeat(${options.length}, 1fr)` }}>
      {options.map((opt) => {
        const checked = value === opt.value
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={[
              'relative rounded-xl border px-4 py-3 text-left transition-all duration-150 cursor-pointer',
              checked
                ? 'border-brand-600 bg-brand-50 ring-2 ring-brand-200'
                : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50',
            ].join(' ')}
          >
            <input
              type="radio"
              name={name}
              value={opt.value}
              checked={checked}
              onChange={() => onChange(opt.value)}
              className="sr-only"
            />
            <p className={`text-sm font-semibold ${checked ? 'text-brand-700' : 'text-slate-800'}`}>
              {opt.label}
            </p>
            <p className={`mt-0.5 text-xs ${checked ? 'text-brand-600' : 'text-slate-500'}`}>
              {opt.description}
            </p>
          </button>
        )
      })}
    </div>
  )
}

// ─── Toast ────────────────────────────────────────────────────────────────────

function Toast({
  message,
  link,
  onClose,
}: {
  message: string
  link?: { href: string; label: string }
  onClose: () => void
}) {
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 rounded-xl bg-slate-900 px-5 py-3 shadow-lg text-white text-sm font-medium animate-in slide-in-from-bottom-4 duration-300">
      <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
      <span>{message}</span>
      {link && (
        <Link href={link.href} className="text-brand-300 hover:text-brand-200 underline ml-1">
          {link.label}
        </Link>
      )}
      <button
        onClick={onClose}
        className="ml-2 text-slate-400 hover:text-white transition-colors"
        aria-label="Dismiss"
      >
        ×
      </button>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// Main page
// ═══════════════════════════════════════════════════════════════════════════════

export default function QuizSettingsPage({
  params,
}: {
  params: { offeringId: string; quizId: string }
}) {
  const { offeringId, quizId } = params
  const quiz = MOCK_QUIZZES.find((q) => q.id === quizId)

  if (!quiz) {
    return (
      <div className="max-w-2xl space-y-5">
        <Link
          href={`/teacher/subjects/${offeringId}/quizzes`}
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Quizzes
        </Link>
        <Card>
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <AlertCircle className="h-10 w-10 text-slate-300" />
            <p className="text-slate-500 text-sm font-medium">Assessment not found.</p>
          </div>
        </Card>
      </div>
    )
  }

  return <QuizSettingsContent quiz={quiz} offeringId={offeringId} />
}

// ─── Inner client component ────────────────────────────────────────────────────

function QuizSettingsContent({ quiz, offeringId }: { quiz: Quiz; offeringId: string }) {
  const [activeSection, setActiveSection] = useState<SectionKey>('attempts')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [toast, setToast] = useState<{ message: string; link?: { href: string; label: string } } | null>(null)

  const sectionRefs: Record<SectionKey, React.RefObject<HTMLElement>> = {
    attempts:  useRef<HTMLElement>(null),
    timing:    useRef<HTMLElement>(null),
    questions: useRef<HTMLElement>(null),
    scoring:   useRef<HTMLElement>(null),
    behavior:  useRef<HTMLElement>(null),
    security:  useRef<HTMLElement>(null),
    feedback:  useRef<HTMLElement>(null),
    release:   useRef<HTMLElement>(null),
  }

  const [form, setForm] = useState<FormState>({
    // Attempts
    maxAttempts:            quiz.maxAttempts ?? 1,
    gradingMethod:          quiz.gradingMethod ?? 'HIGHEST',
    allowResume:            quiz.allowResume ?? false,
    // Timing
    duration:               quiz.duration ?? 30,
    timerBehavior:          quiz.timerBehavior ?? 'AUTO_SUBMIT',
    overtimePenaltyPerMin:  quiz.overtimePenaltyPerMin ?? 0,
    // Questions
    shuffleQuestions:       quiz.shuffleQuestions ?? false,
    shuffleOptions:         quiz.shuffleOptions ?? false,
    questionDisplayMode:    quiz.questionDisplayMode ?? 'ONE_PER_PAGE',
    randomPoolSize:         quiz.randomPoolSize ?? 0,
    // Scoring
    partialCreditEnabled:   quiz.partialCreditEnabled ?? false,
    negativeMarkingEnabled: quiz.negativeMarkingEnabled ?? false,
    negativeMarkingPenalty: quiz.negativeMarkingPenalty ?? 25,
    // Behavior
    navigationMode:         quiz.navigationMode ?? 'FREE',
    autoSaveInterval:       quiz.autoSaveInterval ?? 30,
    // Security
    security: {
      fullscreenMode:     quiz.security?.fullscreenMode ?? false,
      disableCopyPaste:   quiz.security?.disableCopyPaste ?? false,
      tabSwitchDetection: quiz.security?.tabSwitchDetection ?? false,
      tabSwitchLimit:     quiz.security?.tabSwitchLimit ?? 3,
      ipTracking:         quiz.security?.ipTracking ?? false,
      browserLock:        quiz.security?.browserLock ?? false,
    },
    // Feedback
    feedbackTiming: quiz.feedbackTiming ?? 'IMMEDIATELY',
    feedbackLevel:  quiz.feedbackLevel ?? 'SCORE_ONLY',
    // Release
    visibility:           (quiz.visibility as 'DRAFT' | 'PUBLISHED' | 'SCHEDULED') ?? 'DRAFT',
    scheduledReleaseDate: quiz.scheduledReleaseDate ?? '',
    gradeWeight:          quiz.gradeWeight ?? 0,
    allowScoreOverride:   quiz.allowScoreOverride ?? false,
  })

  function setF<K extends keyof FormState>(field: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function setSecurity(field: keyof QuizSecuritySettings, value: boolean | number) {
    setForm((prev) => ({
      ...prev,
      security: { ...prev.security, [field]: value },
    }))
  }

  function scrollTo(key: SectionKey) {
    setActiveSection(key)
    sectionRefs[key].current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  async function handleSave() {
    setSaving(true)
    await new Promise((r) => setTimeout(r, 500))

    quiz.maxAttempts            = form.maxAttempts
    quiz.gradingMethod          = form.gradingMethod as AttemptGradingMethod
    quiz.allowResume            = form.allowResume
    quiz.duration               = form.duration
    quiz.timerBehavior          = form.timerBehavior as TimerBehavior
    quiz.overtimePenaltyPerMin  = form.overtimePenaltyPerMin
    quiz.shuffleQuestions       = form.shuffleQuestions
    quiz.shuffleOptions         = form.shuffleOptions
    quiz.questionDisplayMode    = form.questionDisplayMode as QuestionDisplayMode
    quiz.randomPoolSize         = form.randomPoolSize
    quiz.partialCreditEnabled   = form.partialCreditEnabled
    quiz.negativeMarkingEnabled = form.negativeMarkingEnabled
    quiz.negativeMarkingPenalty = form.negativeMarkingPenalty
    quiz.navigationMode         = form.navigationMode as NavigationMode
    quiz.autoSaveInterval       = form.autoSaveInterval
    quiz.security               = form.security
    quiz.feedbackTiming         = form.feedbackTiming as FeedbackTiming
    quiz.feedbackLevel          = form.feedbackLevel as FeedbackLevel
    quiz.scheduledReleaseDate   = form.scheduledReleaseDate || undefined
    quiz.gradeWeight            = form.gradeWeight
    quiz.allowScoreOverride     = form.allowScoreOverride
    quiz.visibility             = form.visibility as Quiz['visibility']
    quiz.isPublished            = form.visibility === 'PUBLISHED'
    quiz.showResultsImmediately = form.feedbackTiming === 'IMMEDIATELY'
    quiz.showCorrectAnswers     = form.feedbackLevel !== 'SCORE_ONLY'

    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  function handleClone() {
    const cloned: Quiz = {
      ...quiz,
      id:          `quiz_${Date.now()}`,
      title:       `Copy of ${quiz.title}`,
      attempts:    [],
      isPublished: false,
      visibility:  'DRAFT',
      createdAt:   new Date().toISOString(),
    }
    MOCK_QUIZZES.push(cloned)
    setToast({
      message: 'Assessment cloned successfully.',
      link:    { href: `/teacher/subjects/${offeringId}/quizzes`, label: 'View quiz list →' },
    })
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* ── Sticky header ──────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-[#e4ebf5] px-6 py-3 flex items-center gap-4">
        <Link
          href={`/teacher/subjects/${offeringId}/quizzes/${quiz.id}`}
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 shrink-0"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Assessment
        </Link>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-800 truncate">
            Assessment Settings — <span className="text-brand-700">{quiz.title}</span>
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            icon={<Copy className="h-3.5 w-3.5" />}
            onClick={handleClone}
          >
            Clone Assessment
          </Button>
          <Button
            size="sm"
            icon={saved ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Save className="h-3.5 w-3.5" />}
            loading={saving}
            onClick={handleSave}
            className={saved ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
          >
            {saved ? 'Saved' : 'Save'}
          </Button>
        </div>
      </div>

      {/* ── Body ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-1 gap-0">
        {/* Left sidebar */}
        <aside className="w-56 shrink-0 border-r border-[#e4ebf5] bg-white sticky top-[57px] self-start h-[calc(100vh-57px)] overflow-y-auto py-4">
          <p className="px-4 mb-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Sections
          </p>
          <nav className="space-y-0.5 px-2">
            {NAV_SECTIONS.map(({ key, label, icon }) => (
              <button
                key={key}
                onClick={() => scrollTo(key)}
                className={[
                  'w-full flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors text-left',
                  activeSection === key
                    ? 'bg-brand-50 text-brand-700'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
                ].join(' ')}
              >
                <span className={activeSection === key ? 'text-brand-600' : 'text-slate-400'}>
                  {icon}
                </span>
                {label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Right content */}
        <div className="flex-1 min-w-0 overflow-y-auto py-6 px-8 space-y-8">

          {/* ── Section 1: Attempts ──────────────────────────────────────── */}
          <section ref={sectionRefs.attempts as React.RefObject<HTMLDivElement>} id="attempts">
            <Card>
              <SectionHeading icon={<Users className="h-4 w-4" />}>Attempts</SectionHeading>

              <div className="space-y-6">
                {/* Number of Attempts */}
                <div>
                  <Select
                    label="Number of Attempts"
                    value={form.maxAttempts.toString()}
                    onChange={(e) => setF('maxAttempts', parseInt(e.target.value))}
                  >
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                    <option value="5">5</option>
                    <option value="99">Unlimited</option>
                  </Select>
                </div>

                {/* Attempt Grading Method */}
                <div>
                  <p className="text-xs font-semibold text-slate-700 tracking-wide mb-2.5">
                    Attempt Grading Method
                  </p>
                  <RadioCardGroup<AttemptGradingMethod>
                    name="gradingMethod"
                    value={form.gradingMethod}
                    onChange={(v) => setF('gradingMethod', v)}
                    options={[
                      { value: 'HIGHEST', label: 'Highest Score',   description: 'Use the best attempt' },
                      { value: 'LATEST',  label: 'Latest Attempt',  description: 'Replace with most recent' },
                      { value: 'AVERAGE', label: 'Average Score',   description: 'Average all attempts' },
                    ]}
                  />
                </div>

                {/* Allow Resume */}
                <div className="border-t border-[#f0f4fa] pt-4">
                  <ToggleRow
                    label="Allow Resume"
                    description="Students can return to an in-progress attempt"
                    value={form.allowResume}
                    onChange={(v) => setF('allowResume', v)}
                  />
                </div>
              </div>
            </Card>
          </section>

          {/* ── Section 2: Timing ────────────────────────────────────────── */}
          <section ref={sectionRefs.timing as React.RefObject<HTMLDivElement>} id="timing">
            <Card>
              <SectionHeading icon={<Clock className="h-4 w-4" />}>Timing</SectionHeading>

              <div className="space-y-6">
                {/* Time Limit */}
                <div className="max-w-xs">
                  <Input
                    label="Time Limit (minutes)"
                    type="number"
                    min="5"
                    max="300"
                    value={form.duration}
                    onChange={(e) => setF('duration', parseInt(e.target.value) || 30)}
                  />
                </div>

                {/* Timer Behavior */}
                <div>
                  <p className="text-xs font-semibold text-slate-700 tracking-wide mb-2.5">
                    Timer Behavior
                  </p>
                  <RadioCardGroup<TimerBehavior>
                    name="timerBehavior"
                    value={form.timerBehavior}
                    onChange={(v) => setF('timerBehavior', v)}
                    options={[
                      {
                        value:       'AUTO_SUBMIT',
                        label:       'Auto-Submit on Timeout',
                        description: 'Assessment submits automatically when timer reaches zero',
                      },
                      {
                        value:       'ALLOW_OVERTIME',
                        label:       'Allow Overtime',
                        description: 'Timer turns red but student can keep working (optional penalty)',
                      },
                    ]}
                  />
                </div>

                {/* Overtime Penalty — shown only when ALLOW_OVERTIME */}
                {form.timerBehavior === 'ALLOW_OVERTIME' && (
                  <div className="max-w-xs">
                    <Input
                      label="Overtime Penalty (pts/min)"
                      type="number"
                      min="0"
                      value={form.overtimePenaltyPerMin}
                      onChange={(e) => setF('overtimePenaltyPerMin', parseFloat(e.target.value) || 0)}
                      hint="0 = no penalty"
                    />
                  </div>
                )}
              </div>
            </Card>
          </section>

          {/* ── Section 3: Questions ─────────────────────────────────────── */}
          <section ref={sectionRefs.questions as React.RefObject<HTMLDivElement>} id="questions">
            <Card>
              <SectionHeading icon={<HelpCircle className="h-4 w-4" />}>Questions</SectionHeading>

              <div className="space-y-6">
                {/* Shuffle Questions */}
                <ToggleRow
                  label="Shuffle Questions"
                  description="Randomize question order for each attempt"
                  value={form.shuffleQuestions}
                  onChange={(v) => setF('shuffleQuestions', v)}
                />

                {/* Shuffle Answer Choices */}
                <div className="border-t border-[#f0f4fa] pt-4">
                  <ToggleRow
                    label="Shuffle Answer Choices"
                    description="Randomize MCQ option order"
                    value={form.shuffleOptions}
                    onChange={(v) => setF('shuffleOptions', v)}
                  />
                </div>

                {/* Question Display */}
                <div className="border-t border-[#f0f4fa] pt-4">
                  <p className="text-xs font-semibold text-slate-700 tracking-wide mb-2.5">
                    Question Display
                  </p>
                  <RadioCardGroup<QuestionDisplayMode>
                    name="questionDisplayMode"
                    value={form.questionDisplayMode}
                    onChange={(v) => setF('questionDisplayMode', v)}
                    options={[
                      {
                        value:       'ONE_PER_PAGE',
                        label:       'One Per Page',
                        description: 'Show questions one at a time with navigation',
                      },
                      {
                        value:       'ALL_AT_ONCE',
                        label:       'All at Once',
                        description: 'Show all questions on a single scrollable page',
                      },
                    ]}
                  />
                </div>

                {/* Random Question Pool */}
                <div className="border-t border-[#f0f4fa] pt-4">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800">Random Question Pool</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Pick a random subset of questions from the pool
                      </p>
                    </div>
                    <Toggle
                      value={form.randomPoolSize > 0}
                      onChange={(v) => setF('randomPoolSize', v ? 5 : 0)}
                    />
                  </div>
                  {form.randomPoolSize > 0 && (
                    <div className="max-w-xs">
                      <Input
                        label="Pool Size"
                        type="number"
                        min="1"
                        value={form.randomPoolSize}
                        onChange={(e) => setF('randomPoolSize', parseInt(e.target.value) || 1)}
                        hint="Number of questions randomly selected per attempt"
                      />
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </section>

          {/* ── Section 4: Scoring ───────────────────────────────────────── */}
          <section ref={sectionRefs.scoring as React.RefObject<HTMLDivElement>} id="scoring">
            <Card>
              <SectionHeading icon={<BarChart2 className="h-4 w-4" />}>Scoring</SectionHeading>

              <div className="space-y-4">
                {/* Partial Credit */}
                <ToggleRow
                  label="Partial Credit"
                  description="Award partial points for partially correct multi-select MCQ answers"
                  value={form.partialCreditEnabled}
                  onChange={(v) => setF('partialCreditEnabled', v)}
                />

                {/* Negative Marking */}
                <div className="border-t border-[#f0f4fa] pt-4 space-y-3">
                  <ToggleRow
                    label="Negative Marking"
                    description={`Deduct ${form.negativeMarkingPenalty}% of question points for each wrong answer`}
                    value={form.negativeMarkingEnabled}
                    onChange={(v) => setF('negativeMarkingEnabled', v)}
                  />
                  {form.negativeMarkingEnabled && (
                    <div className="max-w-xs">
                      <Input
                        label="Penalty (%)"
                        type="number"
                        min="1"
                        max="100"
                        value={form.negativeMarkingPenalty}
                        onChange={(e) => setF('negativeMarkingPenalty', parseInt(e.target.value) || 25)}
                        hint="Percentage of question points deducted per wrong answer"
                      />
                    </div>
                  )}
                </div>

                {/* Info box */}
                <InfoBox>
                  Negative marking only applies to auto-graded questions (MCQ, T/F, Identification).
                </InfoBox>
              </div>
            </Card>
          </section>

          {/* ── Section 5: Behavior ──────────────────────────────────────── */}
          <section ref={sectionRefs.behavior as React.RefObject<HTMLDivElement>} id="behavior">
            <Card>
              <SectionHeading icon={<GitBranch className="h-4 w-4" />}>Behavior</SectionHeading>

              <div className="space-y-6">
                {/* Navigation Mode */}
                <div>
                  <p className="text-xs font-semibold text-slate-700 tracking-wide mb-2.5">
                    Navigation Mode
                  </p>
                  <RadioCardGroup<NavigationMode>
                    name="navigationMode"
                    value={form.navigationMode}
                    onChange={(v) => setF('navigationMode', v)}
                    options={[
                      {
                        value:       'FREE',
                        label:       'Free Navigation',
                        description: 'Students can move between questions freely',
                      },
                      {
                        value:       'ONE_WAY',
                        label:       'One-Way Navigation',
                        description: 'Students cannot return to previous questions',
                      },
                    ]}
                  />
                </div>

                {/* Auto-Save Interval */}
                <div className="border-t border-[#f0f4fa] pt-4 max-w-xs">
                  <Select
                    label="Auto-Save Interval"
                    value={form.autoSaveInterval.toString()}
                    onChange={(e) => setF('autoSaveInterval', parseInt(e.target.value))}
                  >
                    <option value="10">10 seconds</option>
                    <option value="15">15 seconds</option>
                    <option value="30">30 seconds</option>
                    <option value="60">60 seconds</option>
                  </Select>
                  <p className="mt-1.5 text-xs text-slate-400">How often answers are auto-saved</p>
                </div>
              </div>
            </Card>
          </section>

          {/* ── Section 6: Security ──────────────────────────────────────── */}
          <section ref={sectionRefs.security as React.RefObject<HTMLDivElement>} id="security">
            <Card>
              <SectionHeading icon={<Shield className="h-4 w-4" />}>Security</SectionHeading>

              <div className="space-y-1 divide-y divide-[#f0f4fa]">
                {/* Fullscreen Mode */}
                <ToggleRow
                  label="Fullscreen Mode"
                  description="Requires student to take assessment in fullscreen. Exit triggers warning."
                  value={form.security.fullscreenMode}
                  onChange={(v) => setSecurity('fullscreenMode', v)}
                />

                {/* Disable Copy/Paste */}
                <ToggleRow
                  label="Disable Copy/Paste"
                  description="Prevents copying question text and pasting answers from external sources"
                  value={form.security.disableCopyPaste}
                  onChange={(v) => setSecurity('disableCopyPaste', v)}
                />

                {/* Tab Switch Detection */}
                <div className="py-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800">Tab Switch Detection</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Detects when student switches browser tabs. Logs events.
                      </p>
                    </div>
                    <Toggle
                      value={form.security.tabSwitchDetection}
                      onChange={(v) => setSecurity('tabSwitchDetection', v)}
                    />
                  </div>
                  {form.security.tabSwitchDetection && (
                    <div className="mt-3 max-w-xs">
                      <Input
                        label="Tab Switch Limit"
                        type="number"
                        min="0"
                        value={form.security.tabSwitchLimit ?? 3}
                        onChange={(e) =>
                          setSecurity('tabSwitchLimit', parseInt(e.target.value) || 0)
                        }
                        hint="Auto-submit after N tab switches (0 = unlimited)"
                      />
                    </div>
                  )}
                </div>

                {/* IP / Session Tracking */}
                <ToggleRow
                  label="IP / Session Tracking"
                  description="Records student IP address and session ID for audit purposes"
                  value={form.security.ipTracking}
                  onChange={(v) => setSecurity('ipTracking', v)}
                />

                {/* Browser Lock */}
                <ToggleRow
                  label="Browser Lock"
                  description="Requires Safe Exam Browser or similar locked environment (advanced)"
                  value={form.security.browserLock}
                  onChange={(v) => setSecurity('browserLock', v)}
                />
              </div>

              {/* Info box */}
              <div className="mt-5">
                <InfoBox>
                  Security features are enforced client-side in the student assessment engine.
                  Server-side enforcement requires production deployment.
                </InfoBox>
              </div>
            </Card>
          </section>

          {/* ── Section 7: Feedback ──────────────────────────────────────── */}
          <section ref={sectionRefs.feedback as React.RefObject<HTMLDivElement>} id="feedback">
            <Card>
              <SectionHeading icon={<MessageSquare className="h-4 w-4" />}>Feedback</SectionHeading>

              <div className="space-y-6">
                {/* Feedback Timing */}
                <div>
                  <p className="text-xs font-semibold text-slate-700 tracking-wide mb-2.5">
                    Feedback Timing
                  </p>
                  <div className="grid gap-2.5 grid-cols-3">
                    {(
                      [
                        { value: 'IMMEDIATELY',    label: 'Immediately After Submission', description: 'Students see results right away' },
                        { value: 'AFTER_DUE_DATE', label: 'After Due Date',               description: 'Results released after the assessment window closes' },
                        { value: 'MANUAL_RELEASE', label: 'Manual Release',               description: 'Faculty controls when results become visible' },
                      ] as { value: FeedbackTiming; label: string; description: string }[]
                    ).map((opt) => {
                      const checked = form.feedbackTiming === opt.value
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setF('feedbackTiming', opt.value)}
                          className={[
                            'rounded-xl border px-4 py-3 text-left transition-all duration-150 cursor-pointer',
                            checked
                              ? 'border-brand-600 bg-brand-50 ring-2 ring-brand-200'
                              : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50',
                          ].join(' ')}
                        >
                          <p className={`text-sm font-semibold ${checked ? 'text-brand-700' : 'text-slate-800'}`}>
                            {opt.label}
                          </p>
                          <p className={`mt-0.5 text-xs ${checked ? 'text-brand-600' : 'text-slate-500'}`}>
                            {opt.description}
                          </p>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Feedback Level */}
                <div className="border-t border-[#f0f4fa] pt-4">
                  <p className="text-xs font-semibold text-slate-700 tracking-wide mb-2.5">
                    Feedback Level
                  </p>
                  <div className="grid gap-2.5 grid-cols-3">
                    {(
                      [
                        { value: 'SCORE_ONLY',        label: 'Score Only',              description: 'Show total score and percentage only' },
                        { value: 'SCORE_AND_ANSWERS',  label: 'Score + Correct Answers', description: 'Show which questions were correct/incorrect' },
                        { value: 'FULL_FEEDBACK',      label: 'Full Feedback',           description: 'Show score, correct answers, and explanations' },
                      ] as { value: FeedbackLevel; label: string; description: string }[]
                    ).map((opt) => {
                      const checked = form.feedbackLevel === opt.value
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setF('feedbackLevel', opt.value)}
                          className={[
                            'rounded-xl border px-4 py-3 text-left transition-all duration-150 cursor-pointer',
                            checked
                              ? 'border-brand-600 bg-brand-50 ring-2 ring-brand-200'
                              : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50',
                          ].join(' ')}
                        >
                          <p className={`text-sm font-semibold ${checked ? 'text-brand-700' : 'text-slate-800'}`}>
                            {opt.label}
                          </p>
                          <p className={`mt-0.5 text-xs ${checked ? 'text-brand-600' : 'text-slate-500'}`}>
                            {opt.description}
                          </p>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Grade Weight */}
                <div className="border-t border-[#f0f4fa] pt-4 max-w-xs">
                  <Input
                    label="Grade Weight (% of final grade)"
                    type="number"
                    min="0"
                    max="100"
                    value={form.gradeWeight}
                    onChange={(e) => setF('gradeWeight', parseInt(e.target.value) || 0)}
                    hint="How much this assessment contributes to the overall grade. 0 = not counted."
                  />
                </div>
              </div>
            </Card>
          </section>

          {/* ── Section 8: Release ───────────────────────────────────────── */}
          <section ref={sectionRefs.release as React.RefObject<HTMLDivElement>} id="release">
            <Card>
              <SectionHeading icon={<Eye className="h-4 w-4" />}>Release</SectionHeading>

              <div className="space-y-6">
                {/* Visibility Status */}
                <div>
                  <p className="text-xs font-semibold text-slate-700 tracking-wide mb-2.5">
                    Visibility Status
                  </p>
                  <div className="grid gap-2.5 grid-cols-3">
                    {(
                      [
                        { value: 'DRAFT',     label: 'Draft',     description: 'Not visible to students' },
                        { value: 'PUBLISHED', label: 'Published', description: 'Visible and accessible within the availability window' },
                        { value: 'SCHEDULED', label: 'Scheduled', description: 'Auto-publish at a specific date/time' },
                      ] as { value: 'DRAFT' | 'PUBLISHED' | 'SCHEDULED'; label: string; description: string }[]
                    ).map((opt) => {
                      const checked = form.visibility === opt.value
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setF('visibility', opt.value)}
                          className={[
                            'rounded-xl border px-4 py-3 text-left transition-all duration-150 cursor-pointer',
                            checked
                              ? 'border-brand-600 bg-brand-50 ring-2 ring-brand-200'
                              : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50',
                          ].join(' ')}
                        >
                          <p className={`text-sm font-semibold ${checked ? 'text-brand-700' : 'text-slate-800'}`}>
                            {opt.label}
                          </p>
                          <p className={`mt-0.5 text-xs ${checked ? 'text-brand-600' : 'text-slate-500'}`}>
                            {opt.description}
                          </p>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Scheduled Release Date */}
                {form.visibility === 'SCHEDULED' && (
                  <div className="max-w-xs">
                    <Input
                      label="Scheduled Release Date"
                      type="datetime-local"
                      value={form.scheduledReleaseDate}
                      onChange={(e) => setF('scheduledReleaseDate', e.target.value)}
                    />
                  </div>
                )}

                {/* Allow Score Override */}
                <div className="border-t border-[#f0f4fa] pt-4">
                  <ToggleRow
                    label="Allow Score Override"
                    description="Allow faculty to manually adjust auto-computed scores (all overrides are logged)"
                    value={form.allowScoreOverride}
                    onChange={(v) => setF('allowScoreOverride', v)}
                  />
                </div>
              </div>
            </Card>
          </section>

          {/* bottom padding */}
          <div className="h-12" />
        </div>
      </div>

      {/* ── Toast ─────────────────────────────────────────────────────────── */}
      {toast && (
        <Toast
          message={toast.message}
          link={toast.link}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  )
}
