// Database operations - Firebase Realtime Database

const db = {
  // ── Audits ──────────────────────────────────────────────
  async getActiveAudits() {
    const snapshot = await database.ref('audits').orderByChild('archived_at').equalTo(null).once('value');
    const audits = [];
    snapshot.forEach(child => {
      audits.push({ id: child.key, ...child.val() });
    });
    return audits.sort((a, b) => (b.id || 0) - (a.id || 0));
  },

  async getArchivedAudits() {
    const snapshot = await database.ref('audits').once('value');
    const audits = [];
    snapshot.forEach(child => {
      const data = child.val();
      if (data.archived_at) {
        audits.push({ id: child.key, ...data });
      }
    });
    return audits.sort((a, b) => (b.archived_at || '').localeCompare(a.archived_at || ''));
  },

  async getAudit(id) {
    const snapshot = await database.ref(`audits/${id}`).once('value');
    if (!snapshot.exists()) throw new Error('Audit not found');
    return { id: snapshot.key, ...snapshot.val() };
  },

  async createAudit(auditor, lineId, location) {
    const newRef = database.ref('audits').push();
    const auditData = {
      auditor,
      line_id: lineId,
      location,
      started_at: new Date().toISOString(),
      status: 'in_progress',
      archived_at: null
    };
    await newRef.set(auditData);
    return { id: newRef.key, ...auditData };
  },

  async deleteAudit(id) {
    console.log('🗑️ Deleting audit:', id);
    // Delete audit record
    await database.ref(`audits/${id}`).remove();
    // Delete all audit items
    await database.ref(`audit_items/${id}`).remove();
    // Delete all photos for this audit
    await database.ref(`audit_photos/${id}`).remove();
    console.log('✅ Audit and all associated data deleted');
  },

  async archiveAudit(id) {
    await database.ref(`audits/${id}/archived_at`).set(new Date().toISOString());
  },

  async unarchiveAudit(id) {
    await database.ref(`audits/${id}/archived_at`).set(null);
  },

  async completeAudit(id, notes, status) {
    await database.ref(`audits/${id}`).update({
      notes,
      status,
      completed_at: new Date().toISOString()
    });
  },

  // ── Audit Items ────────────────────────────────────────
  async getAuditItems(auditId) {
    const snapshot = await database.ref(`audit_items/${auditId}`).once('value');
    const items = [];
    snapshot.forEach(child => {
      items.push({ id: child.key, ...child.val() });
    });
    return items;
  },

  async upsertItem(auditId, categoryId, itemId, result) {
    await database.ref(`audit_items/${auditId}/${itemId}`).update({
      audit_id: auditId,
      category_id: categoryId,
      item_id: itemId,
      result
    });
  },

  async upsertNote(auditId, categoryId, itemId, note) {
    await database.ref(`audit_items/${auditId}/${itemId}`).update({
      audit_id: auditId,
      category_id: categoryId,
      item_id: itemId,
      note
    });
  },

  // ── Photos ─────────────────────────────────────────────
  async getAuditPhotos(auditId) {
    const snapshot = await database.ref(`audit_photos/${auditId}`).once('value');
    const photos = [];
    snapshot.forEach(child => {
      const photoData = child.val();
      // Photos now have data_url directly, no need to fetch from storage
      photos.push({ 
        id: child.key, 
        ...photoData,
        url: photoData.data_url // Use the base64 data URL directly
      });
    });
    return photos.sort((a, b) => (a.uploaded_at || '').localeCompare(b.uploaded_at || ''));
  },

  // Helper function to compress image (optimized for speed)
  _compressImage(file, maxWidth = 1280, maxHeight = 1280, quality = 0.75) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          // Calculate new dimensions while maintaining aspect ratio
          let width = img.width;
          let height = img.height;
          
          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
          }
          
          // Create canvas and compress
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d', { alpha: false }); // Faster without alpha
          
          // Use faster image smoothing
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'medium'; // medium is faster than high
          
          ctx.drawImage(img, 0, 0, width, height);
          
          // Convert to base64 with compression
          const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
          
          console.log('🗜️ Image compressed:', 
            `Original: ${Math.round(e.target.result.length / 1024)} KB`,
            `Compressed: ${Math.round(compressedDataUrl.length / 1024)} KB`,
            `Dimensions: ${img.width}x${img.height} → ${width}x${height}`,
            `Reduction: ${Math.round((1 - compressedDataUrl.length / e.target.result.length) * 100)}%`
          );
          
          resolve(compressedDataUrl);
        };
        img.onerror = reject;
        img.src = e.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  },

  async uploadPhoto(auditId, itemId, file) {
    console.log('📦 Starting photo upload...', { auditId, itemId, fileName: file.name, fileSize: file.size });
    
    try {
      // Compress the image before storing
      const compressedDataUrl = await this._compressImage(file);
      
      const newPhotoRef = database.ref(`audit_photos/${auditId}`).push();
      console.log('💾 Saving compressed photo to database...');
      
      await newPhotoRef.set({
        audit_id: auditId,
        item_id: itemId,
        data_url: compressedDataUrl, // Store compressed base64 data
        file_name: file.name,
        original_size: file.size,
        compressed_size: compressedDataUrl.length,
        uploaded_at: new Date().toISOString()
      });
      
      console.log('✅ Compressed photo saved to database');
      return newPhotoRef.key;
    } catch (err) {
      console.error('❌ Photo upload error:', err);
      throw err;
    }
  },

  async deletePhoto(photoId, auditId) {
    // Photos are stored in database now, just remove the database entry
    await database.ref(`audit_photos/${auditId}/${photoId}`).remove();
  },

  // ── Helpers ────────────────────────────────────────────
  async getStorageUsage() {
    try {
      console.log('📊 Calculating storage usage (all sources)...');

      // ── Audits (dashboard + archive live here) ──────────────
      const auditsSnapshot = await database.ref('audits').once('value');
      const auditsSize = JSON.stringify(auditsSnapshot.val() || {}).length;

      // ── Audit checklist items ────────────────────────────────
      const itemsSnapshot = await database.ref('audit_items').once('value');
      const itemsSize = JSON.stringify(itemsSnapshot.val() || {}).length;

      // ── Audit photos (stored separately as base64 data_url) ──
      const photosSnapshot = await database.ref('audit_photos').once('value');
      let auditPhotosSize = 0;
      let auditPhotoCount = 0;
      photosSnapshot.forEach(auditPhotos => {
        auditPhotos.forEach(photo => {
          const data = photo.val();
          if (data.data_url) {
            auditPhotosSize += data.data_url.length;
            auditPhotoCount++;
          }
        });
      });

      // ── Action items (photos embedded inline in the record) ──
      const actionSnap = await database.ref('action_items').once('value');
      let actionItemsSize = 0;
      let actionPhotoCount = 0;
      actionSnap.forEach(child => {
        const item = child.val();
        actionItemsSize += JSON.stringify(item).length;
        if (item.photo) actionPhotoCount++;
      });

      const photoCount  = auditPhotoCount + actionPhotoCount;
      const totalBytes  = auditsSize + itemsSize + auditPhotosSize + actionItemsSize;
      const totalMB     = totalBytes / (1024 * 1024);
      const totalGB     = totalMB / 1024;
      const percentUsed = (totalGB / 1) * 100; // 1 GB free tier

      console.log('✅ Storage calculated:', {
        audits:      Math.round(auditsSize / 1024) + ' KB',
        auditItems:  Math.round(itemsSize / 1024) + ' KB',
        auditPhotos: Math.round(auditPhotosSize / (1024 * 1024)) + ' MB',
        actionItems: Math.round(actionItemsSize / (1024 * 1024)) + ' MB',
        photoCount,
        totalMB: totalMB.toFixed(2) + ' MB',
        percentUsed: percentUsed.toFixed(1) + '%',
      });

      return {
        totalBytes,
        totalMB,
        totalGB,
        percentUsed,
        photoCount,
        auditPhotoCount,
        actionPhotoCount,
        auditDataSize:   auditsSize + itemsSize + auditPhotosSize,
        actionItemsSize,
      };
    } catch (err) {
      console.error('❌ Storage calculation error:', err);
      return null;
    }
  },

  // ── Helpers ────────────────────────────────────────────
  computeProgress(items) {
    const checked = items.filter(i => ['pass', 'fail', 'na'].includes(i.result)).length;
    const passed = items.filter(i => i.result === 'pass').length;
    const failed = items.filter(i => i.result === 'fail').length;
    const na = items.filter(i => i.result === 'na').length;
    const pct = TOTAL_ITEMS > 0 ? Math.round((checked / TOTAL_ITEMS) * 100) : 0;
    return { checked, passed, failed, na, total: TOTAL_ITEMS, pct };
  },

  computeStatus(items) {
    const failed = items.filter(i => i.result === 'fail');
    if (failed.length === 0) return 'pass';
    const criticalIds = CATEGORIES.filter(c => c.critical)
      .flatMap(c => c.items.map(i => i.id));
    const hasCriticalFail = failed.some(f => criticalIds.includes(f.item_id));
    return hasCriticalFail ? 'critical_fail' : 'fail';
  },
};

console.log('✅ Database layer loaded (Firebase mode)');
