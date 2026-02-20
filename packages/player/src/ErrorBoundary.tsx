import React, { Component, type ReactNode, type ErrorInfo, type ComponentType } from 'react';

interface ErrorFallbackProps {
  error: Error;
}

interface ErrorBoundaryProps {
  fallback?: ComponentType<ErrorFallbackProps>;
  children: ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('Rendiv Player error:', error, info);
  }

  render() {
    if (this.state.error) {
      const Fallback = this.props.fallback;
      if (Fallback) {
        return <Fallback error={this.state.error} />;
      }
      return (
        <div
          style={{
            padding: 20,
            color: '#ff4444',
            backgroundColor: '#1a1a1a',
            fontFamily: 'monospace',
            fontSize: 14,
            whiteSpace: 'pre-wrap',
            overflow: 'auto',
            width: '100%',
            height: '100%',
          }}
        >
          {this.state.error.message}
        </div>
      );
    }
    return this.props.children;
  }
}
