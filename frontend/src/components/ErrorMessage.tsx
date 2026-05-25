export function ErrorMessage({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-error/30 bg-error/10 p-4 text-error">
      <p className="font-label text-sm uppercase tracking-wider">Error</p>
      <p className="mt-2 font-body text-sm">{message}</p>
    </div>
  );
}

export function NoDataMessage({ message }: { message?: string }) {
  return (
    <div className="flex min-h-96 items-center justify-center rounded-lg border border-outline px-6 py-12 text-center">
      <div>
        <p className="font-label text-xs uppercase tracking-[0.3em] text-outline-variant">
          No Data
        </p>
        <p className="mt-2 font-body text-on-surface-variant">
          {message || "Nothing to display yet"}
        </p>
      </div>
    </div>
  );
}

export function LoadingSpinner() {
  return (
    <div className="flex min-h-96 items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-outline border-t-primary" />
        <p className="font-body text-sm text-on-surface-variant">Loading...</p>
      </div>
    </div>
  );
}
