// Audit checklist page logic

let auditId = null;
let audit = null;
let savedItems = {};
let photosByItem = {};

async function loadAudit() {
  const params = new URLSearchParams(window.location.search);
  auditId = parseInt(params.get('id'));
  if (!auditId) { window.location.href = '/'; return; }

  try {
    audit = await db.getAudit(auditId);
    document.title = `Audit #${audit.id} \u2013 ${audit.line_id}`;

    const items = await db.getAuditItems(auditId);
    savedItems = {};
    items.forEach(i => { savedItems[i.item_id] = i; });

    const photos = await db.getAuditPhotos(auditId);
    photosByItem = {};
    photos.forEach(p => {
      if (!photosByItem[p.item_id]) photosByItem[p.item_id] = [];
      photosByItem[p.item_id].push(p);
    });

    renderAudit();
  } catch (err) {
    document.getElementById('content').innerHTML = `
      <div class="text-center py-20 text-red-400">Error: ${err.message}</div>`;
  }
}

function renderAudit() {
  const progress = db.computeProgress(Object.values(savedItems));
  let html = `
    <!-- Header -->
    <div class="bg-dark-card rounded-xl shadow border border-dark-border p-5 mb-4 flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 class="text-xl font-bold">Audit #${audit.id}: ${audit.location ? `DC ${audit.location} &ndash; ` : ''}Cell ${audit.line_id}</h1>
        <p class="text-sm text-dark-muted">Auditor: <strong>${audit.auditor}</strong> &middot; Started ${formatDate(audit.started_at)}</p>
      </div>
      <div id="progress-bar">${renderProgressBar(progress)}</div>
    </div>`;

  // Categories
  for (const cat of CATEGORIES) {
    html += `
    <div class="bg-dark-card rounded-xl shadow border border-dark-border mb-4 overflow-hidden">
      <button type="button" onclick="this.nextElementSibling.classList.toggle('hidden')"
              class="w-full flex items-center justify-between px-5 py-4 hover:bg-dark-surface transition cursor-pointer">
        <div class="flex items-center gap-3">
          <span class="text-2xl">${cat.icon}</span>
          <div>
            <h2 class="text-lg font-bold text-left">${cat.name}</h2>
            ${cat.critical ? '<span class="text-xs font-semibold text-wm-red bg-red-100 px-2 py-0.5 rounded-full">IMMEDIATE FAIL IF MISSED</span>' : ''}
          </div>
        </div>
        <span class="text-dark-muted text-xl">\u25BC</span>
      </button>
      <div class="divide-y divide-dark-border border-t border-dark-border">`;

    for (const item of cat.items) {
      const s = savedItems[item.id] || {};
      const result = s.result || 'pending';
      const note = s.note || '';
      const bgClass = result === 'fail' ? 'bg-red-900/20' : result === 'pass' ? 'bg-green-900/20' : result === 'na' ? 'bg-dark-surface' : '';
      const itemPhotos = photosByItem[item.id] || [];

      html += `
        <div id="row-${item.id}" class="audit-row px-4 sm:px-5 py-3 transition-colors duration-300 ${bgClass}">
          <div class="flex flex-col lg:flex-row lg:items-center gap-2">
            <p class="text-sm font-medium lg:flex-1 lg:min-w-[250px]">${item.label}</p>
            <div class="flex flex-wrap items-center gap-2">
              <label class="cursor-pointer min-w-[44px] min-h-[44px] lg:min-w-[36px] lg:min-h-[36px] flex items-center justify-center rounded-lg text-base font-bold bg-dark-surface text-dark-muted hover:bg-dark-border hover:text-walmart-spark active:bg-dark-border transition" title="Take photo">
                \ud83d\udcf7
                <input type="file" accept="image/*" capture="environment" class="hidden" onchange="uploadPhoto(this, '${item.id}')">
              </label>
              <input type="text" value="${note}" placeholder="Note"
                     onblur="saveNote('${cat.id}', '${item.id}', this.value)"
                     class="bg-dark-surface border border-dark-border text-dark-text rounded-lg px-3 py-2 text-sm w-full sm:w-36 lg:w-44 focus:outline-none focus:ring-2 focus:ring-walmart-spark placeholder-dark-muted">
              ${renderResultBtn(item.id, cat.id, 'pass', result)}
              ${renderResultBtn(item.id, cat.id, 'fail', result)}
              ${renderResultBtn(item.id, cat.id, 'na', result)}
            </div>
          </div>
          <div id="photos-${item.id}" class="flex flex-wrap gap-2 mt-1">
            ${itemPhotos.map(p => renderPhotoThumb(p)).join('')}
          </div>
        </div>`;
    }
    html += '</div></div>';
  }

  // Finalize
  html += `
    <div class="bg-dark-card rounded-xl shadow border border-dark-border p-6 mt-6">
      <h2 class="text-lg font-bold mb-3">Finalize Audit</h2>
      <div class="space-y-4">
        <div>
          <label for="final-notes" class="block text-sm font-semibold mb-1">Final Notes</label>
          <textarea id="final-notes" rows="3"
                    class="w-full bg-dark-surface border border-dark-border text-dark-text rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-walmart-spark placeholder-dark-muted"
                    placeholder="Overall observations, follow-up items\u2026"></textarea>
        </div>
        <button onclick="completeAudit()"
                class="w-full sm:w-auto bg-walmart-spark text-dark-bg font-semibold px-6 py-4 rounded-lg hover:brightness-110 active:brightness-90 transition text-base">
          Complete Audit & Generate Report
        </button>
      </div>
    </div>`;

  document.getElementById('content').innerHTML = html;
}

