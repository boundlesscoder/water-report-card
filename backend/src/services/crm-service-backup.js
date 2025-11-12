import { db } from '../config/db.js';

// ===================== ACCOUNTS =====================
export async function listAccountsService(filters = {}) {
  const {
    search,
    status,
    tier1_id: tier1Id,
    tier2_id: tier2Id,
    tier3_id: tier3Id,
    page = 1,
    pageSize = 25
  } = filters;

  const params = [];
  const whereClauses = [];

  if (search) {
    params.push(`%${search}%`);
    whereClauses.push(`(a.name ILIKE $${params.length} OR a.account_number ILIKE $${params.length})`);
  }
  if (status) {
    params.push(status);
    whereClauses.push(`a.status = $${params.length}`);
  }
  if (tier1Id) {
    params.push(tier1Id);
    whereClauses.push(`a.tier1_id = $${params.length}`);
  }
  if (tier2Id) {
    params.push(tier2Id);
    whereClauses.push(`a.tier2_id = $${params.length}`);
  }
  if (tier3Id) {
    params.push(tier3Id);
    whereClauses.push(`a.tier3_id = $${params.length}`);
  }

  const whereSql = whereClauses.length ? `WHERE ${whereClauses.join(' AND ')}` : '';
  const pageNumber = Math.max(1, parseInt(page, 10) || 1);
  const pageSizeNumber = Math.min(100, Math.max(1, parseInt(pageSize, 10) || 25));
  const offset = (pageNumber - 1) * pageSizeNumber;

  const listSql = `
    SELECT
      a.id,
      a.name,
      a.account_number,
      a.status,
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

  const [listResult, countResult] = await Promise.all([
    db.query(listSql, params),
    db.query(countSql, params)
  ]);

  return {
    items: listResult.rows,
    total: parseInt(countResult.rows[0]?.total || '0', 10),
    page: pageNumber,
    pageSize: pageSizeNumber
  };
}

export async function createAccountService(payload) {
  const {
    name, account_number: accountNumber, status, parent_account_id, tier1_id, tier2_id, tier3_id,
    // Contact Information
    contact_id, contact_name, contact_type, sub_contact_name, sub_contact_id,
    // Billing Information
    billing_contact_name, billing_address_line1, billing_address_line2, billing_city, billing_state, billing_zip,
    billing_email, billing_contact_note, billing_type, billing_name, hourly_labor_rate, discount_rate,
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
    contact_1_direct_line, contact_1_email2, contact_1_cell_phone,
    // Contact 2 Information
    contact_2_name, contact_2_title, contact_2_direct_line, contact_2_email, contact_2_cell,
    // Notes and Instructions
    general_notes, special_instructions, contact_1_notes, contact_2_notes
  } = payload;

  const sql = `
    INSERT INTO accounts (
      name, account_number, status, tier1_id, tier2_id, tier3_id,
      contact_id, contact_name, contact_type, sub_contact_name, sub_contact_id,
      billing_contact_name, billing_address_line1, billing_address_line2, billing_city, billing_state, billing_zip,
      billing_email, billing_contact_note, billing_type, billing_name, hourly_labor_rate, discount_rate,
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
      $1, $2, COALESCE($3, 'active'), $4, $5, $6,
      $7, $8, $9, $10, $11,
      $12, $13, $14, $15, $16, $17,
      $18, $19, $20, $21, $22, $23,
      $24, $25, $26, $27, $28,
      $29, $30, $31, $32, $33, $34,
      $35, $36, $37, $38, $39, $40,
      $41, $42, $43,
      $44, $45, $46, $47, $48, $49,
      $50, $51, $52, $53, $54, $55,
      $56, $57, $58, $59, $60, $61, $62,
      $63, $64, $65, $66,
      $67, $68, $69, $70, $71,
      $72, $73, $74, $75, $76, $77, $78,
      $79, $80, $81,
      $82, $83, $84, $85, $86,
      $87, $88, $89, $90
    )
    ON CONFLICT (account_number) DO UPDATE SET
      name = EXCLUDED.name,
      status = EXCLUDED.status,
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
      fax_no = EXCLUDED.fax_no,
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
      contact_1_email = EXCLUDED.contact_1_email,
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
    RETURNING *
  `;
  
  const params = [
    name?.trim(), accountNumber?.trim() || null, status || null, tier1_id || null, tier2_id || null, tier3_id || null,
    contact_id || null, contact_name?.trim() || null, contact_type?.trim() || null, sub_contact_name?.trim() || null, sub_contact_id || null,
    billing_contact_name?.trim() || null, billing_address_line1?.trim() || null, billing_address_line2?.trim() || null, billing_city?.trim() || null, billing_state?.trim() || null, billing_zip?.trim() || null,
    billing_email?.trim() || null, billing_contact_note?.trim() || null, billing_type?.trim() || null, billing_name?.trim() || null, hourly_labor_rate || null, discount_rate || null,
    contacts_sales_tax || null, referral?.trim() || null, lead_source?.trim() || null, external_url?.trim() || null, service_zone?.trim() || null,
    location_id || null, location_address_line1?.trim() || null, location_address_line2?.trim() || null, location_city?.trim() || null, location_state?.trim() || null, location_zip?.trim() || null,
    location_region?.trim() || null, location_campus?.trim() || null, location_building_name?.trim() || null, location_route?.trim() || null, location_pwsid?.trim() || null, location_phone_no?.trim() || null,
    wifi_network_name?.trim() || null, wifi_password?.trim() || null, wifi_admin?.trim() || null,
    contact_1_email?.trim() || null, architect_firm?.trim() || null, maintenance_profile?.trim() || null, architect?.trim() || null, electrical_contractor?.trim() || null,
    mntc_con_start_date || null, mntc_con_end_date || null, elect_foreman?.trim() || null, consultant?.trim() || null, installation_date || null, consultant_cell?.trim() || null,
    spelling?.trim() || null, contractor?.trim() || null, route?.trim() || null, site_supervisor?.trim() || null, configuration_type?.trim() || null, supervisor_cell?.trim() || null, site_phone?.trim() || null,
    employees_contact_1?.trim() || null, employees_contact_1_last_name?.trim() || null, employees_contact_1_direct_line?.trim() || null, employees_contact_1_cell_phone?.trim() || null,
    employees_contact_1_email?.trim() || null, contact_1?.trim() || null, employees_contact_1_title?.trim() || null, employees_key_person || null, employees_contact_notes?.trim() || null,
    contact_1_title?.trim() || null, contact_1_first_name?.trim() || null, last_name?.trim() || null, access_key?.trim() || null, email_subscriber || null, contract_terms?.trim() || null, custom_field_custom3?.trim() || null,
    contact_1_direct_line?.trim() || null, contact_1_cell_phone?.trim() || null,
    contact_2_name?.trim() || null, contact_2_title?.trim() || null, contact_2_direct_line?.trim() || null, contact_2_email?.trim() || null, contact_2_cell?.trim() || null,
    general_notes?.trim() || null, special_instructions?.trim() || null, contact_1_notes?.trim() || null, contact_2_notes?.trim() || null
  ];
  
  const { rows } = await db.query(sql, params);
  return rows[0];
}

export async function updateAccountService(id, payload) {
  const {
    name, account_number: accountNumber, status, tier1_id, tier2_id, tier3_id,
    // Contact Information
    contact_id, contact_name, contact_type, sub_contact_name, sub_contact_id,
    // Billing Information
    billing_contact_name, billing_address_line1, billing_address_line2, billing_city, billing_state, billing_zip,
    billing_email, billing_contact_note, billing_type, billing_name, hourly_labor_rate, discount_rate,
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
    contact_1_direct_line, contact_1_email2, contact_1_cell_phone,
    // Contact 2 Information
    contact_2_name, contact_2_title, contact_2_direct_line, contact_2_email, contact_2_cell,
    // Notes and Instructions
    general_notes, special_instructions, contact_1_notes, contact_2_notes
  } = payload;

  const sql = `
    UPDATE accounts
    SET
      name = COALESCE($2, name),
      account_number = COALESCE($3, account_number),
      status = COALESCE($4, status),
      tier1_id = COALESCE($5, tier1_id),
      tier2_id = COALESCE($6, tier2_id),
      tier3_id = COALESCE($7, tier3_id),
      contact_id = COALESCE($8, contact_id),
      contact_name = COALESCE($9, contact_name),
      contact_type = COALESCE($10, contact_type),
      sub_contact_name = COALESCE($11, sub_contact_name),
      sub_contact_id = COALESCE($12, sub_contact_id),
      billing_contact_name = COALESCE($13, billing_contact_name),
      billing_address_line1 = COALESCE($14, billing_address_line1),
      billing_address_line2 = COALESCE($15, billing_address_line2),
      billing_city = COALESCE($16, billing_city),
      billing_state = COALESCE($17, billing_state),
      billing_zip = COALESCE($18, billing_zip),
      billing_email = COALESCE($19, billing_email),
      billing_contact_note = COALESCE($20, billing_contact_note),
      billing_type = COALESCE($21, billing_type),
      billing_name = COALESCE($22, billing_name),
      hourly_labor_rate = COALESCE($23, hourly_labor_rate),
      discount_rate = COALESCE($24, discount_rate),
      contacts_sales_tax = COALESCE($25, contacts_sales_tax),
      referral = COALESCE($26, referral),
      lead_source = COALESCE($27, lead_source),
      external_url = COALESCE($28, external_url),
      service_zone = COALESCE($29, service_zone),
      location_id = COALESCE($30, location_id),
      location_address_line1 = COALESCE($31, location_address_line1),
      location_address_line2 = COALESCE($32, location_address_line2),
      location_city = COALESCE($33, location_city),
      location_state = COALESCE($34, location_state),
      location_zip = COALESCE($35, location_zip),
      location_region = COALESCE($36, location_region),
      location_campus = COALESCE($37, location_campus),
      location_building_name = COALESCE($38, location_building_name),
      location_route = COALESCE($39, location_route),
      location_pwsid = COALESCE($40, location_pwsid),
      location_phone_no = COALESCE($41, location_phone_no),
      wifi_network_name = COALESCE($42, wifi_network_name),
      wifi_password = COALESCE($43, wifi_password),
      wifi_admin = COALESCE($44, wifi_admin),
      contact_1_email = COALESCE($45, contact_1_email),
      architect_firm = COALESCE($46, architect_firm),
      fax_no = COALESCE($47, fax_no),
      maintenance_profile = COALESCE($48, maintenance_profile),
      architect = COALESCE($49, architect),
      electrical_contractor = COALESCE($50, electrical_contractor),
      mntc_con_start_date = COALESCE($51, mntc_con_start_date),
      mntc_con_end_date = COALESCE($52, mntc_con_end_date),
      elect_foreman = COALESCE($53, elect_foreman),
      consultant = COALESCE($54, consultant),
      installation_date = COALESCE($55, installation_date),
      consultant_cell = COALESCE($56, consultant_cell),
      spelling = COALESCE($57, spelling),
      contractor = COALESCE($58, contractor),
      route = COALESCE($59, route),
      site_supervisor = COALESCE($60, site_supervisor),
      configuration_type = COALESCE($61, configuration_type),
      supervisor_cell = COALESCE($62, supervisor_cell),
      site_phone = COALESCE($63, site_phone),
      employees_contact_1 = COALESCE($64, employees_contact_1),
      employees_contact_1_last_name = COALESCE($65, employees_contact_1_last_name),
      employees_contact_1_direct_line = COALESCE($66, employees_contact_1_direct_line),
      employees_contact_1_cell_phone = COALESCE($67, employees_contact_1_cell_phone),
      employees_contact_1_email = COALESCE($68, employees_contact_1_email),
      contact_1 = COALESCE($69, contact_1),
      employees_contact_1_title = COALESCE($70, employees_contact_1_title),
      employees_key_person = COALESCE($71, employees_key_person),
      employees_contact_notes = COALESCE($72, employees_contact_notes),
      contact_1_title = COALESCE($73, contact_1_title),
      contact_1_first_name = COALESCE($74, contact_1_first_name),
      last_name = COALESCE($75, last_name),
      access_key = COALESCE($76, access_key),
      email_subscriber = COALESCE($77, email_subscriber),
      contract_terms = COALESCE($78, contract_terms),
      custom_field_custom3 = COALESCE($79, custom_field_custom3),
      contact_1_direct_line = COALESCE($80, contact_1_direct_line),
      contact_1_email = COALESCE($81, contact_1_email),
      contact_1_cell_phone = COALESCE($82, contact_1_cell_phone),
      contact_2_name = COALESCE($83, contact_2_name),
      contact_2_title = COALESCE($84, contact_2_title),
      contact_2_direct_line = COALESCE($85, contact_2_direct_line),
      contact_2_email = COALESCE($86, contact_2_email),
      contact_2_cell = COALESCE($87, contact_2_cell),
      general_notes = COALESCE($88, general_notes),
      special_instructions = COALESCE($89, special_instructions),
      contact_1_notes = COALESCE($90, contact_1_notes),
      contact_2_notes = COALESCE($91, contact_2_notes),
      updated_at = NOW()
    WHERE id = $1
    RETURNING *
  `;
  
  const params = [
    id,
    name?.trim() || null, accountNumber?.trim() || null, status || null, tier1_id || null, tier2_id || null, tier3_id || null,
    contact_id || null, contact_name?.trim() || null, contact_type?.trim() || null, sub_contact_name?.trim() || null, sub_contact_id || null,
    billing_contact_name?.trim() || null, billing_address_line1?.trim() || null, billing_address_line2?.trim() || null, billing_city?.trim() || null, billing_state?.trim() || null, billing_zip?.trim() || null,
    billing_email?.trim() || null, billing_contact_note?.trim() || null, billing_type?.trim() || null, billing_name?.trim() || null, hourly_labor_rate || null, discount_rate || null,
    contacts_sales_tax || null, referral?.trim() || null, lead_source?.trim() || null, external_url?.trim() || null, service_zone?.trim() || null,
    location_id || null, location_address_line1?.trim() || null, location_address_line2?.trim() || null, location_city?.trim() || null, location_state?.trim() || null, location_zip?.trim() || null,
    location_region?.trim() || null, location_campus?.trim() || null, location_building_name?.trim() || null, location_route?.trim() || null, location_pwsid?.trim() || null, location_phone_no?.trim() || null,
    wifi_network_name?.trim() || null, wifi_password?.trim() || null, wifi_admin?.trim() || null,
    contact_1_email?.trim() || null, architect_firm?.trim() || null, maintenance_profile?.trim() || null, architect?.trim() || null, electrical_contractor?.trim() || null,
    mntc_con_start_date || null, mntc_con_end_date || null, elect_foreman?.trim() || null, consultant?.trim() || null, installation_date || null, consultant_cell?.trim() || null,
    spelling?.trim() || null, contractor?.trim() || null, route?.trim() || null, site_supervisor?.trim() || null, configuration_type?.trim() || null, supervisor_cell?.trim() || null, site_phone?.trim() || null,
    employees_contact_1?.trim() || null, employees_contact_1_last_name?.trim() || null, employees_contact_1_direct_line?.trim() || null, employees_contact_1_cell_phone?.trim() || null,
    employees_contact_1_email?.trim() || null, contact_1?.trim() || null, employees_contact_1_title?.trim() || null, employees_key_person || null, employees_contact_notes?.trim() || null,
    contact_1_title?.trim() || null, contact_1_first_name?.trim() || null, last_name?.trim() || null, access_key?.trim() || null, email_subscriber || null, contract_terms?.trim() || null, custom_field_custom3?.trim() || null,
    contact_1_direct_line?.trim() || null, contact_1_cell_phone?.trim() || null,
    contact_2_name?.trim() || null, contact_2_title?.trim() || null, contact_2_direct_line?.trim() || null, contact_2_email?.trim() || null, contact_2_cell?.trim() || null,
    general_notes?.trim() || null, special_instructions?.trim() || null, contact_1_notes?.trim() || null, contact_2_notes?.trim() || null
  ];
  
  const { rows } = await db.query(sql, params);
  return rows[0] || null;
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
    WHERE a.id = $1
  `;
  
  const result = await db.query(sql, [id]);
  return result.rows[0] || null;
}

