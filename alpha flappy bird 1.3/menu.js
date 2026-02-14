let musicPlayed = false;

function playMusicOnce() {
  if (!musicPlayed) {
    const music = document.getElementById("bgmusic");
    music.volume = 0.5;
    music.play();
    musicPlayed = true;
  }
}

function startGame() {
  window.location.href = "game.html";
}

function openLeaderboard() {
  alert("Leaderboard coming soon!");
}

function openShop() {
  window.location.href = "shop.html"; // ✅ Opens shop.html
}
