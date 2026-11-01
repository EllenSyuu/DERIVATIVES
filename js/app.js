/*
 * Derivatives Notebook: a hash router over the home page, chapter pages, problem sheets,
 * the review queue and the formula book. Markup and classes follow FM Notebook, so both
 * notebooks share one stylesheet (css/style.css) and look like the same atelier.
 */
import { TOPICS, PARTS, topic, partOf, getChapter, problemsFor, instantiate, findItem, allProblemIds, totalProblems } from '../data/course.js';
import { gradeProblem, isPass } from './grade.js';
import { grade, dueToday, dayKey, addDays, isLearned, MAX_BOX, LEARNED_BOX } from './srs.js';
import { load, save } from './store.js';
import { heroPlate } from './plates.js';
import { tickMark, crossMark, monthSketch, startBirds } from './art.js';

const app = document.getElementById('app');
const S = load();
const persist = () => save(S);
const today = () => dayKey();

/* ---------------------------------------------------------------- helpers */

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const plain = s => String(s ?? '').replace(/\$[^$]*\$/g, '').trim();

function K(tex, display = false) {
  try {
    if (window.katex) return window.katex.renderToString(tex, { throwOnError: false, displayMode: display, strict: 'ignore' });
  } catch {
    /* fall through */
  }
  return `<code>${esc(tex)}</code>`;
}

/* Text with $…$ maths. */
const rich = str =>
  String(str ?? '')
    .split(/(?<!\\)\$/)
    .map((part, i) => (i % 2 ? K(part) : esc(part)))
    .join('');

const roman = n => ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'][n] || String(n);

function setView(name, title) {
  document.body.dataset.view = name;
  document.title = title ? `${plain(title)} · Derivatives Notebook` : 'Derivatives Notebook · Hull, one chapter at a time';
  window.scrollTo(0, 0);
  const due = dueIds().length;
  const nav = document.getElementById('nav-review');
  if (nav) nav.textContent = due ? `Review · ${due}` : 'Review';
}

function inkIn(root = app) {
  requestAnimationFrame(() => requestAnimationFrame(() => root.querySelectorAll('.plate, .draw').forEach(el => el.classList.add('on'))));
}

function observeDraw() {
  const els = app.querySelectorAll('.draw:not(.on)');
  if (!('IntersectionObserver' in window)) return els.forEach(e => e.classList.add('on'));
  const io = new IntersectionObserver(
    es =>
      es.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('on');
          io.unobserve(e.target);
        }
      }),
    { threshold: 0.15 },
  );
  requestAnimationFrame(() =>
    requestAnimationFrame(() =>
      els.forEach(el => {
        if (el.getBoundingClientRect().top > window.innerHeight) {
          el.classList.remove('on');
          io.observe(el);
        }
      }),
    ),
  );
}

const dueIds = () => dueToday(allProblemIds(), S.cards, { cap: 30, today: today() });
const isRead = no => !!(S.lessons[no] && S.lessons[no].at);

function logToday(field) {
  const k = today();
  S.log[k] = S.log[k] || {};
  S.log[k][field] = (S.log[k][field] || 0) + 1;
}

function chapterStats(no) {
  const items = problemsFor(no);
  const done = items.filter(p => S.cards[p.id] && S.cards[p.id].last).length;
  const learned = items.filter(p => isLearned(S.cards[p.id])).length;
  return { done, learned, total: items.length };
}

const pips = c =>
  `<span class="pips" aria-label="box ${c ? c.box : 0}">${Array.from({ length: MAX_BOX }, (_, k) => `<i class="${c && c.box > k ? (k + 1 >= LEARNED_BOX ? 'w' : 'f') : ''}"></i>`).join('')}</span>`;

function last30() {
  const out = [];
  for (let i = 29; i >= 0; i -= 1) {
    const key = addDays(today(), -i);
    const l = S.log[key] || {};
    out.push({ key, count: l.solved || 0, done: (l.right || 0) > 0, today: i === 0 });
  }
  return out;
}

const nextChapter = () => TOPICS.map(t => t[0]).find(no => getChapter(no) && !isRead(no)) || null;

/* ---------------------------------------------------------------- home */

