const express = require('express');
const router = express.Router();
const { getYouTube } = require('../api/youtube');
const { searchInvidious } = require('../api/invidious');

router.get('/', async (req, res) => {
    const query = req.query.q;
    let videos = [];

    if (!query) {
        return res.redirect('/');
    }

    try {
        const invidiousResults = await searchInvidious(query);
        
        if (invidiousResults && Array.isArray(invidiousResults)) {
            videos = invidiousResults.map(v => ({
                id: v.type === 'channel' ? v.authorId : v.videoId,
                title: v.type === 'channel' ? v.author : v.title,
                type: v.type, // channel か video かを保持
                thumbnails: [{ 
                    url: `https://i.ytimg.com/vi/${v.videoId}/mqdefault.jpg` 
                }],
                author: { 
                    name: v.author || '不明なチャンネル',
                    thumbnail: v.authorThumbnails ? v.authorThumbnails[0].url : `https://ui-avatars.com/api/?name=${encodeURIComponent(v.author || 'U')}&background=random`
                }
            }));
        } else {
            throw new Error('Invidious API returned non-array data');
        }
    } catch (e) {
        try {
            const yt = await getYouTube();
            const results = await yt.search(query);
            
            // youtubei.js の結果から video または channel を抽出
            const searchData = results.contents || results.videos || [];
            
            videos = Array.isArray(searchData) ? searchData.map(v => {
                const isChannel = v.type === 'Channel';
                return {
                    id: isChannel ? v.id : (v.id || v.videoId),
                    title: isChannel ? (v.author?.name || v.name?.toString()) : (v.title?.toString() || v.title),
                    type: isChannel ? 'channel' : 'video',
                    thumbnails: [{ url: `https://i.ytimg.com/vi/${v.id || v.videoId}/mqdefault.jpg` }],
                    author: { 
                        name: v.author?.name || v.author || '不明なチャンネル',
                        thumbnail: v.author?.thumbnails ? v.author.thumbnails[0].url : `https://ui-avatars.com/api/?name=${encodeURIComponent(v.author?.name || 'U')}&background=random`
                    }
                };
            }) : [];
        } catch (ytError) {
            console.error("Backup YouTube Search Error:", ytError);
            videos = [];
        }
    }

    res.render('search', { videos, query });
});

module.exports = router;
