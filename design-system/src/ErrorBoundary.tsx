import * as React from "react"

type Props = { name: string; children: React.ReactNode }
type State = { error: Error | null }

/**
 * Per-demo error boundary. A single broken demo renders an inline notice
 * instead of blanking the whole gallery.
 */
export class DemoBoundary extends React.Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  render() {
    if (this.state.error) {
      return (
        <div className="rounded-lg border border-dashed border-(--state-error-base) bg-(--state-error-lighter) p-3 text-sm text-(--state-error-dark)">
          <span className="font-medium">{this.props.name}</span> failed to render:{" "}
          <code className="font-mono text-xs">{this.state.error.message}</code>
        </div>
      )
    }
    return this.props.children
  }
}
