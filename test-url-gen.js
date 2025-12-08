
const API_BASE_URL = 'https://competitor-lens-production.up.railway.app';

function getScreenshotUrl(screenshot) {
    // CDN URL varsa onu kullan
    if (screenshot.cdnUrl) {
        return screenshot.cdnUrl;
    }

    // Screenshot path'i varsa
    if (screenshot.filePath) {
        let cleanPath = screenshot.filePath;

        // Normalize absolute paths (e.g. /app/uploads/... or /Users/.../uploads/...)
        if (cleanPath.includes('uploads/')) {
            cleanPath = 'uploads/' + cleanPath.split('uploads/')[1];
        }

        // Ensure clean path doesn't start with /
        if (cleanPath.startsWith('/')) {
            cleanPath = cleanPath.substring(1);
        }

        return `${API_BASE_URL}/${cleanPath}`;
    }

    return '/placeholder';
}

// Test cases
const testCases = [
    { filePath: '/app/uploads/screenshots/Paribu/features/feature_123.png' },
    { filePath: 'uploads/screenshots/Paribu/features/feature_123.png' },
    { filePath: '/Users/Furkan/uploads/screenshots/Paribu/features/feature_123.png' }
];

testCases.forEach(tc => {
    console.log(`Input: ${tc.filePath}`);
    console.log(`Output: ${getScreenshotUrl(tc)}`);
    console.log('---');
});
