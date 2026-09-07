/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useRef } from 'react';
import { Save, FileText, X, Download } from 'lucide-react';

interface NotepadAppProps {
    initialContent?: string;
    currentFilename?: string;
    onSave?: (filename: string, content: string) => void;
}

export const NotepadApp: React.FC<NotepadAppProps> = ({ initialContent = '', currentFilename, onSave }) => {
    const [content, setContent] = useState(initialContent);
    const [showSaveDialog, setShowSaveDialog] = useState(false);
    const [filename, setFilename] = useState(currentFilename || 'New_Data_Shard.txt');
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const handleSaveClick = () => {
        setShowSaveDialog(true);
    };

    const handleConfirmSave = (e?: React.FormEvent) => {
        e?.preventDefault();
        if (onSave && filename) {
            onSave(filename, content);
            setShowSaveDialog(false);
        }
    };

    const handleExport = () => {
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename.endsWith('.txt') ? filename : `${filename}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="h-full w-full bg-transparent text-holo-text flex flex-col font-mono text-sm relative">
             <div className="bg-holo-panel/50 border-b border-holo-border/30 p-2 flex items-center justify-between shrink-0">
                <div className="flex gap-4 text-[10px] text-holo-text/60 uppercase tracking-wider items-center pl-2">
                    <span>UTF-8</span>
                    <span>ENCRYPTION: OFF</span>
                </div>
                <div className="flex gap-2">
                    <button 
                        onClick={handleExport}
                        className="flex items-center gap-2 px-3 py-1 bg-transparent hover:bg-holo-accent/10 border border-holo-border/30 text-holo-text text-xs font-bold uppercase tracking-wider transition-all hover:text-holo-accent"
                        title="Export to Local Drive"
                    >
                        <Download size={14} />
                        Export
                    </button>
                    <button 
                        onClick={handleSaveClick}
                        className="flex items-center gap-2 px-3 py-1 bg-holo-accent/10 hover:bg-holo-accent/20 border border-holo-accent/50 text-holo-accent text-xs font-bold uppercase tracking-wider transition-all hover:shadow-[0_0_10px_rgba(0,243,255,0.3)]"
                    >
                        <Save size={14} />
                        Save Data
                    </button>
                </div>
             </div>
            
            <textarea 
                ref={textareaRef}
                className="flex-1 w-full h-full p-6 resize-none border-none focus:outline-none bg-transparent overflow-y-auto selection:bg-holo-accent selection:text-black leading-relaxed text-holo-textBright"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                spellCheck={false}
                placeholder="// ENTER DATA STREAM..."
            />

            {/* Save Dialog Modal */}
            {showSaveDialog && (
                <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-8 animate-in fade-in duration-200">
                    <div className="w-full max-w-sm bg-black border border-holo-accent shadow-glow-lg p-1 relative">
                         <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-holo-accent to-transparent opacity-50" />
                         <div className="bg-holo-panel/30 p-6 flex flex-col gap-4">
                            <div className="flex justify-between items-center border-b border-holo-border/30 pb-2">
                                <h3 className="text-holo-accent text-sm font-bold uppercase tracking-widest text-glow">Save Data Shard</h3>
                                <button onClick={() => setShowSaveDialog(false)} className="text-holo-text/50 hover:text-holo-alert transition-colors">
                                    <X size={16} />
                                </button>
                            </div>
                            
                            <form onSubmit={handleConfirmSave} className="flex flex-col gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] text-holo-text/60 uppercase">Filename ID</label>
                                    <div className="relative">
                                        <FileText className="absolute left-3 top-1/2 -translate-y-1/2 text-holo-accent/50" size={14} />
                                        <input 
                                            type="text" 
                                            value={filename}
                                            onChange={(e) => setFilename(e.target.value)}
                                            className="w-full bg-black/50 border border-holo-border/30 text-holo-textBright pl-9 pr-3 py-2 text-xs focus:outline-none focus:border-holo-accent focus:shadow-glow transition-all placeholder-holo-text/30 font-mono"
                                            autoFocus
                                        />
                                    </div>
                                </div>
                                
                                <div className="flex gap-2 pt-2">
                                    <button 
                                        type="button"
                                        onClick={() => setShowSaveDialog(false)}
                                        className="flex-1 py-2 border border-holo-border/30 text-holo-text/70 text-xs uppercase hover:bg-holo-text/5 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        type="submit"
                                        className="flex-1 py-2 bg-holo-accent/20 border border-holo-accent text-holo-accent text-xs font-bold uppercase hover:bg-holo-accent hover:text-black transition-all shadow-glow-sm"
                                    >
                                        Confirm
                                    </button>
                                </div>
                            </form>
                         </div>
                    </div>
                </div>
            )}
        </div>
    );
};