export async function deleteAccountService(id) {
  await db.query('DELETE FROM accounts WHERE id = $1', [id]);
}

// ===================== TIERS =====================
export async function listTier1Service() {
  const { rows } = await db.query('SELECT id, code, name, description FROM customer_tier1 ORDER BY name');
  return rows;
}
export async function listTier2Service({ tier1_id } = {}) {
  const params = [];
  let where = '';
  if (tier1_id) {
    params.push(tier1_id);
    where = 'WHERE tier1_id = $1';
  }
  const { rows } = await db.query(`SELECT id, tier1_id, code, name, description FROM customer_tier2 ${where} ORDER BY name`, params);
  return rows;
}
export async function listTier3Service({ tier2_id } = {}) {
  const params = [];
  let where = '';
  if (tier2_id) {
    params.push(tier2_id);
    where = 'WHERE tier2_id = $1';
  }
  const { rows } = await db.query(`SELECT id, tier2_id, code, name, description FROM customer_tier3 ${where} ORDER BY name`, params);
  return rows;
}

// ===================== LOCATIONS & ADDRESSES =====================
export async function listLocationsService(filters = {}) {
  const { account_id, search, page = 1, pageSize = 25 } = filters;
  const params = [];
  const whereClauses = [];
  if (account_id) {
    params.push(account_id);
    whereClauses.push(`l.account_id = $${params.length}`);
  }
  if (search) {
    params.push(`%${search}%`);
    whereClauses.push(`(l.name ILIKE $${params.length} OR addr.city ILIKE $${params.length} OR addr.state ILIKE $${params.length})`);
  }
  const whereSql = whereClauses.length ? `WHERE ${whereClauses.join(' AND ')}` : '';
  const pageNumber = Math.max(1, parseInt(page, 10) || 1);
  const pageSizeNumber = Math.min(100, Math.max(1, parseInt(pageSize, 10) || 25));
  const offset = (pageNumber - 1) * pageSizeNumber;
  const listSql = `
    SELECT
      l.id,
      l.account_id,
      a.name AS account_name,
      l.name,
      l.location_type,
      l.region,
      l.route_code,
      l.status,
      l.created_at,
      l.updated_at,
      addr.id AS address_id,
      addr.line1, addr.line2, addr.city, addr.state, addr.postal_code, addr.country
    FROM locations l
    JOIN accounts a ON l.account_id = a.id
    LEFT JOIN addresses addr ON l.address_id = addr.id
    ${whereSql}
    ORDER BY a.name ASC, l.name ASC
    LIMIT ${pageSizeNumber} OFFSET ${offset}
  `;
  const countSql = `SELECT COUNT(*) AS total FROM locations l ${whereSql}`;
  const [listResult, countResult] = await Promise.all([
    db.query(listSql, params),
    db.query(countSql, params)
  ]);
  return { items: listResult.rows, total: parseInt(countResult.rows[0]?.total || '0', 10), page: pageNumber, pageSize: pageSizeNumber };
}

