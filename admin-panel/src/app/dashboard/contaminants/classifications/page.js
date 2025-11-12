'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '../../../../components/layout/DashboardLayout';
import { listAnalyteTypes, listClassifications, createClassification, updateClassification, deleteClassification } from '../../../../services/contaminants.api';
import Modal from '../../../../components/ui/Modal';
import { usePlatformAdminRoute } from '../../../../hooks/useRouteProtection';

export default function ClassificationsPage() {
  // Route protection - only Platform Admins can access this page
  const { isPlatformAdmin, isLoading } = usePlatformAdminRoute();
  
  // ALL HOOKS MUST BE CALLED BEFORE ANY CONDITIONAL LOGIC
  const [types, setTypes] = useState([]);
  const [rows, setRows] = useState([]);
  const [selectedType, setSelectedType] = useState('');
  const [form, setForm] = useState({ analyte_type_id: '', name: '' });
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const loadTypes = async () => setTypes(await listAnalyteTypes());
  const refresh = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await listClassifications(selectedType || undefined);
      setRows(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadTypes(); }, []);
  useEffect(() => { refresh(); }, [selectedType, refresh]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (editingId) {
        await updateClassification(editingId, { name: form.name });
      } else {
        await createClassification({ analyte_type_id: form.analyte_type_id || selectedType, name: form.name });
      }
      setForm({ analyte_type_id: '', name: '' });
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
    setForm({ analyte_type_id: row.analyte_type_id, name: row.name });
    setIsFormOpen(true);
  };

  const onDelete = async (id) => {
    setDeleteTarget(id);
  };

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
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-3xl font-extrabold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Classifications</h1>
          <div className="flex items-center gap-2">
            <select className="border p-2 rounded" value={selectedType} onChange={e=>setSelectedType(e.target.value)}>
              <option value="">All Types</option>
              {types.map(t=> <option key={t.id} value={t.id}>{t.code} {t.name ? `- ${t.name}`: ''}</option>)}
            </select>
            <button className="px-4 py-2 rounded bg-blue-600 text-white" onClick={()=>{ setEditingId(null); setForm({ analyte_type_id: selectedType || '', name:''}); setIsFormOpen(true); }}>New</button>
          </div>
        </div>
        {error && <div className="text-red-500">{error}</div>}

        <Modal isOpen={isFormOpen} onClose={()=>setIsFormOpen(false)} title={editingId ? 'Edit Classification' : 'New Classification'} footer={(
          <>
            <button className="px-4 py-2 rounded border" onClick={()=>setIsFormOpen(false)} type="button">Cancel</button>
            <button className="px-4 py-2 rounded bg-blue-600 text-white" onClick={onSubmit} disabled={loading}>{editingId ? 'Update' : 'Create'}</button>
          </>
        )}>
        <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <select className="border p-2 rounded" value={form.analyte_type_id || selectedType} onChange={e=>setForm({...form, analyte_type_id: e.target.value})} required={!editingId}>
            <option value="">Select Analyte Type</option>
            {types.map(t=> <option key={t.id} value={t.id}>{t.code} {t.name ? `- ${t.name}`: ''}</option>)}
          </select>
          <input className="border p-2 rounded md:col-span-2" placeholder="Name" value={form.name} onChange={e=>setForm({...form, name:e.target.value})} required />
        </form>
        </Modal>

        <div className="bg-white rounded-xl shadow-lg overflow-auto max-h-[80vh] border border-gray-100">
          <table className="min-w-full">
            <thead className="sticky top-0 z-20">
              <tr className="text-left bg-gray-50 border-b">
                <th className="p-3 font-semibold text-gray-600 sticky top-0 bg-gray-50">Analyte Type</th>
                <th className="p-3 font-semibold text-gray-600 sticky top-0 bg-gray-50">Name</th>
                <th className="p-3 font-semibold text-gray-600 sticky top-0 bg-gray-50">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r=> (
                <tr key={r.id} className="border-b hover:bg-gray-50 transition-colors">
                  <td className="p-3">{r.analyte_type_code}</td>
                  <td className="p-3">{r.name}</td>
                  <td className="p-3 flex gap-2">
                    <button className="px-3 py-1 border rounded hover:bg-white shadow-sm" onClick={()=>onEdit(r)}>Edit</button>
                    <button className="px-3 py-1 border rounded text-red-600 hover:bg-white shadow-sm" onClick={()=>onDelete(r.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>

        <Modal isOpen={!!deleteTarget} onClose={()=>setDeleteTarget(null)} title="Delete Classification" footer={(
          <>
            <button className="px-4 py-2 rounded border" onClick={()=>setDeleteTarget(null)} type="button">Cancel</button>
            <button className="px-4 py-2 rounded bg-red-600 text-white" onClick={async ()=>{ setLoading(true); try { await deleteClassification(deleteTarget); setDeleteTarget(null); await refresh(); } catch(e){ setError(e.message);} finally{ setLoading(false);} }}>Delete</button>
          </>
        )}>
          <p>Are you sure you want to delete this classification?</p>
        </Modal>
      </div>
    </DashboardLayout>
  );
}

