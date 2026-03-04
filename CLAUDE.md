# mandarin-checker

中国語発音チェックツール

## 概要
声調とピンインをリアルタイムで判定する学習支援ツール

## 技術スタック
- React 18 + TypeScript
- Vite
- Web Speech API（Chrome限定）
- Tesseract.js（OCR、ベータ版）

## 制限事項
- iPhone/Safariは非対応（Web Speech APIの制限）
- OCRの精度は参考程度

## リンク
- 本番: https://mandarin-checker.vercel.app
- GitHub: https://github.com/junjun381/mandarin-checker
- OFUSE: https://ofuse.me/7a2e33c9

## デプロイ
- Vercel連携済み
- mainブランチにpushすると自動デプロイ