/* ============================================
   COMPLEX COLLECTIVE — Animations Engine
   ============================================ */

// ============================================
// 0. CINEMATIC INTRO SEQUENCE
// ============================================
class IntroSequence {
  constructor() {
    this.overlay = document.getElementById('introOverlay');
    this.canvas = document.getElementById('introCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.flash = document.getElementById('introFlash');
    this.ring = document.getElementById('introRing');
    this.word1 = document.querySelector('.intro-word-1');
    this.word2 = document.querySelector('.intro-word-2');
    this.tagline = document.getElementById('introTagline');
    this.skipBtn = document.getElementById('introSkip');
    this.wipeLeft = document.getElementById('wipeLeft');
    this.wipeRight = document.getElementById('wipeRight');

    this.particles = [];
    this.beams = [];
    this.animationId = null;
    this.startTime = Date.now();
    this.skipped = false;
    this.exiting = false;

    this.init();
  }

  init() {
    this.resize();
    this.createExplosionParticles();
    this.createBeams();
    this.animate();

    // Lock scroll during intro
    document.body.style.overflow = 'hidden';

    // Skip button
    this.skipBtn.addEventListener('click', () => this.exit());

    // Auto-sequence
    this.runSequence();

    // Resize
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = window.innerWidth * dpr;
    this.canvas.height = window.innerHeight * dpr;
    this.ctx.scale(dpr, dpr);
    this.w = window.innerWidth;
    this.h = window.innerHeight;
    this.cx = this.w / 2;
    this.cy = this.h / 2;
  }

  createExplosionParticles() {
    const count = 120;
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.3;
      const speed = 2 + Math.random() * 6;
      const size = Math.random() * 3 + 1;
      this.particles.push({
        x: this.cx || window.innerWidth / 2,
        y: this.cy || window.innerHeight / 2,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size,
        life: 1,
        decay: 0.005 + Math.random() * 0.008,
        color: Math.random() > 0.5
          ? [139, 92, 246]   // Electric Violet
          : [59, 130, 246],  // Royal Blue
        trail: [],
        maxTrail: Math.floor(Math.random() * 8) + 4,
        delay: Math.random() * 300,   // stagger the burst
        started: false,
      });
    }
  }

  createBeams() {
    const beamCount = 8;
    for (let i = 0; i < beamCount; i++) {
      const angle = (Math.PI * 2 * i) / beamCount;
      this.beams.push({
        angle,
        length: 0,
        maxLength: Math.max(this.w, this.h) * 0.8,
        width: 1 + Math.random() * 2,
        opacity: 0,
        speed: 15 + Math.random() * 10,
        color: i % 2 === 0 ? [139, 92, 246] : [59, 130, 246],
        delay: i * 50,
        started: false,
      });
    }
  }

  animate() {
    this.ctx.clearRect(0, 0, this.w, this.h);
    const elapsed = Date.now() - this.startTime;

    // Draw beams from center
    this.beams.forEach(beam => {
      if (elapsed < beam.delay) return;
      if (!beam.started) beam.started = true;

      const beamElapsed = elapsed - beam.delay;
      beam.length = Math.min(beam.length + beam.speed, beam.maxLength);
      beam.opacity = beamElapsed < 200
        ? beamElapsed / 200 * 0.4
        : Math.max(0, 0.4 - (beamElapsed - 200) / 1500 * 0.4);

      if (beam.opacity <= 0) return;

      const endX = this.cx + Math.cos(beam.angle) * beam.length;
      const endY = this.cy + Math.sin(beam.angle) * beam.length;

      const grad = this.ctx.createLinearGradient(this.cx, this.cy, endX, endY);
      const [r, g, b] = beam.color;
      grad.addColorStop(0, `rgba(${r},${g},${b},${beam.opacity})`);
      grad.addColorStop(1, `rgba(${r},${g},${b},0)`);

      this.ctx.beginPath();
      this.ctx.moveTo(this.cx, this.cy);
      this.ctx.lineTo(endX, endY);
      this.ctx.strokeStyle = grad;
      this.ctx.lineWidth = beam.width;
      this.ctx.stroke();
    });

    // Draw particles with trails
    this.particles.forEach(p => {
      if (elapsed < p.delay) return;
      if (!p.started) {
        p.started = true;
        p.x = this.cx;
        p.y = this.cy;
      }

      p.trail.push({ x: p.x, y: p.y });
      if (p.trail.length > p.maxTrail) p.trail.shift();

      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.985;
      p.vy *= 0.985;
      p.life -= p.decay;

      if (p.life <= 0) return;

      // Trail
      for (let i = 0; i < p.trail.length; i++) {
        const t = p.trail[i];
        const trailOpacity = (i / p.trail.length) * p.life * 0.3;
        const [r, g, b] = p.color;
        this.ctx.beginPath();
        this.ctx.arc(t.x, t.y, p.size * 0.6, 0, Math.PI * 2);
        this.ctx.fillStyle = `rgba(${r},${g},${b},${trailOpacity})`;
        this.ctx.fill();
      }

      // Particle
      const [r, g, b] = p.color;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      this.ctx.fillStyle = `rgba(${r},${g},${b},${p.life})`;
      this.ctx.fill();

      // Glow
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size * 4, 0, Math.PI * 2);
      this.ctx.fillStyle = `rgba(${r},${g},${b},${p.life * 0.1})`;
      this.ctx.fill();
    });

