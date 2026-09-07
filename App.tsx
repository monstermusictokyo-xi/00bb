
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useRef } from 'react';
import { MousePointer2, PenLine, Play, Mail, Presentation, Folder, Loader2, FileText, Image as ImageIcon, Crosshair, Eraser, ShieldAlert, Globe, Radio, Database, Disc, Mic2, Bitcoin, Plane, Package, HardDrive, Cpu, PlaneTakeoff } from 'lucide-react';
import { Modality } from "@google/genai";
import { AppId, DesktopItem, Stroke, Email } from './types';
import { HomeScreen } from './components/apps/HomeScreen';
import { MailApp } from './components/apps/MailApp';
import { SlidesApp } from './components/apps/SlidesApp';
import { SnakeGame } from './components/apps/SnakeGame';
import { FolderView } from './components/apps/FolderView';
import { DraggableWindow } from './components/DraggableWindow';
import { InkLayer } from './components/InkLayer';
import { getAiClient, HOME_TOOLS, MAIL_TOOLS, MODEL_NAME, SYSTEM_INSTRUCTION } from './lib/gemini';
import { NotepadApp } from './components/apps/NotepadApp';
import { LyraTerminal } from './components/apps/LyraTerminal';
import { DarkWebApp } from './components/apps/DarkWebApp';
import { WalletApp } from './components/apps/WalletApp';
import { DroneApp } from './components/apps/DroneApp';
import { RequisitionApp } from './components/apps/RequisitionApp';
import { FileExplorerApp } from './components/apps/FileExplorerApp';
import { AppBuilderApp } from './components/apps/AppBuilderApp';
import { NexusNetApp } from './components/apps/NexusNetApp';
import { F47GhostApp } from './components/apps/F47GhostApp';

const INITIAL_DESKTOP_ITEMS: DesktopItem[] = [
    { id: 'explorer', name: 'SYSTEM_FILES', type: 'app', icon: HardDrive, appId: 'explorer', bgColor: 'bg-transparent' },
    { id: 'builder', name: 'APP_BUILDER', type: 'app', icon: Cpu, appId: 'builder', bgColor: 'bg-transparent' },
    { id: 'mail', name: 'COMMS_LINK', type: 'app', icon: Mail, appId: 'mail', bgColor: 'bg-transparent' },
    { id: 'slides', name: 'MISSION_DECK', type: 'app', icon: Presentation, appId: 'slides', bgColor: 'bg-transparent' },
    { id: 'lyra', name: 'LYRA_X.I.', type: 'app', icon: Mic2, appId: 'lyra', bgColor: 'bg-transparent' },
    { id: 'drone', name: 'UAV_UPLINK', type: 'app', icon: Plane, appId: 'drone', bgColor: 'bg-transparent' },
    { id: 'req', name: 'SUPPLY_CHAIN', type: 'app', icon: Package, appId: 'requisition', bgColor: 'bg-transparent' },
    { id: 'wallet', name: 'CRYPTO_VAULT', type: 'app', icon: Bitcoin, appId: 'wallet', bgColor: 'bg-transparent' },
    { id: 'darkweb', name: 'SHADOW_NET', type: 'app', icon: Globe, appId: 'darkweb', bgColor: 'bg-transparent' },
    { id: 'nexusnet', name: 'NEXUS_NET', type: 'app', icon: Globe, appId: 'nexusnet', bgColor: 'bg-transparent' },
    { id: 'f47ghost', name: 'F-47_GHOST', type: 'app', icon: PlaneTakeoff, appId: 'f47ghost', bgColor: 'bg-transparent' },
    { id: 'snake', name: 'SIMULATION_X', type: 'app', icon: Crosshair, appId: 'snake', bgColor: 'bg-transparent' },
    { 
        id: 'how_to_use', 
        name: 'README.dat', 
        type: 'app', 
        icon: FileText, 
        appId: 'notepad', 
        bgColor: 'bg-transparent',
        notepadInitialContent: `/// HOLOGRAM INTERFACE PROTOCOLS ///

ID: USER_ALPHA
ACCESS: LEVEL 5

GESTURE CONTROLS:
1. PURGE (Delete): Draw 'X' on target.
2. DECRYPT (Explode): Draw arrows out from folder.
3. ANALYZE (Info): Draw '?' on target.
4. HOLO_GEN (Wallpaper): Sketch terrain on void space.

/// SAVE PROTOCOLS ///
Use the [SAVE] function in text editor to persist data shards to local memory.`
    },
    { 
        id: 'notes', 
        name: 'LOG_744.txt', 
        type: 'app', 
        icon: Database, 
        appId: 'notepad', 
        bgColor: 'bg-transparent',
        notepadInitialContent: `/// CAPTAIN'S LOG ///
STARDATE: 2049.11.02

The holographic array is stabilizing. 
Visual cortex integration at 98%.

Anomalies detected in Sector 7 grid.
Recommend manual override of firewall.`
    },
    { id: 'docs', name: 'DATA_BANK', type: 'folder', icon: Folder, bgColor: 'bg-transparent', contents: [
        { id: 'doc1', name: 'Blueprint_A.cad', type: 'app', icon: FileText, bgColor: 'bg-transparent' },
        { id: 'img1', name: 'Render_09.png', type: 'app', icon: ImageIcon, bgColor: 'bg-transparent' }
    ] },
    { id: 'projects', name: 'NET_TOOLS', type: 'folder', icon: ShieldAlert, bgColor: 'bg-transparent', contents: [
        { id: 'p1', name: 'Uplink.exe', type: 'app', icon: Radio, bgColor: 'bg-transparent' }
    ]}
];

