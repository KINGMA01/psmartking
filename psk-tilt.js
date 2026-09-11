/**
 * P-SmartKing — Tilt 3D (panneau + téléphone)
 * Panneau : tilt · Téléphone : tilt uniquement
 */
(function () {
  "use strict";

  const CFG = {
    maxTilt: 10,
    scaleHover: 1.015,
    shadowZ: -32,
    glareMax: 0.22,
    calloutParallax: 16,
    floatAmplitude: 3,
    floatDuration: 3400,
    floatRotateY: 4,
    resetMs: 550,
    easing: "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
  };

  const clamp = (v, min, max) => Math.min(Math.max(v, min), max);

  function initScene(scene) {
    const mode = scene.dataset.tiltMode || "panneau";
    const isPhone = mode === "phone";
    const card = scene.querySelector("[data-tilt='phone-wrapper']");
    if (!card) return;

    const glare = card.querySelector(".psk-3d-glare");
    const shadow = card.querySelector(".psk-3d-shadow");
    const callouts = isPhone ? [] : Array.from(document.querySelectorAll("[data-tilt-callout]"));

    const state = {
      floatRafId: null,
      isHovered: false,
      isDragging: false,
      floatStartTime: 0,
      mouseX: 0,
      mouseY: 0,
    };

    function applyScene(rotX, rotY, scale, offsetX, offsetY) {
      card.style.transform = `
        translate3d(${offsetX}px, ${offsetY}px, 0)
        rotateX(${rotX.toFixed(2)}deg)
        rotateY(${rotY.toFixed(2)}deg)
        scale3d(${scale.toFixed(3)}, ${scale.toFixed(3)}, ${scale.toFixed(3)})
      `;

      if (shadow) {
        const sx = rotY * -1.2;
        const sy = rotX * 0.9 + 6;
        const sScale = 0.96 - (Math.abs(rotX) + Math.abs(rotY)) * 0.0015;
        shadow.style.transform = `translateZ(${CFG.shadowZ}px) translate(${sx.toFixed(1)}px, ${sy.toFixed(1)}px) scale(${sScale.toFixed(3)})`;
        shadow.style.opacity = String(clamp(0.4 + (Math.abs(rotX) + Math.abs(rotY)) * 0.012, 0.35, 0.7));
      }

      if (glare) {
        const gx = clamp(50 + state.mouseX * 36, 10, 90);
        const gy = clamp(50 + state.mouseY * 36, 10, 90);
        const gOpacity = clamp(Math.hypot(state.mouseX, state.mouseY) * CFG.glareMax * 0.75, 0, CFG.glareMax);
        glare.style.background = `radial-gradient(circle at ${gx}% ${gy}%, rgba(255,255,255,0.65) 0%, rgba(255,255,255,0.08) 45%, transparent 70%)`;
        glare.style.opacity = gOpacity.toFixed(2);
      }

      callouts.forEach((el, i) => {
        const factor = i % 2 === 0 ? 1 : -1;
        const px = -(rotY / CFG.maxTilt) * CFG.calloutParallax * factor;
        const py = -(rotX / CFG.maxTilt) * CFG.calloutParallax * factor * 0.6;
        el.style.transform = `translate(${px.toFixed(1)}px, ${py.toFixed(1)}px)`;
      });
    }

    function setTiltFromPointer(clientX, clientY, scale) {
      const rect = card.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const percentX = (clientX - centerX) / (rect.width / 2);
      const percentY = (clientY - centerY) / (rect.height / 2);

      state.mouseX = clamp(percentX, -1, 1);
      state.mouseY = clamp(percentY, -1, 1);
      const tiltX = -state.mouseY * CFG.maxTilt;
      const tiltY = state.mouseX * CFG.maxTilt;

      applyScene(tiltX, tiltY, scale, 0, 0);
    }

    function stopFloat() {
      if (state.floatRafId) {
        cancelAnimationFrame(state.floatRafId);
        state.floatRafId = null;
      }
    }

    function startFloat() {
      state.floatStartTime = performance.now();

      function tick(now) {
        if (state.isHovered) return;

        const t = (now - state.floatStartTime) / CFG.floatDuration;
        const ox = Math.sin(t * Math.PI * 2 * 0.55) * (CFG.floatAmplitude * 0.35);
        const oy = Math.sin(t * Math.PI * 2) * CFG.floatAmplitude;
        const rotX = Math.sin(t * Math.PI * 2) * 2.2;
        const rotY = Math.cos(t * Math.PI * 2 * 0.65) * CFG.floatRotateY;

        applyScene(rotX, rotY, 1, ox, oy);
        state.floatRafId = requestAnimationFrame(tick);
      }

      state.floatRafId = requestAnimationFrame(tick);
    }

    function resetCard() {
      stopFloat();
      card.classList.remove("is-active");
      card.style.transition = `transform ${CFG.resetMs}ms ${CFG.easing}`;
      applyScene(0, 0, 1, 0, 0);
      state.mouseX = 0;
      state.mouseY = 0;

      window.setTimeout(() => {
        card.style.transition = "none";
        startFloat();
      }, CFG.resetMs);
    }

    card.style.transition = "none";
    startFloat();

    scene.addEventListener("mouseenter", () => {
      state.isHovered = true;
      stopFloat();
      card.classList.add("is-active");
    });

    scene.addEventListener("mousemove", (e) => {
      setTiltFromPointer(e.clientX, e.clientY, CFG.scaleHover);
    });

    scene.addEventListener("mouseleave", () => {
      state.isHovered = false;
      card.classList.remove("is-active");
      resetCard();
    });

    scene.addEventListener(
      "touchstart",
      (e) => {
        state.isHovered = true;
        state.isDragging = true;
        stopFloat();
        card.classList.add("is-active");
        const touch = e.touches[0];
        setTiltFromPointer(touch.clientX, touch.clientY, CFG.scaleHover);
      },
      { passive: true }
    );

    scene.addEventListener(
      "touchmove",
      (e) => {
        if (!state.isDragging) return;
        const touch = e.touches[0];
        setTiltFromPointer(touch.clientX, touch.clientY, CFG.scaleHover);
      },
      { passive: true }
    );

    scene.addEventListener("touchend", () => {
      state.isDragging = false;
      state.isHovered = false;
      card.classList.remove("is-active");
      resetCard();
    });
  }

  function init() {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    document.querySelectorAll("[data-tilt-scene]").forEach(initScene);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
