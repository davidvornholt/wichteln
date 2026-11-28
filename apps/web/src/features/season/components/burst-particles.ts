// The confetti and sparks that fill the screen when a gift bursts. Confetti
// is square-cut paper that flutters as it falls, its back a shade darker than
// its front. Sparks are short streaks of light that fly fast and fade. Sizes
// and speeds are CSS pixels and seconds, scaled to the screen.

export type Palette = {
  // Front and back of each kind of paper the confetti is cut from.
  readonly papers: ReadonlyArray<readonly [string, string]>;
  readonly light: ReadonlyArray<string>;
};

type Confetti = {
  readonly kind: 'confetti';
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  readonly spin: number;
  flip: number;
  readonly flipSpeed: number;
  readonly sway: number;
  readonly width: number;
  readonly height: number;
  readonly front: string;
  readonly back: string;
  age: number;
  readonly life: number;
};

type Spark = {
  readonly kind: 'spark';
  x: number;
  y: number;
  vx: number;
  vy: number;
  readonly width: number;
  readonly colour: string;
  age: number;
  readonly life: number;
};

export type Particle = Confetti | Spark;

export type Random = () => number;

// A small seeded generator (Park and Miller's), so a test can replay a burst
// exactly. Its products stay below 2^53, so plain arithmetic is exact.
const modulus = 2_147_483_647;
const multiplier = 16_807;

export const seededRandom = (seed: number): Random => {
  let state = (Math.abs(Math.floor(seed)) % (modulus - 1)) + 1;
  return () => {
    state = (state * multiplier) % modulus;
    return (state - 1) / (modulus - 1);
  };
};

const between = (random: Random, low: number, high: number) =>
  low + (high - low) * random();

const pick = <T>(random: Random, list: ReadonlyArray<T>, fallback: T): T =>
  list[Math.floor(random() * list.length)] ?? fallback;

const fullTurn = Math.PI * 2;
const quarterTurn = Math.PI / 2;
const referenceSide = 900;

export type Stage = { readonly width: number; readonly height: number };

// Everything scales with the larger side of the screen, so a burst fills a
// phone as it fills a monitor.
const scaleOf = (stage: Stage) =>
  Math.max(stage.width, stage.height) / referenceSide;

type Launch = {
  readonly x: number;
  readonly y: number;
  // The direction confetti leaves in, in radians, 0 to the right.
  readonly aim: number;
  // How far either side of the aim confetti spreads.
  readonly spread: number;
  readonly confetti: number;
  readonly sparks: number;
  // How hard it shoots, 1 for the gift's own burst.
  readonly power: number;
};

const slowestConfetti = 700;
const fastestConfetti = 2100;
const smallestPiece = 7;
const largestPiece = 12;
const pieceAspectLow = 1.25;
const pieceAspectHigh = 1.9;
const mostSpin = 9;
const slowestFlip = 5;
const fastestFlip = 13;
const mostSway = 46;
const shortestLife = 4.2;
const longestLife = 6.2;
const launchScatter = 26;
const slowestSpark = 700;
const fastestSpark = 1900;
const shortestSpark = 0.4;
const longestSpark = 0.95;
const thinnestSpark = 1.6;
const thickestSpark = 3.2;

const confettiFrom = (
  from: Launch,
  palette: Palette,
  random: Random,
  scale: number,
): Confetti => {
  const direction = from.aim + between(random, -from.spread, from.spread);
  const speed =
    between(random, slowestConfetti, fastestConfetti) * scale * from.power;
  const width = between(random, smallestPiece, largestPiece);
  const [front, back] = pick(random, palette.papers, ['white', 'silver']);
  return {
    kind: 'confetti',
    x: from.x + between(random, -launchScatter, launchScatter) * scale,
    y: from.y + between(random, -launchScatter, launchScatter) * scale,
    vx: Math.cos(direction) * speed,
    vy: Math.sin(direction) * speed,
    angle: between(random, 0, fullTurn),
    spin: between(random, -mostSpin, mostSpin),
    flip: between(random, 0, fullTurn),
    flipSpeed: between(random, slowestFlip, fastestFlip),
    sway: between(random, -mostSway, mostSway) * scale,
    width,
    height: width * between(random, pieceAspectLow, pieceAspectHigh),
    front,
    back,
    age: 0,
    life: between(random, shortestLife, longestLife),
  };
};

const sparkFrom = (
  from: Launch,
  palette: Palette,
  random: Random,
  scale: number,
): Spark => {
  const direction = between(random, 0, fullTurn);
  const speed =
    between(random, slowestSpark, fastestSpark) * scale * from.power;
  return {
    kind: 'spark',
    x: from.x,
    y: from.y,
    vx: Math.cos(direction) * speed,
    vy: Math.sin(direction) * speed,
    width: between(random, thinnestSpark, thickestSpark),
    colour: pick(random, palette.light, 'white'),
    age: 0,
    life: between(random, shortestSpark, longestSpark),
  };
};

