import type {
  PracticeSession,
  ProgressStats,
  MistakePattern,
  ToneConfusion,
} from '../types'

const STORAGE_KEY = 'mandarin-checker-sessions'

export function getSessions(): PracticeSession[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as PracticeSession[]) : []
  } catch {
    return []
  }
}

export function saveSession(session: PracticeSession): void {
  const sessions = getSessions()
  sessions.push(session)
  // Keep last 100 sessions
  const trimmed = sessions.slice(-100)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed))
}

export function clearSessions(): void {
  localStorage.removeItem(STORAGE_KEY)
}

export function calcProgressStats(): ProgressStats {
  const sessions = getSessions()

  if (sessions.length === 0) {
    return {
      totalSessions: 0,
      averageAccuracy: 0,
      averageToneAccuracy: 0,
      recentTrend: 0,
      topMistakeChars: [],
      toneConfusions: [],
      weeklyAccuracy: [],
    }
  }

  const totalSessions = sessions.length
  const averageAccuracy = Math.round(
    sessions.reduce((s, x) => s + x.overallAccuracy, 0) / sessions.length
  )
  const averageToneAccuracy = Math.round(
    sessions.reduce((s, x) => s + x.toneAccuracy, 0) / sessions.length
  )

  // Trend: compare last 5 vs previous 5
  const recent = sessions.slice(-5)
  const prev = sessions.slice(-10, -5)
  let recentTrend = 0
  if (prev.length > 0 && recent.length > 0) {
    const recentAvg =
      recent.reduce((s, x) => s + x.overallAccuracy, 0) / recent.length
    const prevAvg =
      prev.reduce((s, x) => s + x.overallAccuracy, 0) / prev.length
    recentTrend = Math.round(recentAvg - prevAvg)
  }

  // Character mistake patterns
  const charMistakes: Record<
    string,
    { char: string; pinyin: string; expectedTone: number; actualTones: number[]; count: number }
  > = {}

  // Tone confusions
  const toneConfMap: Record<string, number> = {}

  for (const session of sessions) {
    for (const item of session.results) {
      if (!item.recognized) continue
      if (!item.toneCorrect || !item.pronunciationCorrect) {
        const key = item.original.character
        if (!charMistakes[key]) {
          charMistakes[key] = {
            char: key,
            pinyin: item.original.pinyin,
            expectedTone: item.original.tone,
            actualTones: [],
            count: 0,
          }
        }
        charMistakes[key].count++
        charMistakes[key].actualTones.push(item.recognized.tone)
      }
      if (!item.toneCorrect && item.recognized) {
        const confKey = `${item.original.tone}-${item.recognized.tone}`
        toneConfMap[confKey] = (toneConfMap[confKey] ?? 0) + 1
      }
    }
  }

  const topMistakeChars: MistakePattern[] = Object.values(charMistakes)
    .sort((a, b) => b.count - a.count)
    .slice(0, 8)
    .map((m) => ({
      character: m.char,
      pinyin: m.pinyin,
      expectedTone: m.expectedTone,
      actualTones: m.actualTones,
      count: m.count,
    }))

  const toneConfusions: ToneConfusion[] = Object.entries(toneConfMap)
    .map(([key, count]) => {
      const [from, to] = key.split('-').map(Number)
      return { from: from!, to: to!, count }
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 6)

  // Weekly accuracy (last 7 sessions for simplicity)
  const weeklyAccuracy = sessions
    .slice(-7)
    .map((s) => s.overallAccuracy)

  return {
    totalSessions,
    averageAccuracy,
    averageToneAccuracy,
    recentTrend,
    topMistakeChars,
    toneConfusions,
    weeklyAccuracy,
  }
}

export function generateFeedback(stats: ProgressStats): string[] {
  const tips: string[] = []

  if (stats.totalSessions === 0) {
    return ['まず練習を始めましょう！テキスト入力タブからスタートできます。']
  }

  if (stats.averageToneAccuracy < 60) {
    tips.push('声調の正確さを重点的に練習しましょう。1声（高平）→2声（上昇）→3声（下降後上昇）→4声（下降）の順で確認してみてください。')
  } else if (stats.averageToneAccuracy < 80) {
    tips.push('声調の精度が上がってきています！引き続き声調に意識を向けて練習しましょう。')
  } else {
    tips.push('声調の正確さが高いです。素晴らしい！')
  }

  // Most confused tone pair
  if (stats.toneConfusions.length > 0) {
    const top = stats.toneConfusions[0]!
    const toneNames: Record<number, string> = { 1: '1声（陰平）', 2: '2声（陽平）', 3: '3声（上声）', 4: '4声（去声）', 5: '軽声' }
    tips.push(
      `${toneNames[top.from] ?? `${top.from}声`}と${toneNames[top.to] ?? `${top.to}声`}を混同しやすいようです（${top.count}回）。聞き比べ練習をしてみましょう。`
    )
  }

  // Most problematic characters
  if (stats.topMistakeChars.length > 0) {
    const topChars = stats.topMistakeChars
      .slice(0, 3)
      .map((m) => `「${m.character}」(${m.pinyin})`)
      .join('、')
    tips.push(`特によく間違える文字: ${topChars}。これらの文字を重点的に練習しましょう。`)
  }

  if (stats.recentTrend > 5) {
    tips.push(`直近の練習で${stats.recentTrend}ポイント向上しています！調子が上がってきています。`)
  } else if (stats.recentTrend < -5) {
    tips.push('直近の正解率がやや下がっています。ゆっくり丁寧に発音することを意識してみましょう。')
  }

  return tips
}
