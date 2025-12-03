
import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import type { FlashcardDeck } from '../../types';

interface FlashcardModalProps {
    isOpen: boolean;
    onClose: () => void;
    deck: FlashcardDeck | null;
}

const FlashcardModal: React.FC<FlashcardModalProps> = ({ isOpen, onClose, deck }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setCurrentIndex(0);
            setIsFlipped(false);
        }
    }, [isOpen]);

    if (!deck || !isOpen) return null;

    const currentCard = deck.cards[currentIndex];

    const handleNext = () => {
        if (currentIndex < deck.cards.length - 1) {
            setCurrentIndex(prev => prev + 1);
            setIsFlipped(false);
        }
    };

    const handlePrev = () => {
        if (currentIndex > 0) {
            setCurrentIndex(prev => prev - 1);
            setIsFlipped(false);
        }
    };

    const handleFlip = () => setIsFlipped(!isFlipped);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Flashcards: ${deck.title}`} size="lg">
            <div className="flex flex-col items-center space-y-6 py-4">
                {/* Progress Bar */}
                <div className="w-full bg-gray-700 rounded-full h-2">
                    <div 
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300" 
                        style={{ width: `${((currentIndex + 1) / deck.cards.length) * 100}%` }}
                    ></div>
                </div>
                <p className="text-gray-400 text-sm">Thẻ {currentIndex + 1} / {deck.cards.length}</p>

                {/* Card Area - 3D Flip Effect */}
                <div 
                    className="relative w-full max-w-md h-64 cursor-pointer perspective-1000"
                    onClick={handleFlip}
                    style={{ perspective: '1000px' }}
                >
                    <div 
                        className={`relative w-full h-full transition-transform duration-500 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`}
                        style={{ transformStyle: 'preserve-3d', transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}
                    >
                        {/* Front */}
                        <div className="absolute w-full h-full backface-hidden bg-gray-800 border border-gray-600 rounded-xl flex items-center justify-center p-8 text-center shadow-xl" style={{ backfaceVisibility: 'hidden' }}>
                            <h3 className="text-2xl font-bold text-gray-200">{currentCard.front}</h3>
                            <p className="absolute bottom-4 text-gray-500 text-xs">Nhấn để lật</p>
                        </div>

                        {/* Back */}
                        <div 
                            className="absolute w-full h-full backface-hidden bg-blue-900 border border-blue-700 rounded-xl flex items-center justify-center p-8 text-center shadow-xl"
                            style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                        >
                            <p className="text-xl text-white">{currentCard.back}</p>
                        </div>
                    </div>
                </div>

                {/* Controls */}
                <div className="flex space-x-4 mt-4">
                    <button 
                        onClick={handlePrev} 
                        disabled={currentIndex === 0}
                        className="btn btn-secondary"
                    >
                        &larr; Trước
                    </button>
                    <button 
                        onClick={handleNext} 
                        disabled={currentIndex === deck.cards.length - 1}
                        className="btn btn-primary"
                    >
                        Tiếp theo &rarr;
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default FlashcardModal;
