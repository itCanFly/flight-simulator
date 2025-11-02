
export function startStatsLoop(stats, statsInterval, notify, gameOver) {
  // Clear previous interval if a valid id was provided
  try { if (statsInterval) clearInterval(statsInterval); } catch (e) {}

  const id = setInterval(() => {
    if (stats.fuel <= 0) {
      try { clearInterval(id); } catch (e) {}
      try { gameOver(); } catch (e) {}
      return;
    }

    stats.speed = Math.min(stats.speed, 500);
    stats.fuel = Math.max(stats.fuel, 0);
    stats.timeElapsed++;

    notify({ ...stats }); // send updated stats to UI
  }, 1000);

  return id;
}

export function stopStatsLoop(statsInterval) {
  try { if (statsInterval) clearInterval(statsInterval); } catch (e) {}
  return null;
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
