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

  // Handle nested address/location/billing creation
  let locationId = data.location_id || null;
  let billingId = data.billing_id || null;

    // Create physical address if provided
    if (data.physical_address || data.city || data.state || data.zip) {
      const physicalAddress = await repository.createAddressRepository({
      line1: data.physical_address || null,
      line2: null,
      city: data.city || null,
      state: data.state || null,
      postal_code: data.zip || null,
      country: data.country || 'USA',
      latitude: data.latitude || null,
      longitude: data.longitude || null,
      pwsid: data.pwsid || null
    });
    
    // Create shipping address if provided
    let shippingAddressId = null;
    if (data.shipping_address || data.shipping_city || data.shipping_state || data.shipping_zip) {
      const shippingAddress = await repository.createAddressRepository({
        line1: data.shipping_address || null,
        line2: null,
        city: data.shipping_city || null,
        state: data.shipping_state || null,
        postal_code: data.shipping_zip || null,
        country: data.shipping_country || 'USA',
        latitude: null,
        longitude: null,
        pwsid: null
      });
      shippingAddressId = shippingAddress.id;
    }

    // Create location if location_name is provided
    if (data.location_name) {
      const location = await repository.createLocationRepository({
        name: data.location_name,
        address_id: physicalAddress.id,
        shipping_address_id: shippingAddressId,
        cached_city: data.city || null,
        cached_state: data.state || null,
        cached_postal_code: data.zip || null,
        region: data.region || null,
        service_zone: data.service_zone || null,
        route_code: data.route || null,
        status: 'active'
      });
      locationId = location.id;
    }
  }

  // Create billing address and billing info if provided
  if (data.billing_address || data.billing_city || data.billing_state || data.billing_zip || data.email || data.contact_type) {
    let billingAddressId = null;
    if (data.billing_address || data.billing_city || data.billing_state || data.billing_zip) {
      const billingAddress = await repository.createAddressRepository({
        line1: data.billing_address || null,
        line2: null,
        city: data.billing_city || null,
        state: data.billing_state || null,
        postal_code: data.billing_zip || null,
        country: data.billing_country || 'USA',
        latitude: null,
        longitude: null,
        pwsid: null
      });
      billingAddressId = billingAddress.id;
    }

    const billingInfo = await repository.createBillingInfoRepository({
      name: data.contact_name,
      contact_type: data.contact_type || null,
      email: data.email || null,
      address_id: billingAddressId,
      is_active: true
    });
    billingId = billingInfo.id;
  }

  // Create contact with location_id and billing_id
  const contactData = {
    ...data,
    location_id: locationId,
    billing_id: billingId,
    account_type: data.account_type && data.account_type.trim() !== '' ? data.account_type : null,
    account_status: data.account_status && data.account_status.trim() !== '' ? data.account_status : null
  };

  return await repository.createContactRepository(contactData);
}