function renderHome() {
  setView('home');
  const due = dueIds();
  const read = TOPICS.filter(([no]) => isRead(no)).length;
  const answered = Object.values(S.cards).filter(c => c && c.last).length;
  const nxt = nextChapter();
  const nt = nxt ? topic(nxt) : null;
  const dateStr = new Date().toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' });
  const all = allProblemIds();
  const mastered = all.filter(id => isLearned(S.cards[id])).length;
  const boxes = Array.from({ length: MAX_BOX + 1 }, (_, b) => all.filter(id => S.cards[id] && S.cards[id].box === b).length);
  const boxMax = Math.max(1, ...boxes);
  const tot = Object.values(S.log).reduce((a, l) => ({ s: a.s + (l.solved || 0), r: a.r + (l.right || 0) }), { s: 0, r: 0 });

  app.innerHTML = `
  <section class="hero">
    <div class="copy">
      <p class="eyebrow">Hull · Options, Futures &amp; Other Derivatives</p>
      <h1 class="big-heading">Priced today,<br><em class="accent">paid at expiry.</em></h1>
      <p class="lede">跟着 Hull 的教材，一章一章读：小节的顺序、书里的例子和课后习题都对照原书。习题直接在页面上作答，数字题看对错，文字题按要点批改，换个说法不会被判错；做过的题按间隔重复回来复习。</p>

      <div class="today card">
        <p class="kicker">Today · ${esc(dateStr)}</p>
        <div class="nums">
          <div><span class="big">${due.length}</span><span class="lab">to review<br><i>待复习</i></span></div>
          <div><span class="big">${read}<small>/${TOPICS.length}</small></span><span class="lab">chapters<br><i>已读章节</i></span></div>
          <div><span class="big">${answered}</span><span class="lab">answered<br><i>做过的题</i></span></div>
        </div>
        ${nt ? `<p class="next-line"><span class="kicker">Next chapter</span><a href="#/ch/${nxt}">第 ${nxt} 章 · ${esc(nt[2])}</a></p>` : `<p class="done-line"><span class="hand">All read!</span> 全部章节读完了，接下来以复习为主。</p>`}
        <div class="actions">
          ${nt ? `<a class="btn" href="#/ch/${nxt}">读下一章 <span aria-hidden="true">→</span></a>` : ''}
          <a class="btn ${nt ? 'ghost' : ''}" href="${due.length ? '#/review' : '#/random'}">${due.length ? `复习 ${due.length} 题` : '随手练一题'}</a>
        </div>
        <p class="note">${tot.s ? `一共答过 ${tot.s} 次，答对 ${tot.r} 次。` : '读完一章后点"这一章读完了"，本章习题就会进入复习。'}</p>
      </div>
    </div>
    <figure class="plate-wrap">
      <div class="plate">${heroPlate({ chapters: TOPICS.length, problems: totalProblems() })}</div>
      <figcaption>Pl. I — the payoff <span>Ch. 1</span></figcaption>
    </figure>
  </section>

  <section id="chapters">
    <h2 class="numbered-heading draw">The chapters</h2>
    <p class="chapter-lede">教材的 34 章按原书顺序排列；分组是为了方便浏览，原书没有分部。</p>
    <div class="topics">${PARTS.map(partCard).join('')}</div>
  </section>

  <section id="progress">
    <h2 class="numbered-heading draw">Progress</h2>
    <p class="chapter-lede">一次答对就升一格，答错或看了解法就明天再来。</p>
    <div class="progress-grid">
      <div class="engraved">
        <div><span class="big">${read}</span><span class="lab">chapters read · 已读章节</span></div>
        <div><span class="big">${mastered}<small>/${all.length}</small></span><span class="lab">mastered · 掌握的习题</span></div>
        <div><span class="big">${tot.s ? `${Math.round((100 * tot.r) / tot.s)}<small>%</small>` : '—'}</span><span class="lab">accuracy · 正确率</span></div>
      </div>
      <figure class="month-wrap draw">
        ${monthSketch(last30())}
        <figcaption>The last 30 days — 斜线越密练得越多，打勾表示当天答对过题。</figcaption>
      </figure>
      <figure class="boxes draw" aria-label="Problems per review box">
        ${boxes.map((n, b) => `<div class="box ${b >= LEARNED_BOX ? 'warm' : ''}" style="--i:${b}"><span class="bar" style="--h:${((n / boxMax) * 100).toFixed(1)}%"></span><span class="n">${n}</span><span class="b">${b}</span></div>`).join('')}
        <figcaption>Leitner boxes · 每个盒子里的习题数</figcaption>
      </figure>
    </div>
  </section>

  <section id="method">
    <h2 class="numbered-heading draw">The method</h2>
    <ol class="method">
      <li><span class="step">I</span><h3>Read</h3><p>按教材的小节顺序读，每节用中文讲清楚，英文术语保留在括号里。</p><span class="hand">§ 1.1, 1.2 …</span></li>
      <li><span class="step">II</span><h3>Work</h3><p>书里的例子用书里的数字，一步一步算给你看。</p><span class="hand">S<sub>T</sub> − K</span></li>
      <li><span class="step">III</span><h3>Answer</h3><p>课后习题直接作答：数字题会指出符号或单位的错误，文字题会说出缺了哪个要点。</p><span class="hand">graded</span></li>
      <li><span class="step">IV</span><h3>Return</h3><p>答对的题隔得越来越久再来，答错的明天再来，直到稳定答对。</p><span class="hand">1, 2, 4, 7 …</span></li>
    </ol>
    <p class="more"><a class="link" href="#/formulas">公式本 · all formulas</a></p>
  </section>`;
  inkIn();
  observeDraw();
}

