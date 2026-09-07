/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useEffect, useRef, useState } from 'react';
import { Play, RefreshCw, Target } from 'lucide-react';

export const SnakeGame: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    
    const [score, setScore] = useState(0);
    const [gameOver, setGameOver] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);

    const state = useRef({
        playerX: 0,
        playerW: 20,
        playerH: 20,
        bullets: [] as { x: number, y: number, w: number, h: number, id: number }[],
        enemies: [] as { x: number, y: number, w: number, h: number, speed: number, id: number }[],
        keys: { left: false, right: false, space: false },
        lastShot: 0,
        lastSpawn: 0,
        gameWidth: 0,
        gameHeight: 0,
        score: 0,
        idCounter: 0
    });

    const animationFrameRef = useRef<number | undefined>(undefined);

    const initGame = () => {
        if (!canvasRef.current) return;
        const { width, height } = canvasRef.current;
        state.current.gameWidth = width;
        state.current.gameHeight = height;
        state.current.playerX = width / 2 - 10;
        state.current.bullets = [];
        state.current.enemies = [];
        state.current.score = 0;
        state.current.keys = { left: false, right: false, space: false };
        setScore(0);
        setGameOver(false);
        setIsPlaying(true);
    };

    useEffect(() => {
        const handleResize = () => {
            if (containerRef.current && canvasRef.current) {
                const { clientWidth, clientHeight } = containerRef.current;
                canvasRef.current.width = clientWidth;
                canvasRef.current.height = clientHeight;
                state.current.gameWidth = clientWidth;
                state.current.gameHeight = clientHeight;
                if (state.current.playerX > clientWidth) {
                    state.current.playerX = clientWidth / 2 - 20;
                }
            }
        };
        
        window.addEventListener('resize', handleResize);
        setTimeout(handleResize, 0);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isPlaying) return;
            switch (e.code) {
                case 'ArrowLeft': state.current.keys.left = true; break;
                case 'ArrowRight': state.current.keys.right = true; break;
                case 'Space': state.current.keys.space = true; break;
            }
        };
        const handleKeyUp = (e: KeyboardEvent) => {
            switch (e.code) {
                case 'ArrowLeft': state.current.keys.left = false; break;
                case 'ArrowRight': state.current.keys.right = false; break;
                case 'Space': state.current.keys.space = false; break;
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, [isPlaying]);

    const gameLoop = (timestamp: number) => {
        if (!isPlaying || gameOver) return;

        const ctx = canvasRef.current?.getContext('2d');
        if (!ctx || !canvasRef.current) return;

        const s = state.current;
        const width = s.gameWidth;
        const height = s.gameHeight;

        // Move
        const speed = 7;
        if (s.keys.left) s.playerX = Math.max(0, s.playerX - speed);
        if (s.keys.right) s.playerX = Math.min(width - s.playerW, s.playerX + speed);

        // Fire
        if (s.keys.space && timestamp - s.lastShot > 200) {
            s.bullets.push({
                x: s.playerX + s.playerW / 2 - 1,
                y: height - s.playerH - 20,
                w: 2,
                h: 12,
                id: s.idCounter++
            });
            s.lastShot = timestamp;
        }

        // Update
        for (let i = s.bullets.length - 1; i >= 0; i--) {
            const b = s.bullets[i];
            b.y -= 15;
            if (b.y < -20) s.bullets.splice(i, 1);
        }

        if (timestamp - s.lastSpawn > 800) { 
            const size = 20 + Math.random() * 10;
            s.enemies.push({
                x: Math.random() * (width - size),
                y: -size,
                w: size,
                h: size,
                speed: 3 + Math.random() * 2,
                id: s.idCounter++
            });
            s.lastSpawn = timestamp;
        }

        for (let i = s.enemies.length - 1; i >= 0; i--) {
            const e = s.enemies[i];
            e.y += e.speed;

            // Collision Player
            const playerRect = { x: s.playerX, y: height - s.playerH - 10, w: s.playerW, h: s.playerH };
            if (
                e.x < playerRect.x + playerRect.w &&
                e.x + e.w > playerRect.x &&
                e.y < playerRect.y + playerRect.h &&
                e.y + e.h > playerRect.y
            ) {
                setGameOver(true);
                setIsPlaying(false);
                return; 
            }

            if (e.y > height) s.enemies.splice(i, 1);
        }

        for (let i = s.bullets.length - 1; i >= 0; i--) {
            let bulletHit = false;
            for (let j = s.enemies.length - 1; j >= 0; j--) {
                const b = s.bullets[i];
                const e = s.enemies[j];
                if (
                    b.x < e.x + e.w &&
                    b.x + b.w > e.x &&
                    b.y < e.y + e.h &&
                    b.y + b.h > e.y
                ) {
                    s.enemies.splice(j, 1);
                    bulletHit = true;
                    s.score += 100;
                    setScore(s.score);
                    break;
                }
            }
            if (bulletHit) s.bullets.splice(i, 1);
        }

        // DRAW
        ctx.clearRect(0, 0, width, height);

        // Grid Lines (Radar effect)
        ctx.strokeStyle = 'rgba(0, 243, 255, 0.15)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        for(let x=0; x<width; x+=40) { ctx.moveTo(x,0); ctx.lineTo(x,height); }
        for(let y=0; y<height; y+=40) { ctx.moveTo(0,y); ctx.lineTo(width,y); }
        ctx.stroke();

        // Player (Triangle Jet)
        ctx.shadowColor = '#00f3ff';
        ctx.shadowBlur = 15;
        ctx.fillStyle = '#00f3ff'; 
        ctx.beginPath();
        ctx.moveTo(s.playerX + s.playerW/2, height - s.playerH - 10); // Top
        ctx.lineTo(s.playerX + s.playerW, height - 10); // Right
        ctx.lineTo(s.playerX, height - 10); // Left
        ctx.fill();
        ctx.shadowBlur = 0;
        
        // Bullets
        ctx.fillStyle = '#fff';
        s.bullets.forEach(b => ctx.fillRect(b.x, b.y, b.w, b.h));

        // Enemies (Neon squares)
        ctx.shadowColor = '#ff003c';
        ctx.shadowBlur = 10;
        ctx.strokeStyle = '#ff003c';
        ctx.lineWidth = 2;
        s.enemies.forEach(e => {
            ctx.strokeRect(e.x, e.y, e.w, e.h);
            ctx.beginPath();
            ctx.moveTo(e.x, e.y); ctx.lineTo(e.x+e.w, e.y+e.h);
            ctx.moveTo(e.x+e.w, e.y); ctx.lineTo(e.x, e.y+e.h);
            ctx.stroke();
        });
        ctx.shadowBlur = 0;

        animationFrameRef.current = requestAnimationFrame(gameLoop);
    };

    useEffect(() => {
        if (isPlaying && !gameOver) {
            animationFrameRef.current = requestAnimationFrame(gameLoop);
        }
        return () => {
            if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        };
    }, [isPlaying, gameOver]);

    return (
        <div ref={containerRef} className="h-full w-full bg-black relative overflow-hidden flex flex-col items-center justify-center select-none" tabIndex={0}>
            
            <canvas ref={canvasRef} className="absolute inset-0 z-0 block" />

            {/* HUD */}
            <div className="absolute top-2 right-2 z-10 font-mono text-holo-accent text-xs border border-holo-accent/50 px-2 py-1 shadow-glow-sm">
                THREATS_NEUTRALIZED: {score}
            </div>

            {/* UI Overlays */}
            {(!isPlaying || gameOver) && (
                <div className="absolute inset-0 z-20 bg-black/90 backdrop-blur-sm flex flex-col items-center justify-center text-holo-textBright">
                    <Target size={64} className="text-holo-alert mb-4 animate-pulse" strokeWidth={1} />
                    <div className="text-2xl font-bold font-mono mb-6 tracking-[0.2em] text-holo-alert text-glow-alert">
                        {gameOver ? "SIGNAL LOST" : "COMBAT SIMULATION"}
                    </div>
                    
                    {gameOver && <div className="text-holo-text mb-8 font-mono text-sm border-b border-holo-text/30 pb-1">FINAL SCORE: {score}</div>}
                    
                    <button 
                        onClick={initGame} 
                        className="group px-8 py-3 bg-transparent border border-holo-accent hover:bg-holo-accent hover:text-black text-holo-accent font-mono text-sm tracking-widest transition-all flex items-center gap-3 uppercase shadow-glow hover:shadow-glow-lg"
                    >
                        {gameOver ? <RefreshCw size={16} /> : <Play size={16} />}
                        {gameOver ? "REBOOT SYSTEM" : "INITIATE"}
                    </button>
                </div>
            )}
        </div>
    );
};