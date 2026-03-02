export interface PinyinInfo {
  character: string
  pinyin: string       // with tone mark e.g., "hǎo"
  pinyinNoTone: string // without tone e.g., "hao"
  initial: string      // 声母 e.g., "h"
  final: string        // 韵母 e.g., "ao"
  tone: number         // 声調 1-4, 5=neutral/light
  isZh: boolean
}

export interface ComparisonItem {
  index: number
  original: PinyinInfo
  recognized: PinyinInfo | null
  toneCorrect: boolean
  pronunciationCorrect: boolean
  isFullyCorrect: boolean
}

export interface PracticeSession {
  id: string
  date: number
  originalText: string
  recognizedText: string
  results: ComparisonItem[]
  overallAccuracy: number
  toneAccuracy: number
  pronunciationAccuracy: number
}

export interface MistakePattern {
  character: string
  pinyin: string
  expectedTone: number
  actualTones: number[]
  count: number
}

export interface ToneConfusion {
  from: number
  to: number
  count: number
}

export interface ProgressStats {
  totalSessions: number
  averageAccuracy: number
  averageToneAccuracy: number
  recentTrend: number
  topMistakeChars: MistakePattern[]
  toneConfusions: ToneConfusion[]
  weeklyAccuracy: number[]
}