function partCard(p) {
  const chs = TOPICS.filter(([no]) => no >= p.from && no <= p.to);
  const readN = chs.filter(([no]) => isRead(no)).length;
  const nxt = nextChapter();
  return `<article class="topic draw">
    <header>
      <span class="tno">${roman(p.no)}</span>
      <div>
        <h3>${esc(p.en)}</h3>
        <p class="tsub">${esc(p.zh)} · <span class="weight">Ch. ${p.from}–${p.to}</span></p>
      </div>
      <span class="tcount">${readN} / ${chs.length}</span>
    </header>
    <p class="tblurb">${esc(p.blurb)}</p>
    <ol class="lessons">${chs
      .map(([no, en, zh]) => {
        const ok = !!getChapter(no);
        const done = isRead(no);
        const st = chapterStats(no);
        return `<li class="${done ? 'learned' : ''} ${no === nxt ? 'is-next' : ''} ${ok ? '' : 'is-todo'}">
          <a href="${ok ? `#/ch/${no}` : '#/'}"><span class="lno">${no}</span><span class="lname">${esc(zh)}<i>${esc(en)}</i>${ok && st.done ? `<em class="lmeta">已做 ${st.done}/${st.total} 题</em>` : ok ? '' : '<em class="lmeta">在写</em>'}</span>
          <span class="lmark">${done ? tickMark() : no === nxt ? '<span class="hand">next</span>' : ''}</span></a></li>`;
      })
      .join('')}</ol>
  </article>`;
}

/* ---------------------------------------------------------------- chapter */

const secAnchor = id => `s-${id.replace('.', '-')}`;

