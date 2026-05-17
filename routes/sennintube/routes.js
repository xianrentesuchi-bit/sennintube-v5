const express = require('express');
const router = express.Router();

const stickmanRouter = require('./sennintube/game/server/stickman.js');

router.get('/help', (req, res) => {
    res.render('tool/help');
});

router.get('/login', (req, res) => {
    res.render('taisaku/login');
});

router.use('/game/stickman', stickmanRouter);

router.get('/gamemanu', (req, res) => {
    res.render('tool/game');
});

module.exports = router;
