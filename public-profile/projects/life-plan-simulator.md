---
title: life-plan-simulator
summary: 家族構成と希望するライフイベント（住宅・車・教育・老後）から「いつの時点で世帯年収がいくら必要か」を年次で逆算するアプリ。入力データはブラウザ内だけで扱う。
repo: https://github.com/n-yoshida-dev/life-plan-simulator
visibility: private
status: active
period: 2026-08 〜
stack: [React, TypeScript, Vite, Recharts, Vitest]
featured: false
order: 20
systems: [ai-assisted-development]
---

制度・税率などの外部由来の数値はコードに直書きせず、出典と確認日付きの JSON に分離しています。
計算ロジックは純粋関数として切り出し、単体テストで守っています。実データはリポジトリに入れません。
