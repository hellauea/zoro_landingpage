/* ═══════════════════════════════════════════════════════
   ZORO AI v3 — Ultra-Cinematic Script
   Device-adaptive · Advanced interactions · Production grade
═══════════════════════════════════════════════════════ */

'use strict';

/* ─────────────────────────────────────────────────────
   0. DEVICE DETECTION
───────────────────────────────────────────────────── */
const Device = {
  isMobile: /iPhone|iPad|iPod|Android/i.test(navigator.userAgent),
  isIOS: /iPhone|iPad|iPod/i.test(navigator.userAgent),
  isAndroid: /Android/i.test(navigator.userAgent),
  isTouch: navigator.maxTouchPoints > 0,
  isReduced: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  isLowPower: false,
  isSafari: /^((?!chrome|android).)*safari/i.test(navigator.userAgent),
  dpr: Math.min(window.devicePixelRatio || 1, 2),
};

// Detect low-power mode heuristic
if (navigator.getBattery) {
  navigator.getBattery().then(b => {
    Device.isLowPower = b.level < 0.2 && !b.charging;
  }).catch(() => { });
}

// Apply device class to body
if (Device.isMobile) document.body.classList.add('mobile-os');
document.documentElement.dataset.device =
  Device.isIOS ? 'ios' : Device.isAndroid ? 'android' : 'desktop';

/* ─────────────────────────────────────────────────────
   1. LOADING ORCHESTRATOR
───────────────────────────────────────────────────── */
const Loader = {
  el: document.getElementById('loader'),
  fill: document.getElementById('loader-progress'),
  text: document.getElementById('loader-text'),
  progress: 0,
  steps: [
    { pct: 20, msg: 'Loading assets...' },
    { pct: 45, msg: 'Warming up Groq...' },
    { pct: 70, msg: 'Calibrating personality...' },
    { pct: 90, msg: 'Almost there...' },
    { pct: 100, msg: 'Ready.' },
  ],

  tick(target, cb) {
    const step = () => {
      this.progress = Math.min(this.progress + (Math.random() * 3 + 1.5), target);
      this.fill.style.width = this.progress + '%';
      if (this.progress < target) requestAnimationFrame(step);
      else if (cb) cb();
    };
    requestAnimationFrame(step);
  },

  run() {
    let i = 0;
    const advance = () => {
      if (i >= this.steps.length) return;
      const s = this.steps[i++];
      this.text.textContent = s.msg;
      this.tick(s.pct, () => setTimeout(advance, 160));
    };
    advance();

    // Hide after fonts + scene ready
    window.addEventListener('load', () => {
      setTimeout(() => this.hide(), 1200);
    });
    // Fallback
    setTimeout(() => this.hide(), 4000);
  },

  hide() {
    this.el.classList.add('out');
    setTimeout(() => this.el.remove(), 700);
    EntryAnimations.run();
  }
};

Loader.run();

/* ─────────────────────────────────────────────────────
   2. GSAP SETUP
───────────────────────────────────────────────────── */
gsap.registerPlugin(ScrollTrigger);
if (typeof CustomEase !== 'undefined') {
  CustomEase.create('cinematic', 'M0,0 C0.16,1 0.3,1 1,1');
  CustomEase.create('snap', 'M0,0 C0.34,1.56 0.64,1 1,1');
}

const ease = {
  c: 'power4.out',
  b: 'back.out(1.7)',
  s: 'expo.out',
  i: 'power2.inOut',
};

