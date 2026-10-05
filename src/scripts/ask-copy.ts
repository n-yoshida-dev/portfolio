// 「Gemini（コピーして貼り付け）」のコピー（ブラウザで動く。SPEC.md §3）。入口のメニュー（AskEntry.astro）と /ask の両方が読み込む。
// Gemini は URL でプロンプトを渡せず、サイトの URL も読みに行けないので、プロンプトの後ろにサイトの全文（data-ask-source）をつないで写す。
// 全文は、入口にマウスを乗せた・メニューを開いた・/ask を開いた時点で先に読み込み、押した瞬間に写せるようにする
// （押してから読み込むと、Gemini の新しいタブに移ったあとで写すことになり、ブラウザに拒まれうるため）。

/** 読み込んだ全文（URL → 本文の Promise）。同じ全文を何度も読みに行かない */
const sources = new Map<string, Promise<string>>();
/** 読み込み終わった全文（URL → 本文）。押した瞬間にこれがあれば、待たずに写す */
const loaded = new Map<string, string>();

/** 全文を読み込む。失敗したら次に押したときにもう一度読みに行く */
function load(url: string): Promise<string> {
  let text = sources.get(url);
  if (!text) {
    text = fetch(url).then((res) => {
      if (!res.ok) throw new Error(`${url} を読めません（${res.status}）`);
      return res.text();
    });
    text.then(
      (body) => loaded.set(url, body),
      () => sources.delete(url),
    );
    sources.set(url, text);
  }
  return text;
}

/** プロンプトと全文を「---」の行でつなぐ（プロンプトにも同じ区切りの説明がある。src/lib/ask.ts） */
function joined(prompt: string, body: string): string {
  return `${prompt}\n\n---\n\n${body}`;
}

/** リンク 1 つのコピー。読み込み済みならその場で写し、まだなら読み込みを待つ写し方（ClipboardItem に Promise を渡す）にする */
function copy(prompt: string, source: string | undefined): Promise<void> {
  if (!source) return navigator.clipboard.writeText(prompt);
  const body = loaded.get(source);
  if (body !== undefined) return navigator.clipboard.writeText(joined(prompt, body));
  if (typeof ClipboardItem !== 'undefined' && navigator.clipboard.write) {
    const blob = load(source).then(
      (text) => new Blob([joined(prompt, text)], { type: 'text/plain' }),
    );
    return navigator.clipboard.write([new ClipboardItem({ 'text/plain': blob })]);
  }
  return load(source).then((text) => navigator.clipboard.writeText(joined(prompt, text)));
}

for (const link of document.querySelectorAll<HTMLAnchorElement>('a[data-ask-copy]')) {
  const original = link.textContent ?? '';
  const source = link.dataset.askSource;
  const prefetch = () => {
    if (source) load(source).catch((error) => console.error(error));
  };
  // 入口にマウスを乗せた・フォーカスした・メニューを開いたときに先読みする。/ask ではリンクが最初から見えているので、すぐ先読みする
  const entry = link.closest('.ask-entry');
  if (entry) {
    entry.addEventListener('pointerenter', prefetch, { once: true });
    entry.addEventListener('focusin', prefetch, { once: true });
    entry.querySelector('[popover]')?.addEventListener('toggle', prefetch, { once: true });
  } else {
    prefetch();
  }

  const fail = (error: unknown) => {
    console.error('プロンプトをコピーできませんでした', error);
    // 入口のメニューでは /ask を案内し、/ask ではページのプロンプト枠を案内する
    link.textContent = entry
      ? 'コピーできませんでした。/ask でコピーしてください'
      : 'コピーできませんでした。上のプロンプトをコピーしてください';
  };
  link.addEventListener('click', () => {
    try {
      copy(link.dataset.askCopy ?? '', source)
        .then(() => {
          link.textContent = 'コピーしました。Gemini に貼り付けてください';
          setTimeout(() => (link.textContent = original), 4000);
        })
        .catch(fail);
    } catch (error) {
      // navigator.clipboard が無い環境（http で開いたときなど）はここに来る
      fail(error);
    }
  });
}
