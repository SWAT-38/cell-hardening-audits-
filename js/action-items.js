// Action Items page logic

let allItems = [];
let editingId = null;
let modalPhotoData = null;
let filterStatus = '';
let filterPriority = '';
let filterDC = '';
let chartDC = ''; // Separate filter for the chart

const DC_LIST = [
  { value: '6006', label: '6006 – Cullman, AL' },
  { value: '6010', label: '6010 – Douglas, GA' },
  { value: '6011', label: '6011 – Brookhaven, MS' },
  { value: '6012', label: '6012 – Plainview, TX' },
  { value: '6016', label: '6016 – New Braunfels, TX' },
  { value: '6017', label: '6017 – Seymour, IN' },
  { value: '6018', label: '6018 – Searcy, AR' },
  { value: '6019', label: '6019 – Loveland, CO' },
  { value: '6020', label: '6020 – Brooksville, FL' },
  { value: '6021', label: '6021 – Porterville, CA' },
  { value: '6023', label: '6023 – Sutherland, VA' },
  { value: '6024', label: '6024 – Grove City, OH' },
  { value: '6025', label: '6025 – Menomonie, WI' },
  { value: '6026', label: '6026 – Red Bluff, CA' },
  { value: '6027', label: '6027 – Woodland, PA' },
  { value: '6030', label: '6030 – Raymond, NH' },
  { value: '6031', label: '6031 – Buckeye, AZ' },
  { value: '6035', label: '6035 – Ottawa, KS' },
  { value: '6036', label: '6036 – Palestine, TX' },
  { value: '6037', label: '6037 – Hermiston, OR' },
  { value: '6038', label: '6038 – Marcy, NY' },
  { value: '6039', label: '6039 – Midway, TN' },
  { value: '6040', label: '6040 – Hope Mills, NC' },
];

async function loadActionItems() {
  try {
    const snap = await database.ref('action_items').once('value');
    allItems = [];
    snap.forEach(child => {
      allItems.push({ id: child.key, ...child.val() });
    });
    allItems.sort((a, b) => (b.creation_date || '').localeCompare(a.creation_date || ''));
    renderPage();
  } catch (err) {
    document.getElementById('content').innerHTML =
      `<div class="text-center py-20 text-red-400">Error loading items: ${err.message}</div>`;
  }
}

