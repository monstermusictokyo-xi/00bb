/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import { DesktopItem } from '../../types';
import { FileText, AlertCircle, Database } from 'lucide-react';

interface FolderViewProps {
    folder: DesktopItem;
}

export const FolderView: React.FC<FolderViewProps> = ({ folder }) => {
    return (
        <div className="h-full w-full bg-transparent text-holo-text p-2 flex flex-col overflow-hidden">
             {/* Header Info */}
             <div className="bg-holo-panel/40 border border-holo-border/30 p-3 mb-4 flex items-start gap-3 text-xs shadow-[0_0_10px_rgba(0,243,255,0.1)]">
                <Database className="text-holo-accent shrink-0" size={16} />
                <div className="space-y-1">
                    <p className="text-holo-textBright font-bold uppercase tracking-wider text-glow-sm">Data Sector: Level 4</p>
                    <p className="text-holo-text/60 font-mono leading-relaxed">
                        Secure vault access granted. All transfers monitored by core AI.
                    </p>
                </div>
            </div>

            <div className="flex items-center justify-between px-2 mb-2 text-[10px] uppercase text-holo-text/40 border-b border-holo-border/30 pb-1 font-mono">
                <span>Node Name</span>
                <span>Type</span>
            </div>
            
            <div className="flex-1 overflow-y-auto p-1">
                {folder.contents?.map(item => (
                    <div key={item.id} className="group flex items-center gap-3 p-2 hover:bg-holo-accent/10 border border-transparent hover:border-holo-accent/30 cursor-pointer mb-1 transition-all rounded-sm">
                        <div className={`w-8 h-8 bg-black/50 border border-holo-border/30 flex items-center justify-center text-holo-text group-hover:text-holo-accent group-hover:shadow-glow-sm`}>
                            <item.icon size={16} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="text-sm font-mono text-holo-textBright group-hover:text-holo-accent truncate">{item.name}</div>
                            <div className="text-[10px] text-holo-text/40 uppercase">{item.type === 'app' ? 'Data File' : 'Directory'}</div>
                        </div>
                        <div className="text-[10px] text-holo-text/30 font-mono">ENCRYPTED</div>
                    </div>
                ))}
                
                {(!folder.contents || folder.contents.length === 0) && (
                     <div className="p-8 text-center text-holo-text/30 italic font-mono text-xs">
                        // SECTOR_VOID
                    </div>
                )}
            </div>
            
            <div className="bg-holo-panel/20 p-1 text-[10px] text-holo-text/50 border-t border-holo-border/30 flex justify-between font-mono uppercase">
                <span>{folder.contents?.length || 0} Nodes</span>
                <span>Write Protected</span>
            </div>
        </div>
    );
};