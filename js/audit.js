// Audit checklist page logic

let auditId = null;
let audit = null;
let savedItems = {};
let photosByItem = {};

async function loadAudit() {
  const params = new URLSearchParams(window.location.search);
  auditId = params.get('id');
  console.log('🔍 Loading audit ID:', auditId);
  if (!auditId) { 
    console.error('❌ No audit ID found in URL');
    window.location.href = 'index.html'; 
    return; 
  }

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
  console.log('🎨 renderAudit called!');
  console.log('📊 Audit data:', audit);
  console.log('💾 Saved items count:', Object.keys(savedItems).length);
  
  const progress = db.computeProgress(Object.values(savedItems));
  let html = `
    <!-- Header -->
    <div class="bg-dark-card rounded-xl shadow border border-dark-border p-4 sm:p-5 mb-4">
      <div class="flex flex-col gap-3">
        <div>
          <h1 class="text-lg sm:text-xl font-bold">Audit #${audit.id}</h1>
          <p class="text-sm text-dark-muted mt-1">
            ${audit.location ? `DC ${audit.location} – ` : ''}Cell ${audit.line_id}<br class="sm:hidden">
            <span class="sm:inline"> · </span>Auditor: <strong>${audit.auditor}</strong><br class="sm:hidden">
            <span class="sm:inline"> · </span>Started ${formatDate(audit.started_at)}
          </p>
        </div>
        <div id="progress-bar">${renderProgressBar(progress)}</div>
      </div>
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
        <div id="row-${item.id}" class="audit-row px-3 sm:px-5 py-4 transition-colors duration-300 ${bgClass}">
          <div class="flex flex-col gap-3">
            <p class="text-base sm:text-sm font-medium">${item.label}</p>
            
            <!-- Buttons and controls -->
            <div class="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-2">
              <!-- Buttons row -->
              <div class="flex gap-2 sm:order-2">
                ${renderResultBtn(item.id, cat.id, 'pass', result)}
                ${renderResultBtn(item.id, cat.id, 'fail', result)}
                ${renderResultBtn(item.id, cat.id, 'na', result)}
              </div>
              <!-- Camera and note row -->
              <div class="flex gap-2 sm:order-1 flex-1">
                <label class="cursor-pointer min-w-[56px] sm:min-w-[44px] min-h-[48px] sm:min-h-[44px] lg:min-w-[36px] lg:min-h-[36px] flex items-center justify-center rounded-lg text-xl sm:text-base font-bold bg-dark-surface text-dark-muted hover:bg-dark-border hover:text-walmart-spark active:bg-dark-border transition flex-shrink-0" title="Take photo">
                  📷
                  <input type="file" accept="image/*" capture="environment" class="hidden" onchange="uploadPhoto(this, '${item.id}')">
                </label>
                <input type="text" value="${note}" placeholder="Add note..."
                       onblur="saveNote('${cat.id}', '${item.id}', this.value)"
                       class="flex-1 bg-dark-surface border border-dark-border text-dark-text rounded-lg px-3 py-3 sm:py-2 text-base sm:text-sm sm:w-36 lg:w-44 focus:outline-none focus:ring-2 focus:ring-walmart-spark placeholder-dark-muted">
              </div>
            </div>
          </div>
          <div id="photos-${item.id}" class="flex flex-wrap gap-2 mt-2">
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
                    placeholder="Overall observations, follow-up items…"></textarea>
        </div>
        <button onclick="completeAudit()"
                class="w-full sm:w-auto bg-walmart-spark text-dark-bg font-semibold px-6 py-4 rounded-lg hover:brightness-110 active:brightness-90 transition text-base">
          Complete Audit & Generate Report
        </button>
      </div>
    </div>`;

  console.log('✅ Audit HTML generated, length:', html.length, 'characters');
  console.log('🔍 First 500 chars:', html.substring(0, 500));
  
  // DEBUG: Check if buttons are in the HTML
  const buttonCount = (html.match(/onclick="saveResult/g) || []).length;
  console.log('🔘 Total buttons in HTML:', buttonCount, '(should be 93)');
  
  document.getElementById('content').innerHTML = html;
  console.log('✅ HTML inserted into DOM');
  
  // DEBUG: Count buttons in DOM
  setTimeout(() => {
    const domButtons = document.querySelectorAll('button[onclick*="saveResult"]');
    console.log('🔘 Buttons found in DOM:', domButtons.length);
    if (domButtons.length === 0) {
      console.error('❌ NO BUTTONS IN DOM! HTML was:', html.substring(0, 2000));
    } else {
      console.log('✅ First button:', domButtons[0]);
    }
  }, 100);
}

function renderResultBtn(itemId, catId, type, current) {
  const labels = { pass: '✓ Pass', fail: '✗ Fail', na: 'N/A' };
  const active = current === type;
  
  // Mobile: Full width, larger
  let mobileCls = 'audit-btn flex-1 min-h-[52px] px-4 py-3 rounded-lg text-base font-bold transition cursor-pointer';
  
  // Desktop: Compact
  let desktopCls = 'sm:flex-none sm:min-w-[80px] sm:min-h-[44px] lg:min-h-[36px] lg:w-20 sm:px-3 sm:py-2 sm:text-sm';
  
  let colorCls = '';
  if (type === 'pass') colorCls = active ? 'bg-wm-green text-white ring-2 ring-green-400' : 'bg-green-900/30 text-green-400 hover:bg-green-900/50 active:bg-green-900/50';
  else if (type === 'fail') colorCls = active ? 'bg-wm-red text-white ring-2 ring-red-400' : 'bg-red-900/30 text-red-400 hover:bg-red-900/50 active:bg-red-900/50';
  else colorCls = active ? 'bg-dark-muted text-white ring-2 ring-gray-400' : 'bg-dark-surface text-dark-muted hover:bg-dark-border active:bg-dark-border';

  const buttonHtml = `<button onclick="saveResult('${catId}', '${itemId}', '${type}')" class="${mobileCls} ${desktopCls} ${colorCls}">${labels[type]}</button>`;
  console.log('🔘 Button rendered:', type, 'for', itemId);
  return buttonHtml;
}

function renderProgressBar(p) {
  const barColor = p.failed > 0 ? 'bg-wm-red' : p.pct === 100 ? 'bg-wm-green' : 'bg-walmart-spark';
  return `
    <div class="flex flex-col sm:flex-row sm:items-center gap-2">
      <div class="flex-1 bg-dark-surface rounded-full h-3 overflow-hidden min-w-[150px]">
        <div class="h-full rounded-full transition-all duration-300 ${barColor}" style="width:${p.pct}%"></div>
      </div>
      <div class="flex items-center gap-2 text-sm font-semibold whitespace-nowrap">
        <span>${p.checked}/${p.total}</span>
        <span class="text-dark-muted font-normal">(${p.pct}%)</span>
        ${p.failed > 0 ? `<span class="text-xs font-bold text-wm-red">❌ ${p.failed} fail${p.failed !== 1 ? 's' : ''}</span>` : ''}
      </div>
    </div>`;
}

function renderPhotoThumb(photo) {
  const url = photo.url || ''; // URL is the base64 data URL
  return `
    <div class="relative group" id="photo-${photo.id}">
      <img src="${url}" alt="Audit photo" 
           onclick="viewPhotoFullScreen('${photo.id}')" 
           class="w-20 h-20 sm:w-16 sm:h-16 object-cover rounded-lg border border-dark-border hover:ring-2 hover:ring-walmart-spark transition cursor-pointer">
      <button onclick="deletePhoto('${photo.id}', '${photo.item_id}')"
              class="absolute -top-1.5 -right-1.5 bg-red-600 text-white rounded-full w-6 h-6 sm:w-5 sm:h-5 text-sm sm:text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition">&times;</button>
    </div>`;
}

function viewPhotoFullScreen(photoId) {
  const photoEl = document.querySelector(`#photo-${photoId} img`);
  if (!photoEl) return;
  
  const imgSrc = photoEl.src;
  
  // Create fullscreen overlay
  const overlay = document.createElement('div');
  overlay.className = 'fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4';
  overlay.onclick = () => overlay.remove();
  
  overlay.innerHTML = `
    <div class="relative max-w-full max-h-full">
      <img src="${imgSrc}" class="max-w-full max-h-screen object-contain" onclick="event.stopPropagation()">
      <button onclick="this.parentElement.parentElement.remove()" 
              class="absolute top-4 right-4 bg-red-600 text-white rounded-full w-10 h-10 text-2xl font-bold hover:bg-red-700 transition">
        &times;
      </button>
      <div class="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-75 text-white px-4 py-2 rounded-lg text-sm">
        Click anywhere to close
      </div>
    </div>`;
  
  document.body.appendChild(overlay);
}

async function saveResult(catId, itemId, result) {
  // If N/A, force user to enter a comment
  if (result === 'na') {
    const comment = prompt('This item is marked N/A.\n\nPlease enter a reason why this item does not apply:');
    if (!comment || !comment.trim()) {
      alert('A comment is required when marking an item as N/A.');
      return;
    }
    // Save the note first
    await db.upsertNote(auditId, catId, itemId, comment.trim());
    savedItems[itemId] = { ...(savedItems[itemId] || {}), item_id: itemId, note: comment.trim() };
    // Update the note textarea on screen
    const noteEl = document.getElementById(`note-${itemId}`);
    if (noteEl) noteEl.value = comment.trim();
  }
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
  console.log('🔴 uploadPhoto function called!', { input, itemId, hasFiles: !!input.files, fileCount: input.files?.length });
  
  if (!input.files || !input.files[0]) {
    console.warn('⚠️ No file selected');
    return;
  }
  
  const file = input.files[0];
  console.log('📸 Uploading photo for item:', itemId, 'File:', file.name, 'Size:', file.size, 'bytes');
  
  // Show loading indicator with animation
  const photoContainer = document.getElementById(`photos-${itemId}`);
  const loadingDiv = document.createElement('div');
  loadingDiv.className = 'inline-flex items-center gap-2 bg-walmart-spark text-white px-3 py-2 rounded-lg text-sm font-semibold';
  loadingDiv.innerHTML = '<span class="animate-spin">⏳</span> Compressing & uploading...';
  photoContainer.appendChild(loadingDiv);
  
  const startTime = Date.now();
  
  try {
    const path = await db.uploadPhoto(auditId, itemId, file);
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log('✅ Photo uploaded in', elapsed, 'seconds');
    
    // Show success briefly
    loadingDiv.className = 'inline-flex items-center gap-2 bg-green-600 text-white px-3 py-2 rounded-lg text-sm font-semibold';
    loadingDiv.innerHTML = '✅ Uploaded!';
    
    setTimeout(async () => {
      // Reload photos for this item
      const photos = await db.getAuditPhotos(auditId);
      console.log('📷 Total photos for audit:', photos.length);
      const itemPhotos = photos.filter(p => p.item_id === itemId);
      console.log('📷 Photos for this item:', itemPhotos.length);
      photoContainer.innerHTML = itemPhotos.map(p => renderPhotoThumb(p)).join('');
    }, 500);
  } catch (err) {
    console.error('❌ Photo upload failed:', err);
    loadingDiv.remove();
    alert('Upload failed: ' + err.message);
  }
  input.value = '';
}

async function deletePhoto(photoId, itemId) {
  if (!confirm('Delete this photo?')) return;
  await db.deletePhoto(photoId, auditId);
  document.getElementById(`photo-${photoId}`)?.remove();
}

async function completeAudit() {
  const notes = document.getElementById('final-notes').value.trim();
  const items = Object.values(savedItems);
  const status = db.computeStatus(items);
  await db.completeAudit(auditId, notes, status);
  window.location.href = `report.html?id=${auditId}`;
}

// Init
initPage();
loadAudit();
