// Action Items page logic

let allItems = [];
let editingId      = null;
let modalPhotoData  = null;
let modalPhotoData2 = null;
let inlineEditId   = null;
let inlinePhotoData  = null;
let inlinePhotoData2 = null;

// Keep in sync with the ACTION ITEM select options in action-items.html
const ACTION_ITEM_OPTIONS = [
  'FLIB (general)', 'MCPIB (general)', 'Sensor', 'Bump Stops', 'Pinch Point',
  'Transition Plates', 'PLC/HMI', 'GAC (Gateway Access Control)', 'Gap Conveyors',
  'Switch Table', 'Belt Tension', 'Cables/Wires', 'Conveyor Speed', 'Guide Rails',
  'Super Tunnel Components', 'Turn Tables', 'CIS', 'Scanner', 'Case Weigher',
  'Snugger', 'Half Snugger', 'Reject Accumulation',
  'Reject Merge Upper Section (Half Snugger)', 'Reject Print and Apply (P&A)',
  'Reject Main Lift (Reinduction Capable)', 'Reject Auxilery Lift (No Reinduction)',
  'Lift Cell', 'PND', 'Pop-Up Gate',
];
let filterStatus = '';
let filterPriority = '';
let filterDC = '';
let filterCell = '';

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
    allItems.sort((a, b) => (a.creation_date || '').localeCompare(b.creation_date || ''));
    renderPage();
  } catch (err) {
    document.getElementById('content').innerHTML =
      `<div class="text-center py-20 text-red-400">Error loading items: ${err.message}</div>`;
  }
}

