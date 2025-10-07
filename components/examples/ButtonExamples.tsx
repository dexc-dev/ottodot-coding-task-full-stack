import React from 'react';
import { Button, WhatsAppTrialButton, GradientClassesButton } from '@/components/ui';

export const ButtonExamples = () => {
    return (
        <div className="min-h-screen bg-white p-8 space-y-8">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-4xl font-bold text-gray-800 mb-8 text-center">
                    Button Component Examples
                </h1>

                {/* WhatsApp Trial Button */}
                <section className="mb-12">
                    <h2 className="text-2xl font-semibold text-gray-700 mb-6">
                        WhatsApp Trial Button
                    </h2>
                    <div className="flex flex-wrap gap-4">
                        <WhatsAppTrialButton>Join Trial</WhatsAppTrialButton>
                        <WhatsAppTrialButton size="sm">Small Trial</WhatsAppTrialButton>
                        <WhatsAppTrialButton size="xl">Large Trial</WhatsAppTrialButton>
                    </div>
                </section>

                {/* Gradient Classes Button */}
                <section className="mb-12">
                    <h2 className="text-2xl font-semibold text-gray-700 mb-6">
                        Gradient Classes Button
                    </h2>
                    <div className="flex flex-wrap gap-4">
                        <GradientClassesButton />
                        <GradientClassesButton size="sm">
                            <span>Daily</span>
                            <span>Practice</span>
                        </GradientClassesButton>
                        <GradientClassesButton size="xl">
                            <span>Premium</span>
                            <span>Courses</span>
                        </GradientClassesButton>
                    </div>
                </section>

                {/* Standard Button Variants */}
                <section className="mb-12">
                    <h2 className="text-2xl font-semibold text-gray-700 mb-6">
                        Standard Button Variants
                    </h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <Button variant="primary">Primary Button</Button>
                        <Button variant="secondary">Secondary Button</Button>
                        <Button variant="outline">Outline Button</Button>
                        <Button variant="ghost">Ghost Button</Button>
                        <Button variant="primary" loading>
                            Loading Button
                        </Button>
                        <Button variant="primary" disabled>
                            Disabled Button
                        </Button>
                    </div>
                </section>

                {/* Button Sizes */}
                <section className="mb-12">
                    <h2 className="text-2xl font-semibold text-gray-700 mb-6">Button Sizes</h2>
                    <div className="flex flex-wrap items-center gap-4">
                        <Button size="sm">Small</Button>
                        <Button size="md">Medium</Button>
                        <Button size="lg">Large</Button>
                        <Button size="xl">Extra Large</Button>
                    </div>
                </section>

                {/* Full Width Buttons */}
                <section className="mb-12">
                    <h2 className="text-2xl font-semibold text-gray-700 mb-6">
                        Full Width Buttons
                    </h2>
                    <div className="space-y-4">
                        <Button fullWidth variant="primary">
                            Full Width Primary
                        </Button>
                        <Button fullWidth variant="secondary">
                            Full Width Secondary
                        </Button>
                        <WhatsAppTrialButton fullWidth>
                            Full Width WhatsApp Trial
                        </WhatsAppTrialButton>
                    </div>
                </section>

                {/* Buttons with Icons */}
                <section className="mb-12">
                    <h2 className="text-2xl font-semibold text-gray-700 mb-6">
                        Buttons with Icons
                    </h2>
                    <div className="flex flex-wrap gap-4">
                        <Button
                            variant="primary"
                            icon={
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                    <path
                                        fillRule="evenodd"
                                        d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                            }
                        >
                            Add Item
                        </Button>
                        <Button
                            variant="secondary"
                            icon={
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                    <path
                                        fillRule="evenodd"
                                        d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                            }
                            iconPosition="right"
                        >
                            Download
                        </Button>
                    </div>
                </section>
            </div>
        </div>
    );
};

export default ButtonExamples;
