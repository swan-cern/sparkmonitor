import React from 'react';

type Props = {
  children: React.ReactNode;
};

type State = {
  hasError: boolean;
};

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.log('SparkMonitor: Caught react error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <div>Error: Something went wrong displaying this data.</div>;
    }

    return this.props.children;
  }
}
