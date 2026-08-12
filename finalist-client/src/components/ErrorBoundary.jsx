import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('UI crash:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0d1117',
          color: '#c9d1d9',
          gap: '16px',
          padding: '24px',
          textAlign: 'center'
        }}>
          <h1 style={{ margin: 0, fontSize: '24px' }}>Something went wrong</h1>
          <p style={{ margin: 0, color: '#8b949e', maxWidth: '420px' }}>
            The page hit an unexpected error. Refresh to try again.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            style={{
              marginTop: '8px',
              padding: '10px 18px',
              borderRadius: '8px',
              border: '1px solid rgba(88,166,255,0.4)',
              background: 'rgba(88,166,255,0.12)',
              color: '#58a6ff',
              cursor: 'pointer',
              fontWeight: 600
            }}
          >
            Refresh Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
