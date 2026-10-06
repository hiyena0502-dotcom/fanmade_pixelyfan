"use strict";

const snow = document.querySelector("#snow");
const note = document.querySelector("#menu-note");
const menuItems = document.querySelectorAll(".menu-item");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (snow && !reduceMotion) {
  const fragment = document.createDocumentFragment();

  for (let i = 0; i < 34; i += 1) {
    const flake = document.createElement("span");
    flake.className = "snowflake";

    const size = 2 + Math.random() * 4.5;
    const duration = 8 + Math.random() * 11;
    const delay = -Math.random() * duration;
    const drift = -40 + Math.random() * 90;
    const alpha = 0.28 + Math.random() * 0.52;

    flake.style.left = `${Math.random() * 100}%`;
    flake.style.setProperty("--size", `${size}px`);
    flake.style.setProperty("--duration", `${duration}s`);
    flake.style.setProperty("--delay", `${delay}s`);
    flake.style.setProperty("--drift", `${drift}px`);
    flake.style.setProperty("--alpha", alpha.toFixed(2));

    fragment.appendChild(flake);
  }

  snow.appendChild(fragment);
}

menuItems.forEach((item) => {
  item.addEventListener("click", () => {
    if (!note) return;
    const label = item.dataset.placeholder || item.textContent.trim();
    note.textContent = `${label} 메뉴는 다음 단계에서 기능을 연결할 예정입니다.`;
  });
});
