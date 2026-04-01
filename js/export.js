// Export & Email PDF functionality
// Uses browser's native print which reliably captures all CSS

function exportPDF(filename) {
  // Add print header temporarily
  const header = document.createElement('div');
  header.id = 'print-header';
  header.className = 'print-only-header';
  header.innerHTML = `
    <div style="text-align:center; padding:10px 0 15px 0; border-bottom:3px solid #ffc220; margin-bottom:15px;">
      <h1 style="font-size:22px; margin:0 0 5px 0; color:#ffc220;">🔨 Cell Hardening Audit Report</h1>
      <p style="font-size:12px; color:#999; margin:0;">Generated: ${new Date().toLocaleString('en-US', {timeZone:'America/Chicago'})} CST</p>
      <p style="font-size:11px; color:#777; margin:5px 0 0 0;">${filename || 'Report'}</p>
    </div>
  `;
  const content = document.getElementById('content');
  if (content) content.insertBefore(header, content.firstChild);

  // Trigger browser print dialog (user can "Save as PDF")
  window.print();

  // Remove header after print dialog closes
  setTimeout(() => {
    const h = document.getElementById('print-header');
    if (h) h.remove();
  }, 1000);
}

function emailPDF(filename, subject) {
  // First trigger the PDF export
  exportPDF(filename);

  // After a short delay, open the email client
  setTimeout(() => {
    const emailSubject = encodeURIComponent(subject || 'Cell Hardening Audit Report');
    const emailBody = encodeURIComponent(
      'Please find the attached Cell Hardening report.\n\n' +
      'Report: ' + (filename || 'Cell-Hardening-Export.pdf') + '\n' +
      'Generated: ' + new Date().toLocaleString('en-US', {timeZone:'America/Chicago'}) + ' CST\n\n' +
      'Instructions:\n' +
      '1. In the Print dialog, select "Save as PDF" or "Microsoft Print to PDF"\n' +
      '2. Save the file\n' +
      '3. Attach the saved PDF to this email\n\n' +
      '---\nCell Hardening Audit Tool\n' + window.location.origin
    );
    window.location.href = 'mailto:?subject=' + emailSubject + '&body=' + emailBody;
  }, 2000);
}
