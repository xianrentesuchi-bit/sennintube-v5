const { getYouTube } = require('../youtube');
const axios = require('axios');
const { INSTANCE } = require('../invidious');
const http = require('http');
const https = require('https');

// コネクションを使い回すためのエージェント設定（DNS解決・TCPハンドシェイクを高速化）
const httpAgent = new http.Agent({ keepAlive: true });
const httpsAgent = new https.Agent({ keepAlive: true });

async function getChannelInfo(channelId) {
    // Invidious API 経由での取得を試行 (すべてのインスタンスを同時に叩いて最速のものを採用)
    const promises = INSTANCE.map(async (url) => {
        try {
            let baseUrl = url.endsWith('/') ? url.slice(0, -1) : url;
            
            // 重複防止バグ修正: INSTANCE 側に既に '/api/v1' が含まれている場合は二重に追加しない
            if (!baseUrl.endsWith('/api/v1')) {
                baseUrl = `${baseUrl}/api/v1`;
            }
            
            const res = await axios.get(`${baseUrl}/channels/${channelId}`, { 
                timeout: 4000,
                httpAgent,
                httpsAgent
            });
            
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
            throw new Error('Invalid data');
        } catch (e) {
            throw e;
        }
    });

    try {
        const fastestResult = await Promise.any(promises);
        if (fastestResult) return fastestResult;
    } catch (e) {
        // すべてのインビディアスインスタンスが失敗した場合はフォールバックへ進む
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
