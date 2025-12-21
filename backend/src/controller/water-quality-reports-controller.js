import { db } from '../config/db.js';

/**
 * Get water quality reports (optionally filtered by bounds)
 */
export const getWaterQualityReports = async (req, res) => {
  try {
    const { minLng, minLat, maxLng, maxLat } = req.query;
    
    // First, try to query water_quality_reports table if it exists
    let query = `
      SELECT 
        wqr.*,
        ST_X(ST_Centroid(wd.geom)) as longitude,
        ST_Y(ST_Centroid(wd.geom)) as latitude,
        wd.pwsid,
        wd.pws_name,
        wd.state,
        wd.primacy_agency
      FROM public.water_quality_reports wqr
      INNER JOIN public.water_districts wd ON wqr.pwsid = wd.pwsid
      WHERE wd.geom IS NOT NULL
    `;

    // Add bounding box filter if provided
    if (minLng && minLat && maxLng && maxLat) {
      query += ` AND ST_Intersects(
        wd.geom,
        ST_MakeEnvelope($1, $2, $3, $4, 4326)
      )`;
    }

    query += ` ORDER BY wqr.report_date DESC NULLS LAST LIMIT 1000`;

    const params = minLng && minLat && maxLng && maxLat 
      ? [parseFloat(minLng), parseFloat(minLat), parseFloat(maxLng), parseFloat(maxLat)]
      : [];

    const result = await db.query(query, params);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching water quality reports:', error);
    
    // If water_quality_reports table doesn't exist, fall back to water_districts
    if (error.message.includes('does not exist') || error.message.includes('relation') || error.message.includes('water_quality_reports')) {
      try {
        // Fallback: return water_districts data with calculated coordinates
        let fallbackQuery = `
          SELECT 
            gid,
            pwsid,
            state,
            pws_name,
            primacy_agency,
            pop_cat_5 as population_served_count,
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
            ST_X(ST_Centroid(geom)) as longitude,
            ST_Y(ST_Centroid(geom)) as latitude,
            0 as analytes_detected,
            0 as analytes_exceeding_mclg,
            NULL as report_date
          FROM public.water_districts
          WHERE geom IS NOT NULL
        `;

        const { minLng, minLat, maxLng, maxLat } = req.query;
        if (minLng && minLat && maxLng && maxLat) {
          fallbackQuery += ` AND ST_Intersects(
            geom,
            ST_MakeEnvelope($1, $2, $3, $4, 4326)
          )`;
        }

        fallbackQuery += ` LIMIT 1000`;

        const params = minLng && minLat && maxLng && maxLat 
          ? [parseFloat(minLng), parseFloat(minLat), parseFloat(maxLng), parseFloat(maxLat)]
          : [];

        const fallbackResult = await db.query(fallbackQuery, params);
        
        return res.json({
          success: true,
          data: fallbackResult.rows
        });
      } catch (fallbackError) {
        console.error('Error in fallback query:', fallbackError);
        return res.json({
          success: true,
          data: []
        });
      }
    }

    res.status(500).json({
      success: false,
      error: 'Failed to fetch water quality reports'
    });
  }
};

/**
 * Get water quality reports for a specific PWSID
 * Returns both water quality report data and district information
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

    // First, try to get water quality reports if table exists
    try {
      const qualityQuery = `
        SELECT 
          wqr.*,
          wd.pwsid,
          wd.pws_name,
          wd.state,
          wd.primacy_agency,
          wd.population_served_count,
          wd.service_connections_count,
          wd.org_name,
          wd.admin_name,
          wd.email_addr,
          wd.phone_number,
          wd.address_line1,
          wd.city_served,
          wd.zip_code,
          wd.service_area_type,
          wd.data_source_link
        FROM public.water_quality_reports wqr
        INNER JOIN public.water_districts wd ON wqr.pwsid = wd.pwsid
        WHERE wqr.pwsid = $1
        ORDER BY wqr.report_date DESC NULLS LAST
        LIMIT 50
      `;

      const qualityResult = await db.query(qualityQuery, [pwsid]);
      
      if (qualityResult.rows.length > 0) {
        return res.json({
          success: true,
          data: qualityResult.rows
        });
      }
    } catch (qualityError) {
      // If water_quality_reports table doesn't exist, fall through to district query
      if (!qualityError.message.includes('does not exist') && !qualityError.message.includes('relation')) {
        throw qualityError;
      }
    }

    // Fallback: return district information with empty quality data
    const districtQuery = `
      SELECT 
        gid,
        pwsid,
        state,
        pws_name,
        primacy_agency,
        pop_cat_5 as population_served_count,
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
        0 as analytes_detected,
        0 as analytes_exceeding_mclg,
        NULL as report_date
      FROM public.water_districts
      WHERE pwsid = $1
    `;

    const districtResult = await db.query(districtQuery, [pwsid]);

    res.json({
      success: true,
      data: districtResult.rows
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

