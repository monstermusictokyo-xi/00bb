/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState } from 'react';

const MOCK_SLIDES = [
    { id: 1, src: 'https://picsum.photos/300/200?grayscale&blur=2', x: 50, y: 50, title: 'SECTOR_01_SCAN' },
    { id: 2, src: 'https://picsum.photos/300/200?grayscale&blur=1', x: 320, y: 80, title: 'TARGET_GRID_ALPHA' },
    { id: 3, src: 'https://picsum.photos/300/200?grayscale', x: 150, y: 250, title: 'DRONE_FEED_LIVE' },
];

export const SlidesApp: React.FC = () => {
    const [slides, setSlides] = useState(MOCK_SLIDES);
    const [dragId, setDragId] = useState<number | null>(null);
    const [offset, setOffset] = useState({ x: 0, y: 0 });

    const handleMouseDown = (e: React.MouseEvent, id: number) => {
        e.stopPropagation(); // Prevent window drag
        const slide = slides.find(s => s.id === id);
        if (!slide) return;
        setDragId(id);
        setOffset({
            x: e.clientX - slide.x,
            y: e.clientY - slide.y
        });
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (dragId === null) return;
        setSlides(prev => prev.map(slide =>
            slide.id === dragId
                ? { ...slide, x: e.clientX - offset.x, y: e.clientY - offset.y }
                : slide
        ));
    };

    const handleMouseUp = () => {
        setDragId(null);
    };

    return (
        <div
            className="h-full w-full bg-black relative overflow-hidden flex flex-col"
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
        >
            <div className="bg-holo-panel/40 border-b border-holo-border/30 px-4 py-2 flex items-center shrink-0 justify-between">
                <h2 className="font-mono font-bold text-holo-accent text-xs uppercase tracking-widest text-glow">Tactical Map // CLASSIFIED</h2>
                <div className="flex gap-2 items-center">
                     <div className="w-2 h-2 bg-holo-alert rounded-full animate-pulse shadow-[0_0_5px_red]" />
                     <span className="text-[10px] text-holo-alert uppercase font-bold">Live Uplink</span>
                </div>
            </div>
            
            <div className="flex-1 relative bg-[radial-gradient(rgba(0,243,255,0.1)_1px,transparent_1px)] [background-size:20px_20px] p-4 overflow-hidden">
                 {/* Crosshairs overlay */}
                 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-px bg-holo-border/20 pointer-events-none" />
                 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-full w-px bg-holo-border/20 pointer-events-none" />
                 
                 <p className="text-holo-text/20 text-xs absolute top-4 left-4 pointer-events-none select-none font-mono">
                    REARRANGE DATA PACKETS
                 </p>

                {slides.map((slide) => (
                    <div
                        key={slide.id}
                        style={{ left: slide.x, top: slide.y }}
                        className={`absolute w-52 bg-black/80 border ${dragId === slide.id ? 'border-holo-accent shadow-[0_0_20px_rgba(0,243,255,0.4)]' : 'border-holo-border/40'} p-1 cursor-move group transition-shadow duration-200`}
                        onMouseDown={(e) => handleMouseDown(e, slide.id)}
                    >
                        <div className="relative overflow-hidden">
                            <img src={slide.src} alt={slide.title} className="w-full h-28 object-cover opacity-70 group-hover:opacity-100 transition-opacity filter contrast-125 hue-rotate-180" />
                            <div className="absolute inset-0 bg-holo-accent/10 mix-blend-overlay pointer-events-none" />
                            
                            {/* Corner markers */}
                            <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-white/50" />
                            <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-white/50" />
                        </div>
                        <div className="mt-1 flex justify-between items-center px-1">
                            <p className="text-holo-text text-[10px] font-mono uppercase truncate group-hover:text-holo-accent">{slide.title}</p>
                            <p className="text-holo-text/40 text-[8px] font-mono">ID-{slide.id}X</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};