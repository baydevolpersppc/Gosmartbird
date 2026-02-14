// --- Coins ---
let coins = parseInt(localStorage.getItem("coins")) || 0;
document.getElementById("coinCount").textContent = coins;

// --- Carousel ---
let currentSlide = 0;
const track = document.querySelector(".carousel-track");
const slides = document.querySelectorAll(".shop-item");

function updateCarousel() {
  const container = document.querySelector(".carousel");
  const slide = slides[currentSlide];

  const containerCenter = container.offsetWidth / 2;
  const slideCenter = slide.offsetLeft + slide.offsetWidth / 2;

  const scrollX = slideCenter - containerCenter;
  track.style.transform = `translateX(-${scrollX}px)`;

  updateEquipButton();
}

function nextSlide() {
  currentSlide = (currentSlide + 1) % slides.length;
  updateCarousel();
}

function prevSlide() {
  currentSlide = (currentSlide - 1 + slides.length) % slides.length;
  updateCarousel();
}

// --- Notification ---
const notification = document.getElementById("notification");
function showNotification(msg, color="#42a5f5") {
  notification.textContent = msg;
  notification.style.background = color;
  notification.classList.add("show");
  setTimeout(() => notification.classList.remove("show"), 2000);
}

// --- Coin Animation ---
function animateCoins() {
  const coin = document.getElementById("coinCount");
  coin.classList.add("animate");
  setTimeout(() => coin.classList.remove("animate"), 300);
}

// --- Buy Item ---
function buyItem(item, cost) {
  if (coins >= cost) {
    coins -= cost;
    localStorage.setItem("coins", coins);
    localStorage.setItem("unlocked_" + item, "true");
    document.getElementById("coinCount").textContent = coins;
    animateCoins();
    showNotification(`${item} skin unlocked! 🛍️`, "#4caf50");
    updateEquipButton();
  } else {
    showNotification("Not enough coins! ❌", "#f44336");
  }
}

// --- Equip Item ---
function equipItem(item) {
  if (localStorage.getItem("unlocked_" + item) === "true" || item === "flappybird3") {
    localStorage.setItem("equippedSkin", item);
    showNotification(`${item} skin equipped! ✨`, "#ffb300");
    updateEquipButton();
  } else {
    showNotification("You need to buy this skin first!", "#f44336");
  }
}

// --- Update Equip Buttons ---
function updateEquipButton() {
  slides.forEach(slide => {
    const item = slide.getAttribute("data-item");
    let equipBtn = slide.querySelector(".equip-btn");

    if (!equipBtn) {
      equipBtn = document.createElement("button");
      equipBtn.classList.add("equip-btn");
      slide.appendChild(equipBtn);
    }

    if (localStorage.getItem("unlocked_" + item) === "true" || item === "flappybird3") {
      equipBtn.textContent = "Equip";
      equipBtn.disabled = false;
      equipBtn.onclick = () => equipItem(item);
    } else {
      equipBtn.textContent = "Locked";
      equipBtn.disabled = true;
    }
  });
}

// --- Center first slide ---
window.addEventListener("load", updateCarousel);
window.addEventListener("resize", updateCarousel);

// --- Background Music ---
let musicPlayed = false;
function playMusicOnce() {
  if (!musicPlayed) {
    document.getElementById("bgmusic").play();
    musicPlayed = true;
  }
}
window.addEventListener("click", playMusicOnce);
window.addEventListener("keydown", playMusicOnce);
