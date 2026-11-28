import type { Paper as PaperName } from '@wichteln/db/papers';
import {
  type CSSProperties,
  type RefObject,
  useEffect,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import {
  cornerCannons,
  draw,
  giftBurst,
  launch,
  type Palette,
  type Particle,
  type Stage,
  seededRandom,
  step,
} from './burst-particles';
import {
  burstMilliseconds,
  nameMilliseconds,
  openingMilliseconds,
  timingStyle,
} from './gift-timing';

type GiftBurstProps = {
  // The gift the burst comes out of.
  readonly giftRef: RefObject<HTMLElement | null>;
  // The paper of the person inside, whose colour the light and the confetti
  // take.
  readonly paper: PaperName;
  // Called once the last piece of confetti has gone.
  readonly onDone: () => void;
};

const half = 0.5;
const densest = 2;
// A frame never moves the confetti on by more than a frame at 30 a second,
// so a stalled tab doesn't throw it across the screen.
const slowestFrameRate = 30;
const millisecondsPerSecond = 1000;
const cannonsAfterName = 220;

const colour = (name: string) =>
  getComputedStyle(document.documentElement).getPropertyValue(name).trim();

// The confetti is cut mostly from the paper inside, with some white.
const paletteFor = (paper: PaperName): Palette => {
  const base = colour(`--color-${paper}`);
  const deep = colour(`--color-${paper}-deep`);
  const card = colour('--color-card');
  const line = colour('--color-line');
  return {
    papers: [
      [base, deep],
      [base, deep],
      [deep, base],
      [card, line],
    ],
    light: ['white', base, 'oklch(0.97 0.09 92)'],
  };
};

const centreOf = (element: HTMLElement | null) => {
  const box = element?.getBoundingClientRect();
  return box === undefined
    ? { x: window.innerWidth * half, y: window.innerHeight * half }
    : { x: box.left + box.width * half, y: box.top + box.height * half };
};

// Runs the confetti on the canvas until the last piece has gone.
const useConfetti = (
  canvasRef: RefObject<HTMLCanvasElement | null>,
  giftRef: RefObject<HTMLElement | null>,
  paper: PaperName,
  onDone: () => void,
) => {
  const doneRef = useRef(onDone);
  useEffect(() => {
    doneRef.current = onDone;
  });
  useEffect(() => {
    const element = canvasRef.current;
    const context = element?.getContext('2d');
    if (element === null || context === null || context === undefined) {
      // Without a canvas there is no confetti to wait for, and the burst
      // ends once the room has lifted.
      const lifted = setTimeout(() => doneRef.current(), openingMilliseconds);
      return () => clearTimeout(lifted);
    }
    const ratio = Math.min(window.devicePixelRatio || 1, densest);
    let stage: Stage = { width: 0, height: 0 };
    // The canvas covers the screen, also when the phone turns.
    const cover = () => {
      stage = { width: window.innerWidth, height: window.innerHeight };
      element.width = Math.round(stage.width * ratio);
      element.height = Math.round(stage.height * ratio);
    };
    cover();
    window.addEventListener('resize', cover);
    const palette = paletteFor(paper);
    const random = seededRandom(Date.now());
    let particles: Array<Particle> = [];
    let waiting = 2;
    let frame = 0;
    let last = 0;

    const tick = (now: number) => {
      const dt = Math.min(
        (now - last) / millisecondsPerSecond,
        1 / slowestFrameRate,
      );
      last = now;
      particles = step(particles, dt, stage);
      context.setTransform(1, 0, 0, 1, 0, 0);
      context.clearRect(0, 0, element.width, element.height);
      draw(context, particles, ratio);
      if (particles.length > 0 || waiting > 0) {
        frame = requestAnimationFrame(tick);
      } else {
        frame = 0;
        doneRef.current();
      }
    };

    const fire = (launches: ReadonlyArray<Parameters<typeof launch>[0]>) => {
      waiting -= 1;
      for (const settings of launches) {
        particles.push(...launch(settings, stage, palette, random));
      }
      if (frame === 0) {
        last = performance.now();
        frame = requestAnimationFrame(tick);
      }
    };

    const burst = setTimeout(
      () => fire([giftBurst(centreOf(giftRef.current), stage)]),
      burstMilliseconds,
    );
    const cannons = setTimeout(
      () => fire(cornerCannons(stage)),
      nameMilliseconds + cannonsAfterName,
    );
    return () => {
      window.removeEventListener('resize', cover);
      clearTimeout(burst);
      clearTimeout(cannons);
      cancelAnimationFrame(frame);
    };
  }, [canvasRef, giftRef, paper]);
};

// The moment the gift bursts, beyond its own box: the room goes dark while it
// charges, flashes in the colour inside when it bursts, and confetti and
// sparks fly across the whole screen. It sits on top of the page, and only
// the gift itself rises above the dark.
export const GiftBurst = ({ giftRef, paper, onDone }: GiftBurstProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [centre] = useState(() => centreOf(giftRef.current));
  useConfetti(canvasRef, giftRef, paper, onDone);
  const room = {
    ...timingStyle,
    '--x': `${centre.x}px`,
    '--y': `${centre.y}px`,
    '--glow': `var(--color-${paper})`,
  } as CSSProperties;
  return createPortal(
    <>
      {/* biome-ignore lint/nursery/noInlineStyles: The light centres on wherever the gift is on screen, keeps the gift's timing, and takes the colour of the paper inside. */}
      <div aria-hidden="true" className="gift-room" style={room}>
        <div className="gift-room-shade" />
      </div>
      {/* biome-ignore lint/nursery/noInlineStyles: The flash keeps the gift's timing and takes the colour of the paper inside. */}
      <div aria-hidden="true" className="gift-room-flash" style={room} />
      <canvas className="gift-confetti" ref={canvasRef} />
    </>,
    document.body,
  );
};
