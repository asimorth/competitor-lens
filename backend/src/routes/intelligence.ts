import { Router } from 'express';
import { intelligenceController } from '../controllers/intelligenceController';

const router = Router();

/**
 * Intelligence API Routes
 * Multi-persona insights and analysis for features and competitors
 */

// Feature Intelligence - Multi-Persona Endpoints
router.get('/feature/:id/pm', intelligenceController.getFeaturePMInsights);
router.get('/feature/:id/designer', intelligenceController.getFeatureDesignerInsights);
router.get('/feature/:id/executive', intelligenceController.getFeatureExecutiveInsights);

// Feature Intelligence - Analysis Endpoints
router.get('/feature/:id/analyze', intelligenceController.analyzeFeature);
router.get('/feature/:id/positioning', intelligenceController.getFeaturePositioning);
router.get('/feature/:id/opportunity', intelligenceController.getFeatureOpportunity);

// Competitor Intelligence - Multi-Persona Endpoints
router.get('/competitor/:id/pm', intelligenceController.getCompetitorPMInsights);
router.get('/competitor/:id/designer', intelligenceController.getCompetitorDesignerInsights);
router.get('/competitor/:id/executive', intelligenceController.getCompetitorExecutiveInsights);

// Competitor Intelligence - Analysis Endpoints
router.get('/competitor/:id/analyze', intelligenceController.analyzeCompetitor);
router.get('/competitor/:id/benchmark', intelligenceController.getCompetitorBenchmark);

// Comparison
router.get('/compare/:id1/:id2', intelligenceController.compareCompetitors);

export default router;

