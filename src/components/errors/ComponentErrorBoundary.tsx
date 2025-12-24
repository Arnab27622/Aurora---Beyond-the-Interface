'use client';

import React, { ReactNode } from 'react';

interface ComponentErrorBoundaryProps {
  children: ReactNode;
  fallback?: (error: Error, retry: () => void) => ReactNode;
  componentName?: string;
}

interface ComponentErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ComponentErrorBoundary extends React.Component<
  ComponentErrorBoundaryProps,
  ComponentErrorBoundaryState
> {
  constructor(props: ComponentErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): ComponentErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error(
      `Error in ${this.props.componentName || 'component'}:`,
      error,
      errorInfo
    );
  }

  retry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      return this.props.fallback ? (
        this.props.fallback(this.state.error, this.retry)
      ) : (
        <ComponentErrorFallback
          error={this.state.error}
          retry={this.retry}
          componentName={this.props.componentName}
        />
      );
    }

    return this.props.children;
  }
}

interface ComponentErrorFallbackProps {
  error: Error;
  retry: () => void;
  componentName?: string;
}

function ComponentErrorFallback({
  error,
  retry,
  componentName,
}: ComponentErrorFallbackProps) {
  return (
    <div className="w-full bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
      <div className="flex items-start gap-3">
        <svg
          className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <div className="flex-1">
          <h3 className="font-semibold text-red-900 dark:text-red-200">
            {componentName ? `Error in ${componentName}` : 'Component Error'}
          </h3>
          <p className="text-sm text-red-700 dark:text-red-300 mt-1">
            {error.message || 'An unexpected error occurred'}
          </p>
          <button
            onClick={retry}
            className="mt-3 inline-flex items-center px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    </div>
  );
}
