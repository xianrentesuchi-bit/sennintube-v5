const axios = require('axios');
const http = require('http');
const https = require('https');

// コネクションを使い回すためのエージェント設定（DNS解決・TCPハンドシェイクを高速化）
const httpAgent = new http.Agent({ keepAlive: true });
const httpsAgent = new https.Agent({ keepAlive: true });

const INSTANCE = [
    "https://iv.ggtyler.dev/api/v1",
    'https://inv.nadeko.net/api/v1',
    'https://invidious.f5.si/api/v1',
    'https://invidious.ritoge.com/api/v1',
    'https://invidious.ducks.party/api/v1',
    'https://super8.absturztau.be/api/v1',
    'https://invidious.darkness.services/api/v1',
    'https://yt.omada.cafe/api/v1',
    'https://iv.melmac.space/api/v1',
    'https://iv.duti.dev/api/v1',
];

async function fetchInvidious(endpoint) {
    const promises = INSTANCE.map(async (url) => {
        try {
            // URLの末尾にスラッシュがある場合を考慮し、適切に結合
            const baseUrl = url.endsWith('/') ? url.slice(0, -1) : url;
            const res = await axios.get(`${baseUrl}${endpoint}`, { 
                timeout: 5000,
                httpAgent,
                httpsAgent
            });
            
            // レスポンスが配列であることを確認してから返す
            if (res.data && Array.isArray(res.data)) {
                return res.data;
            }
            // 配列でない場合は次のインスタンスへ
            throw new Error('Not an array');
        } catch (e) {
            throw e;
        }
    });

    try {
        return await Promise.any(promises);
    } catch (e) {
        return null;
    }
}

async function getTrending() {
    return await fetchInvidious('/trending');
}

async function searchInvidious(query) {
    return await fetchInvidious(`/search?q=${encodeURIComponent(query)}`);
}

async function getVideoInfo(videoId) {
    const promises = INSTANCE.map(async (url) => {
        try {
            const baseUrl = url.endsWith('/') ? url.slice(0, -1) : url;
            const res = await axios.get(`${baseUrl}/videos/${videoId}`, { 
                timeout: 5000,
                httpAgent,
                httpsAgent
            });
            
            // バリデーション強化：プロパティが存在し、かつ中に配列要素が1件以上格納されているか厳密にチェック
            if (res.data && (
                (Array.isArray(res.data.formatStreams) && res.data.formatStreams.length > 0) || 
                (Array.isArray(res.data.adaptiveFormats) && res.data.adaptiveFormats.length > 0)
            )) {
                return res.data;
            }
            throw new Error('No valid streams in this instance');
        } catch (e) {
            throw e;
        }
    });

    try {
        return await Promise.any(promises);
    } catch (e) {
        return null;
    }
}

module.exports = { getTrending, searchInvidious, getVideoInfo, INSTANCE };
