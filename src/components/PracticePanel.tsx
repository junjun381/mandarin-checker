import { useState, useEffect, useCallback, useRef } from 'react'
import { useSpeechRecognition } from '../hooks/useSpeechRecognition'
import { getTextPinyinInfo, toneToNumber } from '../utils/pinyinUtils'
import { compareTexts, calcAccuracy } from '../utils/comparison'
import { saveSession } from '../utils/storage'
import type { ComparisonItem, PracticeSession } from '../types'

interface Props {
  text: string
  onBack: () => void
}

type PanelState = 'ready' | 'recording' | 'results'

export function PracticePanel({ text, onBack }: Props) {
  const [panelState, setPanelState] = useState<PanelState>('ready')
  const [results, setResults] = useState<ComparisonItem[] | null>(null)
  const [accuracy, setAccuracy] = useState<{ overall: number; tone: number; pronunciation: number } | null>(null)

  const { state: recState, transcript, interimTranscript, error, isSupported, audioUrl, startRecording, stopRecording, reset } = useSpeechRecognition()

  const originalInfos = getTextPinyinInfo(text)

  const handleRecord = useCallback(() => {
    if (panelState === 'ready') {
      reset()
      setPanelState('recording')
      startRecording()
    } else if (panelState === 'recording') {
      stopRecording()
      setPanelState('results')
    }
  }, [panelState, startRecording, stopRecording, reset])

  // When recognition finishes and we have transcript → analyze
  useEffect(() => {
    if (panelState === 'results' && recState === 'idle' && transcript) {
      const compResults = compareTexts(text, transcript)
      const acc = calcAccuracy(compResults)
      setResults(compResults)
      setAccuracy(acc)

      const session: PracticeSession = {
        id: crypto.randomUUID(),
        date: Date.now(),
        originalText: text,
        recognizedText: transcript,
        results: compResults,
        overallAccuracy: acc.overall,
        toneAccuracy: acc.tone,
        pronunciationAccuracy: acc.pronunciation,
      }
      saveSession(session)
    }
  }, [panelState, recState, transcript, text])

  const handleRetry = () => {
    setResults(null)
    setAccuracy(null)
    setPanelState('ready')
    reset()
  }

  const scoreColor = (score: number) => {
    if (score >= 80) return 'score-green'
    if (score >= 60) return 'score-yellow'
    return 'score-red'
  }

  return (
    <div className="panel">
      <div className="panel-header">
        <button className="back-btn" onClick={onBack}>← テキスト変更</button>
        <h2 className="panel-title">発音練習</h2>
      </div>

      {/* Action bar — results ready 時のみヘッダー直下に表示 */}
      {panelState === 'results' && recState === 'idle' && results && transcript !== '' && (
        <div className="top-action-bar">
          {audioUrl && <PlaybackButton audioUrl={audioUrl} inline />}
          <button className="retry-btn" onClick={handleRetry}>🔄 もう一度</button>
          <button className="back-to-input-btn" onClick={onBack}>✏️ テキスト変更</button>
        </div>
      )}

      {/* Original text display */}
      <div className="practice-text-card">
        <p className="practice-card-label">練習テキスト</p>
        <div className="char-row-display">
          {originalInfos.map((info, i) => (
            <div key={i} className={`char-cell ${!info.isZh ? 'punctuation' : ''}`}>
              {info.isZh && (
                <>
                  <span className="cell-tone">{toneToNumber(info.tone)}</span>
                  <span className="cell-pinyin">{info.pinyin}</span>
                </>
              )}
              <span className="cell-char">{info.character}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Recording section */}
      {panelState !== 'results' && (
        <div className="record-section">
          {!isSupported && (
            <div className="error-banner">
              音声認識はこのブラウザに対応していません。Chrome または Edge をお使いください。
            </div>
          )}
          {error && <div className="error-banner">{error}</div>}

          <div className="record-area">
            <button
              className={`record-btn ${panelState === 'recording' ? 'recording' : ''}`}
              onClick={handleRecord}
              disabled={!isSupported}
            >
              {panelState === 'recording' ? (
                <>
                  <span className="record-icon">⏹</span>
                  録音停止
                </>
              ) : (
                <>
                  <span className="record-icon">🎤</span>
                  録音開始
                </>
              )}
            </button>
            <p className="google-notice">🔒 音声はGoogleのサーバーで処理されます</p>
            {panelState === 'recording' && (
              <div className="recording-indicator">
                <span className="recording-dot" />
                録音中...
              </div>
            )}
          </div>

          {/* Live transcript */}
          {(transcript || interimTranscript) && (
            <div className="live-transcript">
              <span className="final-text">{transcript}</span>
              <span className="interim-text">{interimTranscript}</span>
            </div>
          )}

          {panelState === 'recording' && (
            <p className="record-hint">上のテキストを読み上げてください。読み終わったら「録音停止」を押してください。</p>
          )}
        </div>
      )}

      {/* Results section */}
      {panelState === 'results' && (
        <div className="results-section">
          {recState !== 'idle' || !results ? (
            <div className="processing">
              <div className="spinner" />
              <p>解析中...</p>
            </div>
          ) : transcript === '' ? (
            <div className="no-speech">
              <p>音声が認識されませんでした。</p>
              <button className="retry-btn" onClick={handleRetry}>もう一度試す</button>
            </div>
          ) : (
            <>
              {/* Score cards */}
              {accuracy && (
                <div className="score-cards">
                  <div className={`score-card ${scoreColor(accuracy.overall)}`}>
                    <div className="score-value">{accuracy.overall}%</div>
                    <div className="score-label">総合正解率</div>
                  </div>
                  <div className={`score-card ${scoreColor(accuracy.tone)}`}>
                    <div className="score-value">{accuracy.tone}%</div>
                    <div className="score-label">声調正解率</div>
                  </div>
                  <div className={`score-card ${scoreColor(accuracy.pronunciation)}`}>
                    <div className="score-value">{accuracy.pronunciation}%</div>
                    <div className="score-label">発音正解率</div>
                  </div>
                </div>
              )}

              {/* Comparison table */}
              <div className="comparison-card">
                <p className="comparison-label">詳細比較</p>
                <div className="comparison-header-row">
                  <span className="comp-col-label">声調</span>
                  <span className="comp-col-label">拼音</span>
                  <span className="comp-col-label">漢字</span>
                  <span className="comp-col-label">判定</span>
                </div>
                <div className="comparison-rows">
                  {results.map((item, i) => (
                    <ComparisonRow key={i} item={item} />
                  ))}
                </div>
              </div>

              {/* Mistakes summary */}
              {results.filter((r) => !r.isFullyCorrect && r.recognized).length > 0 && (
                <div className="mistakes-card">
                  <p className="mistakes-label">間違いの詳細</p>
                  {results
                    .filter((r) => !r.isFullyCorrect && r.recognized)
                    .map((item, i) => (
                      <MistakeDetail key={i} item={item} />
                    ))}
                </div>
              )}

            </>
          )}
        </div>
      )}
    </div>
  )
}

function ComparisonRow({ item }: { item: ComparisonItem }) {
  const { original, recognized, toneCorrect, isFullyCorrect } = item

  return (
    <div className={`comp-row ${isFullyCorrect ? 'correct' : 'incorrect'}`}>
      {/* Tone */}
      <div className="comp-cell">
        <span className="comp-orig">{toneToNumber(original.tone)}</span>
        {recognized && !toneCorrect && (
          <span className="comp-got error-text">{toneToNumber(recognized.tone)}</span>
        )}
      </div>
      {/* Pinyin */}
      <div className="comp-cell">
        <span className={`comp-orig ${!toneCorrect ? 'error-text' : ''}`}>{original.pinyin}</span>
        {recognized && !toneCorrect && (
          <span className="comp-got error-text">{recognized.pinyin}</span>
        )}
      </div>
      {/* Character */}
      <div className="comp-cell">
        <span className="comp-char-orig">{original.character}</span>
        {recognized && recognized.character !== original.character && (
          <span className="comp-char-got error-text">{recognized.character}</span>
        )}
      </div>
      {/* Verdict */}
      <div className="comp-cell">
        {!recognized ? (
          <span className="verdict-miss">?</span>
        ) : isFullyCorrect ? (
          <span className="verdict-ok">✓</span>
        ) : (
          <span className="verdict-ng">✗</span>
        )}
      </div>
    </div>
  )
}

function PlaybackButton({ audioUrl, inline = false }: { audioUrl: string; inline?: boolean }) {
  const [isPlaying, setIsPlaying] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const handleToggle = () => {
    if (!audioRef.current) {
      audioRef.current = new Audio(audioUrl)
      audioRef.current.onended = () => setIsPlaying(false)
    }
    if (isPlaying) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
      setIsPlaying(false)
    } else {
      audioRef.current.play().catch(() => setIsPlaying(false))
      setIsPlaying(true)
    }
  }

  useEffect(() => {
    return () => {
      audioRef.current?.pause()
      audioRef.current = null
    }
  }, [])

  return (
    <button
      className={`playback-btn ${isPlaying ? 'playing' : ''} ${inline ? 'inline' : ''}`}
      onClick={handleToggle}
    >
      {isPlaying ? '⏹ 停止' : '▶ 録音を再生'}
    </button>
  )
}

function MistakeDetail({ item }: { item: ComparisonItem }) {
  const { original, recognized, toneCorrect, pronunciationCorrect } = item
  if (!recognized) return null

  return (
    <div className="mistake-detail">
      <span className="mistake-char">{original.character}</span>
      <div className="mistake-info">
        {!toneCorrect && (
          <span className="mistake-tag tone-tag">
            声調: {toneToNumber(original.tone)}声 → {toneToNumber(recognized.tone)}声に聞こえた
          </span>
        )}
        {!pronunciationCorrect && (
          <span className="mistake-tag pronun-tag">
            発音: {original.pinyin} → {recognized.pinyin} に聞こえた
          </span>
        )}
      </div>
    </div>
  )
}
