let activities = JSON.parse(localStorage.getItem('activities')) || [];
let totalPoints = parseInt(localStorage.getItem('totalPoints')) || 0;
let timers = {};

const POINTS_PER_LEVEL = 100;

// Arcade sound effects (beep using Web Audio API)
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playBeep(freq = 440, duration = 100) {
  const oscillator = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(audioCtx.destination);
  
  oscillator.frequency.value = freq;
  oscillator.type = 'square';
  
  gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration / 1000);
  
  oscillator.start(audioCtx.currentTime);
  oscillator.stop(audioCtx.currentTime + duration / 1000);
}

function saveData() {
  localStorage.setItem('activities', JSON.stringify(activities));
  localStorage.setItem('totalPoints', totalPoints);
}

function updateDisplay() {
  // Format points with leading zeros (arcade style)
  document.getElementById('totalPoints').textContent = String(totalPoints).padStart(7, '0');
  
  const level = Math.floor(totalPoints / POINTS_PER_LEVEL) + 1;
  const progress = (totalPoints % POINTS_PER_LEVEL) / POINTS_PER_LEVEL * 100;
  
  document.getElementById('level').textContent = String(level).padStart(2, '0');
  document.getElementById('progressText').textContent = Math.round(progress) + '%';
  document.getElementById('progressBar').style.width = progress + '%';

  const grid = document.getElementById('activityList');
  const emptyState = document.getElementById('emptyState');
  
  // Show/hide empty state
  if (activities.length === 0) {
    emptyState.classList.add('show');
    grid.style.display = 'none';
  } else {
    emptyState.classList.remove('show');
    grid.style.display = 'grid';
  }
  
  grid.innerHTML = '';
  activities.forEach((act, index) => {
    const card = document.createElement('div');
    card.className = `quest-card ${act.points > 0 ? 'positive' : 'negative'}`;
    
    card.innerHTML = `
      <h3>${act.points > 0 ? '▲' : '▼'} ${act.name}</h3>
      <div class="points">${act.points > 0 ? '+' : ''}${act.points} PTS ${act.type === 'hourly' ? '/HR' : ''}</div>
      ${act.type === 'hourly' ? '<div class="timer-display" id="timer-' + index + '">[ IDLE ]</div>' : ''}
      <div class="controls"></div>
    `;
    
    const controls = card.querySelector('.controls');
    
    if (act.type === 'occurrence') {
      const btn = document.createElement('button');
      btn.className = 'pixel-btn';
      btn.textContent = '⚡ CLAIM';
      btn.onclick = () => {
        playBeep(800, 100);
        logPoints(act.points, index);
      };
      controls.appendChild(btn);
    } else {
      const startBtn = document.createElement('button');
      startBtn.className = 'pixel-btn';
      startBtn.textContent = '▶ START';
      startBtn.onclick = () => {
        playBeep(600, 100);
        startTimer(index);
      };
      
      const stopBtn = document.createElement('button');
      stopBtn.className = 'pixel-btn';
      stopBtn.textContent = '■ STOP';
      stopBtn.onclick = () => {
        playBeep(700, 150);
        stopTimer(index);
      };
      
      controls.appendChild(startBtn);
      controls.appendChild(stopBtn);
    }
    
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'pixel-btn danger';
    deleteBtn.textContent = '✕ DELETE';
    deleteBtn.onclick = () => {
      if (confirm(`DELETE QUEST: ${act.name.toUpperCase()}?`)) {
        playBeep(300, 200);
        activities.splice(index, 1);
        stopTimer(index);
        saveData();
        updateDisplay();
      }
    };
    controls.appendChild(deleteBtn);
    
    grid.appendChild(card);
  });
}

function logPoints(points, index) {
  const oldLevel = Math.floor(totalPoints / POINTS_PER_LEVEL) + 1;
  totalPoints += points;
  const newLevel = Math.floor(totalPoints / POINTS_PER_LEVEL) + 1;
  
  // Arcade-style confetti
  if (points > 0) {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#00ff41', '#ff10f0', '#00ffff', '#ffff00']
    });
  }
  
  // Level up!
  if (newLevel > oldLevel) {
    playBeep(880, 100);
    setTimeout(() => playBeep(1046, 100), 150);
    setTimeout(() => playBeep(1318, 200), 300);
    
    showLevelUpModal(newLevel);
    setTimeout(() => {
      confetti({
        particleCount: 300,
        spread: 120,
        origin: { y: 0.5 },
        colors: ['#00ff41', '#ff10f0', '#00ffff', '#ffff00'],
        shapes: ['square']
      });
    }, 100);
  }
  
  saveData();
  updateDisplay();
}

