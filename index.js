const BASE = 'https://cnmeme.wiki';

async function readJson(path) {
  const res = await fetch(BASE + path, { signal: AbortSignal.timeout(10000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function searchMeme(q) {
  const params = new URLSearchParams({ q, limit: '5' });
  return readJson('/api/v1/public/memes?' + params);
}

async function getMemeDetail(slug) {
  const encoded = encodeURIComponent(slug);
  const detail = await readJson('/api/v1/public/memes/' + encoded);
  const item = detail.item;
  
  const plain = (item.content_html || '')
    .replace(/<[^>]+>/g, '\n')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\n{2,}/g, '\n')
    .trim();
    
  return {
    title: item.title,
    summary: item.summary,
    tags: item.tags,
    sourceVideo: item.source_video,
    content: plain.slice(0, 4000)
  };
}

export default {
  name: 'dsh-meme-wiki',
  tools: [{
    name: 'search_meme_wiki',
    description: '查询中文网络梗的含义、来源和用法。输入梗名称，返回词条摘要、标签和详细正文。',
    parameters: {
      type: 'object',
      properties: {
        keyword: { type: 'string', description: '要查询的梗关键词，例如“哈基米”、“狂笑的蛇将写散文”' }
      },
      required: ['keyword']
    },
    handler: async ({ keyword }) => {
      try {
        const list = await searchMeme(keyword);
        if (!list.items || !list.items.length) return { result: '未找到相关词条。' };
        
        const first = list.items[0];
        const detail = await getMemeDetail(first.slug);
        
        return {
          result: {
            标题: detail.title,
            摘要: detail.summary,
            标签: detail.tags,
            来源视频: detail.sourceVideo ? `https://www.bilibili.com/video/${detail.sourceVideo.bvid}` : null,
            正文: detail.content
          }
        };
      } catch (error) {
        return { result: `查询梗百科失败: ${error.message}` };
      }
    }
  }]
};