export async function upsertAddressAndReturnId({ line1, line2 = null, city, state, postal_code, country = 'USA' }) {
  const sql = `
    INSERT INTO addresses (line1, line2, city, state, postal_code, country)
    VALUES ($1,$2,$3,$4,$5,$6)
    ON CONFLICT ON CONSTRAINT ux_addresses_natural_key
    DO UPDATE SET updated_at = NOW()
    RETURNING id
  `;
  const { rows } = await db.query(sql, [line1?.trim(), line2?.trim() || null, city?.trim(), state?.trim(), postal_code?.trim(), country?.trim() || 'USA']);
  return rows[0]?.id;
}

export async function createLocationService(payload) {
  const { account_id, name, location_type, region, route_code, status, address } = payload;
  let addressId = payload.address_id || null;
  if (!addressId && address && address.line1 && address.city && address.state) {
    addressId = await upsertAddressAndReturnId(address);
  }
  const sql = `
    INSERT INTO locations (account_id, name, location_type, region, route_code, status, address_id)
    VALUES ($1,$2,$3,$4,$5,COALESCE($6,'active'),$7)
    RETURNING *
  `;
  const { rows } = await db.query(sql, [account_id, name?.trim(), location_type || null, region || null, route_code || null, status || null, addressId]);
  return rows[0];
}

