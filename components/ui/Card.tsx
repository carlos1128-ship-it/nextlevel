import React from "react";

const joinClassNames = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(" ");

type AppCardVariant = "default" | "form" | "metric" | "table" | "filter" | "empty" | "feature" | "action";

type AppCardProps = React.HTMLAttributes<HTMLDivElement> & {
  variant?: AppCardVariant;
  interactive?: boolean;
};

const variantClass: Record<AppCardVariant, string> = {
  default: "nl-card",
  form: "nl-card nl-card-form",
  metric: "nl-card nl-card-metric",
  table: "nl-card nl-card-table",
  filter: "nl-card nl-card-filter",
  empty: "nl-card nl-card-empty",
  feature: "nl-card nl-card-feature",
  action: "nl-card nl-card-action",
};

export const AppCard = ({
  variant = "default",
  interactive = false,
  className,
  children,
  ...props
}: AppCardProps) => (
  <div
    className={joinClassNames(variantClass[variant], "nl-enter", interactive && "nl-card-interactive", className)}
    {...props}
  >
    {children}
  </div>
);

export const MetricCard = (props: AppCardProps) => <AppCard variant="metric" {...props} />;
export const FormCard = (props: AppCardProps) => <AppCard variant="form" {...props} />;
export const TableCard = (props: AppCardProps) => <AppCard variant="table" {...props} />;
export const FilterCard = (props: AppCardProps) => <AppCard variant="filter" {...props} />;
export const EmptyStateCard = (props: AppCardProps) => <AppCard variant="empty" {...props} />;
export const FeatureCard = (props: AppCardProps) => <AppCard variant="feature" {...props} />;
export const ActionCard = (props: AppCardProps) => <AppCard variant="action" interactive {...props} />;
