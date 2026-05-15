import React from "react";
import NextLevelLoader from "./NextLevelLoader";

interface StateCardProps {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const LoadingState: React.FC<{ label?: string }> = () => (
  <NextLevelLoader fullscreen={false} />
);

export const EmptyState: React.FC<StateCardProps> = ({
  title,
  description,
  actionLabel,
  onAction,
}) => (
  <div className="rounded-2xl border border-zinc-200 bg-white p-8 text-center dark:border-zinc-800 dark:bg-zinc-900">
    <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{title}</h3>
    {description ? (
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{description}</p>
    ) : null}
    {actionLabel && onAction ? (
      <button
        type="button"
        onClick={onAction}
        className="mt-4 rounded-lg bg-lime-300 px-4 py-2 text-sm font-semibold text-zinc-900 transition hover:opacity-90"
      >
        {actionLabel}
      </button>
    ) : null}
  </div>
);

export const ErrorState: React.FC<StateCardProps> = ({
  title,
  description,
  actionLabel,
  onAction,
}) => (
  <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center dark:border-red-500/30 dark:bg-red-500/10">
    <h3 className="text-lg font-semibold text-red-700 dark:text-red-300">{title}</h3>
    {description ? (
      <p className="mt-2 text-sm text-red-600 dark:text-red-200">{description}</p>
    ) : null}
    {actionLabel && onAction ? (
      <button
        type="button"
        onClick={onAction}
        className="mt-4 rounded-lg border border-red-300 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100 dark:border-red-300/40 dark:text-red-200 dark:hover:bg-red-500/20"
      >
        {actionLabel}
      </button>
    ) : null}
  </div>
);
