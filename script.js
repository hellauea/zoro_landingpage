/* ═══════════════════════════════════════════════
   ZORO AI — Cinematic Script v2.0
   Three.js r128 · GSAP 3.12 · ScrollTrigger
═══════════════════════════════════════════════ */

gsap.registerPlugin(ScrollTrigger);

/* ═══════════════════════════════════════════════
   0. FIREBASE
═══════════════════════════════════════════════ */
const firebaseConfig = {
  apiKey: "AIzaSyB0no1vE-HZIhQlIRjyfyWXZ_1r23ECd1c",
  authDomain: "zoro-ai-3417b.firebaseapp.com",
  projectId: "zoro-ai-3417b",
  storageBucket: "zoro-ai-3417b.firebasestorage.app",
  messagingSenderId: "261396836659",
  appId: "1:261396836659:web:c39ce50f64130d1ea1ce46"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

/* ═══════════════════════════════════════════════
   1. CUSTOM CURSOR
═══════════════════════════════════════════════ */
const cursor = document.getElementById('cursor');
const ring   = document.getElementById('cursor-ring');
let mx = window.innerWidth / 2,
    my = window.innerHeight / 2,
    rx = mx, ry = my;

document.addEventListener('mousemove', e => {
  mx = e.clientX; my = e.clientY;
  cursor.style.left = mx + 'px';
  cursor.style.top  = my + 'px';
});

(function tickCursor() {
  rx += (mx - rx) * 0.11;
  ry += (my - ry) * 0.11;
  ring.style.left = rx + 'px';
  ring.style.top  = ry + 'px';
  requestAnimationFrame(tickCursor);
})();

// Scale cursor on hoverable elements
document.querySelectorAll('a, button, input').forEach(el => {
  el.addEventListener('mouseenter', () => {
    gsap.to(cursor, { width: 14, height: 14, duration: 0.25, ease: 'power2.out' });
    gsap.to(ring,   { width: 52, height: 52, borderColor: 'rgba(126,232,162,0.7)', duration: 0.3, ease: 'power2.out' });
  });
  el.addEventListener('mouseleave', () => {
    gsap.to(cursor, { width: 8, height: 8, duration: 0.25, ease: 'power2.out' });
    gsap.to(ring,   { width: 34, height: 34, borderColor: 'rgba(126,232,162,0.4)', duration: 0.3, ease: 'power2.out' });
  });
});

/* ═══════════════════════════════════════════════
   2. PROGRESS BAR
═══════════════════════════════════════════════ */
const progressBar = document.getElementById('progress-bar');
window.addEventListener('scroll', () => {
  const pct = window.scrollY / (document.body.scrollHeight - window.innerHeight) * 100;
  progressBar.style.width = Math.min(pct, 100) + '%';
}, { passive: true });

/* ═══════════════════════════════════════════════
   3. THREE.JS SCENE
═══════════════════════════════════════════════ */
const canvas   = document.getElementById('webgl-canvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping         = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;
renderer.shadowMap.enabled   = true;
renderer.shadowMap.type      = THREE.PCFSoftShadowMap;

const scene  = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.1, 300);
camera.position.set(0, 0, 9);

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
}, { passive: true });

/* ── LIGHTS ── */
scene.add(new THREE.AmbientLight(0xffffff, 0.12));

const keyLight = new THREE.DirectionalLight(0x7EE8A2, 4.0);
keyLight.position.set(5, 9, 6);
keyLight.castShadow = true;
scene.add(keyLight);

const fillLight = new THREE.DirectionalLight(0x5BC0F8, 2.0);
fillLight.position.set(-7, -3, 4);
scene.add(fillLight);

const rimLight = new THREE.DirectionalLight(0xF7B731, 1.4);
rimLight.position.set(2, -6, -5);
scene.add(rimLight);

const pointGlow = new THREE.PointLight(0x7EE8A2, 3.0, 15);
pointGlow.position.set(0, 2, 5);
scene.add(pointGlow);

const pointGlow2 = new THREE.PointLight(0x5BC0F8, 1.5, 10);
pointGlow2.position.set(-4, -2, 3);
scene.add(pointGlow2);

/* ── 3D ORB GROUP ── */
const group = new THREE.Group();
scene.add(group);

// Core – icosahedron, near-mirror metallic
const coreGeo = new THREE.IcosahedronGeometry(1.45, 4);
const coreMat = new THREE.MeshStandardMaterial({
  color: 0x080812,
  roughness: 0.04,
  metalness: 0.98,
});
group.add(new THREE.Mesh(coreGeo, coreMat));