/* ─────────────────────────────────────────────────────
   3. CUSTOM CURSOR SYSTEM
───────────────────────────────────────────────────── */
const CursorSystem = (() => {
  if (Device.isTouch) return { init() { }, update() { } };

  const cursor = document.getElementById('cursor');
  const ring = document.getElementById('cursor-ring');
  const magEl = document.getElementById('magnetic-indicator');

  let mx = 0, my = 0, rx = 0, ry = 0;
  let trailPoints = [];
  const TRAIL_LEN = 12;

  // Trail dots
  const trails = [];
  for (let i = 0; i < TRAIL_LEN; i++) {
    const t = document.createElement('div');
    t.className = 'cursor-trail';
    t.style.opacity = (1 - i / TRAIL_LEN) * 0.35 + '';
    t.style.width = Math.max(2, 4 - i * 0.25) + 'px';
    t.style.height = Math.max(2, 4 - i * 0.25) + 'px';
    t.style.zIndex = 99990 - i;
    document.body.appendChild(t);
    trails.push({ el: t, x: 0, y: 0 });
  }

  document.addEventListener('mousemove', e => {
    mx = e.clientX; my = e.clientY;
    cursor.style.left = mx + 'px';
    cursor.style.top = my + 'px';
    trailPoints.unshift({ x: mx, y: my });
    if (trailPoints.length > TRAIL_LEN) trailPoints.pop();
  });

  // Smooth ring lag
  const raf = () => {
    rx += (mx - rx) * 0.095;
    ry += (my - ry) * 0.095;
    ring.style.left = rx + 'px';
    ring.style.top = ry + 'px';

    // Trail with momentum
    trails.forEach((t, i) => {
      const src = trailPoints[i] || trailPoints[trailPoints.length - 1] || { x: mx, y: my };
      t.x += (src.x - t.x) * 0.3;
      t.y += (src.y - t.y) * 0.3;
      t.el.style.left = t.x + 'px';
      t.el.style.top = t.y + 'px';
    });

    requestAnimationFrame(raf);
  };
  requestAnimationFrame(raf);

  // Cursor state management
  const setState = (state) => {
    document.body.classList.remove('cursor-hover', 'cursor-text', 'cursor-magnetic');
    if (state) document.body.classList.add('cursor-' + state);

    // Show/hide trails based on state
    trails.forEach(t => {
      t.el.style.display = state === 'text' ? 'none' : 'block';
    });
  };

  // Attach to hoverable elements
  const attach = (el, state = 'hover') => {
    el.addEventListener('mouseenter', () => setState(state));
    el.addEventListener('mouseleave', () => setState(null));
  };

  document.querySelectorAll('a, button').forEach(el => attach(el, 'hover'));
  document.querySelectorAll('input').forEach(el => {
    el.addEventListener('focus', () => setState('text'));
    el.addEventListener('blur', () => setState(null));
  });

  // Magnetic system
  const MAGNETIC_RANGE = 80;
  const magneticEls = document.querySelectorAll('[data-magnetic]');

  document.addEventListener('mousemove', e => {
    let nearAny = false;
    magneticEls.forEach(el => {
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < MAGNETIC_RANGE) {
        nearAny = true;
        const pull = (1 - dist / MAGNETIC_RANGE) * 12;
        gsap.to(el, {
          x: dx * pull / dist,
          y: dy * pull / dist,
          duration: 0.5, ease: ease.c, overwrite: 'auto'
        });
        setState('magnetic');

        magEl.style.left = cx + 'px';
        magEl.style.top = cy + 'px';
        magEl.classList.add('active');
      } else {
        gsap.to(el, { x: 0, y: 0, duration: 0.6, ease: ease.s, overwrite: 'auto' });
      }
    });
    if (!nearAny) {
      magEl.classList.remove('active');
      if (document.body.classList.contains('cursor-magnetic')) setState(null);
    }
  });

  return { setState };
})();

/* ─────────────────────────────────────────────────────
   4. PARTICLE SYSTEM
───────────────────────────────────────────────────── */
const ParticleSystem = (() => {
  if (Device.isLowPower || Device.isReduced) return { init() { } };

  const canvas = document.getElementById('particle-canvas');
  const ctx = canvas.getContext('2d');
  let W = 0, H = 0;
  let particles = [];
  const COUNT = Device.isMobile ? 30 : 70;

  const resize = () => {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
  };
  resize();
  window.addEventListener('resize', resize, { passive: true });

  class Particle {
    constructor() { this.reset(); }
    reset() {
      this.x = Math.random() * W;
      this.y = Math.random() * H;
      this.vx = (Math.random() - 0.5) * 0.18;
      this.vy = (Math.random() - 0.5) * 0.18;
      this.r = Math.random() * 1.2 + 0.3;
      this.alpha = Math.random() * 0.35 + 0.05;
      this.color = Math.random() > 0.6
        ? `rgba(126,232,162,${this.alpha})`
        : Math.random() > 0.5
          ? `rgba(91,192,248,${this.alpha})`
          : `rgba(255,255,255,${this.alpha})`;
    }
    update() {
      this.x += this.vx;
      this.y += this.vy;
      if (this.x < -5 || this.x > W + 5 || this.y < -5 || this.y > H + 5) this.reset();
    }
    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      ctx.fillStyle = this.color;
      ctx.fill();
    }
  }

  // Nebula blobs — slow-moving gradient orbs
  const orbs = [];
  for (let i = 0; i < 3; i++) {
    orbs.push({
      x: Math.random() * W, y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.06,
      vy: (Math.random() - 0.5) * 0.06,
      r: 180 + Math.random() * 160,
      color: i === 0 ? [126, 232, 162] : i === 1 ? [91, 192, 248] : [247, 183, 49],
    });
  }

  for (let i = 0; i < COUNT; i++) particles.push(new Particle());

  // Connection lines between nearby particles
  const drawConnections = () => {
    const MAX_DIST = Device.isMobile ? 60 : 90;
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < MAX_DIST) {
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(126,232,162,${(1 - d / MAX_DIST) * 0.06})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }
  };

  let frame = 0;
  const tick = () => {
    ctx.clearRect(0, 0, W, H);

    // Draw soft nebula
    if (frame % 2 === 0) {
      orbs.forEach(o => {
        o.x += o.vx; o.y += o.vy;
        if (o.x < -o.r || o.x > W + o.r) o.vx *= -1;
        if (o.y < -o.r || o.y > H + o.r) o.vy *= -1;
        const g = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, o.r);
        g.addColorStop(0, `rgba(${o.color.join(',')},0.012)`);
        g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.beginPath();
        ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2);
        ctx.fillStyle = g;
        ctx.fill();
      });
    }

    particles.forEach(p => { p.update(); p.draw(); });
    drawConnections();
    frame++;
    requestAnimationFrame(tick);
  };
  tick();

  return {};
})();

