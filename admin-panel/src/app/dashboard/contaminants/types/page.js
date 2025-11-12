'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '../../../../components/layout/DashboardLayout';
import { listAnalyteTypes, createAnalyteType, updateAnalyteType, deleteAnalyteType } from '../../../../services/contaminants.api';
import Modal from '../../../../components/ui/Modal';
import { usePlatformAdminRoute } from '../../../../hooks/useRouteProtection';

export default function AnalyteTypesPage() {
  // Route protection - only Platform Admins can access this page
  const { isPlatformAdmin, isLoading } = usePlatformAdminRoute();
  
  // ALL HOOKS MUST BE CALLED BEFORE ANY CONDITIONAL LOGIC
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState({ code: '', name: '', description: '' });
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const refresh = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await listAnalyteTypes();
      setRows(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refresh(); }, []);

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (editingId) {
        await updateAnalyteType(editingId, form);
      } else {
        await createAnalyteType(form);
      }
      setForm({ code: '', name: '', description: '' });
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
    setForm({ code: row.code || '', name: row.name || '', description: row.description || '' });
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h1 className="text-3xl font-extrabold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Analyte Types</h1>
          <button className="px-4 py-2 rounded bg-blue-600 text-white" onClick={()=>{ setEditingId(null); setForm({ code:'', name:'', description:''}); setIsFormOpen(true); }}>New</button>
        </div>
        {error && <div className="text-red-500">{error}</div>}

        <Modal isOpen={isFormOpen} onClose={()=>setIsFormOpen(false)} title={editingId ? 'Edit Analyte Type' : 'New Analyte Type'} footer={(
          <>
            <button className="px-4 py-2 rounded border" onClick={()=>setIsFormOpen(false)} type="button">Cancel</button>
            <button className="px-4 py-2 rounded bg-blue-600 text-white" onClick={onSubmit} disabled={loading}>{editingId ? 'Update' : 'Create'}</button>
          </>
        )}>
        <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input className="border p-2 rounded" placeholder="Code (e.g., WQI)" value={form.code} onChange={e=>setForm({...form, code:e.target.value})} required={!editingId} />
          <input className="border p-2 rounded" placeholder="Name (optional)" value={form.name} onChange={e=>setForm({...form, name:e.target.value})} />
          <input className="border p-2 rounded md:col-span-3" placeholder="Description" value={form.description} onChange={e=>setForm({...form, description:e.target.value})} />
        </form>
        </Modal>

        <div className="bg-white rounded-xl shadow-lg overflow-auto max-h-[80vh] border border-gray-100">
          <table className="min-w-full">
            <thead className="sticky top-0 z-20">
              <tr className="text-left bg-gray-50 border-b">
                <th className="p-3 font-semibold text-gray-600 sticky top-0 bg-gray-50">Code</th>
                <th className="p-3 font-semibold text-gray-600 sticky top-0 bg-gray-50">Name</th>
                <th className="p-3 font-semibold text-gray-600 sticky top-0 bg-gray-50">Description</th>
                <th className="p-3 font-semibold text-gray-600 sticky top-0 bg-gray-50">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r=> (
                <tr key={r.id} className="border-b hover:bg-gray-50 transition-colors">
                  <td className="p-3 font-mono">{r.code}</td>
                  <td className="p-3">{r.name}</td>
                  <td className="p-3 max-w-xl truncate" title={r.description}>{r.description}</td>
                  <td className="p-3 flex gap-2">
                    <button className="px-3 py-1 border rounded hover:bg-white shadow-sm" onClick={()=>onEdit(r)}>Edit</button>
                    <button className="px-3 py-1 border rounded text-red-600 hover:bg-white shadow-sm" onClick={()=>onDelete(r.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <Modal isOpen={!!deleteTarget} onClose={()=>setDeleteTarget(null)} title="Delete Analyte Type" footer={(
          <>
            <button className="px-4 py-2 rounded border" onClick={()=>setDeleteTarget(null)} type="button">Cancel</button>
            <button className="px-4 py-2 rounded bg-red-600 text-white" onClick={async ()=>{ setLoading(true); try { await deleteAnalyteType(deleteTarget); setDeleteTarget(null); await refresh(); } catch(e){ setError(e.message);} finally{ setLoading(false);} }}>Delete</button>
          </>
        )}>
          <p>Are you sure you want to delete this analyte type?</p>
        </Modal>
      </div>
    </DashboardLayout>
  );
}

