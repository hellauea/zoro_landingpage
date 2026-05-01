/* ═══════════════════════════════════════════════
   ZORO AI — Cinematic WebGL Scroll Experience
   Three.js r128 · GSAP 3 ScrollTrigger
═══════════════════════════════════════════════ */

gsap.registerPlugin(ScrollTrigger);

// ── 1. CURSOR ────────────────────────────────
const cursor = document.getElementById('cursor');
const ring   = document.getElementById('cursor-ring');
let mx = 0, my = 0, rx = 0, ry = 0;

document.addEventListener('mousemove', e => {
  mx = e.clientX; my = e.clientY;
  cursor.style.left = mx + 'px';
  cursor.style.top  = my + 'px';
});
function animateCursor() {
  rx += (mx - rx) * 0.12;
  ry += (my - ry) * 0.12;
  ring.style.left = rx + 'px';
  ring.style.top  = ry + 'px';
  requestAnimationFrame(animateCursor);
}
animateCursor();

document.querySelectorAll('a, button').forEach(el => {
  el.addEventListener('mouseenter', () => {
    cursor.style.width = '16px'; cursor.style.height = '16px';
    ring.style.width = '54px'; ring.style.height = '54px';
  });
  el.addEventListener('mouseleave', () => {
    cursor.style.width = '10px'; cursor.style.height = '10px';
    ring.style.width = '36px'; ring.style.height = '36px';
  });
});

// ── 2. PROGRESS BAR ──────────────────────────
const progressBar = document.getElementById('progress-bar');
window.addEventListener('scroll', () => {
  const pct = window.scrollY / (document.body.scrollHeight - window.innerHeight) * 100;
  progressBar.style.width = Math.min(pct, 100) + '%';
});

