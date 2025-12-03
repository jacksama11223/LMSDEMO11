import React, { useState, useEffect, useRef } from 'react';

export interface TourStep {
    targetId: string;
    title: string;
    content: string;
    position?: 'top' | 'bottom' | 'left' | 'right';
}

interface OnboardingTourProps {
    steps: TourStep[];
    isOpen: boolean;
    onComplete: () => void;
    onSkip: () => void;
}

const OnboardingTour: React.FC<OnboardingTourProps> = ({ steps, isOpen, onComplete, onSkip }) => {
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
    const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({});
    
    const updatePosition = () => {
        const step = steps[currentStepIndex];
        if (!step) return;

        const element = document.getElementById(step.targetId);
        
        if (element) {
            const rect = element.getBoundingClientRect();
            setTargetRect(rect);
            
            let top = 0;
            let left = 0;
            const margin = 20;
            const tooltipWidth = 320; // approx width of tooltip
            const tooltipHeight = 200; // approx height
            
            // Default logic with boundary checks
            switch(step.position) {
                case 'right':
                    top = rect.top + rect.height / 2 - tooltipHeight / 2;
                    left = rect.right + margin;
                    break;
                case 'left':
                    top = rect.top + rect.height / 2 - tooltipHeight / 2;
                    left = rect.left - tooltipWidth - margin;
                    break;
                case 'bottom':
                    top = rect.bottom + margin;
                    left = rect.left + rect.width / 2 - tooltipWidth / 2;
                    break;
                case 'top':
                    top = rect.top - tooltipHeight - margin;
                    left = rect.left + rect.width / 2 - tooltipWidth / 2;
                    break;
                default:
                    top = rect.bottom + margin;
                    left = rect.left;
            }

            // Boundary Checks to ensure it fits in viewport
            if (left < margin) left = margin;
            if (top < margin) top = margin;
            if (left + tooltipWidth > window.innerWidth - margin) left = window.innerWidth - tooltipWidth - margin;
            if (top + tooltipHeight > window.innerHeight - margin) top = window.innerHeight - tooltipHeight - margin;


            setTooltipStyle({
                top: `${top}px`,
                left: `${left}px`,
                position: 'fixed',
                zIndex: 10001 // Above the overlay
            });
            
            // Scroll into view smoothly
            element.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
        } else {
            // Skip step if element not found (e.g., feature disabled)
            if (currentStepIndex < steps.length - 1) {
                setCurrentStepIndex(prev => prev + 1);
            } else {
                onComplete();
            }
        }
    };
    
    // Ensure we recalculate if window resizes
    useEffect(() => {
        if (isOpen) {
             const handleResize = () => updatePosition();
             window.addEventListener('resize', handleResize);
             return () => window.removeEventListener('resize', handleResize);
        }
    }, [isOpen, currentStepIndex]);


    useEffect(() => {
        if (isOpen) {
            // Small delay to allow UI to render before finding ID
            const timer = setTimeout(updatePosition, 300);
            return () => clearTimeout(timer);
        }
    }, [isOpen, currentStepIndex]);

    if (!isOpen || !steps[currentStepIndex]) return null;

    const currentStep = steps[currentStepIndex];
    const isLastStep = currentStepIndex === steps.length - 1;

    const handleNext = () => {
        if (isLastStep) {
            onComplete();
        } else {
            setCurrentStepIndex(prev => prev + 1);
        }
    };

    return (
        <div className="fixed inset-0 z-[9999] overflow-hidden">
            {/* Dark Overlay with Cutout logic using huge box-shadow */}
            {targetRect && (
                <div 
                    className="absolute transition-all duration-500 ease-in-out pointer-events-none"
                    style={{
                        top: targetRect.top - 8, // padding
                        left: targetRect.left - 8,
                        width: targetRect.width + 16,
                        height: targetRect.height + 16,
                        borderRadius: '24px', // Approx match standard UI
                        boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.75), 0 0 20px 5px rgba(56, 189, 248, 0.6)' // The cutout effect + glow
                    }}
                ></div>
            )}

            {/* Tooltip Card */}
            <div 
                style={tooltipStyle} 
                className="w-80 bg-black/80 backdrop-blur-xl border border-cyan-500/50 rounded-2xl p-6 shadow-[0_0_30px_rgba(6,182,212,0.4)] transition-all duration-500 animate-pop-in relative"
            >
                {/* Holographic decorative corners */}
                <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-cyan-400 rounded-tl-lg"></div>
                <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-cyan-400 rounded-tr-lg"></div>
                <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-cyan-400 rounded-bl-lg"></div>
                <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-cyan-400 rounded-br-lg"></div>

                <div className="flex items-center gap-2 mb-3">
                    <span className="text-cyan-400 animate-pulse">◈</span>
                    <h3 className="text-lg font-bold text-white uppercase tracking-wider text-shadow-glow">{currentStep.title}</h3>
                </div>
                
                <p className="text-blue-100 text-sm mb-6 leading-relaxed">
                    {currentStep.content}
                </p>

                <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500 font-mono">Step {currentStepIndex + 1}/{steps.length}</span>
                    <div className="flex gap-2">
                        <button 
                            onClick={onSkip}
                            className="px-3 py-1.5 text-xs text-gray-400 hover:text-white transition-colors"
                        >
                            Bỏ qua
                        </button>
                        <button 
                            onClick={handleNext}
                            className="px-5 py-1.5 text-sm bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-bold shadow-[0_0_15px_rgba(8,145,178,0.5)] transition-all"
                        >
                            {isLastStep ? 'Hoàn tất' : 'Tiếp theo'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OnboardingTour;