function renderPage() {
  // Apply DC filter for summary metrics
  const dcFilteredItems = filterDC ? allItems.filter(i => i.dc === filterDC) : allItems;
  
  const open   = dcFilteredItems.filter(i => i.status === 'open').length;
  const inProg = dcFilteredItems.filter(i => i.status === 'in_progress').length;
  const closed = dcFilteredItems.filter(i => i.status === 'closed').length;
  const high   = dcFilteredItems.filter(i => i.priority === 'high' && i.status !== 'closed').length;

  let filtered = allItems.filter(i => {
    if (filterDC       && i.dc        !== filterDC)       return false;
    if (filterCell     && i.cell      !== filterCell)     return false;
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
      <div class="flex flex-wrap gap-2 w-full sm:w-auto">
        <button onclick="openModal()" class="flex-1 sm:flex-none bg-walmart-spark text-dark-bg font-semibold px-4 py-3 rounded-lg hover:brightness-110 active:brightness-90 transition text-sm flex items-center justify-center gap-2">
          &#43; Add Item
        </button>
        <button onclick="exportPDF('Action-Items.pdf')" 
                class="flex-1 sm:flex-none bg-dark-surface text-dark-text border border-dark-border font-semibold px-4 py-3 rounded-lg hover:bg-dark-border transition text-sm flex items-center justify-center gap-2">
          📄 Export PDF
        </button>
        <button onclick="emailPDF('Action-Items.pdf', 'Action Items Report')" 
                class="flex-1 sm:flex-none bg-dark-surface text-dark-text border border-dark-border font-semibold px-4 py-3 rounded-lg hover:bg-dark-border transition text-sm flex items-center justify-center gap-2">
          📧 Email PDF
        </button>
      </div>
    </div>

    <!-- Summary Cards -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
      <div class="bg-dark-card rounded-xl border border-dark-border p-4 text-center">
        <div class="text-2xl font-bold text-walmart-spark">${dcFilteredItems.length}</div>
        <div class="text-xs text-dark-muted mt-1">Total Items${filterDC ? ` (DC ${filterDC})` : ''}</div>
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
        <h3 class="text-base font-bold">📊 Items by Cell${filterDC ? ` (DC ${filterDC})` : ' (All Sites)'}</h3>
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
          <label class="block text-xs font-semibold text-dark-muted mb-1">Cell #</label>
          <select onchange="filterCell=this.value; renderPage()" class="bg-dark-surface border border-dark-border text-dark-text rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-walmart-spark">
            <option value="">All Cells</option>
            ${CELL_OPTIONS.map(c => `<option value="${c}" ${filterCell === c ? 'selected' : ''}>Cell ${c}</option>`).join('')}
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
        ${filterStatus || filterPriority || filterDC || filterCell ? `
        <button onclick="filterStatus=''; filterPriority=''; filterDC=''; filterCell=''; renderPage()" class="px-4 py-2 text-sm rounded-lg border border-dark-border text-dark-muted hover:bg-dark-surface transition">
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
            <th class="px-3 py-3 whitespace-nowrap">Assigned</th>
            <th class="px-3 py-3 whitespace-nowrap">Ticket</th>
            <th class="px-3 py-3 whitespace-nowrap">Created</th>
            <th class="px-3 py-3 whitespace-nowrap">Created By</th>
            <th class="px-3 py-3 whitespace-nowrap">Completed</th>
            <th class="px-3 py-3 whitespace-nowrap">Days Open</th>
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

function calculateDaysOpen(item) {
  if (!item.creation_date) return null;
  
  const startDate = new Date(item.creation_date);
  let endDate;
  
  if (item.status === 'closed' && item.completed_date) {
    endDate = new Date(item.completed_date);
  } else {
    endDate = new Date(); // Today
  }
  
  const diffTime = Math.abs(endDate - startDate);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
}

function daysOpenBadge(item) {
  const days = calculateDaysOpen(item);
  if (days === null) return '<span class="text-dark-muted">—</span>';
  
  let colorClass = '';
  let icon = '';
  
  if (item.status === 'closed') {
    // For closed items, just show days in neutral color
    colorClass = 'bg-gray-900/40 text-gray-400';
    icon = '✅';
  } else {
    // For open/in_progress, color code by age
    if (days >= 5) {
      colorClass = 'bg-red-900/40 text-red-400';
      icon = '🔴';
    } else if (days >= 3) {
      colorClass = 'bg-yellow-900/40 text-yellow-400';
      icon = '🟡';
    } else {
      colorClass = 'bg-green-900/40 text-green-400';
      icon = '🟢';
    }
  }
  
  return `<span class="px-2 py-0.5 rounded-full text-xs font-bold ${colorClass}">${icon} ${days}d</span>`;
}

function renderBarChart() {
  // Filter items by filterDC (same as main filter)
  const chartItems = filterDC ? allItems.filter(i => i.dc === filterDC) : allItems;
  
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
          <div class="mb-3">
            <!-- Cell Label and Bar -->
            <div class="flex items-center gap-3 mb-1">
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
            <!-- Breakdown Counts -->
            <div class="flex items-center gap-3 pl-20 sm:pl-24">
              <div class="flex items-center gap-4 text-xs">
                ${data.open > 0 ? `<span class="text-yellow-400 font-semibold">🟡 ${data.open} Open</span>` : ''}
                ${data.in_progress > 0 ? `<span class="text-blue-400 font-semibold">🔵 ${data.in_progress} In Progress</span>` : ''}
                ${data.closed > 0 ? `<span class="text-green-400 font-semibold">🟢 ${data.closed} Closed</span>` : ''}
              </div>
            </div>
          </div>
        `;
      }).join('')}
    </div>
    
    <!-- Legend -->
    <div class="flex flex-wrap items-center justify-center gap-4 mt-4 pt-3 border-t border-dark-border text-xs">
      <div class="flex items-center gap-2">
        <div class="w-5 h-5 bg-yellow-500 rounded"></div>
        <span class="text-dark-text font-semibold">Open</span>
      </div>
      <div class="flex items-center gap-2">
        <div class="w-5 h-5 bg-blue-500 rounded"></div>
        <span class="text-dark-text font-semibold">In Progress</span>
      </div>
      <div class="flex items-center gap-2">
        <div class="w-5 h-5 bg-green-500 rounded"></div>
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
  const hasPhoto = item.photo || item.photo2;
  const thumbCell = hasPhoto
    ? `<div class="flex gap-1">
        ${item.photo  ? `<img src="${item.photo}"  onclick="toggleItemPhoto('${item.id}')" title="Action Item Photo — click to expand"
             class="w-10 h-10 object-cover rounded cursor-pointer hover:ring-2 hover:ring-walmart-spark transition">` : ''}
        ${item.photo2 ? `<img src="${item.photo2}" onclick="toggleItemPhoto('${item.id}')" title="Resolution Photo — click to expand"
             class="w-10 h-10 object-cover rounded cursor-pointer hover:ring-2 hover:ring-blue-400 transition">` : ''}
      </div>`
    : '<span class="text-dark-muted">—</span>';

  const photoRow = hasPhoto ? `
    <tr id="photo-row-${item.id}" class="hidden ${bg}">
      <td colspan="20" class="px-4 pb-4 pt-1">
        <div class="flex flex-wrap items-start gap-6">
          ${item.photo  ? `<div><p class="text-xs font-semibold text-dark-muted mb-1">&#128247; Action Item Photo</p>
            <img src="${item.photo}" class="max-h-72 max-w-sm rounded-xl border border-dark-border object-contain shadow-lg"></div>` : ''}
          ${item.photo2 ? `<div><p class="text-xs font-semibold text-dark-muted mb-1">&#128247; Resolution Photo</p>
            <img src="${item.photo2}" class="max-h-72 max-w-sm rounded-xl border border-dark-border object-contain shadow-lg"></div>` : ''}
          <button onclick="toggleItemPhoto('${item.id}')" class="text-dark-muted hover:text-white text-xl leading-none self-start" title="Close">✕</button>
        </div>
      </td>
    </tr>` : '';

  return `
    <tr id="row-${item.id}" class="${bg} hover:bg-dark-surface/50 transition text-xs">
      <td class="px-3 py-2 font-mono text-dark-muted">${num}</td>
      <td class="px-3 py-2 whitespace-nowrap font-semibold">${item.dc || '—'}</td>
      <td class="px-3 py-2 max-w-[200px]"><div class="font-semibold text-dark-text">${item.action_item || '—'}</div></td>
      <td class="px-3 py-2 max-w-[150px] text-dark-muted">${item.notes || '—'}</td>
      <td class="px-3 py-2 whitespace-nowrap">${item.cell || '—'}</td>
      <td class="px-3 py-2 whitespace-nowrap">${priorityBadge(item.priority)}</td>
      <td class="px-3 py-2 whitespace-nowrap">${item.assigned || '—'}</td>
      <td class="px-3 py-2 whitespace-nowrap font-mono">${item.ticket || '—'}</td>
      <td class="px-3 py-2 whitespace-nowrap">${item.creation_date || '—'}</td>
      <td class="px-3 py-2 whitespace-nowrap">${item.created_by || '—'}</td>
      <td class="px-3 py-2 whitespace-nowrap">${item.completed_date || '—'}</td>
      <td class="px-3 py-2 whitespace-nowrap">${daysOpenBadge(item)}</td>
      <td class="px-3 py-2 whitespace-nowrap">${statusBadge(item.status)}</td>
      <td class="px-3 py-2 max-w-[150px] text-dark-muted">${item.resolution_notes || '—'}</td>
      <td class="px-3 py-2">${thumbCell}</td>
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
    </tr>${photoRow}`;
}

