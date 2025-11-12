import { db } from '../config/db.js';

// ============== Analyte Types ==================
export async function listAnalyteTypesService() {
    const query = `
        SELECT id, code, name, description, created_at, updated_at
        FROM contaminant_analyte_types
        ORDER BY CASE code
            WHEN 'WQI' THEN 1
            WHEN 'OC' THEN 2
            WHEN 'IOC' THEN 3
            WHEN 'RA' THEN 4
            WHEN 'Microbiological' THEN 5
            WHEN 'PFAS' THEN 6
            WHEN 'Operational' THEN 7
            WHEN 'aggregate measure' THEN 8
            ELSE 9
        END, code ASC
    `;
    const { rows } = await db.query(query);
    return rows;
}

export async function createAnalyteTypeService({ code, name, description }) {
    const insert = `
        INSERT INTO contaminant_analyte_types (code, name, description)
        VALUES ($1, $2, $3)
        RETURNING id, code, name, description, created_at, updated_at
    `;
    const { rows } = await db.query(insert, [code?.trim(), name?.trim() || null, description || null]);
    return rows[0];
}

export async function updateAnalyteTypeService(id, { code, name, description }) {
    const update = `
        UPDATE contaminant_analyte_types
        SET 
            code = COALESCE($2, code),
            name = COALESCE($3, name),
            description = COALESCE($4, description),
            updated_at = NOW()
        WHERE id = $1
        RETURNING id, code, name, description, created_at, updated_at
    `;
    const { rows } = await db.query(update, [id, code?.trim() || null, name?.trim() || null, description || null]);
    return rows[0] || null;
}

export async function deleteAnalyteTypeService(id) {
    const del = `DELETE FROM contaminant_analyte_types WHERE id = $1`;
    await db.query(del, [id]);
}

// ============== Classifications ==================
export async function listClassificationsService({ analyte_type_id } = {}) {
    const params = [];
    let where = '';
    if (analyte_type_id) {
        params.push(analyte_type_id);
        where = 'WHERE c.analyte_type_id = $1';
    }

    const query = `
        SELECT 
            c.id,
            c.name,
            c.analyte_type_id,
            at.code AS analyte_type_code,
            c.created_at,
            c.updated_at
        FROM contaminant_classifications c
        JOIN contaminant_analyte_types at ON c.analyte_type_id = at.id
        ${where}
        ORDER BY CASE at.code
            WHEN 'WQI' THEN 1
            WHEN 'OC' THEN 2
            WHEN 'IOC' THEN 3
            WHEN 'RA' THEN 4
            WHEN 'Microbiological' THEN 5
            WHEN 'PFAS' THEN 6
            WHEN 'Operational' THEN 7
            WHEN 'aggregate measure' THEN 8
            ELSE 9
        END, c.name ASC
    `;
    const { rows } = await db.query(query, params);
    return rows;
}

export async function createClassificationService({ analyte_type_id, name }) {
    const insert = `
        INSERT INTO contaminant_classifications (analyte_type_id, name)
        VALUES ($1, $2)
        ON CONFLICT (analyte_type_id, name) DO UPDATE SET name = EXCLUDED.name
        RETURNING id, analyte_type_id, name, created_at, updated_at
    `;
    const { rows } = await db.query(insert, [analyte_type_id, name?.trim()]);
    return rows[0];
}

export async function updateClassificationService(id, { name }) {
    const update = `
        UPDATE contaminant_classifications
        SET name = COALESCE($2, name), updated_at = NOW()
        WHERE id = $1
        RETURNING id, analyte_type_id, name, created_at, updated_at
    `;
    const { rows } = await db.query(update, [id, name?.trim() || null]);
    return rows[0] || null;
}

export async function deleteClassificationService(id) {
    const del = `DELETE FROM contaminant_classifications WHERE id = $1`;
    await db.query(del, [id]);
}

