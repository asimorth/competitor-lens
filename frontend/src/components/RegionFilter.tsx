'use client';

import { useState } from 'react';

interface RegionFilterProps {
    currentRegion: string | null;
    onChange: (region: string | null) => void;
    regions?: { label: string; value: string | null; count?: number }[];
}

export default function RegionFilter({ currentRegion, onChange, regions }: RegionFilterProps) {
    const defaultRegions: { label: string; value: string | null; count?: number }[] = [
        { label: 'All Exchanges', value: null },
        { label: 'Turkey (TR)', value: 'TR' },
        { label: 'Global', value: 'Global' }
    ];

    const displayRegions = regions || defaultRegions;

    return (
        <div className="flex gap-2 overflow-x-auto py-2">
            {displayRegions.map((region) => {
                const isActive = currentRegion === region.value;
                return (
                    <button
                        key={region.value || 'all'}
                        onClick={() => onChange(region.value)}
                        className={`
              px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap
              ${isActive
                                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
                                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                            }
            `}
                    >
                        {region.label}
                        {region.count !== undefined && (
                            <span className={`ml-2 text-sm ${isActive ? 'opacity-90' : 'opacity-60'}`}>
                                ({region.count})
                            </span>
                        )}
                    </button>
                );
            })}
        </div>
    );
}
