// Shared navigation and layout utilities

function renderNav() {
  return `
  <nav class="bg-dark-card text-white shadow-lg border-b border-dark-border">
    <div class="max-w-6xl lg:max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-2">
      <a href="index.html" class="flex items-center gap-2 text-lg sm:text-xl font-bold tracking-tight hover:opacity-90 shrink-0">
        <span class="text-walmart-spark text-2xl">🤖</span>
        <span class="hidden sm:inline">Cell Hardening Audit</span>
        <span class="sm:hidden">Audit</span>
      </a>
      <div class="flex items-center gap-2">
        <a href="index.html" title="Dashboard (Alt+D)"
           class="bg-dark-surface text-dark-text border border-dark-border font-semibold px-3 py-2 lg:px-4 rounded-lg hover:bg-dark-border transition text-sm">
          <span class="sm:hidden">📋</span>
          <span class="hidden sm:inline">📋 Dashboard</span>
        </a>
        <a href="archive.html" title="Archive (Alt+A)"
           class="bg-dark-surface text-dark-text border border-dark-border font-semibold px-3 py-2 lg:px-4 rounded-lg hover:bg-dark-border transition text-sm">
          <span class="sm:hidden">📖</span>
          <span class="hidden sm:inline">📖 Archive</span>
        </a>
        <a href="new-audit.html" title="New Audit (Alt+N)"
           class="bg-walmart-spark text-wm-gray-160 font-semibold px-3 py-2 lg:px-4 rounded-lg hover:brightness-110 transition text-sm">
          <span class="sm:hidden">+</span>
          <span class="hidden sm:inline">+ New Audit</span>
        </a>
      </div>
    </div>
  </nav>`;
}

function renderFooter() {
  return `
  <footer class="text-center text-sm text-dark-muted py-6">
    Cell Hardening Audit &middot; Walmart Supply Chain
  </footer>`;
}

function renderStatusBadge(status) {
  const badges = {
    pass: '<span class="px-2 py-0.5 rounded-full text-xs font-semibold bg-green-900/40 text-green-400">✅ Pass</span>',
    fail: '<span class="px-2 py-0.5 rounded-full text-xs font-semibold bg-red-900/40 text-red-400">❌ Fail</span>',
    critical_fail: '<span class="px-2 py-0.5 rounded-full text-xs font-semibold bg-red-900/60 text-red-300">🚨 Critical</span>',
    in_progress: '<span class="px-2 py-0.5 rounded-full text-xs font-semibold bg-yellow-900/40 text-yellow-400">🟡 In Progress</span>',
  };
  return badges[status] || badges.in_progress;
}

function formatDate(iso) {
  if (!iso) return '—';
  
  try {
    const date = new Date(iso);
    
    // Convert to CST/CDT (America/Chicago timezone)
    const options = {
      timeZone: 'America/Chicago',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    };
    
    const formatted = date.toLocaleString('en-US', options);
    
    // Get timezone abbreviation (CST or CDT)
    const tzOptions = { timeZone: 'America/Chicago', timeZoneName: 'short' };
    const tzString = date.toLocaleString('en-US', tzOptions);
    const tzAbbr = tzString.split(' ').pop(); // Gets 'CST' or 'CDT'
    
    return `${formatted} ${tzAbbr}`;
  } catch (e) {
    console.error('Date formatting error:', e);
    return iso.slice(0, 16).replace('T', ' ');
  }
}

function initKeyboardShortcuts() {
  document.addEventListener('keydown', e => {
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;
    if (e.altKey && e.key === 'n') { e.preventDefault(); window.location.href = 'new-audit.html'; }
    if (e.altKey && e.key === 'd') { e.preventDefault(); window.location.href = 'index.html'; }
    if (e.altKey && e.key === 'a') { e.preventDefault(); window.location.href = 'archive.html'; }
  });
}

// Initialize nav + footer on every page
function initPage() {
  document.getElementById('nav').innerHTML = renderNav();
  document.getElementById('footer').innerHTML = renderFooter();
  initKeyboardShortcuts();
}
