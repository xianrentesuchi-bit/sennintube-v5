const express = require('express');
const router = express.Router();
const getChannelInfo = require('../api/youtube/channelinfo');

router.get('/:id', async (req, res) => {
    const channelId = req.params.id;
    const sortBy = req.query.sort_by || 'newest';
    const forceInstance = req.query.force_instance || null;

    const channelInfo = await getChannelInfo(channelId, sortBy, forceInstance);
    if (!channelInfo) return res.status(404).send('Channel Not Found');
    res.render('channel', { channelInfo });
});

module.exports = router;
