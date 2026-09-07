/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useEffect, useRef, useState } from 'react';
import { PlaneTakeoff, Gauge, Fuel, Target, Radar, Zap, Settings, AlertTriangle, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, X, ScanEye, Plus, Minus } from 'lucide-react';

export const F47GhostApp: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const [hackStatus, setHackStatus] = useState<'ACTIVE' | 'DETECTED' | 'STANDBY'>('STANDBY');
    const [engineStatus, setEngineStatus] = useState<'ONLINE' | 'WARNING' | 'CRITICAL'>('ONLINE');
    const [targetLocked, setTargetLocked] = useState<string | null>(null);

    // Flight State
    const state = useRef({
        speed: 0, // km/h
        altitude: 1000, // meters
        fuel: 100, // percentage
        throttle: 0, // 0-100%
        pitch: 0, // -90 to +90 degrees
        roll: 0, // -180 to +180 degrees
        yaw: 0, // 0-360 degrees
        verticalSpeed: 0, // m/s
        horizontalSpeed: 0, // km/h
        targets: [] as { id: string, x: number, y: number, z: number, speed: number, heading: number }[],
        inputState: { throttle: 0, pitch: 0, roll: 0, yaw: 0 }, // For controller viz
        cameraPanX: 0,
        cameraPanY: 0,
    });

    const animationFrameId = useRef<number>();
    const lastTimestamp = useRef<number>(0);
    const frameCountRef = useRef(0);

    // Initial targets setup
    useEffect(() => {
        for (let i = 0; i < 10; i++) {
            state.current.targets.push({
                id: `TGT-${i + 1}`,
                x: (Math.random() - 0.5) * 5000, // meters
                y: (Math.random() - 0.5) * 5000,
                z: Math.random() * 2000 + 500, // altitude
                speed: Math.random() * 200 + 100, // km/h
                heading: Math.random() * 360,
            });
        }
    }, []);

    // Physics and rendering loop
    useEffect(() => {
        const keys = { w: false, a: false, s: false, d: false, ArrowUp: false, ArrowDown: false, ArrowLeft: false, ArrowRight: false, Shift: false, Control: false };

        const handleKeyDown = (e: KeyboardEvent) => {
            const key = e.key;
            if (key === 'Shift') keys.Shift = true;
            if (key === 'Control') keys.Control = true;
            if ((keys as any)[key]) (keys as any)[key] = true;
        };

        const handleKeyUp = (e: KeyboardEvent) => {
            const key = e.key;
            if (key === 'Shift') keys.Shift = false;
            if (key === 'Control') keys.Control = false;
            if ((keys as any)[key]) (keys as any)[key] = false;
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);

        const loop = (timestamp: number) => {
            frameCountRef.current++;
            const dt = (timestamp - lastTimestamp.current) / 1000; // seconds
            lastTimestamp.current = timestamp;

            const s = state.current;

            // --- Input Handling ---
            let inputThrottle = 0; // W/S
            let inputPitch = 0;    // ArrowUp/ArrowDown
            let inputRoll = 0;     // A/D
            let inputYaw = 0;      // ArrowLeft/ArrowRight

            if (keys.w) inputThrottle += 1;
            if (keys.s) inputThrottle -= 1;
            if (keys.ArrowUp) inputPitch += 1;
            if (keys.ArrowDown) inputPitch -= 1;
            if (keys.a) inputRoll -= 1;
            if (keys.d) inputRoll += 1;
            if (keys.ArrowLeft) inputYaw -= 1;
            if (keys.ArrowRight) inputYaw += 1;

            // Update Visual Input State (Smoothed)
            s.inputState.throttle += (inputThrottle - s.inputState.throttle) * 0.2;
            s.inputState.pitch += (inputPitch - s.inputState.pitch) * 0.2;
            s.inputState.roll += (inputRoll - s.inputState.roll) * 0.2;
            s.inputState.yaw += (inputYaw - s.inputState.yaw) * 0.2;

            // --- Flight Physics ---
            // Throttle
            s.throttle = Math.max(0, Math.min(100, s.throttle + inputThrottle * 50 * dt)); // Faster throttle response

            // Speed
            const targetSpeed = 200 + s.throttle * 8; // Max speed around 1000 km/h
            s.speed += (targetSpeed - s.speed) * 0.1 * dt * 60; // Smooth speed change

            // Pitch & Roll
            s.pitch += inputPitch * 20 * dt;
            s.roll += inputRoll * 30 * dt;

            // Yaw (only when not heavily rolling or pitching)
            if (Math.abs(s.pitch) < 45 && Math.abs(s.roll) < 90) {
                s.yaw += inputYaw * 10 * dt;
            }

            // Apply limits and damping
            s.pitch *= 0.98; // Damping
            s.roll *= 0.95;
            s.yaw = (s.yaw + 360) % 360; // Keep yaw in 0-360

            // Altitude (simplified: throttle affects vertical speed)
            s.verticalSpeed = (s.throttle / 100) * 50 - 25 + (s.pitch / 90) * 100; // Affects climb/descent
            s.altitude += s.verticalSpeed * dt;
            s.altitude = Math.max(0, s.altitude); // No going below ground

            // Fuel consumption
            s.fuel -= (s.throttle / 100) * 0.5 * dt; // Consume more fuel at higher throttle
            s.fuel = Math.max(0, s.fuel);
            if (s.fuel < 20) setEngineStatus('WARNING');
            if (s.fuel < 5) setEngineStatus('CRITICAL');
            if (s.fuel <= 0) {
                s.throttle = 0;
                s.speed *= 0.9;
                setEngineStatus('CRITICAL');
            }

            // --- Targets Movement ---
            s.targets.forEach(t => {
                const speedMs = t.speed / 3.6; // Convert km/h to m/s
                t.x += Math.cos(t.heading * Math.PI / 180) * speedMs * dt;
                t.y += Math.sin(t.heading * Math.PI / 180) * speedMs * dt;
                if (Math.random() < 0.05) t.heading = (t.heading + (Math.random() - 0.5) * 60) % 360;
                t.z += (Math.random() - 0.5) * 50 * dt; // Slight altitude fluctuation
                t.z = Math.max(100, Math.min(3000, t.z)); // Keep targets in reasonable altitude range
            });

            // Update Hack Status (randomly for simulation)
            if (hackStatus === 'STANDBY' && Math.random() < 0.001) setHackStatus('ACTIVE');
            if (hackStatus === 'ACTIVE' && Math.random() < 0.0005) setHackStatus('DETECTED');
            if (hackStatus === 'DETECTED' && Math.random() < 0.0001) setHackStatus('STANDBY');


            // --- Rendering ---
            const canvas = canvasRef.current;
            const ctx = canvas?.getContext('2d');
            if (!canvas || !ctx) return;

            const width = canvas.width;
            const height = canvas.height;

            ctx.clearRect(0, 0, width, height);

            // Background (simple grid for tactical feel)
            ctx.strokeStyle = 'rgba(0, 243, 255, 0.05)';
            ctx.lineWidth = 1;
            for (let i = 0; i < width; i += 50) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, height); ctx.stroke(); }
            for (let i = 0; i < height; i += 50) { ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(width, i); ctx.stroke(); }

            // Dynamic scanlines/flicker
            if (Math.random() < 0.05) {
                ctx.fillStyle = `rgba(0, 243, 255, ${Math.random() * 0.1})`;
                ctx.fillRect(0, Math.random() * height, width, Math.random() * 5);
            }

            // --- Draw Radar ---
            // Explicitly define radar position (top-left corner of its drawing area)
            const radarTopLeftX = width * 0.7 + 10;
            const radarTopLeftY = height * 0.7 - 20;
            drawRadar(ctx, radarTopLeftX, radarTopLeftY, s);

            // --- Draw Artificial Horizon ---
            // Pass the intended center of the artificial horizon display
            drawArtificialHorizon(ctx, width * 0.5, height * 0.5 - 10, s.pitch, s.roll);

            // --- Draw Input Visualizer ---
            // Pass the anchor point (e.g., bottom-right corner of the visualizer area)
            drawInputVisualizer(ctx, width * 0.7, height * 0.8, s.inputState);
            
            animationFrameId.current = requestAnimationFrame(loop);
        };

        animationFrameId.current = requestAnimationFrame(loop);

        return () => {
            if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, [hackStatus, engineStatus]);

    // Handle resize for canvas
    useEffect(() => {
        const resizeCanvas = () => {
            if (containerRef.current && canvasRef.current) {
                canvasRef.current.width = containerRef.current.clientWidth;
                canvasRef.current.height = containerRef.current.clientHeight;
            }
        };
        window.addEventListener('resize', resizeCanvas);
        resizeCanvas(); // Initial resize
        return () => window.removeEventListener('resize', resizeCanvas);
    }, []);

    // --- Drawing Helpers ---

    const drawRadar = (ctx: CanvasRenderingContext2D, x: number, y: number, s: typeof state.current) => {
        const radarSize = 180;
        const centerX = radarSize / 2; // Center relative to (x,y)
        const centerY = radarSize / 2; // Center relative to (x,y)
        const range = 5000; // Max radar range in meters

        ctx.save();
        ctx.translate(x + centerX, y + centerY); // Translate to the center of the radar area

        // Radar background
        ctx.beginPath();
        ctx.arc(0, 0, radarSize / 2, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 30, 0, 0.4)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(0, 255, 0, 0.3)';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Range rings
        for (let i = 0; i < 4; i++) {
            ctx.beginPath();
            ctx.arc(0, 0, (radarSize / 2) * ((i + 1) / 4), 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(0, 255, 0, 0.15)';
            ctx.stroke();
        }

        // Radar sweep (dynamic)
        ctx.save();
        ctx.rotate(frameCountRef.current * 0.05);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, radarSize / 2, 0, Math.PI / 4);
        ctx.closePath();
        const grad = ctx.createLinearGradient(0, 0, radarSize / 2, radarSize / 2);
        grad.addColorStop(0, 'rgba(0, 255, 0, 0.6)');
        grad.addColorStop(1, 'rgba(0, 255, 0, 0)');
        ctx.fillStyle = grad;
        ctx.fill();
        ctx.restore();

        // Targets
        s.targets.forEach(t => {
            const dx = t.x / range * (radarSize / 2);
            const dy = t.y / range * (radarSize / 2);
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < radarSize / 2) {
                ctx.beginPath();
                ctx.arc(dx, dy, 3, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(255, 0, 60, 0.8)'; // Red for hostile
                ctx.shadowColor = 'rgba(255, 0, 60, 0.8)';
                ctx.shadowBlur = 5;
                ctx.fill();
                ctx.shadowBlur = 0;
            }
        });

        // Player marker
        ctx.beginPath();
        ctx.arc(0, 0, 4, 0, Math.PI * 2);
        ctx.fillStyle = 'white';
        ctx.fill();

        ctx.restore(); // Restore from radar center translation
    };

    const drawArtificialHorizon = (ctx: CanvasRenderingContext2D, centerX: number, centerY: number, pitch: number, roll: number) => {
        const gaugeWidth = 200;
        const gaugeHeight = 150;

        ctx.save();
        ctx.translate(centerX, centerY); // Translate to the desired center of the horizon display

        ctx.beginPath();
        ctx.rect(-gaugeWidth / 2, -gaugeHeight / 2, gaugeWidth, gaugeHeight);
        ctx.strokeStyle = 'rgba(0, 243, 255, 0.3)';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.clip(); // Clip everything outside the horizon window

        // Rotate for roll
        ctx.rotate(roll * Math.PI / 180);

        // Horizon line (y-offset due to pitch, relative to center)
        const horizonLineY = (pitch / 90) * (gaugeHeight / 2); // Relative to the *current* translated center (0,0)

        // Draw sky above horizonLineY
        ctx.fillStyle = 'rgba(0, 100, 200, 0.6)'; // Sky
        ctx.fillRect(-gaugeWidth / 2, -gaugeHeight / 2, gaugeWidth, gaugeHeight / 2 + horizonLineY);
        
        // Draw ground below horizonLineY
        ctx.fillStyle = 'rgba(150, 75, 0, 0.6)'; // Ground
        ctx.fillRect(-gaugeWidth / 2, horizonLineY, gaugeWidth, gaugeHeight / 2 - horizonLineY);

        // Center line (plane indicator) - always at the center of the viewport relative to the plane
        ctx.beginPath();
        ctx.moveTo(-20, horizonLineY); // Line left of center
        ctx.lineTo(-5, horizonLineY);
        ctx.moveTo(5, horizonLineY);   // Line right of center
        ctx.lineTo(20, horizonLineY);
        ctx.moveTo(0, horizonLineY - 10); // Vertical stabilizer
        ctx.lineTo(0, horizonLineY + 10);
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.restore();
    };

    const drawInputVisualizer = (ctx: CanvasRenderingContext2D, anchorX: number, anchorY: number, input: typeof state.current.inputState) => {
        const stickSize = 60; // Size of the square for the stick
        const stickRange = 25; // How far the inner dot can move

        // Pitch/Roll Stick (Right)
        // Position relative to anchorX and anchorY (bottom-right corner)
        const rightStickCx = anchorX - 20; 
        const rightStickCy = anchorY + 20; 

        ctx.save();
        ctx.translate(rightStickCx, rightStickCy); // Translate to the center of the right stick

        // Background square
        ctx.beginPath();
        ctx.rect(-stickSize / 2, -stickSize / 2, stickSize, stickSize);
        ctx.fillStyle = 'rgba(255, 165, 0, 0.1)';
        ctx.strokeStyle = 'rgba(255, 165, 0, 0.5)';
        ctx.lineWidth = 1;
        ctx.fill();
        ctx.stroke();

        // Inner dot representing input
        const dotX = input.roll * stickRange;
        const dotY = -input.pitch * stickRange; // Invert Y for visual (Up is positive pitch)

        ctx.beginPath();
        ctx.arc(dotX, dotY, 6, 0, Math.PI * 2);
        ctx.fillStyle = 'orange';
        ctx.shadowColor = 'orange';
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.shadowBlur = 0;

        ctx.fillStyle = 'orange';
        ctx.font = '10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText("PITCH/ROLL", 0, stickSize / 2 + 15);

        ctx.restore();

        // Throttle (Left)
        const throttleX = anchorX - 100; // Adjusting relative to anchor
        const throttleY = anchorY + 20; // Adjusting relative to anchor
        const throttleHeight = stickSize;
        const throttleWidth = 20;

        ctx.save();
        ctx.translate(throttleX, throttleY); // Translate to the center of the throttle

        ctx.beginPath();
        ctx.rect(-throttleWidth / 2, -throttleHeight / 2, throttleWidth, throttleHeight);
        ctx.fillStyle = 'rgba(255, 165, 0, 0.1)';
        ctx.strokeStyle = 'rgba(255, 165, 0, 0.5)';
        ctx.lineWidth = 1;
        ctx.fill();
        ctx.stroke();

        // Throttle indicator
        const indicatorY = (1 - (input.throttle + 1) / 2) * throttleHeight - throttleHeight / 2; // Normalize input from -1 to 1 for visual
        ctx.beginPath();
        ctx.rect(-throttleWidth / 2, indicatorY - 5, throttleWidth, 10);
        ctx.fillStyle = 'orange';
        ctx.shadowColor = 'orange';
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.shadowBlur = 0;

        ctx.fillStyle = 'orange';
        ctx.font = '10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText("THROTTLE", 0, stickSize / 2 + 15);

        ctx.restore();
    };


    return (
        <div ref={containerRef} className="h-full w-full bg-black flex flex-col font-mono text-white relative overflow-hidden">
            {/* Background Texture / Glitch Overlay */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,0,60,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,0,60,0.02)_1px,transparent_1px)] bg-[size:20px_20px] opacity-20 pointer-events-none" />

            <canvas ref={canvasRef} className="absolute inset-0 block z-0" />

            {/* Main HUD */}
            <div className="absolute inset-0 p-4 flex flex-col justify-between pointer-events-none z-10">

                {/* Top Left - Hack Status */}
                <div className="flex items-center gap-2 text-red-500 text-sm font-bold uppercase tracking-wider">
                    <Zap size={18} className={`${hackStatus === 'ACTIVE' ? 'animate-pulse' : hackStatus === 'DETECTED' ? 'animate-ping' : ''}`} />
                    <span>HACK STATUS: {hackStatus}</span>
                    {hackStatus === 'DETECTED' && <AlertTriangle size={18} className="animate-bounce" />}
                </div>

                {/* Top Right - Flight Data */}
                <div className="flex flex-col items-end text-sm text-yellow-400">
                    <div className="flex items-center gap-2">
                        <Gauge size={18} /> SPEED: <span className="text-xl font-bold">{state.current.speed.toFixed(0)}</span> KM/H
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                        <ArrowUp size={18} /> ALT: <span className="text-xl font-bold">{state.current.altitude.toFixed(0)}</span> M
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                        <Fuel size={18} /> FUEL: <span className={`text-xl font-bold ${engineStatus === 'CRITICAL' ? 'text-red-500 animate-pulse' : engineStatus === 'WARNING' ? 'text-amber-400' : 'text-green-500'}`}>{state.current.fuel.toFixed(1)}</span>%
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                        <Settings size={18} /> ENGINE: <span className={`text-xl font-bold ${engineStatus === 'CRITICAL' ? 'text-red-500 animate-pulse' : engineStatus === 'WARNING' ? 'text-amber-400' : 'text-green-500'}`}>{engineStatus}</span>
                    </div>
                </div>

                {/* Center Overlay - Camera Feed Placeholder */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[70%] h-[70%] border-2 border-orange-500/50 flex items-center justify-center bg-black/50 text-orange-500/30">
                    <ScanEye size={80} strokeWidth={0.5} className="animate-pulse" />
                    <span className="absolute bottom-4 text-xs uppercase tracking-widest">OPTICAL_SENSOR // DATA_STREAM_LIVE</span>
                </div>

                {/* Bottom Left - Throttle */}
                <div className="flex items-center gap-2 text-yellow-400 text-sm font-bold uppercase">
                    <ArrowUp size={18} /> THR: <span className="text-xl font-bold">{state.current.throttle.toFixed(0)}</span>%
                </div>

                {/* Bottom Right - Target Lock */}
                <div className="flex items-center justify-end gap-2 text-green-500 text-sm font-bold uppercase">
                    {targetLocked ? (
                        <>
                            <Target size={18} className="animate-pulse" />
                            <span>TARGET LOCK: {targetLocked}</span>
                        </>
                    ) : (
                        <span className="text-holo-text/50">NO TARGET</span>
                    )}
                </div>
            </div>
        </div>
    );
};