export const launch = (
  settings: Launch,
  stage: Stage,
  palette: Palette,
  random: Random,
): Array<Particle> => {
  const scale = scaleOf(stage);
  return [
    ...Array.from({ length: settings.sparks }, () =>
      sparkFrom(settings, palette, random, scale),
    ),
    ...Array.from({ length: settings.confetti }, () =>
      confettiFrom(settings, palette, random, scale),
    ),
  ];
};

// The gift's own burst: mostly upwards, with sparks in every direction.
const giftAim = -quarterTurn;
const giftSpread = 1.35;
const pixelsPerConfetti = 4200;
const fewestConfetti = 110;
const mostConfetti = 240;
const giftSparks = 70;

export const giftBurst = (
  origin: { readonly x: number; readonly y: number },
  stage: Stage,
): Launch => ({
  x: origin.x,
  y: origin.y,
  aim: giftAim,
  spread: giftSpread,
  confetti: Math.round(
    Math.min(
      mostConfetti,
      Math.max(
        fewestConfetti,
        (stage.width * stage.height) / pixelsPerConfetti,
      ),
    ),
  ),
  sparks: giftSparks,
  power: 1,
});

// Two cannons in the bottom corners that fire across the screen as the name
// lands.
const cannonTilt = 0.36;
const cannonSpread = 0.3;
const cannonConfetti = 60;
const cannonPower = 1.25;

export const cornerCannons = (stage: Stage): ReadonlyArray<Launch> => [
  {
    x: 0,
    y: stage.height,
    aim: -quarterTurn + cannonTilt,
    spread: cannonSpread,
    confetti: cannonConfetti,
    sparks: 0,
    power: cannonPower,
  },
  {
    x: stage.width,
    y: stage.height,
    aim: -quarterTurn - cannonTilt,
    spread: cannonSpread,
    confetti: cannonConfetti,
    sparks: 0,
    power: cannonPower,
  },
];

const gravity = 1500;
const confettiDrag = 2.1;
const fallingDrag = 5.5;
const sparkDrag = 4.6;
const sparkGravity = 520;
const outOfSight = 60;

// Moves every particle on by dt seconds and drops those that are gone. Paper
// slows quickly in the air and then sails down, swaying.
export const step = (
  particles: ReadonlyArray<Particle>,
  dt: number,
  stage: Stage,
): Array<Particle> => {
  const scale = scaleOf(stage);
  const kept: Array<Particle> = [];
  for (const particle of particles) {
    particle.age += dt;
    if (particle.kind === 'spark') {
      const keep = Math.exp(-sparkDrag * dt);
      particle.vx *= keep;
      particle.vy = particle.vy * keep + sparkGravity * scale * dt;
    } else {
      const drag = particle.vy > 0 ? fallingDrag : confettiDrag;
      const keep = Math.exp(-drag * dt);
      particle.flip += particle.flipSpeed * dt;
      particle.angle += particle.spin * dt;
      particle.vx =
        particle.vx * keep +
        Math.sin(particle.flip) * particle.sway * dt * drag;
      particle.vy = particle.vy * keep + gravity * scale * dt;
    }
    particle.x += particle.vx * dt;
    particle.y += particle.vy * dt;
    const below = particle.y > stage.height + outOfSight;
    if (particle.age < particle.life && !below) {
      kept.push(particle);
    }
  }
  return kept;
};

const fadeSeconds = 0.6;
const trailSeconds = 0.028;

const confettiOpacity = (particle: Confetti) =>
  Math.min(1, Math.max(0, (particle.life - particle.age) / fadeSeconds));

// Draws at the canvas's pixel ratio, so the paper stays crisp on dense
// screens.
export const draw = (
  context: CanvasRenderingContext2D,
  particles: ReadonlyArray<Particle>,
  ratio: number,
) => {
  context.globalCompositeOperation = 'source-over';
  for (const particle of particles) {
    if (particle.kind === 'confetti') {
      const turn = Math.cos(particle.flip);
      context.globalAlpha = confettiOpacity(particle);
      context.fillStyle = turn >= 0 ? particle.front : particle.back;
      context.setTransform(
        ratio,
        0,
        0,
        ratio,
        particle.x * ratio,
        particle.y * ratio,
      );
      context.rotate(particle.angle);
      context.scale(1, turn);
      context.fillRect(
        -particle.width / 2,
        -particle.height / 2,
        particle.width,
        particle.height,
      );
    }
  }
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
  context.globalCompositeOperation = 'lighter';
  context.lineCap = 'butt';
  for (const particle of particles) {
    if (particle.kind === 'spark') {
      context.globalAlpha = Math.max(0, 1 - particle.age / particle.life);
      context.strokeStyle = particle.colour;
      context.lineWidth = particle.width;
      context.beginPath();
      context.moveTo(
        particle.x - particle.vx * trailSeconds,
        particle.y - particle.vy * trailSeconds,
      );
      context.lineTo(particle.x, particle.y);
      context.stroke();
    }
  }
  context.globalAlpha = 1;
  context.globalCompositeOperation = 'source-over';
};
