// Dashboard page logic

let allAudits = [];
let allNotes = {};
let storageUsage = null;

async function loadDashboard() {
  try {
    // Load storage usage
    storageUsage = await db.getStorageUsage();
    
    allAudits = await db.getActiveAudits();
    // Load notes for each audit
    allNotes = {};
    for (const a of allAudits) {
      const items = await db.getAuditItems(a.id);
      const itemNotes = items.filter(i => i.note && i.note.trim());
      if (itemNotes.length || a.notes) allNotes[a.id] = { items: itemNotes, final: a.notes };
    }
    renderDashboard();
  } catch (err) {
    document.getElementById('content').innerHTML = `
      <div class="text-center py-20 bg-dark-card rounded-xl shadow border border-dark-border">
        <p class="text-4xl mb-3">⚠️</p>
        <p class="text-lg font-semibold text-red-400">Connection Error</p>
        <p class="text-dark-muted mt-1">Could not connect to database. Check your Firebase config.</p>
        <p class="text-xs text-dark-muted mt-2">${err.message}</p>
      </div>`;
  }
}

function renderDashboard() {
  const el = document.getElementById('content');
  if (!allAudits.length) {
    el.innerHTML = `
      <div class="text-center py-20 bg-dark-card rounded-xl shadow border border-dark-border">
        <p class="text-4xl mb-3">📝</p>
        <p class="text-lg font-semibold">No audits yet</p>
        <p class="text-dark-muted mt-1 mb-4">Start your first Cell Hardening audit.</p>
        <a href="new-audit.html" class="inline-block bg-walmart-blue text-white font-semibold px-6 py-3 rounded-lg hover:bg-blue-700 transition">+ New Audit</a>
      </div>`;
    document.getElementById('dc-filter-wrap').innerHTML = '';
    return;
  }

  // DC filter
  const dcs = [...new Set(allAudits.map(a => a.location).filter(Boolean))].sort();
  document.getElementById('dc-filter-wrap').innerHTML = `
    <div>
      <label for="dc-filter" class="block text-xs font-semibold text-dark-muted mb-1">Filter by DC</label>
      <select id="dc-filter" onchange="filterByDC(this.value)"
              class="bg-dark-surface border border-dark-border text-dark-text rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-walmart-spark">
        <option value="">All DCs</option>
        ${dcs.map(dc => `<option value="${dc}">${dc}</option>`).join('')}
      </select>
    </div>`;

  const total = allAudits.length;
  
  // Copy link button
  const copyLinkHtml = `
    <div class="bg-dark-card rounded-xl shadow border border-dark-border p-4 mb-4">
      <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 class="font-semibold text-base">Share Dashboard</h2>
          <p class="text-sm text-dark-muted mt-1">Copy link to share this dashboard with your team</p>
        </div>
        <div class="flex flex-wrap gap-2 w-full sm:w-auto">
          <button id="copy-link-btn" onclick="copyDashboardLink()" 
                  class="flex-1 sm:flex-none bg-walmart-spark text-dark-bg font-semibold px-4 py-3 rounded-lg hover:brightness-110 active:brightness-90 transition text-sm flex items-center justify-center gap-2">
            <span>🔗</span> Copy Link
          </button>
          <button onclick="exportPDF('Dashboard-Audits.pdf')" 
                  class="flex-1 sm:flex-none bg-dark-surface text-dark-text border border-dark-border font-semibold px-4 py-3 rounded-lg hover:bg-dark-border transition text-sm flex items-center justify-center gap-2">
            <span>📄</span> Export PDF
          </button>
          <button onclick="emailPDF('Dashboard-Audits.pdf', 'Cell Hardening Dashboard Report')" 
                  class="flex-1 sm:flex-none bg-dark-surface text-dark-text border border-dark-border font-semibold px-4 py-3 rounded-lg hover:bg-dark-border transition text-sm flex items-center justify-center gap-2">
            <span>📧</span> Email PDF
          </button>
        </div>
      </div>
    </div>`;
  
  // Storage usage indicator
  let storageHtml = '';
  if (storageUsage) {
    const { totalMB, totalGB, percentUsed, photoCount } = storageUsage;
    const barColor = percentUsed > 90 ? 'bg-red-500' : percentUsed > 70 ? 'bg-yellow-500' : 'bg-green-500';
    const textColor = percentUsed > 90 ? 'text-red-400' : percentUsed > 70 ? 'text-yellow-400' : 'text-green-400';
    
    storageHtml = `
      <div class="bg-dark-card rounded-xl shadow border border-dark-border mb-4 overflow-hidden">
        <!-- Header (always visible) -->
        <button type="button" onclick="toggleStorageDetails()" 
                class="w-full flex items-center justify-between px-4 py-3 hover:bg-dark-surface transition cursor-pointer">
          <div class="flex items-center gap-3">
            <span class="text-xl">💾</span>
            <h3 class="font-semibold">Storage Usage</h3>
            <span class="text-xs ${textColor} font-semibold">${percentUsed.toFixed(1)}%</span>
            <span class="text-xs text-dark-muted">(• ${photoCount} photos)</span>
          </div>
          <div class="flex items-center gap-3">
            <div class="hidden sm:flex items-center gap-2">
              <div class="w-32 bg-dark-surface rounded-full h-2 overflow-hidden">
                <div class="h-full rounded-full transition-all duration-300 ${barColor}" style="width:${Math.min(percentUsed, 100)}%"></div>
              </div>
              <span class="text-xs text-dark-muted">${totalMB < 1024 ? totalMB.toFixed(0) + ' MB' : totalGB.toFixed(2) + ' GB'}</span>
            </div>
            <span id="storage-toggle-icon" class="text-dark-muted text-xl">▼</span>
          </div>
        </button>
        
        <!-- Details (collapsible) -->
        <div id="storage-details" class="hidden border-t border-dark-border p-4">
          <div class="flex flex-wrap items-center justify-between gap-4">
            <div class="flex-1 min-w-[200px]">
              <div class="text-xs text-dark-muted mb-2">Firebase Free Tier: 1 GB Total</div>
              <div class="flex items-center gap-3">
                <div class="flex-1 bg-dark-surface rounded-full h-4 overflow-hidden">
                  <div class="h-full rounded-full transition-all duration-300 ${barColor}" style="width:${Math.min(percentUsed, 100)}%"></div>
                </div>
                <span class="text-sm font-semibold ${textColor} whitespace-nowrap">
                  ${percentUsed.toFixed(1)}%
                </span>
              </div>
            </div>
            <div class="flex gap-6 text-sm">
              <div class="text-center">
                <div class="text-2xl font-bold text-walmart-spark">${totalMB < 1024 ? totalMB.toFixed(0) : totalGB.toFixed(2)}</div>
                <div class="text-xs text-dark-muted">${totalMB < 1024 ? 'MB' : 'GB'} Used</div>
              </div>
              <div class="text-center">
                <div class="text-2xl font-bold text-walmart-spark">${photoCount}</div>
                <div class="text-xs text-dark-muted">Photos</div>
              </div>
              <div class="text-center">
                <div class="text-2xl font-bold text-walmart-spark">${((1024 - totalMB) / 0.6).toFixed(0)}</div>
                <div class="text-xs text-dark-muted">Photos Left</div>
              </div>
            </div>
          </div>
        </div>
      </div>`;
  }
  
  el.innerHTML = copyLinkHtml + storageHtml + `
    <!-- Desktop table -->
    <div class="hidden md:block overflow-x-auto bg-dark-card rounded-xl shadow border border-dark-border">
      <table class="w-full text-left text-sm">
        <thead class="bg-dark-surface text-dark-text">
          <tr>
            <th class="px-4 py-3">#</th>
            <th class="px-4 py-3">Auditor</th>
            <th class="px-4 py-3">DC</th>
            <th class="px-4 py-3">Cell #</th>
            <th class="px-4 py-3">Started</th>
            <th class="px-4 py-3">Status</th>
            <th class="px-4 py-3">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-dark-border">
          ${allAudits.map((a, i) => renderDesktopRow(a, i + 1)).join('')}
        </tbody>
      </table>
    </div>
    <!-- Mobile cards -->
    <div class="md:hidden space-y-3">
      ${allAudits.map((a, i) => renderMobileCard(a, i + 1)).join('')}
    </div>`;
}

