---
title: home-site-finder
summary: 戸建てを建てる場所を、駅ではなく町丁目の単位で比較するための判断資料アプリ。公開データを集計し、NG 条件で足切りしたうえで重み付きスコアを地図に塗り分ける。
repo: https://github.com/n-yoshida-dev/home-site-finder
visibility: private
status: paused
period: 2026-08
stack: [Go, PostGIS, GeoJSON, React, MapLibre]
featured: false
order: 22
systems: [ai-assisted-development]
---

Go のデータパイプライン（PostGIS で集計）→ 静的 GeoJSON → React + MapLibre の静的サイト、という構成です。
個人の条件（予算・NG・重み）はブラウザ内だけで適用し、サーバーへ送りません。
