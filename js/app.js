/*
 * The notebook: a hash router over the chapter pages, problem pages, practice queues and
 * review. No framework: each page renders into <main id="app">.
 */
import { TOPICS, chapterStatus, getAligned, getLegacy, problemsFor, instantiate, findItem, allProblemIds } from '../data/course.js';
import { gradeProblem, isPass } from './grade.js';
import { grade, dueToday, dayKey, isLearned } from './srs.js';
import { load, save } from './store.js';

const app = document.getElementById('app');
const state = load();

/* ---------- helpers ---------- */

const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

/* Render text with $...$ maths. Plain parts are escaped. */
function tex(str, { display = false } = {}) {
  const parts = String(str).split(/(?<!\\)\$/);
  return parts
    .map((part, i) => {
      if (i % 2 === 0) return esc(part);
      try {
        if (window.katex) return window.katex.renderToString(part, { throwOnError: false, displayMode: display });
      } catch {
        /* fall through */
      }
      return `<code>${esc(part)}</code>`;
    })
    .join('');
}

const today = () => dayKey();

function logToday(field) {
  const k = today();
  state.log[k] = state.log[k] || { solved: 0, right: 0 };
  state.log[k][field] = (state.log[k][field] || 0) + 1;
}

function setPage(html, title) {
  app.innerHTML = html;
  document.title = title ? `${title} · Derivatives Notebook` : 'Derivatives Notebook';
  window.scrollTo(0, 0);
  const due = dueToday(allProblemIds(), state.cards, { cap: 999 }).length;
  const nav = document.getElementById('nav-review');
  if (nav) nav.textContent = due ? `复习 (${due})` : '复习';
}

const topic = no => TOPICS.find(t => t[0] === no);

function chapterProgress(no) {
  const items = problemsFor(no);
  const done = items.filter(i => state.cards[i.id]?.last).length;
  const learned = items.filter(i => isLearned(state.cards[i.id])).length;
  return { done, learned, total: items.length };
}

function notFound() {
  setPage(`<section class="empty"><h1>找不到这一页</h1><div class="cta-row"><a class="btn" href="#/">回到首页</a></div></section>`, '找不到');
}

/* ---------- home ---------- */

function home() {
  const aligned = TOPICS.filter(([no]) => chapterStatus(no) === 'aligned');
  const alignedProblems = aligned.reduce((n, [no]) => n + problemsFor(no).length, 0);
  const dueCount = dueToday(allProblemIds(), state.cards, { cap: 999 }).length;
  const practised = Object.keys(state.log).filter(k => state.log[k].solved > 0).length;

  const rows = TOPICS.map(([no, en, zh]) => {
    const st = chapterStatus(no);
    const p = chapterProgress(no);
    const badge =
      st === 'aligned'
        ? '<span class="badge ok">按教材</span>'
        : st === 'pending'
          ? '<span class="badge warn">待对齐</span>'
          : '<span class="badge">待编写</span>';
    const note =
      st === 'todo'
        ? '还没有内容'
        : p.total
          ? `已练 ${p.done}/${p.total} 题`
          : '';
    const href = st === 'todo' ? '#/' : `#/ch/${no}`;
    return `
      <a class="lesson-card ${st === 'todo' ? 'muted' : ''}" href="${href}">
        <span class="no">${String(no).padStart(2, '0')}</span>
        <span class="card-body">
          <span class="card-title">${esc(zh)} ${badge}</span>
          <span class="card-en">${esc(en)} · Hull ${no}</span>
          <span class="card-note">${note}</span>
        </span>
      </a>`;
  }).join('');

  setPage(
    `
    <section class="hero">
      <p class="kicker">按 Hull《Options, Futures and Other Derivatives》（第 7 版）的章节顺序</p>
      <h1>跟着教材，<em>一章一章</em>学衍生品</h1>
      <p class="lede">每章的小节顺序、例子和课后习题都对照教材。你直接输入答案，系统会批改：数字看对错，文字答案看要点，并告诉你缺了什么、为什么不对。换一种说法不会被判错。</p>
      <div class="stats">
        <div><b>${aligned.length}</b><span>章已对齐</span></div>
        <div><b>${alignedProblems}</b><span>道教材题</span></div>
        <div><b>${practised}</b><span>练习过的天数</span></div>
        <div><b>${dueCount}</b><span>今天待复习</span></div>
      </div>
      <div class="cta-row">
        ${dueCount ? `<a class="btn primary" href="#/review">今天的复习 · ${dueCount} 题</a>` : ''}
        <a class="btn" href="#/ch/1">从第 1 章开始</a>
      </div>
    </section>
    <section>
      <h2 class="section-title">章节目录</h2>
      <p class="lede small">"按教材"的章节已经逐节对照；"待对齐"的章节是早期版本的内容，还没有按教材重写，会在之后逐章替换。</p>
      <div class="lesson-list">${rows}</div>
    </section>`,
    '首页',
  );
}