export async function updateContactService(id, data) {
  if (!id) {
    throw new Error('Contact ID is required');
  }

  // Validate status if provided
  if (data.status && !Object.values(CONTACT_STATUS).includes(data.status)) {
    throw new Error(`Invalid status. Must be one of: ${Object.values(CONTACT_STATUS).join(', ')}`);
  }

  // Get existing contact to preserve location_id and billing_id
  const existingContact = await repository.getContactByIdRepository(id);
  if (!existingContact) {
    throw new Error('Contact not found');
  }

  let locationId = data.location_id || existingContact.location_id || null;
  let billingId = data.billing_id || existingContact.billing_id || null;

  // Update or create physical address if provided
  if (data.physical_address || data.city || data.state || data.zip) {
    let physicalAddressId = null;
    
    // If location exists, get its address_id
    if (existingContact.location_id) {
      const existingLocation = await repository.getLocationByIdRepository(existingContact.location_id);
      if (existingLocation?.address_id) {
        // Update existing address
        await repository.updateAddressRepository(existingLocation.address_id, {
          line1: data.physical_address || null,
          line2: null,
          city: data.city || null,
          state: data.state || null,
          postal_code: data.zip || null,
          country: data.country || 'USA',
          latitude: data.latitude || null,
          longitude: data.longitude || null,
          pwsid: data.pwsid || null
        });
        physicalAddressId = existingLocation.address_id;
      }
    }
    
    // Create new address if location doesn't exist or doesn't have address
    if (!physicalAddressId) {
      const physicalAddress = await repository.createAddressRepository({
        line1: data.physical_address || null,
        line2: null,
        city: data.city || null,
        state: data.state || null,
        postal_code: data.zip || null,
        country: data.country || 'USA',
        latitude: data.latitude || null,
        longitude: data.longitude || null,
        pwsid: data.pwsid || null
      });
      physicalAddressId = physicalAddress.id;
    }

    // Update or create shipping address if provided
    let shippingAddressId = null;
    if (data.shipping_address || data.shipping_city || data.shipping_state || data.shipping_zip) {
      if (existingContact.location_id) {
        const existingLocation = await repository.getLocationByIdRepository(existingContact.location_id);
        if (existingLocation?.shipping_address_id) {
          // Update existing shipping address
          await repository.updateAddressRepository(existingLocation.shipping_address_id, {
            line1: data.shipping_address || null,
            line2: null,
            city: data.shipping_city || null,
            state: data.shipping_state || null,
            postal_code: data.shipping_zip || null,
            country: data.shipping_country || 'USA',
            latitude: null,
            longitude: null,
            pwsid: null
          });
          shippingAddressId = existingLocation.shipping_address_id;
        }
      }
      
      if (!shippingAddressId) {
        const shippingAddress = await repository.createAddressRepository({
          line1: data.shipping_address || null,
          line2: null,
          city: data.shipping_city || null,
          state: data.shipping_state || null,
          postal_code: data.shipping_zip || null,
          country: data.shipping_country || 'USA',
          latitude: null,
          longitude: null,
          pwsid: null
        });
        shippingAddressId = shippingAddress.id;
      }
    }

    // Update or create location if location_name is provided
    if (data.location_name) {
      if (existingContact.location_id) {
        // Update existing location
        await repository.updateLocationRepository(existingContact.location_id, {
          name: data.location_name,
          address_id: physicalAddressId,
          shipping_address_id: shippingAddressId,
          cached_city: data.city || null,
          cached_state: data.state || null,
          cached_postal_code: data.zip || null,
          region: data.region || null,
          service_zone: data.service_zone || null,
          route_code: data.route || null,
          status: 'active'
        });
        locationId = existingContact.location_id;
      } else {
        // Create new location
        const location = await repository.createLocationRepository({
          name: data.location_name,
          address_id: physicalAddressId,
          shipping_address_id: shippingAddressId,
          cached_city: data.city || null,
          cached_state: data.state || null,
          cached_postal_code: data.zip || null,
          region: data.region || null,
          service_zone: data.service_zone || null,
          route_code: data.route || null,
          status: 'active'
        });
        locationId = location.id;
      }
    }
  }

  // Update or create billing address and billing info if provided
  if (data.billing_address || data.billing_city || data.billing_state || data.billing_zip || data.email || data.contact_type) {
    let billingAddressId = null;
    
    if (data.billing_address || data.billing_city || data.billing_state || data.billing_zip) {
      if (existingContact.billing_id) {
        const existingBilling = await repository.getBillingInfoByIdRepository(existingContact.billing_id);
        if (existingBilling?.address_id) {
          // Update existing billing address
          await repository.updateAddressRepository(existingBilling.address_id, {
            line1: data.billing_address || null,
            line2: null,
            city: data.billing_city || null,
            state: data.billing_state || null,
            postal_code: data.billing_zip || null,
            country: data.billing_country || 'USA',
            latitude: null,
            longitude: null,
            pwsid: null
          });
          billingAddressId = existingBilling.address_id;
        }
      }
      
      if (!billingAddressId) {
        const billingAddress = await repository.createAddressRepository({
          line1: data.billing_address || null,
          line2: null,
          city: data.billing_city || null,
          state: data.billing_state || null,
          postal_code: data.billing_zip || null,
          country: data.billing_country || 'USA',
          latitude: null,
          longitude: null,
          pwsid: null
        });
        billingAddressId = billingAddress.id;
      }
    }

    if (existingContact.billing_id) {
      // Get existing billing info to preserve address_id if not updating
      const existingBilling = await repository.getBillingInfoByIdRepository(existingContact.billing_id);
      const finalBillingAddressId = billingAddressId || existingBilling?.address_id || null;
      
      // Update existing billing info
      await repository.updateBillingInfoRepository(existingContact.billing_id, {
        name: data.contact_name || existingContact.name,
        contact_type: data.contact_type || null,
        email: data.email || null,
        address_id: finalBillingAddressId,
        is_active: true
      });
      billingId = existingContact.billing_id;
    } else {
      // Create new billing info
      const billingInfo = await repository.createBillingInfoRepository({
        name: data.contact_name || existingContact.name,
        contact_type: data.contact_type || null,
        email: data.email || null,
        address_id: billingAddressId,
        is_active: true
      });
      billingId = billingInfo.id;
    }
  }
  
  // Create contactData with account_type and account_status explicitly set
  const contactData = {
    ...data,
    location_id: locationId,
    billing_id: billingId,
    account_type: data.account_type,
    account_status: data.account_status
  };

  const contact = await repository.updateContactRepository(id, contactData);
  
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

