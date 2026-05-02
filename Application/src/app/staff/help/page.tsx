'use client'

import { useState, useRef, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import {
  ChevronDown, ChevronUp, BookOpen, Users, Banknote, GraduationCap,
  Mail, ExternalLink, LayoutGrid, CheckCircle2, AlertTriangle,
  AlertCircle, Search, Edit2, Plus, X, Shield, FileText,
  BarChart3, BookMarked, Film, Play, Pause, Upload, Trash2,
  RefreshCw, Video, Zap,
} from 'lucide-react'
import { SectionTitle, Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import {
  FEATURE_REGISTRY, HELP_ENTRIES, computeEntryTags,
  getFeatureDocStatus, getModuleGroups,
} from '@/lib/help-registry'
import type { HelpEntry, RegisteredFeature, DocStatus, MediaType } from '@/lib/help-registry'
import type { Role } from '@/types'
import { drawStepFrame, easeOut, easeIn } from '@/lib/tutorial-generator'

// ── Status / tag badges ────────────────────────────────────────────────────────

function TagBadge({ tag }: { tag: 'NEW' | 'UPDATED' }) {
  if (tag === 'NEW')
    return <span className="inline-flex items-center rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-700 uppercase tracking-wide">New</span>
  return <span className="inline-flex items-center rounded-full bg-blue-50 border border-blue-200 px-2 py-0.5 text-[10px] font-bold text-blue-700 uppercase tracking-wide">Updated</span>
}

function StatusBadge({ status }: { status: DocStatus }) {
  if (status === 'OK')
    return <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-[10px] font-bold text-emerald-700 uppercase tracking-wide"><CheckCircle2 className="h-3 w-3" />Documented</span>
  if (status === 'MISSING')
    return <span className="inline-flex items-center gap-1 rounded-full bg-red-50 border border-red-200 px-2.5 py-1 text-[10px] font-bold text-red-700 uppercase tracking-wide"><AlertCircle className="h-3 w-3" />Missing</span>
  return <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2.5 py-1 text-[10px] font-bold text-amber-700 uppercase tracking-wide"><AlertTriangle className="h-3 w-3" />Outdated</span>
}

// ── GIF / Video Player ─────────────────────────────────────────────────────────
// Lazy-loads when it enters the viewport. GIFs use a canvas snapshot for pause;
// Videos use the native HTMLVideoElement pause/play API.

interface GifPlayerProps {
  gifUrl?: string
  gifAlt?: string
  mediaType?: MediaType
  isSuperAdmin: boolean
  onUpload?: (url: string, alt: string, type: MediaType) => void
  onRemove?: () => void
}

function GifPlayer({ gifUrl, gifAlt, mediaType = 'gif', isSuperAdmin, onUpload, onRemove }: GifPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const imgRef       = useRef<HTMLImageElement>(null)
  const canvasRef    = useRef<HTMLCanvasElement>(null)
  const videoRef     = useRef<HTMLVideoElement>(null)
  const fileRef      = useRef<HTMLInputElement>(null)

  const [inView,  setInView]  = useState(false)
  const [loaded,  setLoaded]  = useState(false)
  const [playing, setPlaying] = useState(true)

  const isVideo = mediaType === 'video' || /\.(mp4|webm)$/i.test(gifUrl ?? '')

  // Intersection Observer — only start loading src when in viewport
  useEffect(() => {
    if (!gifUrl) return
    const el = containerRef.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setInView(true) },
      { threshold: 0.1 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [gifUrl])

  // Reset state when src changes (admin replaced the GIF)
  useEffect(() => {
    setLoaded(false)
    setPlaying(true)
    setInView(false)
  }, [gifUrl])

  function pauseGif() {
    const img    = imgRef.current
    const canvas = canvasRef.current
    if (!img || !canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    // Draw the current GIF frame onto the canvas (frozen snapshot)
    canvas.width  = img.naturalWidth  || img.clientWidth
    canvas.height = img.naturalHeight || img.clientHeight
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
    setPlaying(false)
  }

  function pauseVideo() { videoRef.current?.pause(); setPlaying(false) }
  function resumeVideo() { videoRef.current?.play();  setPlaying(true)  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const url  = URL.createObjectURL(file)
    const alt  = file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ')
    const type: MediaType = file.type.startsWith('video/') ? 'video' : 'gif'
    onUpload?.(url, alt, type)
  }

  // ── Placeholder when no GIF is attached ──
  if (!gifUrl) {
    return (
      <div className="rounded-xl border-2 border-dashed border-[#d0dff0] bg-[#f8fafd] p-6 text-center">
        <Film className="h-8 w-8 text-slate-300 mx-auto mb-2" />
        <p className="text-sm font-semibold text-slate-400">GIF Tutorial Coming Soon</p>
        <p className="text-xs text-slate-400 mt-1">A visual walkthrough for this feature is being prepared.</p>
        {isSuperAdmin && onUpload && (
          <>
            <button
              onClick={() => fileRef.current?.click()}
              className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-brand-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-brand-600 transition-colors"
            >
              <Upload className="h-3.5 w-3.5" /> Upload GIF / Video
            </button>
            <input ref={fileRef} type="file" accept=".gif,.mp4,.webm" className="hidden" onChange={handleFileChange} />
            <p className="mt-2 text-[10px] text-slate-400">Accepts .gif · .mp4 · .webm — compressed recommended</p>
          </>
        )}
      </div>
    )
  }

  // ── Player ──
  return (
    <div ref={containerRef} className="relative rounded-xl overflow-hidden border border-[#e4ebf5] bg-slate-100 max-w-lg">

      {/* Skeleton shown until inView + loaded */}
      {(!inView || !loaded) && (
        <div className="h-52 flex flex-col items-center justify-center gap-2 bg-slate-100 animate-pulse">
          {isVideo
            ? <Video className="h-8 w-8 text-slate-300" />
            : <Film className="h-8 w-8 text-slate-300" />
          }
          <p className="text-xs text-slate-400">{inView ? 'Loading tutorial…' : 'Scroll to load…'}</p>
        </div>
      )}

      {/* Frozen canvas snapshot — shown when GIF is "paused" */}
      {!isVideo && (
        <canvas
          ref={canvasRef}
          className="w-full"
          style={{ display: !playing && loaded ? 'block' : 'none' }}
        />
      )}

      {/* GIF img — hidden when paused (still animates in memory, canvas covers it) */}
      {!isVideo && inView && (
        <img
          ref={imgRef}
          src={gifUrl}
          alt={gifAlt ?? 'Tutorial GIF'}
          className="w-full"
          onLoad={() => setLoaded(true)}
          style={{ display: playing && loaded ? 'block' : 'none' }}
        />
      )}

      {/* Video element — native pause/play */}
      {isVideo && inView && (
        <video
          ref={videoRef}
          src={gifUrl}
          autoPlay
          loop
          muted
          playsInline
          className="w-full"
          onLoadedData={() => setLoaded(true)}
          style={{ display: loaded ? 'block' : 'none' }}
        />
      )}

      {/* Overlay controls — only shown once media is loaded */}
      {loaded && (
        <>
          {/* Pause button — top right */}
          {playing && (
            <button
              onClick={isVideo ? pauseVideo : pauseGif}
              className="absolute top-2 right-2 rounded-full bg-black/50 p-1.5 text-white hover:bg-black/70 transition-colors"
              title="Pause tutorial"
            >
              <Pause className="h-3.5 w-3.5" />
            </button>
          )}

          {/* Play overlay — covers entire player when paused */}
          {!playing && (
            <div
              className="absolute inset-0 flex items-center justify-center bg-black/30 cursor-pointer"
              onClick={isVideo ? resumeVideo : () => setPlaying(true)}
            >
              <div className="rounded-full bg-white/90 shadow-lg p-3">
                <Play className="h-6 w-6 text-slate-800" />
              </div>
              <span className="absolute bottom-3 left-0 right-0 text-center text-xs text-white/80 font-semibold">
                Click to resume
              </span>
            </div>
          )}

          {/* Admin overlay controls — top left */}
          {isSuperAdmin && (
            <div className="absolute top-2 left-2 flex items-center gap-1">
              <button
                onClick={() => fileRef.current?.click()}
                className="flex items-center gap-1 rounded-full bg-black/50 px-2 py-1 text-[10px] font-bold text-white hover:bg-black/70 transition-colors"
                title="Replace GIF/video"
              >
                <RefreshCw className="h-2.5 w-2.5" /> Replace
              </button>
              {onRemove && (
                <button
                  onClick={onRemove}
                  className="rounded-full bg-red-500/80 p-1.5 text-white hover:bg-red-600 transition-colors"
                  title="Remove GIF"
                >
                  <Trash2 className="h-2.5 w-2.5" />
                </button>
              )}
            </div>
          )}
        </>
      )}

      {/* Media type label — bottom right */}
      {loaded && (
        <div className="absolute bottom-2 right-2">
          <span className="flex items-center gap-1 rounded-full bg-black/50 px-2 py-0.5 text-[9px] font-bold text-white/80 uppercase tracking-wide">
            {isVideo ? <><Video className="h-2.5 w-2.5" />Video</> : <><Film className="h-2.5 w-2.5" />GIF</>}
          </span>
        </div>
      )}

      {/* Hidden file input for admin replace */}
      {isSuperAdmin && (
        <input ref={fileRef} type="file" accept=".gif,.mp4,.webm" className="hidden" onChange={handleFileChange} />
      )}
    </div>
  )
}

// ── Auto-Generated Tutorial Player ────────────────────────────────────────────
// Renders a canvas animation driven by the help entry's steps[]. No upload needed.
// Frame-rate independent: uses elapsed ms so it looks the same on 60 Hz and 120 Hz displays.

function AnimatedTutorialPlayer({
  entry,
  isSuperAdmin,
  onUpload,
}: {
  entry: HelpEntry
  isSuperAdmin: boolean
  onUpload: (url: string, alt: string, type: MediaType) => void
}) {
  const canvasRef  = useRef<HTMLCanvasElement>(null)
  const animRef    = useRef<number>(0)
  const elapsedRef = useRef(0)
  const lastRef    = useRef<number | null>(null)
  const fileRef    = useRef<HTMLInputElement>(null)
  const [playing, setPlaying] = useState(true)
  const [curStep, setCurStep] = useState(0)

  const steps = entry.steps ?? []
  const feature = FEATURE_REGISTRY.find((f) => f.id === entry.featureId)
  const moduleLabel = feature?.module ?? 'School Eco'

  const SEC_PER_STEP = 2.8   // seconds each step is displayed
  const SLIDE_SEC    = 0.38  // slide-in / slide-out duration
  const STEP_MS  = SEC_PER_STEP * 1000
  const SLIDE_MS = SLIDE_SEC  * 1000

  useEffect(() => {
    if (steps.length === 0) return

    function tick(ts: number) {
      if (lastRef.current !== null && playing) {
        elapsedRef.current += ts - lastRef.current
      }
      lastRef.current = ts

      const canvas = canvasRef.current
      if (!canvas) { animRef.current = requestAnimationFrame(tick); return }
      const ctx = canvas.getContext('2d')
      if (!ctx)   { animRef.current = requestAnimationFrame(tick); return }

      const totalMs  = steps.length * STEP_MS
      const t        = elapsedRef.current % totalMs
      const sIdx     = Math.floor(t / STEP_MS)
      const tInStep  = t % STEP_MS

      let slideX = 0
      if (tInStep < SLIDE_MS) {
        slideX = (1 - easeOut(tInStep / SLIDE_MS)) * 640
      } else if (tInStep > STEP_MS - SLIDE_MS) {
        slideX = -easeIn((tInStep - (STEP_MS - SLIDE_MS)) / SLIDE_MS) * 640
      }

      drawStepFrame(ctx, steps[sIdx], sIdx, steps.length, moduleLabel, slideX, elapsedRef.current / 1000)
      setCurStep(sIdx)

      animRef.current = requestAnimationFrame(tick)
    }

    animRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(animRef.current)
  }, [playing, steps, moduleLabel, STEP_MS, SLIDE_MS])

  // No steps — genuine fallback
  if (steps.length === 0) {
    return (
      <div className="rounded-xl border-2 border-dashed border-[#d0dff0] bg-[#f8fafd] p-6 text-center">
        <Film className="h-8 w-8 text-slate-300 mx-auto mb-2" />
        <p className="text-sm font-semibold text-slate-400">Tutorial Not Yet Available</p>
        <p className="text-xs text-slate-400 mt-1">Add step-by-step instructions to this article to auto-generate a tutorial.</p>
      </div>
    )
  }

  return (
    <div className="relative rounded-xl overflow-hidden border border-[#e4ebf5] bg-[#e8eef7] max-w-lg">
      <canvas ref={canvasRef} width={640} height={360} className="w-full block" />

      {/* Play / Pause */}
      <button
        onClick={() => { setPlaying((p) => !p); lastRef.current = null }}
        className="absolute top-2 right-2 rounded-full bg-black/50 p-1.5 text-white hover:bg-black/70 transition-colors"
        title={playing ? 'Pause tutorial' : 'Play tutorial'}
      >
        {playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
      </button>

      {/* Paused overlay */}
      {!playing && (
        <div
          className="absolute inset-0 flex items-center justify-center bg-black/25 cursor-pointer"
          onClick={() => { setPlaying(true); lastRef.current = null }}
        >
          <div className="rounded-full bg-white/90 shadow-lg p-3">
            <Play className="h-6 w-6 text-slate-800" />
          </div>
          <span className="absolute bottom-8 left-0 right-0 text-center text-xs text-white/80 font-semibold">
            Click to resume
          </span>
        </div>
      )}

      {/* Auto-generated label */}
      <div className="absolute bottom-2 left-2 flex items-center gap-2">
        <span className="flex items-center gap-1 rounded-full bg-black/50 px-2 py-0.5 text-[9px] font-bold text-white/80 uppercase tracking-wide">
          <Zap className="h-2.5 w-2.5" /> Auto-generated
        </span>
      </div>

      {/* Admin: replace with an actual GIF/video */}
      {isSuperAdmin && (
        <>
          <button
            onClick={() => fileRef.current?.click()}
            className="absolute top-2 left-2 flex items-center gap-1 rounded-full bg-black/50 px-2 py-1 text-[10px] font-bold text-white hover:bg-black/70 transition-colors"
            title="Replace with an uploaded GIF or video"
          >
            <Upload className="h-2.5 w-2.5" /> Replace with GIF
          </button>
          <input
            ref={fileRef} type="file" accept=".gif,.mp4,.webm" className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (!file) return
              const url  = URL.createObjectURL(file)
              const alt  = file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ')
              const type: MediaType = file.type.startsWith('video/') ? 'video' : 'gif'
              onUpload(url, alt, type)
            }}
          />
        </>
      )}
    </div>
  )
}

// ── Entry card (expandable) ────────────────────────────────────────────────────

function EntryCard({ entry, isSuperAdmin }: { entry: HelpEntry; isSuperAdmin: boolean }) {
  const [open,      setOpen]      = useState(false)
  const [gifUrl,    setGifUrl]    = useState(entry.gifUrl)
  const [gifAlt,    setGifAlt]    = useState(entry.gifAlt)
  const [mediaType, setMediaType] = useState<MediaType | undefined>(entry.mediaType)
  const tags = computeEntryTags(entry)

  function handleGifUpload(url: string, alt: string, type: MediaType) {
    const idx = HELP_ENTRIES.findIndex((e) => e.id === entry.id)
    if (idx !== -1) HELP_ENTRIES[idx] = { ...HELP_ENTRIES[idx], gifUrl: url, gifAlt: alt, mediaType: type }
    setGifUrl(url); setGifAlt(alt); setMediaType(type)
  }

  function handleGifRemove() {
    const idx = HELP_ENTRIES.findIndex((e) => e.id === entry.id)
    if (idx !== -1) {
      const updated = { ...HELP_ENTRIES[idx] }
      delete updated.gifUrl; delete updated.gifAlt; delete updated.mediaType
      HELP_ENTRIES[idx] = updated
    }
    setGifUrl(undefined); setGifAlt(undefined); setMediaType(undefined)
  }

  return (
    <div className="border-b border-[#f0f4fa] last:border-0">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-start justify-between gap-4 px-4 py-3.5 text-left hover:bg-slate-50 transition-colors"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-0.5">
            <p className="text-sm font-semibold text-slate-800 leading-snug">{entry.title}</p>
            {tags.map((t) => <TagBadge key={t} tag={t} />)}
            {/* Tutorial indicator badge */}
            {gifUrl
              ? <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 border border-violet-200 px-2 py-0.5 text-[10px] font-bold text-violet-700">
                  <Film className="h-2.5 w-2.5" />{mediaType === 'video' ? 'Video' : 'GIF'}
                </span>
              : entry.steps && entry.steps.length > 0
                ? <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 border border-violet-200 px-2 py-0.5 text-[10px] font-bold text-violet-600">
                    <Zap className="h-2.5 w-2.5" />Auto
                  </span>
                : null
            }
          </div>
          <p className="text-xs text-slate-500">{entry.summary}</p>
        </div>
        {open ? <ChevronUp className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" /> : <ChevronDown className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />}
      </button>

      {open && (
        <div className="px-4 pb-5 pt-0 space-y-4">
          {/* Description */}
          <p className="text-sm text-slate-600 leading-relaxed">{entry.content}</p>

          {/* Steps */}
          {entry.steps && entry.steps.length > 0 && (
            <div>
              <p className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">Step-by-Step</p>
              <ol className="space-y-2">
                {entry.steps.map((step, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-500 text-[10px] font-bold text-white mt-0.5">
                      {i + 1}
                    </span>
                    <span className="text-sm text-slate-600">{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* Tips */}
          {entry.tips && entry.tips.length > 0 && (
            <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 space-y-1.5">
              <p className="text-xs font-bold text-amber-800 uppercase tracking-wide">Pro Tips</p>
              {entry.tips.map((tip, i) => (
                <p key={i} className="text-xs text-amber-800 flex items-start gap-1.5">
                  <span className="mt-0.5">💡</span> {tip}
                </p>
              ))}
            </div>
          )}

          {/* ── Visual Tutorial ── */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Film className="h-3.5 w-3.5 text-slate-400" />
                <p className="text-xs font-bold text-slate-700 uppercase tracking-wide">Visual Tutorial</p>
                {!gifUrl && entry.steps && entry.steps.length > 0 && (
                  <span className="flex items-center gap-1 rounded-full bg-violet-50 border border-violet-200 px-2 py-0.5 text-[10px] font-bold text-violet-700">
                    <Zap className="h-2.5 w-2.5" /> Auto-generated
                  </span>
                )}
              </div>
              {gifUrl && isSuperAdmin && (
                <span className="text-[10px] text-slate-400">Admin: use Replace / Remove on the player</span>
              )}
            </div>
            {gifUrl ? (
              // Uploaded GIF or video — shown with full player controls
              <GifPlayer
                gifUrl={gifUrl}
                gifAlt={gifAlt ?? entry.title}
                mediaType={mediaType}
                isSuperAdmin={isSuperAdmin}
                onUpload={handleGifUpload}
                onRemove={handleGifRemove}
              />
            ) : (
              // Auto-generated canvas animation from steps (no file needed)
              <AnimatedTutorialPlayer
                entry={entry}
                isSuperAdmin={isSuperAdmin}
                onUpload={handleGifUpload}
              />
            )}
          </div>

          {/* Footer metadata */}
          <div className="flex items-center gap-3 pt-1 border-t border-[#f0f4fa]">
            <span className="text-[10px] text-slate-400">v{entry.version}</span>
            <span className="text-[10px] text-slate-300">·</span>
            <span className="text-[10px] text-slate-400">
              Updated: {new Date(entry.lastUpdated).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })}
            </span>
            {entry.status === 'DRAFT' && (
              <span className="text-[10px] font-bold text-slate-400 uppercase border border-slate-200 rounded-full px-2 py-0.5 ml-auto">Draft</span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Manual Tab ─────────────────────────────────────────────────────────────────

function ManualTab({ role }: { role: string }) {
  const [search, setSearch] = useState('')
  const isSuper = role === 'SUPER_ADMIN'

  const visibleEntries = HELP_ENTRIES.filter((e) => {
    if (e.status !== 'PUBLISHED') return false
    if (!isSuper && !e.roles.includes(role as Role)) return false
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return (
      e.title.toLowerCase().includes(q) ||
      e.summary.toLowerCase().includes(q) ||
      e.content.toLowerCase().includes(q)
    )
  })

  const moduleGroups = getModuleGroups()
    .map(({ module, features }) => ({
      module,
      entries: visibleEntries.filter((e) => features.some((f) => f.id === e.featureId)),
    }))
    .filter((g) => g.entries.length > 0)

  const MODULE_ICONS: Record<string, React.ElementType> = {
    Dashboard: BarChart3,
    Admissions: Users,
    CRM: LayoutGrid,
    'Student Records': BookMarked,
    'Document Generator': FileText,
    Treasury: Banknote,
    Academic: BookOpen,
    'Dean Portal': GraduationCap,
    People: Users,
    Account: Shield,
  }

  // Tutorial coverage — counts both uploaded GIFs and auto-generated (entries with steps)
  const gifStats = isSuper ? {
    total:     HELP_ENTRIES.filter((e) => e.status === 'PUBLISHED').length,
    withGif:   HELP_ENTRIES.filter((e) => e.status === 'PUBLISHED' && e.gifUrl).length,
    withAuto:  HELP_ENTRIES.filter((e) => e.status === 'PUBLISHED' && !e.gifUrl && e.steps && e.steps.length > 0).length,
    noTutorial: HELP_ENTRIES.filter((e) => e.status === 'PUBLISHED' && !e.gifUrl && (!e.steps || e.steps.length === 0)).length,
  } : null

  return (
    <div className="space-y-4">
      {/* GIF coverage strip — super admin only */}
      {gifStats && (
        <div className="rounded-xl border border-[#e4ebf5] bg-white px-4 py-3 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-violet-500 shrink-0" />
              <p className="text-xs font-semibold text-slate-600">Tutorial Coverage</p>
            </div>
            <p className="text-xs font-bold text-slate-700">
              {gifStats.withGif + gifStats.withAuto} / {gifStats.total} covered
            </p>
          </div>
          {/* Stacked bar: GIF (violet) + Auto (lighter violet) */}
          <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden flex">
            <div className="h-full bg-violet-500 transition-all duration-500"
              style={{ width: `${(gifStats.withGif / gifStats.total) * 100}%` }} />
            <div className="h-full bg-violet-200 transition-all duration-500"
              style={{ width: `${(gifStats.withAuto / gifStats.total) * 100}%` }} />
          </div>
          <div className="flex items-center gap-4 text-[10px] text-slate-500">
            <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-full bg-violet-500" />{gifStats.withGif} uploaded GIF/video</span>
            <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-full bg-violet-200 border border-violet-300" />{gifStats.withAuto} auto-generated</span>
            {gifStats.noTutorial > 0 && <span className="flex items-center gap-1 text-slate-400"><span className="inline-block h-2 w-2 rounded-full bg-slate-200" />{gifStats.noTutorial} no tutorial</span>}
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search documentation (e.g. enroll, SOA, generate document)…"
          className="w-full rounded-xl border border-[#dce8f7] bg-white py-2.5 pl-9 pr-4 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/15 focus:border-brand-400"
        />
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {search && (
        <p className="text-xs text-slate-500">
          {visibleEntries.length} result{visibleEntries.length !== 1 ? 's' : ''} for &ldquo;{search}&rdquo;
        </p>
      )}

      {moduleGroups.length === 0 && (
        <Card>
          <div className="flex flex-col items-center py-10 gap-2">
            <Search className="h-8 w-8 text-slate-200" />
            <p className="text-sm text-slate-400">No documentation matches your search.</p>
          </div>
        </Card>
      )}

      {moduleGroups.map(({ module, entries }) => {
        const Icon = MODULE_ICONS[module] ?? BookOpen
        const moduleGifCount = entries.filter((e) => e.gifUrl).length
        return (
          <Card key={module} padding="none">
            <div className="flex items-center gap-3 px-4 py-3 border-b border-[#e4ebf5] bg-[#f8fafd]">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-50">
                <Icon className="h-3.5 w-3.5 text-brand-600" />
              </div>
              <h3 className="text-sm font-bold text-slate-700">{module}</h3>
              <div className="ml-auto flex items-center gap-3">
                {isSuper && (
                  <span className={`flex items-center gap-1 text-[10px] font-semibold ${moduleGifCount === entries.length ? 'text-violet-600' : 'text-slate-400'}`}>
                    <Film className="h-2.5 w-2.5" />{moduleGifCount}/{entries.length}
                  </span>
                )}
                <span className="text-xs text-slate-400">{entries.length} guide{entries.length !== 1 ? 's' : ''}</span>
              </div>
            </div>
            <div>
              {entries.map((entry) => <EntryCard key={entry.id} entry={entry} isSuperAdmin={isSuper} />)}
            </div>
          </Card>
        )
      })}

      {/* Missing-docs warning */}
      {(() => {
        const undocumented = FEATURE_REGISTRY.filter((f) => {
          if (!isSuper && !f.roles.includes(role as Role)) return false
          return getFeatureDocStatus(f.id) === 'MISSING'
        })
        if (undocumented.length === 0) return null
        return (
          <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
            <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-800">
                {undocumented.length} feature{undocumented.length !== 1 ? 's' : ''} are missing documentation.
              </p>
              <p className="text-xs text-amber-700 mt-0.5">
                {undocumented.map((f) => f.feature).join(', ')}.{' '}
                Super Admin can create these in the Admin Panel.
              </p>
            </div>
          </div>
        )
      })()}
    </div>
  )
}

// ── FAQ Tab ────────────────────────────────────────────────────────────────────

const FAQ = [
  { q: 'How do I add a new applicant?', a: 'Go to Admissions → Applicants, then click "Add Applicant" in the top right. Fill in the 5-step form (Personal, Family, Education, Academic, Documents) and click Save.' },
  { q: 'How do I accept or reject an application?', a: 'Open an applicant from the Admissions list. Click Accept or Reject in the drawer. You will be asked to confirm. Rejected applications require a reason.' },
  { q: 'How does the CRM pipeline work?', a: 'Go to Admissions → CRM. Each column is a stage (New Lead → Contacted → Interested → Applicant → For Interview → Accepted → Enrolled → Lost). Drag a card to move the lead. Click a card for the detail panel.' },
  { q: 'How do I generate an official school document?', a: 'Go to Records → Doc Generator. Click Generate, pick a template, search for the student, then click "Generate Document". Click "Print / Save PDF" to get the final document.' },
  { q: 'How do I enroll a student in subjects?', a: 'Go to Student Records, find the student, open their full record, then go to the Enrollment tab to assign subjects.' },
  { q: 'How do I generate a Statement of Account?', a: 'Go to Finance → Cashier. Find the student, click Generate SOA. Once created, you can add payments and mark it as paid.' },
  { q: 'How do I assign a teacher to a subject offering?', a: 'Deans assign teachers. Log in as a Dean and go to Teacher Assignment. Published offerings without a teacher appear in the "Needs Teacher" tab.' },
  { q: 'How does the Calendar work?', a: 'Academic Admins can add events. All other roles can view. Use the filter badges at the top to show/hide event types.' },
  { q: 'How do I change my theme to dark mode?', a: 'Click your avatar in the top right → Personalization → select Dark. The change applies instantly.' },
  { q: 'How do I change my password?', a: 'Click your avatar → Settings → Change Password. Enter your current password and the new one (min 6 characters). The demo password is "password".' },
  { q: 'Why does data reset when I refresh?', a: 'This is a demo using in-memory mock data. Application submissions persist via sessionStorage but other changes reset on hard refresh. Connect to the PostgreSQL backend for full persistence.' },
]

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b border-[#f0f4fa] last:border-0">
      <button onClick={() => setOpen(!open)} className="flex w-full items-center justify-between gap-4 px-4 py-3.5 text-left hover:bg-slate-50 transition-colors">
        <p className="text-sm font-semibold text-slate-800 leading-snug">{q}</p>
        {open ? <ChevronUp className="h-4 w-4 text-slate-400 shrink-0" /> : <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" />}
      </button>
      {open && <div className="px-4 pb-4 pt-0"><p className="text-sm text-slate-600 leading-relaxed">{a}</p></div>}
    </div>
  )
}

const GUIDES = [
  { icon: Users,         label: 'Admissions',      desc: 'Manage applicants, accept/reject',    href: '/staff/admissions' },
  { icon: LayoutGrid,    label: 'CRM',             desc: 'Pipeline board for lead tracking',    href: '/staff/admissions/crm' },
  { icon: BookMarked,    label: 'Student Records', desc: 'Student records, enrollment, grades', href: '/staff/registrar' },
  { icon: FileText,      label: 'Doc Generator',   desc: 'Official document generation',        href: '/staff/registrar/documents' },
  { icon: Banknote,      label: 'Treasury',        desc: 'SOA generation, payments, receipts',  href: '/staff/treasury' },
  { icon: GraduationCap, label: 'Dean Portal',     desc: 'Dept dashboard, teacher assignments', href: '/staff/dean' },
]

function FAQTab() {
  return (
    <div className="space-y-5">
      <Card>
        <h3 className="text-sm font-bold text-slate-700 mb-4">Module Quick Guide</h3>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {GUIDES.map((g) => {
            const Icon = g.icon
            return (
              <a key={g.href} href={g.href}
                className="flex items-center gap-3 rounded-xl border border-[#e4ebf5] bg-[#f8fafd] px-4 py-3 hover:border-brand-200 hover:bg-brand-50 transition-all group"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-50 group-hover:bg-brand-100 transition-colors">
                  <Icon className="h-4 w-4 text-brand-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-800">{g.label}</p>
                  <p className="text-xs text-slate-500 truncate">{g.desc}</p>
                </div>
                <ExternalLink className="h-3.5 w-3.5 text-slate-300 group-hover:text-brand-400 ml-auto shrink-0" />
              </a>
            )
          })}
        </div>
      </Card>

      <Card>
        <h3 className="text-sm font-bold text-slate-700 mb-3">The Academic Pipeline</h3>
        <p className="text-xs text-slate-500 mb-4">School Eco follows a train-station model where each module feeds into the next:</p>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {['① Admissions', '→ ② Registrar', '→ ③ Treasury', '→ ④ Academic', '→ ⑤ Dean', '→ ⑥ Teacher', '→ ⑦ Student'].map((s) => (
            <span key={s} className={`font-semibold px-2.5 py-1 rounded-full ${s.startsWith('→') ? 'text-slate-400' : 'bg-brand-50 text-brand-700'}`}>{s}</span>
          ))}
        </div>
      </Card>

      <Card padding="none">
        <div className="px-4 py-4 border-b border-[#e4ebf5]">
          <h3 className="text-sm font-bold text-slate-700">Frequently Asked Questions</h3>
        </div>
        {FAQ.map((item, i) => <FAQItem key={i} {...item} />)}
      </Card>

      <Card>
        <h3 className="text-sm font-bold text-slate-700 mb-3">Contact Support</h3>
        <p className="text-sm text-slate-500 mb-4">Need help beyond this guide? Reach out to the system administrator.</p>
        <a href="mailto:admin@school.edu" className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-bold text-white hover:bg-brand-600 transition-colors">
          <Mail className="h-4 w-4" /> Email Support
        </a>
        <p className="mt-3 text-xs text-slate-400">Response time: 1–2 business days</p>
      </Card>
    </div>
  )
}

// ── Admin Panel ────────────────────────────────────────────────────────────────

function EditEntryModal({
  feature,
  existingEntry,
  onClose,
  onSave,
}: {
  feature: RegisteredFeature
  existingEntry: HelpEntry | undefined
  onClose: () => void
  onSave: () => void
}) {
  const isNew = !existingEntry
  const [title,     setTitle]     = useState(existingEntry?.title   ?? `How to use ${feature.feature}`)
  const [summary,   setSummary]   = useState(existingEntry?.summary ?? '')
  const [content,   setContent]   = useState(existingEntry?.content ?? '')
  const [steps,     setSteps]     = useState<string[]>(existingEntry?.steps ?? [''])
  const [tips,      setTips]      = useState<string[]>(existingEntry?.tips  ?? [])
  const [status,    setStatus]    = useState<'PUBLISHED' | 'DRAFT'>(existingEntry?.status ?? 'PUBLISHED')
  const [gifUrl,    setGifUrl]    = useState(existingEntry?.gifUrl)
  const [gifAlt,    setGifAlt]    = useState(existingEntry?.gifAlt ?? '')
  const [mediaType, setMediaType] = useState<MediaType>(existingEntry?.mediaType ?? 'gif')
  const [saving,    setSaving]    = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  function addStep()              { setSteps((s) => [...s, '']) }
  function removeStep(i: number)  { setSteps((s) => s.filter((_, idx) => idx !== i)) }
  function updateStep(i: number, val: string) { setSteps((s) => s.map((x, idx) => idx === i ? val : x)) }

  function addTip()               { setTips((t) => [...t, '']) }
  function removeTip(i: number)   { setTips((t) => t.filter((_, idx) => idx !== i)) }
  function updateTip(i: number, val: string) { setTips((t) => t.map((x, idx) => idx === i ? val : x)) }

  function handleGifFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const url = URL.createObjectURL(file)
    const type: MediaType = file.type.startsWith('video/') ? 'video' : 'gif'
    setGifUrl(url)
    setGifAlt(file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' '))
    setMediaType(type)
  }

  async function handleSave() {
    if (!title.trim() || !summary.trim() || !content.trim()) return
    setSaving(true)
    await new Promise((r) => setTimeout(r, 400))

    const now = new Date().toISOString().slice(0, 10)
    const cleanSteps = steps.filter((s) => s.trim())
    const cleanTips  = tips.filter((t) => t.trim())

    const mediaFields = gifUrl
      ? { gifUrl, gifAlt: gifAlt || undefined, mediaType }
      : {}

    if (isNew) {
      HELP_ENTRIES.push({
        id: `he_custom_${Date.now()}`,
        featureId: feature.id,
        title: title.trim(), summary: summary.trim(), content: content.trim(),
        steps: cleanSteps.length > 0 ? cleanSteps : undefined,
        tips:  cleanTips.length  > 0 ? cleanTips  : undefined,
        roles: feature.roles as Role[],
        lastUpdated: now, version: '1.0', status,
        ...mediaFields,
      })
    } else {
      const idx = HELP_ENTRIES.findIndex((e) => e.id === existingEntry.id)
      if (idx !== -1) {
        HELP_ENTRIES[idx] = {
          ...existingEntry,
          title: title.trim(), summary: summary.trim(), content: content.trim(),
          steps: cleanSteps.length > 0 ? cleanSteps : undefined,
          tips:  cleanTips.length  > 0 ? cleanTips  : undefined,
          lastUpdated: now,
          version: bumpVersion(existingEntry.version),
          status,
          ...mediaFields,
          ...(gifUrl ? {} : { gifUrl: undefined, gifAlt: undefined, mediaType: undefined }),
        }
      }
    }

    setSaving(false); onSave(); onClose()
  }

  function bumpVersion(v: string) {
    const parts = v.split('.').map(Number)
    parts[parts.length - 1] += 1
    return parts.join('.')
  }

  const canSave = title.trim() && summary.trim() && content.trim()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-brand-900/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-2xl rounded-2xl bg-white shadow-2xl overflow-hidden mx-4">
        <div className="border-l-[3px] border-brand-500 flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div>
            <p className="text-sm font-bold text-slate-900">{isNew ? 'Create' : 'Edit'} Documentation</p>
            <p className="text-xs text-slate-500 mt-0.5">{feature.module} — {feature.feature}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="h-4 w-4" /></button>
        </div>

        <div className="p-5 space-y-4 max-h-[72vh] overflow-y-auto">
          <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. How to Generate an SOA" />
          <Input label="Summary (one line)" value={summary} onChange={(e) => setSummary(e.target.value)} placeholder="Brief description shown in the entry list" />

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Full Content</label>
            <textarea
              value={content} onChange={(e) => setContent(e.target.value)} rows={4}
              placeholder="Describe what this feature does and when to use it."
              className="w-full rounded-xl border border-[#dce8f7] bg-white px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/15 focus:border-brand-400 resize-y"
            />
          </div>

          {/* Steps */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-600">Step-by-Step Instructions</label>
              <button onClick={addStep} className="text-xs text-brand-600 font-semibold flex items-center gap-1 hover:text-brand-700"><Plus className="h-3 w-3" />Add Step</button>
            </div>
            <div className="space-y-2">
              {steps.map((step, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-500 text-[10px] font-bold text-white">{i + 1}</span>
                  <input value={step} onChange={(e) => updateStep(i, e.target.value)} placeholder={`Step ${i + 1}…`}
                    className="flex-1 rounded-lg border border-[#dce8f7] bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/15 focus:border-brand-400"
                  />
                  {steps.length > 1 && <button onClick={() => removeStep(i)} className="text-slate-300 hover:text-red-400"><X className="h-3.5 w-3.5" /></button>}
                </div>
              ))}
            </div>
          </div>

          {/* Tips */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-600">Pro Tips (optional)</label>
              <button onClick={addTip} className="text-xs text-brand-600 font-semibold flex items-center gap-1 hover:text-brand-700"><Plus className="h-3 w-3" />Add Tip</button>
            </div>
            <div className="space-y-2">
              {tips.map((tip, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-sm">💡</span>
                  <input value={tip} onChange={(e) => updateTip(i, e.target.value)} placeholder="Helpful tip…"
                    className="flex-1 rounded-lg border border-[#dce8f7] bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/15 focus:border-brand-400"
                  />
                  <button onClick={() => removeTip(i)} className="text-slate-300 hover:text-red-400"><X className="h-3.5 w-3.5" /></button>
                </div>
              ))}
              {tips.length === 0 && <p className="text-xs text-slate-400 italic">No tips — click Add Tip above.</p>}
            </div>
          </div>

          {/* ── GIF / Video Tutorial ── */}
          <div className="rounded-xl border border-[#e4ebf5] p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Film className="h-4 w-4 text-violet-500" />
              <p className="text-xs font-bold text-slate-700 uppercase tracking-wide">Visual Tutorial (GIF / Video)</p>
            </div>

            {gifUrl ? (
              <div className="space-y-3">
                {/* Preview */}
                <div className="relative rounded-xl overflow-hidden border border-[#e4ebf5] max-w-xs">
                  {mediaType === 'video'
                    ? <video src={gifUrl} autoPlay loop muted playsInline className="w-full max-h-40 object-cover" />
                    : <img src={gifUrl} alt={gifAlt || 'Tutorial'} className="w-full max-h-40 object-cover" />
                  }
                  <div className="absolute top-1.5 right-1.5">
                    <span className="rounded-full bg-black/50 px-2 py-0.5 text-[9px] font-bold text-white uppercase">{mediaType}</span>
                  </div>
                </div>
                {/* Alt text */}
                <Input
                  label="Alt text / description"
                  value={gifAlt}
                  onChange={(e) => setGifAlt(e.target.value)}
                  placeholder="What does this GIF show? e.g. Drag-and-drop lead to Accepted stage"
                />
                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button onClick={() => fileRef.current?.click()}
                    className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    <RefreshCw className="h-3 w-3" /> Replace
                  </button>
                  <button onClick={() => { setGifUrl(undefined); setGifAlt('') }}
                    className="flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="h-3 w-3" /> Remove
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-start gap-2">
                <p className="text-xs text-slate-500">No tutorial media attached. Upload a GIF or video to show users a visual walkthrough.</p>
                <button
                  onClick={() => fileRef.current?.click()}
                  className="flex items-center gap-1.5 rounded-lg bg-violet-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-violet-600 transition-colors"
                >
                  <Upload className="h-3.5 w-3.5" /> Upload GIF / Video
                </button>
                <p className="text-[10px] text-slate-400">Accepts .gif · .mp4 · .webm · Keep under 5 MB for best performance</p>
              </div>
            )}
            <input ref={fileRef} type="file" accept=".gif,.mp4,.webm" className="hidden" onChange={handleGifFile} />
          </div>

          {/* Status */}
          <div className="flex items-center gap-4">
            <label className="text-xs font-semibold text-slate-600">Publication Status</label>
            <div className="flex items-center gap-2">
              {(['PUBLISHED', 'DRAFT'] as const).map((s) => (
                <button key={s} onClick={() => setStatus(s)}
                  className={`rounded-full px-3 py-1 text-xs font-bold border transition-all ${
                    status === s
                      ? s === 'PUBLISHED' ? 'bg-emerald-50 text-emerald-700 border-emerald-300' : 'bg-slate-100 text-slate-600 border-slate-300'
                      : 'bg-white text-slate-400 border-slate-200 hover:border-slate-300'
                  }`}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-slate-100">
          <button onClick={onClose} className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50">Cancel</button>
          <button onClick={handleSave} disabled={!canSave || saving}
            className="flex items-center gap-1.5 rounded-lg bg-brand-500 px-4 py-2 text-xs font-bold text-white hover:bg-brand-600 disabled:opacity-40"
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            {saving ? 'Saving…' : isNew ? 'Create Entry' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}

function AdminPanel() {
  const [refresh,      setRefresh]      = useState(0)
  const [editFeature,  setEditFeature]  = useState<RegisteredFeature | null>(null)
  const [filterStatus, setFilterStatus] = useState<'ALL' | DocStatus>('ALL')

  const groups = getModuleGroups()
  const stats = {
    total:    FEATURE_REGISTRY.length,
    ok:       FEATURE_REGISTRY.filter((f) => getFeatureDocStatus(f.id) === 'OK').length,
    missing:  FEATURE_REGISTRY.filter((f) => getFeatureDocStatus(f.id) === 'MISSING').length,
    outdated: FEATURE_REGISTRY.filter((f) => getFeatureDocStatus(f.id) === 'OUTDATED').length,
  }
  const gifStats = {
    total:      HELP_ENTRIES.filter((e) => e.status === 'PUBLISHED').length,
    withGif:    HELP_ENTRIES.filter((e) => e.status === 'PUBLISHED' && e.gifUrl).length,
    withAuto:   HELP_ENTRIES.filter((e) => e.status === 'PUBLISHED' && !e.gifUrl && e.steps && e.steps.length > 0).length,
    noTutorial: HELP_ENTRIES.filter((e) => e.status === 'PUBLISHED' && !e.gifUrl && (!e.steps || e.steps.length === 0)).length,
  }
  const covPct      = Math.round((stats.ok / stats.total) * 100)
  const tutCovPct   = gifStats.total > 0 ? Math.round(((gifStats.withGif + gifStats.withAuto) / gifStats.total) * 100) : 0
  const gifCovPct   = gifStats.total > 0 ? Math.round((gifStats.withGif / gifStats.total) * 100) : 0

  const allFeatures = FEATURE_REGISTRY.filter((f) =>
    filterStatus === 'ALL' ? true : getFeatureDocStatus(f.id) === filterStatus
  )

  const editingEntry = editFeature ? HELP_ENTRIES.find((e) => e.featureId === editFeature.id) : undefined

  return (
    <div className="space-y-5">
      {/* Coverage stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Total Features', value: stats.total,          color: 'text-slate-700',   bg: 'bg-white' },
          { label: 'Documented',     value: `${stats.ok} (${covPct}%)`, color: 'text-emerald-700', bg: 'bg-emerald-50' },
          { label: 'Missing Docs',   value: stats.missing,        color: 'text-red-700',     bg: 'bg-red-50' },
          { label: 'Outdated Docs',  value: stats.outdated,       color: 'text-amber-700',   bg: 'bg-amber-50' },
        ].map((s) => (
          <div key={s.label} className={`rounded-xl border border-[#e4ebf5] ${s.bg} px-4 py-3`}>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Coverage bars */}
      <Card>
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-bold text-slate-700">Documentation Coverage</p>
              <p className="text-sm font-bold text-slate-700">{covPct}%</p>
            </div>
            <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-500 ${covPct >= 90 ? 'bg-emerald-500' : covPct >= 70 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${covPct}%` }} />
            </div>
            <p className="text-xs text-slate-400 mt-1">{stats.ok} of {stats.total} features have published docs.</p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Zap className="h-3.5 w-3.5 text-violet-500" />
                <p className="text-sm font-bold text-slate-700">Tutorial Coverage</p>
              </div>
              <p className="text-sm font-bold text-slate-700">{tutCovPct}%</p>
            </div>
            <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden flex">
              <div className="h-full bg-violet-500 transition-all duration-500" style={{ width: `${gifCovPct}%` }} />
              <div className="h-full bg-violet-200 transition-all duration-500" style={{ width: `${tutCovPct - gifCovPct}%` }} />
            </div>
            <div className="flex items-center gap-4 mt-1.5 text-[10px] text-slate-500">
              <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-full bg-violet-500" />{gifStats.withGif} uploaded GIF/video</span>
              <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-full bg-violet-200 border border-violet-300" />{gifStats.withAuto} auto-generated</span>
              {gifStats.noTutorial > 0 && <span className="flex items-center gap-1 text-amber-600"><span className="inline-block h-2 w-2 rounded-full bg-amber-200" />{gifStats.noTutorial} need steps</span>}
            </div>
          </div>
        </div>
      </Card>

      {/* Status filter */}
      <div className="flex items-center gap-2 flex-wrap">
        {(['ALL', 'OK', 'MISSING', 'OUTDATED'] as const).map((s) => (
          <button key={s} onClick={() => setFilterStatus(s)}
            className={`rounded-full px-3 py-1.5 text-xs font-bold border transition-all ${
              filterStatus === s
                ? s === 'ALL'     ? 'bg-brand-500 text-white border-brand-500'
                  : s === 'OK'    ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                  : s === 'MISSING' ? 'bg-red-50 text-red-700 border-red-300'
                  : 'bg-amber-50 text-amber-700 border-amber-300'
                : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
            }`}
          >
            {s === 'ALL' ? `All (${stats.total})` : s === 'OK' ? `Documented (${stats.ok})` : s === 'MISSING' ? `Missing (${stats.missing})` : `Outdated (${stats.outdated})`}
          </button>
        ))}
      </div>

      {/* Feature registry table */}
      {groups.map(({ module, features }) => {
        const filtered = features.filter((f) => allFeatures.includes(f))
        if (filtered.length === 0) return null
        return (
          <Card key={module} padding="none">
            <div className="px-4 py-3 border-b border-[#e4ebf5] bg-[#f8fafd]">
              <p className="text-sm font-bold text-slate-700">{module}</p>
            </div>
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#f0f4fa]">
                  <th className="py-2 pl-4 pr-3 text-left text-[10px] font-bold uppercase tracking-wider text-brand-700">Feature</th>
                  <th className="py-2 px-3 text-left text-[10px] font-bold uppercase tracking-wider text-brand-700">Doc Status</th>
                  <th className="py-2 px-3 text-center text-[10px] font-bold uppercase tracking-wider text-brand-700">GIF</th>
                  <th className="py-2 px-3 text-left text-[10px] font-bold uppercase tracking-wider text-brand-700">Ver</th>
                  <th className="py-2 pl-3 pr-4 text-right text-[10px] font-bold uppercase tracking-wider text-brand-700">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0f4fa]">
                {filtered.map((f) => {
                  const docStatus = getFeatureDocStatus(f.id)
                  const entry     = HELP_ENTRIES.find((e) => e.featureId === f.id)
                  const hasGif    = Boolean(entry?.gifUrl)
                  const hasAuto   = Boolean(entry?.steps?.length)
                  return (
                    <tr key={f.id} className="hover:bg-[#f8fafd]">
                      <td className="py-3 pl-4 pr-3">
                        <p className="text-sm font-semibold text-slate-800">{f.feature}</p>
                        <p className="text-xs text-slate-400 font-mono mt-0.5">{f.route}</p>
                      </td>
                      <td className="py-3 px-3">
                        <StatusBadge status={docStatus} />
                        {docStatus === 'OUTDATED' && (
                          <p className="text-[10px] text-amber-600 mt-1">Feature: {f.lastModified} · Docs: {entry?.lastUpdated}</p>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center">
                        {hasGif
                          ? <span title={`Uploaded ${entry?.mediaType ?? 'gif'}`}>
                              {entry?.mediaType === 'video'
                                ? <Video className="h-4 w-4 text-violet-500 inline" />
                                : <Film className="h-4 w-4 text-violet-500 inline" />
                              }
                            </span>
                          : hasAuto
                            ? <span title="Auto-generated from steps"><Zap className="h-4 w-4 text-violet-400 inline" /></span>
                            : <span className="text-[10px] text-slate-300 font-semibold">—</span>
                        }
                      </td>
                      <td className="py-3 px-3 text-xs text-slate-500">{entry ? `v${entry.version}` : '—'}</td>
                      <td className="py-3 pl-3 pr-4 text-right">
                        <button
                          onClick={() => { setEditFeature(f); setRefresh((r) => r + 1) }}
                          className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ml-auto border
                            ${docStatus === 'MISSING'  ? 'bg-red-50 text-red-700 hover:bg-red-100 border-red-200'
                            : docStatus === 'OUTDATED' ? 'bg-amber-50 text-amber-700 hover:bg-amber-100 border-amber-200'
                            : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border-slate-200'}`}
                        >
                          {docStatus === 'MISSING' ? <><Plus className="h-3 w-3" />Create</>
                          : <><Edit2 className="h-3 w-3" />Edit</>}
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </Card>
        )
      })}

      {editFeature && (
        <EditEntryModal
          key={editFeature.id + refresh}
          feature={editFeature}
          existingEntry={editingEntry}
          onClose={() => setEditFeature(null)}
          onSave={() => setRefresh((r) => r + 1)}
        />
      )}
    </div>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────────

type TabId = 'manual' | 'faq' | 'admin'

export default function HelpPage() {
  const { data: session } = useSession()
  const role = (session?.user as { role?: string } | undefined)?.role ?? ''
  const isSuperAdmin = role === 'SUPER_ADMIN'

  const [tab, setTab] = useState<TabId>('manual')

  const missingCount  = FEATURE_REGISTRY.filter((f) => getFeatureDocStatus(f.id) === 'MISSING').length
  const outdatedCount = FEATURE_REGISTRY.filter((f) => getFeatureDocStatus(f.id) === 'OUTDATED').length
  // Only flag entries that have neither an uploaded GIF nor auto-generated steps
  const noTutorialCount = HELP_ENTRIES.filter((e) => e.status === 'PUBLISHED' && !e.gifUrl && (!e.steps || e.steps.length === 0)).length

  const TABS: { id: TabId; label: string; icon: React.ElementType; superAdminOnly?: boolean; badge?: number }[] = [
    { id: 'manual', label: 'User Manual', icon: BookOpen },
    { id: 'faq',    label: 'FAQ',         icon: FileText },
    { id: 'admin',  label: 'Admin Panel', icon: Shield, superAdminOnly: true, badge: missingCount + outdatedCount },
  ]

  return (
    <div className="max-w-3xl space-y-5">
      <SectionTitle description="Role-based user manual with GIF tutorials, FAQ, and documentation management">
        Help &amp; Support
      </SectionTitle>

      {/* GIF onboarding banner — shown to super admin on first load */}
      {isSuperAdmin && tab === 'manual' && noTutorialCount > 0 && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-amber-800">
              {noTutorialCount} article{noTutorialCount !== 1 ? 's' : ''} have no tutorial yet.
            </p>
            <p className="text-xs text-amber-700 mt-0.5">
              Articles with steps get auto-generated tutorials. Add steps to those articles in the Admin Panel.
            </p>
          </div>
          <button onClick={() => setTab('admin')} className="shrink-0 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-amber-600 transition-colors">
            Manage
          </button>
        </div>
      )}

      {/* Tab bar */}
      <div className="flex items-center gap-1 rounded-xl border border-[#e4ebf5] bg-white p-1 w-fit">
        {TABS.filter((t) => !t.superAdminOnly || isSuperAdmin).map((t) => {
          const Icon = t.icon
          const active = tab === t.id
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`relative flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition-all
                ${active ? 'bg-brand-500 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
            >
              <Icon className="h-3.5 w-3.5" />
              {t.label}
              {t.badge != null && t.badge > 0 && (
                <span className={`absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold
                  ${active ? 'bg-white text-brand-600' : 'bg-red-500 text-white'}`}>
                  {t.badge}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {tab === 'manual' && <ManualTab role={role} />}
      {tab === 'faq'    && <FAQTab />}
      {tab === 'admin'  && isSuperAdmin && <AdminPanel />}
    </div>
  )
}
