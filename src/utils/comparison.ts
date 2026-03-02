import type { ComparisonItem } from '../types'
import { getTextPinyinInfo } from './pinyinUtils'

export function compareTexts(
  originalText: string,
  recognizedText: string
): ComparisonItem[] {
  const originalInfos = getTextPinyinInfo(originalText)
  const recognizedInfos = getTextPinyinInfo(recognizedText)

  // Only compare Chinese characters
  const origZh = originalInfos.filter((p) => p.isZh)
  const recogZh = recognizedInfos.filter((p) => p.isZh)

  const results: ComparisonItem[] = []
  const maxLen = origZh.length

  for (let i = 0; i < maxLen; i++) {
    const orig = origZh[i]
    const recog = recogZh[i] ?? null

    if (!orig) continue

    const toneCorrect = recog ? orig.tone === recog.tone : false
    const pronunciationCorrect = recog
      ? orig.initial === recog.initial && orig.final === recog.final
      : false
    const isFullyCorrect = toneCorrect && pronunciationCorrect

    results.push({
      index: i,
      original: orig,
      recognized: recog,
      toneCorrect,
      pronunciationCorrect,
      isFullyCorrect,
    })
  }

  return results
}

export function calcAccuracy(results: ComparisonItem[]): {
  overall: number
  tone: number
  pronunciation: number
} {
  if (results.length === 0) return { overall: 0, tone: 0, pronunciation: 0 }

  const valid = results.filter((r) => r.recognized !== null)
  if (valid.length === 0) return { overall: 0, tone: 0, pronunciation: 0 }

  const overall = Math.round(
    (valid.filter((r) => r.isFullyCorrect).length / valid.length) * 100
  )
  const tone = Math.round(
    (valid.filter((r) => r.toneCorrect).length / valid.length) * 100
  )
  const pronunciation = Math.round(
    (valid.filter((r) => r.pronunciationCorrect).length / valid.length) * 100
  )

  return { overall, tone, pronunciation }
}