// Mid shell – slightly larger, translucent tinted
const midGeo = new THREE.IcosahedronGeometry(1.58, 4);
const midMat = new THREE.MeshStandardMaterial({
  color: 0x0f2218,
  roughness: 0.15,
  metalness: 0.6,
  transparent: true,
  opacity: 0.35,
});
group.add(new THREE.Mesh(midGeo, midMat));

// Wireframe cage
const wireGeo = new THREE.IcosahedronGeometry(1.62, 1);
const wireMat = new THREE.MeshBasicMaterial({ color: 0x7EE8A2, wireframe: true, transparent: true, opacity: 0.07 });
group.add(new THREE.Mesh(wireGeo, wireMat));

// Glow back shell
const glowGeo = new THREE.SphereGeometry(1.85, 32, 32);
const glowMat = new THREE.MeshStandardMaterial({
  color: 0x7EE8A2, roughness: 1, transparent: true, opacity: 0.035, side: THREE.BackSide,
});
group.add(new THREE.Mesh(glowGeo, glowMat));

// Orbital rings
function makeRing(r, tube, color, rx, ry, rz) {
  const m = new THREE.Mesh(
    new THREE.TorusGeometry(r, tube, 8, 90),
    new THREE.MeshStandardMaterial({ color, roughness: 0.05, metalness: 0.95, transparent: true, opacity: 0.55 })
  );
  m.rotation.set(rx, ry, rz);
  return m;
}
const ring1 = makeRing(2.15, 0.013, 0x7EE8A2, Math.PI/2, 0, 0);
const ring2 = makeRing(2.35, 0.009, 0x5BC0F8, Math.PI/4, Math.PI/6, 0);
const ring3 = makeRing(2.55, 0.007, 0xF7B731, -Math.PI/3, Math.PI/3, Math.PI/5);
group.add(ring1, ring2, ring3);

// Stars / particles — spread further than before
const N = 500;
const starGeo = new THREE.BufferGeometry();
const starPos = new Float32Array(N * 3);
for (let i = 0; i < N; i++) {
  const theta = Math.random() * Math.PI * 2;
  const phi   = Math.acos(2 * Math.random() - 1);
  const r     = 3.5 + Math.random() * 18;
  starPos[i*3]   = r * Math.sin(phi) * Math.cos(theta);
  starPos[i*3+1] = r * Math.sin(phi) * Math.sin(theta);
  starPos[i*3+2] = r * Math.cos(phi);
}
starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
const starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.025, transparent: true, opacity: 0.35, sizeAttenuation: true });
group.add(new THREE.Points(starGeo, starMat));

/* ═══════════════════════════════════════════════
   4. SCROLL STATE + GSAP TIMELINE
═══════════════════════════════════════════════ */
const S = {
  posX: 0, posY: 0, posZ: 0,
  rotX: 0, rotY: 0, rotZ: 0,
  scale: 1,
  camZ: 9, camY: 0,
  starOpacity: 0.35,
  glowOpacity: 0.035,
};

const masterTL = gsap.timeline({
  scrollTrigger: {
    trigger: '#scroll-container',
    start: 'top top',
    end: 'bottom bottom',
    scrub: 1.8,
  }
});

/*  Beat map — orb alternates left/right opposite to text cards
    Feature left = orb right, Feature right = orb left           */

// 0.00 → 0.12 : Hero — center
masterTL.to(S, { posX: 0, posY: 0, posZ: 0, rotY: Math.PI * 0.25, scale: 1, camZ: 9, camY: 0, duration: 0.12 }, 0);

// 0.12 → 0.28 : Feature 1 (text left) → orb moves right
masterTL.to(S, {
  posX: 3.4, posY: -0.4, posZ: 1.0,
  rotX: 0.18, rotY: Math.PI * 0.85, rotZ: -0.12,
  scale: 0.88, camZ: 7.5, camY: -0.3,
  starOpacity: 0.6, duration: 0.16
}, 0.12);

// 0.28 → 0.44 : Feature 2 (text right) → orb moves left
masterTL.to(S, {
  posX: -3.4, posY: -1.2, posZ: 0.6,
  rotX: -0.14, rotY: Math.PI * 1.45, rotZ: 0.14,
  scale: 0.83, camZ: 7.8, camY: -1.0,
  starOpacity: 0.75, glowOpacity: 0.06, duration: 0.16
}, 0.28);

// 0.44 → 0.60 : Feature 3 (text left) → orb dives right-deep
masterTL.to(S, {
  posX: 3.6, posY: -2.6, posZ: -0.4,
  rotX: 0.28, rotY: Math.PI * 2.1, rotZ: -0.18,
  scale: 0.78, camZ: 8.8, camY: -2.2,
  starOpacity: 0.9, glowOpacity: 0.09, duration: 0.16
}, 0.44);

