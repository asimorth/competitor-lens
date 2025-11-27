'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getImageUrl } from '@/lib/imageUrl';

interface OnboardingScreenshot {
    id: string;
    screenshotPath: string;
    cdnUrl?: string | null;
    stepNumber?: number | null;
    stepDescription?: string | null;
    displayOrder: number;
}

interface OnboardingCarouselProps {
    screenshots: OnboardingScreenshot[];
    competitorName: string;
}

export default function OnboardingCarousel({ screenshots, competitorName }: OnboardingCarouselProps) {
    const [currentStep, setCurrentStep] = useState(0);

    const sortedScreenshots = [...screenshots].sort((a, b) => {
        if (a.displayOrder !== b.displayOrder) return a.displayOrder - b.displayOrder;
        if (a.stepNumber && b.stepNumber) return a.stepNumber - b.stepNumber;
        return 0;
    });

    const goToPrevious = () => {
        setCurrentStep((prev) => (prev > 0 ? prev - 1 : sortedScreenshots.length - 1));
    };

    const goToNext = () => {
        setCurrentStep((prev) => (prev < sortedScreenshots.length - 1 ? prev + 1 : 0));
    };

    if (sortedScreenshots.length === 0) {
        return (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                <p>No onboarding screenshots available</p>
            </div>
        );
    }

    const current = sortedScreenshots[currentStep];

    return (
        <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-6">
                <h2 className="text-2xl font-bold mb-2">
                    {competitorName} Onboarding Flow
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                    Step {currentStep + 1} of {sortedScreenshots.length}
                </p>
            </div>

            {/* Main Screenshot */}
            <div className="relative bg-gray-100 dark:bg-gray-800 rounded-xl overflow-hidden shadow-2xl">
                <div className="relative aspect-[9/16] md:aspect-video">
                    <Image
                        src={getImageUrl(current.cdnUrl || current.screenshotPath)}
                        alt={`Step ${currentStep + 1}`}
                        fill
                        className="object-contain"
                        sizes="(max-width: 768px) 100vw, 900px"
                        priority
                    />
                </div>

                {/* Navigation Buttons */}
                {sortedScreenshots.length > 1 && (
                    <>
                        <button
                            onClick={goToPrevious}
                            className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 dark:bg-gray-900/90 hover:bg-white dark:hover:bg-gray-900 p-3 rounded-full shadow-lg transition-all"
                            aria-label="Previous step"
                        >
                            <ChevronLeft className="w-6 h-6" />
                        </button>
                        <button
                            onClick={goToNext}
                            className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 dark:bg-gray-900/90 hover:bg-white dark:hover:bg-gray-900 p-3 rounded-full shadow-lg transition-all"
                            aria-label="Next step"
                        >
                            <ChevronRight className="w-6 h-6" />
                        </button>
                    </>
                )}

                {/* Step Info Overlay */}
                {(current.stepNumber || current.stepDescription) && (
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent p-6">
                        {current.stepNumber && (
                            <div className="text-white/80 text-sm mb-1">
                                Step {current.stepNumber}
                            </div>
                        )}
                        {current.stepDescription && (
                            <p className="text-white font-medium">
                                {current.stepDescription}
                            </p>
                        )}
                    </div>
                )}
            </div>

            {/* Progress Dots */}
            {sortedScreenshots.length > 1 && (
                <div className="flex justify-center gap-2 mt-6">
                    {sortedScreenshots.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => setCurrentStep(index)}
                            className={`
                h-2 rounded-full transition-all
                ${index === currentStep
                                    ? 'w-8 bg-gradient-to-r from-blue-600 to-indigo-600'
                                    : 'w-2 bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500'
                                }
              `}
                            aria-label={`Go to step ${index + 1}`}
                        />
                    ))}
                </div>
            )}

            {/* Thumbnail Strip */}
            {sortedScreenshots.length > 1 && (
                <div className="mt-6 overflow-x-auto">
                    <div className="flex gap-3 pb-2">
                        {sortedScreenshots.map((screenshot, index) => (
                            <button
                                key={screenshot.id}
                                onClick={() => setCurrentStep(index)}
                                className={`
                  relative flex-shrink-0 w-24 h-16 rounded-lg overflow-hidden
                  ring-2 transition-all
                  ${index === currentStep
                                        ? 'ring-blue-600 scale-105'
                                        : 'ring-gray-300 dark:ring-gray-700 hover:ring-gray-400 opacity-60 hover:opacity-100'
                                    }
                `}
                            >
                                <Image
                                    src={getImageUrl(screenshot.cdnUrl || screenshot.screenshotPath)}
                                    alt={`Thumbnail ${index + 1}`}
                                    fill
                                    className="object-cover"
                                    sizes="96px"
                                />
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
