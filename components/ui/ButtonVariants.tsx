import React from 'react';
import { Button, ButtonProps } from './Button';

// Gradient Classes Button Component
export const GradientClassesButton = React.forwardRef<
    HTMLButtonElement,
    Omit<ButtonProps, 'variant'>
>(({ children, ...props }, ref) => {
    return (
        <Button ref={ref} variant="custom" size="lg" {...props}>
            {children || (
                <>
                    <span>Weekly Online</span>
                    <span>Classes</span>
                </>
            )}
        </Button>
    );
});

GradientClassesButton.displayName = 'GradientClassesButton';

// Export all button components
export { Button } from './Button';
export type { ButtonProps } from './Button';
