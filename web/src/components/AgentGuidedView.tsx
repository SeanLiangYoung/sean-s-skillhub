import { useEffect, useMemo, useState } from 'react'
import type { MarketplaceProviderInfo } from '../types/marketplace'
import { MARKETPLACE_LINK_CATALOG } from '../data/marketplaceLinkCatalog'
import { MarketplacePageShell } from './marketplace/MarketplacePageShell'
import { MarketplaceRegistryBlock } from './marketplace/MarketplaceRegistryBlock'

const STORAGE_URLS = 'skill-hub:agent-market-urls'

interface AgentGuidedViewProps {
  providers: MarketplaceProviderInfo[]
  providerId: string
  onProviderChange: (id: string) => void
}

function defaultUrlLines(): string {
  return MARKETPLACE_LINK_CATALOG.map((e) => e.url).join('\n')
}

export function AgentGuidedView({ providers, providerId, onProviderChange }: AgentGuidedViewProps) {
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    try {
      return localStorage.getItem('skill-hub:marketplace-sidebar') !== 'closed'
    } catch {
      return true
    }
  })

  const [urlText, setUrlText] = useState(() => {
    try {
      const s = localStorage.getItem(STORAGE_URLS)
      if (s && s.trim()) return s
    } catch {}
    return defaultUrlLines()
  })

  const [keyword, setKeyword] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_URLS, urlText)
    } catch {}
  }, [urlText])

  const prompt = useMemo(() => {
    const urls = urlText
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean)
    const lines = urls.map((u) => `- ${u}`).join('\n')
    return `你是助手。请在用户给出的技能市场页面中，用浏览器或搜索工具查找与关键词相关的 Skill/技能，并列出：名称、一句话简介、若页面给出则列出安装方式或文档链接。

用户关键词：${keyword.trim() || '（请用户补充）'}

市场 URL（每行一个，用户可在 Skill Hub「智能体发现」页编辑）：
${lines || '（请补充 URL）'}

注意：部分站点需登录或为云控制台，若无法访问请说明。安装到本机后，可用 Skill Hub 扫描 ~/.claude/skills 与 ~/.cursor/skills。`
  }, [urlText, keyword])

  const copyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(prompt)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {}
  }

  const sidebar = (
    <>
      <MarketplaceRegistryBlock
        providers={providers}
        value={providerId}
        onChange={onProviderChange}
      />
      <p className="text-[11px] text-slate-600 leading-relaxed px-1">
        本页不调用远程 API，也不强制连接模型。将提示词粘贴到 Cursor / Claude Code
        对话中，由已配置的 LLM 与浏览器工具代搜。未配置 LLM 时，请改用左侧「ClawHub」等应用内市场。
      </p>
    </>
  )

  return (
    <MarketplacePageShell
      sidebar={sidebar}
      sidebarOpen={sidebarOpen}
      onToggleSidebar={() => setSidebarOpen((v) => !v)}
      toolbarLeft={<span className="text-sm text-slate-400">智能体发现（可选）</span>}
    >
      <div className="space-y-4 max-w-3xl">
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">搜索关键词（写入提示词）</label>
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="例如：pdf、飞书、数据库…"
            className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-sm text-slate-200 placeholder:text-slate-600"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">
            市场 URL 列表（每行一个，保存在本机浏览器）
          </label>
          <textarea
            value={urlText}
            onChange={(e) => setUrlText(e.target.value)}
            rows={12}
            className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 font-mono leading-relaxed"
          />
          <button
            type="button"
            onClick={() => setUrlText(defaultUrlLines())}
            className="mt-2 text-xs text-indigo-400 hover:underline"
          >
            恢复为外链目录默认列表
          </button>
        </div>
        <div>
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="text-xs font-medium text-slate-400">可复制提示词</span>
            <button
              type="button"
              onClick={copyPrompt}
              className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs text-white font-medium"
            >
              {copied ? '已复制' : '复制到剪贴板'}
            </button>
          </div>
          <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-400 whitespace-pre-wrap break-words max-h-[320px] overflow-y-auto">
            {prompt}
          </pre>
        </div>
      </div>
    </MarketplacePageShell>
  )
}