/* ─────────────────────────────────────────────────────
   5. THREE.JS SCENE
───────────────────────────────────────────────────── */
const ThreeScene = (() => {
  const canvas = document.getElementById('webgl-canvas');
  const renderer = new THREE.WebGLRenderer({
    canvas, antialias: !Device.isMobile, alpha: true,
    powerPreference: 'high-performance'
  });
  renderer.setPixelRatio(Math.min(Device.dpr, Device.isMobile ? 1.5 : 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.3;
  renderer.shadowMap.enabled = !Device.isMobile;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 300);
  camera.position.set(0, 0, 9);

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }, { passive: true });

  /* LIGHTS */
  scene.add(new THREE.AmbientLight(0xffffff, 0.1));

  const keyLight = new THREE.DirectionalLight(0x7EE8A2, 4.5);
  keyLight.position.set(5, 9, 6);
  if (!Device.isMobile) {
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(1024, 1024);
  }
  scene.add(keyLight);

  const fillLight = new THREE.DirectionalLight(0x5BC0F8, 2.2);
  fillLight.position.set(-7, -3, 4);
  scene.add(fillLight);

  const rimLight = new THREE.DirectionalLight(0xF7B731, 1.6);
  rimLight.position.set(2, -6, -5);
  scene.add(rimLight);

  const pointGlow = new THREE.PointLight(0x7EE8A2, 3.5, 16);
  const pointGlow2 = new THREE.PointLight(0x5BC0F8, 2.0, 12);
  const pointGlow3 = new THREE.PointLight(0xF7B731, 1.0, 10);
  pointGlow.position.set(0, 2, 5);
  pointGlow2.position.set(-4, -2, 3);
  pointGlow3.position.set(4, 4, -2);
  scene.add(pointGlow, pointGlow2, pointGlow3);

  /* ORB GROUP */
  const group = new THREE.Group();
  scene.add(group);

  // Core — icosahedron metallic
  const coreMat = new THREE.MeshStandardMaterial({
    color: 0x060610, roughness: 0.025, metalness: 0.99,
  });
  group.add(new THREE.Mesh(new THREE.IcosahedronGeometry(1.45, 5), coreMat));

  // Mid shell — translucent tint
  const midMat = new THREE.MeshStandardMaterial({
    color: 0x0e2a1a, roughness: 0.12, metalness: 0.65,
    transparent: true, opacity: 0.3,
  });
  group.add(new THREE.Mesh(new THREE.IcosahedronGeometry(1.6, 5), midMat));

  // Wireframe cage — outer
  const wireMat = new THREE.MeshBasicMaterial({
    color: 0x7EE8A2, wireframe: true, transparent: true, opacity: 0.055
  });
  const wireMesh = new THREE.Mesh(new THREE.IcosahedronGeometry(1.65, 2), wireMat);
  group.add(wireMesh);

  // Second wireframe — different freq
  const wireMat2 = new THREE.MeshBasicMaterial({
    color: 0x5BC0F8, wireframe: true, transparent: true, opacity: 0.025
  });
  group.add(new THREE.Mesh(new THREE.IcosahedronGeometry(1.9, 1), wireMat2));

  // Glow sphere — back-face
  const glowMat = new THREE.MeshStandardMaterial({
    color: 0x7EE8A2, roughness: 1, transparent: true, opacity: 0.03,
    side: THREE.BackSide,
  });
  const glowMesh = new THREE.Mesh(new THREE.SphereGeometry(2.1, 32, 32), glowMat);
  group.add(glowMesh);

  // Orbital rings
  const makeRing = (r, tube, color, rx, ry, rz) => {
    const m = new THREE.Mesh(
      new THREE.TorusGeometry(r, tube, 8, 100),
      new THREE.MeshStandardMaterial({
        color, roughness: 0.04, metalness: 0.97,
        transparent: true, opacity: 0.6
      })
    );
    m.rotation.set(rx, ry, rz);
    return m;
  };

  const ring1 = makeRing(2.2, 0.014, 0x7EE8A2, Math.PI / 2, 0, 0);
  const ring2 = makeRing(2.42, 0.01, 0x5BC0F8, Math.PI / 4, Math.PI / 6, 0);
  const ring3 = makeRing(2.62, 0.008, 0xF7B731, -Math.PI / 3, Math.PI / 3, Math.PI / 5);
  const ring4 = makeRing(2.0, 0.006, 0xa78bfa, Math.PI / 6, -Math.PI / 4, Math.PI / 3);
  group.add(ring1, ring2, ring3, ring4);

  // Stars / particles
  const N = Device.isMobile ? 250 : 600;
  const starGeo = new THREE.BufferGeometry();
  const starPos = new Float32Array(N * 3);
  const starCol = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const r = 4 + Math.random() * 20;
    starPos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    starPos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    starPos[i * 3 + 2] = r * Math.cos(phi);
    // Color variety
    const mix = Math.random();
    if (mix < 0.5) {
      starCol[i * 3] = 0.494; starCol[i * 3 + 1] = 0.906; starCol[i * 3 + 2] = 0.635; // green
    } else if (mix < 0.75) {
      starCol[i * 3] = 0.357; starCol[i * 3 + 1] = 0.753; starCol[i * 3 + 2] = 0.973; // blue
    } else {
      starCol[i * 3] = 1; starCol[i * 3 + 1] = 1; starCol[i * 3 + 2] = 1; // white
    }
  }
  starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
  starGeo.setAttribute('color', new THREE.BufferAttribute(starCol, 3));
  const starMat = new THREE.PointsMaterial({
    size: 0.028, transparent: true, opacity: 0.4,
    sizeAttenuation: true, vertexColors: true,
  });
  group.add(new THREE.Points(starGeo, starMat));

  /* SCROLL STATE */
  const S = {
    posX: 0, posY: 0, posZ: 0,
    rotX: 0, rotY: 0, rotZ: 0,
    scale: 1, camZ: 9, camY: 0,
    starOpacity: 0.4, glowOpacity: 0.03,
    wireOpacity: 0.055, colorShift: 0,
  };

  // Only run full scroll timeline on desktop
  if (!Device.isMobile) {
    gsap.registerPlugin(ScrollTrigger);

    const masterTL = gsap.timeline({
      scrollTrigger: {
        trigger: '#scroll-container',
        start: 'top top',
        end: 'bottom bottom',
        scrub: 2.2,
      }
    });

    masterTL
      .to(S, { posX: 0, posY: 0, posZ: 0, rotY: Math.PI * 0.3, scale: 1, camZ: 9, camY: 0, duration: 0.12 }, 0)
      .to(S, { posX: 3.6, posY: -0.3, posZ: 1.0, rotX: 0.2, rotY: Math.PI * 0.9, rotZ: -0.1, scale: 0.88, camZ: 7.5, camY: -0.2, starOpacity: 0.65, duration: 0.16 }, 0.12)
      .to(S, { posX: -3.5, posY: -1.4, posZ: 0.8, rotX: -0.15, rotY: Math.PI * 1.5, rotZ: 0.15, scale: 0.82, camZ: 7.8, camY: -1.1, starOpacity: 0.8, glowOpacity: 0.06, duration: 0.16 }, 0.28)
      .to(S, { posX: 3.8, posY: -2.8, posZ: -0.5, rotX: 0.3, rotY: Math.PI * 2.2, rotZ: -0.2, scale: 0.77, camZ: 8.8, camY: -2.4, starOpacity: 0.95, glowOpacity: 0.09, colorShift: 1, duration: 0.16 }, 0.44)
      .to(S, { posX: -4.0, posY: -4.2, posZ: 0.8, rotX: -0.1, rotY: Math.PI * 2.95, rotZ: 0.13, scale: 0.77, camZ: 8.2, camY: -3.7, starOpacity: 0.88, colorShift: 2, duration: 0.16 }, 0.60)
      .to(S, { posX: 0, posY: -6.0, posZ: 0, rotX: 0, rotY: Math.PI * 3.6, rotZ: 0, scale: 1.08, camZ: 7.2, camY: -5.4, starOpacity: 1.0, glowOpacity: 0.14, colorShift: 0, duration: 0.14 }, 0.76)
      .to(S, { posX: 0, posY: -7.5, posZ: 2.0, rotX: 0, rotY: Math.PI * 4.3, rotZ: 0, scale: 1.2, camZ: 6.5, camY: -7.0, starOpacity: 1.0, glowOpacity: 0.22, duration: 0.10 }, 0.90);
  }

  /* RENDER LOOP */
  let time = 0;
  let smX = 0, smY = 0;
  let mouseNX = 0, mouseNY = 0;

  if (!Device.isTouch) {
    document.addEventListener('mousemove', e => {
      mouseNX = (e.clientX / window.innerWidth - 0.5) * 2;
      mouseNY = (e.clientY / window.innerHeight - 0.5) * 2;
    }, { passive: true });
  }

  // Color shift helpers
  const accent2Color = new THREE.Color(0x5BC0F8);
  const accentColor = new THREE.Color(0x7EE8A2);
  const accentColor3 = new THREE.Color(0xF7B731);

  (function render() {
    requestAnimationFrame(render);
    time += 0.008;

    smX += (mouseNX - smX) * 0.04;
    smY += (mouseNY - smY) * 0.04;

    // Breathe + drift
    group.position.x = S.posX + Math.sin(time * 0.38) * 0.05;
    group.position.y = S.posY + Math.sin(time * 0.27) * 0.04;
    group.position.z = S.posZ;

    group.rotation.x = S.rotX + Math.sin(time * 0.21) * 0.02 + smY * 0.07;
    group.rotation.y = S.rotY + time * 0.12 + smX * 0.08;
    group.rotation.z = S.rotZ + Math.cos(time * 0.17) * 0.013;

    const breathe = 1 + Math.sin(time * 0.45) * 0.009;
    group.scale.setScalar(S.scale * breathe);

    // Camera parallax
    camera.position.z = S.camZ;
    camera.position.y = S.camY + smY * 0.16;
    camera.position.x = smX * 0.20;
    camera.lookAt(S.posX * 0.2, S.posY + S.camY * 0.5, 0);

    // Ring individual rotations — gyroscope feel
    ring1.rotation.y += 0.003;
    ring1.rotation.z += 0.0008;
    ring2.rotation.x += 0.002;
    ring2.rotation.y -= 0.0012;
    ring3.rotation.z += 0.0025;
    ring3.rotation.x -= 0.001;
    ring4.rotation.y += 0.0018;
    ring4.rotation.z += 0.002;

    // Breathing light
    pointGlow.intensity = 3.5 + Math.sin(time * 1.1) * 0.8;
    pointGlow.position.y = 2 + Math.sin(time * 0.44) * 0.7;
    pointGlow2.intensity = 2.0 + Math.cos(time * 0.75) * 0.5;
    pointGlow3.intensity = 1.0 + Math.sin(time * 0.6 + 1) * 0.35;

    // Material scroll-driven updates
    starMat.opacity = S.starOpacity;
    glowMat.opacity = S.glowOpacity;
    wireMat.opacity = S.wireOpacity + Math.sin(time * 0.8) * 0.02;

    // Color shift on keylight
    if (S.colorShift > 0.5) {
      keyLight.color.lerp(accent2Color, 0.02);
    } else {
      keyLight.color.lerp(accentColor, 0.02);
    }

    renderer.render(scene, camera);
  })();

  return {};
})();

