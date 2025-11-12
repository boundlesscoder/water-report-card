import path from 'path';
import MBTiles from '@mapbox/mbtiles';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const mbtilesPath = path.join(__dirname, '../..', 'public', 'assets', 'water_districts.mbtiles');

let mbtiles;

new MBTiles(mbtilesPath + '?mode=ro', (err, instance) => {
    if (err) {
        console.error('❌ Failed to load MBTiles:', err.message);
        process.exit(1);
    }
    mbtiles = instance;
});

export const getTile = (req, res) => {
    const { z, x, y } = req.params;

    if (!mbtiles) {
        return res.status(503).send('Tiles not ready');
    }

    mbtiles.getTile(+z, +x, +y, (err, tile) => {
        if (err || !tile) {
            return res.status(404).send('Tile not found');
        }

        res.set({
            'Content-Type': 'application/vnd.mapbox-vector-tile',
            'Content-Encoding': 'gzip',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
        });

        res.send(tile);
    });
};
