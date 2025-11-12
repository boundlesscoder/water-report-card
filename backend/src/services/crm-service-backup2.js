// Updated CRM Service with all fields from schema
import db from '../config/database.js';

export async function getAccountsService(page = 1, pageSize = 10, search = '', status = '') {
  const pageSizeNumber = parseInt(pageSize);
  const pageNumber = parseInt(page);
  const offset = (pageNumber - 1) * pageSizeNumber;

  const whereClauses = [];
  const params = [];

  if (search) {
    params.push(`%${search}%`);
    whereClauses.push(`(a.name ILIKE $${params.length} OR a.account_number ILIKE $${params.length})`);
  }
  if (status) {
    params.push(status);
    whereClauses.push(`a.status = $${params.length}`);
  }

  const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

  const sql = `
    SELECT
      a.id,
      a.name,
      a.account_number,
      a.status,
      a.parent_account_id,
      a.tier1_id,
      a.tier2_id,
      a.tier3_id,
      a.created_at,
      a.updated_at,
      t1.code AS tier1_code,
      t1.name AS tier1_name,
      t2.code AS tier2_code,
      t2.name AS tier2_name,
      t3.code AS tier3_code,
      t3.name AS tier3_name,
      COALESCE(ah.location_count, 0) AS location_count,
      
      -- Contact Information
      a.contact_id,
      a.contact_name,
      a.contact_type,
      a.sub_contact_name,
      a.sub_contact_id,
      
      -- Billing Information
      a.billing_contact_name,
      a.billing_address_line1,
      a.billing_address_line2,
      a.billing_city,
      a.billing_state,
      a.billing_zip,
      a.billing_country,
      a.billing_department,
      a.billing_email,
      a.billing_contact_note,
      a.billing_type,
      a.billing_name,
      a.hourly_labor_rate,
      a.discount_rate,
      a.contacts_sales_tax,
      a.referral,
      a.lead_source,
      a.external_url,
      a.service_zone,
      
      -- Location Information (for accounts that act as locations)
      a.location_id,
      a.location_address_line1,
      a.location_address_line2,
      a.location_city,
      a.location_state,
      a.location_zip,
      a.location_region,
      a.location_campus,
      a.location_building_name,
      a.location_route,
      a.location_pwsid,
      a.location_phone_no,
      
      -- WiFi Information
      a.wifi_network_name,
      a.wifi_password,
      a.wifi_admin,
      
      -- Contact Details
      a.contact_1_email,
      a.architect_firm,
      a.fax_no,
      a.maintenance_profile,
      a.architect,
      a.electrical_contractor,
      a.mntc_con_start_date,
      a.mntc_con_end_date,
      a.elect_foreman,
      a.consultant,
      a.installation_date,
      a.consultant_cell,
      a.spelling,
      a.contractor,
      a.route,
      a.site_supervisor,
      a.configuration_type,
      a.supervisor_cell,
      a.site_phone,
      
      -- Employee Contact Information
      a.employees_contact_1,
      a.employees_contact_1_last_name,
      a.employees_contact_1_direct_line,
      a.employees_contact_1_cell_phone,
      a.employees_contact_1_email,
      a.contact_1,
      a.employees_contact_1_title,
      a.employees_key_person,
      a.employees_contact_notes,
      a.contact_1_title,
      a.contact_1_first_name,
      a.last_name,
      a.access_key,
      a.email_subscriber,
      a.contract_terms,
      a.custom_field_custom3,
      a.contact_1_direct_line,
      a.contact_1_email,
      a.contact_1_cell_phone,
      
      -- Contact 2 Information
      a.contact_2_name,
      a.contact_2_title,
      a.contact_2_direct_line,
      a.contact_2_email,
      a.contact_2_cell,
      
      -- Notes and Instructions
      a.general_notes,
      a.special_instructions,
      a.contact_1_notes,
      a.contact_2_notes
    FROM accounts a
    LEFT JOIN customer_tier1 t1 ON a.tier1_id = t1.id
    LEFT JOIN customer_tier2 t2 ON a.tier2_id = t2.id
    LEFT JOIN customer_tier3 t3 ON a.tier3_id = t3.id
    LEFT JOIN account_hierarchy_enhanced ah ON ah.account_id = a.id
    ${whereSql}
    ORDER BY a.name ASC
    LIMIT ${pageSizeNumber} OFFSET ${offset}
  `;

  const countSql = `
    SELECT COUNT(*) AS total
    FROM accounts a
    ${whereSql}
  `;

  const [rows, countResult] = await Promise.all([
    db.query(sql, params),
    db.query(countSql, params)
  ]);

  const total = parseInt(countResult.rows[0].total);
  const totalPages = Math.ceil(total / pageSizeNumber);

  return {
    accounts: rows.rows,
    pagination: {
      currentPage: pageNumber,
      totalPages,
      totalItems: total,
      itemsPerPage: pageSizeNumber,
      hasNextPage: pageNumber < totalPages,
      hasPrevPage: pageNumber > 1
    }
  };
}

