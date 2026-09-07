/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect, useRef } from 'react';
import { Shield, Lock, Globe, ShoppingCart, Database, Eye, Server, AlertTriangle, ArrowLeft, Search, Skull, Terminal, MessageSquare, Download, Wifi, CreditCard, User, Key, FileText, Video } from 'lucide-react';

interface Site {
    id: string;
    url: string;
    name: string;
    icon: React.ElementType;
    description: string;
    status: 'ONLINE' | 'SEIZED' | 'OFFLINE';
}

interface MarketItem {
    id: string;
    name: string;
    price: number;
    seller: string;
    rating: number;
}

interface LeakFile {
    id: string;
    name: string;
    size: string;
    securityLevel: 'LOW' | 'MED' | 'HIGH' | 'CRITICAL';
    decrypted: boolean;
}

const SITES: Site[] = [
    { id: 'market', url: 'silk_road_reloaded.onion', name: 'Zero Day Market', icon: ShoppingCart, description: 'Exploits, payloads, and hardware backdoors.', status: 'ONLINE' },
    { id: 'leaks', url: 'truth_vault.onion', name: 'The Vault', icon: Database, description: 'Classified document dumps from major gov agencies.', status: 'ONLINE' },
    { id: 'cam', url: 'red_room_feeds.onion', name: 'Surveillance Grid', icon: Eye, description: 'Access to unsecured CCTV and satellite feeds.', status: 'ONLINE' },
    { id: 'id', url: 'ghost_identity.onion', name: 'Ghost ID', icon: Lock, description: 'Fabricated credentials and biometric spoofing.', status: 'SEIZED' },
    { id: 'botnet', url: 'hive_mind_control.onion', name: 'Hive Mind', icon: Server, description: 'Rentable botnet computing power.', status: 'OFFLINE' },
];

const MARKET_ITEMS: MarketItem[] = [
    { id: 'm1', name: 'iOS 19 Zero-Day Exploit (Remote)', price: 4.5, seller: 'NullPointer', rating: 4.9 },
    { id: 'm2', name: 'Satellite Uplink Key (SpaceX)', price: 12.0, seller: 'StarDust', rating: 5.0 },
    { id: 'm3', name: 'Botnet Access (50k Nodes)', price: 0.8, seller: 'HiveMaster', rating: 4.7 },
    { id: 'm4', name: 'Corporate Email Dump (Fortune 500)', price: 0.2, seller: 'LeakGod', rating: 4.2 },
    { id: 'm5', name: 'RFID Cloner Schematic v4', price: 0.05, seller: 'HardwareHacker', rating: 4.8 },
];

const LEAK_FILES: LeakFile[] = [
    { id: 'f1', name: 'Project_Blue_Book_Redacted.pdf', size: '2.4 GB', securityLevel: 'CRITICAL', decrypted: false },
    { id: 'f2', name: 'Area_51_Staff_List_2048.xls', size: '14 MB', securityLevel: 'HIGH', decrypted: false },
    { id: 'f3', name: 'Senator_Emails_Corruption.zip', size: '450 MB', securityLevel: 'MED', decrypted: false },
    { id: 'f4', name: 'Weather_Control_Schematics.cad', size: '12 TB', securityLevel: 'CRITICAL', decrypted: false },
];

const CHAT_MESSAGES = [
    { user: 'Neo', msg: 'Anyone got the new keys for the grid?' },
    { user: 'Morpheus', msg: 'Check the vault. Just uploaded.' },
    { user: 'Trinity', msg: 'Watch out, feds are sniffing node 4.' },
    { user: 'Cypher', msg: 'Selling 10k CCs. DM me.' },
    { user: 'Ghost', msg: 'System purge in 10 mins. Disconnect.' },
    { user: 'ZeroCool', msg: 'HACK THE PLANET!' },
    { user: 'AcidBurn', msg: 'Mess with the best, die like the rest.' },
];