function renderResultBtn(itemId, catId, type, current) {
  const labels = { pass: '\u2713 Pass', fail: '\u2717 Fail', na: 'N/A' };
  const active = current === type;
  let cls = 'audit-btn flex-1 min-w-[60px] min-h-[44px] lg:min-h-[36px] lg:flex-none lg:w-20 px-3 py-2 rounded-lg text-sm font-bold transition cursor-pointer ';
  if (type === 'pass') cls += active ? 'bg-wm-green text-white ring-2 ring-green-400' : 'bg-green-900/30 text-green-400 hover:bg-green-900/50 active:bg-green-900/50';
  else if (type === 'fail') cls += active ? 'bg-wm-red text-white ring-2 ring-red-400' : 'bg-red-900/30 text-red-400 hover:bg-red-900/50 active:bg-red-900/50';
  else cls += active ? 'bg-dark-muted text-white ring-2 ring-gray-400' : 'bg-dark-surface text-dark-muted hover:bg-dark-border active:bg-dark-border';

  return `<button class="${cls}" onclick="saveResult('${catId}', '${itemId}', '${type}')">${labels[type]}</button>`;
}

function renderProgressBar(p) {
  const barColor = p.failed > 0 ? 'bg-wm-red' : 'bg-wm-green';
  return `
    <div class="flex items-center gap-3">
      <div class="w-48 bg-wm-gray-50 rounded-full h-3 overflow-hidden">
        <div class="h-full rounded-full transition-all duration-300 ${barColor}" style="width:${p.pct}%"></div>
      </div>
      <span class="text-sm font-semibold whitespace-nowrap">
        ${p.checked}/${p.total} <span class="text-wm-gray-100 font-normal">(${p.pct}%)</span>
      </span>
      ${p.failed > 0 ? `<span class="text-xs font-bold text-wm-red">\u274c ${p.failed} fail${p.failed !== 1 ? 's' : ''}</span>` : ''}
    </div>`;
}

function renderPhotoThumb(photo) {
  const url = db.getPhotoUrl(photo.storage_path);
  return `
    <div class="relative group" id="photo-${photo.id}">
      <a href="${url}" target="_blank">
        <img src="${url}" alt="Audit photo" class="w-16 h-16 object-cover rounded-lg border border-dark-border hover:ring-2 hover:ring-walmart-spark transition">
      </a>
      <button onclick="deletePhoto(${photo.id}, '${photo.storage_path}', '${photo.item_id}')"
              class="absolute -top-1.5 -right-1.5 bg-red-600 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition">&times;</button>
    </div>`;
}

async function saveResult(catId, itemId, result) {
  await db.upsertItem(auditId, catId, itemId, result);
  savedItems[itemId] = { ...(savedItems[itemId] || {}), item_id: itemId, result };
  // Update row color
  const row = document.getElementById(`row-${itemId}`);
  row.classList.remove('bg-green-900/20', 'bg-red-900/20', 'bg-dark-surface');
  if (result === 'pass') row.classList.add('bg-green-900/20');
  else if (result === 'fail') row.classList.add('bg-red-900/20');
  else if (result === 'na') row.classList.add('bg-dark-surface');
  // Update buttons
  row.querySelectorAll('.audit-btn').forEach(btn => {
    const btnType = btn.textContent.trim().includes('Pass') ? 'pass' : btn.textContent.trim().includes('Fail') ? 'fail' : 'na';
    btn.className = btn.className.replace(/bg-wm-green|bg-wm-red|bg-dark-muted|ring-2|ring-green-400|ring-red-400|ring-gray-400|text-white/g, '');
    if (btnType === result) {
      if (result === 'pass') btn.classList.add('bg-wm-green', 'text-white', 'ring-2', 'ring-green-400');
      else if (result === 'fail') btn.classList.add('bg-wm-red', 'text-white', 'ring-2', 'ring-red-400');
      else btn.classList.add('bg-dark-muted', 'text-white', 'ring-2', 'ring-gray-400');
    }
  });
  // Update progress
  const progress = db.computeProgress(Object.values(savedItems));
  document.getElementById('progress-bar').innerHTML = renderProgressBar(progress);
}

async function saveNote(catId, itemId, note) {
  await db.upsertNote(auditId, catId, itemId, note);
  savedItems[itemId] = { ...(savedItems[itemId] || {}), item_id: itemId, note };
}

async function uploadPhoto(input, itemId) {
  if (!input.files || !input.files[0]) return;
  try {
    const path = await db.uploadPhoto(auditId, itemId, input.files[0]);
    // Reload photos for this item
    const photos = await db.getAuditPhotos(auditId);
    const itemPhotos = photos.filter(p => p.item_id === itemId);
    document.getElementById(`photos-${itemId}`).innerHTML = itemPhotos.map(p => renderPhotoThumb(p)).join('');
  } catch (err) {
    alert('Upload failed: ' + err.message);
  }
  input.value = '';
}

async function deletePhoto(photoId, storagePath, itemId) {
  if (!confirm('Delete this photo?')) return;
  await db.deletePhoto(photoId, storagePath);
  document.getElementById(`photo-${photoId}`)?.remove();
}

async function completeAudit() {
  const notes = document.getElementById('final-notes').value.trim();
  const items = Object.values(savedItems);
  const status = db.computeStatus(items);
  await db.completeAudit(auditId, notes, status);
  window.location.href = `/report.html?id=${auditId}`;
}

// Init
initPage();
loadAudit();
