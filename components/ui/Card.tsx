import { HTMLAttributes } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  noBorder?: boolean;
}

export function Card({
  noBorder = false,
  className = "",
  children,
  ...props
}: CardProps) {
  const borderStyles = noBorder ? "" : "border border-syndicate-border";

  return (
    <div
      className={`bg-syndicate-surface ${borderStyles} rounded-sm ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  className = "",
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`px-4 py-3 border-b border-syndicate-border ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardBody({
  className = "",
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`px-4 py-3 ${className}`} {...props}>
      {children}
    </div>
  );
}
