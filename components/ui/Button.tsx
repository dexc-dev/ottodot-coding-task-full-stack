import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'custom';
    size?: 'sm' | 'md' | 'lg' | 'xl';
    icon?: React.ReactNode;
    iconPosition?: 'left' | 'right';
    fullWidth?: boolean;
    loading?: boolean;
    children: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    (
        {
            className,
            variant = 'primary',
            size = 'md',
            icon,
            iconPosition = 'left',
            fullWidth = false,
            loading = false,
            disabled,
            children,
            ...props
        },
        ref
    ) => {
        const baseClasses = [
            'inline-flex items-center justify-center',
            'font-semibold transition-all duration-200 ease-in-out',
            'focus:outline-none focus:ring-2 focus:ring-offset-2',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'transform hover:scale-105 active:scale-95',
            'cursor-pointer',
            fullWidth ? 'w-full' : '',
        ];

        const sizeClasses = {
            sm: 'px-4 py-2 text-sm rounded-lg',
            md: 'px-6 py-3 text-base rounded-xl',
            lg: 'px-8 py-4 text-lg rounded-xl',
            xl: 'px-10 py-5 text-xl rounded-2xl',
        };

        const variantClasses = {
            primary: [
                'bg-blue-500 hover:bg-blue-600',
                'text-white shadow-lg',
                'focus:ring-blue-500',
            ],
            secondary: [
                'bg-gray-500 hover:bg-gray-600',
                'text-white shadow-lg',
                'focus:ring-gray-500',
            ],
            outline: [
                'border-2 border-gray-300',
                'hover:border-gray-400 hover:bg-gray-50',
                'text-gray-700',
                'focus:ring-gray-500',
            ],
            ghost: ['hover:bg-gray-100', 'text-gray-600', 'focus:ring-gray-500'],
            custom: [], // Empty array for custom styling via className
        };

        const classes = [
            ...baseClasses,
            ...sizeClasses[size],
            ...variantClasses[variant],
            className,
        ]
            .filter(Boolean)
            .join(' ');

        const iconElement = icon && (
            <span className={iconPosition === 'left' ? 'mr-3' : 'ml-3'}>{icon}</span>
        );

        const loadingSpinner = loading && (
            <svg
                className="animate-spin -ml-1 mr-3 h-5 w-5"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
            >
                <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                />
                <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
            </svg>
        );

        return (
            <button className={classes} ref={ref} disabled={disabled || loading} {...props}>
                {loading && loadingSpinner}
                {!loading && iconPosition === 'left' && iconElement}
                <span>{children}</span>
                {!loading && iconPosition === 'right' && iconElement}
            </button>
        );
    }
);

Button.displayName = 'Button';

export { Button };
