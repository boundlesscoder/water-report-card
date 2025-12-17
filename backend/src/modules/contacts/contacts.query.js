// SQL queries for contacts module

export const CONTACT_QUERIES = {
  // Contacts
  LIST_CONTACTS: `
    SELECT 
      c.*,
      l.id as location_id,
      l.name as location_name,
      l.branch,
      l.location_type,
      l.status as location_status,
      l.region,
      l.service_zone,
      l.route_code,
      a.line1 as address_line1,
      a.line2 as address_line2,
      a.city,
      a.state,
      a.postal_code,
      a.country,
      a.latitude,
      a.longitude,
      a.pwsid,
      b.id as billing_id,
      b.name as billing_name,
      b.contact_name as billing_contact_name,
      b.email as billing_email,
      parent.contact_name as parent_contact_name
    FROM public.wrc_contacts c
    LEFT JOIN public.wrc_locations l ON l.contact_id = c.id
    LEFT JOIN public.wrc_addresses a ON a.id = l.address_id
    LEFT JOIN public.wrc_billing_information b ON b.id = c.billing_id
    LEFT JOIN public.wrc_contacts parent ON parent.id = c.parent_id
    WHERE 1=1
  `,
  
  GET_CONTACT_BY_ID: `
    SELECT 
      c.*,
      l.id as location_id,
      l.name as location_name,
      l.branch,
      l.location_type,
      l.status as location_status,
      l.region,
      l.service_zone,
      l.route_code,
      a.line1 as address_line1,
      a.line2 as address_line2,
      a.city,
      a.state,
      a.postal_code,
      a.country,
      a.latitude,
      a.longitude,
      a.pwsid,
      b.id as billing_id,
      b.name as billing_name,
      b.contact_name as billing_contact_name,
      b.email as billing_email,
      parent.contact_name as parent_contact_name
    FROM public.wrc_contacts c
    LEFT JOIN public.wrc_locations l ON l.contact_id = c.id
    LEFT JOIN public.wrc_addresses a ON a.id = l.address_id
    LEFT JOIN public.wrc_billing_information b ON b.id = c.billing_id
    LEFT JOIN public.wrc_contacts parent ON parent.id = c.parent_id
    WHERE c.id = $1
  `,
  
  CREATE_CONTACT: `
    INSERT INTO public.wrc_contacts (
      contact_id, contact_name, parent_id, location_id, billing_id,
      status, referral, lead_source, external_url,
      security_access_instructions, parking_requirements,
      main_phone_number, point_contact_primary, point_contact_secondary,
      is_cert_of_insurance_on_file
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15
    ) RETURNING *
  `,
  
  UPDATE_CONTACT: `
    UPDATE public.wrc_contacts
    SET 
      contact_id = COALESCE($2, contact_id),
      contact_name = COALESCE($3, contact_name),
      parent_id = $4,
      location_id = $5,
      billing_id = $6,
      status = COALESCE($7, status),
      referral = $8,
      lead_source = $9,
      external_url = $10,
      security_access_instructions = $11,
      parking_requirements = $12,
      main_phone_number = $13,
      point_contact_primary = $14,
      point_contact_secondary = $15,
      is_cert_of_insurance_on_file = COALESCE($16, is_cert_of_insurance_on_file),
      updated_at = now()
    WHERE id = $1
    RETURNING *
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
    LEFT JOIN public.wrc_contacts c ON c.id = l.contact_id
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
    LEFT JOIN public.wrc_contacts c ON c.id = l.contact_id
    LEFT JOIN public.wrc_addresses a ON a.id = l.address_id
    LEFT JOIN public.wrc_campuses campus ON campus.id = l.campus_id
    LEFT JOIN public.wrc_buildings building ON building.id = l.building_id
    LEFT JOIN public.wrc_billing_information b ON b.id = l.billing_id
    WHERE l.id = $1
  `,
  
  CREATE_LOCATION: `
    INSERT INTO public.wrc_locations (
      contact_id, campus_id, building_id, name, branch, location_type,
      status, address_id, shipping_address_id, cached_city, cached_state,
      cached_postal_code, region, service_zone, route_code, billing_id, geom
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17
    ) RETURNING *
  `,
  
  UPDATE_LOCATION: `
    UPDATE public.wrc_locations
    SET 
      contact_id = COALESCE($2, contact_id),
      campus_id = $3,
      building_id = $4,
      name = COALESCE($5, name),
      branch = $6,
      location_type = $7,
      status = COALESCE($8, status),
      address_id = $9,
      shipping_address_id = $10,
      cached_city = $11,
      cached_state = $12,
      cached_postal_code = $13,
      region = $14,
      service_zone = $15,
      route_code = $16,
      billing_id = $17,
      geom = $18,
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
      $1, $2, $3, $4, $5, $6, $7, $8, $9,
      CASE WHEN $7 IS NOT NULL AND $8 IS NOT NULL 
        THEN ST_SetSRID(ST_MakePoint($8, $7), 4326)::geography
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
      latitude = $8,
      longitude = $9,
      pwsid = $10,
      geom = CASE WHEN $8 IS NOT NULL AND $9 IS NOT NULL 
        THEN ST_SetSRID(ST_MakePoint($9, $8), 4326)::geography
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
    LEFT JOIN public.wrc_contacts c ON c.id = b.contact_id
    LEFT JOIN public.wrc_locations l ON l.id = b.location_id
    WHERE b.id = $1
  `,
  
  CREATE_BILLING_INFO: `
    INSERT INTO public.wrc_billing_information (
      contact_id, location_id, name, contact_type, department,
      contact_name, email, contact_note, address_id,
      contacts_sales_tax, discount_rate, hourly_labor_rate,
      is_default, is_active
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14
    ) RETURNING *
  `,
  
  UPDATE_BILLING_INFO: `
    UPDATE public.wrc_billing_information
    SET 
      contact_id = COALESCE($2, contact_id),
      location_id = $3,
      name = $4,
      contact_type = $5,
      department = $6,
      contact_name = $7,
      email = $8,
      contact_note = $9,
      address_id = $10,
      contacts_sales_tax = $11,
      discount_rate = $12,
      hourly_labor_rate = $13,
      is_default = COALESCE($14, is_default),
      is_active = COALESCE($15, is_active),
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

