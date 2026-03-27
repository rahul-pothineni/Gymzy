import { type HTMLAttributes, forwardRef } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'bordered';
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className = '', variant = 'default', children, ...props }, ref) => {
    const variants = {
      default: 'bg-[var(--color-card)] shadow-sm',
      bordered: 'bg-[var(--color-background)] border border-[var(--color-border)] shadow-sm',
    };

    return (
      <div
        ref={ref}
        className={`rounded-xl p-5 transition-colors ${variants[variant]} ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';
