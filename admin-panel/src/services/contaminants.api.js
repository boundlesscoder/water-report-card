const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:2018';

async function http(method, path, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
    credentials: 'include'
  });
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try { const j = await res.json(); msg = j.error || msg; } catch {}
    throw new Error(msg);
  }
  if (res.status === 204) return null;
  return res.json();
}

// Analyte Types
export const listAnalyteTypes = () => http('GET', '/api/contaminants/analyte-types');
export const createAnalyteType = (payload) => http('POST', '/api/contaminants/analyte-types', payload);
export const updateAnalyteType = (id, payload) => http('PUT', `/api/contaminants/analyte-types/${id}`, payload);
export const deleteAnalyteType = (id) => http('DELETE', `/api/contaminants/analyte-types/${id}`);

// Classifications
export const listClassifications = (analyte_type_id) => {
  const q = analyte_type_id ? `?analyte_type_id=${encodeURIComponent(analyte_type_id)}` : '';
  return http('GET', `/api/contaminants/classifications${q}`);
};
export const createClassification = (payload) => http('POST', '/api/contaminants/classifications', payload);
export const updateClassification = (id, payload) => http('PUT', `/api/contaminants/classifications/${id}`, payload);
export const deleteClassification = (id) => http('DELETE', `/api/contaminants/classifications/${id}`);

// Subclassifications
export const listSubclassifications = (classification_id) => {
  const q = classification_id ? `?classification_id=${encodeURIComponent(classification_id)}` : '';
  return http('GET', `/api/contaminants/subclassifications${q}`);
};
export const createSubclassification = (payload) => http('POST', '/api/contaminants/subclassifications', payload);
export const updateSubclassification = (id, payload) => http('PUT', `/api/contaminants/subclassifications/${id}`, payload);
export const deleteSubclassification = (id) => http('DELETE', `/api/contaminants/subclassifications/${id}`);

// Analytes
export const listAnalytes = (params = {}) => {
  const query = new URLSearchParams(params).toString();
  const q = query ? `?${query}` : '';
  return http('GET', `/api/contaminants/analytes${q}`);
};
export const createAnalyte = (payload) => http('POST', '/api/contaminants/analytes', payload);
export const updateAnalyte = (id, payload) => http('PUT', `/api/contaminants/analytes/${id}`, payload);
export const deleteAnalyte = (id) => http('DELETE', `/api/contaminants/analytes/${id}`);

