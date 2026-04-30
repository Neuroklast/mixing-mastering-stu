'use client'

import React from 'react'
import { Button } from '@/components/ui/button'

interface ErrorBoundaryState {
  hasError: boolean
  errorMessage: string
}

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, errorMessage: '' }
  }

  static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred'
    return { hasError: true, errorMessage }
  }

  componentDidCatch(error: unknown, info: React.ErrorInfo): void {
    console.error('[ErrorBoundary]', error, info.componentStack)
  }

  private handleReset = (): void => {
    this.setState({ hasError: false, errorMessage: '' })
  }

  render(): React.ReactNode {
    if (!this.state.hasError) return this.props.children

    if (this.props.fallback) return this.props.fallback

    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-6 p-8 text-center">
        <div className="space-y-2">
          <h2 className="text-xl font-bold font-heading text-foreground">Something went wrong</h2>
          <p className="text-sm text-muted-foreground font-mono max-w-md">{this.state.errorMessage}</p>
        </div>
        <Button
          onClick={this.handleReset}
          variant="outline"
          className="font-mono uppercase tracking-wider"
        >
          Try again
        </Button>
      </div>
    )
  }
}
