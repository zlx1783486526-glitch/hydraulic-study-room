(() => {
  'use strict';
  const questions = window.HYDRAULIC_QUESTIONS || [];
  const lessons = window.HYDRAULIC_LESSONS || [];
  const byId = Object.fromEntries(questions.map(q => [q.id, q]));
  const byLesson = Object.fromEntries(lessons.map(l => [l.id, l]));
  const typeNames = {fill:'填空题',judge:'判断题',choice:'选择题',short:'简答题',calc:'计算题',circuit:'回路分析',draw:'绘制回路'};
  const storeKey = 'hydraulic-tutor-progress-v1';
  let progress = {};
  let storeAvailable = true;
  let stage = {};
  let drafts = {};
  let toastTimer;

  const $ = (s,root=document) => root.querySelector(s);
  const esc = (value='') => String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const text = (value='') => esc(value).replace(/\n/g,'<br>');
  const short = (value='',n=130) => String(value).replace(/\s+/g,' ').slice(0,n);
  const topicName = id => (byLesson[id]||{}).title?.replace(/^\d+ · /,'') || '综合回路';
  const label = q => q.displayNumber || `${q.number} 题`;
  const filePage = n => `assets/pages/p${String(n).padStart(2,'0')}.webp`;
  const sourceLink = n => `原始习题.pdf#page=${n}`;
  const isDone = q => !!progress[q.id]?.reviewed;
  const isWrong = q => !!progress[q.id]?.retry;

  try { progress = JSON.parse(localStorage.getItem(storeKey) || '{}') || {}; }
  catch { progress = {}; storeAvailable = false; }

  function persist(announce=true) {
    try { localStorage.setItem(storeKey, JSON.stringify(progress)); storeAvailable = true; }
    catch { storeAvailable = false; }
    if (announce) document.dispatchEvent(new Event('hydraulic:progress-changed'));
  }
  function toast(message) {
    const node = $('#toast'); node.textContent = message; node.classList.add('show');
    clearTimeout(toastTimer); toastTimer = setTimeout(()=>node.classList.remove('show'),3300);
  }
  function route() {
    const raw = decodeURIComponent((location.hash || '#home').slice(1));
    if (raw.startsWith('access_token=') || raw.startsWith('error=')) return {path:'home',params:new URLSearchParams()};
    const [path, query=''] = raw.split('?');
    return {path:path || 'home', params:new URLSearchParams(query)};
  }
  function navTo(hash) { location.hash = hash; }
  function stats(list=questions) {
    const done = list.filter(isDone).length;
    const wrong = list.filter(isWrong).length;
    return {total:list.length,done,wrong,pct:list.length?Math.round(done/list.length*100):0};
  }
  function progressBar(list=questions) {
    const s=stats(list);
    return `<div class="progress-label"><span>已完成 ${s.done} / ${s.total}</span><strong>${s.pct}%</strong></div><div class="progress-bar" aria-label="完成进度 ${s.pct}%"><span style="width:${s.pct}%"></span></div>`;
  }
  function qRow(q) {
    const state = isWrong(q) ? '待重练' : isDone(q) ? '已学' : '未学';
    return `<a class="question-row ${q.priority?'priority':''}" href="#question/${esc(q.id)}">
      <span class="q-index">${q.priority?'★ ':''}${esc(typeNames[q.type])}<br>${esc(label(q))}</span>
      <span class="q-row-content"><strong>${esc(short(q.prompt,150))}</strong><span class="q-row-meta"><span>${esc(topicName(q.topic))}</span><span>PDF 第 ${q.page} 页</span>${q.needsReview?'<span>勘误/存疑</span>':''}</span></span>
      <span class="q-state ${isDone(q)?'good':''}">${state}</span></a>`;
  }
  function setNav(path) {
    $$('#main-nav a, #lesson-nav a').forEach(a => a.classList.remove('active'));
    let key=path.split('/')[0];
    if (key==='lesson') {
      const a=$(`#lesson-nav a[data-lesson="${path.split('/')[1]}"]`); if(a) a.classList.add('active');
    } else if(key==='question') {
      const q=byId[path.split('/')[1]];
      if(q) {const a=$(`#lesson-nav a[data-lesson="${q.topic}"]`);if(a)a.classList.add('active');}
    } else {
      const a=$(`#main-nav a[data-route="${key}"]`);if(a)a.classList.add('active');
    }
  }
  function $$(s,root=document){return Array.from(root.querySelectorAll(s));}
  function renderHome() {
    const s=stats(), reds=questions.filter(q=>q.priority), latest=reds.filter(q=>!isDone(q)).slice(0,3);
    const cards=lessons.map((l,i)=>{
      const related=questions.filter(q=>q.topic===l.id);const st=stats(related);
      return `<a class="chapter-card" href="#lesson/${l.id}"><span class="num">CHAPTER ${String(i+1).padStart(2,'0')}</span><h3>${esc(l.title.replace(/^\d+ · /,''))}</h3><p>${esc(l.subtitle)}</p><div class="card-foot"><span>${related.length} 道关联题</span><span>已学 ${st.done} / ${st.total} →</span></div></a>`;
    }).join('');
    $('#breadcrumb').textContent='学习总览';
    $('#app').innerHTML=`<section class="hero"><div class="eyebrow">HYDRAULICS TUTOR FOR IPAD</div><h1>从看懂液压，<br>到独立做出每道题。</h1><p>7 章零基础教材、282 道原题、70 道选择题逐项辨析。红字原题是最重点，已单独标记并提供更细的步骤。</p><div class="hero-actions"><a class="button light" href="#lesson/fundamentals">从第一章开始 →</a><a class="button ghost" href="#priority">先学红字重点 ★</a></div></section>
      <div class="stats-grid"><div class="stat-card"><strong>${s.total}</strong><span>收录原题</span></div><div class="stat-card red"><strong>${reds.length}</strong><span>红字最重点</span></div><div class="stat-card teal"><strong>${s.done}</strong><span>已完成学习</span></div><div class="stat-card"><strong>${s.wrong}</strong><span>待重练错题</span></div></div>
      <div class="callout">推荐路径：按章节学习概念 → 做对应选择题 → 分阶段拆解红字大题 → 在错题区重练。原 PDF 的文字层对部分公式与图形提取不完整，请用每题的原页图核对。</div>
      <div class="section-heading"><h2>七章教材</h2><p>每节都有公式、例题、易错点与自检</p></div><div class="chapter-grid">${cards}</div>
      <div class="section-heading"><h2>下一步：红字最重点</h2><a href="#priority">查看全部 19 题 →</a></div><div class="priority-preview">${latest.map(q=>`<a href="#question/${q.id}" class="priority-mini"><span class="meta">★ ${esc(q.typeName)} · 原页 ${q.page}</span><strong>${esc(short(q.prompt,75))}</strong></a>`).join('') || '<div class="empty">红字重点已全部学完，可以去错题区巩固。</div>'}</div>
      <div class="section-heading"><h2>学习进度</h2></div><div class="card" style="padding:24px">${progressBar()}<p style="font-size:12px;color:var(--muted);margin:12px 0 0">${storeAvailable?'进度先保存在当前浏览器；登录云端后可在电脑和 iPad 自动同步。右上角仍可 ⇩ 导出、⇧ 导入备份。':'当前浏览器未允许本地持久保存；请登录云端同步或用右上角导出进度备份。'}</p></div>`;
  }
  function renderLesson(id) {
    const l=byLesson[id];if(!l){navTo('#home');return;}
    const related=questions.filter(q=>q.topic===id).sort((a,b)=>Number(b.priority)-Number(a.priority)||a.page-b.page);
    $('#breadcrumb').textContent=l.title;
    $('#app').innerHTML=`<a class="back-link" href="#home">← 返回总览</a><div class="lesson-hero"><div class="eyebrow">FOUNDATION COURSE</div><h1>${esc(l.title)}</h1><p>${esc(l.lead)}</p></div>
      <nav class="concept-map" aria-label="本章概念图"><span class="concept-label">本章概念图</span><div class="concept-flow">${l.sections.map((s,i)=>`<button type="button" data-action="jump-lesson" data-section="${i+1}"><b>${String(i+1).padStart(2,'0')}</b><span>${esc(s.title)}</span></button>`).join('<span class="concept-arrow" aria-hidden="true">→</span>')}</div></nav>
      <div class="lesson-stack">${l.sections.map((s,i)=>`<section class="lesson-section" id="lesson-section-${i+1}"><span class="index">LESSON ${i+1} / ${l.sections.length}</span><h2>${esc(s.title)}</h2><p>${esc(s.body)}</p><div class="formula-card">${esc(s.formula)}</div><div class="lesson-columns"><div class="lesson-note"><strong>算一个例子</strong>${esc(s.example)}</div><div class="lesson-note warn"><strong>容易错在这里</strong>${esc(s.mistake)}</div></div><details class="mini-check"><summary>先自己答：${esc(s.check[0])}</summary><p>${esc(s.check[1])}</p></details></section>`).join('')}</div>
      <section class="lesson-related"><h2>用本章知识做题</h2><p style="font-size:12px;color:var(--muted)">红字题排在最前。完整题库可按知识点筛选。</p><div class="question-list">${related.slice(0,9).map(qRow).join('')}</div><div style="margin-top:15px"><a class="button secondary" href="#bank?topic=${id}">查看本章全部 ${related.length} 道题 →</a></div></section>`;
  }
  function listConfig(r) {
    const key=r.path;
    if(key==='priority') return {title:'红字最重点',sub:'原 PDF 用红色标出的 19 道题，按简答、计算、回路分析顺序排列。',list:questions.filter(q=>q.priority)};
    if(key==='mistakes') return {title:'错题重练',sub:'答错或自评“再练”的题会留在这里；再次做对或标记掌握后移出。',list:questions.filter(isWrong)};
    return {title:'全部习题',sub:'七类题共 282 道。选择题和开放题有逐题解析；原编号及 PDF 页码都保留。',list:questions};
  }
  function renderList(r) {
    const config=listConfig(r);const {params}=r;
    let list=config.list;
    const type=params.get('type')||'',topic=params.get('topic')||'',query=params.get('search')||'';
    if(type)list=list.filter(q=>q.type===type);
    if(topic)list=list.filter(q=>q.topic===topic);
    if(query)list=list.filter(q=>q.searchText.includes(query.toLowerCase()));
    if(r.path==='priority')list=list.sort((a,b)=>({short:0,calc:1,circuit:2}[a.type]??3)-({short:0,calc:1,circuit:2}[b.type]??3)||a.number-b.number);
    else if(r.path==='bank'&&!type&&!topic&&!query)list=[...list].sort((a,b)=>Number(b.priority)-Number(a.priority)||({choice:0,calc:1,circuit:2,short:3,draw:4,fill:5,judge:6}[a.type]-{choice:0,calc:1,circuit:2,short:3,draw:4,fill:5,judge:6}[b.type])||a.number-b.number);
    const perPage=24,totalPages=Math.max(1,Math.ceil(list.length/perPage));let page=Number(params.get('page')||1);page=Math.min(Math.max(page,1),totalPages);
    const slice=list.slice((page-1)*perPage,page*perPage);
    const base=r.path;const url=(newPage)=>{const p=new URLSearchParams(params);p.set('page',newPage);return `#${base}?${p.toString()}`;};
    $('#breadcrumb').textContent=config.title;
    $('#app').innerHTML=`<div class="eyebrow">EXERCISE LIBRARY</div><h1 class="page-title">${esc(config.title)}</h1><p class="page-subtitle">${esc(config.sub)}</p>
      ${r.path==='priority'?'<div class="callout red">★ 来自原 PDF 红色题干。建议先学关联知识点，再遮住答案独立完成，最后对照推导。</div>':''}
      <div class="toolbar"><select id="filter-type" aria-label="按题型筛选"><option value="">全部题型</option>${Object.entries(typeNames).map(([k,v])=>`<option value="${k}" ${type===k?'selected':''}>${v}</option>`).join('')}</select><select id="filter-topic" aria-label="按知识点筛选"><option value="">全部知识点</option>${lessons.map(l=>`<option value="${l.id}" ${topic===l.id?'selected':''}>${esc(l.title)}</option>`).join('')}</select><input id="list-search" type="search" placeholder="题干、公式、元件名称…" value="${esc(query)}" aria-label="题库搜索"><span class="count">找到 ${list.length} 道</span></div>
      <div class="question-list">${slice.map(qRow).join('') || '<div class="empty">没有符合条件的题目。可清除筛选或换一个关键词。</div>'}</div>
      ${totalPages>1?`<div class="pagination">${page>1?`<a class="button ghost small" href="${url(page-1)}">上一页</a>`:'<span class="button ghost small" aria-disabled="true">上一页</span>'}<span>${page} / ${totalPages}</span>${page<totalPages?`<a class="button ghost small" href="${url(page+1)}">下一页</a>`:'<span class="button ghost small" aria-disabled="true">下一页</span>'}</div>`:''}`;
    $('#filter-type').addEventListener('change',updateListFilters);
    $('#filter-topic').addEventListener('change',updateListFilters);
    $('#list-search').addEventListener('keydown',e=>{if(e.key==='Enter')updateListFilters();});
  }
  function updateListFilters() {
    const r=route(),p=new URLSearchParams();
    const t=$('#filter-type')?.value,topic=$('#filter-topic')?.value,q=$('#list-search')?.value.trim();
    if(t)p.set('type',t);if(topic)p.set('topic',topic);if(q)p.set('search',q);
    navTo(`#${r.path}${p.size?'?'+p.toString():''}`);
  }
  function renderIssues() {
    const list=questions.filter(q=>q.needsReview);
    $('#breadcrumb').textContent='勘误与存疑';
    $('#app').innerHTML=`<div class="eyebrow">SOURCE AUDIT</div><h1 class="page-title">勘误与存疑</h1><p class="page-subtitle">原答案与核对结果分开显示；这里列出文字提取缺失、答案矛盾及题干条件不足的条目。点击题目可看公式、推导和原页。</p><div class="callout amber">“存疑”表示题干或图示不足以唯一判断；请结合老师课堂使用的图与约定。网页不会把存疑题自动判错。</div><div class="issue-list">${list.map(q=>`<div class="issue-row"><a href="#question/${q.id}">${q.priority?'★ ':''}${esc(q.typeName)} ${esc(label(q))} · PDF 第 ${q.page} 页</a><p>${esc(q.issue)}</p></div>`).join('')}</div>`;
  }
  function renderQuestion(id) {
    const q=byId[id];if(!q){navTo('#bank');return;}
    const current=stage[id]??0,rec=progress[id]||{};
    const draft=drafts[id]??rec.lastAnswer??rec.draft??'';
    const isObjective=q.type==='choice'||q.type==='judge';
    const isMulti=q.type==='choice'&&q.reviewedAnswer.length>1;
    const originalPages=q.pages.length>1?`第 ${q.pages.join('、')} 页`:`第 ${q.page} 页`;
    const options=q.type==='choice'?Object.entries(q.options).map(([letter,value])=>`<label class="option ${draft.includes(letter)?'selected':''}" data-letter="${letter}"><input type="${isMulti?'checkbox':'radio'}" name="answer" value="${letter}" ${draft.includes(letter)?'checked':''}><span><b>${letter}.</b> ${text(value)}</span></label>`).join(''):
      q.type==='judge'?['√','×'].map(v=>`<label class="option ${draft===v?'selected':''}"><input type="radio" name="answer" value="${v}" ${draft===v?'checked':''}><span>${v==='√'?'正确 √':'错误 ×'}</span></label>`).join(''):
      `<label class="input-label" for="free-answer">先写下自己的思路或答案</label><textarea id="free-answer" class="answer-input" placeholder="先独立尝试；可在查看答案后自评掌握程度。">${esc(draft)}</textarea>`;
    const crop=q.figureCrops||[];
    const figure=crop.length?`<div class="figure-actions"><span class="badge neutral">原题图（已遮去答案区）</span></div>${crop.map((f,i)=>`<figure class="figure-preview"><img src="${esc(f)}" alt="${esc(q.typeName)}第 ${esc(label(q))} 原题图 ${i+1}" loading="lazy" data-enlarge="${esc(f)}"><figcaption>原 PDF 题目与图示 · 点击放大</figcaption></figure>`).join('')}`:q.hasFigure?'<div class="callout amber">本题图示请在作答后打开原页查看。原页可能同时含参考答案。</div>':'';
    const hint=q.steps.length?q.steps[0]:q.explanation;
    const stageHtml=current>=1?`<div class="stage-panel"><h2 class="stage-title">第一层 · 提示</h2><p>${esc(hint)}</p></div>`:'';
    const stepsHtml=current>=2&&q.steps.length?`<div class="stage-panel"><h2 class="stage-title">第二层 · 分步推导</h2><ol class="step-list">${q.steps.map(s=>`<li>${esc(s)}</li>`).join('')}</ol></div>`:'';
    const optionReview=q.type==='choice'?`<div class="option-review">${Object.entries(q.options).map(([letter,value])=>`<div class="${q.reviewedAnswer.includes(letter)?'is-answer':''}"><b>${letter} ${q.reviewedAnswer.includes(letter)?'✓':''}</b>${esc(q.optionNotes[letter]||'结合题干条件和基础公式判断。')}</div>`).join('')}</div>`:'';
    const answerHtml=current>=3?`<div class="answer-box"><h3>核对后的结论</h3><div class="answer-value">${esc(q.reviewedAnswer)}</div>${q.explanation?`<p>${esc(q.explanation)}</p>`:''}${optionReview}</div>
      ${q.issue?`<div class="issue-box"><strong>勘误 / 存疑</strong>${esc(q.issue)}</div>`:''}
      <details class="source-answer"><summary>展开原 PDF 参考答案（与核对结论分开）</summary><pre>${esc(q.originalAnswer)}</pre></details>
      <div class="figure-actions">${q.pages.map(n=>`<button class="button ghost small" data-action="open-page" data-page="${n}">查看原 PDF 第 ${n} 页图 ↗</button>`).join('')}<a class="button ghost small" href="${sourceLink(q.page)}" target="_blank" rel="noopener">打开 PDF 原页 ↗</a></div>
      ${!isObjective?`<div class="stage-panel"><h2 class="stage-title">第三层 · 自评巩固</h2><div class="q-actions"><button class="button small" data-action="mark-known" data-id="${q.id}">我已掌握</button><button class="button ghost small" data-action="mark-retry" data-id="${q.id}">加入错题重练</button></div></div>`:''}`:'';
    const feedback=rec.lastFeedback?`<div class="feedback ${rec.lastCorrect?'good':'bad'}">${esc(rec.lastFeedback)}</div>`:'';
    const controls=`<div class="q-actions">${isObjective?`<button class="button" data-action="submit" data-id="${q.id}">提交答案</button>`:''}${current<1?`<button class="button ghost" data-action="hint" data-id="${q.id}">先看提示</button>`:''}${current<2&&q.steps.length?`<button class="button secondary" data-action="steps" data-id="${q.id}">展开推导</button>`:''}${current<3?`<button class="button ghost" data-action="reveal" data-id="${q.id}">查看答案</button>`:''}</div>`;
    $('#breadcrumb').textContent=`${q.typeName} / ${label(q)}`;
    $('#app').innerHTML=`<a class="back-link" href="#${q.priority?'priority':'bank'}">← 返回${q.priority?'红字重点':'题库'}</a><div class="q-layout"><div class="q-main"><article class="q-card ${q.priority?'priority':''}"><div class="q-head"><div class="badges"><span class="badge">${esc(q.typeName)}</span><span class="badge neutral">${esc(topicName(q.topic))}</span>${q.priority?'<span class="badge red">★ 原 PDF 红字重点</span>':''}${q.needsReview?'<span class="badge amber">勘误 / 存疑</span>':''}</div><h1>${esc(label(q))}</h1><div class="source">原始习题 ${originalPages} · ${q.hasFigure?'含图示 · ':''}${rec.reviewed?'已学习':'待学习'}</div></div><div class="q-content"><div class="prompt">${text(q.prompt)}</div>${figure}<form id="answer-form">${options}</form>${feedback}${controls}${stageHtml}${stepsHtml}${answerHtml}</div></article></div>
      <aside class="q-aside"><div class="aside-card"><h3>本题学习路径</h3><p>① 独立尝试　② 提示　③ 推导　④ 核对原答案。${q.priority?'这道红字题建议重做两遍。':''}</p>${progressBar(questions.filter(x=>x.topic===q.topic))}</div><div class="aside-card"><h3>关联知识点</h3><a href="#lesson/${q.topic}">${esc(topicName(q.topic))} →</a><a href="#bank?topic=${q.topic}">同知识点练习 →</a>${q.needsReview?'<a href="#issues">查看勘误清单 →</a>':''}</div></aside></div>`;
  }
  function submit(id) {
    const q=byId[id],form=$('#answer-form');if(!q||!form)return;
    const selected=$$('input[name="answer"]:checked',form).map(x=>x.value).sort().join('');
    if(!selected){toast('请先选择答案。');return;}
    if(q.reviewedAnswer==='存疑'){stage[id]=3;renderQuestion(id);toast('此题存在歧义，请阅读核对说明。');return;}
    const correct=selected===q.reviewedAnswer.split('').sort().join('');
    const rec=progress[id]||{};
    progress[id]={...rec,attempts:(rec.attempts||0)+1,reviewed:true,retry:!correct,lastCorrect:correct,lastAnswer:selected,lastFeedback:correct?'答对了。再读一遍每个选项的辨析，确认不是碰巧选中。':`本次选择 ${selected}；请对照推导与勘误，再做一遍。`,updatedAt:Date.now()};
    stage[id]=3;persist();renderQuestion(id);
  }
  function captureDraft(id) {
    const q=byId[id];if(!q)return;
    if(q.type==='choice'||q.type==='judge')drafts[id]=$$('input[name="answer"]:checked',$('#answer-form')).map(x=>x.value).sort().join('');
    else drafts[id]=$('#free-answer')?.value||'';
  }
  function mark(id,known) {
    captureDraft(id);
    const rec=progress[id]||{};
    progress[id]={...rec,reviewed:true,retry:!known,lastCorrect:known,draft:drafts[id]||'',lastFeedback:known?'已标记掌握。建议隔天再独立复述步骤。':'已加入错题重练。先回关联章节，再回来重做。',updatedAt:Date.now()};
    persist();renderQuestion(id);toast(known?'已标记掌握':'已加入错题重练');
  }
  function render() {
    const r=route();setNav(r.path);
    if(r.path==='home')renderHome();
    else if(r.path.startsWith('lesson/'))renderLesson(r.path.split('/')[1]);
    else if(r.path.startsWith('question/'))renderQuestion(r.path.split('/')[1]);
    else if(['bank','priority','mistakes'].includes(r.path))renderList(r);
    else if(r.path==='issues')renderIssues();
    else navTo('#home');
    window.scrollTo({top:0,behavior:'instant'});
    $('#sidebar').classList.remove('open');$('#menu-button').setAttribute('aria-expanded','false');
  }
  function exportProgress() {
    const payload={version:1,exportedAt:new Date().toISOString(),progress};
    const url=URL.createObjectURL(new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}));
    const a=document.createElement('a');a.href=url;a.download='液压学习进度.json';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
    toast('学习进度已导出。');
  }
  async function importProgress(file) {
    if(!file)return;
    try {const data=JSON.parse(await file.text());if(data.version!==1||typeof data.progress!=='object'||!data.progress)throw new Error('文件格式不符合学习进度格式');
      const valid=Object.fromEntries(Object.entries(data.progress).filter(([id,v])=>byId[id]&&v&&typeof v==='object').map(([id,v])=>[id,{...v,updatedAt:Number(v.updatedAt)||Date.now()}]));
      progress={...progress,...valid};persist();render();toast(`已导入 ${Object.keys(valid).length} 道题的进度。`);
    } catch(e){toast(`导入失败：${e.message}`);} $('#import-file').value='';
  }
  function openImage(src,caption) {$('#modal-image').src=src;$('#modal-caption').textContent=caption;$('#image-modal').hidden=false;document.body.style.overflow='hidden';}
  function closeImage() {$('#image-modal').hidden=true;$('#modal-image').removeAttribute('src');document.body.style.overflow='';}

  $('#lesson-nav').innerHTML=lessons.map(l=>`<a href="#lesson/${l.id}" data-lesson="${l.id}">${esc(l.title)}</a>`).join('');
  $('#priority-count').textContent=questions.filter(q=>q.priority).length;
  window.addEventListener('hashchange',render);
  document.addEventListener('click',e=>{
    const btn=e.target.closest('[data-action]');if(btn){e.preventDefault();const id=btn.dataset.id;switch(btn.dataset.action){
      case 'submit':submit(id);break;case 'hint':captureDraft(id);stage[id]=Math.max(stage[id]||0,1);renderQuestion(id);break;
      case 'steps':captureDraft(id);stage[id]=Math.max(stage[id]||0,2);renderQuestion(id);break;
      case 'reveal':captureDraft(id);stage[id]=3;renderQuestion(id);break;
      case 'mark-known':mark(id,true);break;case 'mark-retry':mark(id,false);break;
      case 'open-page':openImage(filePage(Number(btn.dataset.page)),`原 PDF 第 ${btn.dataset.page} 页（可能含原参考答案）`);break;
      case 'jump-lesson':$(`#lesson-section-${btn.dataset.section}`)?.scrollIntoView({behavior:'smooth',block:'start'});break;
    }}
    const pic=e.target.closest('img[data-enlarge]');if(pic)openImage(pic.dataset.enlarge,pic.alt);
  });
  $('#image-modal').addEventListener('click',e=>{if(e.target===$('#image-modal')||e.target.id==='close-image')closeImage();});
  document.addEventListener('keydown',e=>{if(e.key==='Escape')closeImage();if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();$('#global-search').focus();}});
  $('#global-search').addEventListener('keydown',e=>{if(e.key==='Enter'){const value=e.target.value.trim();navTo(`#bank${value?'?search='+encodeURIComponent(value):''}`);e.target.blur();}});
  $('#export-progress').addEventListener('click',exportProgress);
  $('#import-progress').addEventListener('click',()=>$('#import-file').click());
  $('#import-file').addEventListener('change',e=>importProgress(e.target.files[0]));
  window.HYDRAULIC_PROGRESS_API = {
    get:()=>({...progress}),
    mergeRemote(remote) {
      const upload=[];
      for (const [id,record] of Object.entries(remote)) {
        if (!byId[id] || !record || typeof record!=='object') continue;
        const local=progress[id];
        if (!local || (Number(record.updatedAt)||0)>(Number(local.updatedAt)||0)) progress[id]=record;
      }
      for (const [id,record] of Object.entries(progress)) {
        if (!byId[id] || !record || typeof record!=='object') continue;
        const cloud=remote[id];
        if (!cloud || (Number(record.updatedAt)||0)>(Number(cloud.updatedAt)||0)) upload.push([id,record]);
      }
      persist(false);render();
      return upload;
    },
    clear() {
      progress={};drafts={};stage={};
      try {localStorage.removeItem(storeKey);} catch {}
      render();
    }
  };
  $('#menu-button').addEventListener('click',()=>{const sidebar=$('#sidebar');sidebar.classList.toggle('open');$('#menu-button').setAttribute('aria-expanded',sidebar.classList.contains('open'));});
  render();
})();
