import { defineTool } from '@deepseek-ai/dsh-tools'

export const name = 'dsh-meme-wiki'
export const inject = ['tools']

export function apply(ctx) {
  ctx.tools.register(defineTool({
    name: 'search_meme_wiki',
    description: '查询中文网络梗的含义、来源和用法',
    parameters: {
      keyword: { type: 'string', required: true, description: '梗关键词' }
    },
    output: { type: 'string' },
    execute: async ({ keyword }) => {
      const res = await fetch(`https://cnmeme.wiki/api/v1/public/memes?q=${encodeURIComponent(keyword)}&limit=5`)
      const list = await res.json()
      if (!list.items?.length) return '未找到相关词条。'
      const detail = await fetch(`https://cnmeme.wiki/api/v1/public/memes/${encodeURIComponent(list.items[0].slug)}`)
      const item = (await detail.json()).item
      const plain = (item.content_html || '').replace(/<[^>]+>/g, '').trim()
      return `【${item.title}】\n${item.summary}\n\n${plain.slice(0, 3000)}`
    }
  }))
}