function renderChapter(no) {
  const c = getChapter(no);
  const tp = topic(no);
  if (!tp) return notFound();
  if (!c) return renderTodo(no);
  setView('lesson', c.zh);
  const p = partOf(no);
  const prev = TOPICS.find(t => t[0] === no - 1);
  const nxt = TOPICS.find(t => t[0] === no + 1);
  const st = chapterStats(no);
  const read = isRead(no);

  app.innerHTML = `
  <article class="lesson">
    <a class="back" href="#/">← Chapters</a>
    <header class="lesson-head">
      <p class="eyebrow">${roman(p.no)} · ${esc(p.en)} · Chapter ${no}</p>
      <h1 class="medium-heading">${esc(c.zh)}</h1>
      <p class="sub">${esc(c.en)} <span class="obj">Hull ch. ${no}</span></p>
      <nav class="toc" aria-label="Sections">${c.sections.map(s => `<a href="#/ch/${no}/${s.id}"><b>${esc(s.id)}</b> ${esc(s.zh)}</a>`).join('')}<a href="#/ch/${no}/problems"><b>Q</b> 课后习题</a></nav>
    </header>

    <div class="learn">
      ${c.sections
        .map(
          s => `
        <section class="sec" id="${secAnchor(s.id)}">
          <h2 class="small-heading"><span class="hand">§ ${esc(s.id)}</span> ${esc(s.zh)}</h2>
          <p class="sec-en">${esc(s.en)}</p>
          ${s.body.map(t => `<p>${rich(t)}</p>`).join('')}
          ${(s.examples || [])
            .map(
              ex => `<div class="recipe"><p class="kicker">Example · ${rich(ex.title)}</p><ol>${ex.steps.map(x => `<li>${rich(x)}</li>`).join('')}</ol></div>`,
            )
            .join('')}
        </section>`,
        )
        .join('')}
    </div>

    ${
      (c.formulas || []).length
        ? `<section class="follow">
      <h2 class="small-heading"><span class="hand">formulas</span> 本章公式</h2>
      ${c.formulas.map(f => `<figure class="formula">${K(f.tex, true)}<figcaption>${rich(f.zh)}</figcaption></figure>`).join('')}
    </section>`
        : ''
    }

    <section class="drills" id="problems">
      <h2 class="small-heading"><span class="hand">your turn</span> 课后习题</h2>
      <p class="note">题号与教材相同。直接在页面上作答，会自动批改。已做 ${st.done}/${st.total} 题。</p>
      <ul class="drill-list">
        ${problemsFor(no)
          .map(
            q => `<li><a href="#/problem/${q.id}"><span class="dname"><b class="qno">${esc(q.no)}</b>${rich(clip(q.q))}</span>${pips(S.cards[q.id])}<span class="go">作答 →</span></a></li>`,
          )
          .join('')}
      </ul>
      <div class="actions">
        <a class="btn" href="#/practice/${no}">按顺序做本章习题 <span aria-hidden="true">→</span></a>
        ${read ? `<p class="done-line">${tickMark()}<span>这一章读过了（${esc(S.lessons[no].at)}）。</span><button class="link" data-act="unread">标记为未读</button></p>` : `<button class="btn ghost" data-act="read">这一章读完了 ✓</button>`}
      </div>
    </section>

    <nav class="pager">
      ${prev ? `<a href="#/ch/${prev[0]}">← ${prev[0]}. ${esc(prev[2])}</a>` : '<span></span>'}
      ${nxt ? `<a href="#/ch/${nxt[0]}">${nxt[0]}. ${esc(nxt[2])} →</a>` : '<span></span>'}
    </nav>
  </article>`;
  inkIn();
  observeDraw();

  const r = app.querySelector('[data-act="read"]');
  if (r)
    r.addEventListener('click', () => {
      S.lessons[no] = { at: today() };
      for (const q of problemsFor(no)) if (!S.cards[q.id]) S.cards[q.id] = { box: 0, due: today(), right: 0, wrong: 0, last: null };
      logToday('chapters');
      persist();
      renderChapter(no);
      app.querySelector('#problems').scrollIntoView({ block: 'start' });
    });
  const u = app.querySelector('[data-act="unread"]');
  if (u)
    u.addEventListener('click', () => {
      delete S.lessons[no];
      persist();
      renderChapter(no);
    });
}

/* Clip a question for the list: first sentence or so. */
function clip(q) {
  const s = String(q);
  if (s.length <= 64) return s;
  let cut = 64;
  const dollars = (s.slice(0, cut).match(/(?<!\\)\$/g) || []).length;
  if (dollars % 2) cut = s.indexOf('$', cut) + 1 || s.length;
  return s.slice(0, cut) + '…';
}

function renderTodo(no) {
  const tp = topic(no);
  setView('lesson', tp[2]);
  app.innerHTML = `
  <article class="lesson">
    <a class="back" href="#/">← Chapters</a>
    <header class="lesson-head">
      <p class="eyebrow">Chapter ${no}</p>
      <h1 class="medium-heading">${esc(tp[2])}</h1>
      <p class="sub">${esc(tp[1])}</p>
    </header>
    <p class="note">这一章还在写，很快就会加上。</p>
  </article>`;
}

