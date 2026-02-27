// Database operations - all Supabase calls in one place

const db = {
  // ── Audits ──────────────────────────────────────────────
  async getActiveAudits() {
    const { data, error } = await supabase
      .from('audits')
      .select('*')
      .is('archived_at', null)
      .order('id', { ascending: false });
    if (error) throw error;
    return data;
  },

  async getArchivedAudits() {
    const { data, error } = await supabase
      .from('audits')
      .select('*')
      .not('archived_at', 'is', null)
      .order('archived_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  async getAudit(id) {
    const { data, error } = await supabase
      .from('audits')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  },

  async createAudit(auditor, lineId, location) {
    const { data, error } = await supabase
      .from('audits')
      .insert({ auditor, line_id: lineId, location })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async deleteAudit(id) {
    const { error } = await supabase.from('audits').delete().eq('id', id);
    if (error) throw error;
  },

  async archiveAudit(id) {
    const { error } = await supabase
      .from('audits')
      .update({ archived_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
  },

  async unarchiveAudit(id) {
    const { error } = await supabase
      .from('audits')
      .update({ archived_at: null })
      .eq('id', id);
    if (error) throw error;
  },

  async completeAudit(id, notes, status) {
    const { error } = await supabase
      .from('audits')
      .update({
        notes,
        status,
        completed_at: new Date().toISOString(),
      })
      .eq('id', id);
    if (error) throw error;
  },

  // ── Audit Items ────────────────────────────────────────
  async getAuditItems(auditId) {
    const { data, error } = await supabase
      .from('audit_items')
      .select('*')
      .eq('audit_id', auditId);
    if (error) throw error;
    return data;
  },

  async upsertItem(auditId, categoryId, itemId, result) {
    const { error } = await supabase
      .from('audit_items')
      .upsert(
        { audit_id: auditId, category_id: categoryId, item_id: itemId, result },
        { onConflict: 'audit_id,item_id' }
      );
    if (error) throw error;
  },

  async upsertNote(auditId, categoryId, itemId, note) {
    const { error } = await supabase
      .from('audit_items')
      .upsert(
        { audit_id: auditId, category_id: categoryId, item_id: itemId, note },
        { onConflict: 'audit_id,item_id' }
      );
    if (error) throw error;
  },

  // ── Photos ─────────────────────────────────────────────
  async getAuditPhotos(auditId) {
    const { data, error } = await supabase
      .from('audit_photos')
      .select('*')
      .eq('audit_id', auditId)
      .order('uploaded_at');
    if (error) throw error;
    return data;
  },

  async uploadPhoto(auditId, itemId, file) {
    const ext = file.name.split('.').pop();
    const path = `${auditId}/${itemId}_${Date.now()}.${ext}`;
    const { error: uploadErr } = await supabase.storage
      .from('audit-photos')
      .upload(path, file);
    if (uploadErr) throw uploadErr;

    const { error: dbErr } = await supabase
      .from('audit_photos')
      .insert({ audit_id: auditId, item_id: itemId, storage_path: path });
    if (dbErr) throw dbErr;
    return path;
  },

  async deletePhoto(photoId, storagePath) {
    await supabase.storage.from('audit-photos').remove([storagePath]);
    const { error } = await supabase.from('audit_photos').delete().eq('id', photoId);
    if (error) throw error;
  },

  getPhotoUrl(storagePath) {
    const { data } = supabase.storage.from('audit-photos').getPublicUrl(storagePath);
    return data.publicUrl;
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
