(function(){
  var root = document.documentElement;
  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var state = { text:'REALIZE 137kWh' };

  /* ============================================================
     共通ユーティリティ
     ============================================================ */
  var DIG = '0123456789';
  var LAT = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  var KANA = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワン';
  function setFor(c){
    if (/[0-9]/.test(c)) return DIG;
    if (/[A-Za-z]/.test(c)) return LAT;
    return KANA;
  }
  function rnd(set){ return set[Math.floor(Math.random() * set.length)]; }
  function chars(s){ return Array.from(s); }              /* 絵文字・サロゲートも1文字扱い */
  function esc(c){ return c.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
  function accent(){ return getComputedStyle(root).getPropertyValue('--accent').trim() || '#d97721'; }
  var FONT = '"Noto Sans JP","Hiragino Kaku Gothic ProN","Yu Gothic",Arial,sans-serif';
  /* キャンバスをCSSサイズ×端末の解像度に合わせる */
  function fitCanvas(cv, h){
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = cv.parentNode.clientWidth;
    cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
    cv.style.height = h + 'px';
    var g = cv.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0);
    return {g:g, w:w, h:h};
  }
  /* .big の文字を1行に収める（文字ならmeasure、マス目系はマス数で計算） */
  var _mc = document.createElement('canvas').getContext('2d');
  function fitBig(el, text, cellEm){
    var avail = el.closest('.stage').clientWidth - 56, max = 58, fs;
    if (cellEm){ fs = avail / (chars(text).length * cellEm); }
    else { _mc.font = '900 100px ' + FONT; fs = avail * 100 / (_mc.measureText(text).width * 1.1 || 1); }
    el.style.fontSize = Math.max(16, Math.min(max, fs)) + 'px';
  }
  /* 横幅に収まるフォントサイズを計算 */
  function fitFont(g, text, maxW, maxH, weight){
    var fs = 100;
    g.font = (weight || 'bold') + ' ' + fs + 'px ' + FONT;
    var mw = g.measureText(text).width || 1;
    return Math.max(12, Math.min(maxH, fs * maxW / mw));
  }

  /* ============================================================
     01 グリッチ
     ============================================================ */
  var glitchLoop = null;
  function glitchText(el, text){
    clearTimeout(glitchLoop);
    fitBig(el, text);
    el.textContent = text; el.setAttribute('data-text', text);
    if (reduced) return;
    function burst(ms, scramble){
      el.classList.add('on');
      var cs = chars(text), timer = null;
      if (scramble){
        timer = setInterval(function(){
          var out = cs.map(function(c){ return c !== ' ' && Math.random() < .28 ? rnd(setFor(c)) : c; }).join('');
          el.textContent = out; el.setAttribute('data-text', out);
        }, 60);
      }
      setTimeout(function(){
        clearInterval(timer);
        el.classList.remove('on'); el.textContent = text; el.setAttribute('data-text', text);
      }, ms);
    }
    burst(1000, true);
    (function next(){
      glitchLoop = setTimeout(function(){
        if (el._visible !== false) burst(120 + Math.random() * 220, Math.random() < .5);
        next();
      }, 1900 + Math.random() * 2600);
    })();
  }

  /* ============================================================
     02 ネオン
     ============================================================ */
  function neonText(el, text){
    var cs = chars(text);
    if (el.classList.contains('big')) fitBig(el, text);
    var buzzAt = -1, tries = 0;
    while (tries++ < 20){ var k = Math.floor(Math.random() * cs.length); if (cs[k] !== ' '){ buzzAt = k; break; } }
    el.innerHTML = cs.map(function(c, i){
      var d = (i * 0.09 + Math.random() * 0.35).toFixed(2);
      return '<span style="--d:' + d + 's"' + (i === buzzAt ? ' class="buzz"' : '') + '>' + (c === ' ' ? '&nbsp;' : esc(c)) + '</span>';
    }).join('');
    el.classList.remove('go'); void el.offsetWidth; el.classList.add('go');
  }

  /* ============================================================
     03 パーティクル集合
     ============================================================ */
  var P = {parts:[], raf:0, mouse:null};
  function particleText(cv, text){
    var c = fitCanvas(cv, 240), g = c.g;
    var off = document.createElement('canvas'), og = off.getContext('2d');
    off.width = Math.round(c.w); off.height = c.h;
    var fs = fitFont(og, text, c.w * 0.88, c.h * 0.5);
    og.font = 'bold ' + fs + 'px ' + FONT;
    og.textAlign = 'center'; og.textBaseline = 'middle'; og.fillStyle = '#fff';
    og.fillText(text, c.w / 2, c.h / 2);
    var gap = Math.max(2, Math.round(fs / 20));
    var data = og.getImageData(0, 0, off.width, off.height).data, pts = [];
    for (var y = 0; y < off.height; y += gap)
      for (var x = 0; x < off.width; x += gap)
        if (data[(y * off.width + x) * 4 + 3] > 128) pts.push([x, y]);
    /* 既存の粒を使い回す（形が変わる時に流れるように移動） */
    var parts = P.parts;
    pts.forEach(function(pt, i){
      var p = parts[i];
      if (!p){ p = parts[i] = {x:Math.random() * c.w, y:Math.random() * c.h, vx:0, vy:0}; }
      else if (!reduced){ p.x = Math.random() * c.w; p.y = Math.random() * c.h; }
      p.tx = pt[0]; p.ty = pt[1]; p.dead = false; p.delay = Math.random() * 30; p.size = gap * 0.36;
      if (reduced){ p.x = p.tx; p.y = p.ty; }
    });
    for (var j = pts.length; j < parts.length; j++) parts[j].dead = true;
    parts.length = Math.max(pts.length, 0);
    cancelAnimationFrame(P.raf);
    var frame = 0;
    function draw(){
      frame++;
      g.clearRect(0, 0, c.w, c.h);
      var a = accent();
      g.fillStyle = a;
      for (var i = 0; i < parts.length; i++){
        var p = parts[i];
        if (frame > p.delay){
          var ax = (p.tx - p.x) * 0.045, ay = (p.ty - p.y) * 0.045;
          if (P.mouse){
            var dx = p.x - P.mouse.x, dy = p.y - P.mouse.y, d2 = dx * dx + dy * dy;
            if (d2 < 2200){ var f = (2200 - d2) / 2200 * 2.4; var d = Math.sqrt(d2) || 1; ax += dx / d * f; ay += dy / d * f; }
          }
          p.vx = (p.vx + ax) * 0.8; p.vy = (p.vy + ay) * 0.8;
          p.x += p.vx; p.y += p.vy;
        }
        g.fillRect(p.x - p.size, p.y - p.size, p.size * 2, p.size * 2);
      }
      if (!reduced && cv._visible !== false) P.raf = requestAnimationFrame(draw);
      else if (!reduced) P.raf = setTimeout(function(){ P.raf = requestAnimationFrame(draw); }, 300);
    }
    draw();
    cv.onpointermove = function(e){ var r = cv.getBoundingClientRect(); P.mouse = {x:e.clientX - r.left, y:e.clientY - r.top}; };
    cv.onpointerleave = function(){ P.mouse = null; };
  }

  /* ============================================================
     04 マトリックス・リビール
     ============================================================ */
  var M = {raf:0};
  function matrixReveal(cv, text){
    cancelAnimationFrame(M.raf); clearTimeout(M.to);
    var c = fitCanvas(cv, 240), g = c.g;
    var cs = chars(text);
    var cell = Math.min(46, Math.floor((c.w * 0.9) / cs.length));
    var rows = Math.ceil(c.h / cell) + 1;
    var startX = (c.w - cell * cs.length) / 2;
    var baseRow = Math.floor(rows * 0.55);
    /* 文字の列＋左右の飾りの列 */
    var cols = [];
    var extra = Math.ceil(startX / cell);
    for (var i = -extra; i < cs.length + extra; i++){
      var t = (i >= 0 && i < cs.length) ? cs[i] : null;
      cols.push({x:startX + i * cell, ch:t, row:-Math.floor(Math.random() * 12) - (t ? i % 3 : 0), locked:!t || t === ' ', target:t, flash:0, deco:!t || t === ' '});
    }
    g.fillStyle = '#050e18'; g.fillRect(0, 0, c.w, c.h);
    var last = 0;
    function tick(ts){
      if (ts - last > 55){
        last = ts;
        g.fillStyle = 'rgba(5,14,24,.22)'; g.fillRect(0, 0, c.w, c.h);
        g.font = 'bold ' + Math.round(cell * 0.78) + 'px ' + FONT;
        g.textAlign = 'center'; g.textBaseline = 'middle';
        var a = accent();
        cols.forEach(function(col){
          col.row++;
          var y = col.row * cell + cell / 2;
          if (!col.locked && col.row >= baseRow){ col.locked = true; col.flash = 6; col.row = baseRow; }
          if (col.row >= 0){
            g.globalAlpha = col.deco || col.locked ? 0.35 : 1;
            g.fillStyle = col.locked ? a : '#e9fff4';
            if (!(col.locked && !col.deco && col.row === baseRow)) g.fillText(rnd(KANA + DIG), col.x + cell / 2, y);
            g.globalAlpha = 1;
          }
          if (col.row * cell > c.h + cell * 6) col.row = -Math.floor(Math.random() * 14);
        });
        /* 確定した文字は毎フレーム上書きしてくっきり保つ */
        cols.forEach(function(col){
          if (!col.locked || col.deco) return;
          var y = baseRow * cell + cell / 2;
          g.fillStyle = '#050e18'; g.fillRect(col.x + 1, y - cell / 2 + 1, cell - 2, cell - 2);
          g.font = 'bold ' + Math.round(cell * 0.82) + 'px ' + FONT;
          g.shadowColor = a; g.shadowBlur = col.flash > 0 ? 18 : 6;
          g.fillStyle = col.flash > 0 ? '#ffffff' : a;
          g.fillText(col.target, col.x + cell / 2, y);
          g.shadowBlur = 0;
          if (col.flash > 0) col.flash--;
          g.font = 'bold ' + Math.round(cell * 0.78) + 'px ' + FONT;
        });
      }
      if (cv._visible !== false) M.raf = requestAnimationFrame(tick);
      else M.to = setTimeout(function(){ M.raf = requestAnimationFrame(tick); }, 300);
    }
    if (reduced){
      cols.forEach(function(col){ col.locked = true; col.flash = 0; });
      g.fillStyle = '#050e18'; g.fillRect(0, 0, c.w, c.h);
      g.font = 'bold ' + Math.round(cell * 0.82) + 'px ' + FONT; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = accent();
      cols.forEach(function(col){ if (!col.deco) g.fillText(col.target, col.x + cell / 2, baseRow * cell + cell / 2); });
      return;
    }
    M.raf = requestAnimationFrame(tick);
  }

  /* ============================================================
     05 スロットリール
     ============================================================ */
  function slotText(el, text){
    var cs = chars(text);
    fitBig(el, text, 1.04);
    el.innerHTML = '';
    var reels = cs.map(function(c, i){
      var r = document.createElement('span');
      if (c === ' '){ r.className = 'reel sp'; el.appendChild(r); return null; }
      r.className = 'reel';
      var n = 14 + i * 3, set = setFor(c), h = '';
      for (var k = 0; k < n; k++) h += '<i>' + esc(rnd(set)) + '</i>';
      h += '<i>' + esc(c) + '</i>';
      var strip = document.createElement('span'); strip.className = 'strip'; strip.innerHTML = h;
      r.appendChild(strip); el.appendChild(r);
      return {r:r, strip:strip, n:n, i:i};
    }).filter(Boolean);
    if (reduced){ reels.forEach(function(o){ o.strip.style.transform = 'translateY(' + (-o.n * 1.25) + 'em)'; o.r.classList.add('done'); }); return; }
    requestAnimationFrame(function(){ requestAnimationFrame(function(){
      reels.forEach(function(o, k){
        var dur = 1100 + k * 160;
        o.strip.style.transition = 'transform ' + dur + 'ms cubic-bezier(.12,.75,.25,1.06)';
        o.strip.style.transform = 'translateY(' + (-o.n * 1.25) + 'em)';
        setTimeout(function(){ o.r.classList.add('done'); }, dur);
      });
    }); });
  }

  /* ============================================================
     06 キューブ回転
     ============================================================ */
  function cubeText(el, text){
    var cs = chars(text);
    fitBig(el, text, 1.08);
    el.innerHTML = '';
    cs.forEach(function(c, i){
      var cube = document.createElement('span');
      cube.className = 'cube' + (c === ' ' ? ' sp' : '');
      cube.innerHTML = '<span class="box"><span class="f front"></span><span class="f under"></span></span>';
      el.appendChild(cube);
      if (c === ' ') return;
      var box = cube.firstChild, front = box.children[0], under = box.children[1];
      var seq = [], set = setFor(c);
      for (var k = 0; k < 2 + Math.floor(i * 0.6); k++) seq.push(rnd(set));
      seq.push(c);
      front.textContent = rnd(set);
      if (reduced){ front.textContent = c; cube.classList.add('fin'); return; }
      var step = 0;
      function roll(){
        under.textContent = seq[step];
        box.classList.add('roll');
        setTimeout(function(){
          front.textContent = seq[step];
          box.classList.remove('roll');
          step++;
          if (step < seq.length) setTimeout(roll, 40);
          else cube.classList.add('fin');
        }, 210);
      }
      setTimeout(roll, i * 70);
    });
  }

  /* ============================================================
     07 手書きストローク
     ============================================================ */
  function handText(el, text){
    var NS = 'http://www.w3.org/2000/svg';
    el.innerHTML = '';
    var svg = document.createElementNS(NS, 'svg');
    var t = document.createElementNS(NS, 'text');
    t.setAttribute('x', '0'); t.setAttribute('y', '0');
    t.setAttribute('font-size', '100');
    t.setAttribute('font-family', FONT);
    t.textContent = text;
    svg.appendChild(t); el.appendChild(svg);
    var b = t.getBBox();
    var pad = 6;
    svg.setAttribute('viewBox', (b.x - pad) + ' ' + (b.y - pad) + ' ' + (b.width + pad * 2) + ' ' + (b.height + pad * 2));
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    var len = 1800;
    t.style.strokeDasharray = len; t.style.strokeDashoffset = len;
    el.style.setProperty('--dur', Math.min(4, 1.6 + chars(text).length * 0.12) + 's');
    if (reduced){ t.style.strokeDashoffset = 0; t.style.fill = 'var(--ink)'; return; }
    el.classList.remove('go'); void el.offsetWidth; el.classList.add('go');
  }

  /* ============================================================
     08 せり上がり（数字は自動で強調）
     ============================================================ */
  function riseText(el, text){
    var cs = chars(text);
    if (el.classList.contains('big')) fitBig(el, text);
    el.innerHTML = cs.map(function(c, i){
      var isNum = /[0-9.]/.test(c) && (/[0-9]/.test(c) || /[0-9]/.test(cs[i - 1] || ''));
      return '<span class="m"><i' + (isNum ? ' class="n"' : '') + ' style="--d:' + (i * 0.045).toFixed(3) + 's">' + (c === ' ' ? '&nbsp;' : esc(c)) + '</i></span>';
    }).join('');
    el.classList.remove('go'); void el.offsetWidth;
    requestAnimationFrame(function(){ el.classList.add('go'); });
  }

  /* ============================================================
     09 蛍光マーカー（文章は固定。CSSだけで動く）
     ============================================================ */
  function markerPlay(el){ el.classList.remove('go'); void el.offsetWidth; requestAnimationFrame(function(){ el.classList.add('go'); }); }

  /* ============================================================
     10 蛍光表示管（VFD）
     ============================================================ */
  var V = {raf:0};
  function vfdText(cv, text){
    cancelAnimationFrame(V.raf);
    var c = fitCanvas(cv, 240), g = c.g;
    var ROWS = 16;
    var off = document.createElement('canvas'), og = off.getContext('2d');
    og.font = 'bold 15px ' + FONT;
    var tw = Math.ceil(og.measureText(text).width) + 4;
    off.width = tw; off.height = ROWS;
    og.font = 'bold 15px ' + FONT; og.fillStyle = '#fff'; og.textBaseline = 'middle';
    og.fillText(text, 2, ROWS / 2 + 1);
    var data = og.getImageData(0, 0, tw, ROWS).data;
    var cell = Math.max(3, Math.min(9, Math.floor((c.w - 40) / tw)));
    var cols = Math.floor((c.w - 24) / cell);
    var ox = Math.round((c.w - cols * cell) / 2), oy = Math.round((c.h - ROWS * cell) / 2);
    var shift = Math.floor((cols - tw) / 2);
    function on(x, y){ var sx = x - shift; return sx >= 0 && sx < tw && data[(y * tw + sx) * 4 + 3] > 100; }
    var t0 = null, dur = reduced ? 0 : 1100;
    function draw(ts){
      if (t0 === null) t0 = ts;
      var p = dur ? Math.min(1, (ts - t0) / dur) : 1;
      var scan = Math.floor(p * (cols + 6));
      g.fillStyle = '#03080c'; g.fillRect(0, 0, c.w, c.h);
      for (var x = 0; x < cols; x++){
        for (var y = 0; y < ROWS; y++){
          var lit = on(x, y) && x <= scan;
          var px = ox + x * cell, py = oy + y * cell;
          if (lit){
            g.fillStyle = Math.abs(x - scan) < 2 && p < 1 ? '#e8fffa' : '#5cf2d2';
            g.shadowColor = '#3fe0c0'; g.shadowBlur = cell * 1.2;
          } else {
            g.fillStyle = 'rgba(92,242,210,.07)'; g.shadowBlur = 0;
          }
          g.fillRect(px + 1, py + 1, cell - 2, cell - 2);
        }
      }
      g.shadowBlur = 0;
      /* 走査線 */
      if (p < 1){ g.fillStyle = 'rgba(160,255,235,.18)'; g.fillRect(ox + scan * cell, oy - 6, cell, ROWS * cell + 12); }
      /* 前面のメッシュ */
      g.fillStyle = 'rgba(0,0,0,.25)';
      for (var my = oy; my < oy + ROWS * cell; my += 3) g.fillRect(ox, my, cols * cell, 1);
      if (p < 1) V.raf = requestAnimationFrame(draw);
    }
    V.raf = requestAnimationFrame(draw);
  }

  /* ============================================================
     長文用エフェクト：中身（見出し＋段落）の生成と入力反映
     ============================================================ */
  var LT = {
    lead: '蓄電池と太陽光発電設備を、構想から運用までひとつの窓口で。',
    lines: [
      '設備の設置に必要な8項目—設計・施工・保守ほか—をチームで対応します。',
      '導入済みの137kWh設備から、外部蓄電池の余剰を使って、無駄なく運用しています。',
      '契約から数年先までの運用計画も、まとめてご相談ください。'
    ],
    /* 長文用サンプルの差し替え。全行の文末表現はそのまま残す。 */
    custom: ''
  };
  var LONG_TARGETS = ['fx-fk','fx-wp','fx-bl','fx-hv','fx-bd','fx-tl','fx-mq','fx-un'];
  function ltRender(){
    var lead = LT.custom || LT.lead;
    var lines = LT.custom ? [LT.custom] : LT.lines;
    var pgs = [];
    if (!LT.custom) pgs.push('<p class="lead">' + lead + '</p>');
    else pgs.push('<p class="lead">' + lead + '</p>');
    lines.forEach(function(s, i){
      pgs.push('<p style="--i:' + (i + 1) + '">' + s + '</p>');
    });
    LONG_TARGETS.forEach(function(id){
      var el = document.getElementById(id);
      if (!el) return;
      var keepLead = id === 'fx-hv' || id === 'fx-un';
      var html = keepLead ? pgs.join('') : pgs.filter(function(_, k){ return k > 0; }).join('');
      if (!LT.custom && id === 'fx-mq'){
        html = '<p style="--i:0"><span class="lead">' + lead + '</span></p>' +
          '<p style="--i:1">' + lines[0].replace('8項目','<mark>8項目</mark>').replace('137kWh','<span class="num">137kWh</span>') + '</p>' +
          '<p style="--i:2">' + lines[1].replace('余剰','<mark>余剰</mark>').replace('無駄なく','<span class="num">無駄なく</span>') + '</p>' +
          '<p style="--i:3">' + lines[2].replace('数年先','<mark>数年先</mark>') + '</p>';
      }
      el.innerHTML = html;
    });
    /* 14 キネ字（短い文を単語ごとに） */
    var kinEl = document.getElementById('fx-kin');
    if (kinEl){
      var w = (LT.custom || '構想から運用まで、ひとつの窓口で対応します。').split(/[、。\s]+/).filter(Boolean);
      kinEl.innerHTML = w.map(function(s, i){
        var hot = /\d/.test(s) || /^[無蓄余適]/.test(s);
        return '<span' + (hot ? ' class="hot"' : '') + ' style="--i:' + i + '">' + esc(s) + '。</span>';
      }).join('');
    }
    /* 16 タイピング */
    var typeEl = document.getElementById('fx-type');
    if (typeEl){
      TYPE.s1 = (LT.custom || 'RA-12 蓄電池の運用手順について');
      TYPE.s2 = (LT.custom || '137kWhの設備は、余剰電力を回収して無駄なく運用します。');
    }
    var shp = document.getElementById('fx-shp-body');
    if (shp) shp.innerHTML = (LT.custom || '契約から数年先までの運用計画も、まとめてご相談ください。');
    var bx = document.getElementById('fx-box-body');
    if (bx) bx.innerHTML = '<b>ご注意、</b>' + (LT.custom || '設置には現地調査が必要です。申請の関係で1ヶ月ほどお時間をいただく場合があります。');
  }

  /* ============================================================
     11〜15・17〜20 長文エフェクトの再生（CSSトランジション）
     ============================================================ */
  function restart(el){ el.classList.remove('go'); void el.offsetWidth; requestAnimationFrame(function(){ el.classList.add('go'); }); }
  function fkPlay(){ restart($('fx-fk')); }
  function wpPlay(){ restart($('fx-wp')); }
  function blPlay(){ restart($('fx-bl')); }
  function hvPlay(){ restart($('fx-hv')); }
  function bdPlay(){ restart($('fx-bd')); }
  function tlPlay(){ restart($('fx-tl')); }
  function mqPlay(){ restart($('fx-mq')); }
  function unPlay(){ restart($('fx-un')); }
  function kinPlay(){ restart($('fx-kin')); }
  function shpPlay(){ restart($('fx-shp')); }
  function boxPlay(){ restart($('fx-box')); }

  /* 14 キネ字 -- 16 タイピング */
  var TYPE = {s1:'RA-12 蓄電池の運用手順について', s2:'137kWhの設備は、余剰電力を回収して無駄なく運用します。', to:null, done:false};
  function typePlay(){
    clearTimeout(TYPE.to);
    var el = $('fx-type');
    var a = TYPE.s1, b = TYPE.s2;
    el.innerHTML = '<span class="tl1"></span>\n<span class="ty"></span>';
    var l1 = el.firstChild, l2 = el.lastChild;
    var i = 0, j = 0;
    if (reduced){ l1.textContent = a; l2.textContent = b; return; }
    (function ta(){
      i++; l1.textContent = a.slice(0, i);
      if (i < a.length){ TYPE.to = setTimeout(ta, 45 + Math.random() * 55); }
      else setTimeout(tb, 260);
    })();
    function tb(){
      j++; l2.textContent = b.slice(0, j);
      if (j < b.length) TYPE.to = setTimeout(tb, 40 + Math.random() * 60);
    }
  }

  /* ============================================================
     実行・再生管理
     ============================================================ */
  var $ = function(id){ return document.getElementById(id); };
  var runners = {
    glitch:  function(){ glitchText($('fx-glitch'), state.text); },
    neon:    function(){ neonText($('fx-neon'), state.text); },
    particle:function(){ particleText($('fx-particle'), state.text); },
    matrix:  function(){ matrixReveal($('fx-matrix'), state.text); },
    slot:    function(){ slotText($('fx-slot'), state.text); },
    cube:    function(){ cubeText($('fx-cube'), state.text); },
    hand:    function(){ handText($('fx-hand'), state.text); },
    rise:    function(){ riseText($('fx-rise'), state.text); },
    marker:  function(){ markerPlay($('fx-marker')); },
    vfd:     function(){ vfdText($('fx-vfd'), state.text); },
    /* --- 長文用エフェクト --- */
    fk:      function(){ fkPlay(); },
    wp:      function(){ wpPlay(); },
    bl:      function(){ blPlay(); },
    kin:     function(){ kinPlay(); },
    hv:      function(){ hvPlay(); },
    type:    function(){ typePlay(); },
    bd:      function(){ bdPlay(); },
    tl:      function(){ tlPlay(); },
    mq:      function(){ mqPlay(); },
    un:      function(){ unPlay(); },
    shp:     function(){ shpPlay(); },
    box:     function(){ boxPlay(); },
    game:    function(){ Game.init(); }
  };
  function play(name){ if (runners[name]) runners[name](); }
  function playAll(){
    document.querySelectorAll('.card').forEach(function(c){
      var n = c.getAttribute('data-fx');
      if (n === 'game') return;
      if (c._seen || !('IntersectionObserver' in window)) play(n);
    });
  }

  /* 画面に入ったら1回目を再生／見えていない時はキャンバスを休ませる */
  var cards = document.querySelectorAll('.card');
  if ('IntersectionObserver' in window){
    var io = new IntersectionObserver(function(es){
      es.forEach(function(e){
        var c = e.target, n = c.getAttribute('data-fx');
        var cv = c.querySelector('canvas'); if (cv) cv._visible = e.isIntersecting;
        var gl = c.querySelector('.glitch'); if (gl) gl._visible = e.isIntersecting;
        if (e.isIntersecting && !c._seen){ c._seen = true; play(n); }
      });
    }, {threshold:.3});
    cards.forEach(function(c){ io.observe(c); });
  } else { cards.forEach(function(c){ c._seen = true; }); setTimeout(function(){ playAll(); Game.init(); }, 0); }

  document.getElementById('grid').addEventListener('click', function(ev){
    var b = ev.target.closest('.replay'); if (!b || b.id === 'g-reset') return;
    var c = b.closest('.card'); c._seen = true;
    play(c.getAttribute('data-fx'));
  });
  $('replayAll').addEventListener('click', playAll);

  function group(attr, fn){
    var btns = Array.prototype.filter.call(document.querySelectorAll('[data-' + attr + ']'), function(b){ return b.tagName === 'BUTTON'; });
    btns.forEach(function(b){
      b.addEventListener('click', function(){
        btns.forEach(function(x){ x.classList.toggle('on', x === b); });
        fn(b.getAttribute('data-' + attr));
      });
    });
    return btns;
  }
  var textBtns = group('text', function(v){ state.text = v; $('textInput').value = ''; playAll(); });
  group('accent', function(v){ root.setAttribute('data-accent', v); });
  $('textInput').addEventListener('change', function(){
    var v = this.value.replace(/\s+/g, ' ').trim();
    if (!v) return;
    state.text = chars(v).slice(0, 16).join('');
    textBtns.forEach(function(x){ x.classList.remove('on'); });
    playAll();
  });
  /* 長文サンプルを差し替える */
  $('longInput').addEventListener('change', function(){
    var v = this.value.replace(/\s+/g, ' ').trim();
    LT.custom = v;
    ltRender();
    if (v) LONG_TARGETS.concat(['fx-kin','fx-type','fx-shp','fx-box']).forEach(function(id){ var el = $(id); if (el && el._seen) play(el.getAttribute('data-fx') || ''); });
  });

  ltRender();

  var rT;
  window.addEventListener('resize', function(){
    clearTimeout(rT);
    rT = setTimeout(function(){ ['fx-glitch','fx-neon','fx-rise'].forEach(function(id){ fitBig($(id), state.text); }); fitBig($('fx-slot'), state.text, 1.04); fitBig($('fx-cube'), state.text, 1.08); ['particle','matrix','vfd'].forEach(function(n){ if (document.querySelector('[data-fx="' + n + '"]')._seen) play(n); }); Game.fitFx(); }, 250);
  });

  /* ============================================================
     ミニゲーム「ぴったりストップ」
     ============================================================ */
  var Game = (function(){
    var SPEEDS = [9, 13, 18, 24, 31];          /* 1秒あたりに進む数 */
    var ROUNDS = SPEEDS.length;
    var g = {round:0, score:0, target:0, running:false, raf:0, v:0, t0:0, start:0, phase:'ready'};
    var best = 0;
    try { best = parseInt(localStorage.getItem('pittari-best') || '0', 10) || 0; } catch(e){}
    var counter = $('g-counter'), digits = counter.children, btn = $('g-btn'), res = $('g-result');
    var fx = $('g-fx'), fxc = null, burstParts = [], fxRaf = 0;

    function pad(n){ return ('00' + n).slice(-3); }
    function show(n){ var s = pad(n); for (var i = 0; i < 3; i++) digits[i].textContent = s[i]; }
    function hud(){
      $('g-round').textContent = Math.min(g.round + 1, ROUNDS) + '/' + ROUNDS;
      $('g-speed').textContent = '×' + (g.round < ROUNDS ? (SPEEDS[g.round] / SPEEDS[0]).toFixed(1) : '-');
      $('g-best').textContent = best;
    }
    function countScore(to){
      var from = parseInt($('g-score').textContent, 10) || 0, t0 = null;
      function f(ts){ if (t0 === null) t0 = ts; var p = Math.min(1, (ts - t0) / 600); $('g-score').textContent = Math.round(from + (to - from) * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(f); }
      requestAnimationFrame(f);
    }
    function setResult(text, cls){
      res.className = 'g-result ' + (cls || '');
      if (cls === 'miss'){
        res.innerHTML = '<span class="glitch"></span>';
        glitchOnce(res.firstChild, text);
      } else {
        res.innerHTML = '<span class="rise"></span>';
        riseText(res.firstChild, text);
      }
    }
    function glitchOnce(el, text){
      el.textContent = text; el.setAttribute('data-text', text);
      if (reduced) return;
      el.classList.add('on');
      setTimeout(function(){ el.classList.remove('on'); }, 700);
    }
    function newTarget(){
      g.target = 100 + Math.floor(Math.random() * 900);
      neonText($('g-target'), pad(g.target));
    }
    function init(){
      cancelAnimationFrame(g.raf);
      g.round = 0; g.score = 0; g.running = false; g.phase = 'ready';
      $('g-score').textContent = '0';
      newTarget(); show(0); hud();
      counter.classList.remove('run');
      btn.textContent = 'スタート'; btn.disabled = false;
      setResult('', '');
      fitFx();
    }
    function startRound(){
      g.phase = 'run'; g.running = true;
      g.start = Math.floor(Math.random() * 1000);
      g.t0 = performance.now();
      counter.classList.add('run');
      btn.textContent = 'ストップ！';
      setResult('', '');
      (function loop(ts){
        if (!g.running) return;
        var el = (ts || performance.now()) - g.t0;
        g.v = Math.floor(g.start + el * SPEEDS[g.round] / 1000) % 1000;
        show(g.v);
        g.raf = requestAnimationFrame(loop);
      })();
    }
    function stop(){
      g.running = false; cancelAnimationFrame(g.raf);
      counter.classList.remove('run');
      var d = Math.abs(g.v - g.target); d = Math.min(d, 1000 - d);
      var pts = 0;
      if (d === 0){ pts = 100; setResult('PERFECT!! +100', 'perfect'); burst(); }
      else if (d <= 2){ pts = 60; setResult('GREAT! ' + d + 'ずれ +60', 'great'); }
      else if (d <= 6){ pts = 30; setResult('GOOD ' + d + 'ずれ +30', 'good'); }
      else { setResult('MISS… ' + d + 'ずれ', 'miss'); }
      g.score += pts; countScore(g.score);
      g.round++;
      if (g.round >= ROUNDS){
        g.phase = 'end';
        if (g.score > best){ best = g.score; try { localStorage.setItem('pittari-best', best); } catch(e){} }
        setTimeout(function(){
          var rank = g.score >= 400 ? '神の指先！' : g.score >= 250 ? 'すごい！' : g.score >= 120 ? 'いい感じ！' : 'もう一回いってみよう';
          setResult('合計 ' + g.score + '点　' + rank, g.score >= 250 ? 'perfect' : 'good');
          if (g.score >= 250) burst();
          hud();
        }, 1100);
        btn.textContent = 'もう一回あそぶ';
      } else {
        g.phase = 'next';
        btn.textContent = '次のラウンドへ';
        hud();
      }
    }
    function press(){
      if (g.phase === 'ready' || g.phase === 'next'){ if (g.phase === 'next') newTarget(); startRound(); }
      else if (g.phase === 'run') stop();
      else if (g.phase === 'end') init();
    }
    /* 成功時のパーティクル */
    function fitFx(){
      var dpr = Math.min(window.devicePixelRatio || 1, 2), st = fx.parentNode;
      fx.width = st.clientWidth * dpr; fx.height = st.clientHeight * dpr;
      fxc = fx.getContext('2d'); fxc.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    function burst(){
      if (reduced) return;
      fitFx();
      var st = fx.parentNode, cx = st.clientWidth / 2, cy = counter.offsetTop + counter.offsetHeight / 2;
      var a = accent(), cols = [a, '#ffffff', '#ffd36b'];
      for (var i = 0; i < 140; i++){
        var ang = Math.random() * Math.PI * 2, sp = 2 + Math.random() * 7;
        burstParts.push({x:cx, y:cy, vx:Math.cos(ang) * sp, vy:Math.sin(ang) * sp - 2, life:60 + Math.random() * 40, c:cols[i % 3], s:2 + Math.random() * 3});
      }
      cancelAnimationFrame(fxRaf);
      (function f(){
        fxc.clearRect(0, 0, st.clientWidth, st.clientHeight);
        burstParts = burstParts.filter(function(p){ return p.life > 0; });
        burstParts.forEach(function(p){
          p.vy += 0.15; p.vx *= 0.98; p.x += p.vx; p.y += p.vy; p.life--;
          fxc.globalAlpha = Math.min(1, p.life / 30); fxc.fillStyle = p.c; fxc.fillRect(p.x, p.y, p.s, p.s);
        });
        fxc.globalAlpha = 1;
        if (burstParts.length) fxRaf = requestAnimationFrame(f);
        else fxc.clearRect(0, 0, st.clientWidth, st.clientHeight);
      })();
    }
    btn.addEventListener('click', function(e){ e.stopPropagation(); press(); });
    btn.closest('.stage').addEventListener('pointerdown', function(e){ if (e.target === btn) return; if (g.phase === 'run') stop(); });
    window.addEventListener('keydown', function(e){
      if ((e.code === 'Space' || e.key === 'Enter') && document.activeElement.tagName !== 'INPUT'){
        var r = $('game').getBoundingClientRect();
        if (r.top < window.innerHeight && r.bottom > 0){ e.preventDefault(); if (document.activeElement !== btn) press(); }
      }
    });
    $('g-reset').addEventListener('click', init);
    return {init:init, fitFx:fitFx, press:press, _g:g};
  })();
  window.__game = Game;   /* 動作確認用 */
})();
