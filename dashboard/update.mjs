#!/usr/bin/env node
// 開発ダッシュボードのデータ生成（apps-workflow の dashboard スキルのテンプレート。写して使う）。
// リポジトリ内の正本（TODO.md / HANDOFF.md / logs/decisions.md）と git / gh / bd の出力、プロジェクト固有の指標を読み、
// dashboard/data.js（`window.DASHBOARD_DATA = {...}` という 1 文の JS ファイル）を書き出す。JSON ではなく JS にしているのは、
// index.html をブラウザでダブルクリックして開いても（file:// でも）読めるようにするため（fetch は file:// では使えない）。
// ダッシュボード独自の状態は持たない（ここで作るデータは毎回捨てて作り直す派生物）。
//
// 使い方:
//   node dashboard/update.mjs --serve --open   配信して http://127.0.0.1:8787/ をブラウザで開く。画面の「更新」ボタンで作り直せる（普段はこれ）
//   node dashboard/update.mjs                  data.js を作り直すだけ → dashboard/index.html をダブルクリックで開く（ボタンは使えない）
//   オプション: --port <n> --host <addr>（既定 127.0.0.1。スマホから見るなら --host 0.0.0.0）--quiet
//
// ブラウザだけでは git / gh / bd を実行できないので、「更新」ボタンは配信モードのこのプロセス（POST /update）が受けて作り直す。
//
// 依存: Node 標準ライブラリだけ。git は必須。gh / bd は無ければその項目を「取得できず」にして続ける。
// プロジェクトごとに書き換えるのは readProjectSpecific()（★ の節）だけ。

import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import http from 'node:http'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(HERE, '..')
const OUT = path.join(HERE, 'data.js')
const RECENT_DAYS = 14 // 「最近」の範囲。変更ファイル・決定の集計に使う

// ---------- 小さな道具 ----------

/** コマンドを同期実行して結果を返す。失敗しても例外にせず ok=false で返す（取得できない項目は画面に「取得できず」と出す） */
function run(cmd, args, { cwd = ROOT, timeout = 30_000 } = {}) {
  const r = spawnSync(cmd, args, { cwd, encoding: 'utf8', timeout })
  if (r.error) return { ok: false, stdout: '', stderr: r.error.message, code: -1 }
  return { ok: r.status === 0, stdout: r.stdout ?? '', stderr: r.stderr ?? '', code: r.status }
}

/** run の結果を JSON として読む。読めなければ null */
function runJson(cmd, args, opts) {
  const r = run(cmd, args, opts)
  if (!r.ok) return { value: null, error: (r.stderr || r.stdout).trim().split('\n')[0] || `${cmd} が失敗` }
  try {
    return { value: JSON.parse(r.stdout), error: null }
  } catch {
    return { value: null, error: `${cmd} の出力が JSON でない` }
  }
}

/** ファイルを読む。無ければ null */
function readText(rel) {
  const p = path.join(ROOT, rel)
  return fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : null
}

/** JSON ファイルを読む。無ければ value=null（error なし）、壊れていれば error に理由を残す（握りつぶさず画面の注意に出す） */
function readJson(rel) {
  const t = readText(rel)
  if (t == null) return { value: null, error: null }
  try {
    return { value: JSON.parse(t), error: null }
  } catch (e) {
    return { value: null, error: `${rel} が JSON として読めない（${e.message}）` }
  }
}

// ---------- 正本ごとの読み取り ----------

