"use client";

import { Component, ReactNode } from "react";
import Link from "next/link";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="bg-card-bg border border-border-light rounded-xl p-8 max-w-md w-full text-center">
            <div className="w-12 h-12 bg-surface rounded-xl flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl text-text-secondary">!</span>
            </div>
            <h2 className="text-lg font-semibold text-foreground tracking-tight mb-2">
              Something went wrong
            </h2>
            <p className="text-[13px] text-text-secondary mb-6">
              An unexpected error occurred. Please try again or return to the dashboard.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => this.setState({ hasError: false })}
                className="inline-flex items-center justify-center font-semibold rounded-xl px-5 py-2.5 text-[13px] bg-foreground text-white hover:bg-foreground/90 shadow-sm transition-all duration-200 cursor-pointer active:scale-[0.96]"
              >
                Try again
              </button>
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center font-semibold rounded-xl px-5 py-2.5 text-[13px] bg-card-bg text-foreground border border-border-light hover:bg-surface transition-all duration-200"
              >
                Return to dashboard
              </Link>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
