interface EmptyStateProps {
  title: string;
  action?: React.ReactNode;
  description?: string;
}

export function EmptyState({ title, action, description }: EmptyStateProps) {
  return (
    <div className="rounded-lg border border-dashed border-gray-300 bg-muted p-4 text-center">
      <h3 className="text-base font-semibold text-gray-800">{title}</h3>
      {description ? <p className="mt-2 text-sm text-gray-600">{description}</p> : null}
      {action ? <div className="mt-3 flex justify-center">{action}</div> : null}
    </div>
  );
}
