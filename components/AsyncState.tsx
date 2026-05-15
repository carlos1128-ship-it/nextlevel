import React from "react";
import NextLevelLoader from "./NextLevelLoader";
import { EmptyStateCard } from "./ui/Card";

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
  <EmptyStateCard className="nl-enter">
    <h3 className="text-lg font-black tracking-tight text-zinc-100">{title}</h3>
    {description ? (
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-zinc-400">{description}</p>
    ) : null}
    {actionLabel && onAction ? (
      <button
        type="button"
        onClick={onAction}
        className="nl-button-primary mt-5"
      >
        {actionLabel}
      </button>
    ) : null}
  </EmptyStateCard>
);

export const ErrorState: React.FC<StateCardProps> = ({
  title,
  description,
  actionLabel,
  onAction,
}) => (
  <div className="nl-card nl-card-empty nl-enter border-red-400/30 bg-red-500/10">
    <h3 className="text-lg font-black tracking-tight text-red-200">{title}</h3>
    {description ? (
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-red-200/80">{description}</p>
    ) : null}
    {actionLabel && onAction ? (
      <button
        type="button"
        onClick={onAction}
        className="nl-button-danger mt-5"
      >
        {actionLabel}
      </button>
    ) : null}
  </div>
);
