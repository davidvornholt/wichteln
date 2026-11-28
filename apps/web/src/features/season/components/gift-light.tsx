// The light of the burst inside the gift's own place on the page.

const waves = ['light', 'glow', 'thin'] as const;

// Behind the gift: the glow that builds up while it charges, then the rays
// that sweep out when it bursts.
export const GiftLightBehind = () => (
  <div aria-hidden="true" className="gift-light">
    <div className="gift-aura">
      <div className="gift-aura-charge" />
    </div>
    <div className="gift-rays" />
  </div>
);

// In front of the gift: the flash as it bursts, and square shockwaves that
// run out from it.
export const GiftLightInFront = () => (
  <div aria-hidden="true" className="gift-light">
    <div className="gift-flash" />
    {waves.map((wave) => (
      <div className="gift-wave" data-wave={wave} key={wave} />
    ))}
  </div>
);
