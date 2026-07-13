import * as React from "react"
import { DashLogo, Badge, IconButton } from "@dash-electric/logistic-kit"
import { RiMoonLine, RiSunLine, RiSearchLine, RiGithubLine } from "@remixicon/react"
import { CATEGORIES, TOTAL_COMPONENTS, type Demo } from "./registry"
import { DemoBoundary } from "./ErrorBoundary"

function useDarkMode() {
  const [dark, setDark] = React.useState(false)
  React.useEffect(() => {
    document.documentElement.classList.toggle("dark", dark)
  }, [dark])
  return [dark, setDark] as const
}

function DemoCard({ demo }: { demo: Demo }) {
  return (
    <article
      id={demo.name.replace(/\s.*/, "")}
      className="scroll-mt-24 overflow-hidden rounded-2xl border border-stroke-soft-200 bg-bg-white-0"
    >
      <header className="flex items-baseline justify-between gap-3 border-b border-stroke-soft-200 px-4 py-3">
        <h3 className="font-mono text-sm font-medium text-text-strong-950">{demo.name}</h3>
      </header>
      <p className="px-4 pt-3 text-sm text-text-sub-600">{demo.description}</p>
      <div className="p-4">
        <DemoBoundary name={demo.name}>{demo.render()}</DemoBoundary>
      </div>
    </article>
  )
}

export function App() {
  const [dark, setDark] = useDarkMode()
  const [query, setQuery] = React.useState("")

  const q = query.trim().toLowerCase()
  const categories = CATEGORIES.map((cat) => ({
    ...cat,
    demos: q
      ? cat.demos.filter(
          (d) => d.name.toLowerCase().includes(q) || d.description.toLowerCase().includes(q),
        )
      : cat.demos,
  })).filter((cat) => cat.demos.length > 0)

  return (
    <div className="min-h-screen">
      {/* Top bar */}
      <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b border-stroke-soft-200 bg-bg-white-0/90 px-4 backdrop-blur md:px-6">
        <DashLogo variant="wordmark" size="sm" />
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-text-strong-950">Logistic Design System</span>
          <Badge status="feature" appearance="lighter" size="sm">v0.1.0</Badge>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <div className="hidden items-center gap-2 rounded-lg border border-stroke-soft-200 px-2.5 py-1.5 sm:flex">
            <RiSearchLine className="size-4 text-icon-soft-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search components…"
              className="w-44 bg-transparent text-sm text-text-strong-950 outline-none placeholder:text-text-soft-400"
            />
          </div>
          <IconButton
            aria-label="Toggle theme"
            tone="neutral"
            style="stroke"
            onClick={() => setDark(!dark)}
          >
            {dark ? <RiSunLine /> : <RiMoonLine />}
          </IconButton>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl gap-8 px-4 py-8 md:px-6">
        {/* Category nav */}
        <nav className="sticky top-20 hidden h-fit w-48 shrink-0 lg:block">
          <p className="px-2 pb-2 text-subheading-x-small uppercase text-text-soft-400">Categories</p>
          <ul className="space-y-0.5">
            {categories.map((cat) => (
              <li key={cat.id}>
                <a
                  href={`#${cat.id}`}
                  className="flex items-center justify-between rounded-lg px-2 py-1.5 text-sm text-text-sub-600 transition-colors hover:bg-bg-weak-50 hover:text-text-strong-950"
                >
                  {cat.title}
                  <span className="font-mono text-xs text-text-soft-400">{cat.demos.length}</span>
                </a>
              </li>
            ))}
          </ul>
        </nav>

        {/* Content */}
        <main className="min-w-0 flex-1">
          {/* Hero */}
          <section className="mb-10">
            <p className="gsm-label flex items-center gap-2 text-xs text-text-sub-600">
              <span className="inline-block size-1.5 rounded-full bg-accent" /> 01 · Dash Logistic
            </p>
            <h1 className="gsm-large mt-2 text-[44px] text-text-strong-950">Component library</h1>
            <p className="gsm-lede mt-3 max-w-2xl text-lg text-text-sub-600">
              {TOTAL_COMPONENTS} Dash UI components themed to the Logistic Graphic Standard Manual.
              Editorial restraint: ink on white, hairline rules, one accent used like punctuation.
              Plus Jakarta Sans + JetBrains Mono, tabular numerals, light and dark, reduced-motion safe.
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-lg border border-stroke-soft-200 px-3 py-1.5 text-sm text-text-sub-600">
                <span className="size-3.5 rounded-full bg-accent" /> Accent · Dash Purple #5E2AAC
              </span>
              <span className="inline-flex items-center gap-2 rounded-lg border border-stroke-soft-200 px-3 py-1.5 text-sm text-text-sub-600">
                <span className="size-3.5 rounded-full bg-[color:var(--dash-gray-950)]" /> Ink #171717
              </span>
              <span className="inline-flex items-center gap-2 rounded-lg border border-stroke-soft-200 px-3 py-1.5 text-sm text-text-sub-600">
                <span className="size-3.5 rounded-full border border-stroke-sub-300 bg-bg-white-0" /> White
              </span>
              <span className="inline-flex items-center gap-2 rounded-lg border border-stroke-soft-200 px-3 py-1.5 text-sm text-text-sub-600">
                <span className="size-3.5 rounded-full bg-[color:var(--dash-gray-600)]" /> Neutral #5C5C5C
              </span>
            </div>
          </section>

          {categories.length === 0 && (
            <p className="text-sm text-text-sub-600">No components match “{query}”.</p>
          )}

          {categories.map((cat) => (
            <section key={cat.id} id={cat.id} className="mb-14 scroll-mt-20">
              <div className="mb-4 border-b border-stroke-soft-200 pb-3">
                <h2 className="text-title-h5 text-text-strong-950">{cat.title}</h2>
                <p className="mt-1 max-w-2xl text-sm text-text-sub-600">{cat.blurb}</p>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {cat.demos.map((demo) => (
                  <DemoCard key={demo.name} demo={demo} />
                ))}
              </div>
            </section>
          ))}

          <footer className="border-t border-stroke-soft-200 pt-6 text-sm text-text-soft-400">
            <span className="inline-flex items-center gap-1.5">
              <RiGithubLine className="size-4" /> @dash-electric/logistic-kit — internal / proprietary
            </span>
          </footer>
        </main>
      </div>
    </div>
  )
}