    // Shockwave ring
    if (elapsed > 100 && elapsed < 1200) {
      const shockProgress = (elapsed - 100) / 1100;
      const shockRadius = shockProgress * Math.max(this.w, this.h) * 0.6;
      const shockOpacity = Math.max(0, 0.3 * (1 - shockProgress));

      this.ctx.beginPath();
      this.ctx.arc(this.cx, this.cy, shockRadius, 0, Math.PI * 2);
      this.ctx.strokeStyle = `rgba(139, 92, 246, ${shockOpacity})`;
      this.ctx.lineWidth = 2 + (1 - shockProgress) * 4;
      this.ctx.stroke();
    }

    // Second shockwave (delayed)
    if (elapsed > 300 && elapsed < 1400) {
      const shockProgress = (elapsed - 300) / 1100;
      const shockRadius = shockProgress * Math.max(this.w, this.h) * 0.5;
      const shockOpacity = Math.max(0, 0.2 * (1 - shockProgress));

      this.ctx.beginPath();
      this.ctx.arc(this.cx, this.cy, shockRadius, 0, Math.PI * 2);
      this.ctx.strokeStyle = `rgba(59, 130, 246, ${shockOpacity})`;
      this.ctx.lineWidth = 1 + (1 - shockProgress) * 3;
      this.ctx.stroke();
    }

    if (!this.exiting) {
      this.animationId = requestAnimationFrame(() => this.animate());
    }
  }

  runSequence() {
    // T=0ms — Explosion particles + beams fire immediately from canvas
    // T=100ms — Flash
    setTimeout(() => {
      if (this.skipped) return;
      this.flash.classList.add('fire');
    }, 100);

    // T=600ms — Ring draws in
    setTimeout(() => {
      if (this.skipped) return;
      this.ring.classList.add('animate');
    }, 600);

    // T=1200ms — Text slams in
    setTimeout(() => {
      if (this.skipped) return;
      this.word1.classList.add('animate');
    }, 1200);

    setTimeout(() => {
      if (this.skipped) return;
      this.word2.classList.add('animate');
      // Second flash on text slam
      this.flash.classList.remove('fire');
      void this.flash.offsetWidth; // force reflow
      this.flash.classList.add('fire');
    }, 1350);

    // T=1800ms — Tagline fades in
    setTimeout(() => {
      if (this.skipped) return;
      this.tagline.classList.add('animate');
    }, 1800);

    // T=3200ms — Auto-exit
    setTimeout(() => {
      if (this.skipped) return;
      this.exit();
    }, 3200);
  }

  exit() {
    if (this.exiting) return;
    this.exiting = true;
    this.skipped = true;

    // Fade out intro content
    const content = document.getElementById('introContent');
    content.style.transition = 'opacity 0.25s ease, transform 0.25s ease';
    content.style.opacity = '0';
    content.style.transform = 'scale(0.95)';
    this.skipBtn.style.transition = 'opacity 0.2s ease';
    this.skipBtn.style.opacity = '0';

    // Wipe panels slam in then out
    setTimeout(() => {
      this.wipeLeft.classList.add('animate');
      this.wipeRight.classList.add('animate');
    }, 200);

    // Remove overlay after wipe
    setTimeout(() => {
      this.overlay.classList.add('done');
      this.overlay.style.opacity = '0';
      this.overlay.style.transition = 'opacity 0.3s ease';
      document.body.style.overflow = '';
      cancelAnimationFrame(this.animationId);

      // Trigger hero animations
      initHeroAnimation();

      // Clean up DOM after fade
      setTimeout(() => {
        this.overlay.remove();
      }, 500);
    }, 800);
  }
}


