import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: (error: Error, reset: () => void) => ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * Catches render errors in its subtree and shows a recoverable error screen
 * instead of letting React unmount to a blank body. Scoped per-route so a
 * crash in one page (e.g. bad data on Proposals) cannot lock the user out of
 * the rest of the app.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error("[ErrorBoundary]", error, info);
  }

  reset = () => this.setState({ error: null });

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;
    if (this.props.fallback) return this.props.fallback(error, this.reset);
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white border border-red-200 rounded-xl shadow-sm p-6 text-center">
          <div className="mx-auto w-10 h-10 rounded-full bg-red-100 text-red-700 flex items-center justify-center font-bold">
            !
          </div>
          <h2 className="mt-4 text-lg font-bold text-slate-900">
            Something went wrong on this page
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            {error.message || "Unexpected error"}
          </p>
          <div className="mt-5 flex gap-2 justify-center">
            <button
              onClick={this.reset}
              className="px-4 py-2 text-sm rounded-md bg-[hsl(232,45%,18%)] text-white hover:bg-[hsl(232,45%,12%)]"
            >
              Try again
            </button>
            <button
              onClick={() => {
                window.location.hash = "#/";
                this.reset();
              }}
              className="px-4 py-2 text-sm rounded-md border border-slate-300 text-slate-700 hover:bg-slate-50"
            >
              Back to dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }
}