/* ---------- aligned chapter ---------- */

function chapterPage(no) {
  const t = topic(no);
  if (!t) return notFound();
  const aligned = getAligned(no);
  if (!aligned) return legacyChapterPage(no);

  const sections = aligned.sections
    .map(
      s => `
      <section class="block" id="s${s.id.replace('.', '-')}">
        <h2><span class="sec-no">${esc(s.id)}</span> ${esc(s.zh)} <span class="en-inline">${esc(s.en)}</span></h2>
        ${s.body.map(p => `<p>${tex(p)}</p>`).join('')}
        ${(s.examples || [])
          .map(
            ex => `
          <div class="example">
            <p class="ex-title">例：${esc(ex.title)}</p>
            <ol class="steps">${ex.steps.map(x => `<li>${tex(x)}</li>`).join('')}</ol>
          </div>`,
          )
          .join('')}
      </section>`,
    )
    .join('');

  const probs = aligned.problems
    .map(
      p => `
      <li class="prob-row">
        <a href="#/problem/${p.id}"><span class="prob-no">${esc(p.no)}</span><span class="prob-q">${tex(p.q)}</span></a>
      </li>`,
    )
    .join('');

  const p = chapterProgress(no);
  setPage(
    `
    <nav class="crumb"><a href="#/">首页</a> / 第 ${no} 章</nav>
    <article class="lesson">
      <p class="kicker">${esc(t[1])} · Hull Chapter ${no} · 按教材对齐</p>
      <h1>${esc(aligned.zh)}</h1>
      <p class="en">${esc(aligned.en)}</p>
      <nav class="toc">${aligned.sections.map(s => `<a href="#s${s.id.replace('.', '-')}">${esc(s.id)} ${esc(s.zh)}</a>`).join('')}</nav>
      ${sections}
      <section class="block">
        <h2>课后习题</h2>
        <p class="lede small">题号与教材相同。已练 ${p.done}/${p.total} 题。</p>
        <div class="cta-row"><a class="btn primary" href="#/practice/${no}">按顺序练习本章</a></div>
        <ol class="prob-list">${probs}</ol>
      </section>
      ${pager(no)}
    </article>`,
    aligned.zh,
  );
}

function pager(no) {
  const prev = TOPICS.find(([n]) => n === no - 1);
  const next = TOPICS.find(([n]) => n === no + 1);
  return `
    <nav class="pager">
      ${prev ? `<a href="#/ch/${prev[0]}">← 第 ${prev[0]} 章 ${esc(prev[2])}</a>` : '<span></span>'}
      ${next ? `<a href="#/ch/${next[0]}">第 ${next[0]} 章 ${esc(next[2])} →</a>` : '<span></span>'}
    </nav>`;
}

/* ---------- pending (legacy) chapter ---------- */

