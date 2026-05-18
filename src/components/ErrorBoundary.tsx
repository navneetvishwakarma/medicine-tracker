import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Uncaught error:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="flex flex-col items-center justify-center min-h-dvh p-8 text-center">
            <p className="text-5xl mb-5">⚠️</p>
            <p className="font-bold text-gray-900" style={{ fontSize: 20 }}>
              Something went wrong
            </p>
            <p className="text-gray-500 mt-2 mb-8 max-w-xs leading-relaxed" style={{ fontSize: 14 }}>
              {this.state.error?.message}
            </p>
            <button
              onClick={() => this.setState({ hasError: false, error: undefined })}
              className="px-6 py-3 bg-blue-600 text-white rounded-2xl font-semibold hover:bg-blue-700 transition-colors"
              style={{ fontSize: 15 }}
            >
              Try again
            </button>
          </div>
        )
      )
    }
    return this.props.children
  }
}