export async function createAccountService(payload) {
  const {
    name, account_number: accountNumber, status, parent_account_id, tier1_id, tier2_id, tier3_id,
    // Contact Information
    contact_id, contact_name, contact_type, sub_contact_name, sub_contact_id,
    // Billing Information
    billing_contact_name, billing_address_line1, billing_address_line2, billing_city, billing_state, billing_zip,
    billing_country, billing_department, billing_email, billing_contact_note, billing_type, billing_name, hourly_labor_rate, discount_rate,
    contacts_sales_tax, referral, lead_source, external_url, service_zone,
    // Location Information
    location_id, location_address_line1, location_address_line2, location_city, location_state, location_zip,
    location_region, location_campus, location_building_name, location_route, location_pwsid, location_phone_no,
    // WiFi Information
    wifi_network_name, wifi_password, wifi_admin,
    // Contact Details
    contact_1_email, architect_firm, fax_no, maintenance_profile, architect, electrical_contractor,
    mntc_con_start_date, mntc_con_end_date, elect_foreman, consultant, installation_date, consultant_cell,
    spelling, contractor, route, site_supervisor, configuration_type, supervisor_cell, site_phone,
    // Employee Contact Information
    employees_contact_1, employees_contact_1_last_name, employees_contact_1_direct_line, employees_contact_1_cell_phone,
    employees_contact_1_email, contact_1, employees_contact_1_title, employees_key_person, employees_contact_notes,
    contact_1_title, contact_1_first_name, last_name, access_key, email_subscriber, contract_terms, custom_field_custom3,
    contact_1_direct_line, contact_1_cell_phone,
    // Contact 2 Information
    contact_2_name, contact_2_title, contact_2_direct_line, contact_2_email, contact_2_cell,
    // Notes and Instructions
    general_notes, special_instructions, contact_1_notes, contact_2_notes
  } = payload;

  const sql = `
    INSERT INTO accounts (
      name, account_number, status, parent_account_id, tier1_id, tier2_id, tier3_id,
      contact_id, contact_name, contact_type, sub_contact_name, sub_contact_id,
      billing_contact_name, billing_address_line1, billing_address_line2, billing_city, billing_state, billing_zip,
      billing_country, billing_department, billing_email, billing_contact_note, billing_type, billing_name, hourly_labor_rate, discount_rate,
      contacts_sales_tax, referral, lead_source, external_url, service_zone,
      location_id, location_address_line1, location_address_line2, location_city, location_state, location_zip,
      location_region, location_campus, location_building_name, location_route, location_pwsid, location_phone_no,
      wifi_network_name, wifi_password, wifi_admin,
      contact_1_email, architect_firm, maintenance_profile, architect, electrical_contractor,
      mntc_con_start_date, mntc_con_end_date, elect_foreman, consultant, installation_date, consultant_cell,
      spelling, contractor, route, site_supervisor, configuration_type, supervisor_cell, site_phone,
      employees_contact_1, employees_contact_1_last_name, employees_contact_1_direct_line, employees_contact_1_cell_phone,
      employees_contact_1_email, contact_1, employees_contact_1_title, employees_key_person, employees_contact_notes,
      contact_1_title, contact_1_first_name, last_name, access_key, email_subscriber, contract_terms, custom_field_custom3,
      contact_1_direct_line, contact_1_cell_phone,
      contact_2_name, contact_2_title, contact_2_direct_line, contact_2_email, contact_2_cell,
      general_notes, special_instructions, contact_1_notes, contact_2_notes
    )
    VALUES (
      $1, $2, COALESCE($3, 'active'), $4, $5, $6, $7,
      $8, $9, $10, $11, $12,
      $13, $14, $15, $16, $17, $18,
      $19, $20, $21, $22, $23, $24, $25, $26,
      $27, $28, $29, $30, $31,
      $32, $33, $34, $35, $36, $37,
      $38, $39, $40, $41, $42, $43,
      $44, $45, $46,
      $47, $48, $49, $50, $51,
      $52, $53, $54, $55, $56, $57,
      $58, $59, $60, $61, $62, $63, $64,
      $65, $66, $67, $68, $69,
      $70, $71, $72, $73, $74, $75, $76, $77, $78, $79,
      $80, $81, $82,
      $83, $84, $85, $86, $87,
      $88, $89, $90, $91
    )
    ON CONFLICT (account_number) DO UPDATE SET
      name = EXCLUDED.name,
      status = EXCLUDED.status,
      parent_account_id = EXCLUDED.parent_account_id,
      tier1_id = EXCLUDED.tier1_id,
      tier2_id = EXCLUDED.tier2_id,
      tier3_id = EXCLUDED.tier3_id,
      contact_id = EXCLUDED.contact_id,
      contact_name = EXCLUDED.contact_name,
      contact_type = EXCLUDED.contact_type,
      sub_contact_name = EXCLUDED.sub_contact_name,
      sub_contact_id = EXCLUDED.sub_contact_id,
      billing_contact_name = EXCLUDED.billing_contact_name,
      billing_address_line1 = EXCLUDED.billing_address_line1,
      billing_address_line2 = EXCLUDED.billing_address_line2,
      billing_city = EXCLUDED.billing_city,
      billing_state = EXCLUDED.billing_state,
      billing_zip = EXCLUDED.billing_zip,
      billing_country = EXCLUDED.billing_country,
      billing_department = EXCLUDED.billing_department,
      billing_email = EXCLUDED.billing_email,
      billing_contact_note = EXCLUDED.billing_contact_note,
      billing_type = EXCLUDED.billing_type,
      billing_name = EXCLUDED.billing_name,
      hourly_labor_rate = EXCLUDED.hourly_labor_rate,
      discount_rate = EXCLUDED.discount_rate,
      contacts_sales_tax = EXCLUDED.contacts_sales_tax,
      referral = EXCLUDED.referral,
      lead_source = EXCLUDED.lead_source,
      external_url = EXCLUDED.external_url,
      service_zone = EXCLUDED.service_zone,
      location_id = EXCLUDED.location_id,
      location_address_line1 = EXCLUDED.location_address_line1,
      location_address_line2 = EXCLUDED.location_address_line2,
      location_city = EXCLUDED.location_city,
      location_state = EXCLUDED.location_state,
      location_zip = EXCLUDED.location_zip,
      location_region = EXCLUDED.location_region,
      location_campus = EXCLUDED.location_campus,
      location_building_name = EXCLUDED.location_building_name,
      location_route = EXCLUDED.location_route,
      location_pwsid = EXCLUDED.location_pwsid,
      location_phone_no = EXCLUDED.location_phone_no,
      wifi_network_name = EXCLUDED.wifi_network_name,
      wifi_password = EXCLUDED.wifi_password,
      wifi_admin = EXCLUDED.wifi_admin,
      contact_1_email = EXCLUDED.contact_1_email,
      architect_firm = EXCLUDED.architect_firm,
      maintenance_profile = EXCLUDED.maintenance_profile,
      architect = EXCLUDED.architect,
      electrical_contractor = EXCLUDED.electrical_contractor,
      mntc_con_start_date = EXCLUDED.mntc_con_start_date,
      mntc_con_end_date = EXCLUDED.mntc_con_end_date,
      elect_foreman = EXCLUDED.elect_foreman,
      consultant = EXCLUDED.consultant,
      installation_date = EXCLUDED.installation_date,
      consultant_cell = EXCLUDED.consultant_cell,
      spelling = EXCLUDED.spelling,
      contractor = EXCLUDED.contractor,
      route = EXCLUDED.route,
      site_supervisor = EXCLUDED.site_supervisor,
      configuration_type = EXCLUDED.configuration_type,
      supervisor_cell = EXCLUDED.supervisor_cell,
      site_phone = EXCLUDED.site_phone,
      employees_contact_1 = EXCLUDED.employees_contact_1,
      employees_contact_1_last_name = EXCLUDED.employees_contact_1_last_name,
      employees_contact_1_direct_line = EXCLUDED.employees_contact_1_direct_line,
      employees_contact_1_cell_phone = EXCLUDED.employees_contact_1_cell_phone,
      employees_contact_1_email = EXCLUDED.employees_contact_1_email,
      contact_1 = EXCLUDED.contact_1,
      employees_contact_1_title = EXCLUDED.employees_contact_1_title,
      employees_key_person = EXCLUDED.employees_key_person,
      employees_contact_notes = EXCLUDED.employees_contact_notes,
      contact_1_title = EXCLUDED.contact_1_title,
      contact_1_first_name = EXCLUDED.contact_1_first_name,
      last_name = EXCLUDED.last_name,
      access_key = EXCLUDED.access_key,
      email_subscriber = EXCLUDED.email_subscriber,
      contract_terms = EXCLUDED.contract_terms,
      custom_field_custom3 = EXCLUDED.custom_field_custom3,
      contact_1_direct_line = EXCLUDED.contact_1_direct_line,
      contact_1_cell_phone = EXCLUDED.contact_1_cell_phone,
      contact_2_name = EXCLUDED.contact_2_name,
      contact_2_title = EXCLUDED.contact_2_title,
      contact_2_direct_line = EXCLUDED.contact_2_direct_line,
      contact_2_email = EXCLUDED.contact_2_email,
      contact_2_cell = EXCLUDED.contact_2_cell,
      general_notes = EXCLUDED.general_notes,
      special_instructions = EXCLUDED.special_instructions,
      contact_1_notes = EXCLUDED.contact_1_notes,
      contact_2_notes = EXCLUDED.contact_2_notes,
      updated_at = NOW()
    RETURNING *;
  `;

  const params = [
    name, accountNumber, status, parent_account_id, tier1_id, tier2_id, tier3_id,
    contact_id, contact_name, contact_type, sub_contact_name, sub_contact_id,
    billing_contact_name, billing_address_line1, billing_address_line2, billing_city, billing_state, billing_zip,
    billing_country, billing_department, billing_email, billing_contact_note, billing_type, billing_name, hourly_labor_rate, discount_rate,
    contacts_sales_tax, referral, lead_source, external_url, service_zone,
    location_id, location_address_line1, location_address_line2, location_city, location_state, location_zip,
    location_region, location_campus, location_building_name, location_route, location_pwsid, location_phone_no,
    wifi_network_name, wifi_password, wifi_admin,
    contact_1_email, architect_firm, maintenance_profile, architect, electrical_contractor,
    mntc_con_start_date, mntc_con_end_date, elect_foreman, consultant, installation_date, consultant_cell,
    spelling, contractor, route, site_supervisor, configuration_type, supervisor_cell, site_phone,
    employees_contact_1, employees_contact_1_last_name, employees_contact_1_direct_line, employees_contact_1_cell_phone,
    employees_contact_1_email, contact_1, employees_contact_1_title, employees_key_person, employees_contact_notes,
    contact_1_title, contact_1_first_name, last_name, access_key, email_subscriber, contract_terms, custom_field_custom3,
    contact_1_direct_line, contact_1_cell_phone,
    contact_2_name, contact_2_title, contact_2_direct_line, contact_2_email, contact_2_cell,
    general_notes, special_instructions, contact_1_notes, contact_2_notes
  ];

  const { rows } = await db.query(sql, params);
  return rows[0];
}

