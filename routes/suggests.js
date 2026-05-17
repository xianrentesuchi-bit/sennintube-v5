const express = require('express');
const router = express.Router();
const axios = require('axios');

router.get('/', async (req, res) => {
    const query = req.query.q;
    try {
        const response = await axios.get(`https://suggestqueries.google.com/complete/search?client=firefox&hl=ja&q=${encodeURIComponent(query)}`, {
            responseType: 'arraybuffer' // バイナリデータとして受け取る
        });
        
        // UTF-8文字列にデコードする
        const decoder = new TextDecoder('utf-8');
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
