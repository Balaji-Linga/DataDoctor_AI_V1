import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

export interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error boundary component to catch render errors in the component tree.
 * Renders a dark-themed recovery panel using design system color variables.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  override state: ErrorBoundaryState = {
    hasError: false,
    error: null,
  };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('ErrorBoundary caught rendering error:', error, errorInfo);
  }

  private handleReload = (): void => {
    window.location.reload();
  };

  private handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
    });
  };

  override render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div
          className="min-h-[340px] w-full flex items-center justify-center p-6"
          style={{ background: 'var(--bg-primary, #050510)' }}
        >
          <div
            className="w-full max-w-lg rounded-2xl p-8 text-center flex flex-col items-center backdrop-blur-xl shadow-2xl"
            style={{
              backgroundColor: 'var(--bg-surface, #0f1125)',
              border: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.06))',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6), 0 0 20px rgba(0, 212, 255, 0.05)',
            }}
          >
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center mb-5"
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.12)',
                color: '#ef4444',
                border: '1px solid rgba(239, 68, 68, 0.25)',
              }}
            >
              <AlertTriangle className="w-7 h-7" />
            </div>

            <h3
              className="text-xl font-bold mb-2 tracking-tight"
              style={{ color: 'var(--text-primary, #f0f0f5)' }}
            >
              Something Went Wrong
            </h3>

            <p
              className="text-sm mb-6 leading-relaxed max-w-md"
              style={{ color: 'var(--text-secondary, #6b7280)' }}
            >
              An unexpected error occurred while rendering this view. You can reload the application or attempt a reset.
            </p>

            {this.state.error?.message && (
              <div
                className="w-full mb-6 p-3.5 rounded-lg text-left text-xs font-mono overflow-x-auto select-all"
                style={{
                  backgroundColor: 'rgba(5, 5, 16, 0.85)',
                  border: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.06))',
                  color: '#f87171',
                }}
              >
                {this.state.error.message}
              </div>
            )}

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={this.handleReset}
                className="px-4 py-2 rounded-lg text-xs font-medium cursor-pointer transition-colors duration-150"
                style={{
                  backgroundColor: 'transparent',
                  color: 'var(--text-secondary, #6b7280)',
                  border: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.12))',
                }}
              >
                Try Again
              </button>
              <button
                type="button"
                onClick={this.handleReload}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-semibold text-black cursor-pointer transition-all duration-150 hover:brightness-110 active:scale-95 shadow-md"
                style={{
                  backgroundColor: 'var(--accent-cyan, #00d4ff)',
                  boxShadow: '0 0 16px var(--glow-cyan, rgba(0, 212, 255, 0.3))',
                }}
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reload
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
