const express = require('express');
const router = express.Router();
const { stream } = require('undici');

router.get('/:file(*)?', async (req, res) => {
    const fileName = req.params.file || 'index.html';
    
    const targetUrl = `https://gitlab.com/Hikari_5544-1/StickmanHook/-/raw/gh-pages/${fileName}?ref_type=heads`;

    try {
        await stream(targetUrl, {
            method: 'GET',
            maxRedirections: 3,
        }, ({ statusCode, headers }) => {
            if (statusCode !== 200) {
                res.status(statusCode).send('Resource not found');
                return;
            }

            let contentType = headers['content-type'];
            if (fileName.endsWith('.html')) {
                contentType = 'text/html';
            } else if (fileName.endsWith('.js')) {
                contentType = 'application/javascript';
            } else if (fileName.endsWith('.css')) {
                contentType = 'text/css';
            } else if (fileName.endsWith('.wasm')) {
                contentType = 'application/wasm';
            } else if (fileName.endsWith('.json')) {
                contentType = 'application/json';
            } else if (fileName.endsWith('.png')) {
                contentType = 'image/png';
            } else if (fileName.endsWith('.jpg') || fileName.endsWith('.jpeg')) {
                contentType = 'image/jpeg';
            }

            if (contentType) {
                res.setHeader('Content-Type', contentType);
            }
            
            res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
            
            return res;
        });
    } catch (error) {
        console.error(`[Stickman Proxy Error] ${error.message}`);
        if (!res.headersSent) {
            res.status(500).send('Internal Server Error');
        }
    }
});

module.exports = router;
