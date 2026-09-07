/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect, useRef } from 'react';
import { Globe, ArrowLeft, ArrowRight, RefreshCw, Home, Search, Wifi, Database, ShoppingCart, Newspaper, AlertTriangle, CloudOff, Clock, FileText, Lock } from 'lucide-react';

interface OmniSite {
    id: string;
    url: string;
    name: string;
    content: React.ReactNode;
    icon: React.ElementType;
}

const mockOmniSites: OmniSite[] = [
    {
        id: 'news',
        url: 'nexus://news.omninet',
        name: 'OmniNews Central',
        icon: Newspaper,
        content: (
            <div className="p-8 space-y-6">
                <h2 className="text-xl font-bold text-holo-accent uppercase tracking-widest text-glow">Breaking: Galactic Consensus Reached on Xylos Dispute</h2>
                <p className="text-holo-text/80 text-sm leading-relaxed">
                    After cycles of intense negotiation, the Unified Stellar Republic has announced a breakthrough in the long-standing Xylos trade dispute. Delegates from eight systems ratified the new treaty at 0700 GST. Analysts predict a surge in inter-system commodity exchange.
                </p>
                <div className="flex items-center gap-2 text-holo-text/60 text-xs">
                    <Clock size={12} /> <span className="uppercase">Posted: 08:30 GST - 2049.12.01</span>
                </div>
                <div className="border-t border-holo-border/30 pt-4 mt-6">
                    <h3 className="text-md font-bold text-holo-textBright mb-2">Related Articles:</h3>
                    <ul className="list-disc list-inside text-sm text-holo-text/70 space-y-1">
                        <li><a href="#" className="hover:text-holo-accent">Trade Routes Re-establishing in Sector Gamma</a></li>
                        <li><a href="#" className="hover:text-holo-accent">Sentient AIs Debate Treaty Ethics on Hyper-forums</a></li>
                    </ul>
                </div>
            </div>
        )
    },
    {
        id: 'market',
        url: 'nexus://omnimarket.net',
        name: 'OmniMarketplace',
        icon: ShoppingCart,
        content: (
            <div className="p-8 space-y-6">
                <h2 className="text-xl font-bold text-holo-accent uppercase tracking-widest text-glow">Featured Products: Synth-Crystals & Nano-Weave Armor</h2>
                <div className="grid grid-cols-2 gap-4">
                    <div className="border border-holo-border/30 p-4 bg-black/50">
                        <img src="https://picsum.photos/200/150?random=1&grayscale" alt="Synth-Crystals" className="w-full h-32 object-cover mb-3" />
                        <h3 className="text-md font-bold text-holo-textBright mb-1">Quantum Synth-Crystal (Gen 3)</h3>
                        <p className="text-sm text-holo-text/70">Unrivaled energy conductivity. Limited stock.</p>
                        <div className="text-holo-accent font-bold mt-2">1,200 Credits</div>
                        <button className="mt-4 w-full py-2 bg-holo-accent/10 border border-holo-accent text-holo-accent text-xs uppercase hover:bg-holo-accent hover:text-black">Add to Cart</button>
                    </div>
                    <div className="border border-holo-border/30 p-4 bg-black/50">
                        <img src="https://picsum.photos/200/150?random=2&grayscale" alt="Nano-Weave Armor" className="w-full h-32 object-cover mb-3" />
                        <h3 className="text-md font-bold text-holo-textBright mb-1">"Vanguard" Nano-Weave Armor</h3>
                        <p className="text-sm text-holo-text/70">Lightweight ballistic protection. Enhanced mobility.</p>
                        <div className="text-holo-accent font-bold mt-2">850 Credits</div>
                        <button className="mt-4 w-full py-2 bg-holo-accent/10 border border-holo-accent text-holo-accent text-xs uppercase hover:bg-holo-accent hover:text-black">Add to Cart</button>
                    </div>
                </div>
            </div>
        )
    },
    {
        id: 'archives',
        url: 'nexus://data_archives.gov',
        name: 'Federal Data Archives',
        icon: Database,
        content: (
            <div className="p-8 space-y-6">
                <h2 className="text-xl font-bold text-holo-accent uppercase tracking-widest text-glow">Access Level: Beta</h2>
                <p className="text-holo-text/80 text-sm leading-relaxed">
                    Welcome to the Federal Data Archives. Your current clearance level (BETA) grants access to public records and declassified historical logs. For GAMMA and DELTA access, please authenticate with biometric scan.
                </p>
                <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2 text-holo-textBright"><FileText size={16} /><a href="#" className="hover:text-holo-accent">Project Chimera: Phase 1 Debrief (Declassified)</a></li>
                    <li className="flex items-center gap-2 text-holo-textBright"><FileText size={16} /><a href="#" className="hover:text-holo-accent">Galactic War of 2025: Post-Conflict Analysis</a></li>
                    <li className="flex items-center gap-2 text-holo-text/50"><Lock size={16} /> <span className="italic">Deep Space Probe "Voyager 7" Telemetry (GAMMA ONLY)</span></li>
                </ul>
            </div>
        )
    }
];

