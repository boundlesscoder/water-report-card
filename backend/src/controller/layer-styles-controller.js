import { db } from '../config/db.js';

const getLayerStyles = async (req, res) => {
    try {
        const { rows } = await db.query(`
            SELECT 
                id,
                layer_id,
                layer_type,
                paint_properties,
                filter_properties,
                is_active,
                created_at,
                updated_at
            FROM layer_styles 
            WHERE is_active = true 
            ORDER BY layer_id, created_at DESC
        `);

        // Function to clean paint properties based on layer type
        const cleanPaintProperties = (layerType, paintProperties) => {
            if (!paintProperties || typeof paintProperties !== 'object') {
                return {};
            }
            
            const validProperties = {
                fill: ['fill-color', 'fill-opacity', 'fill-outline-color', 'fill-pattern'],
                line: ['line-color', 'line-width', 'line-opacity', 'line-dasharray', 'line-join', 'line-cap'],
                symbol: ['text-color', 'text-halo-color', 'text-halo-width', 'icon-color', 'icon-opacity', 'text-opacity', 'icon-stroke', 'icon-stroke-width'],
                circle: ['circle-color', 'circle-radius', 'circle-opacity', 'circle-stroke-color', 'circle-stroke-width'],
                heatmap: ['heatmap-color', 'heatmap-intensity', 'heatmap-opacity', 'heatmap-radius', 'heatmap-weight'],
                hillshade: ['hillshade-accent-color', 'hillshade-illumination-anchor', 'hillshade-illumination-color', 'hillshade-shadow-color'],
                raster: ['raster-brightness-max', 'raster-brightness-min', 'raster-contrast', 'raster-fade-duration', 'raster-hue-rotate', 'raster-opacity', 'raster-resampling', 'raster-saturation']
            };
            
            const allowedProperties = validProperties[layerType];
            if (!allowedProperties) {
                return {};
            }
            
            const cleanedProperties = {};
            
            // Only keep properties that are valid for this layer type
            for (const [key, value] of Object.entries(paintProperties)) {
                if (allowedProperties.includes(key)) {
                    cleanedProperties[key] = value;
                }
            }
            
            return cleanedProperties;
        };

        const styles = rows.map(row => {
            const cleanedPaintProperties = cleanPaintProperties(row.layer_type, row.paint_properties);
            
            return {
                ...row,
                paint_properties: cleanedPaintProperties,
                filter_properties: row.filter_properties || null
            };
        });

        res.json({
            success: true,
            data: styles
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Unable to load layer styles. Please try again later.'
        });
    }
};

const createLayerStyle = async (req, res) => {
    try {
        const { layer_id, layer_type, paint_properties, filter_properties } = req.body;

        if (!layer_id || !layer_type || !paint_properties) {
            return res.status(400).json({
                success: false,
                message: 'Required fields are missing.'
            });
        }

        // Handle paint_properties properly - ensure it's valid JSON
        let processedPaintProperties = {};
        if (paint_properties && typeof paint_properties === 'object') {
            processedPaintProperties = paint_properties;
        } else if (paint_properties && typeof paint_properties === 'string' && paint_properties.trim() !== '') {
            try {
                processedPaintProperties = JSON.parse(paint_properties);
            } catch (e) {
                processedPaintProperties = {};
            }
        }

        // Handle filter_properties properly - ensure it's valid JSON or null
        let processedFilterProperties = null;
        if (filter_properties && typeof filter_properties === 'object') {
            // Convert object to JSON string for PostgreSQL
            try {
                processedFilterProperties = JSON.stringify(filter_properties);
            } catch (e) {
                console.warn('Invalid filter_properties object, setting to null:', filter_properties);
                processedFilterProperties = null;
            }
        } else if (filter_properties && typeof filter_properties === 'string' && filter_properties.trim() !== '') {
            try {
                // Validate the string is valid JSON
                JSON.parse(filter_properties);
                processedFilterProperties = filter_properties;
            } catch (e) {
                console.warn('Invalid filter_properties JSON string, setting to null:', filter_properties);
                processedFilterProperties = null;
            }
        }

        const result = await db.query(`
            INSERT INTO layer_styles (layer_id, layer_type, paint_properties, filter_properties)
            VALUES ($1, $2, $3, $4)
            RETURNING id
        `, [
            layer_id,
            layer_type,
            processedPaintProperties,
            processedFilterProperties
        ]);

        res.status(201).json({
            success: true,
            message: 'Layer style created successfully.',
            data: { id: result.rows[0].id }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Unable to create layer style. Please try again later.'
        });
    }
};

    // Update layer style