function renderPage() {
  const open   = allItems.filter(i => i.status === 'open').length;
  const inProg = allItems.filter(i => i.status === 'in_progress').length;
  const closed = allItems.filter(i => i.status === 'closed').length;
  const high   = allItems.filter(i => i.priority === 'high' && i.status !== 'closed').length;

  let filtered = allItems.filter(i => {
    if (filterDC       && i.dc        !== filterDC)       return false;
    if (filterStatus   && i.status    !== filterStatus)   return false;
    if (filterPriority && i.priority  !== filterPriority) return false;
    return true;
  });

  document.getElementById('content').innerHTML = `
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
      <div>
        <h1 class="text-2xl font-bold">&#128203; Action Items</h1>
        <p class="text-sm text-dark-muted mt-1">Track open items and follow-ups</p>
      </div>
      <button onclick="openModal()" class="w-full sm:w-auto bg-walmart-spark text-dark-bg font-semibold px-6 py-3 rounded-lg hover:brightness-110 active:brightness-90 transition text-sm flex items-center justify-center gap-2">
        &#43; Add Action Item
      </button>
    </div>

    <!-- Summary Cards -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
      <div class="bg-dark-card rounded-xl border border-dark-border p-4 text-center">
        <div class="text-2xl font-bold text-walmart-spark">${allItems.length}</div>
        <div class="text-xs text-dark-muted mt-1">Total Items</div>
      </div>
      <div class="bg-dark-card rounded-xl border border-dark-border p-4 text-center">
        <div class="text-2xl font-bold text-yellow-400">${open}</div>
        <div class="text-xs text-dark-muted mt-1">Open</div>
      </div>
      <div class="bg-dark-card rounded-xl border border-dark-border p-4 text-center">
        <div class="text-2xl font-bold text-blue-400">${inProg}</div>
        <div class="text-xs text-dark-muted mt-1">In Progress</div>
      </div>
      <div class="bg-dark-card rounded-xl border border-dark-border p-4 text-center">
        <div class="text-2xl font-bold text-green-400">${closed}</div>
        <div class="text-xs text-dark-muted mt-1">Closed</div>
      </div>
    </div>

    <!-- Bar Chart -->
    <div class="bg-dark-card rounded-xl border border-dark-border p-4 mb-4">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <h3 class="text-base font-bold">📊 Items by Cell</h3>
        <div class="flex items-center gap-2">
          <label class="text-xs font-semibold text-dark-muted">View:</label>
          <select onchange="chartDC=this.value; renderPage()" class="bg-dark-surface border border-dark-border text-dark-text rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-walmart-spark">
            <option value="" ${chartDC === '' ? 'selected' : ''}>All Sites</option>
            ${DC_LIST.map(dc => `<option value="${dc.value}" ${chartDC === dc.value ? 'selected' : ''}>${dc.label}</option>`).join('')}
          </select>
        </div>
      </div>
      ${renderBarChart()}
    </div>

    ${high > 0 ? `
    <div class="bg-red-900/30 border border-red-800 rounded-xl p-3 mb-4 flex items-center gap-3">
      <span class="text-xl">&#128680;</span>
      <span class="text-sm font-semibold text-red-400">${high} HIGH priority item${high !== 1 ? 's' : ''} still open!</span>
    </div>` : ''}

    <!-- Filters -->
    <div class="bg-dark-card rounded-xl border border-dark-border p-4 mb-4">
      <div class="flex flex-wrap gap-3 items-end">
        <div>
          <label class="block text-xs font-semibold text-dark-muted mb-1">DC #</label>
          <select onchange="filterDC=this.value; renderPage()" class="bg-dark-surface border border-dark-border text-dark-text rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-walmart-spark">
            <option value="">All DCs</option>
            ${DC_LIST.map(dc => `<option value="${dc.value}" ${filterDC === dc.value ? 'selected' : ''}>${dc.label}</option>`).join('')}
          </select>
        </div>
        <div>
          <label class="block text-xs font-semibold text-dark-muted mb-1">Filter by Status</label>
          <select onchange="filterStatus=this.value; renderPage()" class="bg-dark-surface border border-dark-border text-dark-text rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-walmart-spark">
            <option value="">All Statuses</option>
            <option value="open" ${filterStatus==='open'?'selected':''}>Open</option>
            <option value="in_progress" ${filterStatus==='in_progress'?'selected':''}>In Progress</option>
            <option value="closed" ${filterStatus==='closed'?'selected':''}>Closed</option>
          </select>
        </div>
        <div>
          <label class="block text-xs font-semibold text-dark-muted mb-1">Filter by Priority</label>
          <select onchange="filterPriority=this.value; renderPage()" class="bg-dark-surface border border-dark-border text-dark-text rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-walmart-spark">
            <option value="">All Priorities</option>
            <option value="high" ${filterPriority==='high'?'selected':''}>&#128308; High</option>
            <option value="medium" ${filterPriority==='medium'?'selected':''}>&#128993; Medium</option>
            <option value="low" ${filterPriority==='low'?'selected':''}>&#128994; Low</option>
          </select>
        </div>
        ${filterStatus || filterPriority || filterDC ? `
        <button onclick="filterStatus=''; filterPriority=''; filterDC=''; renderPage()" class="px-4 py-2 text-sm rounded-lg border border-dark-border text-dark-muted hover:bg-dark-surface transition">
          &#10005; Clear Filters
        </button>` : ''}
        <div class="text-xs text-dark-muted ml-auto pt-4">Showing ${filtered.length} of ${allItems.length} items</div>
      </div>
    </div>

    <!-- Desktop Table -->
    <div class="hidden md:block overflow-x-auto bg-dark-card rounded-xl shadow border border-dark-border">
      <table class="w-full text-left text-xs">
        <thead class="bg-dark-surface text-dark-muted uppercase tracking-wide">
          <tr>
            <th class="px-3 py-3 whitespace-nowrap">#</th>
            <th class="px-3 py-3 whitespace-nowrap">DC</th>
            <th class="px-3 py-3 whitespace-nowrap">Action Item</th>
            <th class="px-3 py-3 whitespace-nowrap">Notes</th>
            <th class="px-3 py-3 whitespace-nowrap">Cell</th>
            <th class="px-3 py-3 whitespace-nowrap">Priority</th>
            <th class="px-3 py-3 whitespace-nowrap">Owner</th>
            <th class="px-3 py-3 whitespace-nowrap">Assigned</th>
            <th class="px-3 py-3 whitespace-nowrap">Ticket</th>
            <th class="px-3 py-3 whitespace-nowrap">Created</th>
            <th class="px-3 py-3 whitespace-nowrap">Created By</th>
            <th class="px-3 py-3 whitespace-nowrap">Completed</th>
            <th class="px-3 py-3 whitespace-nowrap">Status</th>
            <th class="px-3 py-3 whitespace-nowrap">Resolution</th>
            <th class="px-3 py-3 whitespace-nowrap">Pic</th>
            <th class="px-3 py-3 whitespace-nowrap">Cell Type</th>
            <th class="px-3 py-3 whitespace-nowrap">Dup</th>
            <th class="px-3 py-3 whitespace-nowrap">FT/PL</th>
            <th class="px-3 py-3 whitespace-nowrap">New Add.</th>
            <th class="px-3 py-3 whitespace-nowrap">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-dark-border">
          ${filtered.length === 0 ? `
          <tr><td colspan="20" class="text-center py-12 text-dark-muted">No action items found</td></tr>` :
          filtered.map((item, idx) => renderDesktopRow(item, idx + 1)).join('')}
        </tbody>
      </table>
    </div>

    <!-- Mobile Cards -->
    <div class="md:hidden space-y-3">
      ${filtered.length === 0
        ? `<div class="text-center py-12 text-dark-muted bg-dark-card rounded-xl border border-dark-border">No action items found</div>`
        : filtered.map((item, idx) => renderMobileCard(item, idx + 1)).join('')}
    </div>`;
}