/* ─────────────────────────────────────────────────────
   6. FIREBASE
───────────────────────────────────────────────────── */
let db = null;
try {
  const firebaseConfig = {
    apiKey: "AIzaSyB0no1vE-HZIhQlIRjyfyWXZ_1r23ECd1c",
    authDomain: "zoro-ai-3417b.firebaseapp.com",
    projectId: "zoro-ai-3417b",
    storageBucket: "zoro-ai-3417b.firebasestorage.app",
    messagingSenderId: "261396836659",
    appId: "1:261396836659:web:c39ce50f64130d1ea1ce46",
  };
  firebase.initializeApp(firebaseConfig);
  db = firebase.firestore();
} catch (e) { console.warn('Firebase init failed:', e); }

/* ─────────────────────────────────────────────────────
   7. SCROLL PROGRESS BAR
───────────────────────────────────────────────────── */
const progressFill = document.getElementById('progress-fill');
window.addEventListener('scroll', () => {
  const pct = window.scrollY / (document.body.scrollHeight - window.innerHeight) * 100;
  progressFill.style.width = Math.min(pct, 100) + '%';
}, { passive: true });

/* ─────────────────────────────────────────────────────
   8. NAV SCROLL BEHAVIOR
───────────────────────────────────────────────────── */
const nav = document.getElementById('nav');
const navLogo = document.getElementById('nav-logo');
let navScrolled = false;

