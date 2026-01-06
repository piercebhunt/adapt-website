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
  list.innerHTML = '';
  activities.forEach((act, index) => {
    const li = document.createElement('li');
    li.className = `card ${act.points > 0 ? 'positive' : 'negative'}`;
    
    li.innerHTML = `
      <h3>${act.points > 0 ? '✅' : '⚠️'} ${act.name}</h3>
      <div class="points">${act.points > 0 ? '+' : ''}${act.points} pts ${act.type === 'hourly' ? '/hr' : ''}</div>
      ${act.type === 'hourly' ? '<div class="timer-display" id="timer-' + index + '">Not running</div>' : ''}
      <div class="controls"></div>
    `;
    
    const controls = li.querySelector('.controls');
    
    if (act.type === 'occurrence') {
      const btn = document.createElement('button');
      btn.textContent = 'Log It';
      btn.onclick = () => logPoints(act.points, index);
      controls.appendChild(btn);
    } else {
      const startBtn = document.createElement('button');
      startBtn.textContent = 'Start Timer';
      startBtn.onclick = () => startTimer(index);
      
      const stopBtn = document.createElement('button');
      stopBtn.textContent = 'Stop & Claim';
      stopBtn.onclick = () => stopTimer(index);
      
      controls.appendChild(startBtn);
      controls.appendChild(stopBtn);
    }
    
    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = 'Delete';
    deleteBtn.style.background = '#f44336';
    deleteBtn.onclick = () => {
      activities.splice(index, 1);
      stopTimer(index); // Clean up if running
      saveData();
      updateDisplay();
    };
    controls.appendChild(deleteBtn);
    
    list.appendChild(li);
  });
}

function logPoints(points, index) {
  const oldTotal = totalPoints;
  totalPoints += points;
  if (totalPoints - oldTotal >= 10) confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
  saveData();
  updateDisplay();
}

function addActivity() {
  const name = document.getElementById('activityName').value.trim();
  const points = parseInt(document.getElementById('pointsValue').value);
  const type = document.getElementById('type').value;
  
  if (name && !isNaN(points)) {
    activities.push({ name, points, type });
    saveData();
    updateDisplay();
    document.getElementById('activityName').value = '';
    document.getElementById('pointsValue').value = '';
  }
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
    const mins = Math.floor(elapsed / 60) % 60;
    const secs = Math.floor(elapsed % 60);
    display.textContent = `Running: ${Math.floor(elapsed/3600)}h ${mins}m ${secs}s → +${earned} pts`;
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
  if (confirm('Reset points to 0? (Activities stay)')) {
    totalPoints = 0;
    saveData();
    updateDisplay();
  }
}

// Dark mode
document.getElementById('darkModeToggle').onclick = () => {
  document.body.classList.toggle('dark');
  localStorage.setItem('darkMode', document.body.classList.contains('dark'));
};

// Load dark mode preference
if (localStorage.getItem('darkMode') === 'true') document.body.classList.add('dark');

updateDisplay();