// ============================================
// 1. PARTICLE CONSTELLATION — Hero Background
// ============================================
class ParticleConstellation {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.particles = [];
    this.mouse = { x: null, y: null, radius: 150 };
    this.animationId = null;
    this.resizeTimeout = null;

    this.config = {
      particleCount: 80,
      maxDistance: 160,
      particleMinSize: 1,
      particleMaxSize: 3,
      speed: 0.3,
      colors: [
        'rgba(139, 92, 246, ',  // Electric Violet
        'rgba(59, 130, 246, ',  // Royal Blue
        'rgba(167, 139, 250, ', // Vivid Violet
      ],
    };

    this.init();
  }

  init() {
    this.resize();
    this.createParticles();
    this.bindEvents();
    this.animate();
  }

  resize() {
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.ctx.scale(dpr, dpr);
    this.width = rect.width;
    this.height = rect.height;
  }

  createParticles() {
    this.particles = [];
    const count = this.width < 768 ? Math.floor(this.config.particleCount * 0.5) : this.config.particleCount;

    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        vx: (Math.random() - 0.5) * this.config.speed,
        vy: (Math.random() - 0.5) * this.config.speed,
        size: Math.random() * (this.config.particleMaxSize - this.config.particleMinSize) + this.config.particleMinSize,
        color: this.config.colors[Math.floor(Math.random() * this.config.colors.length)],
        opacity: Math.random() * 0.5 + 0.3,
        pulseSpeed: Math.random() * 0.02 + 0.005,
        pulsePhase: Math.random() * Math.PI * 2,
      });
    }
  }

  bindEvents() {
    window.addEventListener('resize', () => {
      clearTimeout(this.resizeTimeout);
      this.resizeTimeout = setTimeout(() => {
        this.resize();
        this.createParticles();
      }, 200);
    });

    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.mouse.x = e.clientX - rect.left;
      this.mouse.y = e.clientY - rect.top;
    });

    this.canvas.addEventListener('mouseleave', () => {
      this.mouse.x = null;
      this.mouse.y = null;
    });
  }

  animate() {
    this.ctx.clearRect(0, 0, this.width, this.height);

    const time = Date.now() * 0.001;

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      const pulse = Math.sin(time * p.pulseSpeed * 60 + p.pulsePhase) * 0.2 + 0.8;

      if (this.mouse.x !== null) {
        const dx = p.x - this.mouse.x;
        const dy = p.y - this.mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < this.mouse.radius) {
          const force = (this.mouse.radius - dist) / this.mouse.radius;
          p.vx += (dx / dist) * force * 0.02;
          p.vy += (dy / dist) * force * 0.02;
        }
      }

      p.vx *= 0.99;
      p.vy *= 0.99;
      p.x += p.vx;
      p.y += p.vy;

      if (p.x < -10) p.x = this.width + 10;
      if (p.x > this.width + 10) p.x = -10;
      if (p.y < -10) p.y = this.height + 10;
      if (p.y > this.height + 10) p.y = -10;

      const opacity = p.opacity * pulse;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      this.ctx.fillStyle = p.color + opacity + ')';
      this.ctx.fill();

      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2);
      this.ctx.fillStyle = p.color + (opacity * 0.15) + ')';
      this.ctx.fill();

      for (let j = i + 1; j < this.particles.length; j++) {
        const p2 = this.particles[j];
        const dx = p.x - p2.x;
        const dy = p.y - p2.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < this.config.maxDistance) {
          const lineOpacity = (1 - dist / this.config.maxDistance) * 0.15;
          this.ctx.beginPath();
          this.ctx.moveTo(p.x, p.y);
          this.ctx.lineTo(p2.x, p2.y);
          this.ctx.strokeStyle = p.color + lineOpacity + ')';
          this.ctx.lineWidth = 0.5;
          this.ctx.stroke();
        }
      }
    }

    this.animationId = requestAnimationFrame(() => this.animate());
  }

  destroy() {
    cancelAnimationFrame(this.animationId);
  }
}