export async function updateLocationService(id, payload) {
  const { name, location_type, region, route_code, status, address, address_id } = payload;
  let newAddressId = address_id || null;
  if (!newAddressId && address && address.line1 && address.city && address.state) {
    newAddressId = await upsertAddressAndReturnId(address);
  }
  const sql = `
    UPDATE locations
    SET
      name = COALESCE($2, name),
      location_type = COALESCE($3, location_type),
      region = COALESCE($4, region),
      route_code = COALESCE($5, route_code),
      status = COALESCE($6, status),
      address_id = COALESCE($7, address_id),
      updated_at = NOW()
    WHERE id = $1
    RETURNING *
  `;
  const { rows } = await db.query(sql, [id, name?.trim() || null, location_type || null, region || null, route_code || null, status || null, newAddressId || null]);
  return rows[0] || null;
}

export async function deleteLocationService(id) {
  await db.query('DELETE FROM locations WHERE id = $1', [id]);
}

// ===================== MANUFACTURERS =====================
export async function listManufacturersService(filters = {}) {
  const { search, status, page = 1, pageSize = 25 } = filters;
  const params = [];
  const whereClauses = [];
  if (search) {
    params.push(`%${search}%`);
    whereClauses.push(`name ILIKE $${params.length}`);
  }
  if (status) {
    params.push(status);
    whereClauses.push(`status = $${params.length}`);
  }
  const whereSql = whereClauses.length ? `WHERE ${whereClauses.join(' AND ')}` : '';
  const pageNumber = Math.max(1, parseInt(page, 10) || 1);
  const pageSizeNumber = Math.min(100, Math.max(1, parseInt(pageSize, 10) || 25));
  const offset = (pageNumber - 1) * pageSizeNumber;
  const listSql = `
    SELECT id, name, website, country, status, created_at, updated_at
    FROM manufacturers
    ${whereSql}
    ORDER BY name ASC
    LIMIT ${pageSizeNumber} OFFSET ${offset}
  `;
  const countSql = `SELECT COUNT(*) AS total FROM manufacturers ${whereSql}`;
  const [listResult, countResult] = await Promise.all([
    db.query(listSql, params),
    db.query(countSql, params)
  ]);
  return { items: listResult.rows, total: parseInt(countResult.rows[0]?.total || '0', 10), page: pageNumber, pageSize: pageSizeNumber };
}

export async function createManufacturerService(payload) {
  const { name, website, country, status } = payload;
  const sql = `
    INSERT INTO manufacturers (name, website, country, status)
    VALUES ($1,$2,$3,COALESCE($4,'active'))
    ON CONFLICT (name) DO UPDATE SET
      website = EXCLUDED.website,
      country = EXCLUDED.country,
      status = EXCLUDED.status,
      updated_at = NOW()
    RETURNING *
  `;
  const { rows } = await db.query(sql, [name?.trim(), website || null, country || null, status || null]);
  return rows[0];
}

export async function updateManufacturerService(id, payload) {
  const { name, website, country, status } = payload;
  const sql = `
    UPDATE manufacturers
    SET
      name = COALESCE($2, name),
      website = COALESCE($3, website),
      country = COALESCE($4, country),
      status = COALESCE($5, status),
      updated_at = NOW()
    WHERE id = $1
    RETURNING *
  `;
  const { rows } = await db.query(sql, [id, name?.trim() || null, website || null, country || null, status || null]);
  return rows[0] || null;
}

export async function deleteManufacturerService(id) {
  await db.query('DELETE FROM manufacturers WHERE id = $1', [id]);
}

// ===================== PARTS LISTING =====================
export async function listPartsService(filters = {}) {
  const { search, part_type, manufacturer_id, page = 1, pageSize = 25 } = filters;
  const params = [];
  const whereClauses = [];
  if (search) {
    params.push(search);
    whereClauses.push(`search_vector @@ plainto_tsquery('english', $${params.length})`);
  }
  if (part_type) {
    params.push(part_type);
    whereClauses.push(`pl.part_type = $${params.length}`);
  }
  if (manufacturer_id) {
    params.push(manufacturer_id);
    whereClauses.push(`pl.manufacturer_id = $${params.length}`);
  }
  const whereSql = whereClauses.length ? `WHERE ${whereClauses.join(' AND ')}` : '';
  const pageNumber = Math.max(1, parseInt(page, 10) || 1);
  const pageSizeNumber = Math.min(100, Math.max(1, parseInt(pageSize, 10) || 25));
  const offset = (pageNumber - 1) * pageSizeNumber;
  const listSql = `
    SELECT pl.id, pl.part_name, pl.part_type, pl.manufacturer_part_number, pl.sku, pl.status,
           m.id AS manufacturer_id, m.name AS manufacturer_name,
           pl.created_at, pl.updated_at
    FROM parts_listing pl
    LEFT JOIN manufacturers m ON pl.manufacturer_id = m.id
    ${whereSql}
    ORDER BY pl.part_name ASC
    LIMIT ${pageSizeNumber} OFFSET ${offset}
  `;
  const countSql = `SELECT COUNT(*) AS total FROM parts_listing pl ${whereSql}`;
  const [listResult, countResult] = await Promise.all([
    db.query(listSql, params),
    db.query(countSql, params)
  ]);
  return { items: listResult.rows, total: parseInt(countResult.rows[0]?.total || '0', 10), page: pageNumber, pageSize: pageSizeNumber };
}

