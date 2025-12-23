// SQL queries for contacts module

export const CONTACT_QUERIES = {
  // Contacts
  LIST_CONTACTS: `
    SELECT DISTINCT ON (c.id)
      c.id,
      c.contact_name as name,
      c.parent_id,
      c.main_phone_number as phone,
      c.category_description,
      c.account_type,
      c.account_status,
      c.status,
      -- Location fields
      l.id as location_id,
      l.name as location_name,
      l.region,
      l.cached_state as state,
      l.cached_postal_code as zip,
      l.cached_city as city,
      l.service_zone,
      l.route_code as route,
      -- Physical address (from location.address_id)
      a_physical.line1 as physical_address,
      a_physical.country,
      a_physical.pwsid,
      -- Shipping address (from location.shipping_address_id)
      a_shipping.line1 as shipping_address,
      a_shipping.city as shipping_city,
      a_shipping.state as shipping_state,
      a_shipping.postal_code as shipping_zip,
      a_shipping.country as shipping_country,
      -- Billing information
      b.id as billing_id,
      b.email,
      b.contact_type,
      c.status as contact_status,
      -- Billing address (from billing_information.address_id)
      a_billing.line1 as billing_address,
      a_billing.city as billing_city,
      a_billing.state as billing_state,
      a_billing.postal_code as billing_zip,
      a_billing.country as billing_country,
      parent.contact_name as parent_contact_name
      -- Note: is_liquos_account field not included - add if it exists in wrc_contacts table
    FROM public.wrc_contacts c
    LEFT JOIN public.wrc_locations l ON l.id = c.location_id AND l.status = 'active'
    LEFT JOIN public.wrc_addresses a_physical ON a_physical.id = l.address_id
    LEFT JOIN public.wrc_addresses a_shipping ON a_shipping.id = l.shipping_address_id
    LEFT JOIN public.wrc_billing_information b ON b.id = c.billing_id AND b.is_active = true
    LEFT JOIN public.wrc_addresses a_billing ON a_billing.id = b.address_id
    LEFT JOIN public.wrc_contacts parent ON parent.id = c.parent_id
    WHERE 1=1
    ORDER BY c.id, l.created_at ASC
  `,
  
  GET_CONTACT_BY_ID: `
    SELECT 
      c.id,
      c.contact_name as name,
      c.parent_id,
      c.main_phone_number as phone,
      c.category_description,
      c.account_type,
      c.account_status,
      c.status,
      -- Location fields
      l.id as location_id,
      l.name as location_name,
      l.region,
      l.cached_state as state,
      l.cached_postal_code as zip,
      l.cached_city as city,
      l.service_zone,
      l.route_code as route,
      -- Physical address (from location.address_id)
      a_physical.line1 as physical_address,
      a_physical.country,
      a_physical.pwsid,
      -- Shipping address (from location.shipping_address_id)
      a_shipping.line1 as shipping_address,
      a_shipping.city as shipping_city,
      a_shipping.state as shipping_state,
      a_shipping.postal_code as shipping_zip,
      a_shipping.country as shipping_country,
      -- Billing information
      b.id as billing_id,
      b.email,
      b.contact_type,
      c.status as contact_status,
      -- Billing address (from billing_information.address_id)
      a_billing.line1 as billing_address,
      a_billing.city as billing_city,
      a_billing.state as billing_state,
      a_billing.postal_code as billing_zip,
      a_billing.country as billing_country,
      parent.contact_name as parent_contact_name
    FROM public.wrc_contacts c
    LEFT JOIN public.wrc_locations l ON l.id = c.location_id AND l.status = 'active'
    LEFT JOIN public.wrc_addresses a_physical ON a_physical.id = l.address_id
    LEFT JOIN public.wrc_addresses a_shipping ON a_shipping.id = l.shipping_address_id
    LEFT JOIN public.wrc_billing_information b ON b.id = c.billing_id AND b.is_active = true
    LEFT JOIN public.wrc_addresses a_billing ON a_billing.id = b.address_id
    LEFT JOIN public.wrc_contacts parent ON parent.id = c.parent_id
    WHERE c.id = $1
    ORDER BY l.created_at ASC
    LIMIT 1
  `,
  
  CREATE_CONTACT: `
    INSERT INTO public.wrc_contacts (
      contact_id, contact_name, parent_id, location_id, billing_id,
      status, referral, lead_source, external_url,
      security_access_instructions, parking_requirements,
      main_phone_number, point_contact_primary, point_contact_secondary,
      is_cert_of_insurance_on_file, account_type, account_status
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17
    ) RETURNING *
  `,
  
  UPDATE_CONTACT: `
    UPDATE public.wrc_contacts
    SET 
      contact_id = COALESCE($2::varchar, contact_id),
      contact_name = COALESCE($3::varchar, contact_name),
      parent_id = $4::uuid,
      location_id = $5::uuid,
      billing_id = $6::uuid,
      status = COALESCE($7::varchar, status),
      referral = COALESCE($8::varchar, referral),
      lead_source = COALESCE($9::varchar, lead_source),
      external_url = COALESCE($10::varchar, external_url),
      security_access_instructions = COALESCE($11::varchar, security_access_instructions),
      parking_requirements = COALESCE($12::varchar, parking_requirements),
      main_phone_number = COALESCE($13::varchar, main_phone_number),
      point_contact_primary = COALESCE($14::varchar, point_contact_primary),
      point_contact_secondary = COALESCE($15::varchar, point_contact_secondary),
      is_cert_of_insurance_on_file = COALESCE($16::boolean, is_cert_of_insurance_on_file),
      account_type = COALESCE($17::varchar, account_type),
      account_status = COALESCE($18::varchar, account_status),
      updated_at = now()
    WHERE id = $1::uuid
    RETURNING *;
  `,
  
  DELETE_CONTACT: `
    DELETE FROM public.wrc_contacts WHERE id = $1 RETURNING *
  `,
  
  // Locations
  LIST_LOCATIONS: `
    SELECT 
      l.*,
      c.contact_name,
      c.contact_id,
      a.line1 as address_line1,
      a.line2 as address_line2,
      a.city,
      a.state,
      a.postal_code,
      a.country,
      a.latitude,
      a.longitude,
      a.pwsid,
      campus.campus_name,
      building.building_name,
      b.name as billing_name
    FROM public.wrc_locations l
    LEFT JOIN public.wrc_contacts c ON c.location_id = l.id
    LEFT JOIN public.wrc_addresses a ON a.id = l.address_id
    LEFT JOIN public.wrc_campuses campus ON campus.id = l.campus_id
    LEFT JOIN public.wrc_buildings building ON building.id = l.building_id
    LEFT JOIN public.wrc_billing_information b ON b.id = l.billing_id
    WHERE 1=1
  `,
  
  GET_LOCATION_BY_ID: `
    SELECT 
      l.*,
      c.contact_name,
      c.contact_id,
      a.line1 as address_line1,
      a.line2 as address_line2,
      a.city,
      a.state,
      a.postal_code,
      a.country,
      a.latitude,
      a.longitude,
      a.pwsid,
      campus.campus_name,
      building.building_name,
      b.name as billing_name
    FROM public.wrc_locations l
    LEFT JOIN public.wrc_contacts c ON c.location_id = l.id
    LEFT JOIN public.wrc_addresses a ON a.id = l.address_id
    LEFT JOIN public.wrc_campuses campus ON campus.id = l.campus_id
    LEFT JOIN public.wrc_buildings building ON building.id = l.building_id
    LEFT JOIN public.wrc_billing_information b ON b.id = l.billing_id
    WHERE l.id = $1
  `,
  
  CREATE_LOCATION: `
    INSERT INTO public.wrc_locations (
      campus_id, building_id, name, branch, location_type,
      status, address_id, shipping_address_id, cached_city, cached_state,
      cached_postal_code, region, service_zone, route_code, billing_id, geom
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16
    ) RETURNING *
  `,
  
  UPDATE_LOCATION: `
    UPDATE public.wrc_locations
    SET 
      campus_id = $2,
      building_id = $3,
      name = COALESCE($4, name),
      branch = $5,
      location_type = $6,
      status = COALESCE($7, status),
      address_id = $8,
      shipping_address_id = $9,
      cached_city = $10,
      cached_state = $11,
      cached_postal_code = $12,
      region = $13,
      service_zone = $14,
      route_code = $15,
      billing_id = $16,
      geom = $17,
      updated_at = now()
    WHERE id = $1
    RETURNING *
  `,
  
  DELETE_LOCATION: `
    DELETE FROM public.wrc_locations WHERE id = $1 RETURNING *
  `,
  
  // Addresses
  CREATE_ADDRESS: `
    INSERT INTO public.wrc_addresses (
      line1, line2, city, state, postal_code, country,
      latitude, longitude, pwsid, geom
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7::double precision, $8::double precision, $9,
      CASE WHEN $7 IS NOT NULL AND $8 IS NOT NULL 
        THEN ST_SetSRID(ST_MakePoint($8::double precision, $7::double precision), 4326)::geography
        ELSE NULL
      END
    ) RETURNING *
  `,
  
  UPDATE_ADDRESS: `
    UPDATE public.wrc_addresses
    SET 
      line1 = COALESCE($2, line1),
      line2 = $3,
      city = COALESCE($4, city),
      state = COALESCE($5, state),
      postal_code = COALESCE($6, postal_code),
      country = COALESCE($7, country),
      latitude = $8::double precision,
      longitude = $9::double precision,
      pwsid = $10,
      geom = CASE WHEN $8 IS NOT NULL AND $9 IS NOT NULL 
        THEN ST_SetSRID(ST_MakePoint($9::double precision, $8::double precision), 4326)::geography
        ELSE geom
      END,
      updated_at = now()
    WHERE id = $1
    RETURNING *
  `,
  
  DELETE_ADDRESS: `
    DELETE FROM public.wrc_addresses WHERE id = $1 RETURNING *
  `,
  
  // Billing Information
  LIST_BILLING_INFO: `
    SELECT 
      b.*,
      c.contact_name,
      l.name as location_name
    FROM public.wrc_billing_information b
    LEFT JOIN public.wrc_contacts c ON c.id = b.contact_id
    LEFT JOIN public.wrc_locations l ON l.id = b.location_id
    WHERE 1=1
  `,
  
  GET_BILLING_INFO_BY_ID: `
    SELECT 
      b.*,
      c.contact_name,
      l.name as location_name
    FROM public.wrc_billing_information b
    LEFT JOIN public.wrc_contacts c ON c.billing_id = b.id
    LEFT JOIN public.wrc_locations l ON l.id = c.location_id
    WHERE b.id = $1
  `,
  
  CREATE_BILLING_INFO: `
    INSERT INTO public.wrc_billing_information (
      name, contact_type, department,
      contact_name, email, contact_note, address_id,
      contacts_sales_tax, discount_rate, hourly_labor_rate,
      is_default, is_active
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12
    ) RETURNING *
  `,
  
  UPDATE_BILLING_INFO: `
    UPDATE public.wrc_billing_information
    SET 
      name = $2,
      contact_type = $3,
      department = $4,
      contact_name = $5,
      email = $6,
      contact_note = $7,
      address_id = $8,
      contacts_sales_tax = $9,
      discount_rate = $10,
      hourly_labor_rate = $11,
      is_default = COALESCE($12, is_default),
      is_active = COALESCE($13, is_active),
      updated_at = now()
    WHERE id = $1
    RETURNING *
  `,
  
  DELETE_BILLING_INFO: `
    DELETE FROM public.wrc_billing_information WHERE id = $1 RETURNING *
  `,
  
  // Buildings
  GET_BUILDING_BY_ID: `
    SELECT * FROM public.wrc_buildings WHERE id = $1
  `,
  
  CREATE_BUILDING: `
    INSERT INTO public.wrc_buildings (
      id, location_id, building_name, building_code, total_floors,
      year_built, building_type, square_footage, occupancy_count,
      water_system_type, primary_pwsid, secondary_pwsid, campus_id,
      building_number, water_district_id, building_manager_company,
      building_manager_email, building_manager_mobile, building_manager_title
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19
    ) RETURNING *
  `,
  
  UPDATE_BUILDING: `
    UPDATE public.wrc_buildings
    SET 
      location_id = $2,
      building_name = $3,
      building_code = $4,
      total_floors = $5,
      year_built = $6,
      building_type = $7,
      square_footage = $8,
      occupancy_count = $9,
      water_system_type = $10,
      primary_pwsid = $11,
      secondary_pwsid = $12,
      campus_id = $13,
      building_number = $14,
      water_district_id = $15,
      building_manager_company = $16,
      building_manager_email = $17,
      building_manager_mobile = $18,
      building_manager_title = $19,
      updated_at = now()
    WHERE id = $1
    RETURNING *
  `,
  
  DELETE_BUILDING: `
    DELETE FROM public.wrc_buildings WHERE id = $1 RETURNING *
  `,
  
  // Campuses
  GET_CAMPUS_BY_ID: `
    SELECT * FROM public.wrc_campuses WHERE id = $1
  `,
  
  CREATE_CAMPUS: `
    INSERT INTO public.wrc_campuses (
      id, account_id, campus_name, campus_code, campus_type,
      address_line1, address_line2, city, state, zip, country,
      lat, lon, campus_manager_id
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14
    ) RETURNING *
  `,
  
  UPDATE_CAMPUS: `
    UPDATE public.wrc_campuses
    SET 
      account_id = $2,
      campus_name = $3,
      campus_code = $4,
      campus_type = $5,
      address_line1 = $6,
      address_line2 = $7,
      city = $8,
      state = $9,
      zip = $10,
      country = $11,
      lat = $12,
      lon = $13,
      campus_manager_id = $14,
      updated_at = now()
    WHERE id = $1
    RETURNING *
  `,
  
  DELETE_CAMPUS: `
    DELETE FROM public.wrc_campuses WHERE id = $1 RETURNING *
  `
};