const updateLayerStyle = async (req, res) => {
    try {
        const { id } = req.params;
        const { layer_id, layer_type, paint_properties, filter_properties, is_active } = req.body;



        // Handle paint_properties properly - ensure it's valid JSON
        let processedPaintProperties = {};
        if (paint_properties && typeof paint_properties === 'object') {
            processedPaintProperties = paint_properties;
        } else if (paint_properties && typeof paint_properties === 'string' && paint_properties.trim() !== '') {
            try {
                processedPaintProperties = JSON.parse(paint_properties);
            } catch (e) {
                console.warn('Invalid paint_properties JSON, using empty object:', paint_properties);
                processedPaintProperties = {};
            }
        }

        // Handle filter_properties properly - ensure it's valid JSON or null
        let processedFilterProperties = null;
        if (filter_properties && typeof filter_properties === 'object') {
            // Convert object to JSON string for PostgreSQL
            try {
                processedFilterProperties = JSON.stringify(filter_properties);
            } catch (e) {
                console.warn('Invalid filter_properties object, setting to null:', filter_properties);
                processedFilterProperties = null;
            }
        } else if (filter_properties && typeof filter_properties === 'string' && filter_properties.trim() !== '') {
            try {
                // Validate the string is valid JSON
                JSON.parse(filter_properties);
                processedFilterProperties = filter_properties;
            } catch (e) {
                console.warn('Invalid filter_properties JSON string, setting to null:', filter_properties);
                processedFilterProperties = null;
            }
        }

        const result = await db.query(`
            UPDATE layer_styles 
            SET 
                layer_id = $1,
                layer_type = $2,
                paint_properties = $3,
                filter_properties = $4,
                is_active = $5
            WHERE id = $6
        `, [
            layer_id,
            layer_type,
            processedPaintProperties,
            processedFilterProperties,
            is_active !== undefined ? is_active : true,
            id
        ]);

        if (result.rowCount === 0) {
            return res.status(404).json({
                success: false,
                message: 'Layer style not found.'
            });
        }

        res.json({
            success: true,
            message: 'Layer style updated successfully.'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Unable to update layer style. Please try again later.'
        });
    }
};

// Delete layer style (soft delete)
const deleteLayerStyle = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await db.query(`
            UPDATE layer_styles 
            SET is_active = false
            WHERE id = $1
        `, [id]);

        if (result.rowCount === 0) {
            return res.status(404).json({
                success: false,
                message: 'Layer style not found.'
            });
        }

        res.json({
            success: true,
            message: 'Layer style deleted successfully.'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Unable to delete layer style. Please try again later.'
        });
    }
};

