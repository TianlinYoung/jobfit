// A friendly box shown instead of results when there is nothing to show yet.
import type { ReactNode } from 'react';

// React: "props" are a component's inputs, like constructor arguments in Java.
// The parent passes them in; the component must not modify them.
interface EmptyStateProps {
  title: string;
  message: string;
  /** Optional buttons. ReactNode means "anything React can render": elements, text, or nothing. */
  actions?: ReactNode;
}

// React: a component is just a function that takes props and returns what to draw (JSX).
// React calls it again whenever its props or state change; you never call it yourself.
export function EmptyState({ title, message, actions }: EmptyStateProps) {
  return (
    <div className="empty-state" role="status">
      <h3>{title}</h3>
      <p>{message}</p>
      {actions !== undefined && <div className="button-row">{actions}</div>}
    </div>
  );
}