// 0.60 → 0.76 : Feature 4 (text right) → orb sweeps left
masterTL.to(S, {
  posX: -3.8, posY: -4.0, posZ: 0.7,
  rotX: -0.08, rotY: Math.PI * 2.85, rotZ: 0.12,
  scale: 0.78, camZ: 8.2, camY: -3.5,
  starOpacity: 0.85, duration: 0.16
}, 0.60);

// 0.76 → 0.90 : Stats — orb re-centers, breathes larger
masterTL.to(S, {
  posX: 0, posY: -5.8, posZ: 0,
  rotX: 0, rotY: Math.PI * 3.5, rotZ: 0,
  scale: 1.05, camZ: 7.2, camY: -5.2,
  starOpacity: 1.0, glowOpacity: 0.13, duration: 0.14
}, 0.76);

// 0.90 → 1.0 : CTA — grand finale, surges forward
masterTL.to(S, {
  posX: 0, posY: -7.2, posZ: 1.8,
  rotX: 0, rotY: Math.PI * 4.2, rotZ: 0,
  scale: 1.18, camZ: 6.5, camY: -6.8,
  starOpacity: 1.0, glowOpacity: 0.2, duration: 0.10
}, 0.90);

/* ═══════════════════════════════════════════════
   5. TEXT / SECTION ANIMATIONS
═══════════════════════════════════════════════ */

// Hero entrance — staggered lines
window.addEventListener('load', () => {
  const tl = gsap.timeline({ delay: 0.3 });

  tl.to('#hero-badge', {
    opacity: 1, y: 0, duration: 0.8, ease: 'power3.out'
  });

  // Each title line slides up from clip
  tl.to('.title-line', {
    opacity: 1, y: '0%', duration: 1.1, stagger: 0.1, ease: 'expo.out'
  }, '-=0.3');

  tl.to('#hero-sub', {
    opacity: 1, y: 0, duration: 0.9, ease: 'power3.out'
  }, '-=0.5');

  tl.to('#hero-email-bar', {
    opacity: 1, y: 0, duration: 0.9, ease: 'power3.out'
  }, '-=0.55');

  tl.to('#hero-proof', {
    opacity: 1, y: 0, duration: 0.8, ease: 'power3.out'
  }, '-=0.5');

  tl.to('#scroll-hint', {
    opacity: 1, duration: 1.0
  }, '-=0.3');
});

// Feature cards
function animateCard(id, dir = 'left') {
  const el = document.getElementById(id);
  if (!el) return;
  ScrollTrigger.create({
    trigger: el,
    start: 'top 74%',
    onEnter: () => gsap.to(el, {
      opacity: 1, x: 0, y: 0, duration: 1.15, ease: 'expo.out'
    }),
    onLeaveBack: () => gsap.to(el, {
      opacity: 0,
      x: dir === 'left' ? -50 : 50,
      duration: 0.55, ease: 'power2.in'
    }),
  });
}
animateCard('card-1', 'left');
animateCard('card-2', 'right');
animateCard('card-3', 'left');
animateCard('card-4', 'right');

// Chat demo
ScrollTrigger.create({
  trigger: '#chat-demo-1',
  start: 'top 72%',
  onEnter: () => {
    gsap.to('#chat-demo-1', {
      opacity: 1, y: 0, scale: 1, duration: 1.0, ease: 'expo.out'
    });
  },
  onLeaveBack: () => {
    gsap.to('#chat-demo-1', { opacity: 0, y: 30, scale: 0.97, duration: 0.5, ease: 'power2.in' });
  }
});

// Memory demo
ScrollTrigger.create({
  trigger: '#memory-demo',
  start: 'top 72%',
  onEnter: () => {
    gsap.to('#memory-demo', { opacity: 1, y: 0, scale: 1, duration: 1.0, ease: 'expo.out' });
    // Start the memory entry animations
    document.querySelectorAll('.memory-entry').forEach(el => {
      el.style.animationPlayState = 'running';
    });
  },
  onLeaveBack: () => {
    gsap.to('#memory-demo', { opacity: 0, y: 30, scale: 0.97, duration: 0.5, ease: 'power2.in' });
    document.querySelectorAll('.memory-entry').forEach(el => {
      el.style.animationPlayState = 'paused';
      el.style.opacity = 0;
      el.style.transform = 'translateX(-10px)';
    });
  }
});

