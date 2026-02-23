import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import '../style.css'; // Original vanilla CSS modified for React
import '../main.css';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error: error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("ErrorBoundary caught an error:", error, errorInfo);
        this.setState({ errorInfo });
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{ padding: '20px', color: 'red', background: 'black', minHeight: '100vh', width: '100vw', whiteSpace: 'pre-wrap' }}>
                    <h1>App Crashed!</h1>
                    <h3>{this.state.error?.toString()}</h3>
                    <p>{this.state.errorInfo?.componentStack}</p>
                </div>
            );
        }
        return this.props.children;
    }
}

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <ErrorBoundary>
            <App />
        </ErrorBoundary>
    </React.StrictMode>,
);