/* ---------------------------------------------------------------- problem sheet */

/*
 * One problem on a sheet. The first answer in a view is recorded for review; after that the
 * learner may retry freely. Choice, number and written answers are graded by js/grade.js.
 */
function renderSheet(item, { back, next, label, view = 'drill' }) {
  setView(view, `习题 ${item.no}`);
  const tp = topic(item.chapter);
  const prob = instantiate(item);
  let recorded = false;

  app.innerHTML = `
  <section class="drill-page">
    <a class="back" href="${back.href}">← ${esc(back.label)}</a>
    <header class="drill-head">
      <p class="eyebrow">${esc(label || `Chapter ${item.chapter} · ${tp[1]}`)}</p>
      <h1 class="medium-heading">习题 ${esc(item.no)} <span class="sec-ref">§ ${esc(item.sec || '')}</span></h1>
      ${pips(S.cards[item.id])}
    </header>
    <div class="card sheet" id="sheet">
      <p class="kicker">${prob.kind === 'short' ? 'Written answer · 文字作答' : prob.kind === 'number' ? 'Numerical answer · 数字作答' : 'Choose one · 单选'}</p>
      <p class="ptext">${rich(prob.q)}</p>
      <div class="body"></div>
      <div class="feedback" aria-live="polite"></div>
      <div class="after"></div>
    </div>
  </section>`;

  const sheet = app.querySelector('#sheet');
  const body = sheet.querySelector('.body');
  const fb = sheet.querySelector('.feedback');
  const after = sheet.querySelector('.after');

  const model = () =>
    prob.kind === 'choice' ? prob.options[prob.answer] : prob.kind === 'short' ? prob.rubric.model : `${prob.answer}${prob.unit ? ' ' + prob.unit : ''}`;

  function record(ok) {
    if (recorded) return;
    recorded = true;
    S.cards[item.id] = grade(S.cards[item.id], ok, today());
    logToday('solved');
    if (ok) logToday('right');
    persist();
  }

  function points(list) {
    if (!list.length) return '';
    return `<ul class="points">${list
      .map(x => {
        const cls = x.startsWith('✓') ? 'got' : x.startsWith('✗') ? 'miss' : x.startsWith('⚠') ? 'trap' : 'diag';
        return `<li class="${cls}">${rich(x.replace(/^[✓✗⚠]\s*/, ''))}</li>`;
      })
      .join('')}</ul>`;
  }

  function show(res, { revealed = false } = {}) {
    const ok = res.verdict === 'correct' && !revealed;
    const head = revealed
      ? ['Worked solution.', '解法如下']
      : { correct: ['Right.', '答对了'], partial: ['Almost.', '部分正确：还差下面打 ✗ 的要点'], wrong: ['Not yet.', '不对，看看下面的说明'], invalid: ['—', ''] }[res.verdict];
    fb.className = `feedback on ${ok ? 'is-right' : ''}`;
    fb.innerHTML = `
      ${res.verdict === 'invalid' ? `<p class="why">${rich(res.feedback[0] || '')}</p>` : `<div class="verdict ${ok ? 'is-right' : ''}">${ok ? tickMark() : crossMark()}<div><p class="v-fr">${head[0]}</p><p class="v-zh">${esc(head[1])}</p></div></div>`}
      ${res.verdict !== 'invalid' ? points(res.feedback) : ''}
      ${res.verdict !== 'invalid' && (!ok || revealed) ? `<p class="model"><span class="kicker">参考答案</span>${rich(model())}</p>` : ''}
      ${res.verdict !== 'invalid' ? `<div class="worked"><p class="kicker">解题过程</p><p>${rich(prob.why || '')}</p></div>` : ''}`;
    inkIn(fb);
    if (res.verdict === 'invalid') return;
    after.innerHTML = `<div class="actions">
      ${next ? `<a class="btn" href="${next.href}">${esc(next.label)} <span aria-hidden="true">→</span></a>` : `<a class="btn" href="${back.href}">完成 <span aria-hidden="true">→</span></a>`}
      <button class="link" data-retry>再答一次（不计入复习）</button>
    </div>`;
    after.querySelector('[data-retry]').addEventListener('click', () => {
      fb.className = 'feedback';
      fb.innerHTML = '';
      after.innerHTML = '';
      mount();
    });
  }

  function mount() {
    if (prob.kind === 'choice') {
      body.innerHTML = `<div class="options">${prob.options.map((o, k) => `<button class="opt" data-k="${k}"><b>${'ABCD'[k]}</b><span>${rich(o)}</span></button>`).join('')}</div>
        <div class="actions"><button class="link" data-reveal>我不会，看解法</button></div>`;
      body.querySelectorAll('.opt').forEach(b =>
        b.addEventListener('click', () => {
          const k = Number(b.dataset.k);
          const res = gradeProblem(prob, k);
          record(isPass(res));
          body.querySelectorAll('.opt').forEach((x, j) => {
            x.disabled = true;
            if (j === prob.answer) x.classList.add('right');
            else if (j === k) x.classList.add('wrong');
          });
          show(res);
        }),
      );
    } else {
      const short = prob.kind === 'short';
      body.innerHTML = `
        <form class="answer-form ${short ? 'written' : ''}" autocomplete="off">
          ${
            short
              ? `<textarea class="answer" rows="4" aria-label="你的答案" placeholder="用自己的话写：先说结论，再说理由。"></textarea>`
              : `<input class="answer" type="text" inputmode="decimal" aria-label="你的答案" placeholder="${prob.unit ? `数字，单位：${esc(prob.unit)}` : '输入数字'}">`
          }
          <button class="btn" type="submit">${short ? '提交批改' : '检查'} <span aria-hidden="true">↵</span></button>
          <button class="link" type="button" data-reveal>我不会，看解法</button>
        </form>
        ${short ? '<p class="note">按要点批改：同一个意思换种说法也算对；缺了哪一点会直接告诉你。</p>' : '<p class="note">可以带单位、逗号或负号，例如 -2,000 或 52.5。</p>'}`;
      const form = body.querySelector('form');
      const input = form.querySelector('.answer');
      form.addEventListener('submit', e => {
        e.preventDefault();
        if (!input.value.trim()) return;
        const res = gradeProblem(prob, input.value);
        if (res.verdict !== 'invalid') {
          record(isPass(res));
          input.disabled = true;
          form.querySelector('button[type=submit]').disabled = true;
          form.querySelector('[data-reveal]').hidden = true;
        }
        show(res);
      });
      if (short) input.addEventListener('keydown', e => (e.metaKey || e.ctrlKey) && e.key === 'Enter' && form.requestSubmit());
      input.focus({ preventScroll: true });
    }
    body.querySelector('[data-reveal]').addEventListener('click', () => {
      record(false);
      body.querySelectorAll('.opt').forEach((x, j) => {
        x.disabled = true;
        if (j === prob.answer) x.classList.add('right');
      });
      body.querySelectorAll('.answer, button[type=submit]').forEach(x => (x.disabled = true));
      body.querySelector('[data-reveal]').hidden = true;
      show({ verdict: 'wrong', feedback: [] }, { revealed: true });
    });
  }
  mount();
}