export async function getAccountService(id) {
  const sql = `
    SELECT
      a.id,
      a.name,
      a.account_number,
      a.status,
      a.parent_account_id,
      a.tier1_id,
      a.tier2_id,
      a.tier3_id,
      a.created_at,
      a.updated_at,
      t1.code AS tier1_code,
      t1.name AS tier1_name,
      t2.code AS tier2_code,
      t2.name AS tier2_name,
      t3.code AS tier3_code,
      t3.name AS tier3_name,
      COALESCE(ah.location_count, 0) AS location_count,
      
      -- Contact Information
      a.contact_id,
      a.contact_name,
      a.contact_type,
      a.sub_contact_name,
      a.sub_contact_id,
      
      -- Billing Information
      a.billing_contact_name,
      a.billing_address_line1,
      a.billing_address_line2,
      a.billing_city,
      a.billing_state,
      a.billing_zip,
      a.billing_country,
      a.billing_department,
      a.billing_email,
      a.billing_contact_note,
      a.billing_type,
      a.billing_name,
      a.hourly_labor_rate,
      a.discount_rate,
      a.contacts_sales_tax,
      a.referral,
      a.lead_source,
      a.external_url,
      a.service_zone,
      
      -- Location Information (for accounts that act as locations)
      a.location_id,
      a.location_address_line1,
      a.location_address_line2,
      a.location_city,
      a.location_state,
      a.location_zip,
      a.location_region,
      a.location_campus,
      a.location_building_name,
      a.location_route,
      a.location_pwsid,
      a.location_phone_no,
      
      -- WiFi Information
      a.wifi_network_name,
      a.wifi_password,
      a.wifi_admin,
      
      -- Contact Details
      a.contact_1_email,
      a.architect_firm,
      a.fax_no,
      a.maintenance_profile,
      a.architect,
      a.electrical_contractor,
      a.mntc_con_start_date,
      a.mntc_con_end_date,
      a.elect_foreman,
      a.consultant,
      a.installation_date,
      a.consultant_cell,
      a.spelling,
      a.contractor,
      a.route,
      a.site_supervisor,
      a.configuration_type,
      a.supervisor_cell,
      a.site_phone,
      
      -- Employee Contact Information
      a.employees_contact_1,
      a.employees_contact_1_last_name,
      a.employees_contact_1_direct_line,
      a.employees_contact_1_cell_phone,
      a.employees_contact_1_email,
      a.contact_1,
      a.employees_contact_1_title,
      a.employees_key_person,
      a.employees_contact_notes,
      a.contact_1_title,
      a.contact_1_first_name,
      a.last_name,
      a.access_key,
      a.email_subscriber,
      a.contract_terms,
      a.custom_field_custom3,
      a.contact_1_direct_line,
      a.contact_1_email,
      a.contact_1_cell_phone,
      
      -- Contact 2 Information
      a.contact_2_name,
      a.contact_2_title,
      a.contact_2_direct_line,
      a.contact_2_email,
      a.contact_2_cell,
      
      -- Notes and Instructions
      a.general_notes,
      a.special_instructions,
      a.contact_1_notes,
      a.contact_2_notes
    FROM accounts a
    LEFT JOIN customer_tier1 t1 ON a.tier1_id = t1.id
    LEFT JOIN customer_tier2 t2 ON a.tier2_id = t2.id
    LEFT JOIN customer_tier3 t3 ON a.tier3_id = t3.id
    LEFT JOIN account_hierarchy_enhanced ah ON ah.account_id = a.id
    WHERE a.id = $1
  `;

  const { rows } = await db.query(sql, [id]);
  return rows[0] || null;
}

