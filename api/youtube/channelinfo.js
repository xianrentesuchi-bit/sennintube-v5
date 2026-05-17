const { getYouTube } = require('../youtube');
const axios = require('axios');
const http = require('http');
const https = require('https');
const { INSTANCE } = require('../invidious');

// コネクションを使い回すためのエージェント設定（DNS解決・TCPハンドシェイクを高速化）
const httpAgent = new http.Agent({ keepAlive: true });
const httpsAgent = new https.Agent({ keepAlive: true });

async function getChannelInfo(channelId) {
    // 全インスタンスを同時に叩いて最速で適切なものを取得するロジック
    const promises = INSTANCE.map(async (url) => {
        try {
            const baseUrl = url.endsWith('/') ? url.slice(0, -1) : url;
            // エンドポイント重複を避けるため、baseUrl がすでに /api/v1 を含んでいるか確認して適切に結合
            const targetUrl = baseUrl.endsWith('/api/v1') 
                ? `${baseUrl}/channels/${channelId}` 
                : `${baseUrl}/api/v1/channels/${channelId}`;

            const res = await axios.get(targetUrl, { 
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
            throw new Error('No data received');
        } catch (e) {
            throw e;
        }
    });

    try {
        return await Promise.any(promises);
    } catch (e) {
        // 全てのインスタンスが失敗した場合のフォールバック: YouTube.js (youtubei.js)
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
        } catch (err) {
            console.error("Channel Fetch Error:", err);
            return null;
        }
    }
}

module.exports = getChannelInfo;
