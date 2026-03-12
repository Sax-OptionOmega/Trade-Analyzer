// ─────────────────────────────────────────────────────────────────────────────
// OPTION OMEGA MODULE — Private add-on for Trade Analyzer Pro
// This file is NOT included in the public repository.
// If this file is missing, the app works normally without the Option Omega tab.
// ─────────────────────────────────────────────────────────────────────────────
(function() {
  'use strict';

  var OMEGA_URL = 'https://optionomega.com/dashboard/tests';

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
    '<div class="card" style="height:calc(100vh - 200px);min-height:600px;">' +
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

  // Insert before the closing </div></div><!-- /zoomWrap -->
  var zoomWrap = document.getElementById('zoomWrap');
  if (zoomWrap) {
    zoomWrap.appendChild(container);
  }

  // ── 3. Button handlers ────────────────────────────────────────────────────
  document.getElementById('omegaReloadBtn').addEventListener('click', function() {
    document.getElementById('omegaFrame').src = OMEGA_URL;
  });
  document.getElementById('omegaNewTabBtn').addEventListener('click', function() {
    window.open(OMEGA_URL, '_blank');
  });

  // ── 4. Hook into switchTab via omegaOnTab ─────────────────────────────────
  window.omegaOnTab = function(id) {
    if (id === 'omega') {
      var f = document.getElementById('omegaFrame');
      if (!f.src || f.src === 'about:blank') f.src = OMEGA_URL;
    }
  };

})();