function legacyChapterPage(no) {
  const t = topic(no);
  const lessons = getLegacy(no);
  const body = lessons
    .map(
      l => `
      <section class="block">
        <h2>${esc(l.zh)} <span class="en-inline">${esc(l.en)}</span></h2>
        ${l.intro.map(x => `<p>${tex(x)}</p>`).join('')}
        <div class="example">
          <p class="ex-title">例：${esc(l.example().title)}</p>
          <ol class="steps">${l.example().steps.map(x => `<li>${tex(x)}</li>`).join('')}</ol>
        </div>
      </section>`,
    )
    .join('');
  setPage(
    `
    <nav class="crumb"><a href="#/">首页</a> / 第 ${no} 章</nav>
    <article class="lesson">
      <p class="kicker">Hull Chapter ${no}</p>
      <h1>${esc(t[2])}</h1>
      <p class="en">${esc(t[1])}</p>
      <div class="notice">这一章还是早期版本的内容，没有按教材的小节和习题重写。下面的练习是早期生成的题，仍然可以用来练习。</div>
      ${body || '<p>这一章还没有内容。</p>'}
      <section class="block">
        <h2>练习</h2>
        <div class="cta-row"><a class="btn primary" href="#/practice/${no}">开始练习</a></div>
      </section>
      ${pager(no)}
    </article>`,
    t[2],
  );
}

/* ---------- problems ---------- */

/*
 * Render one problem and wire up its answer controls. The problem is fixed for the whole
 * view, so a retry asks the same question. Only the first answer in a view is recorded for
 * spaced review; retries are for practice.
 */