// ============== Subclassifications ==================
export async function listSubclassificationsService({ classification_id } = {}) {
    const params = [];
    let where = '';
    if (classification_id) {
        params.push(classification_id);
        where = 'WHERE sc.classification_id = $1';
    }
    const query = `
        SELECT 
            sc.id,
            sc.name,
            sc.classification_id,
            c.name AS classification_name,
            sc.created_at,
            sc.updated_at
        FROM contaminant_subclassifications sc
        JOIN contaminant_classifications c ON sc.classification_id = c.id
        ${where}
        ORDER BY c.name ASC, sc.name ASC
    `;
    const { rows } = await db.query(query, params);
    return rows;
}

export async function createSubclassificationService({ classification_id, name }) {
    const insert = `
        INSERT INTO contaminant_subclassifications (classification_id, name)
        VALUES ($1, $2)
        ON CONFLICT (classification_id, name) DO UPDATE SET name = EXCLUDED.name
        RETURNING id, classification_id, name, created_at, updated_at
    `;
    const { rows } = await db.query(insert, [classification_id, name?.trim()]);
    return rows[0];
}

export async function updateSubclassificationService(id, { name }) {
    const update = `
        UPDATE contaminant_subclassifications
        SET name = COALESCE($2, name), updated_at = NOW()
        WHERE id = $1
        RETURNING id, classification_id, name, created_at, updated_at
    `;
    const { rows } = await db.query(update, [id, name?.trim() || null]);
    return rows[0] || null;
}

export async function deleteSubclassificationService(id) {
    const del = `DELETE FROM contaminant_subclassifications WHERE id = $1`;
    await db.query(del, [id]);
}

// ============== Analytes ==================
export async function listAnalytesService(filters = {}) {
    const {
        analyte_type_id,
        classification_id,
        subclassification_id,
        search,
        page = 1,
        pageSize = 25
    } = filters;

    const params = [];
    const whereClauses = [];

    if (analyte_type_id) {
        params.push(analyte_type_id);
        whereClauses.push(`ca.analyte_type_id = $${params.length}`);
    }
    if (classification_id) {
        params.push(classification_id);
        whereClauses.push(`ca.classification_id = $${params.length}`);
    }
    if (subclassification_id) {
        params.push(subclassification_id);
        whereClauses.push(`ca.subclassification_id = $${params.length}`);
    }
    if (search) {
        params.push(`%${search}%`);
        whereClauses.push(`(ca.analyte_name ILIKE $${params.length} OR ca.analyte_code ILIKE $${params.length})`);
    }

    const whereSql = whereClauses.length ? `WHERE ${whereClauses.join(' AND ')}` : '';
    const pageNumber = Math.max(1, parseInt(page, 10) || 1);
    const pageSizeNumber = Math.min(100, Math.max(1, parseInt(pageSize, 10) || 25));
    const offset = (pageNumber - 1) * pageSizeNumber;

    const query = `
        SELECT 
            ca.id,
            ca.analyte_name,
            ca.analyte_code,
            ca.mclg_unit,
            ca.mcl_unit,
            ca.potential_health_effects,
            ca.mclg_value,
            ca.mcl_value,
            ca.mclg_type,
            ca.mcl_type,
            ca.mcl_basis,
            ca.units,
            ca.analyte_type_id,
            ca.classification_id,
            ca.subclassification_id,
            at.code AS analyte_type_code,
            c.name  AS classification_name,
            sc.name AS subclassification_name,
            ca.created_at,
            ca.updated_at
        FROM contaminant_analytes ca
        JOIN contaminant_analyte_types at ON ca.analyte_type_id = at.id
        JOIN contaminant_classifications c ON ca.classification_id = c.id
        LEFT JOIN contaminant_subclassifications sc ON ca.subclassification_id = sc.id
        ${whereSql}
        ORDER BY CASE at.code
            WHEN 'WQI' THEN 1
            WHEN 'OC' THEN 2
            WHEN 'IOC' THEN 3
            WHEN 'RA' THEN 4
            WHEN 'Microbiological' THEN 5
            WHEN 'PFAS' THEN 6
            WHEN 'Operational' THEN 7
            WHEN 'aggregate measure' THEN 8
            ELSE 9
        END, c.name, sc.name NULLS FIRST, ca.analyte_name
        LIMIT ${pageSizeNumber} OFFSET ${offset}
    `;
    const [listResult, countResult] = await Promise.all([
        db.query(query, params),
        db.query(`
            SELECT COUNT(*) AS total
            FROM contaminant_analytes ca
            JOIN contaminant_analyte_types at ON ca.analyte_type_id = at.id
            JOIN contaminant_classifications c ON ca.classification_id = c.id
            LEFT JOIN contaminant_subclassifications sc ON ca.subclassification_id = sc.id
            ${whereSql}
        `, params)
    ]);
    return { items: listResult.rows, total: parseInt(countResult.rows[0].total, 10), page: pageNumber, pageSize: pageSizeNumber };
}