function renderProblem(id) {
  const item = findItem(id);
  if (!item) return notFound();
  const list = problemsFor(item.chapter);
  const k = list.findIndex(p => p.id === id);
  const nx = list[k + 1];
  renderSheet(item, {
    back: { href: `#/ch/${item.chapter}/problems`, label: `第 ${item.chapter} 章习题` },
    next: nx ? { href: `#/problem/${nx.id}`, label: `下一题 ${nx.no}` } : null,
  });
}

/* Work through a chapter's problems: unanswered first, then the rest. */
function renderPractice(no, id) {
  const list = problemsFor(no);
  if (!list.length) return renderChapter(no);
  const queue = [...list.filter(p => !(S.cards[p.id] && S.cards[p.id].last)), ...list.filter(p => S.cards[p.id] && S.cards[p.id].last)];
  const item = (id && queue.find(p => p.id === id)) || queue[0];
  const k = queue.indexOf(item);
  const nx = queue[k + 1];
  renderSheet(
    { ...item, chapter: no },
    {
      back: { href: `#/ch/${no}/problems`, label: `第 ${no} 章` },
      next: nx ? { href: `#/practice/${no}/${nx.id}`, label: `下一题（${k + 2}/${queue.length}）` } : null,
      label: `Practice · Chapter ${no} · ${k + 1} / ${queue.length}`,
    },
  );
}

