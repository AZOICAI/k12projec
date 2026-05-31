/**
 * Purpose: Panel wrapper for dashboard sections and forms.
 */

export function Card({ className = "", children, as: Tag = "section", ...props }) {
  return (
    <Tag
      className={`rounded-[var(--radius-card)] border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 ${className}`}
      {...props}
    >
      {children}
    </Tag>
  );
}
