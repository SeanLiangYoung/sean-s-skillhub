import { ReactNode } from 'react'

interface MarketplacePageShellProps {
  sidebar: ReactNode
  sidebarOpen: boolean
  onToggleSidebar: () => void
  toolbarLeft: ReactNode
  toolbarRight?: ReactNode
  children: ReactNode
  /** When false, no sidebar column or toggle (single ClawHub source). */
  showSidebarChrome?: boolean
}

export function MarketplacePageShell({
  sidebar,
  sidebarOpen,
  onToggleSidebar,
  toolbarLeft,
  toolbarRight,
  children,
  showSidebarChrome = true,
}: MarketplacePageShellProps) {
  return (
    <div className={showSidebarChrome ? 'flex flex-col lg:flex-row gap-6' : 'flex flex-col gap-4'}>
      {showSidebarChrome && sidebarOpen && sidebar != null && (
        <aside className="lg:w-60 shrink-0 space-y-5">{sidebar}</aside>
      )}

      <main className="flex-1 min-w-0 flex flex-col gap-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 min-w-0">
            {showSidebarChrome && sidebar != null && (
              <button
                type="button"
                onClick={onToggleSidebar}
                title={sidebarOpen ? '收起侧边栏' : '展开侧边栏'}
                aria-label={sidebarOpen ? '收起侧边栏' : '展开侧边栏'}
                className="p-1.5 rounded-md border border-slate-800 bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-all shrink-0"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  {sidebarOpen ? (
                    <>
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                      <line x1="9" y1="3" x2="9" y2="21" />
                    </>
                  ) : (
                    <>
                      <line x1="3" y1="12" x2="21" y2="12" />
                      <line x1="3" y1="6" x2="21" y2="6" />
                      <line x1="3" y1="18" x2="21" y2="18" />
                    </>
                  )}
                </svg>
              </button>
            )}
            {toolbarLeft}
          </div>
          {toolbarRight && <div className="flex items-center gap-2">{toolbarRight}</div>}
        </div>
        {children}
      </main>
    </div>
  )
}
