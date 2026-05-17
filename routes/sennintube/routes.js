const express = require('express');
const router = express.Router();

router.get('/help', (req, res) => {
    res.render('tool/help');
});

module.exports = router;