window.addEventListener('scroll', () => {
  const s = window.scrollY > 60;
  if (s !== navScrolled) {
    navScrolled = s;
    nav.classList.toggle('scrolled', s);
  }
}, { passive: true });

/* ─────────────────────────────────────────────────────
   9. MOBILE DRAWER
───────────────────────────────────────────────────── */
const hamburger = document.getElementById('nav-hamburger');
const drawer = document.getElementById('mobile-drawer');
const drawerClose = document.getElementById('drawer-close');
const drawerBackdrop = drawer.querySelector('.drawer-backdrop');

const openDrawer = () => {
  drawer.classList.add('open');
  hamburger.classList.add('open');
  hamburger.setAttribute('aria-expanded', 'true');
  document.body.style.overflow = 'hidden';
};
const closeDrawer = () => {
  drawer.classList.remove('open');
  hamburger.classList.remove('open');
  hamburger.setAttribute('aria-expanded', 'false');
  document.body.style.overflow = '';
};

hamburger.addEventListener('click', openDrawer);
drawerClose.addEventListener('click', closeDrawer);
drawerBackdrop.addEventListener('click', closeDrawer);

// Close on drawer link click
drawer.querySelectorAll('.drawer-link, .drawer-cta').forEach(el => {
  el.addEventListener('click', closeDrawer);
});

// Close on Escape
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeDrawer();
});

/* ─────────────────────────────────────────────────────
   10. ENTRY ANIMATIONS
───────────────────────────────────────────────────── */
const EntryAnimations = {
  run() {
    const tl = gsap.timeline({ delay: 0.1 });

    // Badge
    tl.to('#hero-badge', { opacity: 1, y: 0, duration: 0.9, ease: ease.s });

    // Title lines — clip reveal
    document.querySelectorAll('.tl-inner').forEach((el, i) => {
      tl.to(el, { y: '0%', duration: 1.2, ease: ease.c }, `-=${i === 0 ? 0 : 0.7}`);
    });

    tl.to('#hero-sub', { opacity: 1, y: 0, duration: 1.0, ease: ease.c }, '-=0.55')
      .to('#hero-email-bar', { opacity: 1, y: 0, duration: 0.9, ease: ease.c }, '-=0.6')
      .to('#hero-proof', { opacity: 1, y: 0, duration: 0.8, ease: ease.c }, '-=0.5')
      .to('#scroll-hint', { opacity: 1, duration: 1.2, ease: ease.i }, '-=0.3');

    // Floating data nodes
    if (!Device.isMobile) {
      setTimeout(() => {
        document.querySelectorAll('.data-node').forEach((n, i) => {
          setTimeout(() => n.style.opacity = '1', i * 250 + 600);
        });
      }, 1000);
    }
  }
};

/* ─────────────────────────────────────────────────────
   11. SCROLL ANIMATIONS
───────────────────────────────────────────────────── */

// Helper: run on enter/leave
const onReveal = (id, onEnter, onLeave, start = 'top 76%') => {
  const el = document.getElementById(id);
  if (!el) return;
  ScrollTrigger.create({
    trigger: el,
    start,
    onEnter: () => onEnter(el),
    onLeaveBack: onLeave ? () => onLeave(el) : undefined,
  });
};

