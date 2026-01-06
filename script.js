// Daily tasks with points and metadata
const dailyTasks = [
  // Health & Wellness (5-60 min activities)
  { name: 'Brush teeth (morning)', points: 5, time: '2 min', category: 'health', type: 'occurrence' },
  { name: 'Brush teeth (night)', points: 5, time: '2 min', category: 'health', type: 'occurrence' },
  { name: 'Shower', points: 8, time: '10 min', category: 'health', type: 'occurrence' },
  { name: 'Workout (30+ min)', points: 25, time: '30-60 min', category: 'health', type: 'occurrence' },
  { name: 'Workout (60+ min)', points: 40, time: '60+ min', category: 'health', type: 'occurrence' },
  { name: 'Morning stretch', points: 5, time: '5 min', category: 'health', type: 'occurrence' },
  { name: 'Drink water (8 glasses)', points: 8, time: 'Throughout day', category: 'health', type: 'occurrence' },
  { name: 'Eat healthy breakfast', points: 10, time: '15 min', category: 'health', type: 'occurrence' },
  { name: 'Eat healthy lunch', points: 10, time: '20 min', category: 'health', type: 'occurrence' },
  { name: 'Eat healthy dinner', points: 10, time: '30 min', category: 'health', type: 'occurrence' },
  
  // Productivity (varies widely)
  { name: 'Coding practice (30 min)', points: 15, time: '30 min', category: 'productivity', type: 'occurrence' },
  { name: 'Coding practice (1 hour)', points: 25, time: '1 hour', category: 'productivity', type: 'occurrence' },
  { name: 'Coding practice (2+ hours)', points: 40, time: '2+ hours', category: 'productivity', type: 'occurrence' },
  { name: 'Work/Study (focused hour)', points: 20, time: '1 hour', category: 'productivity', type: 'occurrence' },
  { name: 'Learn something new', points: 15, time: '30 min', category: 'productivity', type: 'occurrence' },
  { name: 'Read book (30 min)', points: 12, time: '30 min', category: 'productivity', type: 'occurrence' },
  { name: 'Complete a project task', points: 20, time: 'Varies', category: 'productivity', type: 'occurrence' },
  
  // Daily Habits (quick tasks)
  { name: 'Make bed', points: 5, time: '2 min', category: 'habits', type: 'occurrence' },
  { name: 'Tidy room', points: 8, time: '10 min', category: 'habits', type: 'occurrence' },
  { name: 'Do dishes', points: 7, time: '10 min', category: 'habits', type: 'occurrence' },
  { name: 'Laundry', points: 10, time: '15 min', category: 'habits', type: 'occurrence' },
  { name: 'Plan tomorrow', points: 8, time: '5 min', category: 'habits', type: 'occurrence' },
  { name: 'Meditate', points: 12, time: '10 min', category: 'habits', type: 'occurrence' },
  { name: 'Journal', points: 10, time: '10 min', category: 'habits', type: 'occurrence' },
  
  // Social & Personal
  { name: 'Call family/friend', points: 12, time: '15 min', category: 'social', type: 'occurrence' },
  { name: 'Quality time with loved ones', points: 15, time: '30+ min', category: 'social', type: 'occurrence' },
  { name: 'Help someone', points: 15, time: 'Varies', category: 'social', type: 'occurrence' },
  
  // Negative habits
  { name: 'Skip workout', points: -15, time: 'N/A', category: 'health', type: 'occurrence' },
  { name: 'Junk food binge', points: -12, time: 'N/A', category: 'health', type: 'occurrence' },
  { name: 'Doomscroll social media (30+ min)', points: -10, time: '30+ min', category: 'habits', type: 'occurrence' }
];

let completedTasks = JSON.parse(localStorage.getItem('completedTasks')) || [];
let totalPoints = parseInt(localStorage.getItem('totalPoints')) || 0;
let lastResetDate = localStorage.getItem('lastResetDate') || new Date().toDateString();
let currentFilter = 'all';

// Check if we need to reset for a new day
function checkDayReset() {
  const today = new Date().toDateString();
  if (lastResetDate !== today) {
    completedTasks = [];
    totalPoints = 0;
    lastResetDate = today;
    saveData();
  }
}

function saveData() {
  localStorage.setItem('completedTasks', JSON.stringify(completedTasks));
  localStorage.setItem('totalPoints', totalPoints);
  localStorage.setItem('lastResetDate', lastResetDate);
}