export async function createPartService(payload) {
  const {
    category_id,
    manufacturer_id,
    manufacturer_part_number,
    sku,
    part_name,
    part_description,
    part_type,
    status
  } = payload;
  const sql = `
    INSERT INTO parts_listing (
      category_id, manufacturer_id, manufacturer_part_number, sku,
      part_name, part_description, part_type, status
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,COALESCE($8,'active'))
    RETURNING *
  `;
  const { rows } = await db.query(sql, [category_id || null, manufacturer_id || null, manufacturer_part_number?.trim() || null, sku?.trim() || null, part_name?.trim(), part_description || null, part_type || null, status || null]);
  return rows[0];
}

export async function updatePartService(id, payload) {
  const {
    category_id,
    manufacturer_id,
    manufacturer_part_number,
    sku,
    part_name,
    part_description,
    part_type,
    status
  } = payload;
  const sql = `
    UPDATE parts_listing
    SET
      category_id = COALESCE($2, category_id),
      manufacturer_id = COALESCE($3, manufacturer_id),
      manufacturer_part_number = COALESCE($4, manufacturer_part_number),
      sku = COALESCE($5, sku),
      part_name = COALESCE($6, part_name),
      part_description = COALESCE($7, part_description),
      part_type = COALESCE($8, part_type),
      status = COALESCE($9, status),
      updated_at = NOW()
    WHERE id = $1
    RETURNING *
  `;
  const { rows } = await db.query(sql, [id, category_id || null, manufacturer_id || null, manufacturer_part_number?.trim() || null, sku?.trim() || null, part_name?.trim() || null, part_description || null, part_type || null, status || null]);
  return rows[0] || null;
}

export async function deletePartService(id) {
  await db.query('DELETE FROM parts_listing WHERE id = $1', [id]);
}

// ===================== ASSETS =====================
export async function listAssetsService(filters = {}) {
  const { account_id, location_id, status, search, page = 1, pageSize = 25 } = filters;
  const params = [];
  const whereClauses = [];
  if (account_id) {
    params.push(account_id);
    whereClauses.push(`ast.account_id = $${params.length}`);
  }
  if (location_id) {
    params.push(location_id);
    whereClauses.push(`ast.location_id = $${params.length}`);
  }
  if (status) {
    params.push(status);
    whereClauses.push(`ast.asset_status = $${params.length}`);
  }
  if (search) {
    params.push(`%${search}%`);
    whereClauses.push(`(pl.part_name ILIKE $${params.length} OR ast.asset_tag ILIKE $${params.length} OR acc.name ILIKE $${params.length})`);
  }
  const whereSql = whereClauses.length ? `WHERE ${whereClauses.join(' AND ')}` : '';
  const pageNumber = Math.max(1, parseInt(page, 10) || 1);
  const pageSizeNumber = Math.min(100, Math.max(1, parseInt(pageSize, 10) || 25));
  const offset = (pageNumber - 1) * pageSizeNumber;
  const listSql = `
    SELECT
      ast.id,
      ast.asset_tag,
      ast.serial_number,
      ast.asset_status,
      ast.quantity,
      ast.created_at,
      ast.updated_at,
      pl.part_name,
      pl.part_type,
      pl.manufacturer_part_number,
      m.name AS manufacturer_name,
      acc.name AS account_name,
      l.name AS location_name
    FROM assets ast
    LEFT JOIN parts_listing pl ON ast.part_id = pl.id
    LEFT JOIN manufacturers m ON pl.manufacturer_id = m.id
    LEFT JOIN accounts acc ON ast.account_id = acc.id
    LEFT JOIN locations l ON ast.location_id = l.id
    ${whereSql}
    ORDER BY acc.name, l.name, pl.part_name
    LIMIT ${pageSizeNumber} OFFSET ${offset}
  `;
  const countSql = `SELECT COUNT(*) AS total FROM assets ast ${whereSql}`;
  const [listResult, countResult] = await Promise.all([
    db.query(listSql, params),
    db.query(countSql, params)
  ]);
  return { items: listResult.rows, total: parseInt(countResult.rows[0]?.total || '0', 10), page: pageNumber, pageSize: pageSizeNumber };
}

export async function createAssetService(payload) {
  const {
    part_id,
    account_id,
    location_id,
    building_id = null,
    floor_id = null,
    room_id = null,
    pou_point_id = null,
    serial_number = null,
    asset_tag = null,
    asset_status = 'active',
    quantity = 1,
    installation_date = null
  } = payload;
  const sql = `
    INSERT INTO assets (
      part_id, account_id, location_id, building_id, floor_id, room_id, pou_point_id,
      serial_number, asset_tag, asset_status, quantity, installation_date
    ) VALUES (
      $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12
    )
    RETURNING *
  `;
  const { rows } = await db.query(sql, [part_id, account_id, location_id, building_id, floor_id, room_id, pou_point_id, serial_number, asset_tag, asset_status, quantity, installation_date]);
  return rows[0];
}

export async function updateAssetService(id, payload) {
  const {
    part_id,
    account_id,
    location_id,
    building_id,
    floor_id,
    room_id,
    pou_point_id,
    serial_number,
    asset_tag,
    asset_status,
    quantity,
    installation_date
  } = payload;
  const sql = `
    UPDATE assets
    SET
      part_id = COALESCE($2, part_id),
      account_id = COALESCE($3, account_id),
      location_id = COALESCE($4, location_id),
      building_id = COALESCE($5, building_id),
      floor_id = COALESCE($6, floor_id),
      room_id = COALESCE($7, room_id),
      pou_point_id = COALESCE($8, pou_point_id),
      serial_number = COALESCE($9, serial_number),
      asset_tag = COALESCE($10, asset_tag),
      asset_status = COALESCE($11, asset_status),
      quantity = COALESCE($12, quantity),
      installation_date = COALESCE($13, installation_date),
      updated_at = NOW()
    WHERE id = $1
    RETURNING *
  `;
  const { rows } = await db.query(sql, [
    id,
    part_id || null,
    account_id || null,
    location_id || null,
    building_id || null,
    floor_id || null,
    room_id || null,
    pou_point_id || null,
    serial_number || null,
    asset_tag || null,
    asset_status || null,
    quantity || null,
    installation_date || null
  ]);
  return rows[0] || null;
}

export async function deleteAssetService(id) {
  await db.query('DELETE FROM assets WHERE id = $1', [id]);
}