/** プロジェクト名は CLAUDE.md の先頭見出しから取る（worktree ではディレクトリ名が当てにならない） */
function projectName() {
  const m = (readText('CLAUDE.md') ?? '').match(/^# +(.+)$/m)
  return m ? m[1].trim() : path.basename(ROOT)
}

/**
 * TODO.md を apps-workflow の progress.sh と同じ規則で数える。
 * `## ` 見出し = フェーズ。見出しに「確認待ち」を含む節は回答待ち、「保留」を含む節は保留として合計から外す。
 * 字下げした子項目も 1 件と数える。未完タスクの一覧は先頭レベルだけを取る。
 */
function readTodo() {
  const text = readText('TODO.md')
  if (text == null) return null
  const phases = []
  const byName = new Map()
  const ask = { open: 0, done: 0, items: [] }
  const hold = { open: 0, done: 0 }
  const openTasks = []
  let kind = 'phase'
  let section = '（見出しなし）'
  let sub = ''
  const phaseOf = (name) => {
    if (!byName.has(name)) {
      const p = { name, done: 0, open: 0 }
      byName.set(name, p)
      phases.push(p)
    }
    return byName.get(name)
  }
  text.split('\n').forEach((line, i) => {
    let m
    if ((m = line.match(/^## +(.+)$/))) {
      section = m[1].trim()
      kind = /確認待ち/.test(section) ? 'ask' : /保留/.test(section) ? 'hold' : 'phase'
      sub = ''
      if (kind === 'phase') phaseOf(section)
      return
    }
    if ((m = line.match(/^### +(.+)$/))) {
      sub = m[1].trim()
      return
    }
    if ((m = line.match(/^([ \t]*)- \[([ xX])\] *(.*)$/))) {
      const topLevel = m[1] === ''
      const done = m[2] !== ' '
      const body = m[3].trim()
      if (kind === 'ask') {
        done ? ask.done++ : ask.open++
        if (!done && topLevel) ask.items.push({ line: i + 1, text: body })
      } else if (kind === 'hold') {
        done ? hold.done++ : hold.open++
      } else {
        const p = phaseOf(section)
        done ? p.done++ : p.open++
        if (!done && topLevel) openTasks.push({ line: i + 1, text: body, phase: section, section: sub })
      }
    }
  })
  const counted = phases.filter((p) => p.done + p.open > 0)
  const total = counted.reduce((a, p) => ({ done: a.done + p.done, open: a.open + p.open }), { done: 0, open: 0 })
  const current = counted.find((p) => p.open > 0) ?? null
  return {
    phases: phases.map((p) => ({ ...p, total: p.done + p.open })),
    total: { ...total, total: total.done + total.open },
    ask: { open: ask.open, done: ask.done },
    hold,
    currentPhase: current?.name ?? null,
    currentSection: openTasks[0]?.section ?? null,
    openTasks: openTasks.slice(0, 10),
    askItems: ask.items,
  }
}

/** HANDOFF.md から「現在地」「次にやること」の節を Markdown のまま取り出し、最終コミットからの遅れも添える */
function readHandoff() {
  const text = readText('HANDOFF.md')
  if (text == null) return null
  const sections = {}
  let key = null
  for (const line of text.split('\n')) {
    const m = line.match(/^## +(.+)$/)
    if (m) {
      const title = m[1]
      key = /現在地/.test(title) ? 'current' : /次/.test(title) && /やること|一手/.test(title) ? 'next' : null
      if (key) sections[key] = { title, body: [] }
      continue
    }
    if (key) sections[key].body.push(line)
  }
  for (const s of Object.values(sections)) s.body = s.body.join('\n').trim()
  const last = run('git', ['log', '-1', '--format=%H%x09%cs%x09%s', '--', 'HANDOFF.md'])
  let lastCommit = null
  let commitsSince = null
  if (last.ok && last.stdout.trim()) {
    const [hash, date, subject] = last.stdout.trim().split('\t')
    lastCommit = { hash: hash.slice(0, 7), date, subject }
    const n = run('git', ['rev-list', '--count', `${hash}..HEAD`])
    if (n.ok) commitsSince = Number(n.stdout.trim())
  }
  return { sections, lastCommit, commitsSince }
}

/** logs/decisions.md の見出し（`## YYYY-MM-DD 題`）から最近の合意を取る */
function readDecisions() {
  const text = readText('logs/decisions.md')
  if (text == null) return []
  const out = []
  for (const m of text.matchAll(/^## +(\d{4}-\d{2}-\d{2}) +(.+)$/gm)) out.push({ date: m[1], title: m[2].trim() })
  return out.sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 6)
}

/** git の状態：ブランチ、未コミット、push 前後、最近のコミット、最近よく変わったファイル */
function readGit() {
  const branch = run('git', ['rev-parse', '--abbrev-ref', 'HEAD']).stdout.trim()
  const dirty = run('git', ['status', '--porcelain=v1'])
    .stdout.split('\n')
    .filter(Boolean)
    .map((l) => ({ status: l.slice(0, 2).trim() || '??', path: l.slice(3) }))
  let ahead = null
  let behind = null
  let upstream = null
  const up = run('git', ['rev-parse', '--abbrev-ref', '@{upstream}'])
  if (up.ok) {
    upstream = up.stdout.trim()
    const lr = run('git', ['rev-list', '--left-right', '--count', 'HEAD...@{upstream}'])
    if (lr.ok) [ahead, behind] = lr.stdout.trim().split(/\s+/).map(Number)
  }
  const commits = run('git', ['log', '-12', '--format=%h%x09%cI%x09%s'])
    .stdout.split('\n')
    .filter(Boolean)
    .map((l) => {
      const [hash, date, subject] = l.split('\t')
      const pr = subject.match(/\(#(\d+)\)\s*$/)
      return { hash, date, subject: subject.replace(/\s*\(#\d+\)\s*$/, ''), pr: pr ? Number(pr[1]) : null }
    })
  const counts = new Map()
  for (const p of run('git', ['log', `--since=${RECENT_DAYS}.days`, '--name-only', '--format='])
    .stdout.split('\n')
    .filter(Boolean)) {
    counts.set(p, (counts.get(p) ?? 0) + 1)
  }
  const recentFiles = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([file, commits]) => ({ file, commits }))
  return { branch, upstream, ahead, behind, dirty, commits, recentFiles, recentDays: RECENT_DAYS }
}

/** GitHub（gh CLI）：リポジトリ、開いている PR、最近の CI。gh が無い・未ログインなら error を入れて続ける */
function readGithub() {
  const repo = runJson('gh', ['repo', 'view', '--json', 'url,visibility,name'])
  if (!repo.value) return { available: false, error: repo.error, repo: null, openPrs: [], runs: [] }
  const prs = runJson('gh', [
    'pr',
    'list',
    '--state',
    'open',
    '--json',
    'number,title,url,headRefName,isDraft,updatedAt,statusCheckRollup',
  ])
  const openPrs = (prs.value ?? []).map((p) => {
    const states = (p.statusCheckRollup ?? []).map((c) => (c.conclusion || c.state || '').toUpperCase())
    const checks = states.some((s) => s === 'FAILURE' || s === 'ERROR' || s === 'CANCELLED')
      ? 'failure'
      : states.some((s) => s === 'PENDING' || s === 'IN_PROGRESS' || s === 'QUEUED' || s === '')
        ? 'pending'
        : states.length
          ? 'success'
          : 'none'
    // 失敗したジョブ名（例：backend (vet / test / build)）。画面の PR の行に「失敗: backend」と出す
    const failed = (p.statusCheckRollup ?? [])
      .filter((c) => ['FAILURE', 'ERROR', 'TIMED_OUT'].includes((c.conclusion || c.state || '').toUpperCase()))
      .map((c) => c.name || c.context)
      .filter(Boolean)
    return { number: p.number, title: p.title, url: p.url, branch: p.headRefName, draft: p.isDraft, updatedAt: p.updatedAt, checks, failed }
  })
  const list = runJson('gh', [
    'run',
    'list',
    '--limit',
    '15', // 画面の「最近の実行」は main だけを出すので、PR の実行に埋もれないよう多めに取る
    '--json',
    'databaseId,status,conclusion,headBranch,event,displayTitle,createdAt,url',
  ])
  const runs = (list.value ?? []).map((r) => ({
    id: r.databaseId,
    status: r.status,
    conclusion: r.conclusion,
    branch: r.headBranch,
    event: r.event,
    title: r.displayTitle,
    createdAt: r.createdAt,
    url: r.url,
    jobs: null,
  }))
  // ジョブ別（frontend / backend / 秘密情報）の結果は、main の最新の 1 本だけ引く（gh の呼び出しを増やさない）。
  // 開いている PR の失敗ジョブは、上の statusCheckRollup から取れている
  const detailTargets = [runs.find((r) => r.branch === 'main')].filter(Boolean)
  for (const r of detailTargets) {
    const v = runJson('gh', ['run', 'view', String(r.id), '--json', 'jobs'])
    if (v.value?.jobs) {
      // 画面に出すのは検査のジョブだけ。準備用のジョブ（例：skill-matrix の「対象の検出」）を隠したいときは、ここに名前を足す
      const HIDDEN_JOBS = []
      r.jobs = v.value.jobs
        .filter((j) => !HIDDEN_JOBS.includes(j.name))
        .map((j) => ({ name: j.name, status: j.status, conclusion: j.conclusion, url: j.url }))
    }
  }
  return { available: true, error: prs.error ?? list.error ?? null, repo: repo.value, openPrs, runs }
}

/**
 * Beads（`bd`）：このプロジェクトの epic（題名がプロジェクト名で始まる）配下の付箋。
 * ラベル human のものが「人間の判断・作業待ち」。閉じたものは最近の分だけ残す
 */
function readBeads(name) {
  const r = runJson('bd', ['list', '--json', '--all', '-n', '0'])
  if (!r.value) return { available: false, error: r.error, epic: null, human: [], others: [], recentlyClosed: [] }
  const all = r.value
  const epic = all.find((x) => x.issue_type === 'epic' && (x.title ?? '').startsWith(name)) ?? null
  const prefix = `[${name}]`
  const mine = all.filter((x) => (epic && x.parent === epic.id) || (x.title ?? '').startsWith(prefix))
  const since = Date.now() - RECENT_DAYS * 86_400_000
  const slim = (x) => ({
    id: x.id,
    title: x.title,
    status: x.status,
    priority: x.priority,
    labels: x.labels ?? [],
    updatedAt: x.updated_at,
    closedAt: x.closed_at ?? null,
    blockedBy: (x.dependencies ?? []).filter((d) => d.type === 'blocks').map((d) => d.depends_on_id),
  })
  const open = mine.filter((x) => x.status !== 'closed').map(slim).sort((a, b) => a.priority - b.priority)
  return {
    available: true,
    error: null,
    epic: epic ? { id: epic.id, title: epic.title, status: epic.status } : null,
    human: open.filter((x) => x.labels.includes('human')),
    others: open.filter((x) => !x.labels.includes('human')),
    recentlyClosed: mine
      .filter((x) => x.status === 'closed' && x.closed_at && Date.parse(x.closed_at) >= since)
      .map(slim),
  }
}

// ---------- ★ プロジェクト固有の指標（プロジェクトごとに書き換えるのはここだけ） ----------
//
// 上の読み取り（TODO / HANDOFF / decisions / git / gh / bd）は apps 共通の規約なので、そのまま使える。
// プロジェクトごとに違うのは「そのプロジェクトで人が今見る価値のある数字と状態」だけ。ここに 1 関数で書く。
// index.html は下の形をそのまま描くので、index.html を触らずに済むことが多い。
//
// 返す形（全部任意。null を返せばカードもタイルも出ない）:
//   {
//     title: 'データ（data/）',                        // カードの見出し
//     status: { kind: 'good'|'bad'|'warn'|'na', label: '成功', tile: 'データ検証', sub: '判定 3 件' },
//                                                      // 最上段のタイルに出す状態 1 つ。kind は色、label は記号の横の文字
//     stats: [{ value: 46, label: '項目' }, ...],      // 数字（4 つまで）
//     bars: [{ label: 'L1', value: 6 }, ...],          // 1 本の帯の内訳（任意。先頭から順に薄い色 → 濃い色。5 段階まで）
//     note: 'Web アプリ開発の学習ロードマップ',         // 小さな補足 1 行
//     output: ['…', '…'],                              // 折りたたみに出す生の出力（失敗時のログなど）
//     alerts: [{ level: 'error'|'warn', text: '…' }],  // 最上段の注意に足すもの
//     human: [{ kind: '判断', text: '…', full: '…', src: 'state.json' }], // 「あなた待ち」に足すもの
//   }
//
// 例（skill-matrix）：data/roadmap.json と data/state.json の件数、判定ファイル数、Go CLI の verify の成否を出している。
// https://github.com/n-yoshida-dev/skill-matrix/blob/main/dashboard/update.mjs の readProjectData を見る。
// 数十秒かかるコマンド（テスト一式など）はここで回さない。正本は CI の結果で、それは上の readGithub が取っている。
// 使える道具：readText(相対パス) / readJson(相対パス) → { value, error } / run(cmd, args) / runJson(cmd, args)。
// readJson の error は alerts に入れて画面に出す（壊れた JSON を黙って「-」にしない）。
//
// portfolio では「公開サイト」の状態を出す。
//   ・本番（Vercel）に main の最新が反映されているか。Vercel が GitHub に残すデプロイ記録（environment=Production）を読む
//   ・public-profile の禁止語スキャン（npm run lint と同じ検査。1 秒未満で終わる）
//   ・コンテンツの件数（Projects / Systems / Articles）

const DEPLOY_WAIT_MIN = 15 // main に入ってからこの分数までは「反映待ち」とし、帯を出さない（Vercel のビルドは通常 1〜2 分）

/** ISO 日時を「9/27 12:19」の形にする（タイルの補足 1 行に収めるため） */
function shortTime(iso) {
  return new Date(iso).toLocaleString('ja-JP', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

/** public-profile の件数。Projects・Systems は 1 ファイル 1 件（src/content.config.ts の glob と同じ）、Articles は articles.json の配列の長さ */
function countContent(alerts) {
  const countMd = (dir) => {
    const p = path.join(ROOT, dir)
    return fs.existsSync(p) ? fs.readdirSync(p, { recursive: true }).filter((f) => String(f).endsWith('.md')).length : null
  }
  const articles = readJson('public-profile/articles.json')
  if (articles.error) alerts.push({ level: 'error', text: articles.error })
  return {
    projects: countMd('public-profile/projects'),
    systems: countMd('public-profile/systems'),
    articles: Array.isArray(articles.value) ? articles.value.length : null,
  }
}

/**
 * public-profile の禁止語スキャン。CLI の表示文言を読むのではなく、テストも使っている関数（loadRules / scanDirectory）を
 * 別プロセスで呼んで結果を JSON で受け取る（このファイルは同期処理で書かれているため、非同期の関数を直接呼ばない）
 */
function readScan() {
  const code =
    "import { loadRules, scanDirectory } from './scripts/check-public-profile.mjs'\n" +
    "const hits = await scanDirectory('public-profile', await loadRules())\n" +
    'console.log(JSON.stringify(hits.map(({ file, line, rule, matched }) => ({ file, line, rule, matched }))))'
  const r = runJson(process.execPath, ['--input-type=module', '-e', code])
  return Array.isArray(r.value) ? { hits: r.value, error: null } : { hits: null, error: r.error ?? '結果が配列でない' }
}

// GitHub 上の main の先端と、本番（Production）の最新のデプロイ記録を 1 回で取る問い合わせ（REST だと 3 回で約 4.5 秒かかるため GraphQL にまとめた）
const PRODUCTION_QUERY = `query($owner: String!, $name: String!) {
  repository(owner: $owner, name: $name) {
    ref(qualifiedName: "refs/heads/main") { target { ... on Commit { oid committedDate } } }
    deployments(environments: ["Production"], first: 1, orderBy: { field: CREATED_AT, direction: DESC }) {
      nodes { commitOid createdAt latestStatus { state logUrl environmentUrl } }
    }
  }
}`

/** main の先端と本番の最新のデプロイ記録・その状態を取る。gh が使えない・記録が無いときは error を入れて返す */
function readProduction() {
  const r = runJson('gh', ['api', 'graphql', '-F', 'owner={owner}', '-F', 'name={repo}', '-f', `query=${PRODUCTION_QUERY}`])
  if (!r.value) return { error: r.error }
  const repo = r.value.data?.repository
  const main = repo?.ref?.target
  const dep = repo?.deployments?.nodes?.[0]
  if (!main?.oid) return { error: 'main の先端を取得できず' }
  if (!dep) return { error: 'Production のデプロイ記録が無い' }
  return {
    error: null,
    mainSha: main.oid,
    mainDate: main.committedDate,
    sha: dep.commitOid,
    createdAt: dep.createdAt,
    // 状態の記録がまだ付いていなければ、始まる前とみなす。REST と同じ小文字にそろえる（SUCCESS → success）
    state: (dep.latestStatus?.state ?? 'pending').toLowerCase(),
    url: dep.latestStatus?.logUrl || dep.latestStatus?.environmentUrl || null,
  }
}

/** デプロイ記録をタイルの状態 1 つと、必要なら帯 1 本にする。main の先端と違うときは、main に入ってからの経過時間で「反映待ち」と「未反映」を分ける */
function productionStatus(p) {
  const tile = '本番（Vercel）'
  if (p.error) return { status: { kind: 'na', label: '取得できず', tile, sub: p.error }, alert: null }
  const sha = p.sha.slice(0, 7)
  const main = p.mainSha.slice(0, 7)
  if (['failure', 'error'].includes(p.state)) {
    return {
      status: { kind: 'bad', label: '失敗', tile, sub: `${sha} · ${shortTime(p.createdAt)}` },
      alert: { level: 'error', text: `本番のデプロイが失敗（${sha}）`, href: p.url },
    }
  }
  if (p.sha !== p.mainSha) {
    if ((Date.now() - Date.parse(p.mainDate)) / 60_000 < DEPLOY_WAIT_MIN) {
      return { status: { kind: 'run', label: '反映待ち', tile, sub: `main ${main} を待つ` }, alert: null }
    }
    return {
      status: { kind: 'warn', label: '未反映', tile, sub: `本番 ${sha} / main ${main}` },
      alert: { level: 'warn', text: `本番が main の最新（${main}）より古い（本番は ${sha}）` },
    }
  }
  if (p.state === 'success') return { status: { kind: 'good', label: '反映済み', tile, sub: `${sha} · ${shortTime(p.createdAt)}` }, alert: null }
  if (['pending', 'queued', 'in_progress', 'waiting'].includes(p.state)) {
    return { status: { kind: 'run', label: '反映中', tile, sub: `${sha} · ${shortTime(p.createdAt)}` }, alert: null }
  }
  return { status: { kind: 'warn', label: p.state, tile, sub: sha }, alert: { level: 'warn', text: `本番のデプロイが ${p.state}（${sha}）`, href: p.url } }
}

/** 「公開サイト」のカード（本番の反映・禁止語スキャン・件数）を、上の返す形に組み立てる */
function readProjectSpecific() {
  const alerts = []
  const output = []
  const counts = countContent(alerts)
  const scan = readScan()
  if (scan.error) {
    alerts.push({ level: 'error', text: `禁止語スキャンを実行できず（${scan.error}）` })
  } else if (scan.hits.length) {
    alerts.push({ level: 'error', text: `public-profile に禁止語が ${scan.hits.length} 件。書き直す（npm run lint で詳細）` })
    for (const h of scan.hits) output.push(`${h.file}:${h.line}  [${h.rule}] "${h.matched}"`)
  }
  const prod = productionStatus(readProduction())
  if (prod.alert) alerts.push(prod.alert)
  // 本番の URL は README.md 冒頭の「公開 URL：」が正本（ここに書き写さない）
  const site = (readText('README.md') ?? '').match(/^公開 URL：(\S+)/m)?.[1] ?? null
  return {
    title: '公開サイト',
    status: prod.status,
    stats: [
      { value: counts.projects ?? '-', label: 'プロジェクト' },
      { value: counts.systems ?? '-', label: '仕組み' },
      { value: counts.articles ?? '-', label: '記事' },
      { value: scan.hits ? scan.hits.length : '-', label: '禁止語ヒット' },
    ],
    note: site ? `本番 ${site}` : null,
    output,
    alerts,
    human: [],
  }
}

/** 上に出す注意。正本の状態から機械的に導く（人が書き足す欄ではない） */
function buildAlerts({ git, github, handoff, specific, todo, beads }) {
  const alerts = []
  const mainRun = github.runs.find((r) => r.branch === 'main')
  // 失敗は赤、中止は黄、成功・スキップは帯を出さない（画面のタイルと同じ区分）
  if (mainRun && mainRun.conclusion === 'cancelled') {
    alerts.push({ level: 'warn', text: 'main の CI が中止された', href: mainRun.url })
  } else if (mainRun && mainRun.conclusion && !['success', 'skipped', 'neutral'].includes(mainRun.conclusion)) {
    alerts.push({ level: 'error', text: `main の CI が ${mainRun.conclusion}`, href: mainRun.url })
  }
  for (const pr of github.openPrs) {
    if (pr.checks === 'failure') alerts.push({ level: 'error', text: `PR #${pr.number} の CI が失敗`, href: pr.url })
  }
  for (const a of specific?.alerts ?? []) alerts.push(a)
  if (handoff?.commitsSince != null && handoff.commitsSince >= 3) {
    alerts.push({ level: 'warn', text: `HANDOFF.md が ${handoff.commitsSince} コミット前の状態（引き継ぎが遅れている）` })
  }
  const human = beads.human.length + (todo?.askItems.length ?? 0) + (specific?.human?.length ?? 0)
  if (human > 0) alerts.push({ level: 'info', text: `人間の判断・作業待ちが ${human} 件` })
  if (git.dirty.length > 0) alerts.push({ level: 'info', text: `未コミットの変更 ${git.dirty.length} ファイル（${git.branch}）` })
  if (git.ahead > 0) alerts.push({ level: 'info', text: `未 push のコミット ${git.ahead} 件（${git.branch}）` })
  if (!github.available) alerts.push({ level: 'warn', text: `GitHub の情報を取得できず（${github.error}）` })
  if (!beads.available) alerts.push({ level: 'warn', text: `Beads の情報を取得できず（${beads.error}）` })
  return alerts
}

/** 全部を集めて 1 つの JSON にする */
export function collect() {
  const name = projectName()
  const todo = readTodo()
  const handoff = readHandoff()
  const git = readGit()
  const github = readGithub()
  const beads = readBeads(name)
  // portfolio の TODO.md は「確認待ち」の項目に付箋の ID を書く（例：「Beads ops-urz.9」）。その付箋が human として開いていれば
  // 同じ 1 件なので、Beads 側だけを残す（あなた待ちを二重に数えない）。ID は語として切り出して照合する（ops-urz.1 と ops-urz.10 を取り違えない）
  if (todo) {
    const ids = new Set(beads.human.map((b) => b.id))
    todo.askItems = todo.askItems.filter((a) => !(a.text.match(/[a-z][a-z0-9]*-[a-z0-9]+(?:\.\d+)*/gi) ?? []).some((id) => ids.has(id)))
  }
  const specific = readProjectSpecific()
  const decisions = readDecisions()
  return {
    generatedAt: new Date().toISOString(),
    project: { name, root: ROOT, repoUrl: github.repo?.url ?? null, visibility: github.repo?.visibility ?? null },
    alerts: buildAlerts({ git, github, handoff, specific, todo, beads }),
    todo,
    handoff,
    git,
    github: { available: github.available, error: github.error, openPrs: github.openPrs, runs: github.runs },
    beads,
    specific,
    decisions,
  }
}

function writeData(quiet) {
  const started = Date.now()
  const d = collect()
  // 一時ファイルに書いてから置き換える（配信中に読まれても書きかけの data.js を渡さない）
  fs.writeFileSync(OUT + '.tmp', `window.DASHBOARD_DATA = ${JSON.stringify(d, null, 2)}\n`)
  fs.renameSync(OUT + '.tmp', OUT)
  if (!quiet) {
    const t = d.todo?.total
    console.log(
      `${path.relative(ROOT, OUT)} を更新（${Date.now() - started} ms）: ` +
        `進捗 ${t ? `${t.done}/${t.total}` : '-'}、人間待ち ${d.beads.human.length + (d.todo?.askItems.length ?? 0) + (d.specific?.human?.length ?? 0)} 件、` +
        `注意 ${d.alerts.length} 件、ブランチ ${d.git.branch}`,
    )
  }
  return d
}

/**
 * 配信モード。/data.js は開くたびに作り直す（連続アクセスは 10 秒だけ結果を使い回す）。
 * 画面の「更新」ボタンは POST /update で、10 秒の使い回しを無視して必ず作り直す
 */
function serve({ host, port, quiet, open }) {
  let cache = { at: 0, body: '' }
  const regenerate = () => {
    writeData(quiet)
    cache = { at: Date.now(), body: fs.readFileSync(OUT, 'utf8') }
  }
  const server = http.createServer((req, res) => {
    const url = new URL(req.url, 'http://x')
    if (url.pathname === '/update' && req.method === 'POST') {
      try {
        regenerate()
        res.writeHead(200, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' })
        res.end(JSON.stringify({ ok: true, generatedAt: new Date(cache.at).toISOString() }))
      } catch (e) {
        res.writeHead(500, { 'content-type': 'application/json; charset=utf-8' })
        res.end(JSON.stringify({ ok: false, error: e.message }))
      }
      return
    }
    if (url.pathname === '/data.js') {
      if (Date.now() - cache.at > 10_000) {
        try {
          regenerate()
        } catch (e) {
          // 作り直しに失敗しても配信プロセスは落とさない。前回の data.js を返し、理由をターミナルに出す
          console.error(`data.js を作り直せませんでした: ${e.message}`)
          if (!cache.body && fs.existsSync(OUT)) cache = { at: 0, body: fs.readFileSync(OUT, 'utf8') }
        }
      }
      res.writeHead(200, { 'content-type': 'text/javascript; charset=utf-8', 'cache-control': 'no-store' })
      res.end(cache.body)
      return
    }
    const file = url.pathname === '/' ? 'index.html' : path.basename(url.pathname)
    const p = path.join(HERE, file)
    if (!fs.existsSync(p) || !fs.statSync(p).isFile()) {
      res.writeHead(404).end('not found')
      return
    }
    const type = file.endsWith('.html') ? 'text/html' : file.endsWith('.js') ? 'text/javascript' : 'text/plain'
    res.writeHead(200, { 'content-type': `${type}; charset=utf-8`, 'cache-control': 'no-store' })
    res.end(fs.readFileSync(p))
  })
  server.listen(port, host, () => {
    const url = `http://${host === '0.0.0.0' ? 'localhost' : host}:${port}/`
    console.log(`ダッシュボード: ${url}  （このまま起動しておく。終了は Ctrl+C）`)
    if (open) openBrowser(url)
  })
}

/** 既定のブラウザで URL を開く。WSL では Windows 側のブラウザを使う。開けなくても止めない */
function openBrowser(url) {
  const isWsl = /microsoft/i.test(fs.existsSync('/proc/version') ? fs.readFileSync('/proc/version', 'utf8') : '')
  const cmd =
    process.platform === 'win32' || isWsl
      ? ['cmd.exe', ['/c', 'start', '', url]]
      : process.platform === 'darwin'
        ? ['open', [url]]
        : ['xdg-open', [url]]
  const r = spawnSync(cmd[0], cmd[1], { stdio: 'ignore', timeout: 5_000 })
  if (r.error || r.status !== 0) console.log(`ブラウザを開けなかったので、上の URL を手で開いてください`)
}

// ---------- 入口 ----------
const argv = process.argv.slice(2)
const flag = (k, def) => {
  const i = argv.indexOf(k)
  return i >= 0 ? argv[i + 1] : def
}
const quiet = argv.includes('--quiet')
if (argv.includes('--serve')) {
  writeData(quiet)
  serve({ host: flag('--host', '127.0.0.1'), port: Number(flag('--port', '8787')), quiet, open: argv.includes('--open') })
} else {
  writeData(quiet)
}
