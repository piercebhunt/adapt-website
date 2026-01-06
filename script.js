let activities = JSON.parse(localStorage.getItem('activities')) || [];
let totalPoints = parseInt(localStorage.getItem('totalPoints')) || 0;
let timers = {};

const POINTS_PER_LEVEL = 100;

function saveData() {
  localStorage.setItem('activities', JSON.stringify(activities));
  localStorage.setItem('totalPoints', totalPoints);
}

function updateDisplay() {
  document.getElementById('totalPoints').textContent = totalPoints;
  
  const level = Math.floor(totalPoints / POINTS_PER_LEVEL) + 1;
  const progress = (totalPoints % POINTS_PER_LEVEL) / POINTS_PER_LEVEL * 100;
  
  document.getElementById('level').textContent = level;
  document.getElementById('progressText').textContent = Math.round(progress) + '%';
  document.getElementById('progressBar').style.width = progress + '%';

  const grid = document.getElementById('activityList');
  const emptyState = document.getElementById('emptyState');
  
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
    card.className = `activity-card ${act.points > 0 ? 'positive' : 'negative'}`;
    
    card.innerHTML = `
      <h3>${act.points > 0 ? '↑' : '↓'} ${act.name}</h3>
      <div class="points">${act.points > 0 ? '+' : ''}${act.points} pts ${act.type === 'hourly' ? '/hr' : ''}</div>
      ${act.type === 'hourly' ? '<div class="timer-display" id="timer-' + index + '">Not running</div>' : ''}
      <div class="controls"></div>
    `;
    
    const controls = card.querySelector('.controls');
    
    if (act.type === 'occurrence') {
      const btn = document.createElement('button');
      btn.textContent = 'Log';
      btn.onclick = () => logPoints(act.points, index);
      controls.appendChild(btn);
    } else {
      const startBtn = document.createElement('button');
      startBtn.textContent = 'Start';
      startBtn.onclick = () => startTimer(index);
      
      const stopBtn = document.createElement('button');
      stopBtn.textContent = 'Stop';
      stopBtn.onclick = () => stopTimer(index);
      
      controls.appendChild(startBtn);
      controls.appendChild(stopBtn);
    }
    
    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = 'Delete';
    deleteBtn.onclick = () => {
      if (confirm(`Delete "${act.name}"?`)) {
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
  
  if (points > 0) {
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.6 }
    });
  }
  
  if (newLevel > oldLevel) {
    showLevelUpModal(newLevel);
    setTimeout(() => {
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.5 }
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
  
  if (!name || isNaN(points)) return;
  
  activities.push({ name, points, type });
  saveData();
  updateDisplay();
  
  document.getElementById('activityName').value = '';
  document.getElementById('pointsValue').value = '';
}

function startTimer(index) {
  if (timers[index]) return;
  
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
    display.textContent = `${hrs}:${String(mins).padStart(2,'0')}:${String(secs).padStart(2,'0')} → ${earned >= 0 ? '+' : ''}${earned} pts`;
  }
}

function stopTimer(index) {
  if (!timers[index]) return;
  
  clearInterval(timers[index].interval);
  logPoints(timers[index].earned, index);
  delete timers[index];
  
  const display = document.getElementById(`timer-${index}`);
  if (display) display.textContent = 'Not running';
}

function resetPoints() {
  if (confirm('Reset all points to 0?')) {
    totalPoints = 0;
    saveData();
    updateDisplay();
  }
}

function showLevelUpModal(level) {
  const modal = document.getElementById('levelUpModal');
  document.getElementById('modalLevel').textContent = level;
  modal.classList.add('show');
}

function closeLevelUpModal() {
  document.getElementById('levelUpModal').classList.remove('show');
}

// Dark mode
document.getElementById('darkModeToggle').onclick = () => {
  document.body.classList.toggle('dark');
  localStorage.setItem('darkMode', document.body.classList.contains('dark'));
};

if (localStorage.getItem('darkMode') === 'true') {
  document.body.classList.add('dark');
}

// Close modal on click outside
document.getElementById('levelUpModal').onclick = (e) => {
  if (e.target.id === 'levelUpModal') {
    closeLevelUpModal();
  }
};

updateDisplay();
