const express = require('express');
const router = express.Router();

router.get('/help', (req, res) => {
    res.render('tool/help');
});

router.get('/login', (req, res) => {
    res.render('taisaku/login');
});

module.exports = router;