function problemView({ item, backHref, backLabel, nextHref, nextLabel, sessionTitle }) {
  const problem = instantiate(item);
  const isChoice = problem.kind === 'choice';
  const isShort = problem.kind === 'short';
  let recorded = false;

  const answerHtml = isChoice
    ? `<div class="options">${problem.options.map((o, k) => `<button class="option" data-k="${k}">${tex(o)}</button>`).join('')}</div>`
    : isShort
      ? `<div class="written">
           <textarea id="ans" rows="4" placeholder="用你自己的话写：先说结论，再说理由。"></textarea>
           <div class="cta-row"><button class="btn primary" id="submit">提交批改</button></div>
         </div>`
      : `<div class="numeric">
           <input id="ans" type="text" inputmode="decimal" autocomplete="off" placeholder="输入数字${problem.unit ? '（' + esc(problem.unit) + '）' : ''}">
           <button class="btn primary" id="submit">提交</button>
         </div>`;

  const meta = item.fixed ? `教材第 ${esc(item.no)} 题 · 第 ${esc(item.sec || '')} 节` : '练习题';

  setPage(
    `
    <nav class="crumb"><a href="${backHref}">← ${esc(backLabel)}</a>${sessionTitle ? ' · ' + esc(sessionTitle) : ''}</nav>
    <section class="drill">
      <p class="progress">${meta}</p>
      <p class="q">${tex(problem.q)}</p>
      <div id="answer-area">${answerHtml}</div>
      <p class="skip-row"><button class="link" id="skip">我不会，看解法</button></p>
      <div id="feedback" class="feedback" hidden></div>
      <div id="next-area"></div>
    </section>`,
    item.id,
  );

  const modelOf = () => (isChoice ? problem.options[problem.answer] : isShort ? problem.rubric.model : `${problem.answer}${problem.unit ? ' ' + problem.unit : ''}`);

  /* Show the verdict, the reasons, the reference answer and the working. */
  function show(result, { revealed = false } = {}) {
    const fb = document.getElementById('feedback');
    const label = revealed
      ? '解法如下'
      : { correct: '正确 ✓', partial: '部分正确', wrong: '不对', invalid: '还没有给出答案' }[result.verdict];
    const cls = revealed ? 'bad' : result.verdict === 'correct' ? 'ok' : result.verdict === 'partial' ? 'partial' : 'bad';
    const items = result.feedback || [];
    const showModel = revealed || result.verdict !== 'correct';

    fb.hidden = false;
    fb.className = `feedback ${cls}`;
    fb.innerHTML = `
      <p class="verdict">${label}</p>
      ${items.length ? `<ul class="fb-list">${items.map(x => `<li>${tex(x)}</li>`).join('')}</ul>` : ''}
      ${showModel ? `<p class="model"><b>参考答案：</b>${tex(modelOf())}</p>` : ''}
      <div class="why"><p class="why-title">解题过程</p><p>${tex(problem.why || '')}</p></div>`;
    document.getElementById('skip')?.remove();
    document.getElementById('next-area').innerHTML = `<div class="cta-row">
      ${nextHref ? `<a class="btn primary" href="${nextHref}">${esc(nextLabel || '下一题')} →</a>` : `<a class="btn primary" href="${backHref}">完成，返回</a>`}
    </div>`;
  }

  /* Record once per view. Retries are allowed but do not change the review schedule. */
  function record(ok) {
    if (recorded) return;
    recorded = true;
    state.cards[item.id] = grade(state.cards[item.id], ok, today());
    logToday('solved');
    if (ok) logToday('right');
    save(state);
  }

  function lock() {
    app.querySelectorAll('.option').forEach(b => (b.disabled = true));
    document.getElementById('ans')?.setAttribute('disabled', 'disabled');
    document.getElementById('submit')?.setAttribute('disabled', 'disabled');
  }

  function retry() {
    document.getElementById('feedback').hidden = true;
    document.getElementById('next-area').innerHTML = '';
    app.querySelectorAll('.option').forEach(b => {
      b.disabled = false;
      b.classList.remove('right', 'wrong');
    });
    const input = document.getElementById('ans');
    if (input) {
      input.removeAttribute('disabled');
      input.value = '';
      input.focus();
    }
    document.getElementById('submit')?.removeAttribute('disabled');
  }

  function answerChoice(k) {
    const result = gradeProblem(problem, k);
    record(isPass(result));
    app.querySelectorAll('.option').forEach((b, j) => {
      if (j === problem.answer) b.classList.add('right');
      else if (j === k) b.classList.add('wrong');
    });
    lock();
    show(result);
    addRetry();
  }

  function answerText() {
    const input = document.getElementById('ans');
    const raw = input.value;
    if (!raw.trim()) return;
    const result = gradeProblem(problem, raw);
    if (result.verdict === 'invalid') {
      show(result);
      return;
    }
    record(isPass(result));
    lock();
    show(result);
    addRetry();
  }

  function addRetry() {
    const row = document.querySelector('#next-area .cta-row');
    if (!row) return;
    const b = document.createElement('button');
    b.className = 'btn';
    b.id = 'retry-btn';
    b.textContent = '再试一次（不计入复习）';
    b.onclick = retry;
    row.prepend(b);
  }

  function reveal() {
    const result = { verdict: 'wrong', feedback: [], model: modelOf() };
    record(false);
    if (isChoice) app.querySelectorAll('.option').forEach((b, j) => j === problem.answer && b.classList.add('right'));
    lock();
    show(result, { revealed: true });
    addRetry();
  }

  if (isChoice) {
    app.querySelectorAll('.option').forEach(btn => {
      btn.onclick = () => answerChoice(Number(btn.dataset.k));
    });
  } else {
    const input = document.getElementById('ans');
    document.getElementById('submit').onclick = answerText;
    if (!isShort) input.addEventListener('keydown', e => e.key === 'Enter' && answerText());
    input.focus();
  }
  document.getElementById('skip').onclick = reveal;
}

function problemPage(id) {
  const item = findItem(id);
  if (!item) return notFound();
  const ordered = problemsFor(item.chapter);
  const i = ordered.findIndex(p => p.id === id);
  const next = ordered[i + 1];
  problemView({
    item,
    backHref: `#/ch/${item.chapter}`,
    backLabel: `第 ${item.chapter} 章`,
    nextHref: next ? `#/problem/${next.id}` : null,
    nextLabel: '下一题',
  });
}

