import { useState } from 'react'
import { TextInputPanel } from './components/TextInputPanel'
import { PracticePanel } from './components/PracticePanel'
import { ProgressPanel } from './components/ProgressPanel'

type Tab = 'input' | 'practice' | 'progress'

export default function App() {
  const [tab, setTab] = useState<Tab>('input')
  const [practiceText, setPracticeText] = useState('')
  const [showPrivacyModal, setShowPrivacyModal] = useState(false)
  const [showEnvModal, setShowEnvModal] = useState(false)

  const handleStart = (text: string) => {
    setPracticeText(text)
    setTab('practice')
  }

  const handleBack = () => {
    setTab('input')
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <div className="header-title">
            <span className="header-flag">🇨🇳</span>
            <div>
              <h1>中国語発音チェッカー</h1>
              <div className="header-subtitle-row">
                <p className="header-subtitle">声調・拼音をリアルタイムで分析</p>
                <button className="env-link" onClick={() => setShowEnvModal(true)}>
                  ⚠️ 動作環境について
                </button>
              </div>
            </div>
          </div>
          <nav className="nav-tabs">
            <button
              className={`nav-tab ${tab === 'input' ? 'active' : ''}`}
              onClick={() => setTab('input')}
            >
              <span className="nav-icon">✏️</span>
              <span>テキスト入力</span>
            </button>
            <button
              className={`nav-tab ${tab === 'practice' ? 'active' : ''}`}
              onClick={() => {
                if (practiceText) setTab('practice')
              }}
              disabled={!practiceText}
            >
              <span className="nav-icon">🎤</span>
              <span>練習</span>
            </button>
            <button
              className={`nav-tab ${tab === 'progress' ? 'active' : ''}`}
              onClick={() => setTab('progress')}
            >
              <span className="nav-icon">📊</span>
              <span>進捗</span>
            </button>
          </nav>
        </div>
      </header>

      <main className="app-main">
        {tab === 'input' && <TextInputPanel onStart={handleStart} />}
        {tab === 'practice' && practiceText && (
          <PracticePanel text={practiceText} onBack={handleBack} />
        )}
        {tab === 'practice' && !practiceText && (
          <div className="panel">
            <div className="empty-state">
              <div className="empty-icon">💬</div>
              <h3>テキストが設定されていません</h3>
              <p>「テキスト入力」タブでテキストを入力してから練習を始めてください。</p>
              <button className="start-btn" onClick={() => setTab('input')}>
                テキストを入力する
              </button>
            </div>
          </div>
        )}
        {tab === 'progress' && <ProgressPanel />}
      </main>

      <footer className="app-footer">
        <button className="privacy-link" onClick={() => setShowPrivacyModal(true)}>
          プライバシーについて
        </button>
      </footer>

      {showEnvModal && (
        <div className="modal-backdrop" onClick={() => setShowEnvModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <div className="modal-header">
              <h2 className="modal-title">動作環境について</h2>
              <button className="modal-close" onClick={() => setShowEnvModal(false)} aria-label="閉じる">✕</button>
            </div>
            <div className="modal-body">
              <p className="env-modal-intro">音声認識機能は以下のブラウザでご利用いただけます：</p>
              <ul className="env-list">
                <li>✅ <strong>Windows / Mac</strong>：Google Chrome</li>
                <li>✅ <strong>Android</strong>：Google Chrome</li>
                <li>❌ <strong>iPhone / iPad</strong>：非対応（Safari、Chromeともに非対応）</li>
              </ul>
              <p className="env-modal-note">iPhone/iPadをお使いの方にはご不便をおかけして申し訳ありません🙏</p>
            </div>
          </div>
        </div>
      )}

      {showPrivacyModal && (
        <div className="modal-backdrop" onClick={() => setShowPrivacyModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <div className="modal-header">
              <h2 className="modal-title">プライバシーについて</h2>
              <button className="modal-close" onClick={() => setShowPrivacyModal(false)} aria-label="閉じる">✕</button>
            </div>
            <div className="modal-body">
              <div className="privacy-item">
                <div className="privacy-icon">🎤</div>
                <div>
                  <strong>音声認識</strong>
                  <p>音声認識にはブラウザのWeb Speech APIを使用しています。録音した音声データはGoogleのサーバーに送信され処理されます。音声データの取り扱いについてはGoogleのプライバシーポリシーをご確認ください。</p>
                </div>
              </div>
              <div className="privacy-item">
                <div className="privacy-icon">🖼️</div>
                <div>
                  <strong>画像のOCR処理</strong>
                  <p>アップロードした画像はブラウザ内（WebAssembly）で処理されます。画像データが外部サーバーに送信されることはありません。</p>
                </div>
              </div>
              <div className="privacy-item">
                <div className="privacy-icon">💾</div>
                <div>
                  <strong>練習履歴</strong>
                  <p>練習テキスト・認識結果・スコアなどの履歴はブラウザ内のlocalStorageにのみ保存されます。外部サーバーへの送信や第三者との共有は行いません。</p>
                </div>
              </div>
              <div className="disclaimer-section">
                <p className="disclaimer-title">【免責事項】</p>
                <ul className="disclaimer-list">
                  <li>本ツールは語学学習の補助を目的としており、発音判定の正確性を保証するものではありません</li>
                  <li>音声認識はブラウザの機能を利用しているため、環境により精度が異なる場合があります</li>
                  <li>本ツールの利用により生じた損害について、開発者は責任を負いかねます</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
