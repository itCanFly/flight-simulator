
export function startStatsLoop(stats,statsInterval, notify, gameOver) {
  stopStatsLoop(statsInterval); // stop previous interval if running

  statsInterval = setInterval(() => {
    if (stats.fuel <= 0) {
      stopStatsLoop();
      gameOver();
      return;
    }

    stats.speed = Math.min(stats.speed, 500);
    stats.fuel = Math.max(stats.fuel, 0);
    stats.timeElapsed++;

    notify({ ...stats }); // send updated stats to UI
  }, 1000);
}

export function stopStatsLoop(statsInterval) {
  if (statsInterval) clearInterval(statsInterval);
  statsInterval = null;
}

export function resetStatsLoop(stats,forwardSpeed) {
  stats.speed = forwardSpeed * 10;
  stats.fuel = 100;
  stats.timeElapsed = 0;
}

export function getFormatted(stats) {
        const minutes = Math.floor(stats.timeElapsed / 60);
        const seconds = stats.timeElapsed % 60;
        return `${minutes}::${seconds.toString().padStart(2, '0')}`;
    }