// ============================================
// 2. HERO TEXT ANIMATION — Cinematic Reveal
// ============================================
function initHeroAnimation() {
  const heroTitle = document.querySelector('.hero-title');
  if (!heroTitle || heroTitle.dataset.initialized) return;
  heroTitle.dataset.initialized = 'true';

  // Split text into words and characters
  const lines = heroTitle.querySelectorAll('.hero-line');

  lines.forEach((line) => {
    // Preserve gradient-text spans
    const gradientSpan = line.querySelector('.gradient-text');
    const text = line.textContent;
    line.textContent = '';

    const words = text.split(' ');
    words.forEach((word, wordIndex) => {
      const wordSpan = document.createElement('span');
      wordSpan.className = 'word';

      // Check if this word was inside gradient-text
      const isGradient = gradientSpan && gradientSpan.textContent.trim().includes(word);

      for (let i = 0; i < word.length; i++) {
        const charSpan = document.createElement('span');
        charSpan.className = 'char';
        if (isGradient) charSpan.classList.add('gradient-text');
        charSpan.textContent = word[i];
        wordSpan.appendChild(charSpan);
      }

      line.appendChild(wordSpan);

      if (wordIndex < words.length - 1) {
        const space = document.createElement('span');
        space.innerHTML = '&nbsp;';
        space.className = 'word';
        line.appendChild(space);
      }
    });
  });

  // Trigger animation sequence
  setTimeout(() => {
    const eyebrow = document.querySelector('.hero-eyebrow');
    if (eyebrow) eyebrow.classList.add('animate');

    setTimeout(() => {
      const allChars = heroTitle.querySelectorAll('.char');
      allChars.forEach((char, i) => {
        setTimeout(() => {
          char.classList.add('animate');
        }, i * 35);
      });

      const lastCharDelay = allChars.length * 35 + 300;
      setTimeout(() => {
        const subtitle = document.querySelector('.hero-subtitle');
        if (subtitle) subtitle.classList.add('animate');
      }, lastCharDelay);

      setTimeout(() => {
        const actions = document.querySelector('.hero-actions');
        if (actions) actions.classList.add('animate');
      }, lastCharDelay + 200);

    }, 400);
  }, 200);
}


// ============================================
// 3. SCROLL REVEAL — Intersection Observer
// ============================================
function initScrollReveal() {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.15,
      rootMargin: '0px 0px -40px 0px',
    }
  );

  document.querySelectorAll('.reveal').forEach((el) => {
    observer.observe(el);
  });
}


// ============================================
// 4. STAT COUNTER — Animated Numbers
// ============================================
function initStatCounters() {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const target = el.getAttribute('data-count');
          const suffix = el.getAttribute('data-suffix') || '';
          const prefix = el.getAttribute('data-prefix') || '';
          const isNumber = !isNaN(parseFloat(target));

          if (isNumber) {
            animateCount(el, 0, parseFloat(target), 2000, prefix, suffix);
          }
          observer.unobserve(el);
        }
      });
    },
    { threshold: 0.5 }
  );

  document.querySelectorAll('[data-count]').forEach((el) => {
    observer.observe(el);
  });
}

function animateCount(el, start, end, duration, prefix, suffix) {
  const startTime = performance.now();
  const isFloat = end % 1 !== 0;

  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = start + (end - start) * eased;

    el.textContent = prefix + (isFloat ? current.toFixed(1) : Math.floor(current)) + suffix;

    if (progress < 1) {
      requestAnimationFrame(update);
    }
  }

  requestAnimationFrame(update);
}


// ============================================
// 5. NAVIGATION — Scroll Effects
// ============================================
function initNavigation() {
  const nav = document.querySelector('.nav');
  const toggle = document.querySelector('.nav-toggle');
  const mobileMenu = document.querySelector('.mobile-menu');

  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      nav.classList.add('scrolled');
    } else {
      nav.classList.remove('scrolled');
    }
  });

  if (toggle && mobileMenu) {
    toggle.addEventListener('click', () => {
      toggle.classList.toggle('active');
      mobileMenu.classList.toggle('active');
      document.body.style.overflow = mobileMenu.classList.contains('active') ? 'hidden' : '';
    });

    mobileMenu.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        toggle.classList.remove('active');
        mobileMenu.classList.remove('active');
        document.body.style.overflow = '';
      });
    });
  }
}