/* Practice queue over a chapter: unseen first, then the rest. Each step is a route, so back works. */
function practicePage(no) {
  const t = topic(no);
  if (!t) return notFound();
  const items = problemsFor(no);
  const unseen = items.filter(p => !state.cards[p.id]);
  const seen = items.filter(p => state.cards[p.id]);
  const queue = [...unseen, ...seen];
  if (!queue.length) {
    setPage(`<section class="empty"><h1>这一章还没有题</h1><div class="cta-row"><a class="btn" href="#/ch/${no}">返回</a></div></section>`, '练习');
    return;
  }
  const first = queue[0];
  problemView({
    item: first,
    backHref: `#/ch/${no}`,
    backLabel: `第 ${no} 章`,
    nextHref: queue[1] ? `#/practice/${no}/${queue[1].id}` : null,
    nextLabel: '下一题',
    sessionTitle: `练习 · 第 ${no} 章 ${t[2]}`,
  });
}

function practiceAt(no, id) {
  const t = topic(no);
  if (!t) return notFound();
  const items = problemsFor(no);
  const unseen = items.filter(p => !state.cards[p.id]);
  const seen = items.filter(p => state.cards[p.id]);
  const queue = [...unseen, ...seen];
  const item = items.find(p => p.id === id) || queue[0];
  const k = queue.findIndex(p => p.id === item.id);
  problemView({
    item,
    backHref: `#/ch/${no}`,
    backLabel: `第 ${no} 章`,
    nextHref: queue[k + 1] ? `#/practice/${no}/${queue[k + 1].id}` : null,
    nextLabel: '下一题',
    sessionTitle: `练习 · 第 ${no} 章 ${t[2]}`,
  });
}

function reviewPage(startId) {
  const due = dueToday(allProblemIds(), state.cards, { cap: 30 });
  const ids = startId && due.includes(startId) ? [startId, ...due.filter(x => x !== startId)] : due;
  if (!ids.length) {
    setPage(`<section class="empty"><p class="kicker">今天的复习</p><h1>今天没有要复习的题</h1><p>答对的题会隔得越来越久，答错的会明天再来。</p><div class="cta-row"><a class="btn" href="#/">返回首页</a></div></section>`, '复习');
    return;
  }
  const item = findItem(ids[0]);
  problemView({
    item,
    backHref: '#/',
    backLabel: '首页',
    nextHref: ids[1] ? `#/review/${ids[1]}` : null,
    nextLabel: '下一题',
    sessionTitle: '今天的复习',
  });
}

function formulasPage() {
  const blocks = TOPICS.map(([no]) => {
    const a = getAligned(no);
    const legacy = getLegacy(no);
    const formulas = [...(legacy.flatMap(l => l.formulas))];
    if (!formulas.length) return '';
    return `<section class="block"><h2>第 ${no} 章 · ${esc(topic(no)[2])}</h2>
      <div class="formulas">${formulas
        .map(f => `<figure class="formula"><div class="math">${tex(`$${f.tex}$`, { display: true })}</div><figcaption>${esc(f.zh)}</figcaption></figure>`)
        .join('')}</div></section>`;
  }).join('');
  setPage(`<nav class="crumb"><a href="#/">首页</a> / 公式表</nav><h1>公式表</h1><p class="lede">按章节列出。公式会随章节对齐而补充。</p>${blocks}`, '公式表');
}

/* ---------- router ---------- */

function route() {
  const parts = (location.hash || '#/').replace(/^#\/?/, '').split('/').filter(Boolean);
  const [page, a, b] = parts;
  if (!page) return home();
  if (page === 'ch') return chapterPage(Number(a));
  if (page === 'problem') return problemPage(a);
  if (page === 'practice') return b ? practiceAt(Number(a), b) : practicePage(Number(a));
  if (page === 'review') return reviewPage(a);
  if (page === 'formulas') return formulasPage();
  return notFound();
}

window.addEventListener('hashchange', route);
route();