function renderDesktopRow(a, num) {
  const notes = allNotes[a.id];
  const actionLink = a.status === 'in_progress'
    ? `<a href="audit.html?id=${a.id}" class="text-walmart-spark font-semibold hover:underline">Continue</a>`
    : `<a href="report.html?id=${a.id}" class="text-walmart-spark font-semibold hover:underline">Report</a>`;

  return `
    <tr class="hover:bg-dark-surface transition audit-row" data-dc="${a.location || ''}">
      <td class="px-4 py-3 font-mono">#${num}</td>
      <td class="px-4 py-3">${a.auditor}</td>
      <td class="px-4 py-3">${a.location || '—'}</td>
      <td class="px-4 py-3 font-semibold">${a.line_id}</td>
      <td class="px-4 py-3">${formatDate(a.started_at)}</td>
      <td class="px-4 py-3">${renderStatusBadge(a.status)}</td>
      <td class="px-4 py-3 flex gap-2">
        ${actionLink}
        ${notes ? `<button onclick="toggleNotes('dn-${a.id}')" class="text-dark-muted hover:text-walmart-spark transition text-xs" title="Notes">📝</button>` : ''}
        <button onclick="archiveAudit('${a.id}')" class="text-dark-muted hover:text-walmart-spark transition text-xs" title="Archive">📖</button>
        <button onclick="deleteAudit('${a.id}')" class="text-dark-muted hover:text-red-400 transition text-xs" title="Delete">🗑️</button>
      </td>
    </tr>
    ${notes ? renderNotesRow(a, 'dn-' + a.id, 7) : ''}`;
}

