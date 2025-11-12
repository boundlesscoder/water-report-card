"use client";

import {
  BuildingOfficeIcon,
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon,
  UserIcon,
  PencilIcon
} from '@heroicons/react/24/outline';

export default function CustomerDetailsSidebar({ 
  account, 
  editing, 
  setEditing, 
  form, 
  setForm, 
  onSave, 
  locationCount = 0 
}) {
  const EditField = ({ label, field, form, setForm, defaultValue }) => (
    <div>
      <label className="block text-xs text-gray-600 mb-1">{label}</label>
      <input
        defaultValue={defaultValue ?? ''}
        onChange={(e) => setForm(prev => ({ ...prev, [field]: e.target.value }))}
        className="w-full p-2 border rounded text-sm"
      />
    </div>
  );

  return (
    <div className="lg:col-span-1 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <BuildingOfficeIcon className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{account?.name || 'Customer'}</h2>
              <p className="text-sm text-gray-500">#{account?.account_number || 'No account number'}</p>
            </div>
          </div>
          {!editing ? (
            <button 
              className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium" 
              onClick={() => setEditing(true)}
            >
              <PencilIcon className="w-4 h-4" />
              Edit
            </button>
          ) : (
            <div className="flex gap-2">
              <button 
                className="text-sm text-gray-600 hover:text-gray-700 px-3 py-1 rounded border border-gray-300 hover:bg-gray-50" 
                onClick={() => { setEditing(false); setForm({}); }}
              >
                Cancel
              </button>
              <button 
                className="text-sm text-white bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded" 
                onClick={onSave}
              >
                Save
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Content - Scrollable */}
      <div className="max-h-[calc(100vh-200px)] overflow-y-auto">
        {!editing ? (
          <div className="p-6 space-y-6">
            {/* Basic Information */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <BuildingOfficeIcon className="w-4 h-4 text-gray-500" />
                Basic Information
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Status</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    account?.status === 'active' ? 'bg-green-100 text-green-800' :
                    account?.status === 'inactive' ? 'bg-red-100 text-red-800' :
                    account?.status === 'prospect' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {account?.status || 'Unknown'}
                  </span>
                </div>
                {account?.tier1_id && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Customer Type</span>
                    <span className="text-sm text-gray-900">Tier 1 Assigned</span>
                  </div>
                )}
                {account?.tier2_id && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Sub Type</span>
                    <span className="text-sm text-gray-900">Tier 2 Assigned</span>
                  </div>
                )}
                {account?.tier3_id && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Specialized Type</span>
                    <span className="text-sm text-gray-900">Tier 3 Assigned</span>
                  </div>
                )}
                {account?.created_at && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Created</span>
                    <span className="text-sm text-gray-900">{new Date(account.created_at).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Billing Information */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <EnvelopeIcon className="w-4 h-4 text-gray-500" />
                Billing Information
              </h3>
              <div className="space-y-3">
                {account?.billing_contact_name && (
                  <div>
                    <span className="text-xs text-gray-500">Contact Name</span>
                    <p className="text-sm text-gray-900">{account.billing_contact_name}</p>
                  </div>
                )}
                {account?.billing_email && (
                  <div>
                    <span className="text-xs text-gray-500">Email</span>
                    <p className="text-sm text-gray-900 break-all">{account.billing_email}</p>
                  </div>
                )}
                {(account?.billing_address_line1 || account?.billing_city) && (
                  <div>
                    <span className="text-xs text-gray-500">Address</span>
                    <div className="text-sm text-gray-900">
                      {account?.billing_address_line1 && <p>{account.billing_address_line1}</p>}
                      {account?.billing_address_line2 && <p>{account.billing_address_line2}</p>}
                      {(account?.billing_city || account?.billing_state || account?.billing_zip) && (
                        <p>{[account?.billing_city, account?.billing_state, account?.billing_zip].filter(Boolean).join(', ')}</p>
                      )}
                      {account?.billing_country && account.billing_country !== 'USA' && <p>{account.billing_country}</p>}
                    </div>
                  </div>
                )}
                {account?.billing_department && (
                  <div>
                    <span className="text-xs text-gray-500">Department</span>
                    <p className="text-sm text-gray-900">{account.billing_department}</p>
                  </div>
                )}
                {account?.hourly_labor_rate && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Hourly Rate</span>
                    <span className="text-sm text-gray-900">${account.hourly_labor_rate}</span>
                  </div>
                )}
                {account?.discount_rate && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Discount Rate</span>
                    <span className="text-sm text-gray-900">{(account.discount_rate * 100).toFixed(2)}%</span>
                  </div>
                )}
              </div>
            </div>

            {/* Contact Information */}
            {(account?.contact_name || account?.contact_1_email || account?.contact_1_cell_phone) && (
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <UserIcon className="w-4 h-4 text-gray-500" />
                  Contact Information
                </h3>
                <div className="space-y-3">
                  {account?.contact_name && (
                    <div>
                      <span className="text-xs text-gray-500">Primary Contact</span>
                      <p className="text-sm text-gray-900">{account.contact_name}</p>
                    </div>
                  )}
                  {account?.contact_1_first_name && (
                    <div>
                      <span className="text-xs text-gray-500">Contact 1</span>
                      <p className="text-sm text-gray-900">{account.contact_1_first_name} {account.last_name || ''}</p>
                      {account.contact_1_title && <p className="text-xs text-gray-500">{account.contact_1_title}</p>}
                    </div>
                  )}
                  {account?.contact_1_email && (
                    <div>
                      <span className="text-xs text-gray-500">Email</span>
                      <p className="text-sm text-gray-900 break-all">{account.contact_1_email}</p>
                    </div>
                  )}
                  {account?.contact_1_direct_line && (
                    <div>
                      <span className="text-xs text-gray-500">Direct Line</span>
                      <p className="text-sm text-gray-900">{account.contact_1_direct_line}</p>
                    </div>
                  )}
                  {account?.contact_1_cell_phone && (
                    <div>
                      <span className="text-xs text-gray-500">Cell Phone</span>
                      <p className="text-sm text-gray-900">{account.contact_1_cell_phone}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Secondary Contact */}
            {(account?.contact_2_name || account?.contact_2_email) && (
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <UserIcon className="w-4 h-4 text-gray-500" />
                  Secondary Contact
                </h3>
                <div className="space-y-3">
                  {account?.contact_2_name && (
                    <div>
                      <span className="text-xs text-gray-500">Name</span>
                      <p className="text-sm text-gray-900">{account.contact_2_name}</p>
                      {account.contact_2_title && <p className="text-xs text-gray-500">{account.contact_2_title}</p>}
                    </div>
                  )}
                  {account?.contact_2_email && (
                    <div>
                      <span className="text-xs text-gray-500">Email</span>
                      <p className="text-sm text-gray-900 break-all">{account.contact_2_email}</p>
                    </div>
                  )}
                  {account?.contact_2_direct_line && (
                    <div>
                      <span className="text-xs text-gray-500">Direct Line</span>
                      <p className="text-sm text-gray-900">{account.contact_2_direct_line}</p>
                    </div>
                  )}
                  {account?.contact_2_cell && (
                    <div>
                      <span className="text-xs text-gray-500">Cell Phone</span>
                      <p className="text-sm text-gray-900">{account.contact_2_cell}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Location Information */}
            {(account?.location_address_line1 || account?.location_city) && (
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <MapPinIcon className="w-4 h-4 text-gray-500" />
                  Primary Location
                </h3>
                <div className="space-y-3">
                  <div>
                    <span className="text-xs text-gray-500">Address</span>
                    <div className="text-sm text-gray-900">
                      {account?.location_address_line1 && <p>{account.location_address_line1}</p>}
                      {account?.location_address_line2 && <p>{account.location_address_line2}</p>}
                      {(account?.location_city || account?.location_state || account?.location_zip) && (
                        <p>{[account?.location_city, account?.location_state, account?.location_zip].filter(Boolean).join(', ')}</p>
                      )}
                    </div>
                  </div>
                  {account?.location_phone_no && (
                    <div>
                      <span className="text-xs text-gray-500">Phone</span>
                      <p className="text-sm text-gray-900">{account.location_phone_no}</p>
                    </div>
                  )}
                  {account?.location_region && (
                    <div>
                      <span className="text-xs text-gray-500">Region</span>
                      <p className="text-sm text-gray-900">{account.location_region}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Business Information */}
            {(account?.service_zone || account?.referral || account?.lead_source) && (
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <BuildingOfficeIcon className="w-4 h-4 text-gray-500" />
                  Business Information
                </h3>
                <div className="space-y-3">
                  {account?.service_zone && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Service Zone</span>
                      <span className="text-sm text-gray-900">{account.service_zone}</span>
                    </div>
                  )}
                  {account?.referral && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Referral</span>
                      <span className="text-sm text-gray-900">{account.referral}</span>
                    </div>
                  )}
                  {account?.lead_source && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Lead Source</span>
                      <span className="text-sm text-gray-900">{account.lead_source}</span>
                    </div>
                  )}
                  {account?.external_url && (
                    <div>
                      <span className="text-xs text-gray-500">Website</span>
                      <a 
                        href={account.external_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:text-blue-700 break-all"
                      >
                        {account.external_url}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Notes */}
            {(account?.general_notes || account?.special_instructions) && (
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <PencilIcon className="w-4 h-4 text-gray-500" />
                  Notes
                </h3>
                <div className="space-y-3">
                  {account?.general_notes && (
                    <div>
                      <span className="text-xs text-gray-500">General Notes</span>
                      <p className="text-sm text-gray-900 whitespace-pre-wrap">{account.general_notes}</p>
                    </div>
                  )}
                  {account?.special_instructions && (
                    <div>
                      <span className="text-xs text-gray-500">Special Instructions</span>
                      <p className="text-sm text-gray-900 whitespace-pre-wrap">{account.special_instructions}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Activity Summary */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Activity Summary</h3>
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <p className="text-lg font-bold text-blue-600">{locationCount}</p>
                  <p className="text-xs text-gray-500">Total Locations</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-green-600">
                    {account?.status === 'active' ? 'Active' : 'Inactive'}
                  </p>
                  <p className="text-xs text-gray-500">Account Status</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-6 space-y-4">
            <EditField label="Name" field="name" form={form} setForm={setForm} defaultValue={account?.name} />
            <EditField label="Account #" field="account_number" form={form} setForm={setForm} defaultValue={account?.account_number} />
            <EditField label="Status" field="status" form={form} setForm={setForm} defaultValue={account?.status} />
            <EditField label="Tier1 ID" field="tier1_id" form={form} setForm={setForm} defaultValue={account?.tier1_id} />
            <EditField label="Tier2 ID" field="tier2_id" form={form} setForm={setForm} defaultValue={account?.tier2_id} />
            <EditField label="Tier3 ID" field="tier3_id" form={form} setForm={setForm} defaultValue={account?.tier3_id} />
            <div className="pt-2">
              <div className="text-gray-500 mb-2 text-sm font-medium">Billing Information</div>
              <div className="space-y-3">
                <EditField label="Billing Name" field="billing_name" form={form} setForm={setForm} defaultValue={account?.billing_name} />
                <EditField label="Billing Address 1" field="billing_address_line1" form={form} setForm={setForm} defaultValue={account?.billing_address_line1} />
                <EditField label="Billing City" field="billing_city" form={form} setForm={setForm} defaultValue={account?.billing_city} />
                <EditField label="Billing State" field="billing_state" form={form} setForm={setForm} defaultValue={account?.billing_state} />
                <EditField label="Billing Zip" field="billing_zip" form={form} setForm={setForm} defaultValue={account?.billing_zip} />
                <EditField label="Billing Email" field="billing_email" form={form} setForm={setForm} defaultValue={account?.billing_email} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