// ── 3. THREE.JS SCENE ────────────────────────
const canvas = document.getElementById('webgl-canvas');
const renderer = new THREE.WebGLRenderer({
  canvas, antialias: true, alpha: true, powerPreference: 'high-performance'
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 200);
camera.position.set(0, 0, 8);

// ── Resize ──
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

// ── Lights ──
const ambientLight = new THREE.AmbientLight(0xffffff, 0.15);
scene.add(ambientLight);

const keyLight = new THREE.DirectionalLight(0x7EE8A2, 3.5);
keyLight.position.set(5, 8, 5);
keyLight.castShadow = true;
scene.add(keyLight);

const fillLight = new THREE.DirectionalLight(0x5BC0F8, 1.8);
fillLight.position.set(-6, -2, 3);
scene.add(fillLight);

const rimLight = new THREE.DirectionalLight(0xF7B731, 1.2);
rimLight.position.set(0, -5, -4);
scene.add(rimLight);

const pointGlow = new THREE.PointLight(0x7EE8A2, 2.5, 12);
pointGlow.position.set(0, 2, 4);
scene.add(pointGlow);

// ── Procedural 3D Model (AI Brain / Orb) ──
const group = new THREE.Group();
scene.add(group);

// Core sphere
const coreGeo = new THREE.IcosahedronGeometry(1.4, 4);
const coreMat = new THREE.MeshStandardMaterial({
  color: 0x0a0a12,
  roughness: 0.05,
  metalness: 0.95,
  envMapIntensity: 1.2,
});
const coreMesh = new THREE.Mesh(coreGeo, coreMat);
group.add(coreMesh);

// Wireframe shell
const wireGeo = new THREE.IcosahedronGeometry(1.55, 1);
const wireMat = new THREE.MeshBasicMaterial({
  color: 0x7EE8A2,
  wireframe: true,
  transparent: true,
  opacity: 0.08,
});
const wireMesh = new THREE.Mesh(wireGeo, wireMat);
group.add(wireMesh);

// Outer glow shell
const glowGeo = new THREE.SphereGeometry(1.75, 32, 32);
const glowMat = new THREE.MeshStandardMaterial({
  color: 0x7EE8A2,
  roughness: 1,
  metalness: 0,
  transparent: true,
  opacity: 0.04,
  side: THREE.BackSide,
});
group.add(new THREE.Mesh(glowGeo, glowMat));

// Orbital rings
function makeRing(radius, tube, color, rx, ry, rz) {
  const geo = new THREE.TorusGeometry(radius, tube, 6, 80);
  const mat = new THREE.MeshStandardMaterial({
    color, roughness: 0.1, metalness: 0.9, transparent: true, opacity: 0.6,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.rotation.set(rx, ry, rz);
  return mesh;
}

const ring1 = makeRing(2.1, 0.012, 0x7EE8A2, Math.PI/2, 0, 0);
const ring2 = makeRing(2.3, 0.008, 0x5BC0F8, Math.PI/4, Math.PI/6, 0);
const ring3 = makeRing(2.5, 0.006, 0xF7B731, -Math.PI/3, Math.PI/3, Math.PI/5);
group.add(ring1, ring2, ring3);

// Floating particles (Stars)
const particleCount = 400;
const particleGeo = new THREE.BufferGeometry();
const positions = new Float32Array(particleCount * 3);
const pSizes = new Float32Array(particleCount);
for (let i = 0; i < particleCount; i++) {
  const theta = Math.random() * Math.PI * 2;
  const phi = Math.acos(2 * Math.random() - 1);
  const r = 2 + Math.random() * 15;
  positions[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
  positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
  positions[i * 3 + 2] = r * Math.cos(phi);
  pSizes[i] = Math.random() * 1.5 + 0.5;
}
particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
particleGeo.setAttribute('size', new THREE.BufferAttribute(pSizes, 1));
const particleMat = new THREE.PointsMaterial({
  color: 0xffffff, size: 0.02, transparent: true, opacity: 0.4, sizeAttenuation: true,
});
const particles = new THREE.Points(particleGeo, particleMat);
group.add(particles);

// ── Mouse parallax ──
let mouseNX = 0, mouseNY = 0;
document.addEventListener('mousemove', e => {
  mouseNX = (e.clientX / window.innerWidth - 0.5) * 2;
  mouseNY = (e.clientY / window.innerHeight - 0.5) * 2;
});

// ── 4. SCROLL ANIMATION STATE ─────────────────
const scrollState = {
  posX: 0, posY: 0, posZ: 0,
  rotX: 0, rotY: 0, rotZ: 0,
  scale: 1,
  cameraZ: 8,
  cameraY: 0,
  particleOpacity: 0.5,
  glowOpacity: 0.04,
};

const tl = gsap.timeline({
  scrollTrigger: {
    trigger: '#scroll-container',
    start: 'top top',
    end: 'bottom bottom',
    scrub: 1.6,
  }
});

// Segment 0→0.12: Hero idle
tl.to(scrollState, {
  posX: 0, posY: 0, posZ: 0,
  rotY: Math.PI * 0.3,
  scale: 1,
  cameraZ: 8,
  duration: 0.12
}, 0);

// Segment 0.12→0.28: Dive forward (Feature 1 - Personality: Text on Left)
tl.to(scrollState, {
  posX: 3.2,
  posY: -0.3,
  posZ: 1.2,
  rotX: 0.2,
  rotY: Math.PI * 0.7,
  rotZ: -0.1,
  scale: 0.85,
  cameraZ: 7.2,
  cameraY: -0.2,
  particleOpacity: 0.7,
  duration: 0.16
}, 0.12);

// Segment 0.28→0.44: Sweep right (Feature 2 - Memory: Text on Right)
tl.to(scrollState, {
  posX: -3.2,
  posY: -1.0,
  posZ: 0.5,
  rotX: -0.15,
  rotY: Math.PI * 1.2,
  rotZ: 0.15,
  scale: 0.8,
  cameraZ: 7.5,
  cameraY: -0.8,
  particleOpacity: 0.9,
  glowOpacity: 0.07,
  duration: 0.16
}, 0.28);

// Segment 0.44→0.60: Dive deep left (Feature 3 - Multimodal: Text on Left)
tl.to(scrollState, {
  posX: 3.5,
  posY: -2.2,
  posZ: -0.5,
  rotX: 0.3,
  rotY: Math.PI * 1.9,
  rotZ: -0.2,
  scale: 0.75,
  cameraZ: 8.5,
  cameraY: -1.8,
  particleOpacity: 1.0,
  glowOpacity: 0.1,
  duration: 0.16
}, 0.44);

// Segment 0.60→0.76: Rise right (Feature 4 - Platform: Text on Right)
tl.to(scrollState, {
  posX: -3.5,
  posY: -3.5,
  posZ: 0.8,
  rotX: -0.1,
  rotY: Math.PI * 2.6,
  rotZ: 0.1,
  scale: 0.75,
  cameraZ: 8.0,
  cameraY: -3.0,
  particleOpacity: 0.8,
  duration: 0.16
}, 0.60);

// Segment 0.76→0.90: Stats
tl.to(scrollState, {
  posX: 0,
  posY: -5.0,
  posZ: 0,
  rotX: 0,
  rotY: Math.PI * 3.2,
  rotZ: 0,
  scale: 1.0,
  cameraZ: 7.0,
  cameraY: -4.5,
  particleOpacity: 1.0,
  glowOpacity: 0.12,
  duration: 0.14
}, 0.76);

// Segment 0.90→1.0: CTA
tl.to(scrollState, {
  posX: 0,
  posY: -6.5,
  posZ: 1.5,
  rotX: 0,
  rotY: Math.PI * 4.0,
  rotZ: 0,
  scale: 1.15,
  cameraZ: 6.5,
  cameraY: -6.0,
  particleOpacity: 1.0,
  glowOpacity: 0.18,
  duration: 0.1
}, 0.90);

// ── 5. SECTION TEXT ANIMATIONS ───────────────
gsap.timeline({ delay: 0.4 })
  .to('#eyebrow',    { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out' })
  .to('#hero-title', { opacity: 1, y: 0, duration: 1.1, ease: 'expo.out' }, '-=0.5')
  .to('#hero-sub',   { opacity: 1, y: 0, duration: 0.9, ease: 'power2.out' }, '-=0.6')
  .to('#hero-cta',   { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out' }, '-=0.5')
  .to('#scroll-hint',{ opacity: 1, duration: 1.0 }, '-=0.2');

function revealCard(id) {
  gsap.to(id, {
    scrollTrigger: { trigger: id, start: 'top 72%', toggleActions: 'play none none reverse' },
    opacity: 1, x: 0, y: 0, duration: 1.1, ease: 'expo.out'
  });
}
revealCard('#card-1');
revealCard('#card-2');
revealCard('#card-3');
revealCard('#card-4');

gsap.to('#chat-demo-1', {
  scrollTrigger: { trigger: '#features', start: 'top 60%', toggleActions: 'play none none reverse' },
  opacity: 1, y: 0, duration: 1.2, delay: 0.3, ease: 'power3.out'
});

['#stat-1', '#stat-2', '#stat-3'].forEach((id, i) => {
  gsap.to(id, {
    scrollTrigger: { trigger: '#stats-section', start: 'top 70%', toggleActions: 'play none none reverse' },
    opacity: 1, y: 0, duration: 0.9, delay: i * 0.12, ease: 'power3.out'
  });
});

const ctaTl = gsap.timeline({
  scrollTrigger: { trigger: '#cta-section', start: 'top 65%', toggleActions: 'play none none reverse' }
});
ctaTl
  .to('#cta-label',   { opacity: 1, duration: 0.7, ease: 'power2.out' })
  .to('#cta-title',   { opacity: 1, y: 0, duration: 1.0, ease: 'expo.out' }, '-=0.3')
  .to('#cta-body',    { opacity: 1, duration: 0.8, ease: 'power2.out' }, '-=0.5')
  .to('#cta-buttons', { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out' }, '-=0.4');

// ── 6. RENDER LOOP ───────────────────────────
let time = 0;
let rafId;

function render() {
  rafId = requestAnimationFrame(render);
  time += 0.01;

  group.position.x = scrollState.posX + Math.sin(time * 0.4) * 0.04;
  group.position.y = scrollState.posY + Math.sin(time * 0.3) * 0.03;
  group.position.z = scrollState.posZ;

  group.rotation.x = scrollState.rotX + Math.sin(time * 0.25) * 0.02;
  group.rotation.y = scrollState.rotY + time * 0.15 + mouseNX * 0.08;
  group.rotation.z = scrollState.rotZ + Math.cos(time * 0.2) * 0.01;

  group.scale.setScalar(scrollState.scale + Math.sin(time * 0.5) * 0.008);

  camera.position.z = scrollState.cameraZ;
  camera.position.y = scrollState.cameraY + mouseNY * 0.12;
  camera.position.x = mouseNX * 0.15;
  camera.lookAt(
    scrollState.posX * 0.2,
    scrollState.posY + scrollState.cameraY * 0.5,
    0
  );

  ring1.rotation.y += 0.003;
  ring2.rotation.x += 0.002;
  ring3.rotation.z += 0.0025;

  pointGlow.intensity = 2.5 + Math.sin(time * 1.2) * 0.6;
  pointGlow.position.y = 2 + Math.sin(time * 0.5) * 0.5;

  particleMat.opacity = scrollState.particleOpacity;
  glowMat.opacity = scrollState.glowOpacity;

  wireMat.opacity = 0.06 + Math.sin(time * 0.8) * 0.03;

  renderer.render(scene, camera);
}
render();

// ── 7. NAV SCROLL BEHAVIOR ───────────────────
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
  if (window.scrollY > 60) {
    nav.style.background = 'rgba(5,5,7,0.85)';
    nav.style.backdropFilter = 'blur(12px)';
    nav.style.borderBottom = '1px solid rgba(126,232,162,0.06)';
  } else {
    nav.style.background = 'transparent';
    nav.style.backdropFilter = 'none';
    nav.style.borderBottom = 'none';
  }
});

// ── 8. CLEANUP ──────────────────────────────
window.addEventListener('beforeunload', () => {
  cancelAnimationFrame(rafId);
  renderer.dispose();
});

// ── 9. WAITLIST MODAL ────────────────────────
(function() {
  const overlay    = document.getElementById('modal-overlay');
  const box        = document.getElementById('modal-box');
  const backdrop   = document.getElementById('modal-backdrop');
  const closeBtn   = document.getElementById('modal-close');
  const submitBtn  = document.getElementById('modal-submit');
  const formView   = document.getElementById('modal-form-view');
  const successView= document.getElementById('modal-success');
  const emailInput = document.getElementById('modal-email');
  const nameInput  = document.getElementById('modal-name');
  const successMsg = document.getElementById('success-message');
  const submitLabel= document.getElementById('modal-submit-label');

  // Trigger buttons
  const triggers = [
    document.getElementById('open-modal-btn'),
  ].filter(Boolean);

  function openModal() {
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';

    gsap.to(overlay, { opacity: 1, duration: 0.35, ease: 'power2.out' });
    gsap.to(box, {
      opacity: 1, y: 0, scale: 1,
      duration: 0.55,
      ease: 'expo.out',
      clearProps: 'transform'
    });

    // Subtle border glow pulse
    gsap.to(box, {
      boxShadow: '0 0 0 1px rgba(126,232,162,0.12), 0 40px 80px rgba(0,0,0,0.6), 0 0 80px rgba(126,232,162,0.12)',
      duration: 1.2,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut'
    });

    // Stagger form fields in
    gsap.fromTo(
      '#modal-form-view > *',
      { opacity: 0, y: 16 },
      { opacity: 1, y: 0, stagger: 0.07, duration: 0.5, delay: 0.2, ease: 'power3.out' }
    );

    setTimeout(() => emailInput.focus(), 400);
  }

  function closeModal() {
    gsap.to(overlay, { opacity: 0, duration: 0.28, ease: 'power2.in', onComplete: () => {
      overlay.classList.remove('active');
      document.body.style.overflow = '';
      // Reset for next open
      gsap.set(box, { y: 40, scale: 0.96, opacity: 0 });
      gsap.killTweensOf(box); // stop glow pulse
    }});
    gsap.to(box, { y: 24, scale: 0.97, opacity: 0, duration: 0.28, ease: 'power2.in' });
  }

  function showSuccess(name) {
    const greeting = name ? `${name}, you're` : "You're";
    successMsg.textContent = `${greeting} officially on the list. Zoro will reach out when it's ready to meet you.`;

    gsap.to(formView, {
      opacity: 0, y: -20, duration: 0.3, ease: 'power2.in',
      onComplete: () => {
        formView.style.display = 'none';
        successView.style.display = 'flex';
        gsap.fromTo(successView,
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.55, ease: 'expo.out' }
        );
        gsap.fromTo(
          '#modal-success > *',
          { opacity: 0, y: 14 },
          { opacity: 1, y: 0, stagger: 0.09, duration: 0.5, delay: 0.1, ease: 'power3.out' }
        );
      }
    });
  }

  function resetModal() {
    formView.style.display = 'block';
    successView.style.display = 'none';
    gsap.set(formView, { opacity: 1, y: 0 });
    emailInput.value = '';
    nameInput.value = '';
    submitLabel.textContent = 'Join Waitlist →';
    submitBtn.disabled = false;
  }

  // Open triggers
  triggers.forEach(btn => btn.addEventListener('click', (e) => {
    e.preventDefault();
    resetModal();
    openModal();
  }));

  // Close on backdrop click
  backdrop.addEventListener('click', closeModal);

  // Close on Escape
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && overlay.classList.contains('active')) closeModal();
  });

  closeBtn.addEventListener('click', closeModal);

  // Submit
  submitBtn.addEventListener('click', () => {
    const email = emailInput.value.trim();
    const name  = nameInput.value.trim();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      // Shake the email field
      gsap.fromTo(emailInput,
        { x: -8 },
        { x: 0, duration: 0.4, ease: 'elastic.out(1,0.3)',
          keyframes: [{ x: -8 }, { x: 8 }, { x: -5 }, { x: 5 }, { x: 0 }]
        }
      );
      gsap.to(emailInput, {
        borderColor: 'rgba(247,183,49,0.8)',
        duration: 0.2,
        yoyo: true,
        repeat: 3,
        onComplete: () => gsap.set(emailInput, { clearProps: 'borderColor' })
      });
      emailInput.focus();
      return;
    }

    submitLabel.textContent = 'Locking you in...';
    submitBtn.disabled = true;

    // Simulate async submit
    setTimeout(() => showSuccess(name), 900);
  });

  // Cursor hover effects for modal elements
  [submitBtn, closeBtn, emailInput, nameInput].forEach(el => {
    if(!el) return;
    el.addEventListener('mouseenter', () => {
      cursor.style.width = '16px'; cursor.style.height = '16px';
      ring.style.width = '54px'; ring.style.height = '54px';
    });
    el.addEventListener('mouseleave', () => {
      cursor.style.width = '10px'; cursor.style.height = '10px';
      ring.style.width = '36px'; ring.style.height = '36px';
    });
  });
})();