// ===================== CONTACTS (Flat View) =====================
export async function listFlatContactsService(filters = {}) {
  const { account_id, location_id, page = 1, pageSize = 25 } = filters;
  const params = [];
  const whereClauses = [];

  if (account_id) {
    params.push(account_id);
    whereClauses.push(`"Contact ID" = $${params.length}`);
  }
  if (location_id) {
    params.push(location_id);
    whereClauses.push(`"sub_contact_ID" = $${params.length}`);
  }
  const whereSql = whereClauses.length ? `WHERE ${whereClauses.join(' AND ')}` : '';
  const pageNumber = Math.max(1, parseInt(page, 10) || 1);
  const pageSizeNumber = Math.min(100, Math.max(1, parseInt(pageSize, 10) || 25));
  const offset = (pageNumber - 1) * pageSizeNumber;

  const listSql = `
    SELECT 
      "Contact ID" AS account_id,
      "Contact_name" AS contact_name,
      "Contact_type" AS contact_type,
      "sub_contact_ID" AS location_id,
      "sub_contact_name" AS location_name,
      "Billing_Address_line_1" AS billing_address_line1,
      "Billing_Address_line_2" AS billing_address_line2,
      "Billing_City" AS billing_city,
      "Billing_State" AS billing_state,
      "Billing_Zip" AS billing_zip,
      "billing_email" AS billing_email,
      "Employees::Contact 1 email" AS contact1_email,
      "Contact 1" AS contact1_name,
      "Contact 1 Title" AS contact1_title,
      "Contact 1 Direct Line" AS contact1_direct_line,
      "Contact 1 Cell Phone" AS contact1_cell,
      "Contact 2 Name" AS contact2_name,
      "Contact 2 email" AS contact2_email,
      "Contact 2 Title" AS contact2_title,
      "Contact 2 Direct Line" AS contact2_direct_line,
      "Contact 2 Cell" AS contact2_cell,
      "Location_City" AS location_city,
      "Location_State" AS location_state
    FROM v_contacts_flat
    ${whereSql}
    ORDER BY location_name NULLS LAST
    LIMIT ${pageSizeNumber} OFFSET ${offset}
  `;

  const countSql = `SELECT COUNT(*) AS total FROM v_contacts_flat ${whereSql}`;
  const [listResult, countResult] = await Promise.all([
    db.query(listSql, params),
    db.query(countSql, params)
  ]);

  return {
    items: listResult.rows,
    total: parseInt(countResult.rows[0]?.total || '0', 10),
    page: pageNumber,
    pageSize: pageSizeNumber
  };
}

// ===================== BUILDINGS =====================
export async function listBuildingsService(filters = {}) {
  const { location_id, search, page = 1, pageSize = 25 } = filters;
  const params = [];
  const whereClauses = [];
  if (location_id) {
    params.push(location_id);
    whereClauses.push(`b.location_id = $${params.length}`);
  }
  if (search) {
    params.push(`%${search}%`);
    whereClauses.push(`(b.building_name ILIKE $${params.length} OR b.building_code ILIKE $${params.length})`);
  }
  const whereSql = whereClauses.length ? `WHERE ${whereClauses.join(' AND ')}` : '';
  const pageNumber = Math.max(1, parseInt(page, 10) || 1);
  const pageSizeNumber = Math.min(100, Math.max(1, parseInt(pageSize, 10) || 25));
  const offset = (pageNumber - 1) * pageSizeNumber;
  const listSql = `
    SELECT 
      b.id, b.location_id, b.building_name, b.building_code, b.total_floors, b.year_built,
      b.building_type, b.square_footage, b.occupancy_count, b.water_system_type,
      b.primary_pwsid, b.secondary_pwsid, b.created_at, b.updated_at,
      l.account_id, l.region, l.route_code
    FROM buildings b
    JOIN locations l ON b.location_id = l.id
    ${whereSql}
    ORDER BY b.building_name ASC
    LIMIT ${pageSizeNumber} OFFSET ${offset}
  `;
  const countSql = `SELECT COUNT(*) AS total FROM buildings b ${whereSql}`;
  const [listResult, countResult] = await Promise.all([
    db.query(listSql, params),
    db.query(countSql, params)
  ]);
  return { items: listResult.rows, total: parseInt(countResult.rows[0]?.total || '0', 10), page: pageNumber, pageSize: pageSizeNumber };
}

export async function createBuildingService(payload) {
  const {
    location_id,
    building_name,
    building_code = null,
    total_floors = null,
    year_built = null,
    building_type = null,
    square_footage = null,
    occupancy_count = null,
    water_system_type = null,
    primary_pwsid = null,
    secondary_pwsid = null
  } = payload;

  const sql = `
    INSERT INTO buildings (
      location_id, building_name, building_code, total_floors, year_built, building_type,
      square_footage, occupancy_count, water_system_type, primary_pwsid, secondary_pwsid
    ) VALUES (
      $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11
    ) RETURNING *
  `;
  const { rows } = await db.query(sql, [
    location_id, building_name?.trim(), building_code, total_floors, year_built, building_type,
    square_footage, occupancy_count, water_system_type, primary_pwsid, secondary_pwsid
  ]);
  return rows[0];
}

export async function updateBuildingService(id, payload) {
  const fields = [
    'location_id','building_name','building_code','total_floors','year_built','building_type',
    'square_footage','occupancy_count','water_system_type','primary_pwsid','secondary_pwsid'
  ];
  const sets = [];
  const params = [];
  let idx = 1;
  for (const f of fields) {
    if (payload.hasOwnProperty(f)) {
      sets.push(`${f} = $${idx++}`);
      params.push(f === 'building_name' ? payload[f]?.trim() || null : payload[f]);
    }
  }
  if (sets.length === 0) {
    const { rows } = await db.query('SELECT * FROM buildings WHERE id = $1', [id]);
    return rows[0] || null;
  }
  const sql = `
    UPDATE buildings
    SET ${sets.join(', ')}, updated_at = NOW()
    WHERE id = $${idx}
    RETURNING *
  `;
  params.push(id);
  const { rows } = await db.query(sql, params);
  return rows[0] || null;
}

export async function deleteBuildingService(id) {
  await db.query('DELETE FROM buildings WHERE id = $1', [id]);
}

