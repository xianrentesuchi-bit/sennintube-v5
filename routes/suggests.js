const express = require('express');
const router = express.Router();
const axios = require('axios');
const { TextDecoder } = require('util');

router.get('/', async (req, res) => {
    const query = req.query.q;
    try {
        const response = await axios.get(`https://suggestqueries.google.com/complete/search?client=firefox&hl=ja&q=${encodeURIComponent(query)}`, {
            responseType: 'arraybuffer' // バイナリデータとして受け取る
        });
        
        // Shift_JIS (windows-31j) 文字列としてデコードする
        const decoder = new TextDecoder('windows-31j');
        const decodedData = JSON.parse(decoder.decode(response.data));
        
        // レスポンスヘッダーに明示的に UTF-8 を指定
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.json(decodedData[1]);
    } catch (e) {
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.json([]);
    }
});

module.exports = router;