function priorityBadge(p) {
  if (p === 'high')   return '<span class="px-2 py-0.5 rounded-full text-xs font-bold bg-red-900/40 text-red-400">&#128308; High</span>';
  if (p === 'medium') return '<span class="px-2 py-0.5 rounded-full text-xs font-bold bg-yellow-900/40 text-yellow-400">&#128993; Medium</span>';
  if (p === 'low')    return '<span class="px-2 py-0.5 rounded-full text-xs font-bold bg-green-900/40 text-green-400">&#128994; Low</span>';
  return '<span class="text-dark-muted">—</span>';
}

function statusBadge(s) {
  if (s === 'open')        return '<span class="px-2 py-0.5 rounded-full text-xs font-bold bg-yellow-900/40 text-yellow-400">Open</span>';
  if (s === 'in_progress') return '<span class="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-900/40 text-blue-400">In Progress</span>';
  if (s === 'closed')      return '<span class="px-2 py-0.5 rounded-full text-xs font-bold bg-green-900/40 text-green-400">Closed</span>';
  return '—';
}

function renderBarChart() {
  // Filter items by chartDC
  const chartItems = chartDC ? allItems.filter(i => i.dc === chartDC) : allItems;
  
  // Group by cell
  const cellData = {};
  chartItems.forEach(item => {
    const cell = item.cell || 'Unknown';
    if (!cellData[cell]) {
      cellData[cell] = { open: 0, in_progress: 0, closed: 0, total: 0 };
    }
    cellData[cell][item.status] = (cellData[cell][item.status] || 0) + 1;
    cellData[cell].total++;
  });

  // Sort cells
  const sortedCells = Object.keys(cellData).sort();
  
  if (sortedCells.length === 0) {
    return `
      <div class="text-center py-8 text-dark-muted text-sm">
        <p class="mb-2">No action items yet</p>
        <p class="text-xs">Add some items to see the chart!</p>
      </div>`;
  }

  // Find max for scaling
  const maxTotal = Math.max(...Object.values(cellData).map(d => d.total));
  
  return `
    <div class="space-y-3">
      ${sortedCells.map(cell => {
        const data = cellData[cell];
        const openPct = (data.open / data.total) * 100;
        const inProgPct = (data.in_progress / data.total) * 100;
        const closedPct = (data.closed / data.total) * 100;
        
        return `
          <div class="flex items-center gap-3">
            <div class="w-20 sm:w-24 text-xs font-semibold text-dark-text flex-shrink-0">
              ${cell === 'Unknown' ? '<span class="text-dark-muted">No Cell</span>' : `Cell ${cell}`}
            </div>
            <div class="flex-1">
              <div class="relative h-10 bg-dark-surface rounded-lg overflow-hidden border border-dark-border">
                <!-- Open -->
                ${data.open > 0 ? `
                <div class="absolute left-0 top-0 h-full bg-yellow-500 flex items-center justify-center text-xs font-bold text-gray-900" 
                     style="width: ${openPct}%" title="${data.open} Open">
                  ${openPct > 12 ? data.open : ''}
                </div>` : ''}
                <!-- In Progress -->
                ${data.in_progress > 0 ? `
                <div class="absolute top-0 h-full bg-blue-500 flex items-center justify-center text-xs font-bold text-white" 
                     style="left: ${openPct}%; width: ${inProgPct}%" title="${data.in_progress} In Progress">
                  ${inProgPct > 12 ? data.in_progress : ''}
                </div>` : ''}
                <!-- Closed -->
                ${data.closed > 0 ? `
                <div class="absolute top-0 h-full bg-green-500 flex items-center justify-center text-xs font-bold text-white" 
                     style="left: ${openPct + inProgPct}%; width: ${closedPct}%" title="${data.closed} Closed">
                  ${closedPct > 12 ? data.closed : ''}
                </div>` : ''}
              </div>
            </div>
            <div class="w-16 text-right flex items-center justify-end gap-2 flex-shrink-0">
              <span class="text-xs font-semibold text-dark-text">${data.total}</span>
              <span class="text-xs text-dark-muted">total</span>
            </div>
          </div>
        `;
      }).join('')}
    </div>
    
    <!-- Legend -->
    <div class="flex flex-wrap items-center justify-center gap-4 mt-4 pt-3 border-t border-dark-border text-xs">
      <div class="flex items-center gap-2">
        <div class="w-5 h-5 bg-yellow-500 rounded border border-gray-600"></div>
        <span class="text-dark-text font-semibold">Open</span>
      </div>
      <div class="flex items-center gap-2">
        <div class="w-5 h-5 bg-blue-500 rounded border border-gray-600"></div>
        <span class="text-dark-text font-semibold">In Progress</span>
      </div>
      <div class="flex items-center gap-2">
        <div class="w-5 h-5 bg-green-500 rounded border border-gray-600"></div>
        <span class="text-dark-text font-semibold">Closed</span>
      </div>
    </div>
  `;
}