export const DarkWebApp: React.FC = () => {
    const [connected, setConnected] = useState(false);
    const [bootLog, setBootLog] = useState<string[]>([]);
    const [currentUrl, setCurrentUrl] = useState<string>('shadow://home');
    const [activeSite, setActiveSite] = useState<Site | null>(null);
    const [chatLog, setChatLog] = useState<{user: string, msg: string}[]>([]);
    
    // Site specific states
    const [decryptingId, setDecryptingId] = useState<string | null>(null);
    const [decryptionProgress, setDecryptionProgress] = useState(0);
    const [purchasingId, setPurchasingId] = useState<string | null>(null);

    useEffect(() => {
        // Connection Simulation
        const sequence = [
            "Initializing Tor Circuit...",
            "Routing through Node [192.168.X.X]... SUCCESS",
            "Routing through Node [45.33.X.X]... SUCCESS",
            "Routing through Node [UNKNOWN]... SUCCESS",
            "Handshake with Gateway... ENCRYPTED",
            "Obfuscating MAC Address...",
            "SHADOW_NET CONNECTION ESTABLISHED."
        ];

        let delay = 0;
        sequence.forEach((msg, index) => {
            delay += Math.random() * 500 + 200;
            setTimeout(() => {
                setBootLog(prev => [...prev, msg]);
                if (index === sequence.length - 1) {
                    setTimeout(() => setConnected(true), 800);
                }
            }, delay);
        });

        // Chat Simulation
        const chatInterval = setInterval(() => {
            const randomMsg = CHAT_MESSAGES[Math.floor(Math.random() * CHAT_MESSAGES.length)];
            setChatLog(prev => [...prev.slice(-4), randomMsg]);
        }, 4000);

        return () => clearInterval(chatInterval);
    }, []);

    const handleNavigate = (site: Site) => {
        setCurrentUrl(`shadow://${site.url}`);
        setActiveSite(site);
    };

    const handleHome = () => {
        setCurrentUrl('shadow://home');
        setActiveSite(null);
    };

    const handleDecrypt = (id: string) => {
        if (decryptingId) return;
        setDecryptingId(id);
        setDecryptionProgress(0);
        
        const interval = setInterval(() => {
            setDecryptionProgress(prev => {
                if (prev >= 100) {
                    clearInterval(interval);
                    setDecryptingId(null);
                    return 100;
                }
                return prev + 2;
            });
        }, 50);
    };

    const handlePurchase = (id: string) => {
        setPurchasingId(id);
        setTimeout(() => {
            alert("INSUFFICIENT FUNDS. PLEASE DEPOSIT BTC.");
            setPurchasingId(null);
        }, 1500);
    };

    if (!connected) {
        return (
            <div className="h-full w-full bg-black p-8 font-mono text-xs flex flex-col font-bold">
                <div className="text-holo-alert mb-4 animate-pulse flex items-center gap-2">
                    <Globe className="animate-spin-slow" size={16} />
                    ESTABLISHING SECURE TUNNEL
                </div>
                <div className="flex-1 space-y-2 text-holo-text/60">
                    {bootLog.map((log, i) => (
                        <div key={i} className="border-l-2 border-holo-alert/30 pl-2 animate-in fade-in slide-in-from-left-2 duration-300">
                            {log}
                        </div>
                    ))}
                    <div className="animate-pulse text-holo-alert">_</div>
                </div>
                <div className="mt-4 h-1 w-full bg-holo-text/10 rounded-full overflow-hidden">
                    <div className="h-full bg-holo-alert w-[80%] animate-pulse" />
                </div>
            </div>
        );
    }

    const renderMarket = () => (
        <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between mb-8 border-b border-holo-alert/30 pb-4">
                <div>
                    <h2 className="text-2xl font-bold text-holo-alert uppercase tracking-widest flex items-center gap-2">
                        <ShoppingCart /> Zero Day Market
                    </h2>
                    <p className="text-xs text-holo-alert/50 mt-1">Escrow enabled. No refunds.</p>
                </div>
                <div className="text-right">
                    <div className="text-[10px] text-holo-alert/50 uppercase">Wallet Balance</div>
                    <div className="text-xl font-bold text-holo-alert">0.00000000 BTC</div>
                </div>
            </div>
            <div className="grid gap-4">
                {MARKET_ITEMS.map(item => (
                    <div key={item.id} className="bg-holo-alert/5 border border-holo-alert/20 p-4 flex items-center justify-between hover:bg-holo-alert/10 transition-colors group">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-black flex items-center justify-center border border-holo-alert/30 text-holo-alert">
                                <Key size={20} />
                            </div>
                            <div>
                                <div className="font-bold text-holo-alert group-hover:text-glow-alert transition-all">{item.name}</div>
                                <div className="text-[10px] text-holo-alert/50 flex gap-4">
                                    <span className="flex items-center gap-1"><User size={10} /> {item.seller}</span>
                                    <span className="flex items-center gap-1 text-yellow-500">★ {item.rating}</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="text-right">
                                <div className="font-bold text-holo-alert">{item.price} BTC</div>
                                <div className="text-[10px] text-holo-alert/40">≈ ${(item.price * 69420).toLocaleString()}</div>
                            </div>
                            <button 
                                onClick={() => handlePurchase(item.id)}
                                disabled={purchasingId === item.id}
                                className="px-4 py-2 bg-holo-alert/20 border border-holo-alert text-holo-alert text-xs font-bold uppercase hover:bg-holo-alert hover:text-black transition-all disabled:opacity-50"
                            >
                                {purchasingId === item.id ? 'Processing...' : 'Buy Now'}
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    const renderVault = () => (
        <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between mb-8 border-b border-holo-alert/30 pb-4">
                <div>
                    <h2 className="text-2xl font-bold text-holo-alert uppercase tracking-widest flex items-center gap-2">
                        <Database /> The Vault
                    </h2>
                    <p className="text-xs text-holo-alert/50 mt-1">Leaks. Dumps. Truth.</p>
                </div>
                <div className="flex items-center gap-2 text-holo-alert/50 text-xs">
                    <Wifi className="animate-pulse" size={14} />
                    UPLINK STABLE
                </div>
            </div>
            <div className="grid gap-4">
                {LEAK_FILES.map(file => (
                    <div key={file.id} className="bg-holo-alert/5 border border-holo-alert/20 p-4 flex items-center justify-between hover:bg-holo-alert/10 transition-colors">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-black flex items-center justify-center border border-holo-alert/30 text-holo-alert">
                                <FileText size={20} />
                            </div>
                            <div>
                                <div className="font-bold text-holo-alert">{file.name}</div>
                                <div className="text-[10px] text-holo-alert/50 flex gap-4">
                                    <span>SIZE: {file.size}</span>
                                    <span className={`font-bold ${file.securityLevel === 'CRITICAL' ? 'text-red-500' : 'text-yellow-500'}`}>
                                        LEVEL: {file.securityLevel}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="w-48">
                            {decryptingId === file.id ? (
                                <div className="space-y-1">
                                    <div className="flex justify-between text-[10px] text-holo-alert">
                                        <span>DECRYPTING...</span>
                                        <span>{decryptionProgress}%</span>
                                    </div>
                                    <div className="h-1 bg-black w-full overflow-hidden">
                                        <div 
                                            className="h-full bg-holo-alert transition-all duration-75" 
                                            style={{ width: `${decryptionProgress}%` }}
                                        />
                                    </div>
                                </div>
                            ) : (
                                <button 
                                    onClick={() => handleDecrypt(file.id)}
                                    className="w-full px-4 py-2 bg-holo-alert/10 border border-holo-alert/50 text-holo-alert text-xs font-bold uppercase hover:bg-holo-alert hover:text-black transition-all flex items-center justify-center gap-2"
                                >
                                    <Download size={14} /> Decrypt & Download
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    const renderCams = () => (
        <div className="h-full flex flex-col animate-in fade-in zoom-in-95 duration-500">
            <div className="flex items-center justify-between mb-4 px-4">
                <h2 className="text-xl font-bold text-holo-alert uppercase tracking-widest flex items-center gap-2">
                    <Eye /> Global Surveillance Grid
                </h2>
                <div className="flex items-center gap-2 text-red-500 animate-pulse text-xs font-bold uppercase">
                    <div className="w-2 h-2 bg-red-500 rounded-full" />
                    Live Feed
                </div>
            </div>
            <div className="flex-1 grid grid-cols-2 gap-1 p-1 bg-black border border-holo-alert/20">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="relative overflow-hidden group border border-holo-alert/10 bg-zinc-900">
                        <img 
                            src={`https://picsum.photos/600/400?random=${i + 10}&grayscale&blur=1`} 
                            className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity mix-blend-luminosity"
                            alt="Surveillance Feed"
                        />
                        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.5)_1px,transparent_1px)] bg-[size:100%_4px] pointer-events-none" />
                        <div className="absolute top-2 left-2 bg-black/50 px-2 py-0.5 text-[10px] text-red-500 font-mono border border-red-500/30 flex items-center gap-2">
                            <Video size={10} /> CAM_0{i} // {new Date().toLocaleTimeString()}
                        </div>
                        <div className="absolute bottom-2 right-2 text-[10px] text-holo-alert/50 font-mono">
                            LAT: {Math.random() * 90} N
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    return (
        <div className="h-full w-full flex flex-col bg-[#050000] text-holo-alert font-mono relative overflow-hidden">
             {/* Scanline overlay specifically for dark web (red tint) */}
             <div className="absolute inset-0 pointer-events-none z-10 bg-[linear-gradient(rgba(255,0,0,0.02)_1px,transparent_1px)] bg-[size:100%_3px]" />
             <div className="absolute inset-0 pointer-events-none z-10 bg-[radial-gradient(circle_at_center,transparent_50%,rgba(0,0,0,0.6)_100%)]" />

            {/* Browser Bar */}
            <div className="flex items-center gap-2 p-2 border-b border-holo-alert/30 bg-holo-alert/5 shrink-0 z-20">
                <button 
                    onClick={handleHome}
                    className="p-1.5 hover:bg-holo-alert/20 rounded transition-colors disabled:opacity-50"
                    disabled={!activeSite}
                >
                    <ArrowLeft size={14} />
                </button>
                <div className="flex-1 bg-black border border-holo-alert/20 px-3 py-1.5 text-xs flex items-center gap-2 text-holo-alert/70 shadow-inner">
                    <Lock size={10} />
                    <span className="truncate tracking-wider">{currentUrl}</span>
                </div>
                <Globe size={14} className="text-holo-alert/50 animate-pulse" />
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-6 relative z-0">
                {!activeSite ? (
                    <div className="max-w-5xl mx-auto h-full flex flex-col">
                        <div className="text-center mb-12 mt-8">
                            <h1 className="text-5xl font-bold mb-2 tracking-tighter text-shadow-alert flex justify-center items-center gap-4 animate-pulse">
                                <Skull size={48} /> SHADOW_NET
                            </h1>
                            <p className="text-xs text-holo-alert/50 uppercase tracking-[0.5em]">Anonymous. Untraceable. Uncensored.</p>
                        </div>

                        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
                            {/* Sites Grid */}
                            <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {SITES.map(site => (
                                    <button
                                        key={site.id}
                                        onClick={() => handleNavigate(site)}
                                        disabled={site.status !== 'ONLINE'}
                                        className={`group relative p-6 border ${site.status === 'ONLINE' ? 'border-holo-alert/30 hover:border-holo-alert hover:bg-holo-alert/10' : 'border-gray-800 bg-gray-900/50 opacity-50 cursor-not-allowed'} text-left transition-all overflow-hidden h-32 flex flex-col justify-between`}
                                    >
                                        {site.status === 'SEIZED' && (
                                            <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-20 border border-red-500 m-1">
                                                <span className="text-red-500 font-bold text-xl border-2 border-red-500 px-4 py-2 rotate-[-15deg] uppercase tracking-widest">Seized by FBI</span>
                                            </div>
                                        )}
                                        
                                        <div className="flex items-start justify-between mb-2">
                                            <site.icon size={28} className={`${site.status === 'ONLINE' ? 'text-holo-alert group-hover:scale-110' : 'text-gray-600'} transition-transform`} />
                                            <span className={`text-[9px] px-1.5 py-0.5 border ${site.status === 'ONLINE' ? 'border-holo-success text-holo-success' : 'border-gray-600 text-gray-600'}`}>
                                                {site.status}
                                            </span>
                                        </div>
                                        <div>
                                            <div className="font-bold text-sm mb-1 group-hover:text-glow-alert tracking-wider">{site.name}</div>
                                            <div className="text-[10px] text-holo-alert/60 truncate">{site.description}</div>
                                        </div>
                                    </button>
                                ))}
                            </div>

                            {/* Chat Panel */}
                            <div className="border border-holo-alert/30 bg-black/50 h-[400px] flex flex-col">
                                <div className="p-2 border-b border-holo-alert/30 bg-holo-alert/10 text-xs font-bold uppercase flex items-center gap-2">
                                    <MessageSquare size={12} /> Shadow_Chat_v2.0
                                </div>
                                <div className="flex-1 overflow-y-auto p-2 space-y-2 font-mono text-[10px]">
                                    {chatLog.map((log, i) => (
                                        <div key={i} className="animate-in fade-in slide-in-from-left-1 duration-200">
                                            <span className="text-holo-alert font-bold">[{log.user}]:</span> <span className="text-holo-alert/70">{log.msg}</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="p-2 border-t border-holo-alert/30">
                                    <input 
                                        type="text" 
                                        placeholder="Read-only mode..." 
                                        disabled 
                                        className="w-full bg-transparent border border-holo-alert/20 p-1 text-[10px] text-holo-alert/50 cursor-not-allowed"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="h-full">
                        {activeSite.id === 'market' && renderMarket()}
                        {activeSite.id === 'leaks' && renderVault()}
                        {activeSite.id === 'cam' && renderCams()}
                        {['id', 'botnet'].includes(activeSite.id) && (
                            <div className="h-full flex items-center justify-center flex-col gap-4 text-holo-alert/50">
                                <AlertTriangle size={48} />
                                <div className="text-xl uppercase tracking-widest">Service Unavailable</div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="bg-black border-t border-holo-alert/20 p-1 px-3 flex justify-between text-[10px] text-holo-alert/40 shrink-0 z-20">
                <span className="flex items-center gap-2"><Terminal size={10} /> TOR_V3 // ENCRYPTED</span>
                <span>IP: HIDDEN</span>
            </div>
        </div>
    );
};