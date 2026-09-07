/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useRef } from 'react';
import { Cpu, Play, Code, Eye, Loader2, Save, AlertCircle } from 'lucide-react';
import { getAiClient } from '../../lib/gemini';

export const AppBuilderApp: React.FC = () => {
    const [prompt, setPrompt] = useState('');
    const [isBuilding, setIsBuilding] = useState(false);
    const [generatedCode, setGeneratedCode] = useState('');
    const [activeTab, setActiveTab] = useState<'preview' | 'code'>('preview');
    const [error, setError] = useState<string | null>(null);
    const iframeRef = useRef<HTMLIFrameElement>(null);

    const handleCompile = async () => {
        if (!prompt.trim()) return;
        
        setIsBuilding(true);
        setError(null);
        setGeneratedCode(''); // Clear previous code
        setActiveTab('preview');

        try {
            const ai = getAiClient();
            const response = await ai.models.generateContent({
                model: 'gemini-3-pro-preview',
                contents: [
                    { 
                        text: `You are an expert frontend engineer for a futuristic sci-fi operating system. 
                        Create a single-file HTML application with embedded CSS and JS based on this user request: "${prompt}". 
                        
                        Requirements:
                        1. The design MUST be dark mode, futuristic, using neon colors (cyan #00f3ff, purple #bc13fe) and black backgrounds.
                        2. It must be fully functional and interactive. CRITICAL: Implement all requested interactions (button clicks, text changes, animations) using robust vanilla JavaScript event listeners.
                        3. Return ONLY the raw HTML code. Do not use markdown code blocks. Do not include explanations.
                        4. The code should work when injected into an iframe.
                        5. Use 'JetBrains Mono' or monospace font if possible.
                        6. If the user asks for animations, use CSS keyframes or transitions.` 
                    }
                ]
            });

            const rawCode = response.text || '';
            // Strip markdown code blocks if Gemini includes them despite instructions
            const cleanCode = rawCode.replace(/```html/g, '').replace(/```/g, '');
            
            setGeneratedCode(cleanCode);
            updatePreview(cleanCode);
        } catch (err) {
            setError("COMPILATION FAILED: Connection interrupted or quota exceeded.");
        } finally {
            setIsBuilding(false);
        }
    };

    const updatePreview = (code: string) => {
        if (iframeRef.current) {
            const doc = iframeRef.current.contentWindow?.document;
            if (doc) {
                doc.open();
                doc.write(code);
                doc.close();
            }
        }
    };

    return (
        <div className="h-full w-full bg-black flex flex-col font-mono text-holo-text relative overflow-hidden">
            {/* Background Circuit Pattern */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(188,19,254,0.1)_0%,transparent_70%)] pointer-events-none" />
            
            {/* Header */}
            <div className="bg-holo-panel/50 border-b border-holo-border/30 p-3 flex items-center justify-between shrink-0 z-10">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-holo-secondary/20 rounded border border-holo-secondary text-holo-secondary">
                        <Cpu size={18} />
                    </div>
                    <div>
                        <div className="text-sm font-bold text-holo-secondary tracking-widest uppercase text-glow">NEXUS BUILDER</div>
                        <div className="text-[10px] text-holo-text/50">Rapid Prototyping Protocol v1.0</div>
                    </div>
                </div>
                <div className="flex gap-2">
                     <div className={`px-2 py-1 border ${isBuilding ? 'border-holo-accent text-holo-accent animate-pulse' : 'border-holo-text/20 text-holo-text/20'} text-[10px] font-bold uppercase rounded`}>
                        {isBuilding ? 'COMPILING...' : 'IDLE'}
                     </div>
                </div>
            </div>

            {/* Main Interface */}
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                {/* Left Panel: Input */}
                <div className="w-full md:w-1/3 flex flex-col border-b md:border-b-0 md:border-r border-holo-border/30 bg-black/40 backdrop-blur-sm p-4 z-10">
                    <div className="mb-4">
                        <label className="text-[10px] text-holo-text/60 uppercase tracking-wider mb-2 block">Target Protocol Description</label>
                        <textarea 
                            className="w-full h-32 bg-black/50 border border-holo-border/30 p-3 text-sm text-holo-textBright focus:border-holo-secondary focus:outline-none resize-none font-mono rounded-sm placeholder-holo-text/20"
                            placeholder="// Describe app & interactions... e.g. 'A red button that says ALERT. When clicked, it shakes and changes text to ACCESS DENIED.'"
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                        />
                    </div>
                    
                    <button 
                        onClick={handleCompile}
                        disabled={isBuilding || !prompt.trim()}
                        className="w-full py-3 bg-holo-secondary/20 border border-holo-secondary text-holo-secondary font-bold uppercase tracking-widest hover:bg-holo-secondary hover:text-black transition-all shadow-[0_0_15px_rgba(188,19,254,0.2)] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isBuilding ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
                        {isBuilding ? 'Processing...' : 'Initialize Build'}
                    </button>

                    {error && (
                        <div className="mt-4 p-3 border border-holo-alert/50 bg-holo-alert/10 text-holo-alert text-xs flex items-start gap-2">
                            <AlertCircle size={14} className="shrink-0 mt-0.5" />
                            {error}
                        </div>
                    )}

                    <div className="mt-auto pt-4 text-[10px] text-holo-text/30 leading-relaxed">
                        WARNING: Generated code is sandbox-isolated. Complex protocols may require manual debugging.
                    </div>
                </div>

                {/* Right Panel: Output */}
                <div className="flex-1 flex flex-col bg-zinc-900/50 relative">
                    {/* Toolbar */}
                    <div className="h-10 border-b border-holo-border/20 flex items-center px-2 bg-black/40">
                        <button 
                            onClick={() => setActiveTab('preview')}
                            className={`h-full px-4 flex items-center gap-2 text-xs font-bold uppercase transition-colors border-b-2 ${activeTab === 'preview' ? 'border-holo-secondary text-holo-secondary' : 'border-transparent text-holo-text/50 hover:text-holo-text'}`}
                        >
                            <Eye size={14} /> Preview
                        </button>
                        <button 
                            onClick={() => setActiveTab('code')}
                            className={`h-full px-4 flex items-center gap-2 text-xs font-bold uppercase transition-colors border-b-2 ${activeTab === 'code' ? 'border-holo-secondary text-holo-secondary' : 'border-transparent text-holo-text/50 hover:text-holo-text'}`}
                        >
                            <Code size={14} /> Source
                        </button>
                        <div className="ml-auto flex gap-2">
                            {generatedCode && (
                                <button 
                                    className="p-1.5 hover:bg-holo-text/10 rounded text-holo-text/70 transition-colors"
                                    title="Save Source"
                                    onClick={() => {
                                        const blob = new Blob([generatedCode], { type: 'text/html' });
                                        const url = URL.createObjectURL(blob);
                                        const a = document.createElement('a');
                                        a.href = url;
                                        a.download = 'nexus_app.html';
                                        document.body.appendChild(a);
                                        a.click();
                                        document.body.removeChild(a);
                                    }}
                                >
                                    <Save size={14} />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Viewer */}
                    <div className="flex-1 relative overflow-hidden">
                         {generatedCode ? (
                             <>
                                <iframe 
                                    ref={iframeRef}
                                    className={`w-full h-full border-none bg-white ${activeTab === 'preview' ? 'block' : 'hidden'}`}
                                    title="App Preview"
                                    sandbox="allow-scripts allow-same-origin" // Secure sandbox
                                />
                                {activeTab === 'code' && (
                                    <textarea 
                                        readOnly
                                        className="w-full h-full bg-[#0d0d0d] text-gray-300 font-mono text-xs p-4 resize-none focus:outline-none"
                                        value={generatedCode}
                                    />
                                )}
                             </>
                         ) : (
                             <div className="absolute inset-0 flex flex-col items-center justify-center text-holo-text/20 select-none">
                                 <Cpu size={64} strokeWidth={0.5} className="mb-4" />
                                 <div className="text-xs uppercase tracking-[0.2em]">Awaiting Input Protocol</div>
                             </div>
                         )}
                    </div>
                </div>
            </div>
        </div>
    );
};