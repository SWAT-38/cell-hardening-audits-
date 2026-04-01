// Export & Email PDF functionality

// Generate PDF from page content
async function exportPDF(filename) {
  const content = document.getElementById('content');
  if (!content) { alert('Nothing to export'); return; }

  const btn = event?.target?.closest('button');
  const origText = btn ? btn.innerHTML : '';
  if (btn) {
    btn.innerHTML = '⏳ Generating PDF...';
    btn.disabled = true;
  }

  try {
    if (typeof html2pdf === 'undefined') {
      await loadScript('https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js');
    }

    // Hide export/email buttons during capture
    const exportBtns = document.querySelectorAll('button[onclick*="exportPDF"], button[onclick*="emailPDF"], button[onclick*="copyDashboardLink"], button[onclick*="openModal"], button[onclick*="archiveAudit"], button[onclick*="deleteAudit"], button[onclick*="unarchiveAudit"]');
    exportBtns.forEach(b => b.style.display = 'none');

    // Add temporary PDF header
    const header = document.createElement('div');
    header.id = 'pdf-export-header';
    header.style.cssText = 'text-align:center; padding:15px 0; margin-bottom:10px; border-bottom:3px solid #ffc220;';
    header.innerHTML = '<h1 style="color:#ffc220; font-size:22px; margin:0 0 5px 0;">🔨 Cell Hardening Audit</h1>' +
      '<p style="color:#aaa; font-size:11px; margin:0;">Generated: ' + new Date().toLocaleString('en-US', {timeZone:'America/Chicago'}) + ' CST</p>';
    content.insertBefore(header, content.firstChild);

    // Scroll to top for clean capture
    window.scrollTo(0, 0);
    await new Promise(r => setTimeout(r, 300));

    const opt = {
      margin:       [5, 5, 10, 5],
      filename:     filename || 'Cell-Hardening-Export.pdf',
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { 
        scale: 2, 
        useCORS: true, 
        logging: false,
        backgroundColor: '#0f0f1a',
        scrollY: 0,
        scrollX: 0,
        windowWidth: document.body.scrollWidth
      },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'landscape' },
      pagebreak:    { mode: ['avoid-all', 'css', 'legacy'] }
    };

    // Render directly from the LIVE content element (keeps all styles)
    await html2pdf().set(opt).from(content).save();

    // Cleanup - remove header and restore buttons
    header.remove();
    exportBtns.forEach(b => b.style.display = '');

    if (btn) {
      btn.innerHTML = '✅ PDF Downloaded!';
      btn.disabled = false;
      setTimeout(() => { btn.innerHTML = origText; }, 2000);
    }
  } catch (err) {
    console.error('PDF export error:', err);
    alert('PDF export failed: ' + err.message);
    const h = document.getElementById('pdf-export-header');
    if (h) h.remove();
    document.querySelectorAll('button[onclick*="exportPDF"], button[onclick*="emailPDF"], button[onclick*="copyDashboardLink"], button[onclick*="openModal"], button[onclick*="archiveAudit"], button[onclick*="deleteAudit"], button[onclick*="unarchiveAudit"]').forEach(b => b.style.display = '');
    if (btn) { btn.innerHTML = origText; btn.disabled = false; }
  }
}

// Email PDF - generates PDF then opens email client
async function emailPDF(filename, subject) {
  const content = document.getElementById('content');
  if (!content) { alert('Nothing to export'); return; }

  const btn = event?.target?.closest('button');
  const origText = btn ? btn.innerHTML : '';
  if (btn) {
    btn.innerHTML = '⏳ Generating PDF...';
    btn.disabled = true;
  }

  try {
    if (typeof html2pdf === 'undefined') {
      await loadScript('https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js');
    }

    // Hide buttons during capture
    const exportBtns = document.querySelectorAll('button[onclick*="exportPDF"], button[onclick*="emailPDF"], button[onclick*="copyDashboardLink"], button[onclick*="openModal"], button[onclick*="archiveAudit"], button[onclick*="deleteAudit"], button[onclick*="unarchiveAudit"]');
    exportBtns.forEach(b => b.style.display = 'none');

    // Add temp header
    const header = document.createElement('div');
    header.id = 'pdf-export-header';
    header.style.cssText = 'text-align:center; padding:15px 0; margin-bottom:10px; border-bottom:3px solid #ffc220;';
    header.innerHTML = '<h1 style="color:#ffc220; font-size:22px; margin:0 0 5px 0;">🔨 Cell Hardening Audit</h1>' +
      '<p style="color:#aaa; font-size:11px; margin:0;">Generated: ' + new Date().toLocaleString('en-US', {timeZone:'America/Chicago'}) + ' CST</p>';
    content.insertBefore(header, content.firstChild);

    window.scrollTo(0, 0);
    await new Promise(r => setTimeout(r, 300));

    const opt = {
      margin:       [5, 5, 10, 5],
      filename:     filename || 'Cell-Hardening-Export.pdf',
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { 
        scale: 2, 
        useCORS: true, 
        logging: false,
        backgroundColor: '#0f0f1a',
        scrollY: 0,
        scrollX: 0,
        windowWidth: document.body.scrollWidth
      },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'landscape' },
      pagebreak:    { mode: ['avoid-all', 'css', 'legacy'] }
    };

    // Generate PDF blob from live content
    const pdfBlob = await html2pdf().set(opt).from(content).outputPdf('blob');

    // Cleanup
    header.remove();
    exportBtns.forEach(b => b.style.display = '');

    // Download the PDF
    const url = URL.createObjectURL(pdfBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || 'Cell-Hardening-Export.pdf';
    a.click();
    URL.revokeObjectURL(url);

    // Open email client
    const emailSubject = encodeURIComponent(subject || 'Cell Hardening Audit Report');
    const emailBody = encodeURIComponent(
      'Please find the attached Cell Hardening report.\n\n' +
      'Report: ' + filename + '\n' +
      'Generated: ' + new Date().toLocaleString('en-US', {timeZone:'America/Chicago'}) + ' CST\n\n' +
      'Note: The PDF has been downloaded to your computer. Please attach it to this email.\n\n' +
      '---\nCell Hardening Audit Tool\n' + window.location.origin
    );
    window.location.href = 'mailto:?subject=' + emailSubject + '&body=' + emailBody;

    if (btn) {
      btn.innerHTML = '✅ PDF + Email!';
      btn.disabled = false;
      setTimeout(() => { btn.innerHTML = origText; }, 3000);
    }
  } catch (err) {
    console.error('Email PDF error:', err);
    alert('Email export failed: ' + err.message);
    const h = document.getElementById('pdf-export-header');
    if (h) h.remove();
    document.querySelectorAll('button[onclick*="exportPDF"], button[onclick*="emailPDF"], button[onclick*="copyDashboardLink"], button[onclick*="openModal"], button[onclick*="archiveAudit"], button[onclick*="deleteAudit"], button[onclick*="unarchiveAudit"]').forEach(b => b.style.display = '');
    if (btn) { btn.innerHTML = origText; btn.disabled = false; }
  }
}

// Helper to load external scripts
function loadScript(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.onload = resolve;
    script.onerror = () => reject(new Error('Failed to load ' + src));
    document.head.appendChild(script);
  });
}
