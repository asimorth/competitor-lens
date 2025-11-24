-- ✂️ TÜMÜNÜ KOPYALA VE RAILWAY'DE ÇALIŞTIR ✂️

-- Migration: Add Screenshot Metadata Fields
-- Phase 0: Data Foundation Enhancement

-- Add Quality & Context fields
ALTER TABLE screenshots ADD COLUMN IF NOT EXISTS quality VARCHAR(20) DEFAULT 'unknown';
ALTER TABLE screenshots ADD COLUMN IF NOT EXISTS context VARCHAR(50);
ALTER TABLE screenshots ADD COLUMN IF NOT EXISTS visual_complexity VARCHAR(20);

-- Add UI/UX Analysis fields (for Product Designers)
ALTER TABLE screenshots ADD COLUMN IF NOT EXISTS has_text BOOLEAN DEFAULT false;
ALTER TABLE screenshots ADD COLUMN IF NOT EXISTS has_ui BOOLEAN DEFAULT false;
ALTER TABLE screenshots ADD COLUMN IF NOT EXISTS has_data BOOLEAN DEFAULT false;
ALTER TABLE screenshots ADD COLUMN IF NOT EXISTS ui_pattern VARCHAR(50);
ALTER TABLE screenshots ADD COLUMN IF NOT EXISTS color_scheme VARCHAR(20);

-- Add Assignment Quality fields
ALTER TABLE screenshots ADD COLUMN IF NOT EXISTS assignment_confidence DOUBLE PRECISION DEFAULT 0;
ALTER TABLE screenshots ADD COLUMN IF NOT EXISTS assignment_method VARCHAR(20) DEFAULT 'manual';
ALTER TABLE screenshots ADD COLUMN IF NOT EXISTS needs_review BOOLEAN DEFAULT false;
ALTER TABLE screenshots ADD COLUMN IF NOT EXISTS reviewed_by VARCHAR(255);
ALTER TABLE screenshots ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP;

-- Add Usage Tracking fields
ALTER TABLE screenshots ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;
ALTER TABLE screenshots ADD COLUMN IF NOT EXISTS last_viewed_at TIMESTAMP;

-- Add Presentation Hints
ALTER TABLE screenshots ADD COLUMN IF NOT EXISTS is_showcase BOOLEAN DEFAULT false;
ALTER TABLE screenshots ADD COLUMN IF NOT EXISTS display_order INTEGER;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_screenshots_needs_review ON screenshots(needs_review);
CREATE INDEX IF NOT EXISTS idx_screenshots_quality ON screenshots(quality);
CREATE INDEX IF NOT EXISTS idx_screenshots_assignment_confidence ON screenshots(assignment_confidence);

-- Comments
COMMENT ON COLUMN screenshots.quality IS 'excellent, good, acceptable, poor, needs-update, unknown';
COMMENT ON COLUMN screenshots.context IS 'login, dashboard, feature-detail, settings, onboarding';
COMMENT ON COLUMN screenshots.visual_complexity IS 'simple, moderate, complex';
COMMENT ON COLUMN screenshots.ui_pattern IS 'modal, fullscreen, widget, list, form, chart';
COMMENT ON COLUMN screenshots.color_scheme IS 'light, dark, colorful';
COMMENT ON COLUMN screenshots.assignment_method IS 'manual, ai, path-based, pattern';
COMMENT ON COLUMN screenshots.assignment_confidence IS 'Confidence score 0.0-1.0';
COMMENT ON COLUMN screenshots.needs_review IS 'Flag for manual review needed';
COMMENT ON COLUMN screenshots.is_showcase IS 'Best quality, use in galleries';

