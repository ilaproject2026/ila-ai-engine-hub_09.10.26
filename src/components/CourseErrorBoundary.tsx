import React, { Component, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallbackTitle?: string;
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export default class CourseErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Course Creator Component Error caught by boundary:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            flex: 1,
            padding: '3rem 2rem',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            background: 'var(--bg-primary)',
            color: 'var(--text-main)',
            minHeight: '300px',
          }}
        >
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1rem',
              color: '#f87171',
            }}
          >
            <AlertTriangle size={28} />
          </div>

          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '0.4rem' }}>
            {this.props.fallbackTitle || 'Course View Temporarily Unavailable'}
          </h3>

          <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', maxWidth: '480px', lineHeight: '1.5', marginBottom: '1.5rem' }}>
            A rendering issue occurred while loading this course component. Your sub-navigation and saved data remain completely safe.
          </p>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              type="button"
              onClick={this.handleReset}
              style={{
                padding: '0.55rem 1.1rem',
                borderRadius: '0.6rem',
                background: 'var(--accent-gradient)',
                border: 'none',
                color: '#ffffff',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
              }}
            >
              <RefreshCw size={14} />
              <span>Retry Component</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
