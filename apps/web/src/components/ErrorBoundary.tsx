'use client';

import React, { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  message: string;
}

/**
 * Top-level error boundary for the dashboard.
 * Catches uncaught render errors and shows a user-friendly styled error state.
 */
export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error?.message ?? 'An unexpected error occurred.' };
  }

  override componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Structured error log — picked up by Vercel Function Logs
    console.error('[ErrorBoundary]', { message: error.message, componentStack: info.componentStack });
  }

  handleReset = () => this.setState({ hasError: false, message: '' });

  override render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="page-error" role="alert">
          <div className="page-error-icon">⚠️</div>
          <p style={{ margin: 0, fontWeight: 700 }}>Something went wrong</p>
          <p style={{ margin: '4px 0 16px', color: 'var(--text-secondary)', fontSize: 13 }}>
            {this.state.message}
          </p>
          <button className="btn-primary" style={{ minHeight: 40 }} onClick={this.handleReset}>
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
