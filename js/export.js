// Export & Email PDF functionality

// Generate PDF from page content
async function exportPDF(filename) {
  const content = document.getElementById('content');
  if (!content) { alert('Nothing to export'); return; }

  // Show loading
  const btn = event?.target?.closest('button');
  const origText = btn ? btn.innerHTML : '';
  if (btn) btn.innerHTML = '⏳ Generating PDF...';

  try {
    // Dynamically load html2pdf if not loaded
    if (typeof html2pdf === 'undefined') {
      await loadScript('https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js');
    }

    const opt = {
      margin:       [10, 10, 10, 10],
      filename:     filename || 'Cell-Hardening-Export.pdf',
      image:        { type: 'jpeg', quality: 0.95 },
      html2canvas:  { scale: 2, useCORS: true, scrollY: 0, windowWidth: 1200 },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'landscape' },
      pagebreak:    { mode: ['avoid-all', 'css', 'legacy'] }
    };

    // Clone content and style for PDF
    const clone = content.cloneNode(true);
    
    // Remove buttons from clone (don't print action buttons)
    clone.querySelectorAll('button[onclick*="archiveAudit"], button[onclick*="deleteAudit"], button[onclick*="unarchiveAudit"], button[onclick*="editItem"], button[onclick*="deleteItem"], button[onclick*="openModal"]').forEach(b => b.remove());

    // Create wrapper with white background for PDF
    const wrapper = document.createElement('div');
    wrapper.style.cssText = 'background: #1a1a2e; color: #e0e0e0; padding: 20px; font-family: Arial, sans-serif;';
    
    // Add header
    const header = document.createElement('div');
    header.style.cssText = 'text-align: center; margin-bottom: 20px; padding-bottom: 15px; border-bottom: 2px solid #ffc220;';
    header.innerHTML = `
      <h1 style="color: #ffc220; font-size: 24px; margin: 0;">🔨 Cell Hardening Audit</h1>
      <p style="color: #999; font-size: 12px; margin-top: 5px;">Generated: ${new Date().toLocaleString('en-US', { timeZone: 'America/Chicago' })} CST</p>
    `;
    wrapper.appendChild(header);
    wrapper.appendChild(clone);

    // Temporarily add to DOM (hidden) for rendering
    wrapper.style.position = 'fixed';
    wrapper.style.left = '-9999px';
    wrapper.style.width = '1200px';
    document.body.appendChild(wrapper);

    await html2pdf().set(opt).from(wrapper).save();

    document.body.removeChild(wrapper);

    if (btn) {
      btn.innerHTML = '✅ PDF Downloaded!';
      setTimeout(() => { btn.innerHTML = origText; }, 2000);
    }
  } catch (err) {
    console.error('PDF export error:', err);
    alert('PDF export failed: ' + err.message);
    if (btn) btn.innerHTML = origText;
  }
}

// Email PDF - generates PDF then opens email client
async function emailPDF(filename, subject) {
  const content = document.getElementById('content');
  if (!content) { alert('Nothing to export'); return; }

  const btn = event?.target?.closest('button');
  const origText = btn ? btn.innerHTML : '';
  if (btn) btn.innerHTML = '⏳ Generating PDF...';

  try {
    // Dynamically load html2pdf if not loaded
    if (typeof html2pdf === 'undefined') {
      await loadScript('https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js');
    }

    const opt = {
      margin:       [10, 10, 10, 10],
      filename:     filename || 'Cell-Hardening-Export.pdf',
      image:        { type: 'jpeg', quality: 0.95 },
      html2canvas:  { scale: 2, useCORS: true, scrollY: 0, windowWidth: 1200 },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'landscape' },
      pagebreak:    { mode: ['avoid-all', 'css', 'legacy'] }
    };

    // Clone content
    const clone = content.cloneNode(true);
    clone.querySelectorAll('button[onclick*="archiveAudit"], button[onclick*="deleteAudit"], button[onclick*="unarchiveAudit"], button[onclick*="editItem"], button[onclick*="deleteItem"], button[onclick*="openModal"]').forEach(b => b.remove());

    const wrapper = document.createElement('div');
    wrapper.style.cssText = 'background: #1a1a2e; color: #e0e0e0; padding: 20px; font-family: Arial, sans-serif;';
    const header = document.createElement('div');
    header.style.cssText = 'text-align: center; margin-bottom: 20px; padding-bottom: 15px; border-bottom: 2px solid #ffc220;';
    header.innerHTML = `
      <h1 style="color: #ffc220; font-size: 24px; margin: 0;">🔨 Cell Hardening Audit</h1>
      <p style="color: #999; font-size: 12px; margin-top: 5px;">Generated: ${new Date().toLocaleString('en-US', { timeZone: 'America/Chicago' })} CST</p>
    `;
    wrapper.appendChild(header);
    wrapper.appendChild(clone);
    wrapper.style.position = 'fixed';
    wrapper.style.left = '-9999px';
    wrapper.style.width = '1200px';
    document.body.appendChild(wrapper);

    // Generate PDF as blob
    const pdfBlob = await html2pdf().set(opt).from(wrapper).outputPdf('blob');
    document.body.removeChild(wrapper);

    // Download the PDF first
    const url = URL.createObjectURL(pdfBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || 'Cell-Hardening-Export.pdf';
    a.click();
    URL.revokeObjectURL(url);

    // Open email client
    const emailSubject = encodeURIComponent(subject || 'Cell Hardening Audit Report');
    const emailBody = encodeURIComponent(
      `Please find the attached Cell Hardening report.\n\n` +
      `Report: ${filename}\n` +
      `Generated: ${new Date().toLocaleString('en-US', { timeZone: 'America/Chicago' })} CST\n\n` +
      `Note: The PDF has been downloaded to your computer. Please attach it to this email.\n\n` +
      `---\nCell Hardening Audit Tool\n${window.location.origin}`
    );
    window.location.href = `mailto:?subject=${emailSubject}&body=${emailBody}`;

    if (btn) {
      btn.innerHTML = '✅ PDF Downloaded & Email Opened!';
      setTimeout(() => { btn.innerHTML = origText; }, 3000);
    }
  } catch (err) {
    console.error('Email PDF error:', err);
    alert('Email export failed: ' + err.message);
    if (btn) btn.innerHTML = origText;
  }
}

// Helper to load external scripts
function loadScript(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.onload = resolve;
    script.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(script);
  });
}
