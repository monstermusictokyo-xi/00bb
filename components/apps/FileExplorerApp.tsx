
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useMemo } from 'react';
import { DesktopItem } from '../../types';
import { Folder, FileText, ArrowLeft, Download, Trash2, Search, Home, HardDrive, Grid, List as ListIcon, Monitor, ChevronRight, FolderPlus } from 'lucide-react';

interface FileExplorerProps {
    rootItems: (DesktopItem | null)[];
    onLaunch: (item: DesktopItem) => void;
    onDeleteItem: (id: string) => void;
    onCreateFolder: (parentId: string | null, name: string) => void;
}

export const FileExplorerApp: React.FC<FileExplorerProps> = ({ rootItems, onLaunch, onDeleteItem, onCreateFolder }) => {
    // Path stack stores the hierarchy of folders we've drilled into
    const [path, setPath] = useState<DesktopItem[]>([]);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [search, setSearch] = useState('');
    const [selectedId, setSelectedId] = useState<string | null>(null);

    // Helper to get current folder contents based on path
    const currentItems = useMemo(() => {
        // If path is empty, we are at root (Desktop)
        const parentFolder = path.length > 0 ? path[path.length - 1] : null;
        
        // If we have a parent folder, look it up in the live rootItems to ensure we have the latest state (in case of deletions/updates)
        // We need a recursive find function to locate the current folder in the live tree
        const findFolderInTree = (items: (DesktopItem | null)[], targetId: string): DesktopItem | null => {
            for (const item of items) {
                if (!item) continue;
                if (item.id === targetId) return item;
                if (item.type === 'folder' && item.contents) {
                    const found = findFolderInTree(item.contents, targetId);
                    if (found) return found;
                }
            }
            return null;
        };

        let items: (DesktopItem | null)[] = [];
        if (parentFolder) {
             const liveParent = findFolderInTree(rootItems, parentFolder.id);
             items = liveParent?.contents || [];
        } else {
             items = rootItems;
        }

        // Filter nulls
        let validItems = items.filter((i): i is DesktopItem => i !== null);
        
        if (search) {
            validItems = validItems.filter(i => i.name.toLowerCase().includes(search.toLowerCase()));
        }
        return validItems;
    }, [path, rootItems, search]);

    const handleNavigate = (item: DesktopItem) => {
        if (item.type === 'folder') {
            setPath([...path, item]);
            setSearch('');
            setSelectedId(null);
        } else {
            onLaunch(item);
        }
    };

    const handleUp = () => {
        if (path.length > 0) {
            setPath(path.slice(0, -1));
            setSelectedId(null);
        }
    };

    const handleBreadcrumbClick = (index: number) => {
        setPath(path.slice(0, index + 1));
        setSelectedId(null);
    };

    const handleHome = () => {
        setPath([]);
        setSelectedId(null);
    };

    const handleExport = (e: React.MouseEvent, item: DesktopItem) => {
        e.stopPropagation();
        if (item.notepadInitialContent) {
             const blob = new Blob([item.notepadInitialContent], { type: 'text/plain' });
             const url = URL.createObjectURL(blob);
             const a = document.createElement('a');
             a.href = url;
             a.download = item.name.endsWith('.txt') ? item.name : `${item.name}.txt`;
             document.body.appendChild(a);
             a.click();
             document.body.removeChild(a);
             URL.revokeObjectURL(url);
        } else if (item.type === 'folder') {
            alert("Cannot export directories yet.");
        } else {
            alert("Export protocol not supported for this file type.");
        }
    };

    const handleDelete = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (confirm("CONFIRM DELETION? Data will be purged.")) {
            onDeleteItem(id);
        }
    };

    const handleNewFolder = () => {
        const name = prompt("ENTER FOLDER NAME:", "New_Folder");
        if (name) {
            const parentId = path.length > 0 ? path[path.length - 1].id : null;
            onCreateFolder(parentId, name);
        }
    };

    return (
        <div className="h-full w-full bg-black/80 flex flex-col font-mono text-holo-text relative overflow-hidden">
            {/* Top Bar */}
            <div className="bg-holo-panel/50 border-b border-holo-border/30 p-2 flex items-center justify-between shrink-0 gap-4">
                <div className="flex items-center gap-2">
                     <button 
                        onClick={handleUp} 
                        disabled={path.length === 0}
                        className="p-1.5 hover:bg-holo-accent/10 disabled:opacity-30 rounded border border-transparent hover:border-holo-accent/30 transition-all"
                     >
                         <ArrowLeft size={16} />
                     </button>
                     <button 
                        onClick={handleHome}
                        className={`p-1.5 hover:bg-holo-accent/10 rounded border border-transparent hover:border-holo-accent/30 transition-all ${path.length === 0 ? 'text-holo-accent' : ''}`}
                     >
                         <Home size={16} />
                     </button>
                </div>

                {/* Breadcrumbs / Path Bar */}
                <div className="flex-1 bg-black/50 border border-holo-border/30 h-8 flex items-center px-3 gap-1 text-xs overflow-hidden">
                    <button onClick={handleHome} className="hover:text-holo-accent flex items-center gap-1">
                        <HardDrive size={12} />
                        <span>ROOT</span>
                    </button>
                    {path.map((folder, i) => (
                        <React.Fragment key={folder.id}>
                            <ChevronRight size={10} className="text-holo-text/40" />
                            <button 
                                onClick={() => handleBreadcrumbClick(i)}
                                className="hover:text-holo-accent truncate max-w-[100px]"
                            >
                                {folder.name}
                            </button>
                        </React.Fragment>
                    ))}
                </div>

                {/* Search */}
                <div className="relative w-48 hidden sm:block">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-holo-text/50" size={12} />
                    <input 
                        type="text" 
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="SEARCH FILES..."
                        className="w-full bg-black/50 border border-holo-border/30 py-1 pl-8 pr-2 text-xs text-holo-text focus:outline-none focus:border-holo-accent transition-colors"
                    />
                </div>

                <div className="flex gap-1 border-l border-holo-border/30 pl-2">
                    <button 
                        onClick={handleNewFolder}
                        className="p-1.5 rounded text-holo-text/70 hover:text-holo-accent hover:bg-holo-accent/10 transition-colors"
                        title="New Folder"
                    >
                        <FolderPlus size={14} />
                    </button>

                    <button 
                        onClick={() => setViewMode('grid')}
                        className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-holo-accent/20 text-holo-accent' : 'text-holo-text/50 hover:text-holo-text'}`}
                    >
                        <Grid size={14} />
                    </button>
                    <button 
                        onClick={() => setViewMode('list')}
                        className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-holo-accent/20 text-holo-accent' : 'text-holo-text/50 hover:text-holo-text'}`}
                    >
                        <ListIcon size={14} />
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex overflow-hidden">
                {/* Sidebar */}
                <div className="w-40 bg-holo-panel/20 border-r border-holo-border/20 hidden sm:flex flex-col p-2 gap-1 shrink-0">
                    <div className="text-[10px] text-holo-text/40 uppercase tracking-widest mb-2 px-2 mt-2">Drives</div>
                    <button 
                        onClick={handleHome}
                        className={`flex items-center gap-2 px-3 py-2 rounded text-xs text-left transition-colors ${path.length === 0 ? 'bg-holo-accent/10 text-holo-accent font-bold' : 'hover:bg-white/5 text-holo-text/70'}`}
                    >
                        <Monitor size={14} />
                        Desktop
                    </button>
                    
                    {/* Quick Access Logic (Mocked) */}
                    <div className="text-[10px] text-holo-text/40 uppercase tracking-widest mb-2 px-2 mt-4">Quick Access</div>
                    <button className="flex items-center gap-2 px-3 py-2 rounded text-xs text-left hover:bg-white/5 text-holo-text/70 opacity-50 cursor-not-allowed">
                        <Download size={14} />
                        Downloads
                    </button>
                </div>

                {/* File Area */}
                <div className="flex-1 overflow-y-auto p-4 relative">
                    {/* Grid Pattern Background */}
                    <div className="absolute inset-0 bg-[size:40px_40px] bg-grid-pattern opacity-10 pointer-events-none" />

                    {currentItems.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-holo-text/30">
                            <Folder size={48} strokeWidth={1} className="mb-2" />
                            <span className="text-xs uppercase tracking-widest">Directory Empty</span>
                        </div>
                    ) : (
                        <div className={`${viewMode === 'grid' ? 'grid grid-cols-[repeat(auto-fill,minmax(90px,1fr))] gap-4' : 'flex flex-col gap-1'}`}>
                            {currentItems.map(item => (
                                <div 
                                    key={item.id}
                                    onClick={() => setSelectedId(item.id)}
                                    onDoubleClick={() => handleNavigate(item)}
                                    className={`
                                        group relative border cursor-pointer transition-all duration-200
                                        ${viewMode === 'grid' 
                                            ? `flex flex-col items-center gap-2 p-4 aspect-square rounded-lg hover:bg-white/5 ${selectedId === item.id ? 'bg-holo-accent/10 border-holo-accent' : 'border-transparent hover:border-holo-border/30'}`
                                            : `flex items-center gap-4 p-2 w-full hover:bg-white/5 ${selectedId === item.id ? 'bg-holo-accent/10 border-holo-accent' : 'border-transparent border-b-holo-border/10'}`
                                        }
                                    `}
                                >
                                    <div className={`${viewMode === 'grid' ? 'w-10 h-10' : 'w-6 h-6'} text-holo-text group-hover:text-holo-accent transition-colors flex items-center justify-center`}>
                                        <item.icon className="w-full h-full" strokeWidth={1.5} />
                                    </div>
                                    
                                    <div className={`min-w-0 flex-1 ${viewMode === 'grid' ? 'text-center w-full' : 'text-left'}`}>
                                        <div className="text-xs font-mono truncate group-hover:text-holo-textBright">{item.name}</div>
                                        {viewMode === 'list' && <div className="text-[10px] text-holo-text/40 uppercase">{item.type}</div>}
                                    </div>

                                    {/* Hover Actions (Export/Delete) */}
                                    <div className={`absolute ${viewMode === 'grid' ? 'top-1 right-1' : 'right-2 top-1/2 -translate-y-1/2'} opacity-0 group-hover:opacity-100 transition-opacity flex gap-1`}>
                                        {item.type === 'app' && item.notepadInitialContent && (
                                            <button 
                                                onClick={(e) => handleExport(e, item)}
                                                className="p-1 bg-black/80 border border-holo-border/30 rounded hover:text-holo-accent hover:border-holo-accent text-holo-text/50"
                                                title="Export"
                                            >
                                                <Download size={10} />
                                            </button>
                                        )}
                                        <button 
                                            onClick={(e) => handleDelete(e, item.id)}
                                            className="p-1 bg-black/80 border border-holo-border/30 rounded hover:text-holo-alert hover:border-holo-alert text-holo-text/50"
                                            title="Delete"
                                        >
                                            <Trash2 size={10} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Footer Status */}
            <div className="bg-holo-panel/50 border-t border-holo-border/30 p-1 px-3 flex justify-between text-[10px] text-holo-text/50 uppercase tracking-wider">
                <span>{currentItems.length} OBJECTS</span>
                <span>{selectedId ? 'ITEM SELECTED' : 'READY'}</span>
            </div>
        </div>
    );
};