// ===================== FLOORS =====================
export async function listFloorsService(filters = {}) {
  const { building_id, search, page = 1, pageSize = 25 } = filters;
  const params = [];
  const whereClauses = [];
  if (building_id) {
    params.push(building_id);
    whereClauses.push(`f.building_id = $${params.length}`);
  }
  if (search) {
    params.push(`%${search}%`);
    whereClauses.push(`(f.floor_name ILIKE $${params.length})`);
  }
  const whereSql = whereClauses.length ? `WHERE ${whereClauses.join(' AND ')}` : '';
  const pageNumber = Math.max(1, parseInt(page, 10) || 1);
  const pageSizeNumber = Math.min(100, Math.max(1, parseInt(pageSize, 10) || 25));
  const offset = (pageNumber - 1) * pageSizeNumber;
  const listSql = `
    SELECT f.id, f.building_id, f.floor_number, f.floor_name, f.floor_type,
           f.square_footage, f.occupancy_count, f.water_usage_level,
           f.created_at, f.updated_at
    FROM floors f
    ${whereSql}
    ORDER BY COALESCE(f.floor_number, 0), f.floor_name
    LIMIT ${pageSizeNumber} OFFSET ${offset}
  `;
  const countSql = `SELECT COUNT(*) AS total FROM floors f ${whereSql}`;
  const [listResult, countResult] = await Promise.all([
    db.query(listSql, params),
    db.query(countSql, params)
  ]);
  return { items: listResult.rows, total: parseInt(countResult.rows[0]?.total || '0', 10), page: pageNumber, pageSize: pageSizeNumber };
}

export async function createFloorService(payload) {
  const { building_id, floor_number = null, floor_name = null, floor_type = null, square_footage = null, occupancy_count = null, water_usage_level = null } = payload;
  const sql = `
    INSERT INTO floors (building_id, floor_number, floor_name, floor_type, square_footage, occupancy_count, water_usage_level)
    VALUES ($1,$2,$3,$4,$5,$6,$7)
    RETURNING *
  `;
  const { rows } = await db.query(sql, [building_id, floor_number, floor_name, floor_type, square_footage, occupancy_count, water_usage_level]);
  return rows[0];
}

export async function updateFloorService(id, payload) {
  const fields = ['building_id','floor_number','floor_name','floor_type','square_footage','occupancy_count','water_usage_level'];
  const sets = [];
  const params = [];
  let idx = 1;
  for (const f of fields) {
    if (payload.hasOwnProperty(f)) {
      sets.push(`${f} = $${idx++}`);
      params.push(payload[f]);
    }
  }
  if (sets.length === 0) {
    const { rows } = await db.query('SELECT * FROM floors WHERE id = $1', [id]);
    return rows[0] || null;
  }
  const sql = `
    UPDATE floors
    SET ${sets.join(', ')}, updated_at = NOW()
    WHERE id = $${idx}
    RETURNING *
  `;
  params.push(id);
  const { rows } = await db.query(sql, params);
  return rows[0] || null;
}

export async function deleteFloorService(id) {
  await db.query('DELETE FROM floors WHERE id = $1', [id]);
}

// ===================== ROOMS =====================
export async function listRoomsService(filters = {}) {
  const { floor_id, building_id, search, page = 1, pageSize = 25 } = filters;
  const params = [];
  const whereClauses = [];
  if (floor_id) {
    params.push(floor_id);
    whereClauses.push(`br.floor_id = $${params.length}`);
  }
  if (building_id) {
    params.push(building_id);
    whereClauses.push(`f.building_id = $${params.length}`);
  }
  if (search) {
    params.push(`%${search}%`);
    whereClauses.push(`(br.room_name ILIKE $${params.length} OR br.room_number ILIKE $${params.length})`);
  }
  const whereSql = whereClauses.length ? `WHERE ${whereClauses.join(' AND ')}` : '';
  const pageNumber = Math.max(1, parseInt(page, 10) || 1);
  const pageSizeNumber = Math.min(100, Math.max(1, parseInt(pageSize, 10) || 25));
  const offset = (pageNumber - 1) * pageSizeNumber;
  const listSql = `
    SELECT br.id, br.floor_id, br.room_number, br.room_name, br.room_type, br.room_description,
           br.pou_id, br.qr_code, br.geo_lat, br.geo_lon, br.created_at, br.updated_at
    FROM building_rooms br
    JOIN floors f ON br.floor_id = f.id
    ${whereSql}
    ORDER BY br.room_name NULLS LAST, br.room_number NULLS LAST
    LIMIT ${pageSizeNumber} OFFSET ${offset}
  `;
  const countSql = `
    SELECT COUNT(*) AS total
    FROM building_rooms br
    JOIN floors f ON br.floor_id = f.id
    ${whereSql}
  `;
  const [listResult, countResult] = await Promise.all([
    db.query(listSql, params),
    db.query(countSql, params)
  ]);
  return { items: listResult.rows, total: parseInt(countResult.rows[0]?.total || '0', 10), page: pageNumber, pageSize: pageSizeNumber };
}

export async function createRoomService(payload) {
  const { floor_id, room_number = null, room_name = null, room_type = null, room_description = null, geo_lat = null, geo_lon = null, pou_id = null, qr_code = null } = payload;
  const sql = `
    INSERT INTO building_rooms (floor_id, room_number, room_name, room_type, room_description, geo_lat, geo_lon, pou_id, qr_code)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
    RETURNING *
  `;
  const { rows } = await db.query(sql, [floor_id, room_number, room_name, room_type, room_description, geo_lat, geo_lon, pou_id, qr_code]);
  return rows[0];
}

export async function updateRoomService(id, payload) {
  const fields = ['floor_id','room_number','room_name','room_type','room_description','geo_lat','geo_lon','pou_id','qr_code'];
  const sets = [];
  const params = [];
  let idx = 1;
  for (const f of fields) {
    if (payload.hasOwnProperty(f)) {
      sets.push(`${f} = $${idx++}`);
      params.push(payload[f]);
    }
  }
  if (sets.length === 0) {
    const { rows } = await db.query('SELECT * FROM building_rooms WHERE id = $1', [id]);
    return rows[0] || null;
  }
  const sql = `
    UPDATE building_rooms
    SET ${sets.join(', ')}, updated_at = NOW()
    WHERE id = $${idx}
    RETURNING *
  `;
  params.push(id);
  const { rows } = await db.query(sql, params);
  return rows[0] || null;
}

export async function deleteRoomService(id) {
  await db.query('DELETE FROM building_rooms WHERE id = $1', [id]);
}

