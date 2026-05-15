const { getVideoInfo } = require('./invidious');

async function getDownloadInfo(req, res) {
    const videoId = req.query.v;
    if (!videoId) {
        return res.status(400).json({ error: 'Video ID is required' });
    }
    try {
        const data = await getVideoInfo(videoId);
        if (!data) {
            return res.status(404).json({ error: 'Video info not found' });
        }
  
        res.json({
            formatStreams: data.formatStreams || [],
            adaptiveFormats: data.adaptiveFormats || []
        });
    } catch (e) {
        res.status(500).json({ error: 'Internal server error' });
    }
}

module.exports = getDownloadInfo;
