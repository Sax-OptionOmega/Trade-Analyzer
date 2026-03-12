// ─────────────────────────────────────────────────────────────────────────────
// OPTION OMEGA MODULE — Private add-on for Trade Analyzer Pro
// This file is NOT included in the public repository.
// If this file is missing, the app works normally without the Option Omega tab.
// ─────────────────────────────────────────────────────────────────────────────
(function() {
  'use strict';

  var OMEGA_URL = 'https://optionomega.com/dashboard/tests';
  var strategies = []; // parsed strategy list

  // ── 1. Inject tab button ──────────────────────────────────────────────────
  var tabs = document.getElementById('tabs');
  if (!tabs) return;
  var btn = document.createElement('div');
  btn.className = 'tab';
  btn.dataset.tab = 'omega';
  btn.textContent = 'Option Omega';
  tabs.appendChild(btn);

  // ── 2. Inject tab content ─────────────────────────────────────────────────
  var container = document.createElement('div');
  container.className = 'tab-content';
  container.id = 'tab-omega';
  container.innerHTML =
    '<div class="sec">Option Omega Dashboard</div>' +

    // ── Toolbar ──
    '<div class="card" style="margin-bottom:16px;">' +
      '<div class="card-hdr">' +
        '<span>Strategies</span>' +
        '<div style="display:flex;gap:8px;align-items:center;">' +
          '<button class="btn-back" id="omegaReadBtn" style="border-color:var(--accent);color:var(--accent);">Read Strategies</button>' +
          '<span id="omegaStatus" style="font-size:11px;color:var(--muted);font-family:\'Space Mono\',monospace;"></span>' +
        '</div>' +
      '</div>' +
      '<div class="card-body" id="omegaStrategies" style="max-height:400px;overflow-y:auto;">' +
        '<div style="color:var(--muted);font-size:13px;">Click <b>Read Strategies</b> to fetch the strategy list from Option Omega.</div>' +
      '</div>' +
    '</div>' +

    // ── Iframe ──
    '<div class="card" style="height:calc(100vh - 500px);min-height:400px;">' +
      '<div class="card-hdr">' +
        '<span>Option Omega &mdash; Tests</span>' +
        '<div style="display:flex;gap:8px;align-items:center;">' +
          '<button class="btn-back" id="omegaReloadBtn">Reload</button>' +
          '<button class="btn-back" id="omegaNewTabBtn">Open in New Tab</button>' +
        '</div>' +
      '</div>' +
      '<div class="card-body" style="padding:0;height:calc(100% - 44px);">' +
        '<iframe id="omegaFrame" src="about:blank" style="width:100%;height:100%;border:none;border-radius:0 0 10px 10px;background:#fff;"></iframe>' +
      '</div>' +
    '</div>';

  var zoomWrap = document.getElementById('zoomWrap');
  if (zoomWrap) zoomWrap.appendChild(container);

  // ── 3. Button handlers ────────────────────────────────────────────────────
  document.getElementById('omegaReloadBtn').addEventListener('click', function() {
    document.getElementById('omegaFrame').src = OMEGA_URL;
  });
  document.getElementById('omegaNewTabBtn').addEventListener('click', function() {
    window.open(OMEGA_URL, '_blank');
  });
  document.getElementById('omegaReadBtn').addEventListener('click', readStrategies);

  // ── 4. Hook into switchTab ────────────────────────────────────────────────
  window.omegaOnTab = function(id) {
    if (id === 'omega') {
      var f = document.getElementById('omegaFrame');
      if (!f.src || f.src === 'about:blank') f.src = OMEGA_URL;
    }
  };

  // ── 5. Read Strategies ────────────────────────────────────────────────────
  function setStatus(msg, isError) {
    var el = document.getElementById('omegaStatus');
    el.textContent = msg;
    el.style.color = isError ? 'var(--red)' : 'var(--muted)';
  }

  function readStrategies() {
    var readBtn = document.getElementById('omegaReadBtn');
    readBtn.disabled = true;
    readBtn.textContent = 'Reading...';
    setStatus('Fetching dashboard...', false);

    fetch(OMEGA_URL, { credentials: 'include' })
      .then(function(resp) {
        if (!resp.ok) throw new Error('HTTP ' + resp.status);
        return resp.text();
      })
      .then(function(html) {
        setStatus('Parsing strategies...', false);
        strategies = parseStrategiesFromHTML(html);
        if (strategies.length === 0) {
          // SPA: table not in initial HTML, try table view URL
          setStatus('Table not in HTML, trying table view...', false);
          return fetch(OMEGA_URL + '?view=table', { credentials: 'include' })
            .then(function(r) { return r.text(); })
            .then(function(html2) {
              strategies = parseStrategiesFromHTML(html2);
            });
        }
      })
      .then(function() {
        if (strategies.length > 0) {
          setStatus(strategies.length + ' strategies found', false);
          renderStrategyTable();
        } else {
          setStatus('No strategies found — see instructions below', true);
          showManualFallback();
        }
      })
      .catch(function(err) {
        var msg = err.message || String(err);
        if (msg.indexOf('Failed to fetch') >= 0 || msg.indexOf('NetworkError') >= 0) {
          setStatus('CORS blocked — use local launcher or paste HTML below', true);
          showManualFallback();
        } else {
          setStatus('Error: ' + msg, true);
          showManualFallback();
        }
      })
      .finally(function() {
        readBtn.disabled = false;
        readBtn.textContent = 'Read Strategies';
      });
  }

  // ── 6. Parse HTML table (same logic as Delphi uOmegaDownloader) ───────────
  function parseStrategiesFromHTML(html) {
    var results = [];

    // Try to find tbody content
    var tbodyMatch = html.match(/<tbody[^>]*>([\s\S]*?)<\/tbody>/i);
    if (!tbodyMatch) return results;

    var tbody = tbodyMatch[1];
    var rowRe = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
    var cellRe = /<td[^>]*>([\s\S]*?)<\/td>/gi;
    var linkRe = /<a[^>]*href=["']([^"']*?\/test\/([^"'\/?#]+))["'][^>]*>([\s\S]*?)<\/a>/i;
    var badgeRe = /<span[^>]*class=["'][^"']*rounded-full[^"']*["'][^>]*>(.*?)<\/span>/gi;
    var dateRe = /(\d{1,2}\/\d{1,2}\/\d{4})\s*[-]+\s*(\d{1,2}\/\d{1,2}\/\d{4})/;

    var rowMatch;
    while ((rowMatch = rowRe.exec(tbody)) !== null) {
      var rowHTML = rowMatch[1];
      var cells = [];
      var cellMatch;
      cellRe.lastIndex = 0;
      while ((cellMatch = cellRe.exec(rowHTML)) !== null) {
        cells.push(cellMatch[1]);
      }
      if (cells.length < 8) continue;

      var strat = {
        id: '', name: '', instrument: '', tags: [],
        backtestStart: '', backtestEnd: '',
        profitLoss: 0, avgTrade: 0, winRate: 0,
        pcr: 0, cagr: 0, maxDrawdown: 0, mar: 0
      };

      // Column 1: Link with strategy ID and Name
      var lm = cells[0] ? cells[0].match(linkRe) : null;
      if (!lm && cells[1]) lm = cells[1].match(linkRe);
      if (lm) {
        strat.id = lm[2];
        strat.name = stripHTML(lm[3]).trim();
      }

      // Tags (badges with rounded-full class) — search in first 2 cells
      var tagSource = (cells[0] || '') + (cells[1] || '');
      var bm;
      badgeRe.lastIndex = 0;
      while ((bm = badgeRe.exec(tagSource)) !== null) {
        var tag = stripHTML(bm[1]).trim();
        if (tag) strat.tags.push(tag);
      }

      // Column 2: Instrument
      strat.instrument = stripHTML(cells[2] || '').trim();

      // Column 4: Date range
      var dm = (cells[3] || '').match(dateRe);
      if (!dm) dm = (cells[4] || '').match(dateRe);
      if (dm) {
        strat.backtestStart = dm[1];
        strat.backtestEnd = dm[2];
      }

      // Numeric columns (try from cell index 4 or 5 onwards)
      var numStart = dm && (cells[3] || '').match(dateRe) ? 4 : 5;
      var nums = [];
      for (var i = numStart; i < cells.length; i++) {
        nums.push(parseOmegaNumber(cells[i]));
      }
      if (nums.length >= 7) {
        strat.profitLoss = nums[0];
        strat.avgTrade = nums[1];
        strat.winRate = nums[2];
        strat.pcr = nums[3];
        strat.cagr = nums[4];
        strat.maxDrawdown = nums[5];
        strat.mar = nums[6];
      }

      if (strat.id || strat.name) results.push(strat);
    }
    return results;
  }

  function stripHTML(s) {
    return s.replace(/<[^>]*>/g, '');
  }

  function parseOmegaNumber(cellHTML) {
    var text = stripHTML(cellHTML).trim();
    var negative = text.indexOf('(') >= 0 || text.indexOf('-') >= 0;
    var m = text.match(/([\d,]+\.?\d*)/);
    if (!m) return 0;
    var val = parseFloat(m[1].replace(/,/g, ''));
    return negative ? -Math.abs(val) : val;
  }

  // ── 7. Render strategy table ──────────────────────────────────────────────
  function renderStrategyTable() {
    var el = document.getElementById('omegaStrategies');
    var html = '<table class="tbl" style="width:100%;font-size:12px;">' +
      '<thead><tr>' +
        '<th style="text-align:left;">Name</th>' +
        '<th>Instrument</th>' +
        '<th>Tags</th>' +
        '<th>Period</th>' +
        '<th style="text-align:right;">P&amp;L</th>' +
        '<th style="text-align:right;">Avg Trade</th>' +
        '<th style="text-align:right;">Win%</th>' +
        '<th style="text-align:right;">PCR</th>' +
        '<th style="text-align:right;">CAGR</th>' +
        '<th style="text-align:right;">Max DD</th>' +
        '<th style="text-align:right;">MAR</th>' +
      '</tr></thead><tbody>';

    for (var i = 0; i < strategies.length; i++) {
      var s = strategies[i];
      var plColor = s.profitLoss >= 0 ? 'var(--accent)' : 'var(--red)';
      html += '<tr>' +
        '<td style="text-align:left;font-weight:600;">' + escH(s.name) + '</td>' +
        '<td>' + escH(s.instrument) + '</td>' +
        '<td style="font-size:10px;">' + s.tags.map(function(t) {
          return '<span style="background:var(--s3);padding:2px 6px;border-radius:10px;margin-right:3px;">' + escH(t) + '</span>';
        }).join('') + '</td>' +
        '<td style="font-size:10px;">' + escH(s.backtestStart) + ' — ' + escH(s.backtestEnd) + '</td>' +
        '<td style="text-align:right;color:' + plColor + ';">$' + fmtN(s.profitLoss) + '</td>' +
        '<td style="text-align:right;">$' + fmtN(s.avgTrade) + '</td>' +
        '<td style="text-align:right;">' + s.winRate.toFixed(1) + '%</td>' +
        '<td style="text-align:right;">' + s.pcr.toFixed(2) + '</td>' +
        '<td style="text-align:right;">' + s.cagr.toFixed(1) + '%</td>' +
        '<td style="text-align:right;color:var(--red);">' + s.maxDrawdown.toFixed(1) + '%</td>' +
        '<td style="text-align:right;">' + s.mar.toFixed(2) + '</td>' +
      '</tr>';
    }

    html += '</tbody></table>';
    el.innerHTML = html;
  }

  function escH(s) {
    var d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }

  function fmtN(n) {
    return n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  }

  // ── 8. Manual fallback (paste HTML) ───────────────────────────────────────
  function showManualFallback() {
    var el = document.getElementById('omegaStrategies');
    el.innerHTML =
      '<div style="color:var(--muted);font-size:12px;margin-bottom:12px;">' +
        'Automatic fetch failed. You can paste the table HTML manually:<br>' +
        '<span style="font-size:11px;">Open Option Omega &rarr; Table view &rarr; Right-click the table &rarr; Inspect &rarr; Copy the <code>&lt;tbody&gt;</code> HTML</span>' +
      '</div>' +
      '<textarea id="omegaPasteArea" style="width:100%;height:120px;background:var(--s2);color:var(--text);border:1px solid var(--border);' +
        'border-radius:8px;padding:10px;font-family:\'Space Mono\',monospace;font-size:11px;resize:vertical;" ' +
        'placeholder="Paste <tbody>...</tbody> HTML here"></textarea>' +
      '<div style="margin-top:8px;">' +
        '<button class="btn-back" id="omegaParseBtn" style="border-color:var(--accent);color:var(--accent);">Parse Pasted HTML</button>' +
      '</div>';

    document.getElementById('omegaParseBtn').addEventListener('click', function() {
      var raw = document.getElementById('omegaPasteArea').value.trim();
      if (!raw) return;
      // Wrap in tbody if not present
      if (raw.indexOf('<tbody') < 0) raw = '<tbody>' + raw + '</tbody>';
      strategies = parseStrategiesFromHTML('<table>' + raw + '</table>');
      if (strategies.length > 0) {
        setStatus(strategies.length + ' strategies parsed from pasted HTML', false);
        renderStrategyTable();
      } else {
        setStatus('No strategies found in pasted HTML', true);
      }
    });
  }

  // ── Expose for external use ───────────────────────────────────────────────
  window.omegaStrategies = function() { return strategies; };

})();
