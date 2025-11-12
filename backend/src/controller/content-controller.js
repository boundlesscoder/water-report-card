import { db } from '../config/db.js';

// Get all content sections
export const getAllContent = async (req, res) => {
    if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        const { rows } = await db.query(`
            SELECT 
                id,
                section_name,
                section_type,
                title,
                content,
                image_url,
                order_index,
                is_active,
                created_at,
                updated_at
            FROM content_sections 
            ORDER BY order_index ASC
        `);

        res.json({ content: rows });
    } catch (error) {
        console.error('Error fetching content:', error);
        res.status(500).json({ error: 'Unable to load content. Please try again later.' });
    }
};

// Get single content section
export const getContentById = async (req, res) => {
    if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        const { id } = req.params;
        const { rows } = await db.query(
            'SELECT * FROM content_sections WHERE id = $1',
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Content not found' });
        }

        res.json({ content: rows[0] });
    } catch (error) {
        console.error('Error fetching content:', error);
        res.status(500).json({ error: 'Unable to load content. Please try again later.' });
    }
};

// Create new content section
export const createContent = async (req, res) => {
    if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        const { 
            section_name, 
            section_type, 
            title, 
            content, 
            image_url, 
            order_index,
            is_active = true 
        } = req.body;

        // Get the highest order_index and add 1
        const { rows: maxOrder } = await db.query(
            'SELECT COALESCE(MAX(order_index), 0) as max_order FROM content_sections'
        );
        const newOrderIndex = order_index || maxOrder[0].max_order + 1;

        const { rows } = await db.query(`
            INSERT INTO content_sections 
            (section_name, section_type, title, content, image_url, order_index, is_active)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *
        `, [section_name, section_type, title, content, image_url, newOrderIndex, is_active]);

        res.status(201).json({ content: rows[0] });
    } catch (error) {
        console.error('Error creating content:', error);
        res.status(500).json({ error: 'Unable to create content. Please try again later.' });
    }
};

// Update content section
export const updateContent = async (req, res) => {
    if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        const { id } = req.params;
        const { 
            section_name, 
            section_type, 
            title, 
            content, 
            image_url, 
            order_index,
            is_active 
        } = req.body;

        const { rows } = await db.query(`
            UPDATE content_sections 
            SET 
                section_name = COALESCE($1, section_name),
                section_type = COALESCE($2, section_type),
                title = COALESCE($3, title),
                content = COALESCE($4, content),
                image_url = COALESCE($5, image_url),
                order_index = COALESCE($6, order_index),
                is_active = COALESCE($7, is_active),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $8
            RETURNING *
        `, [section_name, section_type, title, content, image_url, order_index, is_active, id]);

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Content not found' });
        }

        res.json({ content: rows[0] });
    } catch (error) {
        console.error('Error updating content:', error);
        res.status(500).json({ error: 'Unable to update content. Please try again later.' });
    }
};

// Delete content section
export const deleteContent = async (req, res) => {
    if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        const { id } = req.params;
        const { rows } = await db.query(
            'DELETE FROM content_sections WHERE id = $1 RETURNING *',
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Content not found' });
        }

        res.json({ message: 'Content deleted successfully' });
    } catch (error) {
        console.error('Error deleting content:', error);
        res.status(500).json({ error: 'Unable to delete content. Please try again later.' });
    }
};

// Update content order (drag and drop)
export const updateContentOrder = async (req, res) => {
    if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        const { contentOrder } = req.body; // Array of { id, order_index }

        // Use a transaction to update all order indexes
        await db.query('BEGIN');

        for (const item of contentOrder) {
            await db.query(
                'UPDATE content_sections SET order_index = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
                [item.order_index, item.id]
            );
        }

        await db.query('COMMIT');

        res.json({ message: 'Content order updated successfully' });
    } catch (error) {
        await db.query('ROLLBACK');
        console.error('Error updating content order:', error);
        res.status(500).json({ error: 'Unable to update content order. Please try again later.' });
    }
};

// Get public content (for frontend)
export const getPublicContent = async (req, res) => {
    try {
        const { rows } = await db.query(`
            SELECT 
                id,
                section_name,
                section_type,
                title,
                content,
                image_url,
                order_index
            FROM content_sections 
            WHERE is_active = true
            ORDER BY order_index ASC
        `);

        res.json({ content: rows });
    } catch (error) {
        console.error('Error fetching public content:', error);
        res.status(500).json({ error: 'Unable to load public content. Please try again later.' });
    }
}; 