function rowBg(item) {
  if (item.status === 'closed')      return 'bg-green-900/10';
  if (item.priority === 'high')      return 'bg-red-900/10';
  if (item.priority === 'medium')    return 'bg-yellow-900/10';
  return '';
}

function renderDesktopRow(item, num) {
  const bg = rowBg(item);
  const photo = item.photo
    ? `<img src="${item.photo}" onclick="viewActionPhoto('${item.id}')" class="w-10 h-10 object-cover rounded cursor-pointer hover:ring-2 hover:ring-walmart-spark">`
    : '<span class="text-dark-muted">—</span>';
  return `
    <tr class="${bg} hover:bg-dark-surface/50 transition text-xs">
      <td class="px-3 py-2 font-mono text-dark-muted">${num}</td>
      <td class="px-3 py-2 whitespace-nowrap font-semibold">${item.dc || '—'}</td>
      <td class="px-3 py-2 max-w-[200px]"><div class="font-semibold text-dark-text">${item.action_item || '—'}</div></td>
      <td class="px-3 py-2 max-w-[150px] text-dark-muted">${item.notes || '—'}</td>
      <td class="px-3 py-2 whitespace-nowrap">${item.cell || '—'}</td>
      <td class="px-3 py-2 whitespace-nowrap">${priorityBadge(item.priority)}</td>
      <td class="px-3 py-2 whitespace-nowrap">${item.owner || '—'}</td>
      <td class="px-3 py-2 whitespace-nowrap">${item.assigned || '—'}</td>
      <td class="px-3 py-2 whitespace-nowrap font-mono">${item.ticket || '—'}</td>
      <td class="px-3 py-2 whitespace-nowrap">${item.creation_date || '—'}</td>
      <td class="px-3 py-2 whitespace-nowrap">${item.created_by || '—'}</td>
      <td class="px-3 py-2 whitespace-nowrap">${item.completed_date || '—'}</td>
      <td class="px-3 py-2 whitespace-nowrap">${statusBadge(item.status)}</td>
      <td class="px-3 py-2 max-w-[150px] text-dark-muted">${item.resolution_notes || '—'}</td>
      <td class="px-3 py-2">${photo}</td>
      <td class="px-3 py-2 whitespace-nowrap">${item.cell_type || '—'}</td>
      <td class="px-3 py-2 text-center">${item.duplicated ? '✅' : '—'}</td>
      <td class="px-3 py-2 whitespace-nowrap">${item.cell_type || '—'}</td>
      <td class="px-3 py-2 text-center">${item.new_addition ? '✅' : '—'}</td>
      <td class="px-3 py-2 whitespace-nowrap">
        <div class="flex gap-2">
          <button onclick="editItem('${item.id}')" class="text-walmart-spark hover:underline text-xs">✏️ Edit</button>
          <button onclick="deleteItem('${item.id}')" class="text-red-400 hover:underline text-xs">🗑️</button>
        </div>
      </td>
    </tr>`;
}