// Label Styles Functions
const getLabelStyles = async (req, res) => {
    try {
        // First, check if the label_styles table exists
        const tableExists = await db.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'label_styles'
            );
        `);

        if (!tableExists.rows[0].exists) {
            // Table doesn't exist, return default styles
            const defaultStyles = {
                'place-country-label': {
                    textColor: '#5a5757',
                    textSize: { min: 8, max: 22 },
                    textFont: 'DIN Pro Bold',
                    textHaloColor: 'rgba(255,255,255,1)',
                    textHaloWidth: 1.5,
                    textOpacity: 1.0,
                    minZoom: 1,
                    maxZoom: 10
                },
                'place-state-label': {
                    textColor: '#627bc1',
                    textSize: { min: 9, max: 16 },
                    textFont: 'DIN Pro Bold',
                    textHaloColor: 'rgba(255,255,255,1)',
                    textHaloWidth: 1.2,
                    textOpacity: 1.0,
                    minZoom: 3,
                    maxZoom: 9
                },
                'place-capital-label': {
                    textColor: '#2d2d2d',
                    textSize: { min: 14, max: 32 },
                    textFont: 'DIN Pro Bold',
                    textHaloColor: 'rgba(255,255,255,1)',
                    textHaloWidth: 2.0,
                    textOpacity: 1.0,
                    minZoom: 2,
                    maxZoom: 15
                },
                'place-city-major-label': {
                    textColor: '#2d2d2d',
                    textSize: { min: 12, max: 30 },
                    textFont: 'DIN Pro Bold',
                    textHaloColor: 'rgba(255,255,255,1)',
                    textHaloWidth: 1.5,
                    textOpacity: 1.0,
                    minZoom: 3,
                    maxZoom: 16
                },
                'place-city-medium-label': {
                    textColor: '#5a5757',
                    textSize: { min: 10, max: 20 },
                    textFont: 'DIN Pro Bold',
                    textHaloColor: 'rgba(255,255,255,1)',
                    textHaloWidth: 1.2,
                    textOpacity: 1.0,
                    minZoom: 5,
                    maxZoom: 16
                },
                'place-city-small-label': {
                    textColor: '#777777',
                    textSize: { min: 10, max: 14 },
                    textFont: 'DIN Pro Bold',
                    textHaloColor: 'rgba(255,255,255,1)',
                    textHaloWidth: 1.2,
                    textOpacity: 1.0,
                    minZoom: 7,
                    maxZoom: 16
                },
                'place-village-label': {
                    textColor: '#888888',
                    textSize: { min: 9, max: 12 },
                    textFont: 'DIN Pro Bold',
                    textHaloColor: 'rgba(255,255,255,1)',
                    textHaloWidth: 1.2,
                    textOpacity: 1.0,
                    minZoom: 9,
                    maxZoom: 18
                },
                'road-label-motorway': {
                    textColor: '#ffffff',
                    textSize: { min: 8, max: 14 },
                    textFont: 'DIN Pro Bold',
                    textHaloColor: 'transparent',
                    textHaloWidth: 0,
                    textOpacity: 1.0,
                    minZoom: 6,
                    maxZoom: 22
                },
                'road-label-trunk': {
                    textColor: '#000000',
                    textSize: { min: 8, max: 14 },
                    textFont: 'DIN Pro Bold',
                    textHaloColor: 'transparent',
                    textHaloWidth: 0,
                    textOpacity: 1.0,
                    minZoom: 8,
                    maxZoom: 22
                },
                'road-label-primary': {
                    textColor: '#000000',
                    textSize: { min: 8, max: 14 },
                    textFont: 'DIN Pro Bold',
                    textHaloColor: 'transparent',
                    textHaloWidth: 0,
                    textOpacity: 1.0,
                    minZoom: 10,
                    maxZoom: 22
                },
                'road-label-secondary': {
                    textColor: '#000000',
                    textSize: { min: 8, max: 14 },
                    textFont: 'DIN Pro Medium',
                    textHaloColor: 'transparent',
                    textHaloWidth: 0,
                    textOpacity: 1.0,
                    minZoom: 11,
                    maxZoom: 22
                },
                'road-label-tertiary': {
                    textColor: '#333333',
                    textSize: { min: 9, max: 15 },
                    textFont: 'DIN Pro Medium',
                    textHaloColor: 'transparent',
                    textHaloWidth: 0,
                    textOpacity: 1.0,
                    minZoom: 12,
                    maxZoom: 22
                },
                'road-label-street': {
                    textColor: '#5a5757',
                    textSize: { min: 9, max: 15 },
                    textFont: 'DIN Pro Regular',
                    textHaloColor: 'transparent',
                    textHaloWidth: 0,
                    textOpacity: 1.0,
                    minZoom: 13,
                    maxZoom: 22
                },
                'road-label-service': {
                    textColor: '#777777',
                    textSize: { min: 8, max: 14 },
                    textFont: 'DIN Pro Regular',
                    textHaloColor: 'transparent',
                    textHaloWidth: 0,
                    textOpacity: 1.0,
                    minZoom: 14,
                    maxZoom: 22
                },
                'road-label-path': {
                    textColor: '#888888',
                    textSize: { min: 8, max: 14 },
                    textFont: 'DIN Pro Regular',
                    textHaloColor: 'transparent',
                    textHaloWidth: 0,
                    textOpacity: 1.0,
                    minZoom: 15,
                    maxZoom: 22
                },
                'road-label-track': {
                    textColor: '#999999',
                    textSize: { min: 8, max: 14 },
                    textFont: 'DIN Pro Regular',
                    textHaloColor: 'transparent',
                    textHaloWidth: 0,
                    textOpacity: 1.0,
                    minZoom: 16,
                    maxZoom: 22
                }
            };

            return res.json({
                success: true,
                styles: defaultStyles,
                lastModified: new Date().toISOString()
            });
        }

        const { rows } = await db.query(`
            SELECT 
                layer_id,
                layer_name,
                layer_category,
                text_color,
                text_size_min,
                text_size_max,
                text_font,
                text_halo_color,
                text_halo_width,
                text_opacity,
                min_zoom,
                max_zoom
            FROM label_styles 
            WHERE is_active = true 
            ORDER BY layer_category, layer_id
        `);

        // Convert to the format expected by the frontend
        const styles = {};
        rows.forEach(row => {
            styles[row.layer_id] = {
                textColor: row.text_color,
                textSize: {
                    min: parseInt(row.text_size_min),
                    max: parseInt(row.text_size_max)
                },
                textFont: row.text_font,
                textHaloColor: row.text_halo_color,
                textHaloWidth: parseFloat(row.text_halo_width),
                textOpacity: parseFloat(row.text_opacity),
                minZoom: parseInt(row.min_zoom),
                maxZoom: parseInt(row.max_zoom)
            };
        });

        res.json({
            success: true,
            styles: styles,
            lastModified: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Unable to load label styles. Please try again later.'
        });
    }
};

const saveLabelStyles = async (req, res) => {
    try {
        const { styles } = req.body;
        const userId = req.user?.id;

        if (!styles || typeof styles !== 'object') {
            return res.status(400).json({
                success: false,
                message: 'Invalid styles data provided.'
            });
        }

        // Check if the label_styles table exists
        const tableExists = await db.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'label_styles'
            );
        `);

        if (!tableExists.rows[0].exists) {
            // Table doesn't exist, but return success to allow frontend to work
            console.warn('Label styles table does not exist. Returning success without saving.');
            return res.json({
                success: true,
                message: 'Label styles saved successfully (table not found, skipped database save).'
            });
        }

        // Begin transaction
        await db.query('BEGIN');

        try {
            // Update each layer style
            for (const [layerId, styleData] of Object.entries(styles)) {
                await db.query(`
                    UPDATE label_styles 
                    SET 
                        text_color = $1,
                        text_size_min = $2,
                        text_size_max = $3,
                        text_font = $4,
                        text_halo_color = $5,
                        text_halo_width = $6,
                        text_opacity = $7,
                        min_zoom = $8,
                        max_zoom = $9,
                        updated_by = $10,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE layer_id = $11 AND is_active = true
                `, [
                    styleData.textColor,
                    parseInt(styleData.textSize?.min) || 8,
                    parseInt(styleData.textSize?.max) || 24,
                    styleData.textFont,
                    styleData.textHaloColor,
                    parseFloat(styleData.textHaloWidth) || 1.0,
                    parseFloat(styleData.textOpacity) || 1.0,
                    parseInt(styleData.minZoom) || 0,
                    parseInt(styleData.maxZoom) || 22,
                    userId,
                    layerId
                ]);
            }

            // Commit transaction
            await db.query('COMMIT');

            res.json({
                success: true,
                message: 'Label styles saved successfully.'
            });
        } catch (error) {
            // Rollback transaction
            await db.query('ROLLBACK');
            throw error;
        }
    } catch (error) {
        console.error('Error saving label styles:', error);
        res.status(500).json({
            success: false,
            message: 'Unable to save label styles. Please try again later.'
        });
    }
};

