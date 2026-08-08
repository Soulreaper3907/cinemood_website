// CineMood - Butter-Smooth 60fps 3D Tilt & Cursor Glow Engine (RAF + Lerp)

function initCardTilt(cardElement) {
  if (!cardElement) return;

  let rect = null;
  let targetX = 0;
  let targetY = 0;
  let currentX = 0;
  let currentY = 0;
  let isHovered = false;
  let animationFrameId = null;

  const maxTilt = 8; // Subtle, elegant tilt angle in degrees

  // Linear Interpolation helper for butter-smooth movement
  function lerp(start, end, factor) {
    return start + (end - start) * factor;
  }

  function updateCardTransform() {
    if (!isHovered) {
      // Smoothly return to flat state when mouse leaves
      currentX = lerp(currentX, 0, 0.1);
      currentY = lerp(currentY, 0, 0.1);

      if (Math.abs(currentX) < 0.01 && Math.abs(currentY) < 0.01) {
        cardElement.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0px) scale3d(1, 1, 1)';
        cardElement.style.setProperty('--glare-x', '50%');
        cardElement.style.setProperty('--glare-y', '50%');
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
        return;
      }
    } else {
      // Smoothly interpolate towards target mouse position
      currentX = lerp(currentX, targetX, 0.15);
      currentY = lerp(currentY, targetY, 0.15);
    }

    const rotateX = (-currentY * maxTilt).toFixed(2);
    const rotateY = (currentX * maxTilt).toFixed(2);
    const scale = isHovered ? '1.03' : '1';
    const translateY = isHovered ? '-6px' : '0px';

    cardElement.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(${translateY}) scale3d(${scale}, ${scale}, ${scale})`;

    animationFrameId = requestAnimationFrame(updateCardTransform);
  }

  cardElement.addEventListener('mouseenter', (e) => {
    rect = cardElement.getBoundingClientRect();
    isHovered = true;
    if (!animationFrameId) {
      animationFrameId = requestAnimationFrame(updateCardTransform);
    }
  });

  cardElement.addEventListener('mousemove', (e) => {
    if (!rect) rect = cardElement.getBoundingClientRect();

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    targetX = (x - centerX) / centerX;
    targetY = (y - centerY) / centerY;

    const glareX = ((x / rect.width) * 100).toFixed(1);
    const glareY = ((y / rect.height) * 100).toFixed(1);
    cardElement.style.setProperty('--glare-x', `${glareX}%`);
    cardElement.style.setProperty('--glare-y', `${glareY}%`);
  });

  cardElement.addEventListener('mouseleave', () => {
    isHovered = false;
    rect = null;
    targetX = 0;
    targetY = 0;
  });
}