function renderMobileCard(item, num) {
  const hasPhoto = item.photo || item.photo2;
  const photo = hasPhoto ? `
    <div>
      <div class="flex gap-2">
        ${item.photo  ? `<img src="${item.photo}"  onclick="toggleItemPhoto('${item.id}')" title="Action Item Photo"
             class="w-16 h-16 object-cover rounded-lg cursor-pointer hover:ring-2 hover:ring-walmart-spark transition">` : ''}
        ${item.photo2 ? `<img src="${item.photo2}" onclick="toggleItemPhoto('${item.id}')" title="Resolution Photo"
             class="w-16 h-16 object-cover rounded-lg cursor-pointer hover:ring-2 hover:ring-blue-400 transition">` : ''}
      </div>
      <div id="photo-expand-${item.id}" class="hidden mt-3 space-y-3">
        ${item.photo  ? `<div><p class="text-xs font-semibold text-dark-muted mb-1">&#128247; Action Item Photo</p>
          <img src="${item.photo}"  class="w-full rounded-xl border border-dark-border object-contain shadow-lg"></div>` : ''}
        ${item.photo2 ? `<div><p class="text-xs font-semibold text-dark-muted mb-1">&#128247; Resolution Photo</p>
          <img src="${item.photo2}" class="w-full rounded-xl border border-dark-border object-contain shadow-lg"></div>` : ''}
        <button onclick="toggleItemPhoto('${item.id}')" class="text-xs text-dark-muted hover:text-white transition">✕ Close</button>
      </div>
    </div>` : '';
  return `
    <div id="card-${item.id}" class="bg-dark-card rounded-xl border border-dark-border p-4 ${rowBg(item)}">
      <div class="flex items-start justify-between gap-2 mb-2">
        <div class="flex items-center gap-2 flex-wrap">
          <span class="text-xs font-mono text-dark-muted">#${num}</span>
          ${priorityBadge(item.priority)}
          ${statusBadge(item.status)}
          ${daysOpenBadge(item)}
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
  closeInlineEdit(); // inline edit and modal are mutually exclusive
  try {
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
    document.getElementById('f-action-item').value   = item?.action_item    || '';
    document.getElementById('f-notes').value          = item?.notes          || '';
    document.getElementById('f-priority').value       = item?.priority       || '';
    document.getElementById('f-status').value         = item?.status         || 'open';
    document.getElementById('f-cell-type').value      = item?.cell_type      || '';
    document.getElementById('f-assigned').value       = item?.assigned       || '';
    document.getElementById('f-ticket').value         = item?.ticket         || '';
    document.getElementById('f-created-by').value     = item?.created_by     || '';
    document.getElementById('f-creation-date').value  = item?.creation_date  || new Date().toISOString().slice(0, 10);
    document.getElementById('f-completed-date').value = item?.completed_date || '';
    document.getElementById('f-resolution').value     = item?.resolution_notes || '';
    document.getElementById('f-duplicated').checked   = item?.duplicated     || false;
    document.getElementById('f-new-addition').checked = item?.new_addition   || false;

    // Photo previews
    const preview  = document.getElementById('f-photo-preview');
    const preview2 = document.getElementById('f-photo2-preview');
    if (item?.photo)  { preview.innerHTML  = `<img src="${item.photo}"  class="${THUMB}">`; modalPhotoData  = item.photo;  }
    else              { preview.innerHTML  = ''; modalPhotoData  = null; }
    if (item?.photo2) { preview2.innerHTML = `<img src="${item.photo2}" class="${THUMB}">`; modalPhotoData2 = item.photo2; }
    else              { preview2.innerHTML = ''; modalPhotoData2 = null; }

    document.getElementById('item-modal').classList.remove('hidden');
  } catch (err) {
    console.error('❌ openModal error:', err);
    alert('Could not open editor: ' + err.message);
  }
}

function closeModal() {
  document.getElementById('item-modal').classList.add('hidden');
  editingId = null;
  modalPhotoData  = null;
  modalPhotoData2 = null;
}

// Shared image compression — used by all four photo-preview functions
function compressImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => {
      const img = new Image();
      img.onload = () => {
        let w = img.width, h = img.height;
        const max = 1280;
        if (w > max || h > max) { const r = Math.min(max/w, max/h); w = Math.round(w*r); h = Math.round(h*r); }
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
}

const THUMB = 'w-16 h-16 object-cover rounded-lg border border-dark-border';

async function previewModalPhoto(input) {
  if (!input.files?.[0]) return;
  modalPhotoData = await compressImage(input.files[0]);
  document.getElementById('f-photo-preview').innerHTML = `<img src="${modalPhotoData}" class="${THUMB}">`;
}

async function previewModalPhoto2(input) {
  if (!input.files?.[0]) return;
  modalPhotoData2 = await compressImage(input.files[0]);
  document.getElementById('f-photo2-preview').innerHTML = `<img src="${modalPhotoData2}" class="${THUMB}">`;
}

async function saveItem() {
  const actionItem = document.getElementById('f-action-item').value;
  if (!actionItem) { alert('Please select an Action Item type.'); return; }

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
    assigned:         document.getElementById('f-assigned').value,

    ticket:           document.getElementById('f-ticket').value.trim(),
    created_by:       document.getElementById('f-created-by').value.trim(),
    creation_date:    document.getElementById('f-creation-date').value,
    completed_date:   document.getElementById('f-completed-date').value,
    resolution_notes: document.getElementById('f-resolution').value.trim(),
    duplicated:       document.getElementById('f-duplicated').checked,
    new_addition:     document.getElementById('f-new-addition').checked,
    photo:            modalPhotoData  || null,
    photo2:           modalPhotoData2 || null,
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
  openInlineEdit(id);
}

// ── Inline Edit ──────────────────────────────────────────────────────────────

function buildInlineFormHTML(item) {
  const dcOptions = DC_LIST.map(dc =>
    `<option value="${dc.value}"${item?.dc === dc.value ? ' selected' : ''}>${dc.label}</option>`
  ).join('');

  const cellOptions = CELL_OPTIONS.map(c =>
    `<option value="${c}"${item?.cell === c ? ' selected' : ''}>${c}</option>`
  ).join('');

  const actionOptions = ACTION_ITEM_OPTIONS.map(opt => {
    const safe = opt.replace(/&/g, '&amp;');
    return `<option value="${safe}"${item?.action_item === opt ? ' selected' : ''}>${safe}</option>`;
  }).join('');

  const sel = (val, opts) => opts.map(([v, l]) =>
    `<option value="${v}"${item?.[val] === v ? ' selected' : ''}>${l}</option>`
  ).join('');

  return `
  <div id="ie-form-panel" class="bg-dark-card border-l-4 border-walmart-spark rounded-xl p-5 space-y-4 mt-1">
    <div class="flex items-center justify-between">
      <h3 class="font-bold text-sm text-walmart-spark">&#9999;&#65039; Edit Action Item</h3>
      <button onclick="closeInlineEdit()" class="text-dark-muted hover:text-white text-xl leading-none" title="Close">&times;</button>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div><label class="block text-xs font-semibold text-dark-muted mb-1">ACTION ITEM *</label>
        <select id="ie-action-item" class="w-full bg-dark-surface border border-dark-border text-dark-text rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-walmart-spark">
          <option value="">Select action item type...</option>${actionOptions}
        </select></div>
      <div><label class="block text-xs font-semibold text-dark-muted mb-1">DC #</label>
        <select id="ie-dc" class="w-full bg-dark-surface border border-dark-border text-dark-text rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-walmart-spark">
          <option value="">Select DC...</option>${dcOptions}
        </select></div>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div><label class="block text-xs font-semibold text-dark-muted mb-1">CELL</label>
        <select id="ie-cell" class="w-full bg-dark-surface border border-dark-border text-dark-text rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-walmart-spark">
          <option value="">Select cell...</option>${cellOptions}
        </select></div>
      <div><label class="block text-xs font-semibold text-dark-muted mb-1">PRIORITY *</label>
        <select id="ie-priority" class="w-full bg-dark-surface border border-dark-border text-dark-text rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-walmart-spark">
          <option value="">Select...</option>
          ${sel('priority', [['low','&#128994; Low'],['medium','&#128993; Medium'],['high','&#128308; High']])}
        </select></div>
      <div><label class="block text-xs font-semibold text-dark-muted mb-1">STATUS *</label>
        <select id="ie-status" class="w-full bg-dark-surface border border-dark-border text-dark-text rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-walmart-spark">
          <option value="open"${!item?.status || item.status==='open' ? ' selected':''}>Open</option>
          <option value="in_progress"${item?.status==='in_progress' ? ' selected':''}>In Progress</option>
          <option value="closed"${item?.status==='closed' ? ' selected':''}>Closed</option>
        </select></div>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div><label class="block text-xs font-semibold text-dark-muted mb-1">CELL TYPE</label>
        <select id="ie-cell-type" class="w-full bg-dark-surface border border-dark-border text-dark-text rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-walmart-spark">
          <option value="">Select...</option>
          <option value="AIB"${item?.cell_type==='AIB' ? ' selected':''}>AIB</option>
          <option value="AOB"${item?.cell_type==='AOB' ? ' selected':''}>AOB</option>
          <option value="FLIB"${item?.cell_type==='FLIB' ? ' selected':''}>FLIB</option>
        </select></div>
      <div><label class="block text-xs font-semibold text-dark-muted mb-1">ASSIGNED TO</label>
        <select id="ie-assigned" class="w-full bg-dark-surface border border-dark-border text-dark-text rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-walmart-spark">
          <option value="">Select...</option>
          <option value="Symbotic"${item?.assigned==='Symbotic' ? ' selected':''}>Symbotic</option>
          <option value="Honeywell"${item?.assigned==='Honeywell' ? ' selected':''}>Honeywell</option>
          <option value="Maintenance"${item?.assigned==='Maintenance' ? ' selected':''}>Maintenance</option>
        </select></div>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div><label class="block text-xs font-semibold text-dark-muted mb-1">TICKET #</label>
        <input id="ie-ticket" type="text" placeholder="Ticket number..."
               class="w-full bg-dark-surface border border-dark-border text-dark-text rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-walmart-spark"></div>
      <div><label class="block text-xs font-semibold text-dark-muted mb-1">CREATED BY</label>
        <input id="ie-created-by" type="text" placeholder="Your name..."
               class="w-full bg-dark-surface border border-dark-border text-dark-text rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-walmart-spark"></div>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div><label class="block text-xs font-semibold text-dark-muted mb-1">CREATION DATE</label>
        <input id="ie-creation-date" type="date"
               class="w-full bg-dark-surface border border-dark-border text-dark-text rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-walmart-spark"></div>
      <div><label class="block text-xs font-semibold text-dark-muted mb-1">COMPLETED DATE</label>
        <input id="ie-completed-date" type="date"
               class="w-full bg-dark-surface border border-dark-border text-dark-text rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-walmart-spark"></div>
    </div>

    <div class="flex flex-wrap gap-6 pt-1">
      <label class="flex items-center gap-2 cursor-pointer">
        <input id="ie-duplicated" type="checkbox" class="w-4 h-4 rounded accent-walmart-spark">
        <span class="text-sm font-semibold">Duplicated</span></label>
      <label class="flex items-center gap-2 cursor-pointer">
        <input id="ie-new-addition" type="checkbox" class="w-4 h-4 rounded accent-walmart-spark">
        <span class="text-sm font-semibold">New Addition</span></label>
    </div>

    <div><label class="block text-xs font-semibold text-dark-muted mb-1">NOTES</label>
      <textarea id="ie-notes" rows="2" placeholder="Additional notes..."
                class="w-full bg-dark-surface border border-dark-border text-dark-text rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-walmart-spark"></textarea></div>

    <div><label class="block text-xs font-semibold text-dark-muted mb-1">RESOLUTION NOTES</label>
      <textarea id="ie-resolution" rows="2" placeholder="Resolution details..."
                class="w-full bg-dark-surface border border-dark-border text-dark-text rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-walmart-spark"></textarea></div>

    <div><label class="block text-xs font-semibold text-dark-muted mb-1">ACTION ITEM PHOTO</label>
      <div class="flex items-center gap-3">
        <label class="cursor-pointer bg-dark-surface border border-dark-border rounded-lg px-4 py-2 text-sm hover:bg-dark-border transition flex items-center gap-2">
          &#128247; Upload Photo
          <input id="ie-photo" type="file" accept="image/*" class="hidden" onchange="previewInlinePhoto(this)">
        </label>
        <div id="ie-photo-preview" class="flex gap-2 flex-wrap"></div>
      </div></div>

    <div><label class="block text-xs font-semibold text-dark-muted mb-1">RESOLUTION PHOTO</label>
      <div class="flex items-center gap-3">
        <label class="cursor-pointer bg-dark-surface border border-dark-border rounded-lg px-4 py-2 text-sm hover:bg-dark-border transition flex items-center gap-2">
          &#128247; Upload Photo
          <input id="ie-photo2" type="file" accept="image/*" class="hidden" onchange="previewInlinePhoto2(this)">
        </label>
        <div id="ie-photo2-preview" class="flex gap-2 flex-wrap"></div>
      </div></div>

    <div class="flex flex-col sm:flex-row gap-3 justify-end pt-2 border-t border-dark-border">
      <button onclick="closeInlineEdit()" class="px-6 py-2 rounded-lg border border-dark-border text-dark-muted hover:bg-dark-surface transition text-sm">Cancel</button>
      <button onclick="saveInlineEdit()" class="px-6 py-2 rounded-lg bg-walmart-spark text-dark-bg font-semibold hover:brightness-110 transition text-sm">Save Item</button>
    </div>
  </div>`;
}

function populateInlineFields(item) {
  document.getElementById('ie-ticket').value         = item?.ticket            || '';
  document.getElementById('ie-created-by').value     = item?.created_by        || '';
  document.getElementById('ie-creation-date').value  = item?.creation_date     || new Date().toISOString().slice(0, 10);
  document.getElementById('ie-completed-date').value = item?.completed_date    || '';
  document.getElementById('ie-notes').value          = item?.notes             || '';
  document.getElementById('ie-resolution').value     = item?.resolution_notes  || '';
  document.getElementById('ie-duplicated').checked   = item?.duplicated        || false;
  document.getElementById('ie-new-addition').checked = item?.new_addition      || false;
  if (item?.photo)  {
    document.getElementById('ie-photo-preview').innerHTML  = `<img src="${item.photo}"  class="${THUMB}">`;
  }
  if (item?.photo2) {
    document.getElementById('ie-photo2-preview').innerHTML = `<img src="${item.photo2}" class="${THUMB}">`;
  }
}

function openInlineEdit(id) {
  closeInlineEdit();
  inlineEditId    = id;
  const item      = allItems.find(i => i.id === id);
  inlinePhotoData  = item?.photo  || null;
  inlinePhotoData2 = item?.photo2 || null;

  const formHTML = buildInlineFormHTML(item);
  const isDesktop = window.innerWidth >= 768;

  if (isDesktop) {
    // Insert a new <tr> right after the photo-expand row (or main row if no photo)
    const anchor = document.getElementById(`photo-row-${id}`) || document.getElementById(`row-${id}`);
    if (anchor) {
      anchor.insertAdjacentHTML('afterend',
        `<tr id="ie-row-${id}"><td colspan="20" class="px-4 py-3">${formHTML}</td></tr>`);
    }
  } else {
    const card = document.getElementById(`card-${id}`);
    if (card) {
      card.insertAdjacentHTML('afterend',
        `<div id="ie-card-${id}" class="mt-2">${formHTML}</div>`);
    }
  }

  populateInlineFields(item);
  document.getElementById('ie-form-panel')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function closeInlineEdit() {
  if (!inlineEditId) return;
  document.getElementById(`ie-row-${inlineEditId}`)?.remove();
  document.getElementById(`ie-card-${inlineEditId}`)?.remove();
  inlineEditId     = null;
  inlinePhotoData  = null;
  inlinePhotoData2 = null;
}

async function saveInlineEdit() {
  const actionItem = document.getElementById('ie-action-item').value;
  if (!actionItem) { alert('Please select an Action Item type.'); return; }

  const priority = document.getElementById('ie-priority').value;
  if (!priority)   { alert('Please select a Priority.'); return; }

  const data = {
    action_item:      actionItem,
    notes:            document.getElementById('ie-notes').value.trim(),
    dc:               document.getElementById('ie-dc').value,
    cell:             document.getElementById('ie-cell').value,
    priority,
    status:           document.getElementById('ie-status').value,
    cell_type:        document.getElementById('ie-cell-type').value,
    assigned:         document.getElementById('ie-assigned').value,
    ticket:           document.getElementById('ie-ticket').value.trim(),
    created_by:       document.getElementById('ie-created-by').value.trim(),
    creation_date:    document.getElementById('ie-creation-date').value,
    completed_date:   document.getElementById('ie-completed-date').value,
    resolution_notes: document.getElementById('ie-resolution').value.trim(),
    duplicated:       document.getElementById('ie-duplicated').checked,
    new_addition:     document.getElementById('ie-new-addition').checked,
    photo:            inlinePhotoData  || null,
    photo2:           inlinePhotoData2 || null,
    updated_at:       new Date().toISOString(),
  };

  try {
    await database.ref(`action_items/${inlineEditId}`).update(data);
    closeInlineEdit();
    await loadActionItems();
  } catch (err) {
    alert('Failed to save: ' + err.message);
  }
}

async function previewInlinePhoto(input) {
  if (!input.files?.[0]) return;
  inlinePhotoData = await compressImage(input.files[0]);
  document.getElementById('ie-photo-preview').innerHTML = `<img src="${inlinePhotoData}" class="${THUMB}">`;
}

async function previewInlinePhoto2(input) {
  if (!input.files?.[0]) return;
  inlinePhotoData2 = await compressImage(input.files[0]);
  document.getElementById('ie-photo2-preview').innerHTML = `<img src="${inlinePhotoData2}" class="${THUMB}">`;
}

async function deleteItem(id) {
  if (!confirm('Permanently delete this action item? This cannot be undone.')) return;
  await database.ref(`action_items/${id}`).remove();
  await loadActionItems();
}

function toggleItemPhoto(id) {
  // Desktop — expand row beneath the item row
  const desktopRow = document.getElementById(`photo-row-${id}`);
  if (desktopRow) desktopRow.classList.toggle('hidden');
  // Mobile — expand panel inside the card
  const mobileExpand = document.getElementById(`photo-expand-${id}`);
  if (mobileExpand) mobileExpand.classList.toggle('hidden');
}

// Close modal on ESC key
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeModal();
});

// Init
initPage();
loadActionItems();