// ============================================
// 6. FAQ — Accordion
// ============================================
function initFAQ() {
  document.querySelectorAll('.faq-question').forEach((btn) => {
    btn.addEventListener('click', () => {
      const item = btn.closest('.faq-item');
      const answer = item.querySelector('.faq-answer');
      const isActive = item.classList.contains('active');

      document.querySelectorAll('.faq-item.active').forEach((activeItem) => {
        activeItem.classList.remove('active');
        activeItem.querySelector('.faq-answer').style.maxHeight = '0';
      });

      if (!isActive) {
        item.classList.add('active');
        answer.style.maxHeight = answer.scrollHeight + 'px';
      }
    });
  });
}


// ============================================
// 7. SMOOTH SCROLL — For anchor links
// ============================================
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener('click', (e) => {
      const target = document.querySelector(link.getAttribute('href'));
      if (target) {
        e.preventDefault();
        const offset = 80;
        const top = target.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  });
}


// ============================================
// 8. MAGNETIC BUTTON EFFECT
// ============================================
function initMagneticButtons() {
  document.querySelectorAll('.btn-primary').forEach((btn) => {
    btn.addEventListener('mousemove', (e) => {
      const rect = btn.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      btn.style.transform = `translate(${x * 0.15}px, ${y * 0.15}px)`;
    });

    btn.addEventListener('mouseleave', () => {
      btn.style.transform = 'translate(0, 0)';
      btn.style.transition = 'transform 0.3s ease';
      setTimeout(() => {
        btn.style.transition = '';
      }, 300);
    });
  });
}


// ============================================
// 9. STEPS PROGRESS FILL
// ============================================
function initStepsProgress() {
  const container = document.getElementById('stepsContainer');
  if (!container) return;

  const steps = container.querySelectorAll('.step');
  const connectorFills = container.querySelectorAll('.connector-fill');

  function setProgress(hoveredStep) {
    const stepNum = parseInt(hoveredStep.getAttribute('data-step'));

    steps.forEach((step) => {
      const num = parseInt(step.getAttribute('data-step'));
      step.classList.remove('step-active', 'step-filled');

      if (num < stepNum) {
        step.classList.add('step-filled');
      } else if (num === stepNum) {
        step.classList.add('step-active');
      }
    });

    connectorFills.forEach((fill, i) => {
      // Connector 0 is between step 1 and 2, connector 1 is between step 2 and 3
      if (i + 1 < stepNum) {
        fill.classList.add('filled');
      } else {
        fill.classList.remove('filled');
      }
    });
  }

  function clearProgress() {
    steps.forEach((step) => {
      step.classList.remove('step-active', 'step-filled');
    });
    connectorFills.forEach((fill) => {
      fill.classList.remove('filled');
    });
  }

  steps.forEach((step) => {
    step.addEventListener('mouseenter', () => setProgress(step));
  });

  container.addEventListener('mouseleave', clearProgress);
}


// ============================================
// 10. SOLUTION CARD BACKGROUND ANIMATION
// ============================================
class SolutionCanvasEffect {
  constructor() {
    this.canvas = document.getElementById('solutionCanvas');
    if (!this.canvas) return;

    this.ctx = this.canvas.getContext('2d');
    this.wrapper = this.canvas.closest('.solution-cards-wrapper');
    this.cards = this.wrapper.querySelectorAll('.solution-card');
    this.particles = [];
    this.active = false;
    this.animationId = null;
    this.hoverX = 0;
    this.hoverY = 0;

    this.resize();
    this.bindEvents();

    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = window.innerWidth * dpr;
    this.canvas.height = window.innerHeight * dpr;
    this.ctx.scale(dpr, dpr);
    this.w = window.innerWidth;
    this.h = window.innerHeight;
  }

  bindEvents() {
    this.cards.forEach((card) => {
      card.addEventListener('mouseenter', (e) => {
        const cardRect = card.getBoundingClientRect();
        this.hoverX = cardRect.left + cardRect.width / 2;
        this.hoverY = cardRect.top + cardRect.height / 2;
        this.activate();
      });

      card.addEventListener('mousemove', (e) => {
        this.hoverX = e.clientX;
        this.hoverY = e.clientY;
      });

      card.addEventListener('mouseleave', () => {
        this.deactivate();
      });
    });
  }

