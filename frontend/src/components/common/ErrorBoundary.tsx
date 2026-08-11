'use client';

import React from 'react';
import { AlertCircle, Home, RefreshCw } from 'lucide-react';
import Link from 'next/link';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex h-full min-h-[300px] w-full flex-col items-center justify-center gap-4 text-center px-4">
          <AlertCircle className="h-10 w-10 text-red-500" />
          <div>
            <h3 className="text-lg font-bold text-neutral-800">Section crashed</h3>
            <p className="text-sm text-neutral-500 mt-1 max-w-md">
              A part of this page encountered an unexpected error.
            </p>
          </div>
          <div className="flex gap-3 mt-1">
            <button
              onClick={this.handleReset}
              className="rounded-md bg-neutral-900 px-3 h-8 text-xs font-medium text-white hover:bg-neutral-800 transition flex items-center gap-1"
            >
              <RefreshCw className="h-3 w-3" />
              Retry
            </button>
            <Link
              href="/admin/dashboard"
              className="rounded-md border border-neutral-300 px-3 h-8 flex items-center gap-1 text-xs font-medium text-neutral-700 hover:bg-neutral-50 transition"
            >
              <Home className="h-3 w-3" />
              Dashboard
            </Link>
          </div>
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <pre className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded max-w-md overflow-auto">
              {this.state.error.message}
            </pre>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