function renderMobileCard(item, num) {
  const photo = item.photo
    ? `<img src="${item.photo}" onclick="viewActionPhoto('${item.id}')" class="w-16 h-16 object-cover rounded-lg cursor-pointer hover:ring-2 hover:ring-walmart-spark">`
    : '';
  return `
    <div class="bg-dark-card rounded-xl border border-dark-border p-4 ${rowBg(item)}">
      <div class="flex items-start justify-between gap-2 mb-2">
        <div class="flex items-center gap-2">
          <span class="text-xs font-mono text-dark-muted">#${num}</span>
          ${priorityBadge(item.priority)}
          ${statusBadge(item.status)}
        </div>
        <div class="flex gap-2">
          <button onclick="editItem('${item.id}')" class="text-walmart-spark text-xs">✏️</button>
          <button onclick="deleteItem('${item.id}')" class="text-red-400 text-xs">🗑️</button>
        </div>
      </div>
      <p class="font-semibold text-sm mb-2">${item.action_item || '—'}</p>
      <div class="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-dark-muted">
        ${item.dc ? `<div><span class="font-semibold">DC:</span> ${item.dc}</div>` : ''}
        ${item.cell ? `<div><span class="font-semibold">Cell:</span> ${item.cell}</div>` : ''}
        ${item.owner ? `<div><span class="font-semibold">Owner:</span> ${item.owner}</div>` : ''}
        ${item.assigned ? `<div><span class="font-semibold">Assigned:</span> ${item.assigned}</div>` : ''}
        ${item.ticket ? `<div><span class="font-semibold">Ticket:</span> ${item.ticket}</div>` : ''}
        ${item.creation_date ? `<div><span class="font-semibold">Created:</span> ${item.creation_date}</div>` : ''}
        ${item.completed_date ? `<div><span class="font-semibold">Completed:</span> ${item.completed_date}</div>` : ''}
      </div>
      ${item.notes ? `<p class="text-xs text-dark-muted mt-2 border-t border-dark-border pt-2">${item.notes}</p>` : ''}
      ${photo ? `<div class="mt-2">${photo}</div>` : ''}
    </div>`;
}

function openModal(id = null) {
  editingId = id;
  modalPhotoData = null;

  const item = id ? allItems.find(i => i.id === id) : null;

  document.getElementById('modal-title').textContent = id ? 'Edit Action Item' : 'Add Action Item';

  // Populate DCs
  const dcSel = document.getElementById('f-dc');
  dcSel.innerHTML = '<option value="">Select DC...</option>';
  DC_LIST.forEach(dc => {
    dcSel.innerHTML += `<option value="${dc.value}" ${item?.dc === dc.value ? 'selected' : ''}>${dc.label}</option>`;
  });

  // Populate cells
  const cellSel = document.getElementById('f-cell');
  cellSel.innerHTML = '<option value="">Select cell...</option>';
  CELL_OPTIONS.forEach(c => {
    cellSel.innerHTML += `<option value="${c}" ${item?.cell === c ? 'selected' : ''}>${c}</option>`;
  });

  // Fill form
  document.getElementById('f-action-item').value    = item?.action_item    || '';
  document.getElementById('f-notes').value           = item?.notes          || '';
  document.getElementById('f-priority').value        = item?.priority       || '';
  document.getElementById('f-status').value          = item?.status         || 'open';
  document.getElementById('f-cell-type').value       = item?.cell_type      || '';
  document.getElementById('f-owner').value           = item?.owner          || '';
  document.getElementById('f-assigned').value        = item?.assigned       || '';
  document.getElementById('f-ticket').value          = item?.ticket         || '';
  document.getElementById('f-created-by').value      = item?.created_by     || '';
  document.getElementById('f-creation-date').value   = item?.creation_date  || new Date().toISOString().slice(0, 10);
  document.getElementById('f-completed-date').value  = item?.completed_date || '';
  document.getElementById('f-resolution').value      = item?.resolution_notes || '';
  document.getElementById('f-duplicated').checked    = item?.duplicated     || false;
  document.getElementById('f-new-addition').checked  = item?.new_addition   || false;

  // Photo preview
  const preview = document.getElementById('f-photo-preview');
  if (item?.photo) {
    preview.innerHTML = `<img src="${item.photo}" class="w-16 h-16 object-cover rounded-lg border border-dark-border">`;
    modalPhotoData = item.photo;
  } else {
    preview.innerHTML = '';
  }

  document.getElementById('item-modal').classList.remove('hidden');
}