// Feature cards
['card-1', 'card-2', 'card-3', 'card-4'].forEach((id, i) => {
  const dir = i % 2 === 0 ? -60 : 60;
  onReveal(id, el => {
    el.classList.add('revealed');
    gsap.to(el, { opacity: 1, x: 0, y: 0, duration: 1.2, ease: ease.c });
  }, el => {
    el.classList.remove('revealed');
    gsap.to(el, { opacity: 0, x: dir, y: 0, duration: 0.5, ease: 'power2.in' });
  });
});

// Chat demo — sequential bubble reveal
const chatBubbles = document.querySelectorAll('.bubble');
let chatRevealed = false;

ScrollTrigger.create({
  trigger: '#chat-demo-1',
  start: 'top 75%',
  onEnter: () => {
    gsap.to('#chat-demo-1', { opacity: 1, y: 0, scale: 1, duration: 1.1, ease: ease.c });
    if (!chatRevealed) {
      chatRevealed = true;
      chatBubbles.forEach((b, i) => {
        setTimeout(() => b.classList.add('visible'), i * 350 + 200);
      });
    }
  },
  onLeaveBack: () => {
    gsap.to('#chat-demo-1', { opacity: 0, y: 36, scale: 0.96, duration: 0.5, ease: 'power2.in' });
    chatBubbles.forEach(b => b.classList.remove('visible'));
    chatRevealed = false;
  }
});

// Memory demo
let memoryRevealed = false;
ScrollTrigger.create({
  trigger: '#memory-demo',
  start: 'top 75%',
  onEnter: () => {
    gsap.to('#memory-demo', { opacity: 1, y: 0, scale: 1, duration: 1.1, ease: ease.c });
    if (!memoryRevealed) {
      memoryRevealed = true;
      const entries = document.querySelectorAll('.memory-entry');
      entries.forEach((e, i) => {
        setTimeout(() => {
          e.classList.add('visible');
          e.style.transitionDelay = '0s';
        }, i * 180 + 200);
      });
      // Draw mini memory graph
      drawMemoryGraph();
    }
  },
  onLeaveBack: () => {
    gsap.to('#memory-demo', { opacity: 0, y: 36, scale: 0.96, duration: 0.5, ease: 'power2.in' });
    document.querySelectorAll('.memory-entry').forEach(e => e.classList.remove('visible'));
    memoryRevealed = false;
  }
});

// Capability grid
onReveal('cap-grid', el => {
  gsap.to(el, { opacity: 1, y: 0, scale: 1, duration: 1.0, ease: ease.c });
  el.querySelectorAll('.cap-item').forEach((c, i) => {
    gsap.from(c, { opacity: 0, y: 20, duration: 0.7, delay: i * 0.1, ease: ease.c });
  });
}, el => {
  gsap.to(el, { opacity: 0, y: 30, scale: 0.96, duration: 0.5, ease: 'power2.in' });
});

// Platform showcase
onReveal('platform-demo', el => {
  gsap.to(el, { opacity: 1, y: 0, scale: 1, duration: 1.0, ease: ease.c });
  revealMiniChat();
}, el => {
  gsap.to(el, { opacity: 0, y: 30, scale: 0.96, duration: 0.5, ease: 'power2.in' });
});

// Stats — counter animation
['stat-1', 'stat-2', 'stat-3'].forEach((id, i) => {
  ScrollTrigger.create({
    trigger: '#' + id,
    start: 'top 80%',
    onEnter: () => {
      const el = document.getElementById(id);
      gsap.to(el, {
        opacity: 1, y: 0, duration: 0.9, delay: i * 0.12, ease: ease.s,
        onComplete: () => {
          el.classList.add('revealed');
          const numEl = el.querySelector('.stat-num[data-target]');
          if (numEl) animateCounter(numEl);
        }
      });
    },
    onLeaveBack: () => {
      const el = document.getElementById(id);
      el.classList.remove('revealed');
      gsap.to(el, { opacity: 0, y: 24, duration: 0.45, ease: 'power2.in' });
      const numEl = el.querySelector('.stat-num[data-target]');
      if (numEl) numEl.textContent = '0';
    }
  });
});

// CTA section
ScrollTrigger.create({
  trigger: '#cta-section',
  start: 'top 68%',
  onEnter: () => {
    const tl = gsap.timeline();
    tl.to('#cta-label', { opacity: 1, duration: 0.7, ease: ease.c })
      .to('#cta-title', { opacity: 1, y: 0, duration: 1.1, ease: ease.s }, '-=0.3')
      .to('#cta-body', { opacity: 1, duration: 0.8, ease: ease.c }, '-=0.5')
      .to('#cta-email-bar', { opacity: 1, y: 0, duration: 0.8, ease: ease.c }, '-=0.45')
      .to('#cta-proof', { opacity: 1, y: 0, duration: 0.7, ease: ease.c }, '-=0.4')
      .to('#cta-links', { opacity: 1, y: 0, duration: 0.7, ease: ease.c }, '-=0.3');

    document.getElementById('cta-title').classList.add('revealed');
  }
});

