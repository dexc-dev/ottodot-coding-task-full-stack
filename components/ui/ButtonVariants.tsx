import React from 'react';
import { Button, ButtonProps } from './Button';

// Gradient Classes Button Component
export const GradientClassesButton = React.forwardRef<
    HTMLButtonElement,
    Omit<ButtonProps, 'variant'>
>(({ children, ...props }, ref) => {
    return (
        <Button 
            ref={ref} 
            variant="custom" 
            size="lg" 
            className="bg-gradient-to-r from-green-400 to-blue-500 hover:from-green-500 hover:to-blue-600 text-white font-bold shadow-lg"
            {...props}
        >
            {children || "Weekly Online Classes"}
        </Button>
    );
});

GradientClassesButton.displayName = 'GradientClassesButton';

// Export all button components
export { Button } from './Button';
export type { ButtonProps } from './Button';
