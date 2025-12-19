import { db } from '../config/db.js';

/**
 * Get water quality reports (optionally filtered by bounds)
 * Query params: minLng, minLat, maxLng, maxLat (optional)
 */
export const getWaterQualityReports = async (req, res) => {
  try {
    // Build query - adjust table name and columns based on your actual schema
    let query = `
      SELECT 
        gid,
        pwsid,
        state,
        pws_name,
        primacy_agency,
        pop_cat_5,
        population_served_count,
        service_connections_count,
        service_area_type,
        data_source_link,
        secondary_id,
        secondary_id_source,
        pws_type_code,
        org_name,
        admin_name,
        email_addr,
        phone_number,
        address_line1,
        zip_code,
        city_served,
        geom
      FROM public.water_districts
      WHERE geom IS NOT NULL
    `;

    const result = await db.query(query);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching water quality reports:', error);
    
    // If table doesn't exist, return empty array (graceful fallback)
    if (error.message.includes('does not exist') || error.message.includes('relation')) {
      return res.json({
        success: true,
        data: []
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to fetch water quality reports'
    });
  }
};

/**
 * Get water quality reports for a specific PWSID
 */
export const getWaterQualityReportsByPwsid = async (req, res) => {
  try {
    const { pwsid } = req.params;

    if (!pwsid) {
      return res.status(400).json({
        success: false,
        error: 'PWSID is required'
      });
    }

    // Build query - adjust table name and columns based on your actual schema
    const query = `
      SELECT 
        gid,
        pwsid,
        state,
        pws_name,
        primacy_agency,
        pop_cat_5,
        population_served_count,
        service_connections_count,
        service_area_type,
        data_source_link,
        secondary_id,
        secondary_id_source,
        pws_type_code,
        org_name,
        admin_name,
        email_addr,
        phone_number,
        address_line1,
        zip_code,
        city_served,
        geom
      FROM public.water_districts
      WHERE pwsid = $1
    `;

    const result = await db.query(query, [pwsid]);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching water quality reports by PWSID:', error);
    
    // If table doesn't exist, return empty array (graceful fallback)
    if (error.message.includes('does not exist') || error.message.includes('relation')) {
      return res.json({
        success: true,
        data: []
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to fetch water quality reports'
    });
  }
};