export async function updateAccountService(id, payload) {
  const {
    name, account_number: accountNumber, status, parent_account_id, tier1_id, tier2_id, tier3_id,
    // Contact Information
    contact_id, contact_name, contact_type, sub_contact_name, sub_contact_id,
    // Billing Information
    billing_contact_name, billing_address_line1, billing_address_line2, billing_city, billing_state, billing_zip,
    billing_country, billing_department, billing_email, billing_contact_note, billing_type, billing_name, hourly_labor_rate, discount_rate,
    contacts_sales_tax, referral, lead_source, external_url, service_zone,
    // Location Information
    location_id, location_address_line1, location_address_line2, location_city, location_state, location_zip,
    location_region, location_campus, location_building_name, location_route, location_pwsid, location_phone_no,
    // WiFi Information
    wifi_network_name, wifi_password, wifi_admin,
    // Contact Details
    contact_1_email, architect_firm, fax_no, maintenance_profile, architect, electrical_contractor,
    mntc_con_start_date, mntc_con_end_date, elect_foreman, consultant, installation_date, consultant_cell,
    spelling, contractor, route, site_supervisor, configuration_type, supervisor_cell, site_phone,
    // Employee Contact Information
    employees_contact_1, employees_contact_1_last_name, employees_contact_1_direct_line, employees_contact_1_cell_phone,
    employees_contact_1_email, contact_1, employees_contact_1_title, employees_key_person, employees_contact_notes,
    contact_1_title, contact_1_first_name, last_name, access_key, email_subscriber, contract_terms, custom_field_custom3,
    contact_1_direct_line, contact_1_cell_phone,
    // Contact 2 Information
    contact_2_name, contact_2_title, contact_2_direct_line, contact_2_email, contact_2_cell,
    // Notes and Instructions
    general_notes, special_instructions, contact_1_notes, contact_2_notes
  } = payload;

  const sql = `
    UPDATE accounts SET
      name = $2,
      account_number = $3,
      status = $4,
      parent_account_id = $5,
      tier1_id = $6,
      tier2_id = $7,
      tier3_id = $8,
      contact_id = $9,
      contact_name = $10,
      contact_type = $11,
      sub_contact_name = $12,
      sub_contact_id = $13,
      billing_contact_name = $14,
      billing_address_line1 = $15,
      billing_address_line2 = $16,
      billing_city = $17,
      billing_state = $18,
      billing_zip = $19,
      billing_country = $20,
      billing_department = $21,
      billing_email = $22,
      billing_contact_note = $23,
      billing_type = $24,
      billing_name = $25,
      hourly_labor_rate = $26,
      discount_rate = $27,
      contacts_sales_tax = $28,
      referral = $29,
      lead_source = $30,
      external_url = $31,
      service_zone = $32,
      location_id = $33,
      location_address_line1 = $34,
      location_address_line2 = $35,
      location_city = $36,
      location_state = $37,
      location_zip = $38,
      location_region = $39,
      location_campus = $40,
      location_building_name = $41,
      location_route = $42,
      location_pwsid = $43,
      location_phone_no = $44,
      wifi_network_name = $45,
      wifi_password = $46,
      wifi_admin = $47,
      contact_1_email = $48,
      architect_firm = $49,
      maintenance_profile = $50,
      architect = $51,
      electrical_contractor = $52,
      mntc_con_start_date = $53,
      mntc_con_end_date = $54,
      elect_foreman = $55,
      consultant = $56,
      installation_date = $57,
      consultant_cell = $58,
      spelling = $59,
      contractor = $60,
      route = $61,
      site_supervisor = $62,
      configuration_type = $63,
      supervisor_cell = $64,
      site_phone = $65,
      employees_contact_1 = $66,
      employees_contact_1_last_name = $67,
      employees_contact_1_direct_line = $68,
      employees_contact_1_cell_phone = $69,
      employees_contact_1_email = $70,
      contact_1 = $71,
      employees_contact_1_title = $72,
      employees_key_person = $73,
      employees_contact_notes = $74,
      contact_1_title = $75,
      contact_1_first_name = $76,
      last_name = $77,
      access_key = $78,
      email_subscriber = $79,
      contract_terms = $80,
      custom_field_custom3 = $81,
      contact_1_direct_line = $82,
      contact_1_cell_phone = $83,
      contact_2_name = $84,
      contact_2_title = $85,
      contact_2_direct_line = $86,
      contact_2_email = $87,
      contact_2_cell = $88,
      general_notes = $89,
      special_instructions = $90,
      contact_1_notes = $91,
      contact_2_notes = $92,
      updated_at = NOW()
    WHERE id = $1
    RETURNING *;
  `;

  const params = [
    id, name, accountNumber, status, parent_account_id, tier1_id, tier2_id, tier3_id,
    contact_id, contact_name, contact_type, sub_contact_name, sub_contact_id,
    billing_contact_name, billing_address_line1, billing_address_line2, billing_city, billing_state, billing_zip,
    billing_country, billing_department, billing_email, billing_contact_note, billing_type, billing_name, hourly_labor_rate, discount_rate,
    contacts_sales_tax, referral, lead_source, external_url, service_zone,
    location_id, location_address_line1, location_address_line2, location_city, location_state, location_zip,
    location_region, location_campus, location_building_name, location_route, location_pwsid, location_phone_no,
    wifi_network_name, wifi_password, wifi_admin,
    contact_1_email, architect_firm, maintenance_profile, architect, electrical_contractor,
    mntc_con_start_date, mntc_con_end_date, elect_foreman, consultant, installation_date, consultant_cell,
    spelling, contractor, route, site_supervisor, configuration_type, supervisor_cell, site_phone,
    employees_contact_1, employees_contact_1_last_name, employees_contact_1_direct_line, employees_contact_1_cell_phone,
    employees_contact_1_email, contact_1, employees_contact_1_title, employees_key_person, employees_contact_notes,
    contact_1_title, contact_1_first_name, last_name, access_key, email_subscriber, contract_terms, custom_field_custom3,
    contact_1_direct_line, contact_1_cell_phone,
    contact_2_name, contact_2_title, contact_2_direct_line, contact_2_email, contact_2_cell,
    general_notes, special_instructions, contact_1_notes, contact_2_notes
  ];

  const { rows } = await db.query(sql, params);
  return rows[0] || null;
}

export async function deleteAccountService(id) {
  const sql = `DELETE FROM accounts WHERE id = $1 RETURNING *;`;
  const { rows } = await db.query(sql, [id]);
  return rows[0] || null;
}

// Get customer tiers
export async function getCustomerTiersService() {
  const sql = `
    SELECT 
      t1.id as tier1_id,
      t1.code as tier1_code,
      t1.name as tier1_name,
      t2.id as tier2_id,
      t2.code as tier2_code,
      t2.name as tier2_name,
      t3.id as tier3_id,
      t3.code as tier3_code,
      t3.name as tier3_name
    FROM customer_tier1 t1
    LEFT JOIN customer_tier2 t2 ON t1.id = t2.tier1_id
    LEFT JOIN customer_tier3 t3 ON t2.id = t3.tier2_id
    ORDER BY t1.name, t2.name, t3.name
  `;
  
  const { rows } = await db.query(sql);
  return rows;
}
