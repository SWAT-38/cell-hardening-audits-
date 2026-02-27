// Report page logic

async function loadReport() {
  const params = new URLSearchParams(window.location.search);
  const auditId = parseInt(params.get('id'));
  if (!auditId) { window.location.href = '/'; return; }

  try {
    const audit = await db.getAudit(auditId);
    const items = await db.getAuditItems(auditId);
    const photos = await db.getAuditPhotos(auditId);
    const progress = db.computeProgress(items);

    const savedMap = {};
    items.forEach(i => { savedMap[i.item_id] = i; });
    const photoMap = {};
    photos.forEach(p => {
      if (!photoMap[p.item_id]) photoMap[p.item_id] = [];
      photoMap[p.item_id].push(p);
    });

    document.title = `Report \u2013 Audit #${audit.id}`;
    renderReport(audit, savedMap, photoMap, progress);
  } catch (err) {
    document.getElementById('content').innerHTML = `
      <div class="text-center py-20 text-red-400">Error: ${err.message}</div>`;
  }
}

function renderReport(audit, saved, photoMap, progress) {
  // Status banner
  const banners = {
    critical_fail: '<div class="bg-red-600 text-white rounded-xl p-5 mb-6 text-center"><p class="text-3xl font-bold">\ud83d\udea8 CRITICAL FAIL</p><p class="mt-1">One or more safety-critical items failed. Immediate corrective action required.</p></div>',
    fail: '<div class="bg-wm-red text-white rounded-xl p-5 mb-6 text-center"><p class="text-3xl font-bold">\u274c FAIL</p><p class="mt-1">One or more checklist items did not pass.</p></div>',
    pass: '<div class="bg-wm-green text-white rounded-xl p-5 mb-6 text-center"><p class="text-3xl font-bold">\u2705 PASS</p><p class="mt-1">All checklist items passed or were marked N/A.</p></div>',
  };

  let html = banners[audit.status] || banners.pass;

  // Meta grid
  html += `
    <div class="bg-dark-card rounded-xl shadow border border-dark-border p-5 mb-6 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
      <div><span class="text-dark-muted">Audit ID</span><br><strong>#${audit.id}</strong></div>
      <div><span class="text-dark-muted">DC</span><br><strong>${audit.location || '\u2014'}</strong></div>
      <div><span class="text-dark-muted">Auditor</span><br><strong>${audit.auditor}</strong></div>
      <div><span class="text-dark-muted">Cell #</span><br><strong>${audit.line_id}</strong></div>
      <div><span class="text-dark-muted">Started</span><br><strong>${formatDate(audit.started_at)}</strong></div>
      <div><span class="text-dark-muted">Completed</span><br><strong>${formatDate(audit.completed_at)}</strong></div>
      <div><span class="text-dark-muted">Items Checked</span><br><strong>${progress.checked}/${progress.total}</strong></div>
      <div><span class="text-dark-muted">Pass Rate</span><br>
        <strong class="${progress.failed > 0 ? 'text-red-400' : 'text-green-400'}">
          ${progress.passed}\u2713 / ${progress.failed}\u2717 / ${progress.na} N/A
        </strong>
      </div>
    </div>`;

  // Final notes
  if (audit.notes) {
    html += `
      <div class="bg-dark-card rounded-xl shadow border border-dark-border p-5 mb-6">
        <h3 class="font-bold mb-2">Final Notes</h3>
        <p class="text-sm whitespace-pre-wrap">${audit.notes}</p>
      </div>`;
  }

  // Categories detail
  for (const cat of CATEGORIES) {
    html += `
      <div class="bg-dark-card rounded-xl shadow border border-dark-border mb-4 overflow-hidden">
        <div class="px-5 py-3 bg-dark-surface border-b border-dark-border flex items-center gap-2">
          <span class="text-xl">${cat.icon}</span>
          <h2 class="font-bold">${cat.name}</h2>
          ${cat.critical ? '<span class="text-xs font-semibold text-wm-red bg-red-100 px-2 py-0.5 rounded-full">CRITICAL</span>' : ''}
        </div>
        <div class="divide-y divide-dark-border">`;

    for (const item of cat.items) {
      const s = saved[item.id] || {};
      const r = s.result || 'pending';
      const icons = { pass: '\u2705', fail: '\u274c', na: '\u2796', pending: '\u2b1c' };
      const bgClass = r === 'fail' ? 'bg-red-900/20' : r === 'pass' ? 'bg-green-900/20' : '';
      const itemPhotos = photoMap[item.id] || [];

      html += `
        <div class="px-5 py-2 flex flex-col gap-1 text-sm ${bgClass}">
          <div class="flex items-center gap-3">
            <span class="text-lg">${icons[r]}</span>
            <span class="flex-1">${item.label}</span>
            ${s.note ? `<span class="text-xs text-dark-muted italic">${s.note}</span>` : ''}
          </div>
          ${itemPhotos.length ? `
            <div class="flex flex-wrap gap-2 ml-8">
              ${itemPhotos.map(p => `<a href="${db.getPhotoUrl(p.storage_path)}" target="_blank"><img src="${db.getPhotoUrl(p.storage_path)}" alt="Audit photo" class="w-16 h-16 object-cover rounded-lg border border-dark-border hover:ring-2 hover:ring-walmart-spark transition"></a>`).join('')}
            </div>` : ''}
        </div>`;
    }
    html += '</div></div>';
  }

  // Actions
  html += `
    <div class="flex flex-col sm:flex-row gap-4 mt-6 mb-10">
      <a href="/" class="bg-dark-surface text-dark-text border border-dark-border font-semibold px-6 py-3 rounded-lg hover:bg-dark-border active:bg-dark-border transition text-center">\u2190 Dashboard</a>
      <button onclick="copyLink()" id="copy-btn" class="bg-walmart-spark text-dark-bg font-semibold px-6 py-3 rounded-lg hover:brightness-110 active:brightness-90 transition">\ud83d\udd17 Copy Link</button>
    </div>`;

  document.getElementById('content').innerHTML = html;
}

function copyLink() {
  navigator.clipboard.writeText(window.location.href).then(() => {
    const btn = document.getElementById('copy-btn');
    const orig = btn.innerHTML;
    btn.innerHTML = '\u2705 Copied!';
    btn.classList.replace('bg-walmart-spark', 'bg-wm-green');
    setTimeout(() => {
      btn.innerHTML = orig;
      btn.classList.replace('bg-wm-green', 'bg-walmart-spark');
    }, 2000);
  });
}

// Init
initPage();
loadReport();