/* ─────────────────────────────────────────────────────
   12. COUNTER ANIMATION
───────────────────────────────────────────────────── */
const animateCounter = (el) => {
  const target = parseInt(el.dataset.target);
  const prefix = el.dataset.prefix || '';
  const suffix = el.dataset.suffix || '';
  let start = null;
  const duration = 1200;

  const step = (ts) => {
    if (!start) start = ts;
    const progress = Math.min((ts - start) / duration, 1);
    // Ease out expo
    const eased = 1 - Math.pow(1 - progress, 4);
    const value = Math.round(eased * target);
    el.textContent = prefix + value + suffix;
    if (progress < 1) requestAnimationFrame(step);
    else el.textContent = prefix + target + suffix;
  };
  requestAnimationFrame(step);
};

/* ─────────────────────────────────────────────────────
   13. MEMORY GRAPH SPARKLINE
───────────────────────────────────────────────────── */
const drawMemoryGraph = () => {
  const canvas = document.getElementById('mem-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  const data = [12, 18, 15, 24, 20, 28, 25, 35, 30, 40, 38, 48, 45, 55, 52];

  ctx.clearRect(0, 0, W, H);

  const max = Math.max(...data);
  const pts = data.map((v, i) => ({
    x: (i / (data.length - 1)) * W,
    y: H - (v / max) * (H - 8) - 4,
  }));

  // Area fill
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, 'rgba(126,232,162,0.15)');
  grad.addColorStop(1, 'rgba(126,232,162,0)');
  ctx.beginPath();
  ctx.moveTo(pts[0].x, H);
  pts.forEach(p => ctx.lineTo(p.x, p.y));
  ctx.lineTo(pts[pts.length - 1].x, H);
  ctx.closePath();
  ctx.fillStyle = grad;
  ctx.fill();

  // Line
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  pts.forEach((p, i) => {
    if (i === 0) return;
    const prev = pts[i - 1];
    const cpx = (prev.x + p.x) / 2;
    ctx.bezierCurveTo(cpx, prev.y, cpx, p.y, p.x, p.y);
  });
  ctx.strokeStyle = 'rgba(126,232,162,0.7)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Last point dot
  const last = pts[pts.length - 1];
  ctx.beginPath();
  ctx.arc(last.x, last.y, 3, 0, Math.PI * 2);
  ctx.fillStyle = '#7EE8A2';
  ctx.fill();
  ctx.beginPath();
  ctx.arc(last.x, last.y, 6, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(126,232,162,0.2)';
  ctx.fill();
};

/* ─────────────────────────────────────────────────────
   14. MINI CHAT REVEAL (Platform demo)
───────────────────────────────────────────────────── */
const revealMiniChat = () => {
  const bubbles = document.querySelectorAll('.mini-bubble');
  const typing = document.querySelector('.mini-typing');
  bubbles.forEach((b, i) => {
    setTimeout(() => b.classList.add('visible'), i * 300 + 300);
  });
  setTimeout(() => typing && typing.classList.add('visible'), bubbles.length * 300 + 500);
};

/* ─────────────────────────────────────────────────────
   15. PLATFORM SWITCHER
───────────────────────────────────────────────────── */
const platLabels = document.querySelectorAll('.plat-label');
const platContent = {
  ios: { bg: '#1c1c1e', accent: '#7EE8A2' },
  android: { bg: '#121212', accent: '#5BC0F8' },
  web: { bg: '#050507', accent: '#F7B731' },
};

platLabels.forEach(btn => {
  btn.addEventListener('click', () => {
    platLabels.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const plat = btn.dataset.plat;
    const screen = document.querySelector('.device-screen');
    if (screen && platContent[plat]) {
      gsap.to(screen, { background: platContent[plat].bg, duration: 0.4, ease: ease.i });
    }
  });
});

/* ─────────────────────────────────────────────────────
   16. EMAIL FORMS + VALIDATION
───────────────────────────────────────────────────── */
const validateEmail = e => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim());

const shakeEl = (el) => {
  gsap.killTweensOf(el);
  const tl = gsap.timeline();
  tl.to(el, { x: -9, duration: 0.06 })
    .to(el, { x: 9, duration: 0.06 })
    .to(el, { x: -6, duration: 0.05 })
    .to(el, { x: 6, duration: 0.05 })
    .to(el, { x: 0, duration: 0.12, ease: ease.b });

  // Flash border
  gsap.to(el, {
    borderColor: 'rgba(247,183,49,0.65)', duration: 0.18,
    yoyo: true, repeat: 3,
    onComplete: () => gsap.set(el, { clearProps: 'borderColor' })
  });
};

const showToast = () => {
  const toast = document.getElementById('toast');
  toast.classList.add('show');
  // Haptic on mobile
  if (navigator.vibrate) navigator.vibrate([50, 30, 80]);
  setTimeout(() => toast.classList.remove('show'), 5500);
};

document.getElementById('toast-close').addEventListener('click', () => {
  document.getElementById('toast').classList.remove('show');
});

const submitEmail = async (email, source) => {
  if (!db) return false;
  try {
    await db.collection('early_access').add({
      email: email.trim(),
      source,
      device: Device.isIOS ? 'ios' : Device.isAndroid ? 'android' : 'desktop',
      timestamp: firebase.firestore.FieldValue.serverTimestamp(),
    });
    return true;
  } catch (err) {
    console.error('Firestore:', err);
    return false;
  }
};

