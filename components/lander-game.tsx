'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  addLanderScore,
  loadLanderLeaderboard,
  qualifiesForTopThree,
  type LanderLeaderboardEntry,
} from '@/lib/lander-leaderboard';

const CANVAS_WIDTH = 360;
const CANVAS_HEIGHT = 520;
const SHIP_SIZE = 12;
const GRAVITY = 0.035;
const THRUST = 0.07;
const ROTATION_SPEED = 0.04;

type GameStatus = 'running' | 'landed' | 'crashed';

type TerrainPoint = {
  x: number;
  y: number;
};

type ShipState = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  fuel: number;
};

export function LanderGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const keysRef = useRef({ left: false, right: false, thrust: false });
  const touchRef = useRef({ left: false, right: false, thrust: false });
  const shipRef = useRef<ShipState>({
    x: CANVAS_WIDTH * 0.5,
    y: 70,
    vx: 0,
    vy: 0,
    angle: 0,
    fuel: 100,
  });
  const terrainRef = useRef<TerrainPoint[]>([]);
  const padRef = useRef({ start: 0, end: 0, y: 0 });
  const statusRef = useRef<GameStatus>('running');
  const landingScoreRef = useRef(0);

  const [status, setStatus] = useState<GameStatus>('running');
  const [fuel, setFuel] = useState(100);
  const [velocity, setVelocity] = useState({ x: 0, y: 0 });
  const [landId, setLandId] = useState(0);
  const [leaderboard, setLeaderboard] = useState<LanderLeaderboardEntry[]>([]);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [saveScore, setSaveScore] = useState(0);
  const [pilotName, setPilotName] = useState('');

  const generateTerrain = () => {
    const points: TerrainPoint[] = [];
    const segments = 18;
    const segmentWidth = CANVAS_WIDTH / segments;
    let y = CANVAS_HEIGHT - 110;

    for (let i = 0; i <= segments; i++) {
      if (i > 0 && i < segments) {
        y += (Math.random() - 0.5) * 28;
      }
      y = Math.max(CANVAS_HEIGHT - 165, Math.min(CANVAS_HEIGHT - 65, y));
      points.push({ x: i * segmentWidth, y });
    }

    const padSegment = 6 + Math.floor(Math.random() * 6);
    const padStart = padSegment * segmentWidth;
    const padEnd = padStart + segmentWidth * 2;
    const padY = CANVAS_HEIGHT - 120 - Math.random() * 20;

    points[padSegment].y = padY;
    points[padSegment + 1].y = padY;
    points[padSegment + 2].y = padY;

    terrainRef.current = points;
    padRef.current = { start: padStart, end: padEnd, y: padY };
  };

  const resetGame = () => {
    generateTerrain();
    shipRef.current = {
      x: CANVAS_WIDTH * 0.5,
      y: 72,
      vx: (Math.random() - 0.5) * 0.2,
      vy: 0,
      angle: 0,
      fuel: 100,
    };
    statusRef.current = 'running';
    setStatus('running');
    setFuel(100);
    setVelocity({ x: 0, y: 0 });
    setSaveDialogOpen(false);
    setPilotName('');
  };

  const getGroundY = (x: number) => {
    const points = terrainRef.current;
    if (points.length < 2) return CANVAS_HEIGHT - 80;

    for (let i = 0; i < points.length - 1; i++) {
      const p1 = points[i];
      const p2 = points[i + 1];
      if (x >= p1.x && x <= p2.x) {
        const t = (x - p1.x) / (p2.x - p1.x || 1);
        return p1.y + (p2.y - p1.y) * t;
      }
    }

    return points[points.length - 1].y;
  };

  const draw = (ctx: CanvasRenderingContext2D, thrustOn: boolean) => {
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    const bg = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    bg.addColorStop(0, '#071a2e');
    bg.addColorStop(1, '#102f4d');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    for (let i = 0; i < 42; i++) {
      const px = (i * 83) % CANVAS_WIDTH;
      const py = (i * 47) % (CANVAS_HEIGHT - 120);
      ctx.fillRect(px, py, 1.2, 1.2);
    }

    ctx.beginPath();
    ctx.moveTo(0, CANVAS_HEIGHT);
    for (const p of terrainRef.current) {
      ctx.lineTo(p.x, p.y);
    }
    ctx.lineTo(CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.closePath();
    ctx.fillStyle = '#274662';
    ctx.fill();

    const pad = padRef.current;
    ctx.fillStyle = '#7cf0b4';
    ctx.fillRect(pad.start, pad.y - 3, pad.end - pad.start, 6);

    const ship = shipRef.current;

    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.angle);

    if (thrustOn && ship.fuel > 0 && statusRef.current === 'running') {
      ctx.beginPath();
      ctx.moveTo(0, SHIP_SIZE + 2);
      ctx.lineTo(-4, SHIP_SIZE + 12 + Math.random() * 6);
      ctx.lineTo(4, SHIP_SIZE + 12 + Math.random() * 6);
      ctx.closePath();
      ctx.fillStyle = '#ff9f43';
      ctx.fill();
    }

    ctx.beginPath();
    ctx.moveTo(0, -SHIP_SIZE);
    ctx.lineTo(-SHIP_SIZE * 0.8, SHIP_SIZE);
    ctx.lineTo(SHIP_SIZE * 0.8, SHIP_SIZE);
    ctx.closePath();
    ctx.fillStyle = statusRef.current === 'crashed' ? '#ff5c5c' : '#f3f6fb';
    ctx.fill();

    ctx.restore();

    ctx.fillStyle = '#dbe8f4';
    ctx.font = '14px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';
    ctx.fillText(`Fuel: ${Math.max(0, ship.fuel).toFixed(0)}%`, 12, 24);
    ctx.fillText(`Vx: ${ship.vx.toFixed(2)}`, 12, 44);
    ctx.fillText(`Vy: ${ship.vy.toFixed(2)}`, 12, 64);
    ctx.fillText('Arrows: rotate/thrust', 12, 88);
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') keysRef.current.left = true;
      if (e.key === 'ArrowRight') keysRef.current.right = true;
      if (e.key === 'ArrowUp') keysRef.current.thrust = true;
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') keysRef.current.left = false;
      if (e.key === 'ArrowRight') keysRef.current.right = false;
      if (e.key === 'ArrowUp') keysRef.current.thrust = false;
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    resetGame();

    const frame = () => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (!canvas || !ctx) {
        rafRef.current = requestAnimationFrame(frame);
        return;
      }

      const ship = shipRef.current;
      const controls = {
        left: keysRef.current.left || touchRef.current.left,
        right: keysRef.current.right || touchRef.current.right,
        thrust: keysRef.current.thrust || touchRef.current.thrust,
      };

      if (statusRef.current === 'running') {
        if (controls.left) ship.angle -= ROTATION_SPEED;
        if (controls.right) ship.angle += ROTATION_SPEED;

        if (controls.thrust && ship.fuel > 0) {
          ship.vx += Math.sin(ship.angle) * THRUST;
          ship.vy -= Math.cos(ship.angle) * THRUST;
          ship.fuel -= 0.23;
        }

        ship.vy += GRAVITY;
        ship.x += ship.vx;
        ship.y += ship.vy;

        if (ship.x < SHIP_SIZE) {
          ship.x = SHIP_SIZE;
          ship.vx *= -0.35;
        }
        if (ship.x > CANVAS_WIDTH - SHIP_SIZE) {
          ship.x = CANVAS_WIDTH - SHIP_SIZE;
          ship.vx *= -0.35;
        }

        const groundY = getGroundY(ship.x);
        if (ship.y + SHIP_SIZE >= groundY) {
          const onPad = ship.x >= padRef.current.start && ship.x <= padRef.current.end;
          const safeLanding =
            onPad &&
            Math.abs(ship.vx) < 0.9 &&
            Math.abs(ship.vy) < 1.3 &&
            Math.abs(ship.angle) < 0.24;

          ship.y = groundY - SHIP_SIZE;

          if (safeLanding) {
            const landingScore = Math.round(Math.max(0, ship.fuel) * 10) / 10;
            landingScoreRef.current = landingScore;
            statusRef.current = 'landed';
            setStatus('landed');
            setLandId((n) => n + 1);
            ship.vx = 0;
            ship.vy = 0;
          } else {
            statusRef.current = 'crashed';
            setStatus('crashed');
            ship.vx = 0;
            ship.vy = 0;
          }
        }
      }

      setFuel(ship.fuel);
      setVelocity({ x: ship.vx, y: ship.vy });

      draw(ctx, controls.thrust);
      rafRef.current = requestAnimationFrame(frame);
    };

    rafRef.current = requestAnimationFrame(frame);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  useEffect(() => {
    setLeaderboard(loadLanderLeaderboard());
  }, []);

  useEffect(() => {
    if (landId === 0) return;
    const score = landingScoreRef.current;
    const entries = loadLanderLeaderboard();
    if (qualifiesForTopThree(score, entries)) {
      setSaveScore(score);
      setSaveDialogOpen(true);
    }
  }, [landId]);

  const handleSaveScore = () => {
    const current = loadLanderLeaderboard();
    const next = addLanderScore(pilotName, saveScore, current);
    setLeaderboard(next);
    setSaveDialogOpen(false);
    setPilotName('');
  };

  const setTouchControl = (key: 'left' | 'right' | 'thrust', value: boolean) => {
    touchRef.current[key] = value;
  };

  return (
    <section id="play-lander" className="bg-card border border-border rounded-2xl p-6 shadow-2xl">
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent showCloseButton>
          <DialogHeader>
            <DialogTitle>Top 3 score</DialogTitle>
            <DialogDescription>
              You landed with <span className="text-foreground font-medium">{saveScore}</span> fuel
              remaining (higher is better). Save your name to the local leaderboard?
            </DialogDescription>
          </DialogHeader>
          <Input
            placeholder="Your name"
            value={pilotName}
            onChange={(e) => setPilotName(e.target.value)}
            maxLength={24}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSaveScore();
            }}
            autoFocus
          />
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => setSaveDialogOpen(false)}>
              Skip
            </Button>
            <Button type="button" onClick={handleSaveScore}>
              Save score
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h3 className="text-xl font-semibold text-card-foreground">Artemis-style Lander</h3>
          <p className="text-sm text-muted-foreground">
            Land softly on the green pad. Score is fuel left; only top 3 can be saved to the board.
          </p>
        </div>
        <button
          onClick={resetGame}
          className="px-3 py-2 text-sm font-medium rounded-lg bg-accent text-accent-foreground hover:bg-accent/90"
        >
          Restart
        </button>
      </div>

      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        className="w-full max-w-[360px] mx-auto rounded-xl border border-border bg-slate-900"
      />

      <div className="mt-4 text-sm text-muted-foreground text-center">
        <p>
          Fuel: {Math.max(0, fuel).toFixed(0)}% | Vx: {velocity.x.toFixed(2)} | Vy:{' '}
          {velocity.y.toFixed(2)}
        </p>
        {status === 'landed' && (
          <p className="text-green-500 font-medium mt-2">
            Successful landing. Score: {Math.round(Math.max(0, fuel) * 10) / 10} fuel.
          </p>
        )}
        {status === 'crashed' && <p className="text-red-500 font-medium mt-2">Crash. Try again.</p>}
      </div>

      <div className="mt-6 rounded-xl border border-border bg-muted/30 p-4">
        <h4 className="text-sm font-semibold text-card-foreground mb-3">Leaderboard (top 3)</h4>
        <p className="text-xs text-muted-foreground mb-3">
          Stored on this device only. Beat 3rd place to get a save prompt.
        </p>
        {leaderboard.length === 0 ? (
          <p className="text-sm text-muted-foreground">No scores yet. Land with fuel to spare.</p>
        ) : (
          <ol className="space-y-2">
            {leaderboard.map((e, i) => (
              <li
                key={`${e.at}-${i}`}
                className="flex items-center justify-between gap-2 text-sm border-b border-border/60 pb-2 last:border-0 last:pb-0"
              >
                <span className="text-muted-foreground w-6 shrink-0">{i + 1}.</span>
                <span className="flex-1 font-medium text-card-foreground truncate">{e.name}</span>
                <span className="tabular-nums text-accent shrink-0">{e.score}</span>
              </li>
            ))}
          </ol>
        )}
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 max-w-[360px] mx-auto">
        <button
          type="button"
          className="rounded-lg border border-border py-2 text-sm"
          onMouseDown={() => setTouchControl('left', true)}
          onMouseUp={() => setTouchControl('left', false)}
          onMouseLeave={() => setTouchControl('left', false)}
          onTouchStart={() => setTouchControl('left', true)}
          onTouchEnd={() => setTouchControl('left', false)}
        >
          Left
        </button>
        <button
          type="button"
          className="rounded-lg border border-border py-2 text-sm"
          onMouseDown={() => setTouchControl('thrust', true)}
          onMouseUp={() => setTouchControl('thrust', false)}
          onMouseLeave={() => setTouchControl('thrust', false)}
          onTouchStart={() => setTouchControl('thrust', true)}
          onTouchEnd={() => setTouchControl('thrust', false)}
        >
          Thrust
        </button>
        <button
          type="button"
          className="rounded-lg border border-border py-2 text-sm"
          onMouseDown={() => setTouchControl('right', true)}
          onMouseUp={() => setTouchControl('right', false)}
          onMouseLeave={() => setTouchControl('right', false)}
          onTouchStart={() => setTouchControl('right', true)}
          onTouchEnd={() => setTouchControl('right', false)}
        >
          Right
        </button>
      </div>
    </section>
  );
}
