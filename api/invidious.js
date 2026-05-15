const axios = require('axios');
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
            const res = await axios.get(`${baseUrl}${endpoint}`, { timeout: 5000 });
            
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
            const res = await axios.get(`${baseUrl}/videos/${videoId}`, { timeout: 5000 });
            if (res.data) {
                return res.data;
            }
            throw new Error('No data');
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
