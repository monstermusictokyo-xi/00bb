/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useEffect, useRef, useState } from 'react';
import { Mic, MicOff, Activity, Power, ShieldAlert } from 'lucide-react';
import { GoogleGenAI, LiveServerMessage, Modality, LiveSession, Type } from '@google/genai';

export interface LyraTerminalProps {
    getUnreadEmails: () => { from: string; subject: string }[];
    onLaunchApp: (name: string) => boolean;
    onCreateNote: (filename: string, content: string) => void;
    onGenerateWallpaper: (description: string) => void;
}

// --- Audio Helper Functions ---

function decode(base64: string): Uint8Array {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
}

async function decodeAudioData(
    data: Uint8Array,
    ctx: AudioContext,
    sampleRate: number,
    numChannels: number,
): Promise<AudioBuffer> {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

    for (let channel = 0; channel < numChannels; channel++) {
        const channelData = buffer.getChannelData(channel);
        for (let i = 0; i < frameCount; i++) {
            channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
        }
    }
    return buffer;
}

export const LyraTerminal: React.FC<LyraTerminalProps> = ({
    getUnreadEmails,
    onLaunchApp,
    onCreateNote,
    onGenerateWallpaper
}) => {
    const [isActive, setIsActive] = useState(false);
    const [status, setStatus] = useState<string>('OFFLINE');
    const [logs, setLogs] = useState<string[]>(['> INITIALIZING LYRA X.I. PROTOCOL...', '> WAITING FOR USER INPUT...']);
    const [isMicMuted, setIsMicMuted] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    
    // Audio Refs
    const inputContextRef = useRef<AudioContext | null>(null);
    const outputContextRef = useRef<AudioContext | null>(null);
    const inputSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const processorRef = useRef<ScriptProcessorNode | null>(null);
    const outputNodeRef = useRef<GainNode | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const nextStartTimeRef = useRef<number>(0);
    const audioSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
    const sessionRef = useRef<Promise<LiveSession> | null>(null);

    const addLog = (msg: string) => {
        setLogs(prev => [...prev.slice(-4), `> ${msg}`]);
    };

    const cleanupAudio = () => {
        if (processorRef.current) {
            processorRef.current.disconnect();
            processorRef.current.onaudioprocess = null;
            processorRef.current = null;
        }
        if (inputSourceRef.current) {
            inputSourceRef.current.disconnect();
            inputSourceRef.current = null;
        }
        if (inputContextRef.current) {
            inputContextRef.current.close();
            inputContextRef.current = null;
        }
        if (outputContextRef.current) {
            outputContextRef.current.close();
            outputContextRef.current = null;
        }
        if (analyserRef.current) {
            analyserRef.current.disconnect();
            analyserRef.current = null;
        }
        
        audioSourcesRef.current.forEach(source => {
             try { source.stop(); } catch(e) {}
        });
        audioSourcesRef.current.clear();
        
        sessionRef.current = null; 
    };

    const tools = [
        {
            functionDeclarations: [
                {
                    name: 'get_unread_emails',
                    description: 'Get a list of unread emails with sender and subject.',
                },
                {
                    name: 'launch_application',
                    description: 'Launch an application or open a folder by name.',
                    parameters: {
                        type: Type.OBJECT,
                        properties: {
                            appName: { type: Type.STRING, description: 'The name of the app or folder to open.' },
                        },
                        required: ['appName'],
                    },
                },
                {
                    name: 'create_log_entry',
                    description: 'Create a new text file/log entry.',
                    parameters: {
                        type: Type.OBJECT,
                        properties: {
                            filename: { type: Type.STRING, description: 'The filename (e.g., log.txt).' },
                            content: { type: Type.STRING, description: 'The content of the note.' },
                        },
                        required: ['filename', 'content'],
                    },
                },
                {
                    name: 'generate_environment',
                    description: 'Generate a new holographic wallpaper/environment based on a description.',
                    parameters: {
                        type: Type.OBJECT,
                        properties: {
                            description: { type: Type.STRING, description: "Visual description of the environment." },
                        },
                        required: ['description'],
                    },
                },
            ],
        },
    ];

    const startSession = async () => {
        if (isActive) return;
        setError(null);
        
        try {
            setStatus('CONNECTING...');
            addLog('ESTABLISHING SECURE UPLINK...');

            // Request Microphone Permission
            let stream: MediaStream;
            try {
                if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                    throw new Error("Media Devices API not available (Secure Context required)");
                }
                stream = await navigator.mediaDevices.getUserMedia({ 
                    audio: {
                        channelCount: 1,
                        echoCancellation: true,
                        noiseSuppression: true,
                        autoGainControl: true
                    }
                });
            } catch (err) {
                console.error("Microphone permission denied:", err);
                setError("ACCESS DENIED: Microphone permission required.");
                setStatus('BLOCKED');
                addLog('ERROR: MIC ACCESS DENIED');
                return;
            }
            
            setIsActive(true);

            // Setup Audio Contexts
            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
            const inputCtx = new AudioContextClass({ sampleRate: 16000 });
            const outputCtx = new AudioContextClass({ sampleRate: 24000 });
            
            inputContextRef.current = inputCtx;
            outputContextRef.current = outputCtx;

            const inputNode = inputCtx.createMediaStreamSource(stream);
            inputSourceRef.current = inputNode;
            
            const outputGain = outputCtx.createGain();
            outputNodeRef.current = outputGain;
            outputGain.connect(outputCtx.destination);

            // Analyser for visualizer
            const analyser = outputCtx.createAnalyser();
            analyser.fftSize = 256;
            outputGain.connect(analyser);
            analyserRef.current = analyser;

            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            
            // Connect to Gemini Live
            const sessionPromise = ai.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-12-2025',
                config: {
                    responseModalities: [Modality.AUDIO],
                    speechConfig: {
                        voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
                    },
                    systemInstruction: "You are Lyra X.I., a high-level artificial intelligence embedded in a classified holographic operating system. You are succinct, tactical, and highly intelligent. Your voice is calm and precise. You assist the user with system tasks and data analysis. You have access to system tools.",
                    tools: tools,
                },
                callbacks: {
                    onopen: () => {
                        setStatus('CONNECTED');
                        addLog('UPLINK ESTABLISHED. LISTENING.');
                        
                        // Start Input Stream
                        const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);
                        processorRef.current = scriptProcessor;
                        
                        scriptProcessor.onaudioprocess = (e) => {
                            if (isMicMuted) return; 
                            
                            const inputData = e.inputBuffer.getChannelData(0);
                            
                            // Convert Float32 to Int16 PCM
                            const l = inputData.length;
                            const int16 = new Int16Array(l);
                            for (let i = 0; i < l; i++) {
                                let s = Math.max(-1, Math.min(1, inputData[i]));
                                int16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
                            }
                            
                            // Manual fast base64 encoding
                            const bytes = new Uint8Array(int16.buffer);
                            let binary = '';
                            const len = bytes.byteLength;
                            for (let i = 0; i < len; i++) {
                                binary += String.fromCharCode(bytes[i]);
                            }
                            const base64Data = btoa(binary);
                            
                            sessionPromise.then(session => {
                                session.sendRealtimeInput({
                                    media: {
                                        mimeType: 'audio/pcm;rate=16000',
                                        data: base64Data
                                    }
                                });
                            });
                        };
                        
                        inputNode.connect(scriptProcessor);
                        scriptProcessor.connect(inputCtx.destination);
                    },
                    onmessage: async (message: LiveServerMessage) => {
                        // Handle Tool Calls
                        if (message.toolCall) {
                            const functionResponses = [];
                            for (const fc of message.toolCall.functionCalls) {
                                let result = "Executed.";
                                const args = fc.args as any;
                                try {
                                    if (fc.name === 'get_unread_emails') {
                                        const emails = getUnreadEmails();
                                        result = JSON.stringify(emails);
                                        addLog(`> CHECKING COMMS... FOUND ${emails.length}`);
                                    } else if (fc.name === 'launch_application') {
                                        const success = onLaunchApp(args.appName);
                                        result = success ? `Launched ${args.appName}` : `App ${args.appName} not found.`;
                                        addLog(`> LAUNCHING: ${args.appName.toUpperCase()}`);
                                    } else if (fc.name === 'create_log_entry') {
                                        onCreateNote(args.filename, args.content);
                                        result = `Created note ${args.filename}`;
                                        addLog(`> CREATING LOG: ${args.filename}`);
                                    } else if (fc.name === 'generate_environment') {
                                        onGenerateWallpaper(args.description);
                                        result = `Initiated generation: ${args.description}`;
                                        addLog(`> RENDERING ENVIRONMENT...`);
                                    }
                                } catch (e) {
                                    result = `Error: ${e}`;
                                }
                                functionResponses.push({
                                    id: fc.id,
                                    name: fc.name,
                                    response: { result: result },
                                });
                            }
                             sessionPromise.then(session => {
                                session.sendToolResponse({ functionResponses });
                            });
                        }

                        // Handle Audio Output
                        const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
                        if (base64Audio) {
                            setStatus('RECEIVING DATA...');
                            
                            if (!outputContextRef.current) return;
                            const ctx = outputContextRef.current;
                            
                            nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
                            
                            try {
                                const audioBuffer = await decodeAudioData(
                                    decode(base64Audio),
                                    ctx,
                                    24000,
                                    1
                                );
                                
                                const source = ctx.createBufferSource();
                                source.buffer = audioBuffer;
                                source.connect(outputNodeRef.current!);
                                source.addEventListener('ended', () => {
                                    audioSourcesRef.current.delete(source);
                                    if (audioSourcesRef.current.size === 0) {
                                        setStatus('CONNECTED');
                                    }
                                });
                                
                                source.start(nextStartTimeRef.current);
                                nextStartTimeRef.current += audioBuffer.duration;
                                audioSourcesRef.current.add(source);
                            } catch (e) {
                                console.error("Audio decode error", e);
                            }
                        }

                        if (message.serverContent?.interrupted) {
                            addLog('INTERRUPTED.');
                            audioSourcesRef.current.forEach(s => {
                                try { s.stop(); } catch(e){}
                            });
                            audioSourcesRef.current.clear();
                            nextStartTimeRef.current = 0;
                        }
                    },
                    onclose: () => {
                        setStatus('DISCONNECTED');
                        addLog('UPLINK TERMINATED.');
                        setIsActive(false);
                    },
                    onerror: (err) => {
                        console.error(err);
                        setStatus('ERROR');
                        setError("Connection lost or refused.");
                        addLog('CONNECTION FAILURE.');
                        setIsActive(false);
                    }
                }
            });
            
            sessionRef.current = sessionPromise;

        } catch (e) {
            console.error("Failed to start session", e);
            setStatus('ERROR');
            setError(e instanceof Error ? e.message : "Unknown initialization error");
            addLog('INITIALIZATION FAILED.');
            setIsActive(false);
            cleanupAudio();
        }
    };

    const stopSession = () => {
        cleanupAudio();
        setIsActive(false);
        setStatus('OFFLINE');
        addLog('SESSION ENDED BY USER.');
    };

    // Visualizer Loop
    useEffect(() => {
        let animId: number;
        
        const draw = () => {
            if (!canvasRef.current) return;
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            if (isActive && analyserRef.current) {
                const bufferLength = analyserRef.current.frequencyBinCount;
                const dataArray = new Uint8Array(bufferLength);
                analyserRef.current.getByteFrequencyData(dataArray); 

                ctx.clearRect(0, 0, canvas.width, canvas.height);
                
                const cx = canvas.width / 2;
                const cy = canvas.height / 2;
                const radius = 30;
                
                ctx.lineWidth = 2;
                ctx.strokeStyle = '#00f3ff';
                
                // Draw circle base
                ctx.beginPath();
                ctx.arc(cx, cy, radius, 0, 2 * Math.PI);
                ctx.stroke();
                
                // Draw reactive lines
                const bars = 30;
                const step = (Math.PI * 2) / bars;
                
                for (let i = 0; i < bars; i++) {
                    const val = dataArray[i * 2] / 255.0; 
                    const h = val * 80;
                    const angle = i * step;
                    
                    const x1 = cx + Math.cos(angle) * radius;
                    const y1 = cy + Math.sin(angle) * radius;
                    const x2 = cx + Math.cos(angle) * (radius + h);
                    const y2 = cy + Math.sin(angle) * (radius + h);
                    
                    ctx.beginPath();
                    ctx.moveTo(x1, y1);
                    ctx.lineTo(x2, y2);
                    ctx.strokeStyle = `rgba(0, 243, 255, ${val + 0.2})`;
                    ctx.stroke();
                }
                
                // Inner pulsating core
                const avg = dataArray.reduce((a,b) => a+b, 0) / bufferLength;
                ctx.beginPath();
                ctx.arc(cx, cy, radius * 0.8 * (0.8 + (avg/255)*0.5), 0, Math.PI*2);
                ctx.fillStyle = `rgba(0, 243, 255, ${0.1 + (avg/255)*0.5})`;
                ctx.fill();
            } else {
                 ctx.clearRect(0, 0, canvas.width, canvas.height);
                 ctx.fillStyle = "rgba(0, 243, 255, 0.1)";
                 ctx.font = "12px JetBrains Mono";
                 ctx.textAlign = "center";
                 ctx.textBaseline = "middle";
                 ctx.fillText("OFFLINE", canvas.width/2, canvas.height/2);
            }

            animId = requestAnimationFrame(draw);
        };
        
        draw();
        return () => cancelAnimationFrame(animId);
    }, [isActive]);

    // Handle resize for canvas
    useEffect(() => {
        if (containerRef.current && canvasRef.current) {
            canvasRef.current.width = containerRef.current.offsetWidth;
            canvasRef.current.height = containerRef.current.offsetHeight;
        }
    }, []);

    useEffect(() => {
        return () => cleanupAudio();
    }, []);

    return (
        <div className="h-full w-full flex flex-col bg-black text-holo-text font-mono p-4 relative overflow-hidden">
            {/* Background decorative grid */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(0,243,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,243,255,0.03)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none" />

            {/* Header Status */}
            <div className="flex justify-between items-center border-b border-holo-border/30 pb-4 mb-4 z-10">
                <div className="flex items-center gap-3">
                    <Activity className={`text-holo-accent ${isActive ? 'animate-pulse' : 'opacity-50'}`} size={20} />
                    <div>
                        <div className="text-holo-accent font-bold text-lg tracking-widest text-glow">LYRA X.I.</div>
                        <div className="text-[10px] text-holo-text/60 uppercase">Voice Interface Module v0.9</div>
                    </div>
                </div>
                <div className={`px-2 py-1 rounded border ${isActive ? 'border-holo-success text-holo-success bg-holo-success/10' : 'border-holo-text/30 text-holo-text/30' } text-xs font-bold uppercase`}>
                    {status}
                </div>
            </div>

            {/* Visualizer Area */}
            <div ref={containerRef} className="flex-1 relative min-h-[150px] border border-holo-border/20 bg-black/50 mb-4 rounded-lg overflow-hidden shadow-[inset_0_0_20px_rgba(0,243,255,0.05)]">
                <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
                
                {/* Corner markers */}
                <div className="absolute top-2 left-2 w-2 h-2 border-t border-l border-holo-accent/50" />
                <div className="absolute top-2 right-2 w-2 h-2 border-t border-r border-holo-accent/50" />
                <div className="absolute bottom-2 left-2 w-2 h-2 border-b border-l border-holo-accent/50" />
                <div className="absolute bottom-2 right-2 w-2 h-2 border-b border-r border-holo-accent/50" />
                
                {error && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/80 p-4 text-center">
                        <div className="flex flex-col items-center gap-2">
                             <ShieldAlert size={32} className="text-holo-alert animate-pulse" />
                             <div className="text-holo-alert font-bold text-xs tracking-widest uppercase">{error}</div>
                             <button 
                                onClick={() => setError(null)}
                                className="mt-2 px-3 py-1 border border-holo-border/30 text-[10px] hover:bg-holo-accent/10"
                             >
                                ACKNOWLEDGE
                             </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Logs / Transcript placeholder */}
            <div className="h-24 border-t border-holo-border/20 pt-2 mb-4 font-mono text-[10px] text-holo-text/70 overflow-y-auto flex flex-col justify-end">
                {logs.map((log, i) => (
                    <div key={i} className="opacity-80">{log}</div>
                ))}
            </div>

            {/* Controls */}
            <div className="flex justify-center gap-6 z-10">
                {!isActive ? (
                    <button 
                        onClick={startSession}
                        className="group flex flex-col items-center gap-2 text-holo-text/70 hover:text-holo-accent transition-colors"
                    >
                        <div className="w-14 h-14 rounded-full border border-holo-accent/50 flex items-center justify-center group-hover:bg-holo-accent/10 group-hover:shadow-glow transition-all">
                            <Power size={24} />
                        </div>
                        <span className="text-[10px] uppercase tracking-wider">Initialize</span>
                    </button>
                ) : (
                    <>
                        <button 
                            onClick={() => setIsMicMuted(!isMicMuted)}
                            className={`group flex flex-col items-center gap-2 transition-colors ${isMicMuted ? 'text-holo-alert' : 'text-holo-text/70 hover:text-holo-accent'}`}
                        >
                            <div className={`w-14 h-14 rounded-full border flex items-center justify-center transition-all ${isMicMuted ? 'border-holo-alert bg-holo-alert/10' : 'border-holo-accent/50 group-hover:bg-holo-accent/10 group-hover:shadow-glow'}`}>
                                {isMicMuted ? <MicOff size={24} /> : <Mic size={24} />}
                            </div>
                            <span className="text-[10px] uppercase tracking-wider">{isMicMuted ? 'Muted' : 'Mute Mic'}</span>
                        </button>
                        
                        <button 
                            onClick={stopSession}
                            className="group flex flex-col items-center gap-2 text-holo-text/70 hover:text-holo-alert transition-colors"
                        >
                            <div className="w-14 h-14 rounded-full border border-holo-alert/50 flex items-center justify-center group-hover:bg-holo-alert/10 group-hover:shadow-glow-alert transition-all">
                                <Power size={24} />
                            </div>
                            <span className="text-[10px] uppercase tracking-wider">Terminate</span>
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};