  activate() {
    if (this.active) return;
    this.active = true;
    this.wrapper.classList.add('active');
    this.particles = [];
    this.spawnBurst();
    this.animate();
  }

  deactivate() {
    this.active = false;
    this.wrapper.classList.remove('active');
    // Let existing particles fade naturally
    setTimeout(() => {
      if (!this.active) {
        cancelAnimationFrame(this.animationId);
        this.ctx.clearRect(0, 0, this.w, this.h);
      }
    }, 800);
  }

  spawnBurst() {
    // Create a gentle burst of particles across the full screen width
    for (let i = 0; i < 50; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.5 + Math.random() * 2;
      this.particles.push({
        x: this.hoverX,
        y: this.hoverY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: Math.random() * 2.5 + 0.5,
        life: 1,
        decay: 0.003 + Math.random() * 0.006,
        color: Math.random() > 0.4
          ? [139, 92, 246]
          : [59, 130, 246],
      });
    }
  }

  animate() {
    this.ctx.clearRect(0, 0, this.w, this.h);

    // Continuously spawn ambient particles across the full viewport
    if (this.active && Math.random() > 0.4) {
      const spawnX = Math.random() * this.w;
      const spawnY = this.hoverY + (Math.random() - 0.5) * this.h * 0.6;
      this.particles.push({
        x: spawnX,
        y: spawnY,
        vx: (Math.random() - 0.5) * 0.5,
        vy: -0.3 - Math.random() * 0.8,
        size: Math.random() * 2.5 + 0.5,
        life: 1,
        decay: 0.004 + Math.random() * 0.008,
        color: Math.random() > 0.4
          ? [139, 92, 246]
          : [59, 130, 246],
      });
    }

    // Draw wide radial glow at hover point
    if (this.active) {
      const grd = this.ctx.createRadialGradient(
        this.hoverX, this.hoverY, 0,
        this.hoverX, this.hoverY, this.w * 0.5
      );
      grd.addColorStop(0, 'rgba(139, 92, 246, 0.1)');
      grd.addColorStop(0.3, 'rgba(59, 130, 246, 0.04)');
      grd.addColorStop(1, 'rgba(0, 0, 0, 0)');
      this.ctx.fillStyle = grd;
      this.ctx.fillRect(0, 0, this.w, this.h);
    }

    // Update and draw particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];

      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.995;
      p.vy *= 0.995;
      p.life -= p.decay;

      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }

      const [r, g, b] = p.color;

      // Glow
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size * 5, 0, Math.PI * 2);
      this.ctx.fillStyle = `rgba(${r},${g},${b},${p.life * 0.06})`;
      this.ctx.fill();

      // Core
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      this.ctx.fillStyle = `rgba(${r},${g},${b},${p.life * 0.45})`;
      this.ctx.fill();

      // Connect nearby particles
      for (let j = i - 1; j >= Math.max(0, i - 20); j--) {
        const p2 = this.particles[j];
        const dx = p.x - p2.x;
        const dy = p.y - p2.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 180) {
          const lineOp = (1 - dist / 180) * p.life * p2.life * 0.12;
          this.ctx.beginPath();
          this.ctx.moveTo(p.x, p.y);
          this.ctx.lineTo(p2.x, p2.y);
          this.ctx.strokeStyle = `rgba(${r},${g},${b},${lineOp})`;
          this.ctx.lineWidth = 0.5;
          this.ctx.stroke();
        }
      }
    }

    // Keep animating if particles exist or still active
    if (this.active || this.particles.length > 0) {
      this.animationId = requestAnimationFrame(() => this.animate());
    }
  }
}


// ============================================
// INIT — Run everything on DOM ready
// ============================================
document.addEventListener('DOMContentLoaded', () => {
  // Start particle canvas (runs behind intro)
  const canvas = document.getElementById('heroCanvas');
  if (canvas) {
    new ParticleConstellation(canvas);
  }

  // Launch intro sequence (hero text animation triggers after intro exits)
  const introOverlay = document.getElementById('introOverlay');
  if (introOverlay) {
    new IntroSequence();
  } else {
    // No intro — run hero animation directly
    initHeroAnimation();
  }

  // Everything else initializes immediately
  initScrollReveal();
  initStatCounters();
  initNavigation();
  initFAQ();
  initSmoothScroll();
  initMagneticButtons();
  new SolutionCanvasEffect();
  initStepsProgress();
});
