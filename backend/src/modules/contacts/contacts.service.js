import * as repository from './contacts.repository.js';
import { CONTACT_STATUS, LOCATION_STATUS } from './contacts.types.js';

// ============= CONTACTS =============

export async function listContactsService(filters = {}) {
  return await repository.listContactsRepository(filters);
}

export async function getContactByIdService(id) {
  if (!id) {
    throw new Error('Contact ID is required');
  }
  return await repository.getContactByIdRepository(id);
}

export async function createContactService(data) {
  if (!data.contact_name) {
    throw new Error('Contact name is required');
  }

  // Validate status
  if (data.status && !Object.values(CONTACT_STATUS).includes(data.status)) {
    throw new Error(`Invalid status. Must be one of: ${Object.values(CONTACT_STATUS).join(', ')}`);
  }

  return await repository.createContactRepository(data);
}

export async function updateContactService(id, data) {
  if (!id) {
    throw new Error('Contact ID is required');
  }

  // Validate status if provided
  if (data.status && !Object.values(CONTACT_STATUS).includes(data.status)) {
    throw new Error(`Invalid status. Must be one of: ${Object.values(CONTACT_STATUS).join(', ')}`);
  }

  const contact = await repository.updateContactRepository(id, data);
  if (!contact) {
    throw new Error('Contact not found');
  }
  return contact;
}

export async function deleteContactService(id) {
  if (!id) {
    throw new Error('Contact ID is required');
  }

  const contact = await repository.deleteContactRepository(id);
  if (!contact) {
    throw new Error('Contact not found');
  }
  return contact;
}

// Get dropdown options for a specific field, filtered by other search conditions
export async function getDropdownOptionsService(searches = [], fieldId) {
  return await repository.getDropdownOptionsRepository(searches, fieldId);
}

// Get contacts filtered by search conditions and sorted
export async function getContactsBySearchService(searches = [], sorts = [], page = 1, limit = 50) {
  return await repository.getContactsBySearchRepository(searches, sorts, page, limit);
}

// ============= LOCATIONS =============

export async function listLocationsService(filters = {}) {
  return await repository.listLocationsRepository(filters);
}

export async function getLocationByIdService(id) {
  if (!id) {
    throw new Error('Location ID is required');
  }
  return await repository.getLocationByIdRepository(id);
}

export async function createLocationService(data) {
  if (!data.name) {
    throw new Error('Location name is required');
  }

  // Validate status
  if (data.status && !Object.values(LOCATION_STATUS).includes(data.status)) {
    throw new Error(`Invalid status. Must be one of: ${Object.values(LOCATION_STATUS).join(', ')}`);
  }

  return await repository.createLocationRepository(data);
}

export async function updateLocationService(id, data) {
  if (!id) {
    throw new Error('Location ID is required');
  }

  // Validate status if provided
  if (data.status && !Object.values(LOCATION_STATUS).includes(data.status)) {
    throw new Error(`Invalid status. Must be one of: ${Object.values(LOCATION_STATUS).join(', ')}`);
  }

  const location = await repository.updateLocationRepository(id, data);
  if (!location) {
    throw new Error('Location not found');
  }
  return location;
}

export async function deleteLocationService(id) {
  if (!id) {
    throw new Error('Location ID is required');
  }

  const location = await repository.deleteLocationRepository(id);
  if (!location) {
    throw new Error('Location not found');
  }
  return location;
}

// ============= ADDRESSES =============

export async function createAddressService(data) {
  return await repository.createAddressRepository(data);
}

export async function updateAddressService(id, data) {
  if (!id) {
    throw new Error('Address ID is required');
  }

  const address = await repository.updateAddressRepository(id, data);
  if (!address) {
    throw new Error('Address not found');
  }
  return address;
}

export async function deleteAddressService(id) {
  if (!id) {
    throw new Error('Address ID is required');
  }

  const address = await repository.deleteAddressRepository(id);
  if (!address) {
    throw new Error('Address not found');
  }
  return address;
}

// ============= BILLING INFORMATION =============

export async function listBillingInfoService(filters = {}) {
  return await repository.listBillingInfoRepository(filters);
}

export async function getBillingInfoByIdService(id) {
  if (!id) {
    throw new Error('Billing information ID is required');
  }
  return await repository.getBillingInfoByIdRepository(id);
}

export async function createBillingInfoService(data) {
  return await repository.createBillingInfoRepository(data);
}

export async function updateBillingInfoService(id, data) {
  if (!id) {
    throw new Error('Billing information ID is required');
  }

  const billingInfo = await repository.updateBillingInfoRepository(id, data);
  if (!billingInfo) {
    throw new Error('Billing information not found');
  }
  return billingInfo;
}

export async function deleteBillingInfoService(id) {
  if (!id) {
    throw new Error('Billing information ID is required');
  }

  const billingInfo = await repository.deleteBillingInfoRepository(id);
  if (!billingInfo) {
    throw new Error('Billing information not found');
  }
  return billingInfo;
}