function renderMobileCard(a, num) {
  const notes = allNotes[a.id];
  const actionLink = a.status === 'in_progress'
    ? `<a href="audit.html?id=${a.id}" class="flex-1 text-center bg-walmart-spark text-dark-bg font-semibold py-2.5 rounded-lg text-sm active:brightness-90 transition">Continue</a>`
    : `<a href="report.html?id=${a.id}" class="flex-1 text-center bg-walmart-spark text-dark-bg font-semibold py-2.5 rounded-lg text-sm active:brightness-90 transition">Report</a>`;

  return `
    <div class="audit-row bg-dark-card rounded-xl shadow border border-dark-border p-4" data-dc="${a.location || ''}">
      <div class="flex items-center justify-between mb-2">
        <span class="font-mono text-sm text-dark-muted">#${num}</span>
        ${renderStatusBadge(a.status)}
      </div>
      <p class="font-semibold">Cell ${a.line_id} — DC ${a.location || '—'}</p>
      <p class="text-sm text-dark-muted">${a.auditor} · ${formatDate(a.started_at)}</p>
      <div class="flex items-center gap-3 mt-3 pt-3 border-t border-dark-border">
        ${actionLink}
        ${notes ? `<button onclick="toggleNotes('mn-${a.id}')" class="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg bg-dark-surface text-dark-muted active:bg-dark-border transition" title="Notes">📝</button>` : ''}
        <button onclick="archiveAudit('${a.id}')" class="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg bg-dark-surface text-dark-muted active:bg-dark-border transition" title="Archive">📖</button>
        <button onclick="deleteAudit('${a.id}')" class="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg bg-dark-surface text-dark-muted active:bg-dark-border transition" title="Delete">🗑️</button>
      </div>
      ${notes ? `<div id="mn-${a.id}" class="hidden mt-3 pt-3 border-t border-dark-border">${renderNotesContent(a)}</div>` : ''}
    </div>`;
}

