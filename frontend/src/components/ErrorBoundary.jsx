import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('UI error boundary caught:', error, errorInfo);
  }

  handleRetry = () => {
    window.location.reload();
  };

  render() {
    const { error } = this.state;

    if (error) {
      return (
        <div className="page-center">
          <div className="error-box error-boundary-box">
            <h2>Something went wrong</h2>
            <p>Please refresh the page or try again.</p>
            <button type="button" className="btn btn-primary" onClick={this.handleRetry}>
              Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
