'use client';

import { useState } from 'react';
import Image from 'next/image';
import { X, ZoomIn, ChevronLeft, ChevronRight } from 'lucide-react';

interface Screenshot {
    id: string;
    fileName: string;
    filePath: string;
    cdnUrl?: string | null;
    featureId?: string | null;
    feature?: {
        name: string;
        category?: string | null;
    } | null;
}

interface ScreenshotGalleryProps {
    screenshots: Screenshot[];
    columns?: number;
}

export default function ScreenshotGallery({ screenshots, columns = 3 }: ScreenshotGalleryProps) {
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

    const getImageUrl = (screenshot: Screenshot) => {
        if (screenshot.cdnUrl) return screenshot.cdnUrl;

        // Fallback to local path
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

        // Normalize path: Ensure it's relative and starts with 'uploads/'
        let relativePath = screenshot.filePath;

        // Handle absolute paths (e.g. /app/uploads/... or /Users/.../uploads/...)
        if (relativePath.includes('uploads/')) {
            relativePath = 'uploads/' + relativePath.split('uploads/')[1];
        }

        // Remove leading slash if present
        if (relativePath.startsWith('/')) {
            relativePath = relativePath.substring(1);
        }

        // Encode the path to handle spaces (e.g. "Garanti Kripto")
        return `${apiUrl}/${encodeURI(relativePath)}`;
    };

    const handlePrevious = () => {
        if (selectedIndex === null) return;
        setSelectedIndex(selectedIndex > 0 ? selectedIndex - 1 : screenshots.length - 1);
    };

    const handleNext = () => {
        if (selectedIndex === null) return;
        setSelectedIndex(selectedIndex < screenshots.length - 1 ? selectedIndex + 1 : 0);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') setSelectedIndex(null);
        if (e.key === 'ArrowLeft') handlePrevious();
        if (e.key === 'ArrowRight') handleNext();
    };

    if (screenshots.length === 0) {
        return (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                <p>No screenshots available</p>
            </div>
        );
    }

    return (
        <>
            <div
                className={`grid gap-4`}
                style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
            >
                {screenshots.map((screenshot, index) => (
                    <div
                        key={screenshot.id}
                        className="group relative aspect-video bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden cursor-pointer hover:shadow-xl transition-all"
                        onClick={() => setSelectedIndex(index)}
                    >
                        <Image
                            src={getImageUrl(screenshot)}
                            alt={screenshot.fileName}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform"
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                            <ZoomIn className="text-white opacity-0 group-hover:opacity-100 transition-opacity w-8 h-8" />
                        </div>
                        {screenshot.feature && (
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                                <p className="text-white text-sm font-medium truncate">
                                    {screenshot.feature.name}
                                </p>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Lightbox Modal */}
            {selectedIndex !== null && (
                <div
                    className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
                    onClick={() => setSelectedIndex(null)}
                    onKeyDown={handleKeyDown}
                    tabIndex={-1}
                >
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setSelectedIndex(null);
                        }}
                        className="absolute top-4 right-4 text-white hover:bg-white/10 p-2 rounded-full transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>

                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            handlePrevious();
                        }}
                        className="absolute left-4 text-white hover:bg-white/10 p-2 rounded-full transition-colors"
                    >
                        <ChevronLeft className="w-8 h-8" />
                    </button>

                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            handleNext();
                        }}
                        className="absolute right-4 text-white hover:bg-white/10 p-2 rounded-full transition-colors"
                    >
                        <ChevronRight className="w-8 h-8" />
                    </button>

                    <div className="relative max-w-6xl max-h-[90vh] w-full h-full" onClick={(e) => e.stopPropagation()}>
                        <Image
                            src={getImageUrl(screenshots[selectedIndex])}
                            alt={screenshots[selectedIndex].fileName}
                            fill
                            className="object-contain"
                            sizes="100vw"
                        />
                    </div>

                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white text-center">
                        <p className="text-lg font-medium mb-1">
                            {screenshots[selectedIndex].feature?.name || screenshots[selectedIndex].fileName}
                        </p>
                        <p className="text-sm opacity-75">
                            {selectedIndex + 1} / {screenshots.length}
                        </p>
                    </div>
                </div>
            )}
        </>
    );
}
