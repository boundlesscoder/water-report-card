import * as service from './contacts.service.js';

// ============= CONTACTS =============

export async function listContacts(req, res) {
  try {
    const filters = {
      search: req.query.search,
      status: req.query.status,
      parent_id: req.query.parent_id !== undefined ? (req.query.parent_id === 'null' ? null : req.query.parent_id) : undefined,
      page: req.query.page,
      pageSize: req.query.pageSize || req.query.limit
    };

    const result = await service.listContactsService(filters);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('listContacts error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to list contacts' });
  }
}

export async function getContact(req, res) {
  try {
    const { id } = req.params;
    const contact = await service.getContactByIdService(id);
    
    if (!contact) {
      return res.status(404).json({ success: false, message: 'Contact not found' });
    }
    
    res.json({ success: true, data: contact });
  } catch (error) {
    console.error('getContact error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to get contact' });
  }
}

export async function createContact(req, res) {
  try {
    const contact = await service.createContactService(req.body);
    res.status(201).json({ success: true, data: contact });
  } catch (error) {
    console.error('createContact error:', error);
    
    if (error.code === '23505') {
      return res.status(409).json({ success: false, message: 'Duplicate key. A record with these unique fields already exists.' });
    }
    if (error.code === '23503') {
      return res.status(400).json({ success: false, message: 'Foreign key violation. Please select valid related records.' });
    }
    if (error.code === '23502') {
      return res.status(400).json({ success: false, message: 'Missing required field. Please fill all required fields.' });
    }
    
    res.status(400).json({ success: false, message: error.message || 'Failed to create contact' });
  }
}

export async function updateContact(req, res) {
  try {
    const { id } = req.params;
    const contact = await service.updateContactService(id, req.body);
    
    if (!contact) {
      return res.status(404).json({ success: false, message: 'Contact not found' });
    }
    
    res.json({ success: true, data: contact });
  } catch (error) {
    console.error('updateContact error:', error);
    
    if (error.code === '23505') {
      return res.status(409).json({ success: false, message: 'Duplicate key. A record with these unique fields already exists.' });
    }
    if (error.code === '23503') {
      return res.status(400).json({ success: false, message: 'Foreign key violation. Please select valid related records.' });
    }
    
    res.status(400).json({ success: false, message: error.message || 'Failed to update contact' });
  }
}

export async function deleteContact(req, res) {
  try {
    const { id } = req.params;
    const contact = await service.deleteContactService(id);
    
    if (!contact) {
      return res.status(404).json({ success: false, message: 'Contact not found' });
    }
    
    res.json({ success: true, data: contact });
  } catch (error) {
    console.error('deleteContact error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to delete contact' });
  }
}

// Get dropdown options for search bars
export async function getDropdownOptions(req, res) {
  try {
    const { searches = [], fieldId } = req.body;
    
    // searches format: [{fieldId: string, value: string}, ...]
    // fieldId: the field we want dropdown options for (exclude this from filtering)
    
    if (!fieldId) {
      return res.status(400).json({ success: false, message: 'fieldId is required' });
    }

    const options = await service.getDropdownOptionsService(searches, fieldId);
    res.json({ success: true, data: options });
  } catch (error) {
    console.error('getDropdownOptions error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to get dropdown options' });
  }
}

// Get contacts filtered by search conditions
export async function getContactsBySearch(req, res) {
  try {
    const { searches = [], sorts = [], page = 1, limit = 50 } = req.body;
    
    // searches format: [{fieldId: string, value: string}, ...]
    // sorts format: [{fieldId: string, direction: 'asc'|'desc'}, ...]
    
    const result = await service.getContactsBySearchService(searches, sorts, page, limit);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('getContactsBySearch error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to get contacts' });
  }
}

// ============= LOCATIONS =============

export async function listLocations(req, res) {
  try {
    const filters = {
      search: req.query.search,
      contact_id: req.query.contact_id,
      status: req.query.status,
      region: req.query.region,
      service_zone: req.query.service_zone,
      page: req.query.page,
      pageSize: req.query.pageSize || req.query.limit
    };

    const result = await service.listLocationsService(filters);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('listLocations error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to list locations' });
  }
}

export async function getLocation(req, res) {
  try {
    const { id } = req.params;
    const location = await service.getLocationByIdService(id);
    
    if (!location) {
      return res.status(404).json({ success: false, message: 'Location not found' });
    }
    
    res.json({ success: true, data: location });
  } catch (error) {
    console.error('getLocation error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to get location' });
  }
}