// Stats
['stat-1','stat-2','stat-3'].forEach((id, i) => {
  ScrollTrigger.create({
    trigger: '#' + id,
    start: 'top 78%',
    onEnter: () => {
      const el = document.getElementById(id);
      gsap.to(el, { opacity: 1, y: 0, duration: 0.9, delay: i * 0.1, ease: 'power3.out',
        onComplete: () => el.classList.add('revealed')
      });
    },
    onLeaveBack: () => {
      const el = document.getElementById(id);
      gsap.to(el, { opacity: 0, y: 30, duration: 0.45, ease: 'power2.in' });
      document.getElementById(id).classList.remove('revealed');
    }
  });
});

// CTA section
ScrollTrigger.create({
  trigger: '#cta-section',
  start: 'top 68%',
  onEnter: () => {
    const t = gsap.timeline();
    t.to('#cta-label',     { opacity: 1, duration: 0.7, ease: 'power2.out' })
     .to('#cta-title',     { opacity: 1, y: 0, duration: 1.1, ease: 'expo.out' }, '-=0.3')
     .to('#cta-body',      { opacity: 1, duration: 0.8, ease: 'power2.out' }, '-=0.5')
     .to('#cta-email-bar', { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' }, '-=0.45')
     .to('#cta-proof',     { opacity: 1, duration: 0.7, ease: 'power2.out' }, '-=0.4')
     .to('#cta-links',     { opacity: 1, y: 0, duration: 0.7, ease: 'power2.out' }, '-=0.3');
  }
});

/* ═══════════════════════════════════════════════
   6. RENDER LOOP
═══════════════════════════════════════════════ */
let time = 0;
let mouseNX = 0, mouseNY = 0;

document.addEventListener('mousemove', e => {
  mouseNX = (e.clientX / window.innerWidth  - 0.5) * 2;
  mouseNY = (e.clientY / window.innerHeight - 0.5) * 2;
}, { passive: true });

// Track smooth mouse for camera
let smX = 0, smY = 0;

(function render() {
  requestAnimationFrame(render);
  time += 0.01;

  // Smooth mouse
  smX += (mouseNX - smX) * 0.04;
  smY += (mouseNY - smY) * 0.04;

  // Apply scroll state + idle micro-animation
  group.position.x = S.posX + Math.sin(time * 0.38) * 0.045;
  group.position.y = S.posY + Math.sin(time * 0.29) * 0.035;
  group.position.z = S.posZ;

  group.rotation.x = S.rotX + Math.sin(time * 0.22) * 0.018 + smY * 0.06;
  group.rotation.y = S.rotY + time * 0.14 + smX * 0.07;
  group.rotation.z = S.rotZ + Math.cos(time * 0.18) * 0.012;

  group.scale.setScalar(S.scale + Math.sin(time * 0.48) * 0.007);

  // Camera follows scroll + mouse parallax
  camera.position.z = S.camZ;
  camera.position.y = S.camY + smY * 0.14;
  camera.position.x = smX * 0.18;
  camera.lookAt(
    S.posX * 0.18 + smX * 0.05,
    S.posY + S.camY * 0.5,
    0
  );

  // Ring rotation (independent axes = gyroscope feel)
  ring1.rotation.y += 0.0028;
  ring2.rotation.x += 0.0019;
  ring3.rotation.z += 0.0023;
  ring3.rotation.x -= 0.0008;

  // Pulsing core glow
  pointGlow.intensity  = 3.0 + Math.sin(time * 1.15) * 0.7;
  pointGlow.position.y = 2 + Math.sin(time * 0.45) * 0.6;
  pointGlow2.intensity = 1.5 + Math.cos(time * 0.8) * 0.4;

  // Material updates driven by scroll
  starMat.opacity = S.starOpacity;
  glowMat.opacity = S.glowOpacity;
  wireMat.opacity = 0.05 + Math.sin(time * 0.75) * 0.025;

  renderer.render(scene, camera);
})();

/* ═══════════════════════════════════════════════
   7. NAV SCROLL BEHAVIOR
═══════════════════════════════════════════════ */
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
  if (window.scrollY > 50) {
    nav.style.background = 'rgba(5,5,7,0.8)';
    nav.style.backdropFilter = 'blur(18px)';
    nav.style.webkitBackdropFilter = 'blur(18px)';
    nav.style.borderBottom = '1px solid rgba(255,255,255,0.05)';
  } else {
    nav.style.background = 'transparent';
    nav.style.backdropFilter = 'none';
    nav.style.webkitBackdropFilter = 'none';
    nav.style.borderBottom = 'none';
  }
}, { passive: true });

