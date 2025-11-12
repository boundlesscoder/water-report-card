'use client';

import { useEffect, useMemo, useState } from 'react';
import DashboardLayout from '../../../../components/layout/DashboardLayout';
import Modal from '../../../../components/ui/Modal';
import { listAnalyteTypes, listClassifications, listSubclassifications, listAnalytes, createAnalyte, updateAnalyte, deleteAnalyte } from '../../../../services/contaminants.api';
import { usePlatformAdminRoute } from '../../../../hooks/useRouteProtection';

export default function AnalytesPage() {
  // Route protection - only Platform Admins can access this page
  const { isPlatformAdmin, isLoading } = usePlatformAdminRoute();
  
  // ALL HOOKS MUST BE CALLED BEFORE ANY CONDITIONAL LOGIC
  const [types, setTypes] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subclasses, setSubclasses] = useState([]);
  const [filters, setFilters] = useState({ analyte_type_id: '', classification_id: '', subclassification_id: '', search: '' });
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [form, setForm] = useState({ analyte_type_id: '', classification_id: '', subclassification_id: '', analyte_name: '', analyte_code: '', mclg_raw: '', mcl_raw: '', units: '', mclg_value: '', mcl_value: '', potential_health_effects: '' });
  const UNIT_OPTIONS = ['mg/L', 'ug/L', 'ng/L', 'ppm', 'ppb', 'ppt', 'pCi/L', 'MFL', 'unitless'];
  const [mclgUnit, setMclgUnit] = useState('');
  const [mclUnit, setMclUnit] = useState('');
  const [mclgCustomUnit, setMclgCustomUnit] = useState('');
  const [mclCustomUnit, setMclCustomUnit] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadTypes = async () => setTypes(await listAnalyteTypes());
  const loadClasses = async (typeId) => setClasses(await listClassifications(typeId));
  const loadSubclasses = async (classId) => setSubclasses(await listSubclassifications(classId));

  const refresh = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await listAnalytes({ ...filters, page, pageSize });
      setRows(data.items);
      setTotal(data.total);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadTypes(); }, []);
  useEffect(() => { refresh(); }, [filters.analyte_type_id, filters.classification_id, filters.subclassification_id, page, pageSize, refresh]);

  const onTypeChange = async (id) => {
    setFilters(f => ({ ...f, analyte_type_id: id, classification_id: '', subclassification_id: '' }));
    setForm(f => ({ ...f, analyte_type_id: id, classification_id: '', subclassification_id: '' }));
    if (id) await loadClasses(id); else { setClasses([]); setSubclasses([]); }
  };

  const onClassChange = async (id) => {
    setFilters(f => ({ ...f, classification_id: id, subclassification_id: '' }));
    setForm(f => ({ ...f, classification_id: id, subclassification_id: '' }));
    if (id) await loadSubclasses(id); else setSubclasses([]);
  };

  const onSubclassChange = (id) => {
    setFilters(f => ({ ...f, subclassification_id: id }));
    setForm(f => ({ ...f, subclassification_id: id }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const payload = { ...form };
      ['mclg_value','mcl_value'].forEach(k=>{ if (payload[k] === '') payload[k] = null; else payload[k] = Number(payload[k]); });
      const effMclgUnit = (mclgUnit === 'custom') ? mclgCustomUnit : mclgUnit;
      const effMclUnit = (mclUnit === 'custom') ? mclCustomUnit : mclUnit;
      payload.mclg_unit = effMclgUnit || null;
      payload.mcl_unit = effMclUnit || null;
      // capture types
      if (payload.mclg_value == null && effMclgUnit === '') payload.mclg_type = 'none';
      if (payload.mclg_value === 0) payload.mclg_type = 'zero';
      if (payload.mcl_value == null && effMclUnit === '') payload.mcl_type = 'none';
      payload.units = effMclUnit || effMclgUnit || form.units || '';
      if (editingId) {
        await updateAnalyte(editingId, payload);
      } else {
        await createAnalyte(payload);
      }
      setForm({ analyte_type_id: form.analyte_type_id, classification_id: form.classification_id, subclassification_id: form.subclassification_id, analyte_name: '', analyte_code: '', mclg_raw: '', mcl_raw: '', units: '', mclg_value: '', mcl_value: '', potential_health_effects: '' });
      setEditingId(null);
      setIsFormOpen(false);
      await refresh();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const onEdit = (row) => {
    setEditingId(row.id);
    setForm({
      analyte_type_id: row.analyte_type_id,
      classification_id: row.classification_id,
      subclassification_id: row.subclassification_id || '',
      analyte_name: row.analyte_name || '',
      analyte_code: row.analyte_code || '',
      mclg_raw: '',
      mcl_raw: '',
      units: row.units || '',
      mclg_value: row.mclg_value || '',
      mcl_value: row.mcl_value || '',
      potential_health_effects: row.potential_health_effects || ''
    });
    // derive units from raw strings if present
    setMclgUnit(row.mclg_unit || '');
    setMclUnit(row.mcl_unit || '');
    setMclgCustomUnit('');
    setMclCustomUnit('');
    setIsFormOpen(true);
  };

  const onDelete = async (id) => {
    setDeleteTarget(id);
  };

  // Keep dependent lists in sync for form
  useEffect(() => { if (form.analyte_type_id) loadClasses(form.analyte_type_id); }, [form.analyte_type_id]);
  useEffect(() => { if (form.classification_id) loadSubclasses(form.classification_id); }, [form.classification_id]);

  // Conditional rendering based on authentication status
  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-600">Loading...</div>
        </div>
      </DashboardLayout>
    );
  }

  if (!isPlatformAdmin) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-600">You don&apos;t have permission to access this page.</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center gap-3">
          <h1 className="text-3xl font-extrabold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Analytes</h1>
          <select className="border p-2 rounded w-full md:w-auto" value={filters.analyte_type_id} onChange={e=>onTypeChange(e.target.value)}>
            <option value="">All Types</option>
            {types.map(t=> <option key={t.id} value={t.id}>{t.code}</option>)}
          </select>
          <select className="border p-2 rounded w-full md:w-auto" value={filters.classification_id} onChange={e=>onClassChange(e.target.value)}>
            <option value="">All Classifications</option>
            {classes.map(c=> <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select className="border p-2 rounded w-full md:w-auto" value={filters.subclassification_id} onChange={e=>onSubclassChange(e.target.value)}>
            <option value="">All Sub-classes</option>
            {subclasses.map(sc=> <option key={sc.id} value={sc.id}>{sc.name}</option>)}
          </select>
          <div className="flex w-full md:w-auto gap-2 md:ml-auto">
            <input className="border p-2 rounded flex-1 md:flex-none" placeholder="Search name or code" value={filters.search} onChange={e=>setFilters(f=>({...f, search:e.target.value}))} />
            <button className="px-4 py-2 border rounded" onClick={() => { setPage(1); refresh(); }}>Search</button>
            <button className="px-4 py-2 rounded bg-blue-600 text-white" onClick={() => { setEditingId(null); setForm({ analyte_type_id:'', classification_id:'', subclassification_id:'', analyte_name:'', analyte_code:'', mclg_raw:'', mcl_raw:'', units:'', mclg_value:'', mcl_value:'', potential_health_effects:''}); setIsFormOpen(true); }}>New</button>
          </div>
        </div>
        {error && <div className="text-red-500">{error}</div>}
        <Modal isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} title={editingId ? 'Edit Analyte' : 'New Analyte'} footer={(
          <>
            <button className="px-4 py-2 rounded border" onClick={() => setIsFormOpen(false)} type="button">Cancel</button>
            <button className="px-4 py-2 rounded bg-blue-600 text-white" onClick={onSubmit} disabled={loading}>{editingId ? 'Update' : 'Create'}</button>
          </>
        )}>
        <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-6 gap-3">
          <select className="border p-2 rounded" value={form.analyte_type_id} onChange={e=>onTypeChange(e.target.value)} required>
            <option value="">Select Type</option>
            {types.map(t=> <option key={t.id} value={t.id}>{t.code}</option>)}
          </select>
          <select className="border p-2 rounded" value={form.classification_id} onChange={e=>onClassChange(e.target.value)} required>
            <option value="">Select Classification</option>
            {classes.map(c=> <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select className="border p-2 rounded" value={form.subclassification_id} onChange={e=>onSubclassChange(e.target.value)}>
            <option value="">Optional Sub-class</option>
            {subclasses.map(sc=> <option key={sc.id} value={sc.id}>{sc.name}</option>)}
          </select>
          <input className="border p-2 rounded" placeholder="Analyte Name" value={form.analyte_name} onChange={e=>setForm({...form, analyte_name:e.target.value})} required />
          <input className="border p-2 rounded" placeholder="Code" value={form.analyte_code} onChange={e=>setForm({...form, analyte_code:e.target.value})} />
          <div className="md:col-span-6 grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="grid grid-cols-2 gap-2 items-center">
              <label className="text-sm text-gray-600">MCLG</label>
              <div className="col-span-1" />
              <input className="border p-2 rounded" placeholder="Value" type="number" step="any" value={form.mclg_value} onChange={e=>setForm({...form, mclg_value:e.target.value})} />
              <div className="flex gap-2">
                <select className="border p-2 rounded flex-1" value={mclgUnit} onChange={e=>setMclgUnit(e.target.value)}>
                  <option value="">Units</option>
                  {UNIT_OPTIONS.map(u => <option key={u} value={u}>{u}</option>)}
                  <option value="custom">Custom…</option>
                </select>
                {mclgUnit === 'custom' && (
                  <input className="border p-2 rounded flex-1" placeholder="Custom unit" value={mclgCustomUnit} onChange={e=>setMclgCustomUnit(e.target.value)} />
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 items-center">
              <label className="text-sm text-gray-600">MCL</label>
              <div className="col-span-1" />
              <input className="border p-2 rounded" placeholder="Value" type="number" step="any" value={form.mcl_value} onChange={e=>setForm({...form, mcl_value:e.target.value})} />
              <div className="flex gap-2">
                <select className="border p-2 rounded flex-1" value={mclUnit} onChange={e=>setMclUnit(e.target.value)}>
                  <option value="">Units</option>
                  {UNIT_OPTIONS.map(u => <option key={u} value={u}>{u}</option>)}
                  <option value="custom">Custom…</option>
                </select>
                {mclUnit === 'custom' && (
                  <input className="border p-2 rounded flex-1" placeholder="Custom unit" value={mclCustomUnit} onChange={e=>setMclCustomUnit(e.target.value)} />
                )}
              </div>
            </div>
          </div>
          <div className="md:col-span-6 text-xs text-gray-500">Tip: MCLG and MCL can use different units (e.g., mg/L vs ug/L). Raw fields will be composed from value + unit.</div>
          <input className="border p-2 rounded md:col-span-6" placeholder="Potential Health Effects" value={form.potential_health_effects} onChange={e=>setForm({...form, potential_health_effects:e.target.value})} />
        </form>
        </Modal>

        <div className="bg-white rounded-xl shadow-lg overflow-auto max-h-[77vh] border border-gray-100">
          <table className="min-w-full">
            <thead className="sticky top-0 z-20">
              <tr className="text-left bg-[#e8e4e4] border-b">
                <th className="p-3 font-semibold text-gray-600 sticky top-0 bg-gray-50">Type</th>
                <th className="p-3 font-semibold text-gray-600 sticky top-0 bg-gray-50">Classification</th>
                <th className="p-3 font-semibold text-gray-600 sticky top-0 bg-gray-50">Sub-class</th>
                <th className="p-3 font-semibold text-gray-600 sticky top-0 bg-gray-50">Analyte Name</th>
                <th className="p-3 font-semibold text-gray-600 sticky top-0 bg-gray-50">Analyte Code</th>
                <th className="p-3 font-semibold text-gray-600 sticky top-0 bg-gray-50">Units</th>
                <th className="p-3 font-semibold text-gray-600 sticky top-0 bg-gray-50">MCLG</th>
                <th className="p-3 font-semibold text-gray-600 sticky top-0 bg-gray-50">MCL</th>
                <th className="p-3 font-semibold text-gray-600 sticky top-0 bg-gray-50">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r=> (
                <tr key={r.id} className="border-b hover:bg-gray-50 transition-colors">
                  <td className="p-3">{r.analyte_type_code}</td>
                  <td className="p-3">{r.classification_name}</td>
                  <td className="p-3">{r.subclassification_name}</td>
                  <td className="p-3">{r.analyte_name}</td>
                  <td className="p-3">{r.analyte_code}</td>
                  <td className="p-3">{r.units}</td>
                  <td className="p-3">{r.mclg_value ?? r.mclg_raw}</td>
                  <td className="p-3">{r.mcl_value ?? r.mcl_raw}</td>
                  <td className="p-3 flex gap-2">
                    <button className="px-3 py-1 border rounded hover:bg-white shadow-sm" onClick={()=>onEdit(r)}>Edit</button>
                    <button className="px-3 py-1 border rounded text-red-600 hover:bg-white shadow-sm" onClick={()=>onDelete(r.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="sticky bottom-0 z-20 flex items-center justify-between p-4 bg-white border-t border-gray-200">
            <div className="text-sm text-gray-600">Total: {total}</div>
            <div className="flex items-center gap-2">
              <button className="px-3 py-1 rounded border" disabled={page<=1} onClick={()=>setPage(p=>Math.max(1,p-1))}>Prev</button>
              <span className="text-sm">Page {page}</span>
              <button className="px-3 py-1 rounded border" disabled={(page*pageSize)>=total} onClick={()=>setPage(p=>p+1)}>Next</button>
              <select className="ml-2 border p-1 rounded" value={pageSize} onChange={e=>{ setPageSize(Number(e.target.value)); setPage(1); }}>
                {[10,25,50,100].map(s=> <option key={s} value={s}>{s}/page</option>)}
              </select>
            </div>
          </div>
        </div>

        <Modal isOpen={!!deleteTarget} onClose={()=>setDeleteTarget(null)} title="Delete Analyte" footer={(
          <>
            <button className="px-4 py-2 rounded border" onClick={()=>setDeleteTarget(null)} type="button">Cancel</button>
            <button className="px-4 py-2 rounded bg-red-600 text-white" onClick={async ()=>{ setLoading(true); try { await deleteAnalyte(deleteTarget); setDeleteTarget(null); await refresh(); } catch(e){ setError(e.message);} finally{ setLoading(false);} }}>Delete</button>
          </>
        )}>
          <p>Are you sure you want to delete this analyte?</p>
        </Modal>
      </div>
    </DashboardLayout>
  );
}