function closeModal() {
  document.getElementById('item-modal').classList.add('hidden');
  editingId = null;
  modalPhotoData = null;
}

async function previewModalPhoto(input) {
  if (!input.files || !input.files[0]) return;

  const file = input.files[0];

  // Compress
  modalPhotoData = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => {
      const img = new Image();
      img.onload = () => {
        let w = img.width, h = img.height;
        const max = 1280;
        if (w > max || h > max) {
          const r = Math.min(max / w, max / h);
          w = Math.round(w * r); h = Math.round(h * r);
        }
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d', { alpha: false }).drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', 0.75));
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  document.getElementById('f-photo-preview').innerHTML =
    `<img src="${modalPhotoData}" class="w-16 h-16 object-cover rounded-lg border border-dark-border">`;
}

async function saveItem() {
  const actionItem = document.getElementById('f-action-item').value.trim();
  if (!actionItem) { alert('Please enter an Action Item description.'); return; }

  const priority = document.getElementById('f-priority').value;
  if (!priority) { alert('Please select a Priority.'); return; }

  const data = {
    action_item:      actionItem,
    notes:            document.getElementById('f-notes').value.trim(),
    dc:               document.getElementById('f-dc').value,
    cell:             document.getElementById('f-cell').value,
    priority,
    status:           document.getElementById('f-status').value,
    cell_type:        document.getElementById('f-cell-type').value,
    owner:            document.getElementById('f-owner').value.trim(),
    assigned:         document.getElementById('f-assigned').value.trim(),
    ticket:           document.getElementById('f-ticket').value.trim(),
    created_by:       document.getElementById('f-created-by').value.trim(),
    creation_date:    document.getElementById('f-creation-date').value,
    completed_date:   document.getElementById('f-completed-date').value,
    resolution_notes: document.getElementById('f-resolution').value.trim(),
    duplicated:       document.getElementById('f-duplicated').checked,
    new_addition:     document.getElementById('f-new-addition').checked,
    photo:            modalPhotoData || null,
    updated_at:       new Date().toISOString(),
  };

  try {
    if (editingId) {
      await database.ref(`action_items/${editingId}`).update(data);
    } else {
      data.created_at = new Date().toISOString();
      await database.ref('action_items').push(data);
    }
    closeModal();
    await loadActionItems();
  } catch (err) {
    alert('Failed to save: ' + err.message);
  }
}

function editItem(id) {
  openModal(id);
}

async function deleteItem(id) {
  if (!confirm('Permanently delete this action item? This cannot be undone.')) return;
  await database.ref(`action_items/${id}`).remove();
  await loadActionItems();
}

function viewActionPhoto(id) {
  const item = allItems.find(i => i.id === id);
  if (!item?.photo) return;

  const overlay = document.createElement('div');
  overlay.className = 'fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4';
  overlay.onclick = () => overlay.remove();
  overlay.innerHTML = `
    <div class="relative max-w-full max-h-full">
      <img src="${item.photo}" class="max-w-full max-h-screen object-contain" onclick="event.stopPropagation()">
      <button onclick="this.parentElement.parentElement.remove()"
              class="absolute top-4 right-4 bg-red-600 text-white rounded-full w-10 h-10 text-2xl font-bold hover:bg-red-700 transition">&times;</button>
      <div class="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-75 text-white px-4 py-2 rounded-lg text-sm">Click anywhere to close</div>
    </div>`;
  document.body.appendChild(overlay);
}

// Close modal on ESC key
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeModal();
});

// Init
initPage();
loadActionItems();
