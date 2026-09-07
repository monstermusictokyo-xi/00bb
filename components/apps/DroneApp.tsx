/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useEffect, useRef, useState } from 'react';
import { Crosshair, Target, Navigation, Battery, Signal, Wind, Thermometer, Eye, Camera, AlertTriangle, MapPin, Locate, Maximize, Disc, Wifi, ZoomIn, ZoomOut, Map as MapIcon, Gamepad2, Zap, Aperture } from 'lucide-react';

export const DroneApp: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    
    const [viewMode, setViewMode] = useState<'EO' | 'IR' | 'NV' | 'STREET'>('STREET'); 
    const [isScanning, setIsScanning] = useState(false);
    const [cameraAccess, setCameraAccess] = useState<boolean | null>(null);
    const [connectionStability, setConnectionStability] = useState(100);
    const [zoomLevel, setZoomLevel] = useState(1);
    
    // Flash / Spotlight State
    const [searchlight, setSearchlight] = useState(false);
    const flashRef = useRef(0); // 0 to 1 intensity
    const [captureStatus, setCaptureStatus] = useState<'IDLE' | 'CAPTURING' | 'SAVED'>('IDLE');
    
    const streetImageRef = useRef<HTMLImageElement | null>(null);
    
    // Flight State
    const state = useRef({
        x: 0,
        y: 0,
        z: 150, 
        vx: 0,
        vy: 0,
        heading: 0,
        pitch: 0,
        roll: 0,
        yawVel: 0,
        battery: 98,
        fov: 80, 
        lockedTargetId: null as string | null,
        targets: [] as {x: number, y: number, type: string, id: string, speed: number, heading: number}[],
        inputState: { leftX: 0, leftY: 0, rightX: 0, rightY: 0 } // For controller viz
    });

    // 3D Model Vertices for Reaper Drone (Simplified)
    const droneModel = [
        // Fuselage
        {x: 0, y: 0, z: 15},   // Nose
        {x: -3, y: -3, z: -10}, // Body Rear BL
        {x: 3, y: -3, z: -10},  // Body Rear BR
        {x: 3, y: 3, z: -10},   // Body Rear TR
        {x: -3, y: 3, z: -10},  // Body Rear TL
        // Wings
        {x: -35, y: 0, z: -2},  // Wing Left Tip
        {x: 35, y: 0, z: -2},   // Wing Right Tip
        // V-Tail
        {x: 0, y: 12, z: -18},  // Tail Top
        {x: -6, y: 8, z: -18},  // Tail Left
        {x: 6, y: 8, z: -18},   // Tail Right
    ];

    // Wireframe Connections (Indices)
    const droneEdges = [
        [0,1], [0,2], [0,3], [0,4], // Nose to rear
        [1,2], [2,3], [3,4], [4,1], // Rear box
        [1,5], [4,5], // Left Wing
        [2,6], [3,6], // Right Wing
        [3,9], [2,9], // Right Tail
        [4,8], [1,8], // Left Tail
    ];

    // Generate random targets on mount
    useEffect(() => {
        for(let i=0; i<25; i++) { 
            state.current.targets.push({
                x: (Math.random() - 0.5) * 5000,
                y: (Math.random() - 0.5) * 5000,
                type: Math.random() > 0.6 ? 'VEHICLE' : 'HOSTILE',
                id: Math.random().toString(36).substring(2, 7).toUpperCase(),
                speed: Math.random() * 6,
                heading: Math.random() * 360
            });
        }

        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.src = "https://images.unsplash.com/photo-1542259681-d2622966430e?q=80&w=2500&auto=format&fit=crop"; 
        img.onload = () => {
            streetImageRef.current = img;
        };

        const interval = setInterval(() => {
            setConnectionStability(prev => Math.max(40, Math.min(100, prev + (Math.random() - 0.5) * 10)));
        }, 1000);
        
        return () => clearInterval(interval);
    }, []);

    // Camera Initialization
    useEffect(() => {
        const startCamera = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ 
                    video: { 
                        width: { ideal: 1280 }, 
                        height: { ideal: 720 },
                        facingMode: "environment"
                    } 
                });
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    videoRef.current.onloadedmetadata = () => {
                        videoRef.current?.play().catch(e => console.error("Play error:", e));
                        setCameraAccess(true);
                    };
                }
            } catch (err) {
                setCameraAccess(false);
            }
        };
        startCamera();

        return () => {
            if (videoRef.current && videoRef.current.srcObject) {
                const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
                tracks.forEach(t => t.stop());
            }
        };
    }, []);

    // Input & Physics handling
    useEffect(() => {
        const keys = { w: false, a: false, s: false, d: false, q: false, e: false, z: false, x: false, ArrowUp: false, ArrowDown: false, Shift: false };
        
        const handleKeyDown = (e: KeyboardEvent) => {
            const key = e.key.toLowerCase();
            if (key === "shift") keys.Shift = true;
            if (key === "arrowup") keys.ArrowUp = true;
            if (key === "arrowdown") keys.ArrowDown = true;
            if ((keys as any)[key] !== undefined) (keys as any)[key] = true;
        };
        
        const handleKeyUp = (e: KeyboardEvent) => {
             const key = e.key.toLowerCase();
             if (key === "shift") keys.Shift = false;
             if (key === "arrowup") keys.ArrowUp = false;
             if (key === "arrowdown") keys.ArrowDown = false;
             if ((keys as any)[key] !== undefined) (keys as any)[key] = false;
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);

        const loop = () => {
            const s = state.current;
            const speedMult = keys.Shift ? 3.0 : 0.8;

            // Zoom Controls
            if (keys.z) s.fov = Math.max(10, s.fov * 0.95); 
            if (keys.x) s.fov = Math.min(120, s.fov * 1.05); 
            
            // Input Mapping for Physics & Controller Viz
            let inputPitch = 0; // W/S - Right Stick Y
            let inputRoll = 0;  // A/D - Right Stick X
            let inputYaw = 0;   // Q/E - Left Stick X
            let inputThrottle = 0; // Up/Down - Left Stick Y

            if (keys.w) inputPitch += 1;
            if (keys.s) inputPitch -= 1;
            if (keys.a) inputRoll -= 1;
            if (keys.d) inputRoll += 1;
            if (keys.q) inputYaw -= 1;
            if (keys.e) inputYaw += 1;
            if (keys.ArrowUp) inputThrottle += 1;
            if (keys.ArrowDown) inputThrottle -= 1;

            // Update Visual Input State (Smoothed)
            s.inputState.rightX += (inputRoll - s.inputState.rightX) * 0.2;
            s.inputState.rightY += (inputPitch - s.inputState.rightY) * 0.2;
            s.inputState.leftX += (inputYaw - s.inputState.leftX) * 0.2;
            s.inputState.leftY += (inputThrottle - s.inputState.leftY) * 0.2;

            // Movement Physics
            const rad = (s.heading - 90) * Math.PI / 180;
            
            // Thrust/Roll Force
            s.vx += (Math.cos(rad) * inputPitch - Math.sin(rad) * inputRoll) * speedMult;
            s.vy += (Math.sin(rad) * inputPitch + Math.cos(rad) * inputRoll) * speedMult;
            
            // Altitude
            s.z = Math.max(50, Math.min(3000, s.z + inputThrottle * 5));

            // Yaw
            s.yawVel += (inputYaw * 1.5 - s.yawVel) * 0.1;
            s.heading += s.yawVel;

            // Drag
            s.vx *= 0.92;
            s.vy *= 0.92;
            
            // Position
            s.x += s.vx;
            s.y += s.vy;
            
            // Flight Dynamics Visuals (Tilt)
            const speed = Math.sqrt(s.vx*s.vx + s.vy*s.vy);
            const moveAngle = Math.atan2(s.vy, s.vx);
            const headingRad = (s.heading - 90) * Math.PI / 180;
            const relAngle = moveAngle - headingRad;
            
            const forwardSpeed = speed * Math.cos(relAngle);
            const strafeSpeed = speed * Math.sin(relAngle);

            s.pitch = forwardSpeed * -1.5;
            s.roll = strafeSpeed * -2.0;
            
            // Update Targets
            s.targets.forEach(t => {
                 t.x += Math.cos(t.heading * Math.PI / 180) * t.speed;
                 t.y += Math.sin(t.heading * Math.PI / 180) * t.speed;
                 if(Math.random() < 0.01) t.heading += (Math.random() - 0.5) * 90;
            });

            if (Math.random() < 0.1) {
                setZoomLevel(Math.round(80 / s.fov * 10) / 10);
            }

            requestAnimationFrame(loop);
        };
        const animId = requestAnimationFrame(loop);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
            cancelAnimationFrame(animId);
        };
    }, [viewMode]);

    const triggerSnapshot = () => {
        if (captureStatus === 'CAPTURING') return;
        flashRef.current = 1.0;
        setCaptureStatus('CAPTURING');
        setTimeout(() => setCaptureStatus('SAVED'), 600);
        setTimeout(() => setCaptureStatus('IDLE'), 2500);
    };

    // Rendering Loop
    useEffect(() => {
        let animId: number;
        let frameCount = 0;

        const draw = () => {
            if (!canvasRef.current || !containerRef.current) return;
            const ctx = canvasRef.current.getContext('2d');
            if (!ctx) return;
            
            frameCount++;
            const width = canvasRef.current.width;
            const height = canvasRef.current.height;
            const s = state.current;

            // Colors
            let hudColor = '#00f3ff';
            let objectColor = '#00ffff';
            let gridColor = 'rgba(0, 51, 51, 0.5)';
            let fallbackBg = '#000000';

            if (viewMode === 'IR') { 
                gridColor = 'rgba(100, 100, 100, 0.3)';
                objectColor = '#ffffff'; 
                hudColor = '#ff3333';
                fallbackBg = '#111111';
            } else if (viewMode === 'NV') { 
                gridColor = 'rgba(0, 50, 0, 0.5)';
                objectColor = '#aaffaa';
                hudColor = '#00ff00';
                fallbackBg = '#001a00';
            } else if (viewMode === 'STREET') {
                hudColor = 'rgba(255, 255, 255, 0.9)';
                objectColor = '#00f3ff';
            }

            // --- 1. DRAW BACKGROUND LAYER ---
            if (viewMode === 'STREET' && streetImageRef.current) {
                const img = streetImageRef.current;
                const pixelsPerDeg = width / s.fov;
                const totalPanoWidth = pixelsPerDeg * 360;
                const scaledWidth = totalPanoWidth; 
                const scaleY = (height / img.height) * (120 / s.fov); 
                
                const normalizedHeading = ((s.heading % 360) + 360) % 360;
                const xOffset = (normalizedHeading / 360) * scaledWidth;
                
                const jitterX = (Math.random() - 0.5) * (speed(s) * 2);
                const jitterY = (Math.random() - 0.5) * (speed(s) * 2);
                const pitchOffset = s.pitch * pixelsPerDeg * 0.1;
                const renderY = (height - (img.height * scaleY)) / 2 + pitchOffset + jitterY;
                const centerShift = width / 2;
                
                ctx.save();
                ctx.beginPath();
                ctx.rect(0, 0, width, height);
                ctx.clip();
                const drawPano = (offset: number) => {
                     ctx.drawImage(img, offset + jitterX, renderY, scaledWidth, img.height * scaleY);
                };
                let drawX = -xOffset + centerShift;
                while (drawX > -scaledWidth) drawX -= scaledWidth;
                while (drawX < width) {
                    drawPano(drawX);
                    drawX += scaledWidth;
                }
                ctx.restore();

            } else if (cameraAccess && videoRef.current && videoRef.current.readyState >= 2) {
                ctx.save();
                if (viewMode === 'IR') ctx.filter = 'grayscale(100%) contrast(1.5) brightness(1.1) invert(1)';
                else if (viewMode === 'NV') ctx.filter = 'sepia(100%) hue-rotate(50deg) saturate(400%) contrast(1.2) brightness(1.2)';
                else ctx.filter = 'saturate(0.8) contrast(1.1)';
                
                const zoom = 80 / s.fov;
                const zw = width / zoom;
                const zh = height / zoom;
                const zx = (width - zw) / 2;
                const zy = (height - zh) / 2;
                ctx.drawImage(videoRef.current, zx, zy, zw, zh, 0, 0, width, height);
                ctx.restore();
            } else {
                ctx.fillStyle = fallbackBg;
                ctx.fillRect(0, 0, width, height);
            }

            // --- 2. WORLD OBJECTS ---
            // (Keeping the logic for brackets/targets concise for this update to focus on the new panels)
            ctx.save();
            let closestDist = Infinity;
            let closestTargetId = null;
            if (viewMode === 'STREET') {
                 const pixelsPerDeg = width / s.fov;
                 const horizonY = height / 2 + s.pitch * pixelsPerDeg * 0.1;
                 s.targets.forEach(target => {
                    const dx = target.x - s.x;
                    const dy = target.y - s.y;
                    const dist = Math.sqrt(dx*dx + dy*dy);
                    if (dist > 3000) return; 
                    const mathAngle = Math.atan2(dy, dx); 
                    let bearing = (mathAngle * 180 / Math.PI) + 90;
                    let relBearing = bearing - s.heading;
                    while (relBearing < -180) relBearing += 360;
                    while (relBearing > 180) relBearing -= 360;
                    if (Math.abs(relBearing) < s.fov / 1.2) {
                        const screenX = width / 2 + relBearing * pixelsPerDeg;
                        const angleDown = Math.atan2(s.z, dist) * 180 / Math.PI;
                        const screenY = horizonY + angleDown * pixelsPerDeg * 1.5;
                        const baseSize = 50;
                        const scale = (300 / Math.max(50, dist)) * (80/s.fov); 
                        const size = baseSize * scale;
                        const screenDistToCenter = Math.sqrt(Math.pow(screenX - width/2, 2) + Math.pow(screenY - height/2, 2));
                        const isLocked = screenDistToCenter < 50; 
                        if (isLocked && screenDistToCenter < closestDist) {
                            closestDist = screenDistToCenter;
                            closestTargetId = target.id;
                        }
                        if (size > 3) {
                            ctx.lineWidth = isLocked ? 2 : 1;
                            const tColor = isLocked ? '#ff003c' : objectColor;
                            drawBracket(ctx, screenX, screenY, size, size, tColor);
                            if (isLocked) {
                                ctx.beginPath();
                                ctx.moveTo(width/2, height/2);
                                ctx.lineTo(screenX, screenY);
                                ctx.strokeStyle = 'rgba(255, 0, 60, 0.4)';
                                ctx.setLineDash([2, 2]);
                                ctx.stroke();
                                ctx.setLineDash([]);
                            }
                        }
                    }
                });
                state.current.lockedTargetId = closestTargetId;
            }
            ctx.restore();

            // --- 3. HUD OVERLAYS ---
            
            // Random Glitch
            if (Math.random() < 0.05 + (100 - connectionStability)/500) {
                const y = Math.random() * height;
                const h = Math.random() * 20 + 2;
                const shift = (Math.random() - 0.5) * 20;
                ctx.drawImage(canvasRef.current, shift, 0, width, height, 0, 0, width, height); 
            }

            // Vignette
            const grad = ctx.createRadialGradient(width/2, height/2, height/2, width/2, height/2, height);
            grad.addColorStop(0, 'rgba(0,0,0,0)');
            grad.addColorStop(1, 'rgba(0,0,0,0.8)');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, width, height);
            
            // Searchlight (Spotlight) Effect
            if (searchlight) {
                const slGrad = ctx.createRadialGradient(width/2, height/2, 10, width/2, height/2, height * 0.6);
                slGrad.addColorStop(0, 'rgba(255, 255, 200, 0.3)'); // Bright center
                slGrad.addColorStop(0.3, 'rgba(255, 255, 200, 0.05)');
                slGrad.addColorStop(1, 'rgba(0,0,0,0.85)'); // Dark edges
                
                ctx.globalCompositeOperation = 'hard-light';
                ctx.fillStyle = slGrad;
                ctx.fillRect(0, 0, width, height);
                ctx.globalCompositeOperation = 'source-over';
            }

            drawCompass(ctx, width, s.heading, hudColor);
            drawReticle(ctx, width, height, isScanning, hudColor, state.current.lockedTargetId !== null);
            drawMinimap(ctx, width, height, s, hudColor, objectColor);
            
            draw3DDronePanel(ctx, 20, 80, s, hudColor);
            drawControllerOverlay(ctx, width, height, s.inputState, hudColor);

            // Flash Overlay
            if (flashRef.current > 0.01) {
                ctx.fillStyle = `rgba(255, 255, 255, ${flashRef.current})`;
                ctx.fillRect(0, 0, width, height);
                flashRef.current *= 0.85; // Fast decay
            }

            // Capture Status Text
            if (captureStatus === 'CAPTURING' || captureStatus === 'SAVED') {
                 ctx.save();
                 ctx.fillStyle = captureStatus === 'CAPTURING' ? '#ffffff' : '#00ff00';
                 ctx.font = 'bold 24px monospace';
                 ctx.textAlign = 'center';
                 ctx.shadowColor = captureStatus === 'CAPTURING' ? '#ffffff' : '#00ff00';
                 ctx.shadowBlur = 10;
                 ctx.fillText(captureStatus === 'CAPTURING' ? 'CAPTURING...' : 'INTEL ACQUIRED', width/2, height/2 - 50);
                 ctx.restore();
            }

            // Scanlines
            ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
            for(let y = 0; y < height; y += 3) {
                ctx.fillRect(0, y, width, 1);
            }

            animId = requestAnimationFrame(draw);
        };
        draw();

        return () => cancelAnimationFrame(animId);
    }, [viewMode, isScanning, cameraAccess, connectionStability, searchlight, captureStatus]);

    // --- HELPER FUNCTIONS ---

    const speed = (s: any) => Math.sqrt(s.vx*s.vx + s.vy*s.vy);
    
    // 3D Projection Helper
    const project3D = (x: number, y: number, z: number, s: any, scale: number, centerX: number, centerY: number) => {
        // Rotate Order: Yaw -> Pitch -> Roll
        const radYaw = frameCountRef.current * 0.01; // Auto rotate model for visibility
        const radPitch = -s.pitch * 0.05; // Invert pitch visual
        const radRoll = -s.roll * 0.05;

        // Apply Yaw (Spin)
        let x1 = x * Math.cos(radYaw) - z * Math.sin(radYaw);
        let z1 = x * Math.sin(radYaw) + z * Math.cos(radYaw);
        let y1 = y;

        // Apply Pitch
        let y2 = y1 * Math.cos(radPitch) - z1 * Math.sin(radPitch);
        let z2 = y1 * Math.sin(radPitch) + z1 * Math.cos(radPitch);
        let x2 = x1;

        // Apply Roll
        let x3 = x2 * Math.cos(radRoll) - y2 * Math.sin(radRoll);
        let y3 = x2 * Math.sin(radRoll) + y2 * Math.cos(radRoll);
        let z3 = z2;

        // Perspective Projection
        const fov = 300;
        const projectedScale = fov / (fov + z3 + 100); 
        
        return {
            x: centerX + x3 * scale * projectedScale,
            y: centerY + y3 * scale * projectedScale
        };
    };

    const frameCountRef = useRef(0);

    const draw3DDronePanel = (ctx: CanvasRenderingContext2D, x: number, y: number, s: any, color: string) => {
        frameCountRef.current++;
        const panelW = 160;
        const panelH = 120;
        
        // Panel BG
        ctx.save();
        ctx.fillStyle = 'rgba(0, 20, 30, 0.8)';
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, panelW, panelH);
        ctx.fillRect(x, y, panelW, panelH);

        // Header
        ctx.fillStyle = color;
        ctx.font = '10px monospace';
        ctx.fillText("UAV STATUS: REAPER-1", x + 10, y + 15);
        
        const cx = x + panelW / 2;
        const cy = y + panelH / 2 + 5;
        const scale = 2.5;

        // Draw Wireframe
        ctx.beginPath();
        ctx.strokeStyle = '#00ff00'; // Green wireframe
        ctx.lineWidth = 1;

        const vertices2D = droneModel.map(v => project3D(v.x, v.y, v.z, s, scale, cx, cy));

        droneEdges.forEach(edge => {
            const v1 = vertices2D[edge[0]];
            const v2 = vertices2D[edge[1]];
            ctx.moveTo(v1.x, v1.y);
            ctx.lineTo(v2.x, v2.y);
        });
        ctx.stroke();

        // Propeller (Simple Circle)
        const rear = vertices2D[1]; // Approximately rear
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(0, 255, 0, 0.3)';
        ctx.arc(rear.x, rear.y, 8, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.restore();
    };

    const drawControllerOverlay = (ctx: CanvasRenderingContext2D, width: number, height: number, input: any, color: string) => {
        const stickSize = 50;
        const margin = 80;
        const stickRange = 25;

        // Left Stick (Throttle / Yaw)
        const leftCx = margin;
        const leftCy = height - margin;
        
        // Right Stick (Pitch / Roll)
        const rightCx = width - margin;
        const rightCy = height - margin;

        const drawStick = (cx: number, cy: number, dx: number, dy: number, label: string) => {
            ctx.save();
            
            // Base Gimbal
            ctx.beginPath();
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
            ctx.lineWidth = 2;
            ctx.arc(cx, cy, stickSize, 0, Math.PI * 2);
            ctx.stroke();
            
            // Crosshair Base
            ctx.beginPath();
            ctx.moveTo(cx - 5, cy); ctx.lineTo(cx + 5, cy);
            ctx.moveTo(cx, cy - 5); ctx.lineTo(cx, cy + 5);
            ctx.stroke();

            // Stick Position
            const sx = cx + dx * stickRange;
            const sy = cy - dy * stickRange; // Invert Y for visual Up = Positive

            // Stick Shaft
            ctx.beginPath();
            ctx.strokeStyle = color;
            ctx.lineWidth = 2;
            ctx.moveTo(cx, cy);
            ctx.lineTo(sx, sy);
            ctx.stroke();

            // Thumb Pad
            ctx.beginPath();
            ctx.fillStyle = color;
            ctx.shadowColor = color;
            ctx.shadowBlur = 10;
            ctx.arc(sx, sy, 8, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;

            // Label
            ctx.fillStyle = color;
            ctx.textAlign = 'center';
            ctx.font = '10px monospace';
            ctx.fillText(label, cx, cy + stickSize + 15);

            ctx.restore();
        };

        drawStick(leftCx, leftCy, input.leftX, input.leftY, "THR / YAW");
        drawStick(rightCx, rightCy, input.rightX, input.rightY, "PIT / ROLL");
    };

    const drawBracket = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string = '#00ffff') => {
        const halfW = w / 2;
        const halfH = h / 2;
        const c = w / 4; 
        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.moveTo(x - halfW, y - halfH + c); ctx.lineTo(x - halfW, y - halfH); ctx.lineTo(x - halfW + c, y - halfH);
        ctx.moveTo(x + halfW - c, y - halfH); ctx.lineTo(x + halfW, y - halfH); ctx.lineTo(x + halfW, y - halfH + c);
        ctx.moveTo(x + halfW, y + halfH - c); ctx.lineTo(x + halfW, y + halfH); ctx.lineTo(x + halfW - c, y + halfH);
        ctx.moveTo(x - halfW + c, y + halfH); ctx.lineTo(x - halfW, y + halfH); ctx.lineTo(x - halfW, y + halfH - c);
        ctx.stroke();
    };

    const drawCompass = (ctx: CanvasRenderingContext2D, width: number, heading: number, color: string) => {
        const cw = 300;
        const cx = width / 2;
        ctx.save();
        ctx.beginPath();
        ctx.rect(cx - cw/2, 0, cw, 60);
        ctx.clip();
        const grad = ctx.createLinearGradient(cx - cw/2, 0, cx + cw/2, 0);
        grad.addColorStop(0, 'rgba(0,0,0,0)');
        grad.addColorStop(0.2, 'rgba(0,0,0,0.5)');
        grad.addColorStop(0.8, 'rgba(0,0,0,0.5)');
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = grad;
        ctx.fillRect(cx - cw/2, 20, cw, 30);
        ctx.strokeStyle = color;
        ctx.fillStyle = color;
        ctx.textAlign = 'center';
        ctx.font = '12px monospace';
        const pixelsPerDeg = 2.0;
        const startDeg = heading - (cw / 2 / pixelsPerDeg);
        const endDeg = heading + (cw / 2 / pixelsPerDeg);
        for (let d = Math.floor(startDeg / 10) * 10; d <= endDeg; d += 10) {
            const x = cx + (d - heading) * pixelsPerDeg;
            const normD = ((d % 360) + 360) % 360;
            let label = normD.toString();
            if (normD === 0) label = 'N';
            if (normD === 90) label = 'E';
            if (normD === 180) label = 'S';
            if (normD === 270) label = 'W';
            const isCard = ['N','E','S','W'].includes(label);
            const h = isCard ? 10 : 5;
            ctx.beginPath();
            ctx.moveTo(x, 50); ctx.lineTo(x, 50 - h);
            ctx.stroke();
            if (isCard || normD % 30 === 0) {
                ctx.fillText(label, x, 35);
            }
        }
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.moveTo(cx, 55); ctx.lineTo(cx - 5, 60); ctx.lineTo(cx + 5, 60);
        ctx.fill();
        ctx.restore();
    };

    const drawReticle = (ctx: CanvasRenderingContext2D, width: number, height: number, isScanning: boolean, color: string, locked: boolean) => {
        const cx = width/2;
        const cy = height/2;
        ctx.strokeStyle = locked ? '#ff003c' : (isScanning ? '#ff0000' : color);
        ctx.lineWidth = locked ? 2 : 1.5;
        ctx.beginPath();
        if (locked) {
             ctx.moveTo(cx, cy - 20); ctx.lineTo(cx + 20, cy);
             ctx.lineTo(cx, cy + 20); ctx.lineTo(cx - 20, cy);
             ctx.lineTo(cx, cy - 20);
             ctx.fillStyle = 'rgba(255, 0, 60, 0.1)';
             ctx.fill();
        } else {
            const gap = isScanning ? 2 : 10;
            const len = 20;
            ctx.moveTo(cx - gap, cy); ctx.lineTo(cx - gap - len, cy);
            ctx.moveTo(cx + gap, cy); ctx.lineTo(cx + gap + len, cy);
            ctx.moveTo(cx, cy - gap); ctx.lineTo(cx, cy - gap - len);
            ctx.moveTo(cx, cy + gap); ctx.lineTo(cx, cy + gap + len);
        }
        ctx.stroke();
    };

    const drawMinimap = (ctx: CanvasRenderingContext2D, width: number, height: number, s: any, hudColor: string, objColor: string) => {
        const mapSize = 120;
        const margin = 20;
        const mx = margin;
        const my = height - mapSize - margin;
        ctx.save();
        ctx.fillStyle = 'rgba(0, 20, 30, 0.8)';
        ctx.strokeStyle = hudColor;
        ctx.lineWidth = 1;
        ctx.strokeRect(mx, my, mapSize, mapSize);
        ctx.fillRect(mx, my, mapSize, mapSize);
        ctx.save();
        ctx.beginPath();
        ctx.rect(mx, my, mapSize, mapSize);
        ctx.clip();
        const cx = mx + mapSize / 2;
        const cy = my + mapSize / 2;
        const range = 2000; 
        s.targets.forEach((t: any) => {
            const dx = t.x - s.x;
            const dy = t.y - s.y;
            const angle = Math.atan2(dy, dx);
            const dist = Math.sqrt(dx*dx + dy*dy);
            if (dist > range) return;
            const relAngle = angle - ((s.heading - 90) * Math.PI / 180);
            const mapX = cx + Math.cos(relAngle) * (dist / range) * (mapSize / 2);
            const mapY = cy + Math.sin(relAngle) * (dist / range) * (mapSize / 2);
            ctx.fillStyle = t.id === s.lockedTargetId ? '#ff003c' : objColor;
            ctx.beginPath();
            ctx.arc(mapX, mapY, 2, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.moveTo(cx, cy - 4);
        ctx.lineTo(cx + 3, cy + 3);
        ctx.lineTo(cx - 3, cy + 3);
        ctx.fill();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        const fovRad = (s.fov / 2) * Math.PI / 180;
        ctx.arc(cx, cy, mapSize/2, -Math.PI/2 - fovRad, -Math.PI/2 + fovRad);
        ctx.lineTo(cx, cy);
        ctx.fill();
        ctx.restore();
        ctx.restore();
    };

    useEffect(() => {
        const resize = () => {
            if (containerRef.current && canvasRef.current) {
                canvasRef.current.width = containerRef.current.clientWidth;
                canvasRef.current.height = containerRef.current.clientHeight;
            }
        };
        window.addEventListener('resize', resize);
        resize();
        return () => window.removeEventListener('resize', resize);
    }, []);

    return (
        <div className="h-full w-full bg-black flex flex-col relative" ref={containerRef}>
            <video ref={videoRef} className="hidden" playsInline muted />
            <canvas ref={canvasRef} className="absolute inset-0 block z-0" />
            
            {/* Controls */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col gap-4 items-center z-20">
                 {/* Mode Switcher */}
                 <div className="flex bg-black/80 border border-holo-border/30 rounded-full p-1 backdrop-blur-sm shadow-glow-sm">
                     {['EO', 'IR', 'NV', 'STREET'].map((mode) => (
                         <button 
                            key={mode}
                            onClick={() => setViewMode(mode as any)}
                            className={`px-4 py-1.5 rounded-full text-[10px] font-bold font-mono transition-all ${viewMode === mode ? 'bg-holo-accent text-black shadow-glow' : 'text-holo-text/70 hover:text-white hover:bg-white/10'}`}
                         >
                             {mode === 'STREET' ? 'LIVE FEED' : mode}
                         </button>
                     ))}
                 </div>
                 
                 {/* Zoom Indicator */}
                 <div className="flex items-center gap-2 text-[10px] font-mono text-holo-accent bg-black/50 px-3 py-1 rounded-full border border-holo-accent/30">
                     <ZoomIn size={12} />
                     <span>ZOOM x{zoomLevel.toFixed(1)}</span>
                     <span className="text-holo-text/40 ml-1">(Z/X)</span>
                 </div>
            </div>

            <div className="absolute bottom-6 right-6 z-20 flex flex-col gap-2">
                 <button 
                    className={`w-12 h-12 rounded-full border flex items-center justify-center transition-all ${searchlight ? 'border-yellow-400 bg-yellow-400/20 text-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.5)]' : 'border-holo-accent bg-holo-accent/10 text-holo-accent hover:bg-holo-accent/20'}`}
                    onClick={() => setSearchlight(!searchlight)}
                    title="Toggle Searchlight"
                 >
                     <Zap size={20} />
                 </button>

                 <button 
                    className={`w-12 h-12 rounded-full border flex items-center justify-center transition-all ${captureStatus === 'CAPTURING' ? 'bg-white text-black border-white' : 'border-holo-accent bg-holo-accent/10 text-holo-accent hover:bg-holo-accent hover:text-black'}`}
                    onClick={triggerSnapshot}
                    title="Capture Intel (Flash)"
                 >
                     <Aperture size={20} className={captureStatus === 'CAPTURING' ? 'animate-spin' : ''} />
                 </button>

                 <button 
                    className={`w-14 h-14 rounded-full border flex items-center justify-center transition-all ${isScanning ? 'border-red-500 bg-red-500/20 text-red-500 animate-pulse' : 'border-holo-accent bg-holo-accent/10 text-holo-accent hover:bg-holo-accent hover:text-black'}`}
                    onMouseDown={() => setIsScanning(true)}
                    onMouseUp={() => setIsScanning(false)}
                    onMouseLeave={() => setIsScanning(false)}
                    title="Target Lock"
                 >
                     <Crosshair size={24} />
                 </button>
            </div>

            {/* Controller Help Tooltip */}
            <div className="absolute bottom-24 right-20 bg-black/50 border border-holo-border/30 p-2 rounded text-[10px] text-holo-text/60 font-mono pointer-events-none">
                <div>W/S: PITCH</div>
                <div>A/D: ROLL</div>
                <div>Q/E: YAW</div>
                <div>UP/DWN: THR</div>
            </div>
            
            {/* Connection Status Icon Overlay */}
            <div className="absolute top-4 right-4 flex flex-col items-end gap-1 z-10 pointer-events-none">
                <div className={`flex items-center gap-1 text-[10px] font-mono font-bold ${connectionStability > 70 ? 'text-holo-success' : 'text-holo-alert animate-pulse'}`}>
                    <Wifi size={14} />
                    {connectionStability > 80 ? 'LINK STABLE' : 'SIGNAL WEAK'}
                </div>
                <div className="text-[9px] text-holo-text/50 font-mono">
                    latency: {Math.floor(20 + (100-connectionStability)*2)}ms
                </div>
            </div>

            {/* Decorative Corners */}
            <div className="absolute top-4 left-4 w-12 h-12 border-t-2 border-l-2 border-white/30 pointer-events-none" />
            <div className="absolute top-4 right-4 w-12 h-12 border-t-2 border-r-2 border-white/30 pointer-events-none" />
            <div className="absolute bottom-4 left-4 w-12 h-12 border-b-2 border-l-2 border-white/30 pointer-events-none" />
            <div className="absolute bottom-4 right-4 w-12 h-12 border-b-2 border-r-2 border-white/30 pointer-events-none" />
        </div>
    );
};