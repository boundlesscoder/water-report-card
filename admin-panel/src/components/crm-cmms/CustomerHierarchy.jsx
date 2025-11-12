'use client';

import React, { useEffect, useMemo, useState } from 'react';
import api from '../../services/api';
import { PlusIcon, ChevronRightIcon, ChevronDownIcon, TrashIcon, PencilIcon } from '@heroicons/react/24/outline';

const typeLabels = {
  account: 'Account',
  location: 'Location',
  building: 'Building',
  floor: 'Floor',
  room: 'Room'
};

const childTypesByParent = {
  account: ['location'],
  location: ['building'],
  building: ['floor'],
  floor: ['room'],
  room: []
};

const CustomerHierarchy = () => {
  const [rootNodes, setRootNodes] = useState([]);
  const [children, setChildren] = useState({}); // parentId -> nodes[]
  const [expanded, setExpanded] = useState({}); // nodeId -> bool
  const [selected, setSelected] = useState(null); // { node_type, node_id, display_name }
  const [details, setDetails] = useState(null);
  const [loadingTree, setLoadingTree] = useState(true);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [form, setForm] = useState({});
  const [newChildType, setNewChildType] = useState('');

  useEffect(() => {
    loadRoot();
  }, []);

  const loadRoot = async () => {
    setLoadingTree(true);
    setError('');
    try {
      const res = await api.get('/crm/hierarchy', { params: { level: 0, search: search || undefined } });
      if (res.data?.success) setRootNodes(res.data.data || []);
      else throw new Error(res.data?.message || 'Failed to load accounts');
    } catch (e) {
      setError(e.message || 'Failed to load');
    } finally {
      setLoadingTree(false);
    }
  };

  const toggleExpand = async (node) => {
    const isOpen = !!expanded[node.node_id];
    setExpanded(prev => ({ ...prev, [node.node_id]: !isOpen }));
    if (!isOpen && !children[node.node_id]) {
      await loadChildren(node);
    }
  };

  const loadChildren = async (node) => {
    try {
      const res = await api.get('/crm/hierarchy', { params: { parent_id: node.node_id } });
      if (res.data?.success) setChildren(prev => ({ ...prev, [node.node_id]: res.data.data || [] }));
    } catch (e) {
    }
  };

  const onSelect = async (node) => {
    setSelected(node);
    setLoadingDetails(true);
    setDetails(null);
    try {
      const res = await api.get(`/crm/hierarchy/${node.node_type}/${node.node_id}`);
      if (res.data?.success) setDetails(res.data.data);
    } catch (e) {
    } finally {
      setLoadingDetails(false);
    }
  };

  const filteredRoot = useMemo(() => {
    if (!search) return rootNodes;
    const q = search.toLowerCase();
    return rootNodes.filter(n => (n.display_name || '').toLowerCase().includes(q));
  }, [rootNodes, search]);

  const beginAdd = (parentNode, childType) => {
    setNewChildType(childType);
    setForm({});
    setAddModalOpen(true);
  };

  const beginEdit = () => {
    if (!selected) return;
    setForm({});
    setEditModalOpen(true);
  };

  const beginDelete = () => {
    if (!selected) return;
    setDeleteModalOpen(true);
  };

  const submitAdd = async () => {
    if (!selected) return;
    try {
      const body = { parent_id: selected.node_id, ...form };
      const res = await api.post(`/crm/hierarchy/${newChildType}`, body);
      if (res.data?.success) {
        setAddModalOpen(false);
        setForm({});
        // refresh children
        await loadChildren(selected);
        setExpanded(prev => ({ ...prev, [selected.node_id]: true }));
      } else {
        alert(res.data?.message || 'Failed to create');
      }
    } catch (e) {
      alert(e.response?.data?.message || e.message || 'Failed to create');
    }
  };

  const submitEdit = async () => {
    if (!selected) return;
    try {
      const res = await api.put(`/crm/hierarchy/${selected.node_type}/${selected.node_id}`, form);
      if (res.data?.success) {
        setEditModalOpen(false);
        setForm({});
        await onSelect(selected);
        // refresh parent list label if name changed
        if (selected.parent_id) await loadChildren({ node_id: selected.parent_id });
        else await loadRoot();
      } else {
        alert(res.data?.message || 'Failed to update');
      }
    } catch (e) {
      alert(e.response?.data?.message || e.message || 'Failed to update');
    }
  };

  const submitDelete = async () => {
    if (!selected) return;
    try {
      await api.delete(`/crm/hierarchy/${selected.node_type}/${selected.node_id}`);
      setDeleteModalOpen(false);
      // refresh parent
      const parentId = selected.parent_id;
      setSelected(null);
      setDetails(null);
      if (parentId) await loadChildren({ node_id: parentId });
      else await loadRoot();
    } catch (e) {
      alert(e.response?.data?.message || e.message || 'Delete failed');
    }
  };

  const renderAddFormFields = () => {
    switch (newChildType) {
      case 'location':
        return (
          <>
            <Field label="Name" field="name" form={form} setForm={setForm} />
            <Field label="Location Type" field="location_type" form={form} setForm={setForm} />
            <Field label="Region" field="region" form={form} setForm={setForm} />
            <Field label="Route Code" field="route_code" form={form} setForm={setForm} />
          </>
        );
      case 'building':
        return (
          <>
            <Field label="Building Name" field="building_name" form={form} setForm={setForm} />
            <Field label="Building Code" field="building_code" form={form} setForm={setForm} />
          </>
        );
      case 'floor':
        return (
          <>
            <Field label="Floor Number" field="floor_number" form={form} setForm={setForm} />
            <Field label="Floor Name" field="floor_name" form={form} setForm={setForm} />
          </>
        );
      case 'room':
        return (
          <>
            <Field label="Room Name" field="room_name" form={form} setForm={setForm} />
            <Field label="Room Number" field="room_number" form={form} setForm={setForm} />
          </>
        );
      default:
        return null;
    }
  };

  const renderEditFormFields = () => {
    if (!selected) return null;
    switch (selected.node_type) {
      case 'account':
        return (
          <>
            <Field label="Name" field="name" form={form} setForm={setForm} />
            <Field label="Account #" field="account_number" form={form} setForm={setForm} />
            <Field label="Status" field="status" form={form} setForm={setForm} />
          </>
        );
      case 'location':
        return (
          <>
            <Field label="Name" field="name" form={form} setForm={setForm} />
            <Field label="Location Type" field="location_type" form={form} setForm={setForm} />
            <Field label="Region" field="region" form={form} setForm={setForm} />
            <Field label="Route Code" field="route_code" form={form} setForm={setForm} />
            <Field label="Status" field="status" form={form} setForm={setForm} />
          </>
        );
      case 'building':
        return (
          <>
            <Field label="Building Name" field="building_name" form={form} setForm={setForm} />
            <Field label="Building Code" field="building_code" form={form} setForm={setForm} />
          </>
        );
      case 'floor':
        return (
          <>
            <Field label="Floor Number" field="floor_number" form={form} setForm={setForm} />
            <Field label="Floor Name" field="floor_name" form={form} setForm={setForm} />
          </>
        );
      case 'room':
        return (
          <>
            <Field label="Room Name" field="room_name" form={form} setForm={setForm} />
            <Field label="Room Number" field="room_number" form={form} setForm={setForm} />
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Tree (left) */}
      <div className="lg:col-span-1 bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="p-3 border-b flex items-center gap-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search accounts..."
            className="flex-1 p-2 border rounded"
          />
          <button onClick={loadRoot} className="px-3 py-2 text-sm bg-gray-100 rounded">Go</button>
        </div>
        <div className="p-2 max-h-[70vh] overflow-auto">
          {loadingTree ? (
            <div className="p-4 text-sm text-gray-500">Loading...</div>
          ) : (
            <ul className="space-y-1">
              {filteredRoot.map(node => (
                <TreeNode
                  key={node.node_id}
                  node={node}
                  selected={selected?.node_id}
                  expanded={!!expanded[node.node_id]}
                  childrenMap={children}
                  onToggle={toggleExpand}
                  onSelect={onSelect}
                  onLoadChildren={loadChildren}
                />
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Details (right) */}
      <div className="lg:col-span-2 bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="p-3 border-b flex items-center justify-between">
          <div className="text-sm font-semibold">{selected ? `${typeLabels[selected.node_type]} Details` : 'Select a node'}</div>
          {selected && (
            <div className="flex items-center gap-2">
              {childTypesByParent[selected.node_type].map(ct => (
                <button key={ct} onClick={() => beginAdd(selected, ct)} className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded inline-flex items-center">
                  <PlusIcon className="w-4 h-4 mr-1" /> Add {typeLabels[ct]}
                </button>
              ))}
              <button onClick={beginEdit} className="px-3 py-1.5 text-xs bg-gray-100 rounded inline-flex items-center">
                <PencilIcon className="w-4 h-4 mr-1" /> Edit
              </button>
              <button onClick={beginDelete} className="px-3 py-1.5 text-xs bg-red-600 text-white rounded inline-flex items-center">
                <TrashIcon className="w-4 h-4 mr-1" /> Delete
              </button>
            </div>
          )}
        </div>
        <div className="p-4">
          {loadingDetails && <div className="text-sm text-gray-500">Loading details...</div>}
          {!loadingDetails && selected && (
            <DetailsCard node={selected} details={details} />
          )}
          {!loadingDetails && !selected && (
            <div className="text-sm text-gray-500">Choose an account, location, building, floor, or room from the tree.</div>
          )}
        </div>
      </div>

      {/* Add Modal */}
      {addModalOpen && (
        <Modal title={`Add ${typeLabels[newChildType]}`} onClose={() => setAddModalOpen(false)} onConfirm={submitAdd} confirmText="Create">
          {renderAddFormFields()}
        </Modal>
      )}
      {/* Edit Modal */}
      {editModalOpen && (
        <Modal title={`Edit ${typeLabels[selected?.node_type]}`} onClose={() => setEditModalOpen(false)} onConfirm={submitEdit} confirmText="Save">
          {renderEditFormFields()}
        </Modal>
      )}
      {/* Delete Modal */}
      {deleteModalOpen && (
        <Modal title={`Delete ${typeLabels[selected?.node_type]}`} onClose={() => setDeleteModalOpen(false)} onConfirm={submitDelete} confirmText="Delete" danger>
          <div className="text-sm text-gray-700">Are you sure you want to delete "{selected?.display_name}" and related data as per constraints?</div>
        </Modal>
      )}
    </div>
  );
};

const TreeNode = ({ node, selected, expanded, childrenMap, onToggle, onSelect, onLoadChildren }) => {
  const kids = childrenMap[node.node_id] || [];
  const hasChildren = node.level < 4; // account→location→building→floor→room

  return (
    <li>
      <div className={`flex items-center px-2 py-1 rounded cursor-pointer ${selected === node.node_id ? 'bg-blue-50' : 'hover:bg-gray-50'}`}>
        {hasChildren ? (
          <button onClick={async () => { if (!expanded && kids.length === 0) await onLoadChildren(); onToggle(); }} className="p-1">
            {expanded ? <ChevronDownIcon className="w-4 h-4" /> : <ChevronRightIcon className="w-4 h-4" />}
          </button>
        ) : (
          <span className="w-6" />
        )}
        <button onClick={onSelect} className="flex-1 text-left text-sm">
          <span className="font-medium">{node.display_name}</span>
          <span className="ml-2 text-xs text-gray-500">{typeLabels[node.node_type]}</span>
        </button>
        {typeof node.asset_count !== 'undefined' && (
          <span className="text-[10px] text-gray-500">{node.asset_count} assets</span>
        )}
      </div>
      {expanded && kids.length > 0 && (
        <ul className="pl-4 border-l ml-3 mt-1 space-y-1">
          {kids.map(child => (
            <TreeNode
              key={child.node_id}
              node={child}
              selected={selected}
              expanded={!!childrenMap[child.node_id]}
              childrenMap={childrenMap}
              onToggle={() => onToggle(child)}
              onSelect={() => onSelect(child)}
              onLoadChildren={() => onLoadChildren(child)}
            />
          ))}
        </ul>
      )}
    </li>
  );
};

const DetailsCard = ({ node, details }) => {
  if (!details) return (
    <div className="text-sm text-gray-500">No details available.</div>
  );
  const rows = Object.entries(details).filter(([k,v]) => v !== null && v !== '' && !String(k).includes('geom'));
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {rows.map(([k, v]) => (
        <div key={k} className="bg-gray-50 rounded p-3 text-sm">
          <div className="text-gray-500 text-xs">{formatLabel(k)}</div>
          <div className="text-gray-900 break-words">{String(v)}</div>
        </div>
      ))}
    </div>
  );
};

const Field = ({ label, field, form, setForm }) => (
  <div className="mb-3">
    <label className="block text-sm text-gray-700 mb-1">{label}</label>
    <input
      value={form[field] ?? ''}
      onChange={(e) => setForm(prev => ({ ...prev, [field]: e.target.value }))}
      className="w-full p-2 border rounded"
    />
  </div>
);

const Modal = ({ title, children, onClose, onConfirm, confirmText = 'Save', danger = false }) => (
  <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
    <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
      <div className="p-4 border-b font-semibold">{title}</div>
      <div className="p-4">{children}</div>
      <div className="p-4 border-t flex justify-end gap-2">
        <button onClick={onClose} className="px-3 py-2 text-sm bg-gray-100 rounded">Cancel</button>
        <button onClick={onConfirm} className={`px-3 py-2 text-sm rounded ${danger ? 'bg-red-600 text-white' : 'bg-blue-600 text-white'}`}>{confirmText}</button>
      </div>
    </div>
  </div>
);

const formatLabel = (key) => key
  .replace(/_/g, ' ')
  .replace(/\b(id)\b/i, 'ID')
  .replace(/\b(pwsid)\b/i, 'PWSID')
  .replace(/\b(tds)\b/i, 'TDS')
  .replace(/\b(ro)\b/i, 'RO')
  .replace(/\b(qr)\b/i, 'QR')
  .replace(/\b(wifi)\b/i, 'WiFi')
  .replace(/\b(ns f)\b/i, 'NSF')
  .replace(/\burl\b/i, 'URL')
  .replace(/\bapi\b/i, 'API')
  .replace(/\b([a-z])/g, (m) => m.toUpperCase());

export default CustomerHierarchy;