let reviewStep = 0;
function renderReview() {
  const due = dueIds();
  if (!due.length) {
    setView('summary', 'Review');
    app.innerHTML = `
    <section class="summary">
      <div class="card sheet">
        <p class="kicker">Review · 复习</p>
        <h1 class="medium-heading">今天没有要复习的题。</h1>
        <p class="lede">读完一章后点"这一章读完了"，本章习题就会进入复习。答对的题会隔得越来越久再来。</p>
        <div class="month">${monthSketch(last30())}</div>
        <div class="actions"><a class="btn" href="#/random">随手练一题 <span aria-hidden="true">→</span></a><a class="btn ghost" href="#/">回到目录</a></div>
      </div>
    </section>`;
    inkIn();
    return;
  }
  reviewStep += 1;
  const item = findItem(due[0]);
  renderSheet(item, {
    back: { href: '#/', label: 'Chapters' },
    next: { href: `#/review/${reviewStep}`, label: due.length > 1 ? `下一题（还剩 ${due.length - 1}）` : '完成复习' },
    label: `Review · 第 ${item.chapter} 章 · 还剩 ${due.length} 题`,
    view: 'session',
  });
}

function renderRandom() {
  const ids = allProblemIds();
  if (!ids.length) return renderHome();
  const pool = ids.filter(id => getChapter(findItem(id).chapter) && (isRead(findItem(id).chapter) || !Object.keys(S.lessons).length));
  const src = pool.length ? pool : ids;
  const id = src[Math.floor(Math.random() * src.length)];
  const item = findItem(id);
  renderSheet(item, {
    back: { href: '#/', label: 'Chapters' },
    next: { href: `#/random/${Date.now()}`, label: '再来一题' },
    label: `Random · 第 ${item.chapter} 章`,
  });
}

/* ---------------------------------------------------------------- formulas */

function renderFormulas() {
  setView('formulas', 'Formulas');
  app.innerHTML = `
  <section class="formulas">
    <a class="back" href="#/">← Chapters</a>
    <header class="lesson-head">
      <p class="eyebrow">Formula book</p>
      <h1 class="medium-heading">公式本</h1>
      <p class="sub">按章节顺序，每条公式下面写着它的意思。</p>
    </header>
    ${TOPICS.map(([no, en, zh]) => {
      const c = getChapter(no);
      if (!c || !(c.formulas || []).length) return '';
      return `<div class="fbook"><h2 class="small-heading"><span class="hand">ch. ${no}</span> <a href="#/ch/${no}">${esc(zh)}</a></h2>
        ${c.formulas.map(f => `<figure class="formula">${K(f.tex, true)}<figcaption>${rich(f.zh)}</figcaption></figure>`).join('')}</div>`;
    }).join('')}
  </section>`;
}

function notFound() {
  setView('lesson', 'Not found');
  app.innerHTML = `<section class="lesson"><h1 class="medium-heading">找不到这一页。</h1><div class="actions"><a class="btn" href="#/">回到目录</a></div></section>`;
}

/* ---------------------------------------------------------------- router */

function route() {
  const parts = (location.hash || '#/').replace(/^#\/?/, '').split('/').filter(Boolean);
  const [page, a, b] = parts;
  if (!page) return renderHome();
  if (page === 'ch') {
    renderChapter(Number(a));
    if (b) {
      const el = document.getElementById(b === 'problems' ? 'problems' : secAnchor(b));
      if (el) requestAnimationFrame(() => el.scrollIntoView({ block: 'start' }));
    }
    return;
  }
  if (page === 'problem') return renderProblem(a);
  if (page === 'practice') return renderPractice(Number(a), b);
  if (page === 'review') return renderReview();
  if (page === 'random') return renderRandom();
  if (page === 'formulas') return renderFormulas();
  return notFound();
}

window.addEventListener('hashchange', route);
route();
startBirds();
