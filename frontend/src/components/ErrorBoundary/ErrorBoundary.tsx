import React, { Component } from 'react';
import type { ReactNode, ErrorInfo } from 'react';
import './ErrorBoundary.css';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, info: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('💀 ErrorBoundary caught:', error, info);
    this.props.onError?.(error, info);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="error-boundary" role="alert" aria-live="assertive">
          <div className="eb-content">
            <div className="eb-skull">💀</div>
            <div className="eb-title">SYSTEM FAILURE</div>
            <div className="eb-ascii">
              ╔══════════════════════════╗<br />
              ║  THE SPIRITS HAVE FLED   ║<br />
              ║  AN ERROR HAS OCCURRED   ║<br />
              ╚══════════════════════════╝
            </div>
            <div className="eb-message">
              {this.state.error?.message || 'An unexpected error occurred'}
            </div>
            <button className="eb-reset-btn" onClick={this.handleReset}>
              ⚡ ATTEMPT RESURRECTION
            </button>
            <button className="eb-reload-btn" onClick={() => window.location.reload()}>
              ↺ FULL SYSTEM REBOOT
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
