
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect, useRef } from 'react';
import { Package, ShieldAlert, CheckCircle2, XCircle, Clock, ShoppingCart, Search, FileText, AlertTriangle, Map, Crosshair, Navigation, Plane, User, Radio } from 'lucide-react';

interface Asset {
    id: string;
    name: string;
    category: 'WEAPONS' | 'SURVEILLANCE' | 'TACTICAL' | 'VEHICLE';
    clearance: 1 | 2 | 3 | 4 | 5;
    stock: number;
    description: string;
}

interface Request {
    id: string;
    assetId: string;
    assetName: string;
    status: 'PENDING' | 'APPROVED' | 'DENIED' | 'IN_TRANSIT' | 'DELIVERED';
    timestamp: string;
    destination: string;
    eta?: number; // seconds
    progress?: number;
}

interface Location {
    id: string;
    name: string;
    coords: string;
    riskLevel: 'LOW' | 'MED' | 'HIGH';
    etaMultiplier: number;
    x: number; // % position for map
    y: number; // % position for map
}

const ASSETS: Asset[] = [
    { id: 'W-01', name: 'Suppressed PPK .380', category: 'WEAPONS', clearance: 2, stock: 45, description: 'Standard issue field sidearm. Compact profile.' },
    { id: 'S-04', name: 'L-3 Harris NVG (Quad)', category: 'TACTICAL', clearance: 3, stock: 12, description: 'Panoramic night vision goggles. Gen 3 phosphor.' },
    { id: 'V-09', name: 'Black Helicopter Support', category: 'VEHICLE', clearance: 5, stock: 2, description: '1hr close air support/extraction. Langley Authorization required.' },
    { id: 'S-11', name: 'Laser Mic (Long Range)', category: 'SURVEILLANCE', clearance: 3, stock: 8, description: 'Detects window vibrations from 500m.' },
    { id: 'T-22', name: 'False Passport Printer', category: 'TACTICAL', clearance: 4, stock: 5, description: 'Portable. Supports EU/US/ASIA templates.' },
    { id: 'W-55', name: 'C-4 Plastic Explosive (1kg)', category: 'WEAPONS', clearance: 4, stock: 20, description: 'Stable. Includes detonators.' },
    { id: 'S-99', name: 'Cyanide Pill (Molar)', category: 'TACTICAL', clearance: 5, stock: 100, description: 'Last resort. Instant acting.' },
    { id: 'V-02', name: 'Armored SUV (Black)', category: 'VEHICLE', clearance: 2, stock: 15, description: 'B6 ballistic protection. Run-flat tires.' },
];

const LOCATIONS: Location[] = [
    { id: 'HQ', name: 'Langley HQ', coords: '38.94° N, 77.14° W', riskLevel: 'LOW', etaMultiplier: 0.1, x: 25, y: 35 },
    { id: 'BER', name: 'Safehouse Berlin', coords: '52.52° N, 13.40° E', riskLevel: 'MED', etaMultiplier: 1.0, x: 52, y: 30 },
    { id: 'TKY', name: 'Station Tokyo', coords: '35.67° N, 139.65° E', riskLevel: 'LOW', etaMultiplier: 1.5, x: 85, y: 38 },
    { id: 'KAB', name: 'FOB Kabul', coords: '34.55° N, 69.20° E', riskLevel: 'HIGH', etaMultiplier: 2.5, x: 65, y: 42 },
    { id: 'BOG', name: 'Outpost Bogota', coords: '4.71° N, 74.07° W', riskLevel: 'MED', etaMultiplier: 1.2, x: 28, y: 55 },
    { id: 'MOS', name: 'Moscow Safehouse', coords: '55.75° N, 37.61° E', riskLevel: 'HIGH', etaMultiplier: 2.0, x: 60, y: 25 },
    { id: 'CAI', name: 'Cairo Station', coords: '30.04° N, 31.23° E', riskLevel: 'MED', etaMultiplier: 1.1, x: 55, y: 45 },
];

