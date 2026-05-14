const { getYouTube } = require('../youtube');
const axios = require('axios');
const { INSTANCE } = require('../invidious');

async function getChannelInfo(channelId) {
    // Invidious API 経由での取得を試行
    for (let url of INSTANCE) {
        try {
            const baseUrl = url.endsWith('/') ? url.slice(0, -1) : url;
            // APIエンドポイントに /api/v1/ を明示的に追加
            const res = await axios.get(`${baseUrl}/api/v1/channels/${channelId}`, { timeout: 4000 });
            if (res.data) {
                const c = res.data;
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

    // フォールバック: YouTube.js (youtubei.js)
    try {
        const yt = await getYouTube();
        const channel = await yt.getChannel(channelId);

        // 参考元の構造に基づいたメタデータ抽出
        const metadata = channel.metadata ?? {};
        const header = channel.header ?? {};
        
        // 動画タブから動画一覧を取得
        const videos_tab = await channel.getVideos();
        const videosData = videos_tab.videos ?? [];
        
        return {
            name: metadata.title ?? "Unknown Channel",
            thumbnail: metadata.avatar?.[0]?.url ?? "",
            subscribers: header.subscribers?.toString() ?? "0",
            banner: header.banner?.[0]?.url ?? "",
            videos: videosData.map(v => ({
                videoId: v.id ?? v.video_id ?? "",
                title: v.title?.text ?? v.title?.toString() ?? "",
                videoThumbnails: [{ url: v.thumbnails?.[0]?.url ?? `https://i.ytimg.com/vi/${v.id || v.video_id}/mqdefault.jpg` }],
                viewCountText: v.short_view_count?.text ?? v.view_count?.toString() ?? "",
                publishedText: v.published?.text ?? v.published?.toString() ?? ""
            })),
            comments: [] 
        };
    } catch (e) {
        console.error("Channel Fetch Error:", e);
        return null;
    }
}

module.exports = getChannelInfo;
