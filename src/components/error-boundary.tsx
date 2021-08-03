import React from 'react';

export class ErrorBoundary extends React.Component<any, any> {
    constructor(props: any) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: any) {
        return { hasError: true };
    }

    componentDidCatch(error: any, errorInfo: any) {
        console.log('React Error Boundary:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return <div>Error: Something went wrong displaying this data.</div>;
        }

        return this.props.children;
    }
}
