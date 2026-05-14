const { getYouTube } = require('../youtube');
const axios = require('axios');
const { INSTANCE } = require('../invidious');

async function getChannelInfo(channelId) {
    for (let url of INSTANCE) {
        try {
            const baseUrl = url.endsWith('/') ? url.slice(0, -1) : url;
            const res = await axios.get(`${baseUrl}/api/v1/channels/${channelId}`, { timeout: 4000 });
            if (res.data) {
                const c = res.data;
                // インスタンスによって動画リストのキーが異なる場合に対応
                const rawVideos = c.latestVideos || c.videos || [];
                return {
                    name: c.author || "Unknown Channel",
                    thumbnail: (c.authorThumbnails && c.authorThumbnails.length > 0) ? c.authorThumbnails[c.authorThumbnails.length - 1].url : "",
                    subscribers: c.subCountText || "0",
                    banner: (c.authorBanners && c.authorBanners.length > 0) ? c.authorBanners[0].url : "",
                    videos: rawVideos.map(v => ({
                        videoId: v.videoId,
                        title: v.title,
                        videoThumbnails: v.videoThumbnails || [{ url: `https://i.ytimg.com/vi/${v.videoId}/mqdefault.jpg` }],
                        viewCountText: v.viewCountText || "",
                        publishedText: v.publishedText || ""
                    })),
                    comments: c.comments || []
                };
            }
        } catch (e) {
            continue;
        }
    }

    try {
        const yt = await getYouTube();
        const channel = await yt.getChannel(channelId);
        
        // YouTube.jsの最新のデータ構造に合わせて抽出
        const videosData = channel.videos || [];
        
        return {
            name: channel.metadata.title || "Unknown Channel",
            thumbnail: channel.metadata.thumbnail?.[0]?.url || "",
            subscribers: channel.header?.subscribers?.toString() || "0",
            banner: channel.header?.banner?.thumbnails?.[0]?.url || "",
            videos: videosData.map(v => ({
                videoId: v.id || v.videoId,
                title: v.title?.toString() || "",
                videoThumbnails: [{ url: v.thumbnail?.[0]?.url || `https://i.ytimg.com/vi/${v.id}/mqdefault.jpg` }],
                viewCountText: v.view_count?.toString() || v.short_view_count?.toString() || "",
                publishedText: v.published?.toString() || ""
            })),
            comments: [] 
        };
    } catch (e) {
        console.error(e);
        return null;
    }
}

module.exports = getChannelInfo;
