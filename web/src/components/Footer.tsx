import { APP_VERSION } from '../appVersion'
import { PROJECT_GITHUB_URL } from '../project'

export function Footer({ onAboutClick }: { onAboutClick: () => void }) {
  return (
    <footer className="mt-16 pt-5 pb-6 border-t border-slate-800/60">
      <div className="max-w-[1400px] mx-auto px-6 flex flex-col sm:flex-row items-center justify-center gap-x-3 gap-y-2 text-[11px] text-slate-600">
        <span>v{APP_VERSION}</span>
        <span className="hidden sm:inline text-slate-800">·</span>
        <a
          href={PROJECT_GITHUB_URL}
          target="_blank"
          rel="noreferrer"
          className="hover:text-slate-400 transition-colors"
        >
          GitHub
        </a>
        <span className="hidden sm:inline text-slate-800">·</span>
        <button
          onClick={onAboutClick}
          className="hover:text-slate-400 transition-colors"
        >
          关于
        </button>
      </div>
    </footer>
  )
}
