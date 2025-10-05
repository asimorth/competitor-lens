'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, EffectCoverflow } from 'swiper/modules';
import { 
  ChevronLeft, 
  ChevronRight, 
  Play, 
  Pause,
  RotateCcw,
  Maximize2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { useBreakpoint } from '@/hooks/useMediaQuery';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/effect-coverflow';

interface OnboardingStep {
  id: string;
  screenshotUrl: string;
  stepNumber: number;
  stepDescription?: string;
  displayOrder: number;
}

interface OnboardingFlowProps {
  competitorName: string;
  steps: OnboardingStep[];
  className?: string;
  autoPlay?: boolean;
  autoPlayDelay?: number;
}

export function OnboardingFlow({
  competitorName,
  steps,
  className,
  autoPlay = false,
  autoPlayDelay = 3000
}: OnboardingFlowProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const { isMobile, isTablet } = useBreakpoint();

  // Sort steps by display order
  const sortedSteps = [...steps].sort((a, b) => a.displayOrder - b.displayOrder);

  // Auto-play functionality
  React.useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setCurrentStep(prev => 
        prev === sortedSteps.length - 1 ? 0 : prev + 1
      );
    }, autoPlayDelay);

    return () => clearInterval(interval);
  }, [isPlaying, sortedSteps.length, autoPlayDelay]);

  const handlePrevious = () => {
    setCurrentStep(prev => 
      prev === 0 ? sortedSteps.length - 1 : prev - 1
    );
  };

  const handleNext = () => {
    setCurrentStep(prev => 
      prev === sortedSteps.length - 1 ? 0 : prev + 1
    );
  };

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleRestart = () => {
    setCurrentStep(0);
    setIsPlaying(true);
  };

  // Mobile View - Swiper
  if (isMobile) {
    return (
      <div className={cn("space-y-4", className)}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold">{competitorName} Onboarding</h3>
            <p className="text-sm text-gray-500">{sortedSteps.length} adım</p>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={togglePlayPause}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsFullscreen(true)}
            >
              <Maximize2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Progress Bar */}
        <Progress 
          value={(currentStep + 1) / sortedSteps.length * 100} 
          className="h-2"
        />

        {/* Swiper */}
        <Swiper
          modules={[Navigation, Pagination]}
          spaceBetween={20}
          slidesPerView={1}
          navigation
          pagination={{ clickable: true }}
          onSlideChange={(swiper) => setCurrentStep(swiper.activeIndex)}
          initialSlide={currentStep}
          className="onboarding-swiper"
        >
          {sortedSteps.map((step, index) => (
            <SwiperSlide key={step.id}>
              <Card className="overflow-hidden">
                <div className="relative aspect-video bg-gray-100">
                  <Image
                    src={step.screenshotUrl}
                    alt={`Step ${step.stepNumber}`}
                    fill
                    className="object-cover"
                  />
                  <Badge className="absolute top-2 left-2">
                    Adım {step.stepNumber}
                  </Badge>
                </div>
                {step.stepDescription && (
                  <div className="p-4">
                    <p className="text-sm">{step.stepDescription}</p>
                  </div>
                )}
              </Card>
            </SwiperSlide>
          ))}
        </Swiper>

        {/* Step Indicators */}
        <div className="flex justify-center gap-1">
          {sortedSteps.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentStep(index)}
              className={cn(
                "w-2 h-2 rounded-full transition-all",
                index === currentStep 
                  ? "w-8 bg-blue-600" 
                  : "bg-gray-300"
              )}
            />
          ))}
        </div>
      </div>
    );
  }

  // Tablet/Desktop View - Timeline
  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold">{competitorName} Onboarding Flow</h3>
          <p className="text-gray-500">
            {sortedSteps.length} adımlık kayıt süreci
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={togglePlayPause}
          >
            {isPlaying ? (
              <>
                <Pause className="w-4 h-4 mr-2" />
                Duraklat
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Oynat
              </>
            )}
          </Button>
          <Button
            variant="outline"
            onClick={handleRestart}
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Baştan
          </Button>
        </div>
      </div>

      {/* Progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Adım {currentStep + 1} / {sortedSteps.length}</span>
          <span>{Math.round((currentStep + 1) / sortedSteps.length * 100)}% Tamamlandı</span>
        </div>
        <Progress 
          value={(currentStep + 1) / sortedSteps.length * 100} 
          className="h-3"
        />
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Screenshot */}
        <div className="lg:col-span-2">
          <Card className="overflow-hidden">
            <div className="relative aspect-video bg-gray-100">
              <Image
                src={sortedSteps[currentStep].screenshotUrl}
                alt={`Step ${sortedSteps[currentStep].stepNumber}`}
                fill
                className="object-contain"
                priority
              />
              <Badge className="absolute top-4 left-4" variant="secondary">
                Adım {sortedSteps[currentStep].stepNumber}
              </Badge>
            </div>
          </Card>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-4">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 0}
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Önceki
            </Button>
            
            <div className="flex gap-1">
              {sortedSteps.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentStep(index)}
                  className={cn(
                    "w-2 h-2 rounded-full transition-all",
                    index === currentStep 
                      ? "w-8 bg-blue-600" 
                      : "bg-gray-300 hover:bg-gray-400"
                  )}
                />
              ))}
            </div>

            <Button
              variant="outline"
              onClick={handleNext}
              disabled={currentStep === sortedSteps.length - 1}
            >
              Sonraki
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>

        {/* Step List */}
        <div className="space-y-2">
          <h4 className="font-medium mb-3">Tüm Adımlar</h4>
          {sortedSteps.map((step, index) => (
            <Card
              key={step.id}
              className={cn(
                "p-3 cursor-pointer transition-all",
                index === currentStep 
                  ? "border-blue-500 bg-blue-50" 
                  : "hover:bg-gray-50"
              )}
              onClick={() => setCurrentStep(index)}
            >
              <div className="flex items-start gap-3">
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
                  index === currentStep 
                    ? "bg-blue-600 text-white" 
                    : "bg-gray-200 text-gray-600"
                )}>
                  {step.stepNumber}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">
                    Adım {step.stepNumber}
                  </p>
                  {step.stepDescription && (
                    <p className="text-xs text-gray-500 mt-1">
                      {step.stepDescription}
                    </p>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

// Comparison View - Multiple Onboarding Flows
export function OnboardingComparison({
  competitors,
  className
}: {
  competitors: Array<{
    name: string;
    steps: OnboardingStep[];
  }>;
  className?: string;
}) {
  const [currentSteps, setCurrentSteps] = useState<Record<string, number>>(
    competitors.reduce((acc, comp) => ({ ...acc, [comp.name]: 0 }), {})
  );

  const maxSteps = Math.max(...competitors.map(c => c.steps.length));

  return (
    <div className={cn("space-y-6", className)}>
      <h3 className="text-xl font-semibold">Onboarding Karşılaştırması</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {competitors.map(competitor => {
          const sortedSteps = [...competitor.steps].sort((a, b) => a.displayOrder - b.displayOrder);
          const currentStep = currentSteps[competitor.name] || 0;
          
          return (
            <Card key={competitor.name} className="p-4">
              <h4 className="font-medium mb-2">{competitor.name}</h4>
              <p className="text-sm text-gray-500 mb-4">
                {sortedSteps.length} adım
              </p>
              
              <div className="relative aspect-video bg-gray-100 mb-4 rounded-lg overflow-hidden">
                {sortedSteps[currentStep] && (
                  <Image
                    src={sortedSteps[currentStep].screenshotUrl}
                    alt={`${competitor.name} Step ${currentStep + 1}`}
                    fill
                    className="object-cover"
                  />
                )}
              </div>
              
              <div className="flex justify-between items-center">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setCurrentSteps(prev => ({
                    ...prev,
                    [competitor.name]: Math.max(0, currentStep - 1)
                  }))}
                  disabled={currentStep === 0}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                
                <span className="text-sm">
                  {currentStep + 1} / {sortedSteps.length}
                </span>
                
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setCurrentSteps(prev => ({
                    ...prev,
                    [competitor.name]: Math.min(sortedSteps.length - 1, currentStep + 1)
                  }))}
                  disabled={currentStep === sortedSteps.length - 1}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
      
      {/* Step count comparison */}
      <Card className="p-4">
        <h4 className="font-medium mb-4">Adım Sayısı Karşılaştırması</h4>
        <div className="space-y-2">
          {competitors
            .sort((a, b) => a.steps.length - b.steps.length)
            .map(comp => (
              <div key={comp.name} className="flex items-center gap-4">
                <span className="w-32 text-sm">{comp.name}</span>
                <div className="flex-1 bg-gray-200 rounded-full h-6 relative">
                  <div 
                    className="bg-blue-600 h-full rounded-full flex items-center justify-end pr-2"
                    style={{ width: `${(comp.steps.length / maxSteps) * 100}%` }}
                  >
                    <span className="text-xs text-white font-medium">
                      {comp.steps.length}
                    </span>
                  </div>
                </div>
              </div>
            ))}
        </div>
      </Card>
    </div>
  );
}