// ===================== POU POINTS =====================
export async function listPOUPointsService(filters = {}) {
  const { room_id, search, page = 1, pageSize = 25 } = filters;
  const params = [];
  const whereClauses = [];
  if (room_id) {
    params.push(room_id);
    whereClauses.push(`pp.room_id = $${params.length}`);
  }
  if (search) {
    params.push(`%${search}%`);
    whereClauses.push(`(pp.pou_name ILIKE $${params.length} OR pp.pou_id ILIKE $${params.length})`);
  }
  const whereSql = whereClauses.length ? `WHERE ${whereClauses.join(' AND ')}` : '';
  const pageNumber = Math.max(1, parseInt(page, 10) || 1);
  const pageSizeNumber = Math.min(100, Math.max(1, parseInt(pageSize, 10) || 25));
  const offset = (pageNumber - 1) * pageSizeNumber;
  const listSql = `
    SELECT pp.id, pp.pou_id, pp.room_id, pp.pou_name, pp.pou_description, pp.equipment_group, pp.barcode_format,
           pp.location_notes, pp.geom, pp.is_active, pp.created_at, pp.updated_at
    FROM pou_points pp
    ${whereSql}
    ORDER BY pp.pou_name NULLS LAST, pp.pou_id
    LIMIT ${pageSizeNumber} OFFSET ${offset}
  `;
  const countSql = `SELECT COUNT(*) AS total FROM pou_points pp ${whereSql}`;
  const [listResult, countResult] = await Promise.all([
    db.query(listSql, params),
    db.query(countSql, params)
  ]);
  return { items: listResult.rows, total: parseInt(countResult.rows[0]?.total || '0', 10), page: pageNumber, pageSize: pageSizeNumber };
}

export async function createPOUPointService(payload) {
  const { room_id, pou_id, pou_name = null, pou_description = null, equipment_group = null, barcode_format = null, location_notes = null, is_active = true } = payload;
  const sql = `
    INSERT INTO pou_points (room_id, pou_id, pou_name, pou_description, equipment_group, barcode_format, location_notes, is_active)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
    RETURNING *
  `;
  const { rows } = await db.query(sql, [room_id, pou_id, pou_name, pou_description, equipment_group, barcode_format, location_notes, is_active]);
  return rows[0];
}

export async function updatePOUPointService(id, payload) {
  const fields = ['room_id','pou_id','pou_name','pou_description','equipment_group','barcode_format','location_notes','is_active'];
  const sets = [];
  const params = [];
  let idx = 1;
  for (const f of fields) {
    if (payload.hasOwnProperty(f)) {
      sets.push(`${f} = $${idx++}`);
      params.push(payload[f]);
    }
  }
  if (sets.length === 0) {
    const { rows } = await db.query('SELECT * FROM pou_points WHERE id = $1', [id]);
    return rows[0] || null;
  }
  const sql = `
    UPDATE pou_points
    SET ${sets.join(', ')}, updated_at = NOW()
    WHERE id = $${idx}
    RETURNING *
  `;
  params.push(id);
  const { rows } = await db.query(sql, params);
  return rows[0] || null;
}

export async function deletePOUPointService(id) {
  await db.query('DELETE FROM pou_points WHERE id = $1', [id]);
}

// ===================== HIERARCHY (Tree) =====================
export async function listHierarchyNodesService(filters = {}) {
  const { parent_id = null, level = null, search = '' } = filters;
  const params = [];
  const whereClauses = [];
  if (parent_id) {
    params.push(parent_id);
    whereClauses.push(`parent_id = $${params.length}`);
  } else if (level !== null && level !== undefined && level !== '') {
    params.push(parseInt(level, 10));
    whereClauses.push(`level = $${params.length}`);
  } else {
    // default to root accounts
    whereClauses.push(`level = 0`);
  }
  if (search) {
    params.push(`%${search}%`);
    whereClauses.push(`(display_name ILIKE $${params.length} OR COALESCE(city,'') ILIKE $${params.length} OR COALESCE(state,'') ILIKE $${params.length})`);
  }
  const whereSql = whereClauses.length ? `WHERE ${whereClauses.join(' AND ')}` : '';
  const sql = `
    SELECT node_id, node_type, parent_id, level, display_name, code, status,
           tier1_name, tier2_name, city, state, region, route_code,
           location_count, building_count, asset_count, active_alert_count,
           created_at, updated_at
    FROM admin_tree_view
    ${whereSql}
    ORDER BY sort_key_1, sort_key_2, sort_key_3, level, sort_key_4, display_name
  `;
  const { rows } = await db.query(sql, params);
  return rows;
}

export async function getHierarchyNodeDetailsService({ node_type, id }) {
  switch (node_type) {
    case 'account': {
      const { rows } = await db.query(
        `SELECT * FROM account_hierarchy_enhanced WHERE account_id = $1`,
        [id]
      );
      return rows[0] || null;
    }
    case 'location': {
      const { rows } = await db.query(
        `SELECT * FROM location_details WHERE id = $1`,
        [id]
      );
      return rows[0] || null;
    }
    case 'building': {
      const { rows } = await db.query(
        `SELECT * FROM building_filter_summary WHERE building_id = $1`,
        [id]
      );
      return rows[0] || null;
    }
    case 'floor': {
      const { rows } = await db.query(
        `SELECT f.*, 
                (SELECT COUNT(*) FROM building_rooms br WHERE br.floor_id = f.id) AS room_count,
                (SELECT COUNT(*) FROM assets a WHERE a.floor_id = f.id) AS asset_count
         FROM floors f WHERE f.id = $1`,
        [id]
      );
      return rows[0] || null;
    }
    default:
      return null;
  }
}

export async function createHierarchyNodeService({ node_type, parent_id, payload }) {
  switch (node_type) {
    case 'location':
      return createLocationService({ ...payload, account_id: parent_id });
    case 'building':
      return createBuildingService({ ...payload, location_id: parent_id });
    case 'floor':
      return createFloorService({ ...payload, building_id: parent_id });
    case 'room':
      return createRoomService({ ...payload, floor_id: parent_id });
    default:
      throw new Error('Unsupported node_type for creation');
  }
}

export async function updateHierarchyNodeService({ node_type, id, payload }) {
  switch (node_type) {
    case 'account':
      return updateAccountService(id, payload);
    case 'location':
      return updateLocationService(id, payload);
    case 'building':
      return updateBuildingService(id, payload);
    case 'floor':
      return updateFloorService(id, payload);
    case 'room':
      return updateRoomService(id, payload);
    default:
      throw new Error('Unsupported node_type for update');
  }
}

export async function deleteHierarchyNodeService({ node_type, id }) {
  switch (node_type) {
    case 'account':
      return deleteAccountService(id);
    case 'location':
      return deleteLocationService(id);
    case 'building':
      return deleteBuildingService(id);
    case 'floor':
      return deleteFloorService(id);
    case 'room':
      return deleteRoomService(id);
    default:
      throw new Error('Unsupported node_type for delete');
  }
}

