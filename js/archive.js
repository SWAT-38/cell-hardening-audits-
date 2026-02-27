// Archive page logic

let allAudits = [];
let allNotes = {};

async function loadArchive() {
  try {
    allAudits = await db.getArchivedAudits();
    allNotes = {};
    for (const a of allAudits) {
      const items = await db.getAuditItems(a.id);
      const itemNotes = items.filter(i => i.note && i.note.trim());
      if (itemNotes.length || a.notes) allNotes[a.id] = { items: itemNotes, final: a.notes };
    }
    renderArchive();
  } catch (err) {
    document.getElementById('content').innerHTML = `
      <div class="text-center py-20 text-red-400">Error: ${err.message}</div>`;
  }
}

function renderArchive() {
  const el = document.getElementById('content');
  if (!allAudits.length) {
    el.innerHTML = `
      <div class="text-center py-20 bg-dark-card rounded-xl shadow border border-dark-border">
        <p class="text-4xl mb-3">📖</p>
        <p class="text-lg font-semibold">No archived audits</p>
        <p class="text-dark-muted mt-1">Audits you archive from the dashboard will appear here.</p>
      </div>`;
    document.getElementById('dc-filter-wrap').innerHTML = '';
    return;
  }

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
  el.innerHTML = `
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
            <th class="px-4 py-3">Archived</th>
            <th class="px-4 py-3">Status</th>
            <th class="px-4 py-3">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-dark-border">
          ${allAudits.map((a, i) => renderDesktopRow(a, total - i)).join('')}
        </tbody>
      </table>
    </div>
    <!-- Mobile cards -->
    <div class="md:hidden space-y-3">
      ${allAudits.map((a, i) => renderMobileCard(a, total - i)).join('')}
    </div>`;
}

function renderDesktopRow(a, num) {
  const notes = allNotes[a.id];
  return `
    <tr class="hover:bg-dark-surface transition audit-row" data-dc="${a.location || ''}">
      <td class="px-4 py-3 font-mono">#${num}</td>
      <td class="px-4 py-3">${a.auditor}</td>
      <td class="px-4 py-3">${a.location || '—'}</td>
      <td class="px-4 py-3 font-semibold">${a.line_id}</td>
      <td class="px-4 py-3">${formatDate(a.started_at)}</td>
      <td class="px-4 py-3">${formatDate(a.archived_at)}</td>
      <td class="px-4 py-3">${renderStatusBadge(a.status)}</td>
      <td class="px-4 py-3 flex gap-2">
        <a href="/report.html?id=${a.id}" class="text-walmart-spark font-semibold hover:underline">Report</a>
        ${notes ? `<button onclick="toggleNotes('dn-${a.id}')" class="text-dark-muted hover:text-walmart-spark transition text-xs" title="Notes">📝</button>` : ''}
        <button onclick="unarchiveAudit(${a.id})" class="text-dark-muted hover:text-walmart-spark transition text-xs" title="Restore">↩️</button>
      </td>
    </tr>
    ${notes ? renderNotesRow(a, 'dn-' + a.id) : ''}`;
}

function renderMobileCard(a, num) {
  const notes = allNotes[a.id];
  return `
    <div class="audit-row bg-dark-card rounded-xl shadow border border-dark-border p-4" data-dc="${a.location || ''}">
      <div class="flex items-center justify-between mb-2">
        <span class="font-mono text-sm text-dark-muted">#${num}</span>
        ${renderStatusBadge(a.status)}
      </div>
      <p class="font-semibold">Cell ${a.line_id} — DC ${a.location || '—'}</p>
      <p class="text-sm text-dark-muted">${a.auditor} · ${formatDate(a.started_at)}</p>
      <p class="text-xs text-dark-muted mt-1">Archived ${formatDate(a.archived_at)}</p>
      <div class="flex items-center gap-3 mt-3 pt-3 border-t border-dark-border">
        <a href="/report.html?id=${a.id}" class="flex-1 text-center bg-walmart-spark text-dark-bg font-semibold py-2.5 rounded-lg text-sm active:brightness-90 transition">Report</a>
        ${notes ? `<button onclick="toggleNotes('mn-${a.id}')" class="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg bg-dark-surface text-dark-muted active:bg-dark-border transition" title="Notes">📝</button>` : ''}
        <button onclick="unarchiveAudit(${a.id})" class="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg bg-dark-surface text-dark-muted active:bg-dark-border transition" title="Restore">↩️</button>
      </div>
      ${notes ? `<div id="mn-${a.id}" class="hidden mt-3 pt-3 border-t border-dark-border">${renderNotesContent(a)}</div>` : ''}
    </div>`;
}

function renderNotesRow(a, elId) {
  return `
    <tr id="${elId}" class="hidden bg-dark-surface/50 audit-notes" data-dc="${a.location || ''}">
      <td colspan="8" class="px-6 py-4">${renderNotesContent(a)}</td>
    </tr>`;
}

function renderNotesContent(a) {
  const notes = allNotes[a.id];
  if (!notes) return '';
  let html = '';
  if (notes.final) {
    html += `<div class="mb-3"><span class="text-xs font-semibold text-walmart-spark uppercase tracking-wide">Final Notes</span>
      <p class="text-sm mt-1 whitespace-pre-wrap">${notes.final}</p></div>`;
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

function filterByDC(dc) {
  document.querySelectorAll('.audit-row').forEach(row => {
    row.classList.toggle('hidden', dc && row.dataset.dc !== dc);
  });
  document.querySelectorAll('.audit-notes').forEach(row => {
    if (dc && row.dataset.dc !== dc) row.classList.add('hidden');
  });
}

async function unarchiveAudit(id) {
  if (!confirm('Restore audit to dashboard?')) return;
  await db.unarchiveAudit(id);
  loadArchive();
}

// Init
initPage();
loadArchive();