export const RequisitionApp: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'CATALOG' | 'REQUESTS' | 'LOCATOR'>('CATALOG');
    const [searchQuery, setSearchQuery] = useState('');
    const [activeLocation, setActiveLocation] = useState<Location>(LOCATIONS[0]);
    const [agentPos, setAgentPos] = useState<{x: number, y: number}>({ x: 45, y: 45 });
    
    const [requests, setRequests] = useState<Request[]>([
        { id: 'REQ-8842', assetId: 'W-01', assetName: 'Suppressed PPK .380', status: 'DELIVERED', timestamp: '2049-11-01 08:30', destination: 'Safehouse Berlin', progress: 100 },
        { id: 'REQ-8841', assetId: 'V-09', assetName: 'Black Helicopter Support', status: 'DENIED', timestamp: '2049-10-31 23:15', destination: 'Langley HQ', progress: 0 },
    ]);

    // Simulate delivery progress
    useEffect(() => {
        const interval = setInterval(() => {
            setRequests(prevRequests => prevRequests.map(req => {
                if (req.status === 'IN_TRANSIT' && req.eta && req.progress !== undefined) {
                    const newProgress = Math.min(100, req.progress + (100 / req.eta));
                    if (newProgress >= 100) {
                        return { ...req, progress: 100, status: 'DELIVERED' };
                    }
                    return { ...req, progress: newProgress };
                }
                return req;
            }));
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    // Simulate Agent Movement
    useEffect(() => {
        const interval = setInterval(() => {
            setAgentPos(prev => {
                const dx = (Math.random() - 0.5) * 4;
                const dy = (Math.random() - 0.5) * 4;
                const newX = Math.max(5, Math.min(95, prev.x + dx));
                const newY = Math.max(10, Math.min(90, prev.y + dy));
                return { x: newX, y: newY };
            });
        }, 2000);
        return () => clearInterval(interval);
    }, []);

    // Update active location if it matches agent
    useEffect(() => {
        if (activeLocation.id === 'AGENT_ALPHA') {
            setActiveLocation({
                id: 'AGENT_ALPHA',
                name: 'Agent Alpha (Live)',
                coords: `${(90 - (agentPos.y / 100) * 180).toFixed(4)}° N, ${((agentPos.x / 100) * 360 - 180).toFixed(4)}° W`,
                riskLevel: 'HIGH',
                etaMultiplier: 0.3, // Fast drone drop
                x: agentPos.x,
                y: agentPos.y
            });
        }
    }, [agentPos, activeLocation.id]);

    const handleRequest = (asset: Asset) => {
        const isApproved = asset.clearance <= 3; // Simplified logic
        const baseTime = 10; // Base seconds for simulation
        const eta = Math.floor(baseTime * activeLocation.etaMultiplier);
        
        const newReq: Request = {
            id: `REQ-${Math.floor(Math.random() * 10000)}`,
            assetId: asset.id,
            assetName: asset.name,
            status: isApproved ? 'IN_TRANSIT' : (asset.clearance > 4 ? 'PENDING' : 'DENIED'),
            timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
            destination: activeLocation.name,
            eta: eta,
            progress: 0
        };
        setRequests([newReq, ...requests]);
        setActiveTab('REQUESTS');
    };

    const handleSelectAgent = () => {
        setActiveLocation({
            id: 'AGENT_ALPHA',
            name: 'Agent Alpha (Live)',
            coords: `${(90 - (agentPos.y / 100) * 180).toFixed(4)}° N, ${((agentPos.x / 100) * 360 - 180).toFixed(4)}° W`,
            riskLevel: 'HIGH',
            etaMultiplier: 0.3,
            x: agentPos.x,
            y: agentPos.y
        });
    };

    const getClearanceColor = (level: number) => {
        if (level >= 5) return 'text-red-500 border-red-500';
        if (level === 4) return 'text-orange-500 border-orange-500';
        return 'text-holo-accent border-holo-accent';
    };

    const filteredAssets = ASSETS.filter(a => 
        a.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        a.category.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="h-full w-full bg-black flex flex-col font-mono text-sm relative overflow-hidden">
             {/* Background Eagle Watermark */}
             <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-5">
                <ShieldAlert size={400} />
             </div>

             {/* Header */}
             <div className="bg-zinc-900 border-b border-zinc-700 p-4 flex items-center justify-between shrink-0 z-10">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-zinc-800 border border-zinc-600 flex items-center justify-center rounded-sm">
                        <ShieldAlert className="text-zinc-400" />
                    </div>
                    <div>
                        <div className="font-bold text-zinc-200 text-lg tracking-tighter">LOGISTICS DIVISION</div>
                        <div className="text-[10px] text-zinc-500 uppercase tracking-widest">Langley, VA // HQ-7</div>
                    </div>
                </div>
                <div className="text-right hidden sm:block">
                    <div className="text-[10px] text-zinc-500 uppercase">Active Drop Zone</div>
                    <div className="font-bold text-holo-accent flex items-center justify-end gap-2">
                        <MapPinIcon /> {activeLocation.name.toUpperCase()}
                    </div>
                </div>
             </div>

             {/* Navigation */}
             <div className="flex border-b border-zinc-800 bg-black z-10">
                <button 
                    onClick={() => setActiveTab('CATALOG')}
                    className={`flex-1 py-3 flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider transition-colors ${activeTab === 'CATALOG' ? 'bg-zinc-800 text-zinc-100 border-b-2 border-holo-accent' : 'text-zinc-600 hover:text-zinc-300'}`}
                >
                    <ShoppingCart size={14} /> Catalog
                </button>
                <button 
                    onClick={() => setActiveTab('REQUESTS')}
                    className={`flex-1 py-3 flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider transition-colors ${activeTab === 'REQUESTS' ? 'bg-zinc-800 text-zinc-100 border-b-2 border-holo-accent' : 'text-zinc-600 hover:text-zinc-300'}`}
                >
                    <FileText size={14} /> Track
                    {requests.filter(r => r.status === 'IN_TRANSIT').length > 0 && 
                        <span className="bg-holo-accent text-black text-[10px] px-1.5 py-0.5 rounded-full font-bold animate-pulse">
                            {requests.filter(r => r.status === 'IN_TRANSIT').length}
                        </span>
                    }
                </button>
                <button 
                    onClick={() => setActiveTab('LOCATOR')}
                    className={`flex-1 py-3 flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider transition-colors ${activeTab === 'LOCATOR' ? 'bg-zinc-800 text-zinc-100 border-b-2 border-holo-accent' : 'text-zinc-600 hover:text-zinc-300'}`}
                >
                    <Map size={14} /> Locator
                </button>
             </div>

             {/* Content */}
             <div className="flex-1 overflow-hidden relative z-0 bg-zinc-900/50">
                
                {activeTab === 'CATALOG' && (
                    <div className="h-full flex flex-col p-4 animate-in fade-in duration-300">
                        {/* Search Bar */}
                        <div className="relative mb-4">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={14} />
                            <input 
                                type="text"
                                placeholder="SEARCH DATABASE..." 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-black border border-zinc-700 p-2 pl-9 text-zinc-300 focus:outline-none focus:border-holo-accent focus:ring-1 focus:ring-holo-accent/50 placeholder-zinc-700 uppercase tracking-wider"
                            />
                        </div>

                        {/* Asset Grid */}
                        <div className="flex-1 overflow-y-auto pr-1">
                            <div className="grid grid-cols-1 gap-3">
                                {filteredAssets.map(asset => (
                                    <div key={asset.id} className="bg-black border border-zinc-800 p-3 flex items-start justify-between group hover:border-holo-accent/30 transition-all">
                                        <div className="flex gap-3">
                                            <div className={`w-12 h-12 flex items-center justify-center border ${getClearanceColor(asset.clearance)} bg-black/50 text-xs font-bold`}>
                                                L{asset.clearance}
                                            </div>
                                            <div>
                                                <div className="text-zinc-200 font-bold text-sm group-hover:text-holo-accent transition-colors uppercase">{asset.name}</div>
                                                <div className="text-[10px] text-zinc-500 flex gap-2 items-center mt-0.5">
                                                    <span className="bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-400">{asset.category}</span>
                                                    <span>ID: {asset.id}</span>
                                                    <span>STOCK: {asset.stock}</span>
                                                </div>
                                                <div className="text-xs text-zinc-500 mt-1 italic">{asset.description}</div>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => handleRequest(asset)}
                                            className="px-4 py-2 bg-zinc-800 border border-zinc-700 text-zinc-300 text-xs font-bold uppercase hover:bg-holo-accent hover:text-black hover:border-holo-accent transition-all shadow-[0_0_10px_transparent] hover:shadow-glow flex items-center gap-2"
                                        >
                                            <span>Requisition</span>
                                            <Plane size={12} className="opacity-50" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'REQUESTS' && (
                    <div className="h-full overflow-y-auto p-4 animate-in slide-in-from-right-4 duration-300">
                        {requests.length === 0 ? (
                             <div className="h-full flex flex-col items-center justify-center text-zinc-600 opacity-50">
                                <Package size={48} className="mb-2" />
                                <div>NO ACTIVE REQUISITIONS</div>
                             </div>
                        ) : (
                            <div className="space-y-2">
                                {requests.map(req => (
                                    <div key={req.id} className="bg-black border border-zinc-800 p-4 relative overflow-hidden">
                                        {/* Progress Bar Background */}
                                        {req.status === 'IN_TRANSIT' && (
                                            <div className="absolute bottom-0 left-0 h-1 bg-holo-accent transition-all duration-1000 ease-linear" style={{ width: `${req.progress}%` }} />
                                        )}

                                        <div className="flex items-center justify-between relative z-10">
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-xs text-zinc-500 font-bold">{req.id}</span>
                                                    <span className="text-[10px] text-zinc-600">{req.timestamp}</span>
                                                </div>
                                                <div className="text-sm text-zinc-200 font-bold uppercase">{req.assetName}</div>
                                                <div className="text-[10px] text-zinc-500 uppercase mt-1 flex items-center gap-2">
                                                    <MapPinIcon size={10} />
                                                    <span>Dest: {req.destination}</span>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className={`flex items-center gap-2 px-3 py-1.5 border text-xs font-bold uppercase tracking-wider mb-1 ${
                                                    req.status === 'APPROVED' ? 'border-green-900 bg-green-900/10 text-green-500' :
                                                    req.status === 'DENIED' ? 'border-red-900 bg-red-900/10 text-red-500' :
                                                    req.status === 'IN_TRANSIT' ? 'border-holo-accent bg-holo-accent/10 text-holo-accent' :
                                                    req.status === 'DELIVERED' ? 'border-green-500 bg-green-500/20 text-green-400' :
                                                    'border-yellow-900 bg-yellow-900/10 text-yellow-500'
                                                }`}>
                                                    {req.status === 'DELIVERED' && <CheckCircle2 size={14} />}
                                                    {req.status === 'DENIED' && <XCircle size={14} />}
                                                    {req.status === 'IN_TRANSIT' && <Plane size={14} className="animate-pulse" />}
                                                    {req.status}
                                                </div>
                                                {req.status === 'IN_TRANSIT' && req.eta && (
                                                     <div className="text-[10px] text-holo-accent font-mono">ETA: {Math.ceil(req.eta * (1 - (req.progress || 0)/100))}s</div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'LOCATOR' && (
                    <div className="h-full flex flex-col relative animate-in zoom-in-95 duration-300 bg-[#050505]">
                         {/* Holographic Grid Background */}
                        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,243,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(0,243,255,0.05)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />
                        
                        <div className="absolute top-4 left-4 z-10">
                            <div className="text-holo-accent text-xs font-bold uppercase tracking-[0.2em] mb-1">Global Deployment Map</div>
                            <div className="text-[10px] text-zinc-500">Select active operational zone for supply drops.</div>
                        </div>

                        <div className="flex-1 relative m-8 border border-holo-accent/30 bg-black/50 shadow-[0_0_30px_rgba(0,243,255,0.1)] overflow-hidden rounded-lg">
                             {/* Fake World Map SVG/Representation */}
                             <div className="absolute inset-0 opacity-20 pointer-events-none">
                                 {/* Simple world map silhouette approximation using CSS or just a placeholder pattern since we can't load external large SVGs easily without imports */}
                                 <svg viewBox="0 0 100 60" className="w-full h-full fill-holo-accent">
                                    <path d="M20,15 Q25,10 30,15 T40,20 T50,15 T60,20 T70,15 T80,20 L80,40 Q70,45 60,40 T50,45 T40,40 T30,45 T20,40 Z" />
                                    <path d="M5,25 Q10,20 15,25 T20,35 L10,40 Z" /> {/* Americas ish */}
                                    <path d="M55,30 Q60,25 65,30 T75,40 L55,45 Z" /> {/* Asia ish */}
                                 </svg>
                             </div>

                             {/* Location Dots */}
                             {LOCATIONS.map(loc => (
                                 <button
                                    key={loc.id}
                                    onClick={() => setActiveLocation(loc)}
                                    style={{ left: `${loc.x}%`, top: `${loc.y}%` }}
                                    className={`absolute transform -translate-x-1/2 -translate-y-1/2 group flex flex-col items-center gap-2 transition-all duration-300 ${activeLocation.id === loc.id ? 'z-20 scale-110' : 'z-10 opacity-70 hover:opacity-100'}`}
                                 >
                                     <div className={`relative w-4 h-4 flex items-center justify-center`}>
                                         <div className={`absolute inset-0 rounded-full ${activeLocation.id === loc.id ? 'bg-holo-accent animate-ping' : 'bg-zinc-600'}`} />
                                         <div className={`relative w-2 h-2 rounded-full ${activeLocation.id === loc.id ? 'bg-white' : 'bg-black border border-zinc-400'}`} />
                                     </div>
                                     
                                     <div className={`bg-black/80 border ${activeLocation.id === loc.id ? 'border-holo-accent text-holo-accent' : 'border-zinc-700 text-zinc-400'} px-2 py-1 text-[10px] font-bold uppercase whitespace-nowrap backdrop-blur-sm shadow-glow transition-colors`}>
                                         {loc.name}
                                     </div>
                                 </button>
                             ))}

                             {/* Live Agent Marker */}
                             <button
                                onClick={handleSelectAgent}
                                style={{ left: `${agentPos.x}%`, top: `${agentPos.y}%` }}
                                className={`absolute transform -translate-x-1/2 -translate-y-1/2 group flex flex-col items-center gap-2 transition-all duration-1000 ease-linear ${activeLocation.id === 'AGENT_ALPHA' ? 'z-30 scale-110' : 'z-20'}`}
                             >
                                <div className="relative w-6 h-6 flex items-center justify-center">
                                    <div className="absolute inset-0 rounded-full bg-green-500/30 animate-ping" />
                                    <div className={`relative w-full h-full rounded-full border border-green-500 bg-black flex items-center justify-center ${activeLocation.id === 'AGENT_ALPHA' ? 'shadow-[0_0_15px_rgba(0,255,100,0.8)]' : ''}`}>
                                        <User size={12} className="text-green-500" />
                                    </div>
                                </div>
                                <div className={`bg-black/80 border ${activeLocation.id === 'AGENT_ALPHA' ? 'border-green-500 text-green-500' : 'border-green-900 text-green-700'} px-2 py-1 text-[10px] font-bold uppercase whitespace-nowrap backdrop-blur-sm flex items-center gap-1`}>
                                    <Radio size={10} className="animate-pulse" />
                                    AGENT ALPHA
                                </div>
                             </button>

                        </div>

                        <div className="h-32 bg-zinc-900/80 border-t border-zinc-800 p-4 flex justify-between items-end">
                             <div>
                                 <div className="text-[10px] text-zinc-500 uppercase mb-1 flex items-center gap-2">
                                    Selected Coordinates
                                    {activeLocation.id === 'AGENT_ALPHA' && <span className="text-green-500 font-bold animate-pulse bg-green-900/20 px-1 rounded">LIVE SIGNAL</span>}
                                 </div>
                                 <div className="text-xl font-mono text-holo-accent tracking-widest">{activeLocation.coords}</div>
                                 <div className="flex items-center gap-4 mt-2 text-xs">
                                     <div className="flex items-center gap-1 text-zinc-400">
                                         <Navigation size={12} />
                                         <span>Distance Factor: {activeLocation.etaMultiplier}x</span>
                                     </div>
                                     <div className={`flex items-center gap-1 px-2 py-0.5 border ${
                                         activeLocation.riskLevel === 'HIGH' ? 'border-red-500 text-red-500' : 
                                         activeLocation.riskLevel === 'MED' ? 'border-yellow-500 text-yellow-500' : 
                                         'border-green-500 text-green-500'
                                     } text-[10px] font-bold`}>
                                         <AlertTriangle size={10} />
                                         RISK: {activeLocation.riskLevel}
                                     </div>
                                 </div>
                             </div>
                             <div className="text-right">
                                 <button 
                                    onClick={() => setActiveTab('CATALOG')}
                                    className="bg-holo-accent text-black px-6 py-2 font-bold uppercase text-xs hover:bg-white transition-colors shadow-glow"
                                >
                                    Confirm Deployment
                                </button>
                             </div>
                        </div>
                    </div>
                )}
             </div>
        </div>
    );
};

const MapPinIcon = ({ size = 14, className = "" }: { size?: number, className?: string }) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        width={size} 
        height={size} 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        className={className}
    >
        <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
        <circle cx="12" cy="10" r="3" />
    </svg>
);
