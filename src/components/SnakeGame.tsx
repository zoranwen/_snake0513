import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, RefreshCcw, Play, Pause, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Zap } from 'lucide-react';

// 遊戲常數
const GRID_SIZE_X = 40;
const GRID_SIZE_Y = 30;
const TILE_SIZE = 20;
const INITIAL_SPEED = 150;
const MIN_SPEED = 60;
const SPEED_INCREMENT = 2;

type Point = { x: number; y: number };
type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
type GameStatus = 'IDLE' | 'PLAYING' | 'PAUSED' | 'GAME_OVER';

export default function SnakeGame() {
  // 遊戲狀態
  const [snake, setSnake] = useState<Point[]>([
    { x: 10, y: 15 },
    { x: 9, y: 15 },
    { x: 8, y: 15 },
  ]);
  const [food, setFood] = useState<Point>({ x: 20, y: 15 });
  const [direction, setDirection] = useState<Direction>('RIGHT');
  const [nextDirection, setNextDirection] = useState<Direction>('RIGHT');
  const [status, setStatus] = useState<GameStatus>('IDLE');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [speed, setSpeed] = useState(INITIAL_SPEED);
  const [pulseScore, setPulseScore] = useState(false);
  const [logs, setLogs] = useState<string[]>(['> 系統就緒', '> 等待同步中...']);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lastTimeRef = useRef<number>(0);
  const [uptime, setUptime] = useState('00:00:00:00');

  // Uptime timer
  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const diff = Date.now() - startTime;
      const hours = Math.floor(diff / 3600000).toString().padStart(2, '0');
      const minutes = Math.floor((diff % 3600000) / 60000).toString().padStart(2, '0');
      const seconds = Math.floor((diff % 60000) / 1000).toString().padStart(2, '0');
      const ms = Math.floor((diff % 1000) / 10).toString().padStart(2, '0');
      setUptime(`${hours}:${minutes}:${seconds}:${ms}`);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  const addLog = (msg: string) => {
    setLogs(prev => [msg, ...prev].slice(0, 8));
  };

  // 隨機生成食物位置
  const generateFood = useCallback((currentSnake: Point[]): Point => {
    let newFood: Point;
    while (true) {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE_X),
        y: Math.floor(Math.random() * GRID_SIZE_Y),
      };
      const isOnSnake = currentSnake.some(
        (segment) => segment.x === newFood.x && segment.y === newFood.y
      );
      if (!isOnSnake) break;
    }
    return newFood;
  }, []);

  // 重置遊戲
  const resetGame = () => {
    const initialSnake = [
      { x: 10, y: 15 },
      { x: 9, y: 15 },
      { x: 8, y: 15 },
    ];
    setSnake(initialSnake);
    setDirection('RIGHT');
    setNextDirection('RIGHT');
    setScore(0);
    setSpeed(INITIAL_SPEED);
    const firstFood = generateFood(initialSnake);
    setFood(firstFood);
    setStatus('PLAYING');
    addLog('> 工作階段開始: ' + Date.now().toString(16).toUpperCase());
    addLog(`> 食物生成於座標 [${firstFood.x}, ${firstFood.y}]`);
  };

  // 處理鍵盤控制
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          if (direction !== 'DOWN') setNextDirection('UP');
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          if (direction !== 'UP') setNextDirection('DOWN');
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          if (direction !== 'RIGHT') setNextDirection('LEFT');
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          if (direction !== 'LEFT') setNextDirection('RIGHT');
          break;
        case ' ':
          if (status === 'PLAYING') {
            setStatus('PAUSED');
            addLog('> 進程掛起');
          }
          else if (status === 'PAUSED') {
            setStatus('PLAYING');
            addLog('> 進程恢復');
          }
          else if (status === 'IDLE' || status === 'GAME_OVER') resetGame();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [direction, status]);

  // 遊戲邏輯移動
  const moveSnake = useCallback(() => {
    if (status !== 'PLAYING') return;

    // 更新目前方向
    const currentDir = nextDirection;
    setDirection(currentDir);

    setSnake((prevSnake) => {
      const head = prevSnake[0];
      const newHead = { ...head };

      switch (currentDir) {
        case 'UP': newHead.y -= 1; break;
        case 'DOWN': newHead.y += 1; break;
        case 'LEFT': newHead.x -= 1; break;
        case 'RIGHT': newHead.x += 1; break;
      }

      // 檢查牆壁或自身碰撞
      if (
        newHead.x < 0 ||
        newHead.x >= GRID_SIZE_X ||
        newHead.y < 0 ||
        newHead.y >= GRID_SIZE_Y ||
        prevSnake.some((segment) => segment.x === newHead.x && segment.y === newHead.y)
      ) {
        // 使用 setTimeout 將副作用移出更新函數
        setTimeout(() => {
          setStatus('GAME_OVER');
          addLog('> 嚴重錯誤：檢測到碰撞');
          addLog('> 工作階段終止');
        }, 0);
        return prevSnake;
      }

      const newSnake = [newHead, ...prevSnake];

      // 檢查是否吃到食物
      if (newHead.x === food.x && newHead.y === food.y) {
        // 使用 setTimeout 處理副作用，確保狀態更新順序正確
        setTimeout(() => {
          setScore((prev) => {
            const newScore = prev + 10;
            if (newScore > highScore) setHighScore(newScore);
            return newScore;
          });
          setPulseScore(true);
          setTimeout(() => setPulseScore(false), 200);
          
          const nextFood = generateFood(newSnake);
          setFood(nextFood);
          addLog(`> 數據包已同步 [${nextFood.x}, ${nextFood.y}]`);
          
          setSpeed((prevSpeed) => {
            const newSpeed = Math.max(MIN_SPEED, prevSpeed - SPEED_INCREMENT);
            if (newSpeed !== prevSpeed) {
                addLog(`> 時鐘加速: ${((INITIAL_SPEED/newSpeed)).toFixed(2)}x`);
            }
            return newSpeed;
          });
        }, 0);
        
        // 吃到食物，蛇身長度增加 (不執行 pop)
        return newSnake;
      } else {
        // 沒吃到食物，移除尾部縮短
        newSnake.pop();
        return newSnake;
      }
    });
  }, [status, nextDirection, food, highScore, generateFood]);

  // 遊戲迴圈
  useEffect(() => {
    if (status !== 'PLAYING') return;
    let timerId: number;
    const tick = () => {
      moveSnake();
      timerId = window.setTimeout(tick, speed);
    };
    timerId = window.setTimeout(tick, speed);
    return () => clearTimeout(timerId);
  }, [status, speed, moveSnake]);

  // Canvas 繪製
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Grid dots
    ctx.fillStyle = 'rgba(0, 255, 65, 0.1)';
    for (let x = 0; x < GRID_SIZE_X; x++) {
      for (let y = 0; y < GRID_SIZE_Y; y++) {
        ctx.beginPath();
        ctx.arc(x * TILE_SIZE + TILE_SIZE/2, y * TILE_SIZE + TILE_SIZE/2, 1, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Food
    const foodX = food.x * TILE_SIZE + TILE_SIZE / 2;
    const foodY = food.y * TILE_SIZE + TILE_SIZE / 2;
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#FF0055';
    ctx.fillStyle = '#FF0055';
    ctx.beginPath();
    ctx.rect(food.x * TILE_SIZE + 4, food.y * TILE_SIZE + 4, TILE_SIZE - 8, TILE_SIZE - 8);
    ctx.fill();
    
    // Snake
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#00FF41';
    
    snake.forEach((segment, index) => {
      const isHead = index === 0;
      ctx.fillStyle = isHead ? '#00FF41' : `rgba(0, 255, 65, ${0.8 - (index / snake.length) * 0.5})`;
      
      const x = segment.x * TILE_SIZE;
      const y = segment.y * TILE_SIZE;
      const size = TILE_SIZE;
      
      ctx.fillRect(x + 1, y + 1, size - 2, size - 2);

      if (isHead) {
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#000';
        const eyeSize = 2;
        if (direction === 'RIGHT' || direction === 'LEFT') {
          ctx.fillRect(x + size/2, y + size/4, eyeSize, eyeSize);
          ctx.fillRect(x + size/2, y + 3*size/4, eyeSize, eyeSize);
        } else {
          ctx.fillRect(x + size/4, y + size/2, eyeSize, eyeSize);
          ctx.fillRect(x + 3*size/4, y + size/2, eyeSize, eyeSize);
        }
      }
    });

    ctx.shadowBlur = 0;
  }, [snake, food, direction]);

  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-[#111]">
      <div className="w-[1024px] h-[768px] bg-[#050505] text-[#00FF41] font-mono flex flex-col border-[12px] border-[#1a1a1a] shadow-2xl relative overflow-hidden select-none">
        
        {/* Header Bar */}
        <header className="h-16 border-b border-[#00FF41]/30 flex items-center justify-between px-8 bg-[#0a0a0a]">
          <div className="flex items-center space-x-4">
            <div className={`w-3 h-3 rounded-full ${status === 'PLAYING' ? 'bg-[#00FF41] animate-pulse shadow-[0_0_8px_#00FF41]' : 'bg-[#f44]'}`}></div>
            <h1 className="text-xl font-bold tracking-widest uppercase shadow-green">霓虹蛇核心系統.exe</h1>
          </div>
          <div className="flex space-x-8 text-sm">
            <div className="flex flex-col items-end">
              <span className="text-[#00FF41]/50 text-[10px]">狀態</span>
              <span className="font-bold">{status === 'PLAYING' ? '虛擬環境已啟用' : status === 'PAUSED' ? '進程掛起中' : '系統待機中'}</span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-[#00FF41]/50 text-[10px]">運行時間</span>
              <span className="font-bold tabular-nums">{uptime}</span>
            </div>
          </div>
        </header>

        <main className="flex-1 flex overflow-hidden">
          {/* Sidebar Left: Stats */}
          <aside className="w-64 border-r border-[#00FF41]/30 p-6 flex flex-col space-y-8 bg-[#080808]">
            <section>
              <h2 className="text-[10px] text-[#00FF41]/50 uppercase mb-4 tracking-[0.2em] border-b border-[#00FF41]/20 pb-1">主要數據</h2>
              <div className="space-y-6">
                <div>
                  <div className="text-[10px] opacity-60 mb-1">目前得分</div>
                  <motion.div 
                    animate={pulseScore ? { scale: [1, 1.1, 1] } : {}}
                    className="text-3xl font-black italic shadow-green tabular-nums"
                  >
                    {score.toString().padStart(6, '0')}
                  </motion.div>
                </div>
                <div>
                  <div className="text-[10px] opacity-60 mb-1">最高得分</div>
                  <div className="text-xl font-bold opacity-80 underline decoration-[#00FF41]/30 tabular-nums">
                    {highScore.toString().padStart(6, '0')}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] opacity-60 mb-1">蛇身長度</div>
                  <div className="text-xl font-bold italic">
                    {snake.length.toString().padStart(2, '0')}_單位
                  </div>
                </div>
              </div>
            </section>

            <section className="flex-1 overflow-hidden">
              <h2 className="text-[10px] text-[#00FF41]/50 uppercase mb-3 tracking-[0.2em] border-b border-[#00FF41]/20 pb-1">系統日誌</h2>
              <div className="text-[10px] space-y-1 font-mono opacity-70">
                {logs.map((log, i) => (
                  <p key={i} className={i === 0 ? "animate-pulse" : ""}>{log}</p>
                ))}
              </div>
            </section>
          </aside>

          {/* Center: Game Board */}
          <section className="flex-1 relative bg-[#000] p-4 flex items-center justify-center overflow-hidden">
            <div className="relative border border-[#00FF41]/20 shadow-[0_0_30px_rgba(0,255,65,0.05)]">
              {/* Scanline Overlay */}
              <div className="absolute inset-0 pointer-events-none z-50 scanlines opacity-30"></div>
              
              <canvas
                ref={canvasRef}
                width={GRID_SIZE_X * TILE_SIZE}
                height={GRID_SIZE_Y * TILE_SIZE}
                className="block"
              />

              {/* Overlays */}
              <AnimatePresence>
                {status !== 'PLAYING' && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-[2px] z-[60]"
                  >
                    <div className="text-center p-12 border-2 border-[#00FF41] bg-black shadow-[0_0_50px_rgba(0,255,65,0.2)]">
                      {status === 'IDLE' && (
                        <div className="space-y-6">
                          <h2 className="text-5xl font-black italic tracking-tighter uppercase mb-2 shadow-green">系統就緒</h2>
                          <div className="text-xs opacity-60 mb-8 max-w-xs mx-auto leading-relaxed">
                             請按下 [空白鍵] 初始化神經傳導介面並啟動內核進程。
                          </div>
                          <button
                            onClick={resetGame}
                            className="px-10 py-4 bg-[#00FF41] text-black font-black uppercase italic tracking-[0.2em] hover:bg-white hover:scale-105 transition-all"
                          >
                            啟動內核
                          </button>
                        </div>
                      )}

                      {status === 'PAUSED' && (
                        <div className="space-y-6">
                          <h2 className="text-5xl font-black italic tracking-tighter uppercase mb-6 shadow-green">線程已掛起</h2>
                          <button
                            onClick={() => setStatus('PLAYING')}
                            className="px-10 py-4 border-2 border-[#00FF41] text-[#00FF41] font-black uppercase italic tracking-[0.2em] hover:bg-[#00FF41] hover:text-black transition-all"
                          >
                            恢復執行
                          </button>
                        </div>
                      )}

                      {status === 'GAME_OVER' && (
                        <div className="space-y-4">
                          <h2 className="text-6xl font-black italic uppercase tracking-tighter text-[#fb3a5d] shadow-[0_0_20px_rgba(251,58,93,0.3)]">內核崩潰</h2>
                          <div className="pb-8">
                             <p className="text-[#fb3a5d]/60 uppercase text-[10px] tracking-[0.4em] font-bold mb-2">最終記憶體狀態</p>
                             <p className="text-5xl font-mono text-white shadow-green">{score.toString().padStart(6, '0')}</p>
                          </div>
                          <button
                            onClick={resetGame}
                            className="flex items-center justify-center gap-3 w-full px-8 py-4 bg-[#fb3a5d] text-black font-black uppercase italic tracking-[0.2em] hover:bg-white transition-all"
                          >
                            <RefreshCcw className="w-5 h-5" />
                            重啟系統
                          </button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </section>

          {/* Sidebar Right: Controls */}
          <aside className="w-24 border-l border-[#00FF41]/30 flex flex-col items-center py-8 bg-[#080808] space-y-8">
            <div className="text-[10px] text-[#00FF41]/50 uppercase vertical-rl rotate-180 font-bold tracking-[0.5em]">輸入介面_核心</div>
            
            <div className="flex flex-col items-center gap-4">
              <div className="flex flex-col gap-1 items-center">
                 <div className={`w-10 h-10 border ${direction === 'UP' ? 'bg-[#00FF41] text-black' : 'border-[#00FF41]/40'} flex items-center justify-center text-xs font-bold transition-colors`}>W</div>
                 <div className="flex gap-1">
                    <div className={`w-10 h-10 border ${direction === 'LEFT' ? 'bg-[#00FF41] text-black' : 'border-[#00FF41]/40'} flex items-center justify-center text-xs font-bold transition-colors`}>A</div>
                    <div className={`w-10 h-10 border ${direction === 'DOWN' ? 'bg-[#00FF41] text-black' : 'border-[#00FF41]/40'} flex items-center justify-center text-xs font-bold transition-colors`}>S</div>
                    <div className={`w-10 h-10 border ${direction === 'RIGHT' ? 'bg-[#00FF41] text-black' : 'border-[#00FF41]/40'} flex items-center justify-center text-xs font-bold transition-colors`}>D</div>
                 </div>
              </div>
              
              <div className="w-16 h-8 border border-[#00FF41]/40 flex items-center justify-center text-[10px] uppercase font-bold tracking-tighter">空白鍵</div>
            </div>

            <div className="flex-1" />
            
            <div className="text-[10px] text-[#00FF41]/50 uppercase vertical-rl rotate-180 font-bold tracking-[0.5em]">導航組件_01</div>
          </aside>
        </main>

        {/* Footer Bar */}
        <footer className="h-10 border-t border-[#00FF41]/30 bg-[#0a0a0a] flex items-center px-8 text-[10px] space-x-12">
          <div className="flex items-center space-x-2">
            <span className="opacity-50">引擎核心:</span>
            <span className="font-bold">REACT_19.VITE_6</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="opacity-50">網格解析度:</span>
            <span className="font-bold">40x30_單位</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="opacity-50">記憶體同步:</span>
            <span className="text-[#00FF41] animate-pulse font-bold uppercase">已連接</span>
          </div>
          <div className="flex-1 text-right italic text-[#00FF41]/40 tracking-widest overflow-hidden whitespace-nowrap">
            登錄成功：系統運行中，準備接收指令庫_...
          </div>
        </footer>
      </div>
    </div>
  );
}