function addActivity() {
  const name = document.getElementById('activityName').value.trim();
  const points = parseInt(document.getElementById('pointsValue').value);
  const type = document.getElementById('type').value;
  
  if (!name) {
    playBeep(200, 300);
    alert('ENTER QUEST NAME!');
    return;
  }
  
  if (isNaN(points)) {
    playBeep(200, 300);
    alert('ENTER POINT VALUE!');
    return;
  }
  
  playBeep(1000, 100);
  
  activities.push({ name, points, type });
  saveData();
  updateDisplay();
  
  // Clear form
  document.getElementById('activityName').value = '';
  document.getElementById('pointsValue').value = '';
  
  // Arcade insert coin effect
  confetti({
    particleCount: 30,
    spread: 40,
    origin: { y: 0.4 },
    colors: ['#ffff00'],
    shapes: ['circle']
  });
}

function startTimer(index) {
  if (timers[index]) {
    playBeep(200, 300);
    alert('TIMER ALREADY RUNNING!');
    return;
  }
  
  timers[index] = {
    start: Date.now(),
    earned: 0,
    interval: setInterval(() => updateTimerDisplay(index), 1000)
  };
  updateTimerDisplay(index);
}

function updateTimerDisplay(index) {
  if (!timers[index]) return;
  const elapsed = (Date.now() - timers[index].start) / 1000;
  const hours = elapsed / 3600;
  const earned = Math.floor(hours * activities[index].points);
  timers[index].earned = earned;
  
  const display = document.getElementById(`timer-${index}`);
  if (display) {
    const hrs = Math.floor(elapsed / 3600);
    const mins = Math.floor(elapsed / 60) % 60;
    const secs = Math.floor(elapsed % 60);
    display.textContent = `[ ${hrs}:${String(mins).padStart(2,'0')}:${String(secs).padStart(2,'0')} ] ${earned >= 0 ? '+' : ''}${earned}`;
  }
}

function stopTimer(index) {
  if (!timers[index]) return;
  
  clearInterval(timers[index].interval);
  logPoints(timers[index].earned, index);
  delete timers[index];
  
  const display = document.getElementById(`timer-${index}`);
  if (display) display.textContent = '[ IDLE ]';
}

function resetPoints() {
  if (confirm('RESET ALL POINTS?\n(QUESTS REMAIN)')) {
    playBeep(300, 300);
    totalPoints = 0;
    saveData();
    updateDisplay();
  }
}

function showLevelUpModal(level) {
  const modal = document.getElementById('levelUpModal');
  document.getElementById('modalLevel').textContent = String(level).padStart(2, '0');
  modal.classList.add('show');
}

function closeLevelUpModal() {
  playBeep(1200, 150);
  document.getElementById('levelUpModal').classList.remove('show');
}

// Dark mode toggle
document.getElementById('darkModeToggle').onclick = () => {
  playBeep(500, 80);
  document.body.classList.toggle('dark');
  localStorage.setItem('darkMode', document.body.classList.contains('dark'));
  
  const btn = document.getElementById('darkModeToggle');
  btn.textContent = document.body.classList.contains('dark') ? 'DAY MODE' : 'NIGHT MODE';
};

// Load dark mode preference
if (localStorage.getItem('darkMode') === 'true') {
  document.body.classList.add('dark');
  document.getElementById('darkModeToggle').textContent = 'DAY MODE';
}

// Close modal on outside click
document.getElementById('levelUpModal').onclick = (e) => {
  if (e.target.id === 'levelUpModal') {
    closeLevelUpModal();
  }
};

// Enter key shortcuts
document.getElementById('activityName').addEventListener('keypress', (e) => {
  if (e.key === 'Enter') addActivity();
});

document.getElementById('pointsValue').addEventListener('keypress', (e) => {
  if (e.key === 'Enter') addActivity();
});

// Konami code easter egg (up up down down left right left right b a)
let konamiCode = [];
const konamiSequence = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];

document.addEventListener('keydown', (e) => {
  konamiCode.push(e.key);
  if (konamiCode.length > 10) konamiCode.shift();
  
  if (konamiCode.join(',') === konamiSequence.join(',')) {
    totalPoints += 999;
    saveData();
    updateDisplay();
    
    for (let i = 0; i < 5; i++) {
      setTimeout(() => {
        confetti({
          particleCount: 200,
          spread: 180,
          origin: { y: 0.6 },
          colors: ['#00ff41', '#ff10f0', '#00ffff', '#ffff00']
        });
        playBeep(440 + (i * 100), 100);
      }, i * 200);
    }
    
    konamiCode = [];
  }
});

// Initial display
updateDisplay();
