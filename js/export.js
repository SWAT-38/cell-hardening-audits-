// Export & Email PDF / Word functionality

function exportPDF(filename) {
  // Add print header temporarily
  const header = document.createElement('div');
  header.id = 'print-header';
  header.className = 'print-only-header';
  header.innerHTML = `
    <div style="text-align:center; padding:10px 0 15px 0; border-bottom:3px solid #ffc220; margin-bottom:15px;">
      <h1 style="font-size:22px; margin:0 0 5px 0; color:#ffc220;">Cell Hardening Audit Report</h1>
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

function exportWord(filename) {
  let htmlContent = "";
  const items = window.currentFilteredItems;

  if (items && Array.isArray(items) && items.length > 0) {
    // Generate a beautiful, clean table
    htmlContent = `
      <table style="border-collapse: collapse; width: 100%; border: 1px solid #dddddd; font-family: Calibri, Arial, sans-serif;">
        <thead>
          <tr style="background-color: #004b87; color: #ffffff;">
            <th style="border: 1px solid #dddddd; padding: 8px; text-align: left; font-size: 10pt;">#</th>
            <th style="border: 1px solid #dddddd; padding: 8px; text-align: left; font-size: 10pt;">DC</th>
            <th style="border: 1px solid #dddddd; padding: 8px; text-align: left; font-size: 10pt;">Action Item</th>
            <th style="border: 1px solid #dddddd; padding: 8px; text-align: left; font-size: 10pt;">Notes</th>
            <th style="border: 1px solid #dddddd; padding: 8px; text-align: left; font-size: 10pt;">Cell</th>
            <th style="border: 1px solid #dddddd; padding: 8px; text-align: left; font-size: 10pt;">Driveway</th>
            <th style="border: 1px solid #dddddd; padding: 8px; text-align: left; font-size: 10pt;">Location</th>
            <th style="border: 1px solid #dddddd; padding: 8px; text-align: left; font-size: 10pt;">Priority</th>
            <th style="border: 1px solid #dddddd; padding: 8px; text-align: left; font-size: 10pt;">Assigned</th>
            <th style="border: 1px solid #dddddd; padding: 8px; text-align: left; font-size: 10pt;">Ticket</th>
            <th style="border: 1px solid #dddddd; padding: 8px; text-align: left; font-size: 10pt;">Created</th>
            <th style="border: 1px solid #dddddd; padding: 8px; text-align: left; font-size: 10pt;">Status</th>
          </tr>
        </thead>
        <tbody>
          ${items.map((item, idx) => {
            const statusLabel = { open: 'Open', in_progress: 'In Progress', closed: 'Closed' }[item.status] || item.status;
            const priorityColor = { high: '#ffe6e6', medium: '#fff9e6', low: '#eafaf1' }[item.priority] || '#ffffff';
            const priorityTextColor = { high: '#c0392b', medium: '#d35400', low: '#27ae60' }[item.priority] || '#333333';
            const statusTextColor = { open: '#d63031', in_progress: '#0984e3', closed: '#27ae60' }[item.status] || '#333333';
            
            return `
              <tr>
                <td style="border: 1px solid #dddddd; padding: 6px; font-size: 9.5pt;">${idx + 1}</td>
                <td style="border: 1px solid #dddddd; padding: 6px; font-size: 9.5pt;">DC ${item.dc || ''}</td>
                <td style="border: 1px solid #dddddd; padding: 6px; font-size: 9.5pt; font-weight: bold;">${item.title || ''}</td>
                <td style="border: 1px solid #dddddd; padding: 6px; font-size: 9.5pt; color: #555555;">${item.description || ''}</td>
                <td style="border: 1px solid #dddddd; padding: 6px; font-size: 9.5pt;">Cell ${item.cell || ''}</td>
                <td style="border: 1px solid #dddddd; padding: 6px; font-size: 9.5pt;">${item.driveway || ''}</td>
                <td style="border: 1px solid #dddddd; padding: 6px; font-size: 9.5pt;">${item.location || ''}</td>
                <td style="border: 1px solid #dddddd; padding: 6px; font-size: 9.5pt; background-color: ${priorityColor}; color: ${priorityTextColor}; font-weight: bold; text-align: center;">${(item.priority || '').toUpperCase()}</td>
                <td style="border: 1px solid #dddddd; padding: 6px; font-size: 9.5pt;">${item.assigned_to || ''}</td>
                <td style="border: 1px solid #dddddd; padding: 6px; font-size: 9.5pt;">${item.ticket_number || ''}</td>
                <td style="border: 1px solid #dddddd; padding: 6px; font-size: 9.5pt;">${item.creation_date ? new Date(item.creation_date).toLocaleDateString() : ''}</td>
                <td style="border: 1px solid #dddddd; padding: 6px; font-size: 9.5pt; color: ${statusTextColor}; font-weight: bold; text-align: center;">${statusLabel}</td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    `;
  } else {
    // Fallback: Scrape the page for any table element
    const table = document.querySelector('table');
    if (table) {
      const clonedTable = table.cloneNode(true);
      clonedTable.querySelectorAll('.no-print, button, input, select, .delete-event').forEach(el => el.remove());
      clonedTable.style.borderCollapse = "collapse";
      clonedTable.style.width = "100%";
      clonedTable.style.fontFamily = "Calibri, Arial, sans-serif";
      clonedTable.querySelectorAll('th, td').forEach(cell => {
        cell.style.border = "1px solid #dddddd";
        cell.style.padding = "6px";
        cell.style.fontSize = "9.5pt";
      });
      htmlContent = clonedTable.outerHTML;
    } else {
      htmlContent = "<p>No action items table found.</p>";
    }
  }

  // Wrap inside full Word Document HTML Envelope
  const fullHtml = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head><title>Cell Hardening Action Items Report</title>
    <!--[if gte mso 9]>
    <xml>
    <w:WordDocument>
    <w:View>Print</w:View>
    <w:Zoom>100</w:Zoom>
    <w:DoNotOptimizeForBrowser/>
    </w:WordDocument>
    </xml>
    <![endif]-->
    <style>
      body { font-family: Calibri, Arial, sans-serif; font-size: 11pt; line-height: 1.15; margin: 1in; }
      h1 { font-size: 22pt; color: #004b87; border-bottom: 3px solid #ffc220; padding-bottom: 5px; margin-bottom: 20px; }
      p { margin: 5px 0; }
    </style>
    </head>
    <body>
      <h1>Cell Hardening Action Items Report</h1>
      <p><strong>Generated:</strong> ${new Date().toLocaleString('en-US', {timeZone:'America/Chicago'})} CST</p>
      <p><strong>Total Items in Report:</strong> ${items ? items.length : 'N/A'}</p>
      <hr style="border: 0; border-top: 1px solid #cccccc; margin: 15px 0;">
      ${htmlContent}
    </body>
    </html>
  `;

  // Convert to Blob with the proper MS Word mime type and trigger browser download
  const blob = new Blob(['\ufeff' + fullHtml], { type: 'application/msword;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || 'Cell-Hardening-Report.doc';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function emailWord(filename, subject) {
  // First trigger the Word export
  exportWord(filename);

  // After a short delay, open the email client
  setTimeout(() => {
    const emailSubject = encodeURIComponent(subject || 'Cell Hardening Action Items Report');
    const emailBody = encodeURIComponent(
      'Please find the attached Cell Hardening report.\n\n' +
      'Report: ' + (filename || 'Action-Items.doc') + '\n' +
      'Generated: ' + new Date().toLocaleString('en-US', {timeZone:'America/Chicago'}) + ' CST\n\n' +
      'Instructions:\n' +
      '1. Attach the downloaded Word document (' + (filename || 'Action-Items.doc') + ') from your Downloads folder to this email.\n\n' +
      '---\nCell Hardening Audit Tool\n' + window.location.origin
    );
    window.location.href = 'mailto:?subject=' + emailSubject + '&body=' + emailBody;
  }, 1500);
}
