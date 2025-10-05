-- CreateTable
CREATE TABLE "competitor_feature_screenshots" (
    "id" TEXT NOT NULL,
    "competitor_feature_id" TEXT NOT NULL,
    "screenshot_path" TEXT NOT NULL,
    "caption" TEXT,
    "display_order" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "competitor_feature_screenshots_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "competitor_feature_screenshots" ADD CONSTRAINT "competitor_feature_screenshots_competitor_feature_id_fkey" FOREIGN KEY ("competitor_feature_id") REFERENCES "competitor_features"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable - Remove JSON screenshots column
ALTER TABLE "competitor_features" DROP COLUMN IF EXISTS "screenshots";


