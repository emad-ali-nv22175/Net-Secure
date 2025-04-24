"use client"

import { Component, ErrorInfo, ReactNode } from "react"
import { AlertTriangle } from "lucide-react"
import { Alert } from "../ui/alert"
import { Button } from "../ui/button"

interface Props {
  children: ReactNode
}

interface State {
  error: Error | null
  retryCount: number
}

export class NetworkTestErrorBoundary extends Component<Props, State> {
  public state: State = {
    error: null,
    retryCount: 0
  }

  public static getDerivedStateFromError(error: Error): State {
    return { error, retryCount: 0 }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Network test error:', error, errorInfo)
  }

  private handleRetry = () => {
    this.setState(prevState => ({
      error: null,
      retryCount: prevState.retryCount + 1
    }))
  }

  public render() {
    if (this.state.error) {
      return (
        <Alert variant="destructive" className="my-4">
          <AlertTriangle className="h-4 w-4" />
          <div className="flex-1">
            <p>Network test failed: {this.state.error.message}</p>
            <p className="text-sm text-muted-foreground mt-1">
              This could be due to network connectivity issues or server unavailability.
            </p>
          </div>
          <Button 
            variant="outline" 
            onClick={this.handleRetry}
            disabled={this.state.retryCount >= 3}
          >
            {this.state.retryCount >= 3 ? "Too many retries" : "Retry Test"}
          </Button>
        </Alert>
      )
    }

    return this.props.children
  }
}