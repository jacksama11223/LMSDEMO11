
import React from 'react';
import type { LearningNode } from '../../types';

interface DuolingoTreeProps {
    nodes: LearningNode[];
    onNodeClick?: (node: LearningNode, isLast: boolean) => void;
}

const DuolingoTree: React.FC<DuolingoTreeProps> = ({ nodes, onNodeClick }) => {
    if (!nodes || nodes.length === 0) return null;

    // Helper to get icon based on type
    const getIcon = (type: string, isLocked: boolean) => {
        if (isLocked) return '🔒';
        switch (type) {
            case 'theory': return '📖';
            case 'practice': return '✏️';
            case 'challenge': return '👹'; // BOSS ICON
            default: return '⭐';
        }
    };

    const getOffsetClass = (index: number) => {
        const pattern = [0, -1, 0, 1]; // Center, Left, Center, Right
        const pos = pattern[index % 4];
        if (pos === -1) return '-translate-x-12';
        if (pos === 1) return 'translate-x-12';
        return '';
    };

    // Find the index of the first locked node to calculate fog of war
    const firstLockedIndex = nodes.findIndex(n => n.isLocked);
    const visibleRange = firstLockedIndex === -1 ? nodes.length : firstLockedIndex + 2; // Show 2 locked nodes ahead

    return (
        <div className="relative py-8 flex flex-col items-center">
             {nodes.map((node, index) => {
                const isLast = index === nodes.length - 1;
                const offsetClass = getOffsetClass(index);
                
                // FOG OF WAR LOGIC
                const isFogged = index >= visibleRange;
                if (isFogged) return null; // Don't render fogged nodes

                // Status styles
                let bgClass = 'bg-gray-700 border-gray-600';
                let shadowClass = '';
                let scaleClass = 'hover:scale-105';
                
                if (!node.isLocked) {
                    if (node.isCompleted) {
                         bgClass = 'bg-yellow-500 border-yellow-600'; // Gold
                         shadowClass = 'shadow-[0_6px_0_rgb(161,98,7)]'; 
                    } else {
                        // Unlocked but active
                        switch (node.type) {
                            case 'theory': 
                                bgClass = 'bg-blue-500 border-blue-600'; 
                                shadowClass = 'shadow-[0_6px_0_rgb(29,78,216)]';
                                break;
                            case 'practice': 
                                bgClass = 'bg-green-500 border-green-600'; 
                                shadowClass = 'shadow-[0_6px_0_rgb(21,128,61)]';
                                break;
                            case 'challenge': 
                                // BOSS NODE STYLING
                                bgClass = 'bg-red-600 border-red-700 animate-pulse'; 
                                shadowClass = 'shadow-[0_0_20px_rgba(239,68,68,0.6)]';
                                scaleClass = 'scale-125 hover:scale-135';
                                break;
                        }
                    }
                } else if (index === visibleRange - 1) {
                    // Next locked node (Semi-visible)
                    bgClass = 'bg-gray-800 border-gray-600 opacity-60';
                }

                return (
                    <div key={node.id} className={`relative z-10 flex flex-col items-center mb-12 transition-transform duration-300 ${offsetClass} ${index === visibleRange - 1 ? 'blur-[1px] grayscale' : ''}`}>
                        
                        {/* The Circle Node */}
                        <button 
                            onClick={() => !node.isLocked && onNodeClick && onNodeClick(node, isLast)}
                            disabled={node.isLocked}
                            className={`w-20 h-20 rounded-full flex items-center justify-center text-3xl border-4 cursor-pointer transition-all active:translate-y-1 active:shadow-none focus:outline-none
                            ${bgClass} ${shadowClass} ${scaleClass} ${node.isLocked ? 'cursor-not-allowed' : ''}`}
                        >
                            {getIcon(node.type, node.isLocked)}
                        </button>

                        {/* Label Bubble */}
                        <div className={`absolute top-full mt-3 bg-gray-800 text-gray-200 text-xs font-bold py-1 px-3 rounded-xl border-2 border-gray-700 shadow-sm whitespace-nowrap max-w-[150px] overflow-hidden text-ellipsis ${node.type === 'challenge' ? 'border-red-500 text-red-400' : ''}`}>
                            {node.title}
                        </div>

                         {/* Connecting Line */}
                         {!isLast && index < visibleRange - 1 && (
                            <div className="absolute top-10 left-1/2 w-16 h-24 -z-10 pointer-events-none">
                                <svg className="w-40 h-32 -ml-20 overflow-visible">
                                    <path 
                                        d={`M 20 10 Q ${index % 2 === 0 ? '0 60, 60 100' : '40 60, -20 100'}`} 
                                        fill="none" 
                                        stroke={node.isCompleted ? "#EAB308" : "#4B5563"} 
                                        strokeWidth="8" 
                                        strokeLinecap="round"
                                        strokeDasharray={node.isCompleted ? "" : "12 12"}
                                        className={node.isCompleted ? "opacity-100" : "opacity-50"}
                                    />
                                </svg>
                            </div>
                        )}
                    </div>
                );
             })}
             
             {/* Fog of War Indicator */}
             {visibleRange < nodes.length && (
                 <div className="mt-4 flex flex-col items-center opacity-50">
                     <div className="text-2xl animate-bounce">🔒</div>
                     <p className="text-xs text-gray-500 mt-2">??? (Bị khóa)</p>
                 </div>
             )}
        </div>
    );
};

export default DuolingoTree;