const handleEmailBar = async (inputId, btnId, labelId, barId, source) => {
  const input = document.getElementById(inputId);
  const btn = document.getElementById(btnId);
  const label = document.getElementById(labelId);
  const bar = document.getElementById(barId);
  if (!input || !btn) return;

  const email = input.value;
  if (!validateEmail(email)) {
    shakeEl(bar);
    input.focus();
    return;
  }

  // Loading state
  label.textContent = 'Locking you in...';
  btn.disabled = true;
  gsap.to(btn, { opacity: 0.7, scale: 0.97, duration: 0.2 });

  const ok = await submitEmail(email, source);

  if (ok) {
    // Success
    gsap.to(bar, {
      borderColor: 'rgba(126,232,162,0.55)',
      boxShadow: '0 0 0 4px rgba(126,232,162,0.09), 0 0 50px rgba(126,232,162,0.18)',
      duration: 0.4
    });
    gsap.to(btn.querySelector('.btn-bg'), { background: '#7EE8A2', duration: 0.3 });
    gsap.to(btn, { scale: 1, opacity: 1, duration: 0.2 });
    label.textContent = '✓ You\'re in!';

    setTimeout(() => {
      showToast();
      input.value = '';
      label.textContent = source === 'hero' ? 'Get Early Access' : 'Join Waitlist';
      btn.disabled = false;
      gsap.to(bar, { borderColor: 'rgba(255,255,255,0.09)', boxShadow: 'none', duration: 0.6 });
      gsap.to(btn.querySelector('.btn-bg'), { background: 'var(--accent)', duration: 0.4 });
    }, 1800);
  } else {
    label.textContent = 'Try again →';
    btn.disabled = false;
    gsap.to(btn, { scale: 1, opacity: 1, duration: 0.2 });
    shakeEl(btn);
  }
};

// Hero
document.getElementById('hero-join-btn').addEventListener('click', () =>
  handleEmailBar('hero-email-input', 'hero-join-btn', 'hero-btn-label', 'hero-email-bar', 'hero'));
document.getElementById('hero-email-input').addEventListener('keydown', e => {
  if (e.key === 'Enter') handleEmailBar('hero-email-input', 'hero-join-btn', 'hero-btn-label', 'hero-email-bar', 'hero');
});

// CTA
document.getElementById('cta-join-btn').addEventListener('click', () =>
  handleEmailBar('cta-email-input', 'cta-join-btn', 'cta-btn-label', 'cta-email-bar', 'cta'));
document.getElementById('cta-email-input').addEventListener('keydown', e => {
  if (e.key === 'Enter') handleEmailBar('cta-email-input', 'cta-join-btn', 'cta-btn-label', 'cta-email-bar', 'cta');
});

/* ─────────────────────────────────────────────────────
   17. CAPABILITY CARD HOVER AUDIO FEEDBACK
       (tactile click on desktop via Web Audio API)
───────────────────────────────────────────────────── */
if (!Device.isTouch && !Device.isReduced) {
  const AC = new (window.AudioContext || window.webkitAudioContext)();

  const click = (freq = 800) => {
    const osc = AC.createOscillator();
    const gain = AC.createGain();
    osc.connect(gain);
    gain.connect(AC.destination);
    osc.frequency.setValueAtTime(freq, AC.currentTime);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.6, AC.currentTime + 0.08);
    gain.gain.setValueAtTime(0.03, AC.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, AC.currentTime + 0.12);
    osc.start(AC.currentTime);
    osc.stop(AC.currentTime + 0.12);
  };

  document.querySelectorAll('.cap-item, .tag').forEach(el => {
    el.addEventListener('mouseenter', () => {
      if (AC.state === 'suspended') AC.resume();
      click(600 + Math.random() * 200);
    });
  });

  document.querySelectorAll('.hero-join-btn, .cta-join-btn').forEach(el => {
    el.addEventListener('click', () => {
      if (AC.state === 'suspended') AC.resume();
      click(1200);
      setTimeout(() => click(900), 80);
    });
  });
}

/* ─────────────────────────────────────────────────────
   18. SMOOTH ANCHOR NAVIGATION
───────────────────────────────────────────────────── */
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const target = document.querySelector(a.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    closeDrawer();

    const top = target.getBoundingClientRect().top + window.scrollY - 80;
    window.scrollTo({ top, behavior: 'smooth' });
  });
});

/* ─────────────────────────────────────────────────────
   19. INTERSECTION OBSERVER FALLBACK
       (for very slow devices — immediate reveal)
───────────────────────────────────────────────────── */
if (Device.isReduced || Device.isLowPower) {
  document.querySelectorAll(
    '.feature-card, .chat-demo, .memory-demo, .capability-grid, .platform-showcase, .stat-item, .cta-label, .cta-title, .cta-body, .cta-email-bar, .cta-proof, .cta-links'
  ).forEach(el => {
    el.style.opacity = '1';
    el.style.transform = 'none';
  });
  document.querySelectorAll('.bubble, .memory-entry, .mini-bubble').forEach(el => {
    el.classList.add('visible');
  });
  EntryAnimations.run();
}

/* ─────────────────────────────────────────────────────
   20. CLEANUP
───────────────────────────────────────────────────── */
window.addEventListener('beforeunload', () => {
  ScrollTrigger.killAll();
});