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
  document.getElementById('progressPath').style.strokeDasharray = `${progress}, 100`;

  const list = document.getElementById('activityList');
  const emptyState = document.getElementById('emptyState');
  
  // Show/hide empty state
  if (activities.length === 0) {
    emptyState.classList.add('show');
    list.style.display = 'none';
  } else {
    emptyState.classList.remove('show');
    list.style.display = 'grid';
  }
  
  list.innerHTML = '';
  activities.forEach((act, index) => {
    const li = document.createElement('li');
    li.className = `card ${act.points > 0 ? 'positive' : 'negative'}`;
    
    li.innerHTML = `
      <h3>${act.points > 0 ? '✅' : '⚠️'} ${act.name}</h3>
      <div class="points">${act.points > 0 ? '+' : ''}${act.points} pts ${act.type === 'hourly' ? '/hr' : ''}</div>
      ${act.type === 'hourly' ? '<div class="timer-display" id="timer-' + index + '">⏱️ Not running</div>' : ''}
      <div class="controls"></div>
    `;
    
    const controls = li.querySelector('.controls');
    
    if (act.type === 'occurrence') {
      const btn = document.createElement('button');
      btn.textContent = '✓ Log It';
      btn.onclick = () => logPoints(act.points, index);
      controls.appendChild(btn);
    } else {
      const startBtn = document.createElement('button');
      startBtn.textContent = '▶ Start';
      startBtn.onclick = () => startTimer(index);
      
      const stopBtn = document.createElement('button');
      stopBtn.textContent = '⏹ Stop & Claim';
      stopBtn.onclick = () => stopTimer(index);
      stopBtn.style.background = '#48bb78';
      
      controls.appendChild(startBtn);
      controls.appendChild(stopBtn);
    }
    
    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = '🗑️ Delete';
    deleteBtn.onclick = () => {
      if (confirm(`Delete "${act.name}"?`)) {
        activities.splice(index, 1);
        stopTimer(index);
        saveData();
        updateDisplay();
      }
    };
    controls.appendChild(deleteBtn);
    
    list.appendChild(li);
  });
}

function logPoints(points, index) {
  const oldLevel = Math.floor(totalPoints / POINTS_PER_LEVEL) + 1;
  totalPoints += points;
  const newLevel = Math.floor(totalPoints / POINTS_PER_LEVEL) + 1;
  
  // Confetti for any positive points
  if (points > 0) {
    confetti({
      particleCount: Math.min(points * 10, 150),
      spread: 70,
      origin: { y: 0.6 }
    });
  }
  
  // Special level-up celebration
  if (newLevel > oldLevel) {
    showLevelUpModal(newLevel);
    setTimeout(() => {
      confetti({
        particleCount: 200,
        spread: 100,
        origin: { y: 0.5 },
        colors: ['#667eea', '#764ba2', '#FFD700']
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
    alert('Please enter an activity name');
    return;
  }
  
  if (isNaN(points)) {
    alert('Please enter a valid point value');
    return;
  }
  
  activities.push({ name, points, type });
  saveData();
  updateDisplay();
  
  // Clear form
  document.getElementById('activityName').value = '';
  document.getElementById('pointsValue').value = '';
  
  // Small success feedback
  confetti({
    particleCount: 50,
    spread: 50,
    origin: { y: 0.4 }
  });
}

function startTimer(index) {
  if (timers[index]) {
    alert('Timer is already running!');
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
    display.textContent = `⏱️ ${hrs}h ${mins}m ${secs}s → ${earned >= 0 ? '+' : ''}${earned} pts`;
  }
}

function stopTimer(index) {
  if (!timers[index]) return;
  
  clearInterval(timers[index].interval);
  logPoints(timers[index].earned, index);
  delete timers[index];
  
  const display = document.getElementById(`timer-${index}`);
  if (display) display.textContent = '⏱️ Not running';
}

function resetPoints() {
  if (confirm('Reset all points to 0? (Your activities will stay)')) {
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

// Dark mode toggle
document.getElementById('darkModeToggle').onclick = () => {
  document.body.classList.toggle('dark');
  localStorage.setItem('darkMode', document.body.classList.contains('dark'));
};

// Load dark mode preference
if (localStorage.getItem('darkMode') === 'true') {
  document.body.classList.add('dark');
}

// Close modal on outside click
document.getElementById('levelUpModal').onclick = (e) => {
  if (e.target.id === 'levelUpModal') {
    closeLevelUpModal();
  }
};

// Allow Enter key to add activity
document.getElementById('activityName').addEventListener('keypress', (e) => {
  if (e.key === 'Enter') addActivity();
});

document.getElementById('pointsValue').addEventListener('keypress', (e) => {
  if (e.key === 'Enter') addActivity();
});

// Initial display
updateDisplay();
