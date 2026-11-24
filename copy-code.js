/* ============================================================
   コードをコピー（01〜10：そのエフェクトだけで動く単体HTMLを作る）
   ============================================================ */
(function(){
  var META = {
"glitch": {
"name": "01 グリッチ",
"stage": "<div class=\"stage\"><span class=\"glitch big\" id=\"fx-glitch\"><\/span><\/div>",
"call": "glitchText(document.getElementById('fx-glitch'), TEXT);",
"usesText": true,
"css": "01",
"js": "01 グリッチ"
},
"neon": {
"name": "02 ネオンサイン",
"stage": "<div class=\"stage\"><span class=\"neon-wall\"><\/span><span class=\"neon big\" id=\"fx-neon\"><\/span><\/div>",
"call": "neonText(document.getElementById('fx-neon'), TEXT);",
"usesText": true,
"css": "02",
"js": "02 ネオン"
},
"particle": {
"name": "03 パーティクル集合",
"stage": "<div class=\"stage flush\"><canvas id=\"fx-particle\" aria-label=\"粒子が集まって文字になる演出\"><\/canvas><\/div>",
"call": "particleText(document.getElementById('fx-particle'), TEXT);",
"usesText": true,
"css": "",
"js": "03 パーティクル集合"
},
"matrix": {
"name": "04 マトリックス・リビール",
"stage": "<div class=\"stage flush\"><canvas id=\"fx-matrix\" aria-label=\"文字の雨が降って文字が確定する演出\"><\/canvas><\/div>",
"call": "matrixReveal(document.getElementById('fx-matrix'), TEXT);",
"usesText": true,
"css": "",
"js": "04 マトリックス・リビール"
},
"slot": {
"name": "05 スロットリール",
"stage": "<div class=\"stage\"><span class=\"reels big\" id=\"fx-slot\"><\/span><\/div>",
"call": "slotText(document.getElementById('fx-slot'), TEXT);",
"usesText": true,
"css": "05",
"js": "05 スロットリール"
},
"cube": {
"name": "06 キューブ回転",
"stage": "<div class=\"stage\"><span class=\"cubes big\" id=\"fx-cube\"><\/span><\/div>",
"call": "cubeText(document.getElementById('fx-cube'), TEXT);",
"usesText": true,
"css": "06",
"js": "06 キューブ回転"
},
"hand": {
"name": "07 手書きストローク",
"stage": "<div class=\"stage\"><div class=\"hand\" id=\"fx-hand\" style=\"width:100%\"><\/div><\/div>",
"call": "handText(document.getElementById('fx-hand'), TEXT);",
"usesText": true,
"css": "07",
"js": "07 手書きストローク"
},
"rise": {
"name": "08 せり上がり",
"stage": "<div class=\"stage\"><span class=\"rise big\" id=\"fx-rise\"><\/span><\/div>",
"call": "riseText(document.getElementById('fx-rise'), TEXT);",
"usesText": true,
"css": "08",
"js": "08 せり上がり"
},
"marker": {
"name": "09 蛍光マーカー強調",
"stage": "<div class=\"stage\"><p class=\"marker\" id=\"fx-marker\">蓄電池と太陽光発電設備を、<mark style=\"--d:.2s\">構想から運用まで<\/mark>ひとつの窓口で。<mark class=\"num\" style=\"--d:.9s\">137kWh<\/mark>の産業用から<mark class=\"num\" style=\"--d:1.4s\">2.7MWh<\/mark>クラスまで対応します。<\/p><\/div>",
"call": "markerPlay(document.getElementById('fx-marker'));",
"usesText": false,
"css": "09",
"js": "09 蛍光マーカー"
},
"vfd": {
"name": "10 蛍光表示管",
"stage": "<div class=\"stage flush\" style=\"background:#03080c\"><canvas id=\"fx-vfd\" aria-label=\"蛍光表示管風の表示\"><\/canvas><\/div>",
"call": "vfdText(document.getElementById('fx-vfd'), TEXT);",
"usesText": true,
"css": "",
"js": "10 蛍光表示管"
}
};
  var root = document.documentElement;
  /* ページの <style> と main.js から、必要な部分だけを切り出す */
  var SCRIPT = [];
  /* エフェクト本体の main.js を先に読み込んでおく（コピー時に必要な部分だけ切り出す） */
  fetch('main.js').then(function(r){ return r.text(); }).then(function(t){ SCRIPT = t.split('\n'); UTIL = jsBlock('共通ユーティリティ'); }).catch(function(){});
  var STYLE = document.querySelector('style').textContent.split('\n');
  var BAR = '/* ============================================================';
  function jsBlock(title){
    var starts = [];
    SCRIPT.forEach(function(l, i){ if (l.trim() === BAR) starts.push(i); });
    for (var k = 0; k < starts.length; k++){
      var i = starts[k];
      if ((SCRIPT[i + 1] || '').trim().indexOf(title) === 0) return SCRIPT.slice(i, starts[k + 1]).join('\n').replace(/\s+$/, '');
    }
    return '';
  }
  function cssBlock(no){
    if (!no) return '';
    var starts = [];
    STYLE.forEach(function(l, i){ if (l.indexOf('/* ===== ') === 0) starts.push(i); });
    for (var k = 0; k < starts.length; k++){
      if (STYLE[starts[k]].indexOf('/* ===== ' + no) === 0) return STYLE.slice(starts[k], starts[k + 1]).join('\n').trim();
    }
    return '';
  }
  var UTIL = jsBlock('共通ユーティリティ');
  function currentText(){
    var on = document.querySelector('[data-text].on');
    var inp = document.getElementById('textInput');
    if (inp && inp.value.trim() && !on) return Array.from(inp.value.replace(/\s+/g,' ').trim()).slice(0,16).join('');
    return on ? on.getAttribute('data-text') : 'REALIZE 137kWh';
  }
  function build(fx){
    var m = META[fx];
    var e = {name:m.name, stage:m.stage, call:m.call, usesText:m.usesText, css:cssBlock(m.css), js:jsBlock(m.js)};
    var accent = getComputedStyle(root).getPropertyValue('--accent').trim() || '#d97721';
    var text = currentText();
    var S = '<' + '/script>';
    return [
      '<!DOCTYPE html>',
      '<html lang="ja">',
      '<head>',
      '<meta charset="UTF-8">',
      '<meta name="viewport" content="width=device-width, initial-scale=1">',
      '<title>' + e.name + '</title>',
      '<style>',
      ':root{--dark:#091d30;--well:#050e18;--accent:' + accent + ';--ink:#e9eef2;--ink-soft:#b7c4cf;--muted:#8fa3b2;',
      '  --font:Arial,"Noto Sans JP","Hiragino Kaku Gothic ProN","Yu Gothic",sans-serif}',
      '*{box-sizing:border-box;margin:0;padding:0}',
      'body{min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:20px;background:var(--well);color:var(--ink);font-family:var(--font);line-height:1.8}',
      '.stage{position:relative;width:min(900px,100%);min-height:240px;display:flex;align-items:center;justify-content:center;padding:36px 28px;overflow:hidden;text-align:center}',
      '.stage canvas{display:block;width:100%;height:240px}',
      '.stage.flush{padding:0}',
      '.big{font-size:clamp(34px,4.6vw,58px);font-weight:700;line-height:1.3;letter-spacing:.04em;white-space:nowrap}',
      '#replay{border:1px solid rgba(255,255,255,.25);background:transparent;color:var(--ink-soft);padding:6px 16px;font:inherit;font-size:13px;cursor:pointer}',
      '#replay:hover{border-color:var(--accent);color:var(--accent)}',
      e.css,
      '@media (prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}',
      '</style>',
      '</head>',
      '<body>',
      '',
      e.stage,
      '<button id="replay">もう一回 ↻</button>',
      '',
      '<script>',
      '(function(){',
      '  var root = document.documentElement;',
      "  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;",
      e.usesText ? '  var TEXT = ' + JSON.stringify(text) + ';   /* ← 表示する文字はここを変えてね */' : '',
      '',
      UTIL,
      '',
      e.js,
      '',
      '  function run(){ ' + e.call + ' }',
      "  document.getElementById('replay').addEventListener('click', run);",
      '  run();',
      '})();',
      S,
      '</body>',
      '</html>',
      ''
    ].join('\n');
  }
  function copyText(s){
    if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(s);
    return new Promise(function(ok, ng){
      var ta = document.createElement('textarea');
      ta.value = s; ta.setAttribute('readonly', ''); ta.style.cssText = 'position:fixed;top:-1000px;opacity:0';
      document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy') ? ok() : ng(); } catch(err){ ng(err); }
      document.body.removeChild(ta);
    });
  }
  document.getElementById('grid').addEventListener('click', function(ev){
    var b = ev.target.closest('button.copy'); if (!b) return;
    var fx = b.closest('.card').getAttribute('data-fx');
    if (!META[fx]) return;
    var label = b.textContent;
    if (!SCRIPT.length){ b.textContent = '読み込み中…もう一度押してね'; setTimeout(function(){ b.textContent = label; }, 1400); return; }
    copyText(build(fx)).then(function(){
      b.textContent = 'コピーした ✓'; b.classList.add('done');
    }, function(){
      b.textContent = 'コピーできませんでした';
    }).then(function(){
      setTimeout(function(){ b.textContent = label; b.classList.remove('done'); }, 1400);
    });
  });
  window.__buildCode = build;   /* 動作確認用 */
})();