function getStatus(points) {
  if (points >= 400) return { label: 'Concerning', class: 'concerning', emoji: '⚠️', message: 'Take a break! Balance is important.' };
  if (points >= 300) return { label: 'Elite', class: 'elite', emoji: '👑', message: 'Absolutely crushing it today!' };
  if (points >= 200) return { label: 'Extraordinary', class: 'extraordinary', emoji: '⭐', message: 'Outstanding performance!' };
  if (points >= 100) return { label: 'Goal', class: 'goal', emoji: '🎯', message: 'Daily goal achieved!' };
  return { label: 'Getting Started', class: '', emoji: '🚀', message: 'Keep going!' };
}

function updateDisplay() {
  const status = getStatus(totalPoints);
  const progress = Math.min((totalPoints / 100) * 100, 100);
  
  document.getElementById('totalPoints').textContent = totalPoints;
  document.getElementById('progressBar').style.width = progress + '%';
  document.getElementById('progressText').textContent = `${totalPoints} / 100`;
  
  const badge = document.getElementById('statusBadge');
  badge.textContent = status.label;
  badge.className = `stat-value status-badge ${status.class}`;
  
  const grid = document.getElementById('activityList');
  grid.innerHTML = '';
  
  const filteredTasks = currentFilter === 'all' 
    ? dailyTasks 
    : dailyTasks.filter(task => task.category === currentFilter);
  
  filteredTasks.forEach((task, originalIndex) => {
    const taskIndex = dailyTasks.indexOf(task);
    const isCompleted = completedTasks.includes(taskIndex);
    
    const card = document.createElement('div');
    card.className = `activity-card ${task.points > 0 ? 'positive' : 'negative'} ${isCompleted ? 'completed' : ''}`;
    
    card.innerHTML = `
      <h3>${task.points > 0 ? '↑' : '↓'} ${task.name}</h3>
      <div class="task-meta">
        <span class="task-category">${task.category}</span>
        <span>${task.time}</span>
      </div>
      <div class="points">${task.points > 0 ? '+' : ''}${task.points} pts</div>
      <div class="controls"></div>
    `;
    
    const controls = card.querySelector('.controls');
    const btn = document.createElement('button');
    
    if (isCompleted) {
      btn.textContent = '✓ Completed';
      btn.className = 'completed';
      btn.onclick = () => uncompleteTask(taskIndex);
    } else {
      btn.textContent = 'Complete';
      btn.onclick = () => completeTask(taskIndex, task.points);
    }
    
    controls.appendChild(btn);
    grid.appendChild(card);
  });
}

function completeTask(taskIndex, points) {
  const previousStatus = getStatus(totalPoints);
  
  completedTasks.push(taskIndex);
  totalPoints += points;
  
  const newStatus = getStatus(totalPoints);
  
  if (points > 0) {
    confetti({
      particleCount: Math.min(points * 2, 100),
      spread: 60,
      origin: { y: 0.6 }
    });
  }
  
  // Show milestone modal
  if (previousStatus.label !== newStatus.label && totalPoints >= 100) {
    showStatusModal(newStatus);
  }
  
  saveData();
  updateDisplay();
}

function uncompleteTask(taskIndex) {
  const task = dailyTasks[taskIndex];
  completedTasks = completedTasks.filter(id => id !== taskIndex);
  totalPoints -= task.points;
  
  saveData();
  updateDisplay();
}

function filterTasks(category) {
  currentFilter = category;
  
  // Update button states
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  event.target.classList.add('active');
  
  updateDisplay();
}

function resetDay() {
  if (confirm('Reset today\'s progress? This will clear all completed tasks and points.')) {
    completedTasks = [];
    totalPoints = 0;
    saveData();
    updateDisplay();
  }
}

function showStatusModal(status) {
  const modal = document.getElementById('levelUpModal');
  document.getElementById('statusEmoji').textContent = status.emoji;
  document.getElementById('statusTitle').textContent = status.label + '!';
  document.getElementById('statusMessage').textContent = status.message;
  modal.classList.add('show');
  
  setTimeout(() => {
    confetti({
      particleCount: 150,
      spread: 100,
      origin: { y: 0.5 }
    });
  }, 100);
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

// Initialize
checkDayReset();
updateDisplay();
