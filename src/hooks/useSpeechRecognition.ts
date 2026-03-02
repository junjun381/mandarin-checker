import { useState, useRef, useCallback } from 'react'

type RecognitionState = 'idle' | 'recording' | 'processing'

interface UseSpeechRecognitionResult {
  state: RecognitionState
  transcript: string
  interimTranscript: string
  error: string | null
  isSupported: boolean
  audioUrl: string | null
  startRecording: () => void
  stopRecording: () => void
  reset: () => void
}

function getSupportedMimeType(): string {
  const candidates = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/ogg;codecs=opus',
    'audio/mp4',
  ]
  return candidates.find((t) => MediaRecorder.isTypeSupported(t)) ?? ''
}

export function useSpeechRecognition(): UseSpeechRecognitionResult {
  const [state, setState] = useState<RecognitionState>('idle')
  const [transcript, setTranscript] = useState('')
  const [interimTranscript, setInterimTranscript] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)

  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const audioUrlRef = useRef<string | null>(null)

  const SpeechRecognitionClass =
    window.SpeechRecognition ?? window.webkitSpeechRecognition
  const isSupported = !!SpeechRecognitionClass

  const startRecording = useCallback(async () => {
    if (!SpeechRecognitionClass) {
      setError('このブラウザは音声認識に対応していません。Chrome または Edge をお使いください。')
      return
    }

    setError(null)
    setTranscript('')
    setInterimTranscript('')

    // 前回の音声URLを破棄
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current)
      audioUrlRef.current = null
    }
    setAudioUrl(null)
    audioChunksRef.current = []

    // MediaRecorder で音声を録音
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mimeType = getSupportedMimeType()
      const mediaRecorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream)

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data)
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, {
          type: mimeType || 'audio/webm',
        })
        const url = URL.createObjectURL(blob)
        audioUrlRef.current = url
        setAudioUrl(url)
        stream.getTracks().forEach((t) => t.stop())
      }

      mediaRecorder.start(100)
      mediaRecorderRef.current = mediaRecorder
    } catch {
      // MediaRecorder が使えない場合でも音声認識は続行
    }

    // Web Speech API で文字起こし
    const recognition = new SpeechRecognitionClass()
    recognition.lang = 'zh-CN'
    recognition.continuous = true
    recognition.interimResults = true
    recognition.maxAlternatives = 1

    recognition.onstart = () => {
      setState('recording')
    }

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalText = ''
      let interimText = ''

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        if (result && result[0]) {
          if (result.isFinal) {
            finalText += result[0].transcript
          } else {
            interimText += result[0].transcript
          }
        }
      }

      if (finalText) {
        setTranscript((prev) => prev + finalText)
      }
      setInterimTranscript(interimText)
    }

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error === 'no-speech') {
        setError('音声が検出されませんでした。マイクに向かって話してください。')
      } else if (event.error === 'not-allowed') {
        setError('マイクへのアクセスが拒否されました。ブラウザの設定を確認してください。')
      } else {
        setError(`音声認識エラー: ${event.error}`)
      }
      setState('idle')
    }

    recognition.onend = () => {
      setInterimTranscript('')
      setState('idle')
    }

    recognitionRef.current = recognition
    recognition.start()
  }, [SpeechRecognitionClass])

  const stopRecording = useCallback(() => {
    if (recognitionRef.current) {
      setState('processing')
      recognitionRef.current.stop()
      recognitionRef.current = null
    }
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop()
      mediaRecorderRef.current = null
    }
  }, [])

  const reset = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      recognitionRef.current = null
    }
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop()
      mediaRecorderRef.current = null
    }
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current)
      audioUrlRef.current = null
    }
    setState('idle')
    setTranscript('')
    setInterimTranscript('')
    setError(null)
    setAudioUrl(null)
  }, [])

  return {
    state,
    transcript,
    interimTranscript,
    error,
    isSupported,
    audioUrl,
    startRecording,
    stopRecording,
    reset,
  }
}
