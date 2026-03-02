import { useState, useRef } from 'react'
import { EXAMPLE_TEXTS } from '../utils/pinyinUtils'

interface Props {
  onStart: (text: string) => void
}

export function TextInputPanel({ onStart }: Props) {
  const [inputMode, setInputMode] = useState<'text' | 'image'>('text')
  const [text, setText] = useState('')
  const [ocrLoading, setOcrLoading] = useState(false)
  const [ocrError, setOcrError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleExampleClick = (exampleText: string) => {
    setText(exampleText)
    setInputMode('text')
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setOcrLoading(true)
    setOcrError(null)

    try {
      const { createWorker } = await import('tesseract.js')
      const worker = await createWorker(['chi_sim', 'chi_tra'])
      const { data } = await worker.recognize(file)
      await worker.terminate()

      const extracted = data.text.replace(/\s+/g, '').trim()
      if (extracted) {
        setText(extracted)
        setInputMode('text')
      } else {
        setOcrError('テキストを検出できませんでした。別の画像をお試しください。')
      }
    } catch {
      setOcrError('OCR処理中にエラーが発生しました。')
    } finally {
      setOcrLoading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const canStart = text.replace(/\s/g, '').length > 0

  return (
    <div className="panel">
      <div className="panel-header">
        <h2 className="panel-title">練習テキストを入力</h2>
        <p className="panel-subtitle">テキストを入力するか、画像から文字を取り込んでください</p>
      </div>

      <p className="ocr-beta-notice">※ 画像認識（OCR）はベータ版です。認識精度が低い場合は手入力をお使いください</p>

      <div className="mode-tabs">
        <button
          className={`mode-tab ${inputMode === 'text' ? 'active' : ''}`}
          onClick={() => setInputMode('text')}
        >
          <span className="tab-icon">✏️</span>
          テキスト入力
        </button>
        <button
          className={`mode-tab ${inputMode === 'image' ? 'active' : ''}`}
          onClick={() => setInputMode('image')}
        >
          <span className="tab-icon">📷</span>
          画像から取込
        </button>
      </div>

      {inputMode === 'text' ? (
        <div className="input-area">
          <textarea
            className="text-input"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="ここに中国語のテキストを入力してください…&#10;例: 你好，我是学生。"
            rows={5}
            lang="zh"
            maxLength={500}
          />
          <div className="char-count">{text.replace(/\s/g, '').length} 文字</div>
        </div>
      ) : (
        <div className="image-upload-area">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            style={{ display: 'none' }}
            id="image-upload"
          />
          <label htmlFor="image-upload" className="upload-label">
            {ocrLoading ? (
              <div className="ocr-loading">
                <div className="spinner" />
                <p>OCR処理中...</p>
                <p className="ocr-note">初回は言語データのダウンロードに時間がかかります</p>
              </div>
            ) : (
              <>
                <div className="upload-icon">📁</div>
                <p>クリックして画像を選択</p>
                <p className="upload-hint">PNG、JPG、GIF などに対応</p>
              </>
            )}
          </label>
          {ocrError && <p className="error-message">{ocrError}</p>}
          {text && inputMode === 'image' && (
            <div className="ocr-result">
              <p className="ocr-result-label">取込結果:</p>
              <p className="ocr-result-text">{text}</p>
            </div>
          )}
        </div>
      )}

      <div className="examples-section">
        <p className="examples-label">例文を使う:</p>
        <div className="examples-grid">
          {EXAMPLE_TEXTS.map((ex) => (
            <button
              key={ex.label}
              className="example-btn"
              onClick={() => handleExampleClick(ex.text)}
            >
              <span className="example-label">{ex.label}</span>
              <span className="example-text">{ex.text.slice(0, 12)}{ex.text.length > 12 ? '…' : ''}</span>
            </button>
          ))}
        </div>
      </div>

      <button
        className="start-btn"
        onClick={() => onStart(text.trim())}
        disabled={!canStart}
      >
        練習を始める →
      </button>
    </div>
  )
}
