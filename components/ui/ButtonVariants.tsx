import React from 'react';
import { ButtonProps } from './Button';

// Gradient Classes Button Component
export const GradientClassesButton = React.forwardRef<
    HTMLButtonElement,
    Omit<ButtonProps, 'variant'>
>(({ children, className = '', disabled = false, fullWidth = false, loading = false, ...props }, ref) => {
    // Default gradient classes - can be overridden by className prop
    const defaultGradientClasses = 'bg-gradient-to-r from-green-400 to-blue-500 hover:from-green-500 hover:to-blue-600';
    
    const baseClasses = [
        'inline-flex items-center justify-center',
        'font-semibold transition-all duration-200 ease-in-out',
        'focus:outline-none focus:ring-2 focus:ring-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        'cursor-pointer',
        'px-8 py-4 text-lg rounded-xl',
        fullWidth ? 'w-full' : '',
        // Only apply default text-white if no text color classes are provided in className
        !className.includes('text-') ? 'text-white' : '',
        'font-bold shadow-lg',
        // Only apply default gradient if no background classes are provided in className
        !className.includes('bg-') ? defaultGradientClasses : '',
        className,
    ]
        .filter(Boolean)
        .join(' ');

    return (
        <button 
            ref={ref} 
            className={baseClasses}
            disabled={disabled || loading}
            {...props}
        >
            {loading ? 'Loading...' : children}
        </button>
    );
});

GradientClassesButton.displayName = 'GradientClassesButton';

// Export all button components
export { Button } from './Button';
export type { ButtonProps } from './Button';

