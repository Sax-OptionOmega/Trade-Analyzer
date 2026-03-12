// ─────────────────────────────────────────────────────────────────────────────
// OPTION OMEGA MODULE — Private add-on for Trade Analyzer Pro
// This file is NOT included in the public repository.
// If this file is missing, the app works normally without the Option Omega tab.
// ─────────────────────────────────────────────────────────────────────────────
(function() {
  'use strict';

  var OMEGA_URL = 'https://optionomega.com/dashboard/tests';
  var strategies = []; // parsed strategy list
  var omegaPopup = null; // reference to the popup window

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
          '<button class="btn-back" id="omegaOpenBtn">Open Option Omega</button>' +
          '<button class="btn-back" id="omegaReadBtn" style="border-color:var(--accent);color:var(--accent);">Read Strategies</button>' +
          '<span id="omegaStatus" style="font-size:11px;color:var(--muted);font-family:\'Space Mono\',monospace;"></span>' +
        '</div>' +
      '</div>' +
      '<div class="card-body" id="omegaStrategies" style="max-height:600px;overflow-y:auto;">' +
        '<div style="color:var(--muted);font-size:13px;">' +
          '1. Click <b>Open Option Omega</b> to open the dashboard in a popup<br>' +
          '2. Log in if needed, then switch to <b>Table</b> view<br>' +
          '3. Click <b>Read Strategies</b> to extract the strategy list' +
        '</div>' +
      '</div>' +
    '</div>';

  var zoomWrap = document.getElementById('zoomWrap');
  if (zoomWrap) zoomWrap.appendChild(container);

  // ── 3. Button handlers ────────────────────────────────────────────────────
  document.getElementById('omegaOpenBtn').addEventListener('click', function() {
    openOmegaPopup();
  });
  document.getElementById('omegaReadBtn').addEventListener('click', readStrategies);

  // ── 4. Hook into switchTab ────────────────────────────────────────────────
  window.omegaOnTab = function(id) {
    // nothing needed on tab switch for now
  };

  // ── 5. Popup management ───────────────────────────────────────────────────
  function openOmegaPopup() {
    if (omegaPopup && !omegaPopup.closed) {
      omegaPopup.focus();
      setStatus('Popup already open', false);
      return;
    }
    omegaPopup = window.open(OMEGA_URL, 'omegaPopup', 'width=1200,height=800,scrollbars=yes,resizable=yes');
    if (omegaPopup) {
      setStatus('Popup opened — log in and switch to Table view', false);
    } else {
      setStatus('Popup blocked — allow popups for this page', true);
    }
  }

  // ── 6. Read Strategies from popup DOM ─────────────────────────────────────
  function setStatus(msg, isError) {
    var el = document.getElementById('omegaStatus');
    el.textContent = msg;
    el.style.color = isError ? 'var(--red)' : 'var(--muted)';
  }

  function readStrategies() {
    // If no popup open, try opening one first
    if (!omegaPopup || omegaPopup.closed) {
      openOmegaPopup();
      setStatus('Popup opened — wait for page to load, then click Read again', false);
      return;
    }

    var readBtn = document.getElementById('omegaReadBtn');
    readBtn.disabled = true;
    readBtn.textContent = 'Reading...';
    setStatus('Waiting for table...', false);

    // First try to click "Table" view in the popup
    try {
      clickTableView(omegaPopup.document);
    } catch(e) {
      // cross-origin or not loaded yet — will retry
    }

    // Poll for tbody to appear (SPA needs time to render)
    var attempts = 0;
    var maxAttempts = 15;
    var pollInterval = setInterval(function() {
      attempts++;
      try {
        var doc = omegaPopup.document;
        var tbody = doc.querySelector('tbody');
        if (tbody && tbody.children.length > 0) {
          clearInterval(pollInterval);
          var html = '<table><tbody>' + tbody.innerHTML + '</tbody></table>';
          strategies = parseStrategiesFromHTML(html);
          if (strategies.length > 0) {
            setStatus(strategies.length + ' strategies found', false);
            renderStrategyTable();
          } else {
            setStatus('Table found but parsing failed — check table format', true);
          }
          readBtn.disabled = false;
          readBtn.textContent = 'Read Strategies';
          return;
        }
        setStatus('Waiting for table... (' + attempts + '/' + maxAttempts + ')', false);
      } catch(e) {
        clearInterval(pollInterval);
        setStatus('Cannot access popup: ' + e.message, true);
        showFallbackInstructions();
        readBtn.disabled = false;
        readBtn.textContent = 'Read Strategies';
        return;
      }
      if (attempts >= maxAttempts) {
        clearInterval(pollInterval);
        setStatus('Table not found — make sure you are on Table view', true);
        showFallbackInstructions();
        readBtn.disabled = false;
        readBtn.textContent = 'Read Strategies';
      }
    }, 1000);
  }

  // ── 7. Click "Table" view button in popup ─────────────────────────────────
  function clickTableView(doc) {
    try {
      var result = doc.evaluate("//span[text()='Table']", doc, null,
        XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
      if (result) {
        var parent = result.parentElement;
        if (parent) parent.click(); else result.click();
      }
    } catch(e) {}
  }

  // ── 8. Parse HTML table (same logic as Delphi uOmegaDownloader) ───────────
  function parseStrategiesFromHTML(html) {
    var results = [];

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

      // Tags (badges)
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

      // Numeric columns
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

  // ── 9. Render strategy table ──────────────────────────────────────────────
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
        '<td style="font-size:10px;">' + escH(s.backtestStart) + ' &mdash; ' + escH(s.backtestEnd) + '</td>' +
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

  // ── 10. Fallback instructions ─────────────────────────────────────────────
  function showFallbackInstructions() {
    var el = document.getElementById('omegaStrategies');
    el.innerHTML =
      '<div style="color:var(--gold);font-size:12px;margin-bottom:12px;">' +
        '<b>Cannot access popup DOM</b><br>' +
        'Make sure you launched the app with <code>Run_TradeAnalyzer.bat</code> (Chrome with CORS disabled).<br>' +
        'Alternatively, paste the table HTML below:' +
      '</div>' +
      '<textarea id="omegaPasteArea" style="width:100%;height:120px;background:var(--s2);color:var(--text);border:1px solid var(--border);' +
        'border-radius:8px;padding:10px;font-family:\'Space Mono\',monospace;font-size:11px;resize:vertical;" ' +
        'placeholder="In Option Omega Table view: right-click table → Inspect → copy <tbody> HTML → paste here"></textarea>' +
      '<div style="margin-top:8px;">' +
        '<button class="btn-back" id="omegaParseBtn" style="border-color:var(--accent);color:var(--accent);">Parse Pasted HTML</button>' +
      '</div>';

    document.getElementById('omegaParseBtn').addEventListener('click', function() {
      var raw = document.getElementById('omegaPasteArea').value.trim();
      if (!raw) return;
      if (raw.indexOf('<tbody') < 0) raw = '<tbody>' + raw + '</tbody>';
      strategies = parseStrategiesFromHTML('<table>' + raw + '</table>');
      if (strategies.length > 0) {
        setStatus(strategies.length + ' strategies parsed', false);
        renderStrategyTable();
      } else {
        setStatus('No strategies found in pasted HTML', true);
      }
    });
  }

  // ── Expose for external use ───────────────────────────────────────────────
  window.omegaStrategies = function() { return strategies; };

})();
