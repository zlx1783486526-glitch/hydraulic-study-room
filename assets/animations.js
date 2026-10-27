(() => {
  'use strict';

  const scenes = {
    gear: {
      title: '齿轮泵：油从哪里进、往哪里走',
      intro: '看两齿轮脱开的一侧吸油、齿间沿壳体外周携油、啮合的一侧排油。蓝色虚线表示油的运动方向，中心啮合处不通油。',
      states: [
        {id:'suction', name:'① 吸油', note:'左侧轮齿脱开，密闭工作腔容积增大，入口形成低压；油箱中的油被外界压力推入。', equation:'吸油条件：工作腔容积增大 + 入口连油箱'},
        {id:'carry', name:'② 携油', note:'油被齿间与壳体围住，分别绕上、下外周输送；它不从两齿轮的中心啮合处穿过去。', equation:'理论流量 qₜ = 排量 V × 转速 n'},
        {id:'discharge', name:'③ 排油', note:'右侧轮齿啮合，工作腔容积减小，油被挤向出口。出口压力取决于负载，泵提供的是流量。', equation:'实际流量 q = ηᵥ V n'}
      ],
      lesson:'pump', questions:['short-18','calc-1','calc-2'],
      svg:
        '<svg viewBox="0 0 620 300" role="img" aria-label="齿轮泵剖面示意：左侧吸油，上下外周携油，右侧排油">' +
        '<defs><marker id="arr-gear" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M0 0 L7 3.5 L0 7" fill="#088a90"/></marker></defs>' +
        '<rect x="106" y="24" width="408" height="251" rx="42" fill="#f5faf7" stroke="#345667" stroke-width="4"/>' +
        '<path d="M16 150 H106 M514 150 H604" class="demo-pipe"/>' +
        '<path d="M27 150 H86" class="oil-path" data-show="suction,carry,discharge" marker-end="url(#arr-gear)"/>' +
        '<path d="M115 150 C109 55 195 32 310 34 C425 32 511 55 505 150" class="oil-path" data-show="carry,discharge" marker-end="url(#arr-gear)"/>' +
        '<path d="M115 150 C109 245 195 268 310 266 C425 268 511 245 505 150" class="oil-path" data-show="carry,discharge" marker-end="url(#arr-gear)"/>' +
        '<path d="M367 150 H586" class="oil-path" data-show="discharge" marker-end="url(#arr-gear)"/>' +
        '<g class="gear-a"><circle cx="310" cy="103" r="53" class="demo-metal"/><circle cx="310" cy="103" r="13" class="demo-hub"/><path d="M310 52 V65 M310 141 V154 M259 103 H272 M348 103 H361 M274 67 L283 76 M337 130 L346 139 M346 67 L337 76 M283 130 L274 139" class="gear-teeth"/></g>' +
        '<g class="gear-b"><circle cx="310" cy="197" r="53" class="demo-metal"/><circle cx="310" cy="197" r="13" class="demo-hub"/><path d="M310 146 V159 M310 235 V248 M259 197 H272 M348 197 H361 M274 161 L283 170 M337 224 L346 233 M346 161 L337 170 M283 224 L274 233" class="gear-teeth"/></g>' +
        '<text x="14" y="127" class="svg-label">入口 / 低压</text><text x="504" y="127" class="svg-label">出口 / 高压</text>' +
        '<text x="224" y="292" class="svg-small">齿间沿壳体外周输油</text></svg>'
    },
    diff: {
      title: '单杆缸：普通伸出与差动快进',
      intro: '切换接法，观察有杆腔回油是否回到无杆腔。两腔等压时差动净推力只按活塞杆面积算。',
      states: [
        {id:'normal', name:'普通伸出', note:'泵油进入无杆腔；有杆腔回油流回油箱。无杆腔面积 A₁ 决定伸出速度与理想推力。', equation:'v = q泵 / A₁；F = pA₁（回油背压忽略）'},
        {id:'differential', name:'差动快进', note:'有杆腔回油与泵油合流，重新进入无杆腔。要填满更大的无杆腔，泵只需补足活塞杆扫过的体积。', equation:'q泵 + A₂v = A₁v；v = q泵 / A杆；F = pA杆'},
        {id:'retract', name:'普通回退', note:'泵油进入有杆腔，无杆腔回油回箱；有效进油面积为环形面积 A₂。', equation:'v退 = q泵 / A₂；F退 = pA₂（回油背压忽略）'}
      ],
      lesson:'cylinder', questions:['short-17','short-38','circuit-28'],
      svg:
        '<svg viewBox="0 0 620 310" role="img" aria-label="单杆缸三种接法和油流方向示意">' +
        '<defs><marker id="arr-diff" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M0 0 L7 3.5 L0 7" fill="#088a90"/></marker></defs>' +
        '<rect x="103" y="91" width="321" height="106" rx="9" fill="#f5faf7" stroke="#345667" stroke-width="4"/>' +
        '<g class="demo-piston"><rect x="232" y="96" width="21" height="96" fill="#668896" stroke="#345667" stroke-width="2"/><rect x="253" y="138" width="228" height="16" fill="#9bb4bd" stroke="#345667" stroke-width="2"/></g>' +
        '<path d="M135 197 V255 H75 M395 91 V42 H516 V255" class="demo-pipe"/>' +
        '<path d="M75 255 H135 V197" class="oil-path" data-show="normal,differential" marker-end="url(#arr-diff)"/>' +
        '<path d="M395 91 V42 H135 V91" class="oil-path warm" data-show="differential" marker-end="url(#arr-diff)"/>' +
        '<path d="M395 91 V42 H516 V255" class="oil-path warm" data-show="normal" marker-end="url(#arr-diff)"/>' +
        '<path d="M75 255 H516 V42 H395 V91" class="oil-path" data-show="retract" marker-end="url(#arr-diff)"/>' +
        '<path d="M135 197 V255 H54" class="oil-path warm" data-show="retract" marker-end="url(#arr-diff)"/>' +
        '<text x="53" y="286" class="svg-label">泵 q</text><text x="496" y="286" class="svg-label">油箱</text>' +
        '<text x="134" y="127" class="svg-label">无杆腔 A₁</text><text x="324" y="126" class="svg-label">有杆腔 A₂</text>' +
        '<text x="276" y="224" class="svg-small">A杆 = A₁ − A₂</text></svg>'
    },
    relief: {
      title: '先导式溢流阀：小流量先导，大流量主阀',
      intro: '按时间顺序看压力达到设定值后，阻尼孔如何形成压差，再由主阀承担大流量溢流。',
      states: [
        {id:'closed', name:'① 未到设定压', note:'先导阀关闭；主阀上、下腔经阻尼孔近似同压，主阀弹簧使主阀保持关闭。', equation:'p泵 < p设定；主阀关闭'},
        {id:'pilot', name:'② 先导阀开启', note:'入口压力克服先导弹簧，少量油经阻尼孔和先导阀回箱；阻尼孔上出现压降。', equation:'主阀下腔压力 > 主阀上腔压力'},
        {id:'main', name:'③ 主阀溢流', note:'压差推动主阀打开，大流量从压力油路回油箱，限制系统最高压力。主阀弹簧主要负责复位。', equation:'p泵 ≈ p设定；多余流量经主阀回箱'}
      ],
      lesson:'valves', questions:['short-8','short-10','short-20','short-26'],
      svg:
        '<svg viewBox="0 0 620 310" role="img" aria-label="先导式溢流阀从关闭到先导开启再到主阀溢流的过程示意">' +
        '<defs><marker id="arr-relief" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M0 0 L7 3.5 L0 7" fill="#088a90"/></marker></defs>' +
        '<path d="M55 175 H552 M286 175 V257 H500" class="demo-pipe"/>' +
        '<path d="M55 175 H552" class="oil-path" data-show="closed,pilot,main" marker-end="url(#arr-relief)"/>' +
        '<path d="M286 175 V257 H500" class="oil-path" data-show="main" marker-end="url(#arr-relief)"/>' +
        '<path d="M250 175 V75 H455 V257 H500" class="demo-pipe pilot-pipe"/>' +
        '<path d="M250 175 V75 H455 V257 H500" class="oil-path warm" data-show="pilot,main" marker-end="url(#arr-relief)"/>' +
        '<rect x="235" y="113" width="30" height="25" rx="3" fill="#fff7df" stroke="#9e7d39" stroke-width="2"/>' +
        '<text x="184" y="109" class="svg-small">阻尼孔</text>' +
        '<rect x="266" y="209" width="40" height="24" rx="4" class="demo-metal main-spool"/>' +
        '<path d="M286 235 v12 m-13 -10 26 8 -26 8 26 8" fill="none" stroke="#5d7785" stroke-width="2"/>' +
        '<circle cx="455" cy="111" r="21" class="demo-metal"/><path d="M445 111 H465 M455 101 V121" stroke="#345667" stroke-width="2"/>' +
        '<text x="390" y="55" class="svg-label">先导阀 / 调压弹簧</text>' +
        '<text x="268" y="200" class="svg-label">主阀</text><text x="18" y="154" class="svg-label">泵 / 压力油</text><text x="489" y="284" class="svg-label">油箱</text></svg>'
    },
    circuit28: {
      title: '原题回路 28：快进 → 中速 → 慢速 → 快退 → 停止',
      intro: '下图就是 PDF 第 41 页的原题图。亮起的线圈表示得电；逐段观察换向、差动回流，以及经一只或两只调速阀的回油路线。',
      states: [
        {id:'fast', name:'快进', coils:['1Y','3Y'], note:'1Y、3Y 得电。泵经主阀 4 左位进缸左腔；缸右腔回油经主阀和阀 3 合流入左腔，形成差动快进。', equation:'1Y/2Y/3Y/4Y = + − + −；回油合流，快进'},
        {id:'medium', name:'中速', coils:['1Y'], note:'保持前进方向，关闭差动旁路；回油经调速阀 6，再经阀 8 旁通调速阀 7 回箱。', equation:'1Y/2Y/3Y/4Y = + − − −；一只调速阀'},
        {id:'slow', name:'慢速', coils:['1Y','4Y'], note:'保持前进方向，阀 8 切断旁路；回油依次经调速阀 6、7 回箱，流量更小。', equation:'1Y/2Y/3Y/4Y = + − − +；两只调速阀'},
        {id:'return', name:'快退', coils:['2Y'], note:'2Y 得电使主阀 4 换向，泵油进入缸右腔，缸左腔回油；活塞向左快速退回。', equation:'1Y/2Y/3Y/4Y = − + − −'},
        {id:'stop', name:'停止', coils:[], note:'全部电磁铁断电，主阀回中位，液压缸停止。中位符号及实际卸荷情况要以原图为准。', equation:'1Y/2Y/3Y/4Y = − − − −'}
      ],
      lesson:'systems', questions:['circuit-28'],
      svg:
        '<div class="original-circuit"><img src="assets/figures/circuit-28-1.webp" alt="回路分析第28题原始油路图，阀和线圈编号保持原样" loading="lazy">' +
        '<svg viewBox="0 0 687 420" role="img" aria-label="原图中当前得电的电磁铁位置">' +
        '<rect x="61" y="141" width="37" height="25" rx="4" class="coil-hot" data-coil="1Y"/>' +
        '<rect x="313" y="141" width="37" height="25" rx="4" class="coil-hot" data-coil="2Y"/>' +
        '<rect x="288" y="304" width="26" height="30" rx="4" class="coil-hot" data-coil="3Y"/>' +
        '<rect x="489" y="257" width="24" height="40" rx="4" class="coil-hot" data-coil="4Y"/>' +
        '</svg></div>' +
        '<div class="circuit-legend"><span>● 得电线圈</span><span>原题图保留阀号 1—9</span></div>'
    }
  };

  const lessonScene = {pump:{1:'gear'},cylinder:{2:'diff'},valves:{2:'relief'},systems:{2:'circuit28'}};
  const questionScene = Object.fromEntries(Object.entries(scenes).flatMap(([scene, value]) => value.questions.map(id => [id,scene])));
  const circuitRoutes = {
    fast:[['泵 1','主阀 4 左位','缸左腔'],['缸右腔','主阀 4','阀 3','合流入左腔']],
    medium:[['泵 1','主阀 4 左位','缸左腔'],['缸右腔','过滤器 9','调速阀 6','阀 8 旁路','油箱']],
    slow:[['泵 1','主阀 4 左位','缸左腔'],['缸右腔','过滤器 9','调速阀 6','调速阀 7','油箱']],
    return:[['泵 1','主阀 4 右位','缸右腔'],['缸左腔','主阀 4','油箱']],
    stop:[['全部线圈断电','主阀 4 中位','缸停止']]
  };
  let timer = null;

  function card(id, compact=false) {
    const scene=scenes[id];
    if (!scene) return '';
    const related=scene.questions.map(q => '<a href="#question/'+q+'">'+(q.startsWith('short-')?'简答题 ':q.startsWith('calc-')?'计算题 ':'回路题 ')+q.split('-')[1]+' →</a>').join('');
    return '<section class="demo-card'+(compact?' demo-compact':'')+'" data-demo="'+id+'" data-phase="'+scene.states[0].id+'" data-playing="false" aria-label="'+scene.title+'动态演示">' +
      '<div class="demo-heading"><div><span class="eyebrow">可交互油路动画</span><h3>'+scene.title+'</h3><p>'+scene.intro+'</p></div><span class="demo-indicator">'+(id==='circuit28'?'原题图':'原理示意')+'</span></div>' +
      '<div class="demo-visual">'+scene.svg+'</div>' +
      (id==='circuit28'?'<div class="demo-route"><strong>当前油流路线</strong><div class="demo-route-lines"></div></div>':'') +
      '<div class="demo-controls"><div class="demo-states" role="group" aria-label="切换动作阶段">'+scene.states.map((s,i)=>'<button type="button" data-demo-step="'+i+'" aria-pressed="'+(i===0)+'">'+s.name+'</button>').join('')+'</div><button type="button" class="demo-play" data-demo-play aria-label="自动播放动画">▶ 自动播放</button></div>' +
      '<div class="demo-caption" aria-live="polite"><strong class="demo-state-name"></strong><p class="demo-note"></p><div class="demo-equation"></div></div>' +
      '<div class="demo-links"><span>边看边做：</span>'+related+'</div></section>';
  }
  function setState(element,index) {
    const scene=scenes[element.dataset.demo];
    if(!scene) return;
    const state=scene.states[(index+scene.states.length)%scene.states.length];
    element.dataset.phase=state.id;
    element.querySelectorAll('[data-demo-step]').forEach((button,i)=>button.setAttribute('aria-pressed',String(scene.states[i].id===state.id)));
    element.querySelector('.demo-state-name').textContent=state.name;
    element.querySelector('.demo-note').textContent=state.note;
    element.querySelector('.demo-equation').textContent=state.equation;
    element.querySelectorAll('[data-show]').forEach(path => path.classList.toggle('is-live',path.dataset.show.split(',').includes(state.id)));
    element.querySelectorAll('[data-coil]').forEach(coil => coil.classList.toggle('is-live',(state.coils||[]).includes(coil.dataset.coil)));
    const routeBox=element.querySelector('.demo-route-lines');
    if(routeBox) {
      routeBox.replaceChildren();
      (circuitRoutes[state.id]||[]).forEach((nodes,lineIndex)=>{
        const line=document.createElement('div');
        line.className='demo-route-line';
        const label=document.createElement('b');
        label.textContent=lineIndex===0?'进油':'回油';
        line.appendChild(label);
        nodes.forEach((node,i)=>{
          if(i){const arrow=document.createElement('span');arrow.className='route-arrow';arrow.textContent='→';arrow.setAttribute('aria-hidden','true');line.appendChild(arrow);}
          const pill=document.createElement('span');
          pill.className='route-node';
          pill.textContent=node;
          line.appendChild(pill);
        });
        routeBox.appendChild(line);
      });
    }
    element.dataset.step=String(scene.states.indexOf(state));
  }
  function stop() {
    if(timer) clearInterval(timer);
    timer=null;
    document.querySelectorAll('[data-demo]').forEach(element => {
      element.dataset.playing='false';
      const play=element.querySelector('[data-demo-play]');
      if(play) play.textContent='▶ 自动播放';
    });
  }
  function mountAll() {
    stop();
    document.querySelectorAll('[data-demo]').forEach(element=>setState(element,0));
  }
  function handleClick(target) {
    const step=target.closest('[data-demo-step]');
    const play=target.closest('[data-demo-play]');
    if(!step&&!play) return false;
    const element=(step||play).closest('[data-demo]');
    if(!element) return false;
    if(step) {
      stop();
      setState(element,Number(step.dataset.demoStep));
    } else if(element.dataset.playing==='true') {
      stop();
    } else {
      stop();
      element.dataset.playing='true';
      play.textContent='❚❚ 暂停';
      timer=setInterval(()=>{
        if(!element.isConnected){stop();return;}
        setState(element,Number(element.dataset.step||0)+1);
      },2600);
    }
    return true;
  }
  window.HYDRAULIC_ANIMATIONS={scenes,lessonScene,questionScene,card,mountAll,handleClick,stop};
})();
