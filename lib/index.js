import { defineTool } from '@deepseek-ai/dsh-tools'

export const name = 'dsh-cnmeme'
export const inject = ['tools']

const BASE = 'https://cnmeme.wiki'

async function fetchJson(path, timeoutMs = 10000) {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(BASE + path, {
      credentials: 'omit',
      signal: ctrl.signal,
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return await res.json()
  } finally {
    clearTimeout(timer)
  }
}

export function apply(ctx) {
  ctx.tools.register(defineTool({
    name: 'search_meme_wiki',
    description: '搜索网络梗/黑话的词条。输入关键词，返回匹配的词条标题、摘要和标签。',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string', description: '要搜索的梗关键词，如“热梗”“猫猫牙败”' },
        limit: { type: 'number', description: '返回条数，默认 5，最大 10' },
      },
      required: ['query'],
    },
    output: { type: 'string' },
    async execute(args) {
      const limit = Math.min(Math.max(args.limit ?? 5, 1), 10)
      const params = new URLSearchParams({
        q: args.query,
        limit: String(limit),
      })
      try {
        const data = await fetchJson(`/api/v1/public/memes?${params}`)
        if (!data.items?.length) return '未找到相关梗词条。'
        return data.items.map((item, i) =>
          `${i + 1}. ${item.title}\n摘要：${item.summary}\n标签：${(item.tags || []).join('、') || '无'}`
        ).join('\n\n')
      } catch (err) {
        return `查询失败：${err.message}`
      }
    },
  }))
}
