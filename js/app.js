/*
 * The notebook: a hash router over four pages (home, lesson, practice, review) plus the
 * formula sheet. No framework: each page renders into <main id="app">.
 */
import { lessons, lessonById, allDrills } from '../data/lessons.js';
import { rng, shuffleChoice, isCorrect } from '../js/drill.js';
import { grade, dueToday, dayKey, isLearned } from '../js/srs.js';
import { load, save } from '../js/store.js';

const app = document.getElementById('app');
const state = load();
const drills = allDrills();
const drillById = Object.fromEntries(drills.map(d => [d.id, d]));

/* ---------- helpers ---------- */

const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

/* Render text with $...$ maths. Our own content only; plain text is escaped. */
function tex(str, { display = false } = {}) {
  const parts = String(str).split(/(?<!\\)\$/);
  return parts
    .map((part, i) => {
      if (i % 2 === 0) return esc(part);
      try {
        if (window.katex) {
          return window.katex.renderToString(part.replace(/\\\$/g, '$'), { throwOnError: false, displayMode: display });
        }
      } catch {
        /* fall through to plain text */
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

function lessonProgress(lesson) {
  const done = lesson.drills.filter(d => state.cards[d.id]?.last).length;
  const learned = lesson.drills.filter(d => isLearned(state.cards[d.id])).length;
  return { done, learned, total: lesson.drills.length };
}

function setPage(html, title) {
  app.innerHTML = html;
  document.title = title ? `${title} · Derivatives Notebook` : 'Derivatives Notebook';
  window.scrollTo(0, 0);
  const due = dueToday(drills.map(d => d.id), state.cards, { cap: 999 }).length;
  const nav = document.getElementById('nav-review');
  if (nav) nav.textContent = due ? `复习 (${due})` : '复习';
}

/* ---------- pages ---------- */

function home() {
  const started = lessons.filter(l => lessonProgress(l).done > 0).length;
  const cards = lessons
    .map(l => {
      const p = lessonProgress(l);
      const pct = Math.round((p.learned / p.total) * 100);
      return `
        <a class="lesson-card" href="#/lesson/${l.id}">
          <span class="no">${String(l.no).padStart(2, '0')}</span>
          <span class="card-body">
            <span class="card-title">${esc(l.zh)}</span>
            <span class="card-en">${esc(l.en)} · ${esc(l.ref)}</span>
            <span class="meter" aria-label="掌握 ${pct}%"><span style="width:${pct}%"></span></span>
            <span class="card-note">${p.done ? `已练 ${p.done}/${p.total} 题 · 掌握 ${p.learned}` : `未开始 · ${p.total} 题`}</span>
          </span>
        </a>`;
    })
    .join('');
  const dueCount = dueToday(drills.map(d => d.id), state.cards, { cap: 999 }).length;
  const streakDays = Object.keys(state.log).filter(k => state.log[k].solved > 0).length;

  setPage(
    `
    <section class="hero">
      <p class="kicker">从零开始 · 不需要基础</p>
      <h1>一步一步，把衍生品<em>看懂</em>、算出来</h1>
      <p class="lede">每课先讲清楚一个想法，再用一个例子跟着做，最后做几道题。错了也没关系：题目会按记忆曲线（spaced repetition）在合适的时候再回来。</p>
      <div class="stats">
        <div><b>${lessons.length}</b><span>课</span></div>
        <div><b>${drills.length}</b><span>练习题型</span></div>
        <div><b>${started}</b><span>已开始</span></div>
        <div><b>${streakDays}</b><span>练习过的天数</span></div>
      </div>
      <div class="cta-row">
        ${dueCount ? `<a class="btn primary" href="#/review">今天的复习 · ${dueCount} 题</a>` : ''}
        <a class="btn" href="#/lesson/${lessons[0].id}">从第 1 课开始</a>
      </div>
    </section>
    <section>
      <h2 class="section-title">课程目录</h2>
      <div class="lesson-list">${cards}</div>
    </section>
    <section class="howto">
      <h2 class="section-title">怎么用这个笔记</h2>
      <ol>
        <li><b>读要点</b>：每课的"核心想法"只有几句，先读懂直觉。</li>
        <li><b>跟着例子算</b>：例子里每一步都写了为什么。</li>
        <li><b>做练习</b>：选择题选一个答案；计算题直接输入数字（不用计算器也能估算的题目，已经尽量设计成这样）。</li>
        <li><b>回头复习</b>：答错的题会明天再出现，答对的会隔得越来越久。</li>
      </ol>
    </section>`,
    '首页',
  );
}

function lessonPage(id) {
  const l = lessonById(id);
  if (!l) return notFound();
  const i = lessons.indexOf(l);
  const prev = lessons[i - 1];
  const next = lessons[i + 1];
  const p = lessonProgress(l);
  const ex = l.example();

  setPage(
    `
    <nav class="crumb"><a href="#/">首页</a> / 第 ${l.no} 课</nav>
    <article class="lesson">
      <p class="kicker">${esc(l.ref)}</p>
      <h1>${esc(l.zh)}</h1>
      <p class="en">${esc(l.en)}</p>

      <section class="block">
        <h2>1. 核心想法</h2>
        ${l.intro.map(t => `<p>${tex(t)}</p>`).join('')}
      </section>

      ${
        l.keyIdeas.length
          ? `<section class="block note">
        <h2>要记住的</h2>
        <ul>${l.keyIdeas.map(t => `<li>${tex(t)}</li>`).join('')}</ul>
      </section>`
          : ''
      }

      ${
        l.formulas.length
          ? `<section class="block">
        <h2>2. 公式</h2>
        <div class="formulas">
          ${l.formulas
            .map(f => `<figure class="formula"><div class="math">${tex(`$${f.tex}$`, { display: true })}</div><figcaption>${esc(f.zh)}</figcaption></figure>`)
            .join('')}
        </div>
      </section>`
          : ''
      }

      <section class="block example">
        <h2>3. 跟着做：${esc(ex.title)}</h2>
        <ol class="steps">${ex.steps.map(s => `<li>${tex(s)}</li>`).join('')}</ol>
      </section>

      <section class="block practice-cta">
        <h2>4. 练习</h2>
        <p>本课共 ${p.total} 道题型，每次出的数字都不一样。${p.done ? `你已经练过 ${p.done} 道。` : ''}</p>
        <div class="cta-row">
          <a class="btn primary" href="#/practice/${l.id}">开始练习</a>
        </div>
      </section>

      <nav class="pager">
        ${prev ? `<a href="#/lesson/${prev.id}">← ${esc(prev.zh)}</a>` : '<span></span>'}
        ${next ? `<a href="#/lesson/${next.id}">${esc(next.zh)} →</a>` : '<span></span>'}
      </nav>
    </article>`,
    l.zh,
  );
  state.lessons[l.id] = { ...(state.lessons[l.id] || {}), seen: true };
  save(state);
}

/* A practice session over one lesson (or the review queue). `queue` is a list of drill ids. */
function practice({ queue, title, back, label }) {
  if (!queue.length) {
    setPage(
      `<section class="empty"><p class="kicker">${esc(label)}</p><h1>这里没有题了</h1>
       <p>${back.kind === 'review' ? '今天的复习已经做完，明天会有新的题。' : '这一课的题都练过了，可以去看下一课。'}</p>
       <div class="cta-row"><a class="btn" href="${back.href}">返回</a></div></section>`,
      title,
    );
    return;
  }
  const id = queue[0];
  const drill = drillById[id];
  const raw = drill.gen(rng(Math.floor(Math.random() * 2 ** 31)));
  const problem = raw.kind === 'choice' ? shuffleChoice(raw, rng(Math.floor(Math.random() * 2 ** 31))) : raw;
  const isChoice = problem.kind === 'choice';

  const body = isChoice
    ? `<div class="options">${problem.options
        .map((o, k) => `<button class="option" data-k="${k}">${tex(o)}</button>`)
        .join('')}</div>`
    : `<div class="numeric">
         <input id="ans" type="text" inputmode="decimal" autocomplete="off" placeholder="输入数字${problem.unit ? '（' + esc(problem.unit) + '）' : ''}">
         <button class="btn primary" id="submit">提交</button>
       </div>`;

  setPage(
    `
    <nav class="crumb"><a href="${back.href}">← ${esc(back.label)}</a> · ${esc(label)}</nav>
    <section class="drill">
      <p class="progress">剩 ${queue.length} 题</p>
      <p class="q">${tex(problem.q)}</p>
      <div id="answer-area">${body}</div>
      <p class="skip-row"><button class="link" id="skip">我不会，看解法</button></p>
      <div id="feedback" class="feedback" hidden></div>
      <div id="next-area"></div>
    </section>`,
    title,
  );

  const finish = (ok, revealed) => {
    const card = grade(state.cards[id], ok && !revealed, today());
    state.cards[id] = card;
    logToday('solved');
    if (ok) logToday('right');
    save(state);
    const correctText = isChoice ? problem.options[problem.answer] : `${problem.answer}${problem.unit ? ' ' + problem.unit : ''}`;
    document.getElementById('skip')?.remove();
    const fb = document.getElementById('feedback');
    fb.hidden = false;
    fb.className = `feedback ${ok ? 'ok' : 'bad'}`;
    fb.innerHTML = `<p class="verdict">${ok ? '答对了 ✓' : '正确答案是：' + tex(correctText)}</p>
      <div class="why"><p class="why-title">解题过程</p><p>${tex(problem.why)}</p></div>`;
    document.getElementById('answer-area').querySelectorAll('button,input').forEach(el => (el.disabled = true));
    document.getElementById('next-area').innerHTML = `
      <div class="cta-row"><button class="btn primary" id="next">${queue.length > 1 ? '下一题' : '完成'}</button></div>`;
    document.getElementById('next').onclick = () => practice({ queue: queue.slice(1), title, back, label });
  };

  document.getElementById('skip').onclick = () => {
    if (isChoice) app.querySelectorAll('.option').forEach((b, j) => j === problem.answer && b.classList.add('right'));
    finish(false, true);
  };

  if (isChoice) {
    app.querySelectorAll('.option').forEach(btn => {
      btn.onclick = () => {
        const k = Number(btn.dataset.k);
        const ok = isCorrect(problem, k);
        app.querySelectorAll('.option').forEach((b, j) => {
          if (j === problem.answer) b.classList.add('right');
          else if (j === k) b.classList.add('wrong');
        });
        finish(ok, false);
      };
    });
  } else {
    const input = document.getElementById('ans');
    const submit = () => {
      if (!input.value.trim()) return;
      finish(isCorrect(problem, input.value), false);
    };
    document.getElementById('submit').onclick = submit;
    input.addEventListener('keydown', e => e.key === 'Enter' && submit());
    input.focus();
  }
}

function practicePage(lessonId) {
  const l = lessonById(lessonId);
  if (!l) return notFound();
  // Start with drills not yet tried, then the rest, in order.
  const ids = l.drills.map(d => d.id);
  const queue = [...ids.filter(id => !state.cards[id]), ...ids.filter(id => state.cards[id])];
  practice({
    queue,
    title: `练习 · ${l.zh}`,
    back: { href: `#/lesson/${l.id}`, label: '回到本课', kind: 'lesson' },
    label: `第 ${l.no} 课 · ${l.zh}`,
  });
}

function reviewPage() {
  const queue = dueToday(drills.map(d => d.id), state.cards, { cap: 30 });
  practice({
    queue,
    title: '今天的复习',
    back: { href: '#/', label: '首页', kind: 'review' },
    label: '今天的复习',
  });
}

function formulasPage() {
  const sections = lessons
    .filter(l => l.formulas.length)
    .map(
      l => `
      <section class="block">
        <h2>第 ${l.no} 课 · ${esc(l.zh)}</h2>
        <div class="formulas">
          ${l.formulas
            .map(f => `<figure class="formula"><div class="math">${tex(`$${f.tex}$`, { display: true })}</div><figcaption>${esc(f.zh)}</figcaption></figure>`)
            .join('')}
        </div>
      </section>`,
    )
    .join('');
  setPage(`<nav class="crumb"><a href="#/">首页</a> / 公式表</nav><h1>公式表</h1><p class="lede">按课程顺序列出所有公式。每个公式的含义写在下面，先读懂再套用。</p>${sections}`, '公式表');
}

function notFound() {
  setPage(`<section class="empty"><h1>找不到这一页</h1><div class="cta-row"><a class="btn" href="#/">回到首页</a></div></section>`, '找不到');
}

/* ---------- router ---------- */

function route() {
  const parts = (location.hash || '#/').replace(/^#\/?/, '').split('/').filter(Boolean);
  const [page, arg] = parts;
  if (!page) return home();
  if (page === 'lesson') return lessonPage(arg);
  if (page === 'practice') return practicePage(arg);
  if (page === 'review') return reviewPage();
  if (page === 'formulas') return formulasPage();
  return notFound();
}

window.addEventListener('hashchange', route);
route();
