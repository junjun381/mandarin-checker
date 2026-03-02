import { useState, useEffect } from 'react'
import { calcProgressStats, generateFeedback, clearSessions } from '../utils/storage'
import type { ProgressStats } from '../types'

const TONE_NAMES: Record<number, string> = {
  1: '1声\n陰平',
  2: '2声\n陽平',
  3: '3声\n上声',
  4: '4声\n去声',
  5: '軽声',
}

export function ProgressPanel() {
  const [stats, setStats] = useState<ProgressStats | null>(null)
  const [feedback, setFeedback] = useState<string[]>([])
  const [confirmClear, setConfirmClear] = useState(false)

  useEffect(() => {
    const s = calcProgressStats()
    setStats(s)
    setFeedback(generateFeedback(s))
  }, [])

  const handleClear = () => {
    if (confirmClear) {
      clearSessions()
      const s = calcProgressStats()
      setStats(s)
      setFeedback(generateFeedback(s))
      setConfirmClear(false)
    } else {
      setConfirmClear(true)
    }
  }

  if (!stats) return <div className="panel"><div className="spinner" /></div>

  if (stats.totalSessions === 0) {
    return (
      <div className="panel">
        <div className="panel-header">
          <h2 className="panel-title">学習進捗</h2>
        </div>
        <div className="empty-state">
          <div className="empty-icon">📊</div>
          <h3>まだ練習データがありません</h3>
          <p>「テキスト入力」タブから練習を始めると、ここに統計が表示されます。</p>
        </div>
      </div>
    )
  }

  const trendSign = stats.recentTrend > 0 ? '+' : ''

  return (
    <div className="panel">
      <div className="panel-header">
        <h2 className="panel-title">学習進捗</h2>
        <button
          className={`clear-btn ${confirmClear ? 'confirm' : ''}`}
          onClick={handleClear}
          onBlur={() => setConfirmClear(false)}
        >
          {confirmClear ? '本当に削除する？' : '🗑 データ削除'}
        </button>
      </div>

      {/* Stat cards */}
      <div className="stat-cards">
        <div className="stat-card">
          <div className="stat-value">{stats.totalSessions}</div>
          <div className="stat-label">総セッション数</div>
        </div>
        <div className="stat-card">
          <div className={`stat-value ${stats.averageAccuracy >= 80 ? 'green' : stats.averageAccuracy >= 60 ? 'yellow' : 'red'}`}>
            {stats.averageAccuracy}%
          </div>
          <div className="stat-label">平均正解率</div>
        </div>
        <div className="stat-card">
          <div className={`stat-value ${stats.averageToneAccuracy >= 80 ? 'green' : stats.averageToneAccuracy >= 60 ? 'yellow' : 'red'}`}>
            {stats.averageToneAccuracy}%
          </div>
          <div className="stat-label">平均声調正解率</div>
        </div>
        <div className="stat-card">
          <div className={`stat-value ${stats.recentTrend > 0 ? 'green' : stats.recentTrend < 0 ? 'red' : ''}`}>
            {trendSign}{stats.recentTrend}%
          </div>
          <div className="stat-label">直近の傾向</div>
        </div>
      </div>

      {/* Accuracy chart */}
      {stats.weeklyAccuracy.length > 0 && (
        <div className="chart-card">
          <p className="chart-label">直近のスコア推移</p>
          <div className="bar-chart">
            {stats.weeklyAccuracy.map((score, i) => (
              <div key={i} className="bar-col">
                <div className="bar-wrapper">
                  <div
                    className={`bar ${score >= 80 ? 'bar-green' : score >= 60 ? 'bar-yellow' : 'bar-red'}`}
                    style={{ height: `${score}%` }}
                  />
                </div>
                <span className="bar-value">{score}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Common mistakes */}
      {stats.topMistakeChars.length > 0 && (
        <div className="mistakes-list-card">
          <p className="section-label">よく間違える文字 TOP {stats.topMistakeChars.length}</p>
          <div className="mistake-chars-grid">
            {stats.topMistakeChars.map((m, i) => (
              <div key={i} className="mistake-char-item">
                <span className="m-char">{m.character}</span>
                <span className="m-pinyin">{m.pinyin}</span>
                <span className="m-count">{m.count}回</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tone confusion matrix */}
      {stats.toneConfusions.length > 0 && (
        <div className="tone-conf-card">
          <p className="section-label">声調の混同パターン</p>
          <div className="tone-conf-list">
            {stats.toneConfusions.map((conf, i) => (
              <div key={i} className="tone-conf-item">
                <span className="conf-from">{TONE_NAMES[conf.from]?.replace('\n', ' ') ?? `${conf.from}声`}</span>
                <span className="conf-arrow">→</span>
                <span className="conf-to">{TONE_NAMES[conf.to]?.replace('\n', ' ') ?? `${conf.to}声`}</span>
                <span className="conf-count">{conf.count}回</span>
              </div>
            ))}
          </div>
          <p className="tone-conf-note">（正しい声調 → 誤って発音した声調）</p>
        </div>
      )}

      {/* AI Feedback */}
      <div className="feedback-card">
        <p className="section-label">💡 アドバイス</p>
        <ul className="feedback-list">
          {feedback.map((tip, i) => (
            <li key={i} className="feedback-item">{tip}</li>
          ))}
        </ul>
      </div>

      {/* Tone reference */}
      <div className="tone-ref-card">
        <p className="section-label">声調リファレンス</p>
        <div className="tone-ref-grid">
          {[
            { num: 1, name: '陰平 (第1声)', desc: '高く平らに', example: 'mā (妈)' },
            { num: 2, name: '陽平 (第2声)', desc: '低から高へ上昇', example: 'má (麻)' },
            { num: 3, name: '上声 (第3声)', desc: '下がって上がる', example: 'mǎ (马)' },
            { num: 4, name: '去声 (第4声)', desc: '高から急降下', example: 'mà (骂)' },
          ].map((t) => (
            <div key={t.num} className="tone-ref-item">
              <span className={`tone-num tone-${t.num}`}>{t.num}</span>
              <div className="tone-desc">
                <strong>{t.name}</strong>
                <span>{t.desc}</span>
                <span className="tone-example">{t.example}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* Support link */}
      <div className="support-card">
        <p className="support-message">このツールが役に立ちましたか？</p>
        <a 
          href="https://ofuse.me/7a2e33c9" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="support-btn"
        >
          🐧 開発者を応援する
        </a>
      </div>
    </div>
  )
}