function renderNotesRow(a, elId, colspan) {
  return `
    <tr id="${elId}" class="hidden bg-dark-surface/50 audit-notes" data-dc="${a.location || ''}">
      <td colspan="${colspan}" class="px-6 py-4">${renderNotesContent(a)}</td>
    </tr>`;
}

function renderNotesContent(a) {
  const notes = allNotes[a.id];
  if (!notes) return '';
  let html = '';
  if (notes.final) {
    html += `<div class="mb-3"><span class="text-xs font-semibold text-walmart-spark uppercase tracking-wide">Final Notes</span>
      <p class="text-sm text-dark-text mt-1 whitespace-pre-wrap">${notes.final}</p></div>`;
  }
  if (notes.items.length) {
    const labels = {};
    CATEGORIES.forEach(c => c.items.forEach(i => { labels[i.id] = i.label; }));
    html += `<div><span class="text-xs font-semibold text-walmart-spark uppercase tracking-wide">Item Notes</span>
      <ul class="mt-1 space-y-1">${notes.items.map(n =>
        `<li class="text-sm"><span class="text-dark-muted">• ${labels[n.item_id] || n.item_id}:</span> ${n.note}</li>`
      ).join('')}</ul></div>`;
  }
  return html;
}

function toggleNotes(id) {
  document.getElementById(id)?.classList.toggle('hidden');
}

function toggleStorageDetails() {
  const details = document.getElementById('storage-details');
  const icon = document.getElementById('storage-toggle-icon');
  if (details && icon) {
    details.classList.toggle('hidden');
    icon.textContent = details.classList.contains('hidden') ? '▼' : '▲';
  }
}

function filterByDC(dc) {
  document.querySelectorAll('.audit-row').forEach(row => {
    row.classList.toggle('hidden', dc && row.dataset.dc !== dc);
  });
  document.querySelectorAll('.audit-notes').forEach(row => {
    if (dc && row.dataset.dc !== dc) row.classList.add('hidden');
  });
}

async function archiveAudit(id) {
  if (!confirm(`Archive audit #${id}?`)) return;
  await db.archiveAudit(id);
  loadDashboard();
}

async function deleteAudit(id) {
  if (!confirm(`Permanently delete audit #${id}? This cannot be undone.`)) return;
  await db.deleteAudit(id);
  loadDashboard();
}

function copyDashboardLink() {
  const url = window.location.href;
  navigator.clipboard.writeText(url).then(() => {
    const btn = document.getElementById('copy-link-btn');
    const originalHtml = btn.innerHTML;
    btn.innerHTML = '<span>✅</span> Link Copied!';
    btn.classList.remove('bg-walmart-spark');
    btn.classList.add('bg-wm-green');
    setTimeout(() => {
      btn.innerHTML = originalHtml;
      btn.classList.remove('bg-wm-green');
      btn.classList.add('bg-walmart-spark');
    }, 2000);
  }).catch(err => {
    console.error('Failed to copy link:', err);
    alert('Failed to copy link to clipboard');
  });
}

// Init
console.log('📊 Dashboard.js loading...');
try {
  initPage();
  console.log('✅ Page initialized');
  loadDashboard();
} catch (err) {
  console.error('❌ Dashboard init failed:', err);
  document.getElementById('content').innerHTML = `
    <div class="text-center py-20 bg-dark-card rounded-xl shadow border border-dark-border">
      <p class="text-4xl mb-3">⚠️</p>
      <p class="text-lg font-semibold text-red-400">Initialization Error</p>
      <p class="text-dark-muted mt-1">Dashboard failed to load</p>
      <p class="text-xs text-dark-muted mt-2">${err.message}</p>
      <p class="text-xs text-dark-muted mt-1">Check browser console (F12) for details</p>
    </div>`;
}