export const NexusNetApp: React.FC = () => {
    const [currentUrl, setCurrentUrl] = useState('nexus://home');
    const [history, setHistory] = useState<string[]>(['nexus://home']);
    const [historyIndex, setHistoryIndex] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [connectionStatus, setConnectionStatus] = useState<'stable' | 'degraded' | 'offline'>('stable');
    const urlInputRef = useRef<HTMLInputElement>(null);

    const navigateTo = (url: string, newHistoryEntry = true) => {
        setIsLoading(true);
        setTimeout(() => {
            if (newHistoryEntry) {
                const newHistory = history.slice(0, historyIndex + 1);
                setHistory([...newHistory, url]);
                setHistoryIndex(newHistory.length);
            }
            setCurrentUrl(url);
            setIsLoading(false);
            if (urlInputRef.current) urlInputRef.current.value = url;
            setSearchQuery(''); // Clear search on navigation
        }, 500); // Simulate network latency
    };

    const handleBack = () => {
        if (historyIndex > 0) {
            navigateTo(history[historyIndex - 1], false);
            setHistoryIndex(prev => prev - 1);
        }
    };

    const handleForward = () => {
        if (historyIndex < history.length - 1) {
            navigateTo(history[historyIndex + 1], false);
            setHistoryIndex(prev => prev + 1);
        }
    };

    const handleRefresh = () => {
        navigateTo(currentUrl, false);
    };

    const handleHome = () => {
        navigateTo('nexus://home');
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigateTo(`nexus://search?q=${encodeURIComponent(searchQuery.trim())}`);
        }
    };

    useEffect(() => {
        // Simulate connection fluctuations
        const interval = setInterval(() => {
            const rand = Math.random();
            if (rand < 0.8) setConnectionStatus('stable');
            else if (rand < 0.95) setConnectionStatus('degraded');
            else setConnectionStatus('offline');
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="flex flex-col items-center justify-center h-full text-holo-text/50">
                    <RefreshCw size={48} className="animate-spin text-holo-accent mb-4" />
                    <span className="text-xl uppercase tracking-widest text-glow-sm">LOADING OMNI-STREAM...</span>
                </div>
            );
        }

        if (currentUrl === 'nexus://home') {
            return (
                <div className="p-8">
                    <h1 className="text-3xl font-bold text-holo-accent mb-8 text-center uppercase tracking-widest text-glow">OMNI-HOME INTERFACE</h1>
                    <div className="grid grid-cols-2 gap-8 max-w-2xl mx-auto">
                        {mockOmniSites.map(site => (
                            <button
                                key={site.id}
                                onClick={() => navigateTo(site.url)}
                                className="flex flex-col items-center justify-center p-6 bg-black/50 border border-holo-border/30 hover:border-holo-accent hover:shadow-glow transition-all group"
                            >
                                <site.icon size={48} className="text-holo-text group-hover:text-holo-accent transition-colors mb-3" />
                                <span className="text-lg font-bold uppercase tracking-wider text-holo-text group-hover:text-holo-accent text-glow-sm">{site.name}</span>
                                <span className="text-[10px] text-holo-text/50 mt-1">{site.url.replace('nexus://', '')}</span>
                            </button>
                        ))}
                    </div>
                    <div className="mt-12 text-center text-holo-text/30 text-sm italic">
                        "Navigating the Data Stream"
                    </div>
                </div>
            );
        }

        if (currentUrl.startsWith('nexus://search?q=')) {
            const query = decodeURIComponent(currentUrl.split('q=')[1]);
            return (
                <div className="p-8">
                    <h2 className="text-xl font-bold text-holo-accent uppercase tracking-widest text-glow mb-6">Search Results for "{query}"</h2>
                    <div className="space-y-4">
                        <div className="border-b border-holo-border/20 pb-4">
                            <h3 className="text-lg text-holo-textBright hover:text-holo-accent">Omni-Article: Quantum Entanglement Networks</h3>
                            <p className="text-sm text-holo-text/70">Found on <span className="text-holo-accent">nexus://science.net</span> - Explores the latest breakthroughs...</p>
                        </div>
                        <div className="border-b border-holo-border/20 pb-4">
                            <h3 className="text-lg text-holo-textBright hover:text-holo-accent">Forum Post: Best Omni-Browser Plugins</h3>
                            <p className="text-sm text-holo-text/70">Found on <span className="text-holo-accent">nexus://forums.com</span> - Discussions on enhancing your web experience...</p>
                        </div>
                        <div className="text-holo-text/40 text-sm italic mt-8">
                            Displaying 2 of 14,321 results. Refine search for precision.
                        </div>
                    </div>
                </div>
            );
        }

        const activeSite = mockOmniSites.find(site => site.url === currentUrl);
        if (activeSite) {
            return activeSite.content;
        }

        return (
            <div className="flex flex-col items-center justify-center h-full text-holo-alert">
                <CloudOff size={64} className="mb-4 animate-pulse" />
                <h2 className="text-2xl font-bold uppercase tracking-widest text-glow-alert">PROTOCOL ERROR</h2>
                <p className="text-holo-text/60 text-sm mt-2">Could not retrieve data from <span className="text-holo-alert">{currentUrl}</span></p>
                <button onClick={handleHome} className="mt-6 px-4 py-2 bg-holo-alert/10 border border-holo-alert text-holo-alert text-xs uppercase hover:bg-holo-alert hover:text-black transition-colors">Return to Omni-Home</button>
            </div>
        );
    };

    const getConnectionColor = () => {
        if (connectionStatus === 'stable') return 'text-holo-success';
        if (connectionStatus === 'degraded') return 'text-amber-400';
        return 'text-holo-alert';
    };
    
    const getConnectionText = () => {
        if (connectionStatus === 'stable') return 'SECURE UPLINK';
        if (connectionStatus === 'degraded') return 'SIGNAL DEGRADED';
        return 'OFFLINE';
    };

    return (
        <div className="h-full w-full flex flex-col bg-black text-holo-text font-mono relative overflow-hidden">
            {/* Background decorative grid */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(0,243,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,243,255,0.02)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none" />

            {/* Header / Address Bar */}
            <div className="bg-holo-panel/50 border-b border-holo-border/30 p-2 flex items-center justify-between shrink-0 z-10 backdrop-blur-sm">
                <div className="flex items-center gap-2">
                    <button onClick={handleBack} disabled={historyIndex === 0 || isLoading} className="p-2 hover:bg-holo-accent/10 rounded transition-colors disabled:opacity-30">
                        <ArrowLeft size={16} />
                    </button>
                    <button onClick={handleForward} disabled={historyIndex === history.length - 1 || isLoading} className="p-2 hover:bg-holo-accent/10 rounded transition-colors disabled:opacity-30">
                        <ArrowRight size={16} />
                    </button>
                    <button onClick={handleRefresh} disabled={isLoading} className="p-2 hover:bg-holo-accent/10 rounded transition-colors disabled:opacity-30">
                        <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
                    </button>
                    <button onClick={handleHome} disabled={isLoading} className="p-2 hover:bg-holo-accent/10 rounded transition-colors disabled:opacity-30">
                        <Home size={16} />
                    </button>
                </div>

                <form onSubmit={handleSearch} className="flex-1 mx-4 relative">
                    <input
                        ref={urlInputRef}
                        type="text"
                        value={searchQuery || currentUrl}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onFocus={() => { if (urlInputRef.current) urlInputRef.current.select(); }}
                        onKeyDown={(e) => { if (e.key === 'Enter') navigateTo(searchQuery || currentUrl); }}
                        placeholder="Search Omni-Web or enter URL..."
                        className="w-full bg-black/50 border border-holo-border/30 py-2 pl-4 pr-10 text-xs text-holo-textBright focus:outline-none focus:border-holo-accent focus:shadow-glow-sm placeholder-holo-text/30"
                        disabled={isLoading}
                    />
                    <button type="submit" className="absolute right-0 top-0 h-full w-10 flex items-center justify-center text-holo-text/70 hover:text-holo-accent transition-colors" disabled={isLoading}>
                        <Search size={16} />
                    </button>
                </form>

                <div className="flex items-center gap-2 text-xs font-bold uppercase pl-2">
                    <Wifi size={16} className={`${getConnectionColor()} ${connectionStatus !== 'stable' ? 'animate-pulse' : ''}`} />
                    <span className={`${getConnectionColor()}`}>{getConnectionText()}</span>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto relative bg-black/70">
                {renderContent()}
            </div>

            {/* Footer / Console Log */}
            <div className="bg-holo-panel/50 border-t border-holo-border/30 p-1 px-3 flex justify-between items-center shrink-0 text-[10px] text-holo-text/50 z-10 backdrop-blur-sm">
                <span>OMNI-PROTOCOL 3.1 // NODE-172.31.X.X</span>
                <span>DATA INTEGRITY: 99.8%</span>
            </div>
        </div>
    );
};