export async function createAnalyteService(payload) {
    const {
        analyte_type_id,
        classification_id,
        subclassification_id,
        analyte_name,
        analyte_code,
        mclg_raw,
        mcl_raw,
        potential_health_effects,
        mclg_value,
        mcl_value,
        units
    } = payload;

    const insert = `
        INSERT INTO contaminant_analytes (
            analyte_type_id, classification_id, subclassification_id,
            analyte_name, analyte_code,
            potential_health_effects,
            mclg_value, mcl_value, mclg_unit, mcl_unit, mclg_type, mcl_type, mcl_basis, units
        ) VALUES (
            $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12
        )
        ON CONFLICT (classification_id, subclassification_id, analyte_name, analyte_code)
        DO UPDATE SET 
            potential_health_effects = EXCLUDED.potential_health_effects,
            mclg_value = EXCLUDED.mclg_value,
            mcl_value = EXCLUDED.mcl_value,
            mclg_unit = EXCLUDED.mclg_unit,
            mcl_unit = EXCLUDED.mcl_unit,
            mclg_type = EXCLUDED.mclg_type,
            mcl_type = EXCLUDED.mcl_type,
            mcl_basis = EXCLUDED.mcl_basis,
            units = EXCLUDED.units,
            updated_at = NOW()
        RETURNING *
    `;
    const params = [
        analyte_type_id, classification_id, subclassification_id || null,
        analyte_name?.trim(), analyte_code?.trim() || null,
        potential_health_effects || null,
        mclg_value ?? null, mcl_value ?? null, payload.mclg_unit || null, payload.mcl_unit || null,
        payload.mclg_type || null, payload.mcl_type || null, payload.mcl_basis || null,
        units || null
    ];
    const { rows } = await db.query(insert, params);
    return rows[0];
}

export async function updateAnalyteService(id, payload) {
    const {
        analyte_type_id,
        classification_id,
        subclassification_id,
        analyte_name,
        analyte_code,
        mclg_raw,
        mcl_raw,
        potential_health_effects,
        mclg_value,
        mcl_value,
        units
    } = payload;

    const update = `
        UPDATE contaminant_analytes
        SET
            analyte_type_id = COALESCE($2, analyte_type_id),
            classification_id = COALESCE($3, classification_id),
            subclassification_id = COALESCE($4, subclassification_id),
            analyte_name = COALESCE($5, analyte_name),
            analyte_code = COALESCE($6, analyte_code),
            potential_health_effects = COALESCE($7, potential_health_effects),
            mclg_value = COALESCE($8, mclg_value),
            mcl_value = COALESCE($9, mcl_value),
            mclg_unit = COALESCE($10, mclg_unit),
            mcl_unit = COALESCE($11, mcl_unit),
            mclg_type = COALESCE($12, mclg_type),
            mcl_type = COALESCE($13, mcl_type),
            mcl_basis = COALESCE($14, mcl_basis),
            units = COALESCE($15, units),
            updated_at = NOW()
        WHERE id = $1
        RETURNING *
    `;
    const params = [
        id,
        analyte_type_id || null,
        classification_id || null,
        subclassification_id || null,
        analyte_name?.trim() || null,
        analyte_code?.trim() || null,
        potential_health_effects || null,
        mclg_value ?? null,
        mcl_value ?? null,
        payload.mclg_unit || null,
        payload.mcl_unit || null,
        payload.mclg_type || null,
        payload.mcl_type || null,
        payload.mcl_basis || null,
        units || null
    ];
    const { rows } = await db.query(update, params);
    return rows[0] || null;
}

export async function deleteAnalyteService(id) {
    const del = `DELETE FROM contaminant_analytes WHERE id = $1`;
    await db.query(del, [id]);
}

