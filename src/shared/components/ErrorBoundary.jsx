/**
 * Hornet AI - Error Boundary Component
 * Catches JavaScript errors in child component tree
 */

import { Component } from 'react';
import { logger } from '../utils';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log error to monitoring service
    logger.error('React Error Boundary caught error', error, {
      componentStack: errorInfo.componentStack,
      errorBoundary: this.props.name || 'unnamed',
    });

    this.setState({ errorInfo });

    // Call optional onError callback
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });

    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback({
          error: this.state.error,
          errorInfo: this.state.errorInfo,
          reset: this.handleReset,
          reload: this.handleReload,
        });
      }

      // Default fallback UI
      return (
        <div style={styles.container}>
          <div style={styles.content}>
            <div style={styles.icon}>⚠️</div>
            <h2 style={styles.title}>เกิดข้อผิดพลาด</h2>
            <p style={styles.message}>
              ระบบพบข้อผิดพลาดที่ไม่คาดคิด กรุณาลองใหม่อีกครั้ง
            </p>

            {import.meta.env.DEV && this.state.error && (
              <details style={styles.details}>
                <summary style={styles.summary}>รายละเอียดข้อผิดพลาด (Dev)</summary>
                <pre style={styles.pre}>
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}

            <div style={styles.actions}>
              <button
                onClick={this.handleReset}
                style={styles.buttonPrimary}
              >
                ลองใหม่
              </button>
              <button
                onClick={this.handleReload}
                style={styles.buttonSecondary}
              >
                รีเฟรชหน้า
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const styles = {
  container: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '400px',
    padding: '2rem',
    backgroundColor: '#f8f9fa',
  },
  content: {
    textAlign: 'center',
    maxWidth: '500px',
    padding: '2rem',
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
  },
  icon: {
    fontSize: '48px',
    marginBottom: '1rem',
  },
  title: {
    fontSize: '1.5rem',
    fontWeight: 600,
    color: '#2d2d2d',
    marginBottom: '0.5rem',
  },
  message: {
    color: '#666',
    marginBottom: '1.5rem',
  },
  details: {
    textAlign: 'left',
    marginBottom: '1.5rem',
    padding: '1rem',
    backgroundColor: '#fff5f5',
    borderRadius: '8px',
    border: '1px solid #feb2b2',
  },
  summary: {
    cursor: 'pointer',
    color: '#c53030',
    fontWeight: 500,
  },
  pre: {
    marginTop: '0.5rem',
    padding: '0.5rem',
    fontSize: '0.75rem',
    overflow: 'auto',
    maxHeight: '200px',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
  },
  actions: {
    display: 'flex',
    gap: '1rem',
    justifyContent: 'center',
  },
  buttonPrimary: {
    padding: '0.75rem 1.5rem',
    backgroundColor: '#2d2d2d',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: 500,
  },
  buttonSecondary: {
    padding: '0.75rem 1.5rem',
    backgroundColor: 'white',
    color: '#2d2d2d',
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: 500,
  },
};

/**
 * HOC to wrap component with error boundary
 */
export function withErrorBoundary(Component, options = {}) {
  const WrappedComponent = (props) => (
    <ErrorBoundary {...options}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name || 'Component'})`;

  return WrappedComponent;
}

export default ErrorBoundary;