export async function createLocation(req, res) {
  try {
    const location = await service.createLocationService(req.body);
    res.status(201).json({ success: true, data: location });
  } catch (error) {
    console.error('createLocation error:', error);
    
    if (error.code === '23505') {
      return res.status(409).json({ success: false, message: 'Duplicate key. A record with these unique fields already exists.' });
    }
    if (error.code === '23503') {
      return res.status(400).json({ success: false, message: 'Foreign key violation. Please select valid related records.' });
    }
    
    res.status(400).json({ success: false, message: error.message || 'Failed to create location' });
  }
}

export async function updateLocation(req, res) {
  try {
    const { id } = req.params;
    const location = await service.updateLocationService(id, req.body);
    
    if (!location) {
      return res.status(404).json({ success: false, message: 'Location not found' });
    }
    
    res.json({ success: true, data: location });
  } catch (error) {
    console.error('updateLocation error:', error);
    
    if (error.code === '23505') {
      return res.status(409).json({ success: false, message: 'Duplicate key. A record with these unique fields already exists.' });
    }
    if (error.code === '23503') {
      return res.status(400).json({ success: false, message: 'Foreign key violation. Please select valid related records.' });
    }
    
    res.status(400).json({ success: false, message: error.message || 'Failed to update location' });
  }
}

export async function deleteLocation(req, res) {
  try {
    const { id } = req.params;
    const location = await service.deleteLocationService(id);
    
    if (!location) {
      return res.status(404).json({ success: false, message: 'Location not found' });
    }
    
    res.json({ success: true, data: location });
  } catch (error) {
    console.error('deleteLocation error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to delete location' });
  }
}

// ============= ADDRESSES =============

export async function createAddress(req, res) {
  try {
    const address = await service.createAddressService(req.body);
    res.status(201).json({ success: true, data: address });
  } catch (error) {
    console.error('createAddress error:', error);
    res.status(400).json({ success: false, message: error.message || 'Failed to create address' });
  }
}

export async function updateAddress(req, res) {
  try {
    const { id } = req.params;
    const address = await service.updateAddressService(id, req.body);
    
    if (!address) {
      return res.status(404).json({ success: false, message: 'Address not found' });
    }
    
    res.json({ success: true, data: address });
  } catch (error) {
    console.error('updateAddress error:', error);
    res.status(400).json({ success: false, message: error.message || 'Failed to update address' });
  }
}

export async function deleteAddress(req, res) {
  try {
    const { id } = req.params;
    const address = await service.deleteAddressService(id);
    
    if (!address) {
      return res.status(404).json({ success: false, message: 'Address not found' });
    }
    
    res.json({ success: true, data: address });
  } catch (error) {
    console.error('deleteAddress error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to delete address' });
  }
}

// ============= BILLING INFORMATION =============

export async function listBillingInfo(req, res) {
  try {
    const filters = {
      contact_id: req.query.contact_id,
      location_id: req.query.location_id,
      is_active: req.query.is_active !== undefined ? req.query.is_active === 'true' : undefined,
      page: req.query.page,
      pageSize: req.query.pageSize || req.query.limit
    };

    const result = await service.listBillingInfoService(filters);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('listBillingInfo error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to list billing information' });
  }
}

export async function getBillingInfo(req, res) {
  try {
    const { id } = req.params;
    const billingInfo = await service.getBillingInfoByIdService(id);
    
    if (!billingInfo) {
      return res.status(404).json({ success: false, message: 'Billing information not found' });
    }
    
    res.json({ success: true, data: billingInfo });
  } catch (error) {
    console.error('getBillingInfo error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to get billing information' });
  }
}

export async function createBillingInfo(req, res) {
  try {
    const billingInfo = await service.createBillingInfoService(req.body);
    res.status(201).json({ success: true, data: billingInfo });
  } catch (error) {
    console.error('createBillingInfo error:', error);
    
    if (error.code === '23503') {
      return res.status(400).json({ success: false, message: 'Foreign key violation. Please select valid related records.' });
    }
    
    res.status(400).json({ success: false, message: error.message || 'Failed to create billing information' });
  }
}

export async function updateBillingInfo(req, res) {
  try {
    const { id } = req.params;
    const billingInfo = await service.updateBillingInfoService(id, req.body);
    
    if (!billingInfo) {
      return res.status(404).json({ success: false, message: 'Billing information not found' });
    }
    
    res.json({ success: true, data: billingInfo });
  } catch (error) {
    console.error('updateBillingInfo error:', error);
    res.status(400).json({ success: false, message: error.message || 'Failed to update billing information' });
  }
}

export async function deleteBillingInfo(req, res) {
  try {
    const { id } = req.params;
    const billingInfo = await service.deleteBillingInfoService(id);
    
    if (!billingInfo) {
      return res.status(404).json({ success: false, message: 'Billing information not found' });
    }
    
    res.json({ success: true, data: billingInfo });
  } catch (error) {
    console.error('deleteBillingInfo error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to delete billing information' });
  }
}

