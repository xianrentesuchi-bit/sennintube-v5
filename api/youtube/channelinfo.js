const { getYouTube } = require('../youtube');
const axios = require('axios');
const http = require('http');
const https = require('https');
const { INSTANCE } = require('../invidious');

// コネクションを使い回すためのエージェント設定（DNS解決・TCPハンドシェイクを高速化）
const httpAgent = new http.Agent({ keepAlive: true });
const httpsAgent = new https.Agent({ keepAlive: true });

const axiosClient = axios.create({
    timeout: 4000,
    httpAgent,
    httpsAgent
});

async function fetchFromInstance(baseUrl, endpoint, params = {}) {
    const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    const targetUrl = cleanBaseUrl.endsWith('/api/v1') 
        ? `${cleanBaseUrl}${endpoint}` 
        : `${cleanBaseUrl}/api/v1${endpoint}`;
    
    const res = await axiosClient.get(targetUrl, { params });
    return res.data;
}

async function getChannelInfo(channelId, sortBy = 'newest', forceInstance = null) {
    let instances = [];
    if (forceInstance) {
        instances = [forceInstance, ...INSTANCE.filter(i => i !== forceInstance)];
    } else {
        instances = [...INSTANCE].sort(() => Math.random() - 0.5);
    }

    // 複数のインビディアスインスタンスを順に試し、最速で応答するものを探す（Race/Any構造の維持）
    const promises = instances.map(async (url) => {
        try {
            // 参考元と同じく Promise.allSettled を使用して各エンドポイントから並行取得
            const results = await Promise.allSettled([
                fetchFromInstance(url, `/channels/${channelId}`, { sort_by: sortBy }),
                fetchFromInstance(url, `/channels/${channelId}/community`)
            ]);

            const channelData = results[0].status === 'fulfilled' ? results[0].value : null;
            const communityData = results[1].status === 'fulfilled' ? results[1].value : null;

            // 厳密なバリデーション：メインデータが存在し、かつチャンネル名が正常に取得できている場合のみ採用
            if (channelData && channelData.author && channelData.author !== "Unknown Channel") {
                const rawVideos = channelData.latestVideos || channelData.videos || [];
                const authorName = channelData.author;

                let authorIcon = "";
                if (channelData.authorThumbnails && channelData.authorThumbnails.length > 0) {
                    authorIcon = channelData.authorThumbnails[channelData.authorThumbnails.length - 1].url;
                }

                const rawComments = (communityData && communityData.comments) ? communityData.comments : [];
                const comments = rawComments.map(post => {
                    const rawContent = post.contentHtml || '';
                    return {
                        id: post.commentId || '',
                        content: rawContent.replace(/\n/g, '<br>'),
                        published_text: post.publishedText || '',
                        likes: post.likeCount || 0,
                        author: authorName,
                        author_icon: authorIcon
                    };
                });

                return {
                    name: authorName,
                    thumbnail: authorIcon,
                    subscribers: channelData.subCountText || "非公開",
                    banner: (channelData.authorBanners && channelData.authorBanners.length > 0) ? channelData.authorBanners[0].url : "",
                    videos: rawVideos.map(v => ({
                        videoId: v.videoId,
                        title: v.title,
                        videoThumbnails: v.videoThumbnails || [{ url: `https://i.ytimg.com/vi/${v.videoId}/mqdefault.jpg` }],
                        viewCountText: v.viewCountText || "",
                        publishedText: v.publishedText || ""
                    })),
                    comments: comments
                };
            }
            throw new Error('Incomplete channel data from this instance');
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