const resetLabelStyles = async (req, res) => {
    try {
        const userId = req.user?.id;

        // Check if the label_styles table exists
        const tableExists = await db.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'label_styles'
            );
        `);

        if (!tableExists.rows[0].exists) {
            // Table doesn't exist, but return success to allow frontend to work
            console.warn('Label styles table does not exist. Returning success without resetting.');
            return res.json({
                success: true,
                message: 'Label styles reset successfully (table not found, skipped database reset).'
            });
        }

        // Reset all label styles to default values
        await db.query(`
            UPDATE label_styles 
            SET 
                text_color = CASE layer_id
                    WHEN 'place-country-label' THEN '#2d2d2d'
                    WHEN 'place-state-label' THEN '#627bc1'
                    WHEN 'place-capital-label' THEN '#2d2d2d'
                    WHEN 'place-city-major-label' THEN '#2d2d2d'
                    WHEN 'place-city-medium-label' THEN '#2d2d2d'
                    WHEN 'place-city-small-label' THEN '#2d2d2d'
                    WHEN 'place-village-label' THEN '#888888'
                    WHEN 'road-label-motorway' THEN '#ffffff'
                    WHEN 'road-label-trunk' THEN '#ffffff'
                    WHEN 'road-label-primary' THEN '#2d2d2d'
                    WHEN 'road-label-secondary' THEN '#2d2d2d'
                    WHEN 'road-label-tertiary' THEN '#333333'
                    WHEN 'road-label-street' THEN '#5a5757'
                    WHEN 'road-label-service' THEN '#777777'
                    WHEN 'road-label-path' THEN '#888888'
                    WHEN 'road-label-track' THEN '#999999'
                    ELSE text_color
                END,
                text_size_min = CASE layer_id
                    WHEN 'place-country-label' THEN 8
                    WHEN 'place-state-label' THEN 9
                    WHEN 'place-capital-label' THEN 18
                    WHEN 'place-city-major-label' THEN 12
                    WHEN 'place-city-medium-label' THEN 10
                    WHEN 'place-city-small-label' THEN 9
                    WHEN 'place-village-label' THEN 8
                    WHEN 'road-label-motorway' THEN 10
                    WHEN 'road-label-trunk' THEN 10
                    WHEN 'road-label-primary' THEN 9
                    WHEN 'road-label-secondary' THEN 8
                    WHEN 'road-label-tertiary' THEN 9
                    WHEN 'road-label-street' THEN 9
                    WHEN 'road-label-service' THEN 8
                    WHEN 'road-label-path' THEN 8
                    WHEN 'road-label-track' THEN 8
                    ELSE text_size_min
                END,
                text_size_max = CASE layer_id
                    WHEN 'place-country-label' THEN 22
                    WHEN 'place-state-label' THEN 16
                    WHEN 'place-capital-label' THEN 32
                    WHEN 'place-city-major-label' THEN 30
                    WHEN 'place-city-medium-label' THEN 18
                    WHEN 'place-city-small-label' THEN 14
                    WHEN 'place-village-label' THEN 12
                    WHEN 'road-label-motorway' THEN 16
                    WHEN 'road-label-trunk' THEN 16
                    WHEN 'road-label-primary' THEN 14
                    WHEN 'road-label-secondary' THEN 13
                    WHEN 'road-label-tertiary' THEN 15
                    WHEN 'road-label-street' THEN 15
                    WHEN 'road-label-service' THEN 14
                    WHEN 'road-label-path' THEN 14
                    WHEN 'road-label-track' THEN 14
                    ELSE text_size_max
                END,
                text_font = CASE layer_id
                    WHEN 'road-label-primary' THEN 'DIN Pro Medium'
                    WHEN 'road-label-secondary' THEN 'DIN Pro Medium'
                    WHEN 'road-label-tertiary' THEN 'DIN Pro Medium'
                    WHEN 'road-label-street' THEN 'DIN Pro Regular'
                    WHEN 'road-label-service' THEN 'DIN Pro Regular'
                    WHEN 'road-label-path' THEN 'DIN Pro Regular'
                    WHEN 'road-label-track' THEN 'DIN Pro Regular'
                    ELSE 'DIN Pro Bold'
                END,
                updated_by = $1,
                updated_at = CURRENT_TIMESTAMP
            WHERE is_active = true
        `, [userId]);

        res.json({
            success: true,
            message: 'Label styles reset to defaults successfully.'
        });
    } catch (error) {
        console.error('Error resetting label styles:', error);
        res.status(500).json({
            success: false,
            message: 'Unable to reset label styles. Please try again later.'
        });
    }
};

export {
    getLayerStyles,
    createLayerStyle,
    updateLayerStyle,
    deleteLayerStyle,
    getLabelStyles,
    saveLabelStyles,
    resetLabelStyles
};