/* ═══════════════════════════════════════════════
   8. INLINE EMAIL FORMS (Hero + CTA)
═══════════════════════════════════════════════ */
function validateEmail(e) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim());
}

function shakeEl(el) {
  gsap.killTweensOf(el);
  gsap.fromTo(el,
    { x: 0 },
    { x: 0, duration: 0.45, ease: 'elastic.out(1,0.4)',
      keyframes: [
        { x: -8, duration: 0.08 }, { x: 8, duration: 0.08 },
        { x: -5, duration: 0.07 }, { x: 5, duration: 0.07 },
        { x: 0,  duration: 0.15 }
      ]
    }
  );
  gsap.to(el, { borderColor: 'rgba(247,183,49,0.7)', duration: 0.2, yoyo: true, repeat: 3,
    onComplete: () => gsap.set(el, { clearProps: 'borderColor' })
  });
}

function showToast(email) {
  const toast = document.getElementById('toast');
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 5500);
}

document.getElementById('toast-close').addEventListener('click', () => {
  document.getElementById('toast').classList.remove('show');
});

async function submitEmail(email, source) {
  try {
    await db.collection('early_access').add({
      email: email.trim(),
      source: source,
      timestamp: firebase.firestore.FieldValue.serverTimestamp(),
    });
    return true;
  } catch (err) {
    console.error('Firestore error:', err);
    return false;
  }
}

// Shared handler
async function handleEmailBar(inputId, btnId, labelId, barId) {
  const input = document.getElementById(inputId);
  const btn   = document.getElementById(btnId);
  const label = document.getElementById(labelId);
  const bar   = document.getElementById(barId);
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

  const ok = await submitEmail(email, inputId.includes('hero') ? 'hero' : 'cta');

  if (ok) {
    // Success micro-animation on the bar
    gsap.to(bar, {
      borderColor: 'rgba(126,232,162,0.5)',
      boxShadow: '0 0 0 4px rgba(126,232,162,0.08), 0 0 40px rgba(126,232,162,0.15)',
      duration: 0.35
    });
    gsap.to(btn, { background: '#7EE8A2', scale: 1, opacity: 1, duration: 0.3 });
    label.textContent = '✓ You\'re in!';

    setTimeout(() => {
      showToast(email);
      input.value = '';
      label.textContent = inputId.includes('hero') ? 'Get Early Access' : 'Join Waitlist';
      btn.disabled = false;
      gsap.to(bar, { borderColor: 'rgba(255,255,255,0.1)', boxShadow: 'none', duration: 0.5 });
      gsap.to(btn, { background: 'var(--accent)', duration: 0.4 });
    }, 1800);

  } else {
    label.textContent = 'Try again →';
    btn.disabled = false;
    gsap.to(btn, { scale: 1, opacity: 1, duration: 0.2 });
    shakeEl(btn);
  }
}

// Hero bar
document.getElementById('hero-join-btn').addEventListener('click', () => {
  handleEmailBar('hero-email-input', 'hero-join-btn', 'hero-btn-label', 'hero-email-bar');
});
document.getElementById('hero-email-input').addEventListener('keydown', e => {
  if (e.key === 'Enter') handleEmailBar('hero-email-input', 'hero-join-btn', 'hero-btn-label', 'hero-email-bar');
});

// CTA bar
document.getElementById('cta-join-btn').addEventListener('click', () => {
  handleEmailBar('cta-email-input', 'cta-join-btn', 'cta-btn-label', 'cta-email-bar');
});
document.getElementById('cta-email-input').addEventListener('keydown', e => {
  if (e.key === 'Enter') handleEmailBar('cta-email-input', 'cta-join-btn', 'cta-btn-label', 'cta-email-bar');
});

/* ═══════════════════════════════════════════════
   9. INPUT FOCUS — cursor expand
═══════════════════════════════════════════════ */
document.querySelectorAll('input').forEach(el => {
  el.addEventListener('focus', () => {
    gsap.to(cursor, { width: 4, height: 4, opacity: 0.4, duration: 0.2 });
    gsap.to(ring, { width: 0, height: 0, opacity: 0, duration: 0.2 });
  });
  el.addEventListener('blur', () => {
    gsap.to(cursor, { width: 8, height: 8, opacity: 1, duration: 0.2 });
    gsap.to(ring, { width: 34, height: 34, opacity: 1, duration: 0.2 });
  });
});

/* ═══════════════════════════════════════════════
   10. CLEANUP
═══════════════════════════════════════════════ */
window.addEventListener('beforeunload', () => {
  renderer.dispose();
});