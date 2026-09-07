/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useRef, useEffect } from 'react';
import { X, Minus, Square, Hexagon } from 'lucide-react';

interface DraggableWindowProps {
    id: string;
    title: string;
    icon?: React.ElementType;
    onClose: () => void;
    children: React.ReactNode;
    initialPos?: { x: number; y: number };
    initialSize?: { width: number; height: number };
    zIndex: number;
    onFocus?: () => void;
    isActive?: boolean;
}

export const DraggableWindow: React.FC<DraggableWindowProps> = ({
    id,
    title,
    icon: Icon,
    onClose,
    children,
    initialPos = { x: 50, y: 50 },
    initialSize = { width: 640, height: 480 },
    zIndex,
    onFocus,
    isActive = false
}) => {
    const [pos, setPos] = useState(initialPos);
    const [size, setSize] = useState(initialSize);
    const [isDragging, setIsDragging] = useState(false);
    const [isResizing, setIsResizing] = useState(false);
    const [isMaximized, setIsMaximized] = useState(false);
    const preMaximizeState = useRef({ pos, size });
    
    const dragStartPos = useRef({ x: 0, y: 0 });
    const resizeStart = useRef({ x: 0, y: 0, width: 0, height: 0 });
    const windowRef = useRef<HTMLDivElement>(null);

    const handleHeaderPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
        if (e.target instanceof Element && e.target.closest('button')) return;
        
        if (onFocus) onFocus();
        if (isMaximized) return;
        
        e.preventDefault();
        e.stopPropagation();
        e.currentTarget.setPointerCapture(e.pointerId);
        
        setIsDragging(true);
        dragStartPos.current = {
            x: e.clientX - pos.x,
            y: e.clientY - pos.y
        };
    };

    const handleResizePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        e.currentTarget.setPointerCapture(e.pointerId);

        if (onFocus) onFocus();
        setIsResizing(true);
        resizeStart.current = {
            x: e.clientX,
            y: e.clientY,
            width: size.width,
            height: size.height
        };
    };

    const toggleMaximize = () => {
        if (isMaximized) {
            setPos(preMaximizeState.current.pos);
            setSize(preMaximizeState.current.size);
        } else {
            preMaximizeState.current = { pos, size };
            setPos({ x: 0, y: 0 });
        }
        setIsMaximized(!isMaximized);
        if (onFocus) onFocus();
    };

    useEffect(() => {
        const handleGlobalPointerMove = (e: PointerEvent) => {
            if (!isDragging && !isResizing) return;
            e.preventDefault(); 

            if (isDragging) {
                setPos({
                    x: e.clientX - dragStartPos.current.x,
                    y: e.clientY - dragStartPos.current.y
                });
            }
            if (isResizing) {
                setSize({
                    width: Math.max(300, resizeStart.current.width + (e.clientX - resizeStart.current.x)),
                    height: Math.max(200, resizeStart.current.height + (e.clientY - resizeStart.current.y))
                });
            }
        };

        const handleGlobalPointerUp = (e: PointerEvent) => {
             if (isDragging || isResizing) {
                 setIsDragging(false);
                 setIsResizing(false);
             }
        };

        if (isDragging || isResizing) {
            window.addEventListener('pointermove', handleGlobalPointerMove, { passive: false });
            window.addEventListener('pointerup', handleGlobalPointerUp);
            window.addEventListener('pointercancel', handleGlobalPointerUp);
        }
        return () => {
            window.removeEventListener('pointermove', handleGlobalPointerMove);
            window.removeEventListener('pointerup', handleGlobalPointerUp);
            window.removeEventListener('pointercancel', handleGlobalPointerUp);
        };
    }, [isDragging, isResizing]);

    return (
        <div
            ref={windowRef}
            style={!isMaximized ? {
                left: pos.x,
                top: pos.y,
                width: size.width,
                height: size.height,
                zIndex: zIndex
            } : {
                zIndex: zIndex
            }}
            className={`absolute flex flex-col glass-panel border ${isActive ? 'border-holo-accent shadow-glow' : 'border-holo-border/30'} ${isMaximized ? 'inset-0 rounded-none m-0 h-full w-full' : 'rounded-tr-3xl rounded-bl-3xl'} transition-all duration-75 ease-out touch-none overflow-hidden`}
            onPointerDown={() => { if (onFocus) onFocus(); }}
        >
            {/* Holographic corner accents */}
            <div className={`absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 ${isActive ? 'border-holo-accent' : 'border-holo-border/50'} pointer-events-none`} />
            <div className={`absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 ${isActive ? 'border-holo-accent' : 'border-holo-border/50'} pointer-events-none rounded-br-lg`} />

            {/* Header */}
            <div
                onDoubleClick={toggleMaximize}
                onPointerDown={handleHeaderPointerDown}
                className={`relative bg-gradient-to-r from-holo-panel/80 to-transparent border-b border-holo-border/30 px-3 py-2 flex items-center justify-between select-none touch-none ${!isMaximized ? 'cursor-grab active:cursor-grabbing' : ''}`}
            >
                <div className="flex items-center gap-3 pl-1">
                     <div className={`relative w-3 h-3 flex items-center justify-center`}>
                         <Hexagon size={14} className={`${isActive ? 'text-holo-accent animate-spin-slow' : 'text-holo-text/30'}`} strokeWidth={3} />
                         {isActive && <div className="absolute inset-0 bg-holo-accent blur-[4px] opacity-50" />}
                     </div>
                    <span className={`text-xs font-mono uppercase tracking-widest ${isActive ? 'text-holo-accent text-glow' : 'text-holo-text/50'}`}>
                        {title}
                    </span>
                </div>
                <div className="flex items-center gap-1 z-10">
                     <button className="p-1.5 hover:bg-holo-text/10 text-holo-text hover:text-white transition-colors rounded-full">
                        <Minus size={12} />
                    </button>
                    <button onClick={toggleMaximize} className="p-1.5 hover:bg-holo-text/10 text-holo-text hover:text-white transition-colors rounded-full">
                        <Square size={10} />
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); onClose(); }}
                        onPointerDown={(e) => e.stopPropagation()}
                        className="p-1.5 hover:bg-holo-alert/20 text-holo-text hover:text-holo-alert transition-colors rounded-full"
                    >
                        <X size={12} />
                    </button>
                </div>
                
                {/* Animated Header Line */}
                <div className="absolute bottom-0 left-0 h-[1px] bg-gradient-to-r from-transparent via-holo-accent to-transparent w-full opacity-50" />
            </div>

            {/* Window Content */}
            <div className="flex-1 overflow-hidden relative bg-black/40 backdrop-blur-sm">
                 {/* Scanlines inside window */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(18,18,18,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-[1] pointer-events-none bg-[length:100%_2px,3px_100%] opacity-10" />
                
                <div className="relative z-[2] h-full flex flex-col">
                    {children}
                </div>

                {!isActive && <div className="absolute inset-0 bg-black/20 z-[10] pointer-events-none" />}
            </div>

            {/* Resize Handle */}
            {!isMaximized && (
                <div
                    className="absolute bottom-0 right-0 w-8 h-8 cursor-nwse-resize flex items-center justify-center z-20 text-holo-accent/50 touch-none"
                    onPointerDown={handleResizePointerDown}
                >
                    <div className="w-3 h-3 border-r-2 border-b-2 border-current rounded-br-sm" />
                </div>
            )}
        </div>
    );
};