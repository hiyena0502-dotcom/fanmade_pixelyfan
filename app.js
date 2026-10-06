"use strict";

const snow = document.querySelector("#snow");
const note = document.querySelector("#menu-note");
const menuItems = [...document.querySelectorAll(".menu-item")];
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (snow && !reduceMotion) {
  const fragment = document.createDocumentFragment();

  for (let i = 0; i < 38; i += 1) {
    const flake = document.createElement("span");
    flake.className = "snowflake";

    const size = 2 + Math.random() * 4.8;
    const duration = 8 + Math.random() * 12;
    const delay = -Math.random() * duration;
    const drift = -55 + Math.random() * 110;
    const alpha = 0.28 + Math.random() * 0.5;

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
  item.addEventListener("mouseenter", () => {
    menuItems.forEach((button) => button.classList.remove("is-primary"));
    item.classList.add("is-primary");
  });

  item.addEventListener("focus", () => {
    menuItems.forEach((button) => button.classList.remove("is-primary"));
    item.classList.add("is-primary");
  });

  item.addEventListener("click", () => {
    if (!note) return;
    const label = item.dataset.placeholder || item.textContent.trim();
    note.textContent = `${label} 기능은 다음 단계에서 연결할 예정입니다.`;
  });
});
