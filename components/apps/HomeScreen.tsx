/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import { DesktopItem } from '../../types';

interface HomeScreenProps {
    items: (DesktopItem | null)[];
    onLaunch: (item: DesktopItem) => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ items, onLaunch }) => {
    return (
        <div className="h-full w-full p-12 grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-y-10 gap-x-6 content-start justify-items-center overflow-y-auto">
            {items.map((item, index) => {
                if (!item) {
                    return <div key={`gap-${index}`} className="w-32 h-[8rem]" />;
                }
                return (
                    <button
                        key={item.id}
                        onClick={() => onLaunch(item)}
                        className="flex flex-col items-center justify-start gap-4 p-2 w-32 group transition-all duration-300 hover:scale-105"
                        title={item.name}
                    >
                        <div className={`relative w-20 h-20 flex items-center justify-center perspective-1000 group-hover:-translate-y-1 transition-transform`}>
                            
                            {/* Hologram Base */}
                            <div className="absolute inset-0 bg-holo-panel/30 rounded-xl border border-holo-border/30 shadow-[0_0_15px_rgba(0,243,255,0.05)] backdrop-blur-sm group-hover:border-holo-accent/60 group-hover:shadow-glow transition-all duration-500 transform rotate-0" />
                            
                            {/* Inner Glow */}
                            <div className="absolute inset-2 bg-gradient-to-b from-transparent to-holo-accent/5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity" />

                            {/* Corner Markers */}
                            <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-holo-text/30 group-hover:border-holo-accent transition-colors" />
                            <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-holo-text/30 group-hover:border-holo-accent transition-colors" />
                            <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-holo-text/30 group-hover:border-holo-accent transition-colors" />
                            <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-holo-text/30 group-hover:border-holo-accent transition-colors" />

                            <item.icon className="w-9 h-9 text-holo-text group-hover:text-holo-accent transition-colors relative z-10 drop-shadow-[0_0_5px_rgba(0,243,255,0.5)]" strokeWidth={1.5} />
                            
                            {/* Type indicator */}
                            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-[8px] text-holo-text/60 font-mono bg-black px-1 border border-holo-border/20 rounded uppercase tracking-wider scale-75 group-hover:scale-100 transition-transform">
                                {item.type === 'folder' ? 'NODE' : 'DATA'}
                            </div>
                        </div>
                        <span className="text-xs text-holo-text/80 group-hover:text-holo-accent group-hover:text-glow font-mono text-center uppercase truncate w-full tracking-wider transition-colors">
                            {item.name}
                        </span>
                    </button>
                );
            })}
        </div>
    );
};