const INITIAL_EMAILS: Email[] = [
    { id: 1, from: 'Command_Central', subject: 'Directive: NEON RAIN', preview: 'Atmospheric stabilizers failing...', body: 'COMMAND,\n\nAtmospheric stabilizers failing in the lower distracts. Operation NEON RAIN is now active. Mobilize all units.\n\nOVERLORD', time: '0800', unread: true },
    { id: 2, from: 'AI_Core', subject: 'System Optimization', preview: 'Neural pathways rerouted...', body: 'SYSTEM REPORT:\n\nNeural pathways rerouted to auxiliary nodes. Efficiency increased by 14%.', time: '0400', unread: false },
    { id: 3, from: 'Unknown_Signal', subject: '01001011', preview: 'Encrypted packet received...', body: 'ERROR: DECRYPTION FAILED.\n\nSource unknown. Trace attempt blocked.', time: 'YESTERDAY', unread: false },
];

interface OpenWindow {
    id: string;
    item: DesktopItem;
    zIndex: number;
    pos: { x: number, y: number };
    size?: { width: number, height: number };
}

export const App: React.FC = () => {
    const [openWindows, setOpenWindows] = useState<OpenWindow[]>([]);
    const [focusedId, setFocusedId] = useState<string | null>(null);
    const [nextZIndex, setNextZIndex] = useState(100);
    const [inkMode, setInkMode] = useState(false);
    const [strokes, setStrokes] = useState<Stroke[]>([]);
    const [desktopItems, setDesktopItems] = useState<(DesktopItem | null)[]>(INITIAL_DESKTOP_ITEMS);
    const [emails, setEmails] = useState<Email[]>(INITIAL_EMAILS);
    const [isProcessing, setIsProcessing] = useState(false);
    const [toast, setToast] = useState<{ title?: string; message: React.ReactNode } | null>(null);
    const [wallpaperUrl, setWallpaperUrl] = useState<string | null>(null);
    const timeoutRef = useRef<number | null>(null);

    const showToast = (message: React.ReactNode, title?: string, autoDismiss: boolean = true) => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
        setToast({ message, title });
        if (autoDismiss) {
            timeoutRef.current = setTimeout(() => {
                setToast(null);
                timeoutRef.current = null;
            }, 6000);
        }
    };

    const handleLaunch = (item: DesktopItem) => {
        if (inkMode) return;
        
        if (openWindows.find(w => w.id === item.id)) {
            focusWindow(item.id);
            return;
        }

        let initialSize = { width: 640, height: 480 };
        if (item.appId === 'mail') initialSize = { width: 900, height: 650 };
        if (item.appId === 'snake') initialSize = { width: 600, height: 600 };
        if (item.appId === 'notepad') initialSize = { width: 500, height: 600 };
        if (item.appId === 'lyra') initialSize = { width: 400, height: 500 };
        if (item.appId === 'darkweb') initialSize = { width: 800, height: 600 };
        if (item.appId === 'wallet') initialSize = { width: 400, height: 550 };
        if (item.appId === 'drone') initialSize = { width: 800, height: 600 };
        if (item.appId === 'requisition') initialSize = { width: 700, height: 550 };
        if (item.appId === 'explorer') initialSize = { width: 800, height: 550 };
        if (item.appId === 'builder') initialSize = { width: 900, height: 650 };
        if (item.appId === 'nexusnet') initialSize = { width: 950, height: 700 };
        if (item.appId === 'f47ghost') initialSize = { width: 1000, height: 750 };


        setOpenWindows(prev => [...prev, {
            id: item.id,
            item: item,
            zIndex: nextZIndex,
            pos: { x: 50 + (prev.length * 40), y: 50 + (prev.length * 40) },
            size: initialSize
        }]);
        setNextZIndex(prev => prev + 1);
        setFocusedId(item.id);
    };

    const closeWindow = (id: string) => {
        setOpenWindows(prev => prev.filter(w => w.id !== id));
        if (focusedId === id) setFocusedId(null);
    };

    const focusWindow = (id: string | null) => {
        if (id === null) {
            setFocusedId(null);
            return;
        }
        setFocusedId(id);
        setOpenWindows(prev => prev.map(w => w.id === id ? { ...w, zIndex: nextZIndex } : w));
        setNextZIndex(prev => prev + 1);
    };

    const handleSaveFile = (filename: string, content: string) => {
        // Normalize filename extension
        const finalName = filename.endsWith('.txt') || filename.endsWith('.dat') ? filename : `${filename}.txt`;
        
        setDesktopItems(prevItems => {
            // Check if file with same name exists in root
            const existingIndex = prevItems.findIndex(item => item && item.name === finalName);
            
            if (existingIndex >= 0) {
                // Update existing
                const newItems = [...prevItems];
                const existing = newItems[existingIndex];
                if (existing) {
                    newItems[existingIndex] = { ...existing, notepadInitialContent: content };
                }
                return newItems;
            } else {
                // Create new
                const newId = `file_${Date.now()}`;
                const newItem: DesktopItem = {
                    id: newId,
                    name: finalName,
                    type: 'app',
                    icon: FileText,
                    appId: 'notepad',
                    bgColor: 'bg-transparent',
                    notepadInitialContent: content
                };
                return [...prevItems, newItem];
            }
        });

        showToast(`DATA SHARD SAVED: ${finalName}`, "WRITE SUCCESS", true);
    };
    
    const handleCreateFolder = (parentId: string | null, name: string) => {
        const newFolder: DesktopItem = {
            id: `folder_${Date.now()}`,
            name: name,
            type: 'folder',
            icon: Folder,
            bgColor: 'bg-transparent',
            contents: []
        };

        if (!parentId) {
             setDesktopItems(prev => [...prev, newFolder]);
             showToast(`FOLDER CREATED: ${name}`, "SYSTEM", true);
             return;
        }

        setDesktopItems(prev => {
            const addToFolder = (items: (DesktopItem | null)[]): (DesktopItem | null)[] => {
                return items.map(item => {
                    if (!item) return null;
                    if (item.id === parentId && item.type === 'folder') {
                        return { ...item, contents: [...(item.contents || []), newFolder] };
                    }
                    if (item.type === 'folder' && item.contents) {
                        return { ...item, contents: addToFolder(item.contents).filter((i): i is DesktopItem => i !== null) };
                    }
                    return item;
                });
            };
            return addToFolder(prev);
        });
        showToast(`FOLDER CREATED: ${name}`, "SYSTEM", true);
    };

    const handleGenerateWallpaper = async (description: string) => {
        showToast("CONSTRUCTING SIMULATION...", "LYRA COMMAND", true);
        try {
             const ai = getAiClient();
             const imgResponse = await ai.models.generateContent({
                model: 'gemini-2.5-flash-image',
                contents: [
                    { text: `Generate a futuristic, holographic wireframe terrain or cyber city based on this description. Neon cyan, purple, and deep blue colors on black. Glowing grid lines, 80s synthwave or cyberpunk aesthetic. Description: ${description}` }
                ],
                config: {
                    responseModalities: [Modality.IMAGE],
                }
            });
            
            const candidates = imgResponse.candidates;
            if (candidates && candidates[0]?.content?.parts) {
                for (const part of candidates[0].content.parts) {
                    if (part.inlineData && part.inlineData.data) {
                         setWallpaperUrl(`data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`);
                         showToast("ENVIRONMENT RENDERED", "LYRA COMMAND", true);
                         break;
                    }
                }
            }
        } catch (err) {
             showToast("MATRIX ERROR", "LYRA COMMAND", true);
        }
    };

    const deleteItemRecursively = (items: (DesktopItem | null)[], nameToDelete: string, isRoot: boolean = true): { newItems: (DesktopItem | null)[], deleted: boolean } => {
        let deleted = false;
        const mappedItems = items.map(item => {
            if (!item) return null;
            if (item.name.toLowerCase().includes(nameToDelete)) {
                deleted = true;
                return isRoot ? null : undefined; 
            }
            if (item.type === 'folder' && item.contents) {
                const result = deleteItemRecursively(item.contents as (DesktopItem | null)[], nameToDelete, false);
                if (result.deleted) deleted = true;
                const newContents = result.newItems.filter((i): i is DesktopItem => i !== null && i !== undefined);
                return { ...item, contents: newContents };
            }
            return item;
        });
        const finalItems = isRoot ? mappedItems : mappedItems.filter(i => i !== undefined);
        return { newItems: finalItems as (DesktopItem | null)[], deleted };
    };

    const deleteItemById = (id: string) => {
        setDesktopItems(prev => {
            const deleteRecursively = (items: (DesktopItem | null)[]): (DesktopItem | null)[] => {
                return items.map(item => {
                    if (!item) return null;
                    if (item.id === id) return null;
                    if (item.type === 'folder' && item.contents) {
                        return { ...item, contents: deleteRecursively(item.contents).filter((i): i is DesktopItem => i !== null) };
                    }
                    return item;
                }).filter(i => i !== null);
            };
            return deleteRecursively(prev);
        });
        // Also close window if open
        closeWindow(id);
        showToast("ITEM DELETED", "SYSTEM", true);
    };

    const findItemByName = (items: (DesktopItem | null)[], name: string): DesktopItem | undefined => {
        for (const item of items) {
            if (!item) continue;
            if (item.name.toLowerCase().includes(name.toLowerCase())) {
                return item;
            }
            if (item.type === 'folder' && item.contents) {
                const found = findItemByName(item.contents, name);
                if (found) return found;
            }
        }
        return undefined;
    };

    const findEmailInList = (emailList: Email[], subjectQuery?: string, senderQuery?: string) => {
         const sQuery = subjectQuery?.toLowerCase() || '';
         const fQuery = senderQuery?.toLowerCase() || '';
         
         return emailList.find(e => {
             const subjectMatch = sQuery && e.subject.toLowerCase().includes(sQuery);
             const senderMatch = fQuery && e.from.toLowerCase().includes(fQuery);
             if (sQuery && fQuery) return subjectMatch && senderMatch;
             return subjectMatch || senderMatch;
         });
    };

    const getSketchImage = (currentStrokes: Stroke[]) => {
        const canvas = document.createElement('canvas');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) return null;

        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 8;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        currentStrokes.forEach(stroke => {
            if (stroke.length < 2) return;
            ctx.beginPath();
            ctx.moveTo(stroke[0].x, stroke[0].y);
            for (let i = 1; i < stroke.length; i++) {
                ctx.lineTo(stroke[i].x, stroke[i].y);
            }
            ctx.stroke();
        });
        return canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
    };

    const executeInkAction = async () => {
        if (strokes.length === 0) {
            showToast("NO INPUT DATA DETECTED", undefined, true);
            return;
        }

        setIsProcessing(true);
        try {
            const canvas = await html2canvas(document.body, {
                 ignoreElements: (element) => element.id === 'control-bar',
                 logging: false,
                 useCORS: true,
                 scale: 1 
            });
            const base64Image = canvas.toDataURL('image/jpeg', 0.7).split(',')[1];

            const ai = getAiClient();
            
            let activeTools = HOME_TOOLS;
            let contextDescription = 'Holographic Desktop Environment';

            if (focusedId) {
                const focusedWindow = openWindows.find(w => w.id === focusedId);
                if (focusedWindow?.item.appId === 'mail') {
                    activeTools = MAIL_TOOLS;
                    contextDescription = 'Secure Comms Interface';
                }
            }

             const response = await ai.models.generateContent({
                model: MODEL_NAME,
                contents: [
                    { inlineData: { mimeType: 'image/jpeg', data: base64Image } },
                    { text: `Analyze the holographic interface gestures (white strokes). User focus: ${contextDescription}.` }
                ],
                config: {
                    systemInstruction: SYSTEM_INSTRUCTION,
                    tools: activeTools,
                    temperature: 0.1,
                }
            });

            const functionCalls = response.functionCalls;

            if (functionCalls && functionCalls.length > 0) {
                let actionTaken = false;
                let workingDesktopItems = [...desktopItems];
                let workingEmails = [...emails];
                let desktopItemsChanged = false;
                let emailsChanged = false;
                let messages: React.ReactNode[] = [];
                let isSummary = false;

                for (const call of functionCalls) {
                    const args = call.args as any;

                    if (call.name === 'delete_item' && args.itemName) {
                        const itemName = args.itemName.toLowerCase();
                        const { newItems, deleted } = deleteItemRecursively(workingDesktopItems, itemName, true);
                        if (deleted) {
                            workingDesktopItems = newItems;
                            desktopItemsChanged = true;
                            messages.push(<div key={`del-${args.itemName}`} className="text-holo-alert">TARGET PURGED: {args.itemName}</div>);
                            actionTaken = true;
                        }
                    } else if (call.name === 'explode_folder' && args.folderName) {
                        const folderName = args.folderName.toLowerCase();
                        const folder = findItemByName(workingDesktopItems, folderName);

                        if (folder && folder.type === 'folder' && folder.contents) {
                            workingDesktopItems = workingDesktopItems.filter(i => i?.id !== folder.id);
                            workingDesktopItems.push(...folder.contents);
                            desktopItemsChanged = true;
                            messages.push(<div key={`exp-${folder.id}`} className="text-holo-accent">DECRYPTING ARCHIVE: {folder.name}</div>);
                            actionTaken = true;
                        }
                    } else if (call.name === 'explain_item' && args.itemName) {
                        const item = findItemByName(workingDesktopItems, args.itemName);
                        if (item) {
                            if (item.type === 'folder') {
                                const contentCount = item.contents?.length || 0;
                                const contentNames = item.contents?.map(i => i.name).join(', ') || 'NULL';
                                messages.push(
                                    <div key={`expl-${item.id}`}>
                                        <span className="font-bold text-holo-textBright text-xl text-glow">MANIFEST: {item.name}</span><br/>
                                        CONTAINS {contentCount} NODES: {contentNames}
                                    </div>
                                );
                                isSummary = true;
                            } else if (item.notepadInitialContent) {
                                showToast(`SCANNING DATA SHARD ${item.name}...`, undefined, true);
                                try {
                                    const summaryResponse = await ai.models.generateContent({
                                        model: 'gemini-2.5-flash-lite',
                                        contents: `Summarize this sci-fi data shard in one brief line: ${item.notepadInitialContent}`,
                                    });
                                    messages.push(
                                        <div key={`expl-${item.id}`}>
                                            <span className="font-bold text-holo-accent text-xl text-glow">DATA ANALYSIS: {item.name}</span><br/>
                                            {summaryResponse.text}
                                        </div>
                                    );
                                    isSummary = true;
                                } catch (e) {
                                    messages.push(<div key={`err-${item.id}`}>READ ERROR: {item.name}</div>);
                                }
                            } else {
                                 messages.push(<div key={`expl-${item.id}`}>{item.name} // BINARY EXECUTABLE</div>);
                            }
                            actionTaken = true;
                        }
                    } else if (call.name === 'change_background') {
                        showToast("CONSTRUCTING SIMULATION...", undefined, true);
                        const sketchBase64 = getSketchImage(strokes);
                        if (sketchBase64) {
                             try {
                                 const imgResponse = await ai.models.generateContent({
                                    model: 'gemini-2.5-flash-image',
                                    contents: [
                                        { inlineData: { mimeType: 'image/jpeg', data: sketchBase64 } },
                                        { text: `Generate a futuristic, holographic wireframe terrain or cyber city based on this sketch. Neon cyan, purple, and deep blue colors on black. Glowing grid lines, 80s synthwave or cyberpunk aesthetic. The geometry should match the sketch. ${args.sketch_description ? `Style: ${args.sketch_description}` : ''}` }
                                    ],
                                    config: {
                                        responseModalities: [Modality.IMAGE],
                                    }
                                });
                                
                                const candidates = imgResponse.candidates;
                                if (candidates && candidates[0]?.content?.parts) {
                                    for (const part of candidates[0].content.parts) {
                                        if (part.inlineData && part.inlineData.data) {
                                             setWallpaperUrl(`data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`);
                                             messages.push(<div key="wp-ok">ENVIRONMENT RENDERED</div>);
                                             actionTaken = true;
                                             break;
                                        }
                                    }
                                }
                                if (!actionTaken) messages.push(<div key="wp-fail">RENDER FAILED</div>);
                             } catch (err) {
                                 messages.push(<div key="wp-err">MATRIX ERROR</div>);
                             }
                        }
                    } 
                    else if (call.name === 'delete_email' && (args.subject_text || args.sender_text)) {
                         const emailToDelete = findEmailInList(workingEmails, args.subject_text, args.sender_text);
                         if (emailToDelete) {
                             workingEmails = workingEmails.filter(e => e.id !== emailToDelete.id);
                             emailsChanged = true;
                             messages.push(<div key={`del-mail-${emailToDelete.id}`}>TRANSMISSION SCRUBBED: {emailToDelete.from}</div>);
                             actionTaken = true;
                         }
                    } else if (call.name === 'summarize_email' && (args.subject_text || args.sender_text)) {
                        const emailToSummarize = findEmailInList(workingEmails, args.subject_text, args.sender_text);
                        if (emailToSummarize) {
                            showToast(`DECRYPTING SIGNAL: ${emailToSummarize.from}...`, undefined, true);
                            try {
                                const summaryResponse = await ai.models.generateContent({
                                    model: 'gemini-2.5-flash-lite',
                                    contents: `Summarize this sci-fi transmission in one tactical briefing sentence.
From: ${emailToSummarize.from}
Subject: ${emailToSummarize.subject}
Body: ${emailToSummarize.body}`,
                                });
                                messages.push(
                                    <div key={`sum-mail-${emailToSummarize.id}`}>
                                        <span className="font-bold text-holo-accent text-xl text-glow">INTEL: {emailToSummarize.from}</span><br/>
                                        {summaryResponse.text}
                                    </div>
                                );
                                actionTaken = true;
                                isSummary = true;
                            } catch (e) {
                                messages.push(<div key={`sum-err-${emailToSummarize.id}`}>DECRYPTION FAILED: {emailToSummarize.from}</div>);
                            }
                        }
                    }
                }

                if (desktopItemsChanged) {
                    setDesktopItems(workingDesktopItems);
                    setOpenWindows(prev => prev.filter(w => findItemByName(workingDesktopItems, w.item.name)));
                }
                if (emailsChanged) {
                    setEmails(workingEmails);
                }

                if (messages.length > 0) {
                    showToast(<div className="flex flex-col gap-3 font-mono uppercase">{messages}</div>, isSummary ? "INCOMING DATA" : "SYSTEM ALERT", false);
                } else if (!actionTaken) {
                     showToast("COMMAND UNRECOGNIZED", undefined, true);
                }

            } else {
                 showToast("UNKNOWN PROTOCOL", undefined, true);
            }

        } catch (e) {
            console.error("Gemini Error:", e);
            showToast("SYSTEM CRITICAL FAILURE", undefined, true);
        } finally {
            setIsProcessing(false);
            setStrokes([]);
        }
    };

    const buttonBaseClasses = "group relative flex items-center justify-center w-14 h-14 rounded-none border border-holo-border/30 transition-all duration-300 hover:shadow-[0_0_15px_rgba(0,243,255,0.3)] active:scale-95";
    const ICON_SIZE = 24;

    const handleGlobalPointerDown = (e: React.PointerEvent) => {
        if (toast) {
            const target = e.target as HTMLElement;
            if (!target.closest('.toast-card')) {
                setToast(null);
                if (timeoutRef.current) {
                    clearTimeout(timeoutRef.current);
                    timeoutRef.current = null;
                }
            }
        }
    };

    return (
        <div 
            className="h-full w-full bg-black text-holo-text font-mono overflow-hidden relative hologram-flicker" 
            onPointerDownCapture={handleGlobalPointerDown}
        >
            {/* Scanline Overlay */}
            <div className="absolute inset-0 scanline-overlay z-[50] pointer-events-none" />
            
            {/* Grid Background overlay for texture */}
            <div className="absolute inset-0 bg-[size:60px_60px] bg-grid-pattern opacity-30 pointer-events-none z-0" />
            {/* Vignette */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.8)_100%)] pointer-events-none z-0" />

            {/* Dock / Control Bar */}
            <div id="control-bar" className="fixed bottom-8 left-1/2 -translate-x-1/2 flex flex-row items-center gap-6 p-3 bg-holo-panel/80 border border-holo-border backdrop-blur-md shadow-glow z-[3000] rounded-full">
                
                <div className="flex items-center gap-2">
                    <button 
                        onClick={() => setInkMode(false)} 
                        className={`${buttonBaseClasses} rounded-full ${!inkMode ? 'bg-holo-accent text-black border-holo-accent shadow-glow' : 'bg-transparent text-holo-text border-transparent hover:bg-holo-accent/10'}`} 
                        title="CURSOR_MODE"
                    >
                        <MousePointer2 size={ICON_SIZE} />
                    </button>
                    
                    <button 
                        onClick={() => setInkMode(true)} 
                        className={`${buttonBaseClasses} rounded-full ${inkMode ? 'bg-holo-accent text-black border-holo-accent shadow-glow' : 'bg-transparent text-holo-text border-transparent hover:bg-holo-accent/10'}`} 
                        title="INK_MODE"
                    >
                        <PenLine size={ICON_SIZE} />
                    </button>
                </div>
                
                <div className="h-8 w-px bg-holo-border/50" />

                <div className="flex items-center gap-2">
                     <button 
                        onClick={executeInkAction} 
                        disabled={isProcessing || strokes.length === 0} 
                        className={`${buttonBaseClasses} rounded-full ${isProcessing ? 'bg-holo-border cursor-wait' : strokes.length > 0 ? 'bg-holo-success/20 text-holo-success border-holo-success shadow-[0_0_15px_rgba(0,255,157,0.4)]' : 'bg-transparent text-holo-text/30 border-transparent cursor-not-allowed'}`} 
                        title="EXECUTE"
                    >
                        {isProcessing ? <Loader2 size={ICON_SIZE} className="animate-spin" /> : <Play size={ICON_SIZE} fill="currentColor" />}
                    </button>
                    
                    <button 
                        onClick={() => setStrokes([])} 
                        disabled={strokes.length === 0} 
                        className={`${buttonBaseClasses} rounded-full ${strokes.length > 0 ? 'bg-holo-alert/20 text-holo-alert border-holo-alert hover:bg-holo-alert/30 shadow-glow-alert' : 'bg-transparent text-holo-text/30 border-transparent cursor-not-allowed'}`} 
                        title="CLEAR"
                    >
                        <Eraser size={ICON_SIZE} />
                    </button>
                </div>
            </div>

            {/* Desktop Area */}
            <div 
                className="h-full w-full relative overflow-hidden bg-black transition-all duration-1000"
                style={{
                    backgroundImage: wallpaperUrl ? `url(${wallpaperUrl})` : 'none',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                }}
            >
                {!wallpaperUrl && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-10 select-none">
                         <Disc size={600} strokeWidth={0.5} className="animate-[spin_20s_linear_infinite] text-holo-accent" />
                         <div className="absolute inset-0 bg-holo-gradient opacity-50" />
                    </div>
                )}

                <div className="h-full w-full" onMouseDown={() => focusWindow(null)}>
                     <HomeScreen items={desktopItems} onLaunch={handleLaunch} />
                </div>

                {openWindows.map(win => {
                    let content = null;
                    if (win.item.type === 'folder') content = <FolderView folder={win.item} />;
                    else if (win.item.appId === 'mail') content = <MailApp emails={emails} />;
                    else if (win.item.appId === 'slides') content = <SlidesApp />;
                    else if (win.item.appId === 'snake') content = <SnakeGame />;
                    else if (win.item.appId === 'notepad') content = (
                        <NotepadApp 
                            initialContent={win.item.notepadInitialContent} 
                            currentFilename={win.item.name}
                            onSave={(name, content) => handleSaveFile(name, content)} 
                        />
                    );
                    else if (win.item.appId === 'explorer') content = (
                        <FileExplorerApp 
                            rootItems={desktopItems} 
                            onLaunch={handleLaunch} 
                            onDeleteItem={deleteItemById} 
                            onCreateFolder={handleCreateFolder} 
                        />
                    );
                    else if (win.item.appId === 'lyra') content = (
                        <LyraTerminal 
                            getUnreadEmails={() => emails.filter(e => e.unread).map(e => ({ from: e.from, subject: e.subject }))}
                            onLaunchApp={(name) => {
                                const item = findItemByName(desktopItems, name);
                                if (item) {
                                    handleLaunch(item);
                                    return true;
                                }
                                return false;
                            }}
                            onCreateNote={handleSaveFile}
                            onGenerateWallpaper={handleGenerateWallpaper}
                        />
                    );
                    else if (win.item.appId === 'darkweb') content = <DarkWebApp />;
                    else if (win.item.appId === 'wallet') content = <WalletApp />;
                    else if (win.item.appId === 'drone') content = <DroneApp />;
                    else if (win.item.appId === 'requisition') content = <RequisitionApp />;
                    else if (win.item.appId === 'builder') content = <AppBuilderApp />;
                    else if (win.item.appId === 'nexusnet') content = <NexusNetApp />;
                    else if (win.item.appId === 'f47ghost') content = <F47GhostApp />;

                    return (
                        <DraggableWindow
                            key={win.id}
                            id={win.id}
                            title={win.item.name}
                            icon={win.item.icon}
                            initialPos={win.pos}
                            initialSize={win.size}
                            zIndex={win.zIndex}
                            isActive={focusedId === win.id}
                            onClose={() => closeWindow(win.id)}
                            onFocus={() => focusWindow(win.id)}
                        >
                            {content}
                        </DraggableWindow>
                    );
                })}

                <InkLayer active={inkMode} strokes={strokes} setStrokes={setStrokes} isProcessing={isProcessing} />

                {toast && (
                    <div className={`toast-card absolute bottom-40 left-1/2 -translate-x-1/2 bg-black/90 border border-holo-accent text-holo-textBright px-8 py-6 shadow-glow-lg z-[9999] animate-in slide-in-from-bottom-10 fade-in duration-200 flex flex-col gap-3 min-w-[450px] max-w-2xl pointer-events-auto backdrop-blur-xl rounded-lg`}>
                        <div className="flex items-center justify-between border-b border-holo-accent/30 pb-2 mb-2">
                            <span className="text-sm text-holo-accent font-bold uppercase tracking-[0.2em] text-glow">{toast.title || 'SYSTEM ALERT'}</span>
                            <span className="text-[10px] text-holo-text font-mono">{new Date().toLocaleTimeString()}</span>
                        </div>
                        <div className="font-mono text-sm leading-relaxed whitespace-pre-wrap text-glow-sm">
                            {toast.message}
                        </div>
                        {/* Holographic Corners */}
                        <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-holo-accent" />
                        <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-holo-accent" />
                        <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-holo-accent" />
                        <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-holo-accent" />
                    </div>
                )}
            </div>
        </div>
    );
};