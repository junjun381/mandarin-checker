import { pinyin } from 'pinyin-pro'
import type { PinyinInfo } from '../types'

interface PinyinAllResult {
  origin: string
  pinyin: string
  initial: string
  final: string
  num: number
  isZh: boolean
}

export function getTextPinyinInfo(text: string): PinyinInfo[] {
  // Get full details with tone marks
  const withTone = pinyin(text, { type: 'all', toneType: 'symbol' }) as PinyinAllResult[]
  // Get no-tone version for pronunciation comparison
  const noToneArr = pinyin(text, { type: 'array', toneType: 'none' }) as string[]

  return withTone.map((item, i) => {
    const pinyinNoTone = noToneArr[i] ?? item.pinyin
    // Strip tone marks from final for comparison
    const finalNoTone = item.final
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[ü]/g, 'v')

    return {
      character: item.origin,
      pinyin: item.pinyin,
      pinyinNoTone,
      initial: item.initial,
      final: finalNoTone,
      tone: item.num ?? 5,
      isZh: item.isZh,
    }
  })
}

export function toneToDisplay(tone: number): string {
  const marks: Record<number, string> = {
    1: '¹ 陰平',
    2: '² 陽平',
    3: '³ 上声',
    4: '⁴ 去声',
    5: '° 軽声',
  }
  return marks[tone] ?? `${tone}声`
}

export function toneToNumber(tone: number): string {
  return tone === 5 ? '°' : `${tone}`
}

export const EXAMPLE_TEXTS = [
  { label: '挨拶', text: '你好，我叫李明。很高兴认识你。' },
  { label: '天気', text: '今天天气怎么样？天气很好，不冷也不热。' },
  { label: '食べ物', text: '我想吃北京烤鸭和饺子。' },
  { label: '感謝・挨拶', text: '谢谢你的帮助！再见，明天见！' },
  { label: '数字', text: '一二三四五六七八九十' },
  { label: '声調練習', text: '妈麻马骂，爸爬把罢' },
]
