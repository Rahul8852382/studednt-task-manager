/**
 * ==========================================================================
 * STUDENT TASK MANAGER - APPLICATION LOGIC
 * ==========================================================================
 * 
 * In this file, we will manage the state of our tasks, connect them with 
 * local storage for persistent data saving, update the dashboard statistics,
 * and handle user interactions (like adding, editing, completing, or deleting tasks).
 * 
 * Since you are learning web development, this script uses modern, standard, 
 * clean JavaScript with detailed comments to explain HOW and WHY everything works.
 */

// ==========================================================================
// 1. STATE & DATA CONFIGURATION
// ==========================================================================

// This is our main 'state' store. It holds the array of tasks and current UI settings.
let tasks = [];
let currentFilter = 'all'; // Can be: 'all', 'pending', 'completed'
let searchQuery = '';

// Load tasks from Local Storage on initial load, or default to some sample tasks
function loadTasks() {
  const storedTasks = localStorage.getItem('student_tasks');
  if (storedTasks) {
    tasks = JSON.parse(storedTasks);
  } else {
    // Inject some sample tasks for beginner students to visualize the app instantly!
    tasks = [
      {
        id: 'sample-1',
        name: '📚 Math Homework Assignment',
        desc: 'Complete exercises 1 to 15 on Chapter 4 (Calculus limits). Show all steps in your workbook.',
        dueDate: '2026-07-20',
        priority: 'High',
        completed: false
      },
      {
        id: 'sample-2',
        name: '🔬 Chemistry Lab Report',
        desc: 'Write up findings from the Acid-Base titration lab experiment and submit the PDF online.',
        dueDate: '2026-07-24',
        priority: 'Medium',
        completed: true
      },
      {
        id: 'sample-3',
        name: '📝 English Essay Prep',
        desc: 'Outline the main arguments for the argumentative essay on Renewable Energy and climate policy.',
        dueDate: '2026-07-28',
        priority: 'Low',
        completed: false
      }
    ];
    saveTasks(); // Save these initial samples to Local Storage
  }
}

// Save current tasks array to local storage as a JSON string
function saveTasks() {
  localStorage.setItem('student_tasks', JSON.stringify(tasks));
}

// ==========================================================================
// 2. DOM ELEMENT REFERENCES
// ==========================================================================
// We select elements from index.html using document.getElementById and document.querySelector.
// This allows us to dynamically read user inputs or output contents to the screen.

const taskForm = document.getElementById('taskForm');
const taskNameInput = document.getElementById('taskName');
const taskDescInput = document.getElementById('taskDesc');
const taskDueDateInput = document.getElementById('taskDueDate');
const taskTimeInput = document.getElementById('taskTime');
const taskPrioritySelect = document.getElementById('taskPriority');
const editingTaskIdInput = document.getElementById('editingTaskId');
const submitBtn = document.getElementById('submitBtn');
const cancelEditBtn = document.getElementById('cancelEditBtn');
const formTitle = document.getElementById('formTitle');

// Stats Counters & Progress Bar Elements
const totalTasksCount = document.getElementById('totalTasksCount');
const pendingTasksCount = document.getElementById('pendingTasksCount');
const completedTasksCount = document.getElementById('completedTasksCount');
const progressPercent = document.getElementById('progressPercent');
const progressBarFill = document.getElementById('progressBarFill');

// Search and Filter Elements
const searchInput = document.getElementById('searchInput');
const filterAllBtn = document.getElementById('filterAll');
const filterPendingBtn = document.getElementById('filterPending');
const filterCompletedBtn = document.getElementById('filterCompleted');

// Task List container
const taskGrid = document.getElementById('taskGrid');
const emptyState = document.getElementById('emptyState');

// Layout Controls
const themeToggle = document.getElementById('themeToggle');
const dateBadge = document.getElementById('dateBadge');

// ==========================================================================
// 3. MAIN APP FUNCTIONS
// ==========================================================================

/**
 * Helper to animate numerical text values smoothly.
 */
function animateCounter(element, endVal, isPercent = false, duration = 450) {
  if (!element) return;
  const startVal = parseInt(element.textContent, 10) || 0;
  if (startVal === endVal) {
    element.textContent = endVal + (isPercent ? '%' : '');
    return;
  }
  let startTime = null;
  function step(timestamp) {
    if (!startTime) startTime = timestamp;
    const progress = Math.min((timestamp - startTime) / duration, 1);
    const current = Math.floor(progress * (endVal - startVal) + startVal);
    element.textContent = current + (isPercent ? '%' : '');
    if (progress < 1) {
      window.requestAnimationFrame(step);
    } else {
      element.textContent = endVal + (isPercent ? '%' : '');
    }
  }
  window.requestAnimationFrame(step);
}

/**
 * Updates the Dashboard Metrics & Progress Bar.
 * This calculates the totals, pending count, completed count, and fills the progress bar.
 */
function updateDashboard() {
  const total = tasks.length;
  const completed = tasks.filter(task => task.completed).length;
  const pending = total - completed;
  
  // Calculate completion percentage safely (prevent division by zero!)
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
  
  // Update the text values on screen using smooth counter animation
  animateCounter(totalTasksCount, total);
  animateCounter(pendingTasksCount, pending);
  animateCounter(completedTasksCount, completed);
  animateCounter(progressPercent, percent, true);
  
  // Smoothly adjust the width of the progress bar using CSS transitions
  progressBarFill.style.width = `${percent}%`;
  
  // Update Today's Progress Card
  updateTodayProgressCard();
  
  if (typeof updateGreetingAndMotivation === 'function') {
    updateGreetingAndMotivation();
  }
}

/**
 * Updates the collapsible Today's Progress Card with live task metrics.
 */
function updateTodayProgressCard() {
  const total = tasks.length;
  const completed = tasks.filter(task => task.completed).length;
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
  
  const todayProgressPercent = document.getElementById('todayProgressPercent');
  const todayProgressBarFill = document.getElementById('todayProgressBarFill');
  const todayTasksCompletedText = document.getElementById('todayTasksCompletedText');
  const todayStreakText = document.getElementById('todayStreakText');
  const todayDailyGoalText = document.getElementById('todayDailyGoalText');
  
  if (todayProgressPercent) {
    animateCounter(todayProgressPercent, percent, true);
  }
  
  if (todayProgressBarFill) {
    todayProgressBarFill.style.width = `${percent}%`;
  }
  
  if (todayTasksCompletedText) {
    todayTasksCompletedText.textContent = `${completed} / ${total} Completed Today`;
  }
  
  if (todayDailyGoalText) {
    todayDailyGoalText.textContent = `${percent}% Completed`;
  }
  
  if (todayStreakText) {
    let streakCount = 3; // Default default streak is 3
    const storedStreak = localStorage.getItem('student_streak');
    if (storedStreak) {
      try {
        const parsed = JSON.parse(storedStreak);
        if (parsed && typeof parsed.count === 'number') {
          streakCount = parsed.count;
        }
      } catch (e) {
        console.error("Failed to parse streak", e);
      }
    }
    todayStreakText.textContent = `${streakCount}-Day Streak`;
  }
}

/**
 * Formats calendar dates into a more human-friendly readable format.
 * Input: "2026-07-20" -> Output: "Jul 20, 2026"
 */
function formatReadableDate(dateString) {
  if (!dateString) return '';
  const dateParts = dateString.split('-');
  if (dateParts.length !== 3) return dateString;
  
  const year = parseInt(dateParts[0], 10);
  const month = parseInt(dateParts[1], 10) - 1; // JS months are 0-indexed
  const day = parseInt(dateParts[2], 10);
  
  const date = new Date(year, month, day);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

/**
 * Formats 24-hour time strings into a friendly 12-hour AM/PM format.
 * Input: "14:30" -> Output: "2:30 PM"
 * Input: "09:15" -> Output: "9:15 AM"
 */
function formatReadableTime(timeString) {
  if (!timeString) return '';
  const timeParts = timeString.split(':');
  if (timeParts.length < 2) return timeString;
  
  let hours = parseInt(timeParts[0], 10);
  const minutes = timeParts[1];
  const ampm = hours >= 12 ? 'PM' : 'AM';
  
  hours = hours % 12;
  hours = hours ? hours : 12; // The hour '0' should be '12'
  
  return `${hours}:${minutes} ${ampm}`;
}

/**
 * Render Tasks Grid dynamically.
 * This filters the task array according to search strings and filter tabs,
 * and outputs HTML elements representing cards for each matching task.
 */
function renderTasks() {
  // Clear any existing tasks displayed inside the grid
  // We keep the empty state element in the HTML, we'll toggle its visibility later!
  const cards = taskGrid.querySelectorAll('.task-card');
  cards.forEach(card => card.remove());
  
  // 1. Filter tasks list based on current active tab
  let filteredTasks = tasks.filter(task => {
    if (currentFilter === 'pending') return !task.completed;
    if (currentFilter === 'completed') return task.completed;
    return true; // 'all' filter shows everything
  });
  
  // 2. Further filter tasks based on user search term
  if (searchQuery.trim() !== '') {
    const query = searchQuery.toLowerCase().trim();
    filteredTasks = filteredTasks.filter(task => 
      task.name.toLowerCase().includes(query) || 
      task.desc.toLowerCase().includes(query)
    );
  }
  
  // 3. Check if there are any tasks to display
  if (filteredTasks.length === 0) {
    emptyState.classList.remove('hidden');
    return;
  } else {
    emptyState.classList.add('hidden');
  }
  
  // 4. Sort tasks: show high priority or pending ones first
  filteredTasks.sort((a, b) => {
    // Sort completed tasks to the bottom
    if (a.completed !== b.completed) {
      return a.completed ? 1 : -1;
    }
    // Sort by priority order: High -> Medium -> Low
    const priorityWeight = { 'High': 3, 'Medium': 2, 'Low': 1 };
    return priorityWeight[b.priority] - priorityWeight[a.priority];
  });
  
  // 5. Generate and render the task card HTML elements
  filteredTasks.forEach(task => {
    // Create main card div
    const card = document.createElement('div');
    card.id = `task-${task.id}`;
    card.className = `card task-card priority-${task.priority.toLowerCase()} ${task.completed ? 'is-completed' : ''}`;
    
    // Select correct priority badge class
    const priorityClass = `p-${task.priority.toLowerCase()}`;
    const statusText = task.completed ? 'Completed' : 'Pending';
    const statusClass = task.completed ? 'status-complete' : 'status-pending';
    
    // Assemble the card's inner content
    card.innerHTML = `
      <div class="task-card-header">
        <div class="task-card-meta">
          <span class="badge ${priorityClass}">${task.priority} Priority</span>
          <span class="badge ${statusClass}">${statusText}</span>
        </div>
        <h3 class="task-title">${escapeHTML(task.name)}</h3>
      </div>
      
      <div class="task-card-body">
        <p class="task-desc">${escapeHTML(task.desc)}</p>
        <div class="task-meta-details">
          <div class="task-due-date">
            <span class="detail-icon">📅</span>
            <span>Due: ${formatReadableDate(task.dueDate)}</span>
          </div>
          ${task.taskTime ? `
          <div class="task-due-time">
            <span class="detail-icon">🕒</span>
            <span>Time: ${formatReadableTime(task.taskTime)}</span>
          </div>
          ` : ''}
        </div>
      </div>
      
      <div class="task-card-actions">
        <button class="btn-complete-task" title="${task.completed ? 'Mark as Pending' : 'Mark as Completed'}" onclick="toggleCompleteTask('${task.id}')">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"></path></svg>
          <span>${task.completed ? 'Reopen' : 'Complete'}</span>
        </button>
        <button class="btn-edit-task" title="Edit Task" onclick="prepareEditTask('${task.id}')">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"></path></svg>
          <span>Edit</span>
        </button>
        <button class="btn-delete-task" title="Delete Task" onclick="deleteTask('${task.id}')">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
          <span>Delete</span>
        </button>
      </div>
    `;
    
    // Append the newly created card to the taskGrid
    taskGrid.appendChild(card);
  });
}

/**
 * Escapes HTML strings to prevent cross-site scripting (XSS).
 * This is a highly recommended security practice for beginners, protecting against malicious inputs!
 */
function escapeHTML(str) {
  if (!str) return '';
  return str.replace(/[&<>'"]/g, 
    tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[tag] || tag)
  );
}

// ==========================================================================
// 4. INTERACTIVE EVENT HANDLERS
// ==========================================================================

/**
 * Submits the Form: Handles both creating a new task AND editing an existing task.
 */
taskForm.addEventListener('submit', function(event) {
  // Prevent standard form reload behavior
  event.preventDefault();
  
  const id = editingTaskIdInput.value;
  const name = taskNameInput.value.trim();
  const desc = taskDescInput.value.trim();
  const dueDate = taskDueDateInput.value;
  const taskTime = taskTimeInput.value || '';
  const priority = taskPrioritySelect.value;
  
  if (id) {
    // If id is present, we are EDITING an existing task!
    const taskIndex = tasks.findIndex(task => task.id === id);
    if (taskIndex !== -1) {
      tasks[taskIndex].name = name;
      tasks[taskIndex].desc = desc;
      tasks[taskIndex].dueDate = dueDate;
      tasks[taskIndex].taskTime = taskTime;
      tasks[taskIndex].priority = priority;
    }
    resetForm();
  } else {
    // Otherwise, we are CREATING a brand new task!
    const newTask = {
      id: 'task-' + Date.now(), // Generate unique simple timestamp-based ID
      name: name,
      desc: desc,
      dueDate: dueDate,
      taskTime: taskTime,
      priority: priority,
      completed: false // All new tasks start as pending
    };
    tasks.push(newTask);
    taskForm.reset();
  }
  
  saveTasks();
  updateDashboard();
  renderTasks();
});

/**
 * Toggles the complete state of a task (completed <-> pending).
 */
window.toggleCompleteTask = function(taskId) {
  const taskIndex = tasks.findIndex(task => task.id === taskId);
  if (taskIndex !== -1) {
    const nextCompletedState = !tasks[taskIndex].completed;
    tasks[taskIndex].completed = nextCompletedState;
    if (typeof handleStreakUpdate === 'function') {
      handleStreakUpdate(nextCompletedState);
    }
    saveTasks();
    updateDashboard();
    renderTasks();
  }
};

/**
 * Prepares the Form to edit a selected task.
 * Populates all fields with the existing task's information and shows edit mode.
 */
window.prepareEditTask = function(taskId) {
  const task = tasks.find(t => t.id === taskId);
  if (task) {
    // Populate form elements
    editingTaskIdInput.value = task.id;
    taskNameInput.value = task.name;
    taskDescInput.value = task.desc;
    taskDueDateInput.value = task.dueDate;
    taskTimeInput.value = task.taskTime || '';
    taskPrioritySelect.value = task.priority;
    
    // Adjust form headings and visual actions
    formTitle.textContent = "Edit Task Details";
    submitBtn.textContent = "Save Changes";
    submitBtn.className = "btn btn-primary";
    cancelEditBtn.classList.remove('hidden');
    
    // Smooth scroll the viewport back to the form card on smaller screens so the student can edit immediately
    document.getElementById('formCard').scrollIntoView({ behavior: 'smooth' });
    taskNameInput.focus();
  }
};

/**
 * Cancels editing, resetting the form back to create mode.
 */
cancelEditBtn.addEventListener('click', resetForm);

function resetForm() {
  taskForm.reset();
  editingTaskIdInput.value = '';
  formTitle.textContent = "Create New Task";
  submitBtn.textContent = "Save Task";
  cancelEditBtn.classList.add('hidden');
}

/**
 * Deletes a task from the list.
 */
window.deleteTask = function(taskId) {
  // Give the student card a brief fade animation before fully deleting
  const cardElement = document.getElementById(`task-${taskId}`);
  if (cardElement) {
    cardElement.style.transition = 'opacity 0.2s, transform 0.2s';
    cardElement.style.opacity = '0';
    cardElement.style.transform = 'scale(0.9)';
    
    // Wait for the short animation to finish, then delete from state and re-render
    setTimeout(() => {
      tasks = tasks.filter(task => task.id !== taskId);
      saveTasks();
      updateDashboard();
      renderTasks();
    }, 200);
  } else {
    // Fallback if element wasn't rendered
    tasks = tasks.filter(task => task.id !== taskId);
    saveTasks();
    updateDashboard();
    renderTasks();
  }
};

// ==========================================================================
// 5. SEARCH & FILTER TABS CONTROLLERS
// ==========================================================================

// Handle search queries live as the student types
searchInput.addEventListener('input', function(event) {
  searchQuery = event.target.value;
  renderTasks();
});

// Setup active styles and filter states when clicking tab buttons
const filterButtons = [
  { element: filterAllBtn, filterValue: 'all' },
  { element: filterPendingBtn, filterValue: 'pending' },
  { element: filterCompletedBtn, filterValue: 'completed' }
];

filterButtons.forEach(btn => {
  btn.element.addEventListener('click', () => {
    // Remove active styling from all filter buttons
    filterButtons.forEach(b => b.element.classList.remove('active'));
    
    // Apply active styling to the clicked button
    btn.element.classList.add('active');
    
    // Re-render based on selected filter
    currentFilter = btn.filterValue;
    renderTasks();
  });
});

// ==========================================================================
// 6. HEADER INFO & COSMETIC INTERACTIONS
// ==========================================================================

// Populate the visual header with the current date beautifully
function updateHeaderDate() {
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  const today = new Date();
  dateBadge.textContent = today.toLocaleDateString('en-US', options);
}

// Set initial date picker min bounds to today's date so students can't accidentally pick past dates!
function setMinDatepickerDate() {
  const today = new Date();
  const year = today.getFullYear();
  let month = today.getMonth() + 1;
  let day = today.getDate();
  
  // Format numbers to dual-digit strings (e.g. 5 -> "05")
  if (month < 10) month = '0' + month;
  if (day < 10) day = '0' + day;
  
  taskDueDateInput.min = `${year}-${month}-${day}`;
}

// ==========================================================================
// 7. THEME MODE SYSTEM (LIGHT vs. DARK)
// ==========================================================================

function setupTheme() {
  const savedTheme = localStorage.getItem('student_theme') || 'light';
  
  if (savedTheme === 'dark') {
    document.body.classList.add('dark');
  } else {
    document.body.classList.remove('dark');
  }
}

themeToggle.addEventListener('click', () => {
  const isDark = document.body.classList.contains('dark');
  
  if (isDark) {
    document.body.classList.remove('dark');
    localStorage.setItem('student_theme', 'light');
  } else {
    document.body.classList.add('dark');
    localStorage.setItem('student_theme', 'dark');
  }
});

// ==========================================================================
// 9. AI MENTOR CONTROLLER
// ==========================================================================

const coachTimeLimitInput = document.getElementById('coachTimeLimit');
const getCoachAdviceBtn = document.getElementById('getCoachAdviceBtn');
const coachResponseContainer = document.getElementById('coachResponseContainer');
const coachResponseContent = document.getElementById('coachResponseContent');
const hideCoachResponseBtn = document.getElementById('hideCoachResponseBtn');

/**
 * A highly lightweight, clean, beginner-friendly Markdown to HTML parser.
 * It converts basic markdown bolding (**), headings (###), list items (-),
 * and paragraph breaks into native standard HTML safely.
 */
function parseSimpleMarkdown(markdown) {
  if (!markdown) return '';
  
  // Clean up carriage returns
  let html = markdown.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  
  // Escape HTML to prevent any injection from task names/descriptions
  html = escapeHTML(html);
  
  // 1. Process Headings: ### Heading to <h3>Heading</h3>, etc.
  html = html.replace(/^### (.*?)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.*?)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.*?)$/gm, '<h1>$1</h1>');
  
  // 2. Process Bold text: **text** to <strong>text</strong>
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  
  // 3. Process Bullet Lists: - item to <li>item</li>
  // First, target any line starting with a dash or asterisk followed by space
  html = html.replace(/^[-\*] (.*?)$/gm, '<li>$1</li>');
  
  // Group adjacent <li> tags into <ul> groups
  html = html.replace(/(<li>.*?<\/li>)+/gs, '<ul>$&</ul>');
  
  // 4. Handle remaining paragraph / line breaks (split by double newlines)
  const blocks = html.split(/\n\n+/);
  html = blocks.map(block => {
    block = block.trim();
    if (!block) return '';
    // If the block is already a heading or list, don't wrap it in a paragraph
    if (block.startsWith('<h') || block.startsWith('<ul') || block.startsWith('<li')) {
      return block;
    }
    return `<p>${block.replace(/\n/g, '<br>')}</p>`;
  }).join('');
  
  return html;
}

/**
 * Makes an asynchronous POST request to the server API to ask Gemini
 * for tailored study advice based on the user's task list.
 */
async function getCoachAdvice() {
  // If no tasks exist, friendly notice
  if (tasks.length === 0) {
    coachResponseContent.innerHTML = "<p><strong>AI Mentor's friendly reminder:</strong> Add some tasks first so I can analyze your schedule and give you custom advice! 🎓</p>";
    coachResponseContainer.classList.remove('hidden');
    return;
  }
  
  // Disable button and change label to show loading status
  getCoachAdviceBtn.disabled = true;
  const originalText = getCoachAdviceBtn.innerHTML;
  getCoachAdviceBtn.innerHTML = `
    <span class="animate-spin">🔄</span>
    <span>Formulating Plan...</span>
  `;
  
  coachResponseContainer.classList.remove('hidden');
  coachResponseContent.innerHTML = `
    <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 2rem 0; text-align: center; gap: 0.5rem;">
      <span style="font-size: 2rem; animation: float 1.5s ease-in-out infinite;">🧠</span>
      <p style="font-weight: 600; color: var(--primary-color);">Gemini is formulating your ultimate study plan...</p>
      <p style="font-size: 0.75rem; color: var(--text-secondary);">Calculating priorities, deadlines, and active study blocks...</p>
    </div>
  `;
  
  try {
    const response = await fetch("/api/coach", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        tasks: tasks,
        timeLimit: coachTimeLimitInput.value.trim()
      })
    });
    
    if (!response.ok) {
      throw new Error(`Server returned code ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error);
    }
    
    // Parse response markdown securely to formatted HTML
    const formattedHTML = parseSimpleMarkdown(data.recommendation);
    coachResponseContent.innerHTML = formattedHTML;
    
    // Auto scroll the coach response section smoothly into view so the student notices it
    coachResponseContainer.scrollIntoView({ behavior: 'smooth' });
    
  } catch (error) {
    console.error("Failed to fetch advice:", error);
    coachResponseContent.innerHTML = `
      <p style="color: var(--priority-high-txt); font-weight: 600;">⚠️ Could not reach your AI Mentor</p>
      <p style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 0.5rem;">
        Error: ${error.message || "Unknown error occurred"}. Ensure your server is running and the Gemini API Key is configured in Settings > Secrets.
      </p>
    `;
  } finally {
    // Reset button states
    getCoachAdviceBtn.disabled = false;
    getCoachAdviceBtn.innerHTML = originalText;
  }
}

// Add click listeners to Coach controls
getCoachAdviceBtn.addEventListener('click', getCoachAdvice);
hideCoachResponseBtn.addEventListener('click', () => {
  coachResponseContainer.classList.add('hidden');
});

// ==========================================================================
// 10. PREMIUM SMART GREETING & MOTIVATION CONTROLLER
// ==========================================================================

const greetingBadge = document.getElementById('greetingBadge');
const greetingTitle = document.getElementById('greetingTitle');
const profileWelcomeText = document.getElementById('profileWelcomeText');

// Welcome Modal Elements
const nameModalOverlay = document.getElementById('nameModalOverlay');
const modalNameInput = document.getElementById('modalNameInput');
const modalCharCount = document.getElementById('modalCharCount');
const modalContinueBtn = document.getElementById('modalContinueBtn');

const motivationIcon = document.getElementById('motivationIcon');
const motivationTitle = document.getElementById('motivationTitle');
const motivationDesc = document.getElementById('motivationDesc');

// Utility to get local date string YYYY-MM-DD
function getLocalDateString() {
  const d = new Date();
  const year = d.getFullYear();
  let month = d.getMonth() + 1;
  let day = d.getDate();
  if (month < 10) month = '0' + month;
  if (day < 10) day = '0' + day;
  return `${year}-${month}-${day}`;
}

// Utility to get yesterday's date string YYYY-MM-DD
function getYesterdayDateString() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const year = d.getFullYear();
  let month = d.getMonth() + 1;
  let day = d.getDate();
  if (month < 10) month = '0' + month;
  if (day < 10) day = '0' + day;
  return `${year}-${month}-${day}`;
}

// Handle streak tracking on task completion
window.handleStreakUpdate = function(isCompleteAction) {
  let streakData = JSON.parse(localStorage.getItem('student_streak')) || { count: 3, lastCompletedDate: getYesterdayDateString() };
  const todayStr = getLocalDateString();
  const yesterdayStr = getYesterdayDateString();

  if (isCompleteAction) {
    if (streakData.lastCompletedDate === yesterdayStr) {
      streakData.count += 1;
      streakData.lastCompletedDate = todayStr;
    } else if (streakData.lastCompletedDate !== todayStr) {
      // If they haven't completed anything in more than a day, start streak at 1
      streakData.count = 1;
      streakData.lastCompletedDate = todayStr;
    }
  } else {
    // If they reopen a task, we don't necessarily penalize them unless they have zero completed tasks left
    const completedTasksToday = tasks.filter(t => t.completed).length;
    if (completedTasksToday === 0 && streakData.lastCompletedDate === todayStr) {
      streakData.lastCompletedDate = yesterdayStr;
      if (streakData.count > 1) {
        streakData.count -= 1;
      }
    }
  }
  
  localStorage.setItem('student_streak', JSON.stringify(streakData));
};

// Update the Greeting and the Dynamic Motivational Card
window.updateGreetingAndMotivation = function() {
  // 1. Update Greeting & Emoji based on time
  // 🌅 Good Morning (5:00 AM – 11:59 AM)
  // ☀ Good Afternoon (12:00 PM – 4:59 PM)
  // 🌇 Good Evening (5:00 PM – 8:59 PM)
  // 🌙 Good Night (9:00 PM – 4:59 AM)
  const now = new Date();
  const hours = now.getHours();
  let greetingText = "Good Night";
  let greetingEmoji = "🌙";

  if (hours >= 5 && hours < 12) {
    greetingText = "Good Morning";
    greetingEmoji = "🌅";
  } else if (hours >= 12 && hours < 17) {
    greetingText = "Good Afternoon";
    greetingEmoji = "☀";
  } else if (hours >= 17 && hours < 21) {
    greetingText = "Good Evening";
    greetingEmoji = "🌇";
  }

  if (greetingBadge) {
    greetingBadge.textContent = greetingEmoji;
  }

  // Read profile name from Local Storage
  const profileName = localStorage.getItem('student_profile_name') || '';
  if (greetingTitle) {
    if (profileName) {
      greetingTitle.innerHTML = `${greetingText}, <span class="profile-name-text-span">${escapeHTML(profileName)}</span> <button type="button" id="editNameInlineBtn" class="edit-name-icon-btn" title="Edit your name">✏️</button> 👋`;
      if (profileWelcomeText) {
        profileWelcomeText.textContent = "Ready to achieve your goals?";
        profileWelcomeText.classList.remove('hidden');
      }
      
      const editBtn = document.getElementById('editNameInlineBtn');
      if (editBtn) {
        editBtn.addEventListener('click', () => {
          openNameModal(profileName);
        });
      }
    } else {
      greetingTitle.innerHTML = `${greetingText}! <button type="button" id="editNameInlineBtn" class="edit-name-icon-btn" title="Set your name">✏️</button>`;
      if (profileWelcomeText) {
        profileWelcomeText.classList.add('hidden');
      }
      
      const editBtn = document.getElementById('editNameInlineBtn');
      if (editBtn) {
        editBtn.addEventListener('click', () => {
          openNameModal('');
        });
      }
    }
  }

  // 2. Select Dynamic Motivational Card based on task progress
  const total = tasks.length;
  const completed = tasks.filter(t => t.completed).length;
  const pending = total - completed;
  const todayStr = getLocalDateString();
  
  // Check for urgent task due today
  const hasUrgentTaskToday = tasks.some(t => !t.completed && t.dueDate === todayStr);

  // Read Streak details
  if (!localStorage.getItem('student_streak')) {
    localStorage.setItem('student_streak', JSON.stringify({ count: 3, lastCompletedDate: getYesterdayDateString() }));
  }
  const streakData = JSON.parse(localStorage.getItem('student_streak'));

  if (motivationIcon && motivationTitle && motivationDesc) {
    // Motivational Logic Cascade
    if (total > 0 && pending === 0) {
      // Condition A: All tasks completed
      motivationIcon.textContent = "🎉";
      motivationTitle.textContent = "Outstanding!";
      motivationDesc.textContent = "You've completed every task today. Enjoy your success!";
    } else if (total > 0 && pending === 1) {
      // Condition B: Only one task remaining
      motivationIcon.textContent = "🔥";
      motivationTitle.textContent = "Almost There!";
      motivationDesc.textContent = "Complete one more task to finish your day strong.";
    } else if (hasUrgentTaskToday) {
      // Condition C: Urgent task due today
      motivationIcon.textContent = "🚨";
      motivationTitle.textContent = "Deadline Alert";
      motivationDesc.textContent = "One important task needs your attention today.";
    } else if (streakData && streakData.count >= 1 && (streakData.lastCompletedDate === todayStr || streakData.lastCompletedDate === getYesterdayDateString())) {
      // Condition D: Ongoing streak
      motivationIcon.textContent = "🔥";
      motivationTitle.textContent = "Momentum";
      motivationDesc.textContent = `${streakData.count}-Day Streak. Don't break it today!`;
    } else if (total > 0 && completed === 0) {
      // Condition E: No completed tasks yet
      motivationIcon.textContent = "🌱";
      motivationTitle.textContent = "Fresh Start";
      motivationDesc.textContent = "Complete your first task and build today's momentum.";
    } else {
      // Condition F: Fallback / General motivational advice
      motivationIcon.textContent = "💡";
      motivationTitle.textContent = "Stay Focused";
      motivationDesc.textContent = "Small, consistent steps lead to major academic achievements!";
    }
  }
};

// Opens the welcome modal overlay
window.openNameModal = function(currentName = '') {
  if (!nameModalOverlay) return;
  
  modalNameInput.value = currentName;
  const length = currentName.length;
  modalCharCount.textContent = length;
  
  // Disable continue button if length is 0 (trimmed)
  modalContinueBtn.disabled = currentName.trim().length === 0;
  
  // Show overlay with animations
  nameModalOverlay.classList.remove('hidden');
  nameModalOverlay.classList.remove('fade-out');
  modalNameInput.focus();
};

// Closes the welcome modal overlay with a smooth fade-out transition
window.closeNameModal = function() {
  if (!nameModalOverlay) return;
  nameModalOverlay.classList.add('fade-out');
  
  // Hide completely after transition completes (300ms matching transition speed)
  setTimeout(() => {
    nameModalOverlay.classList.add('hidden');
    nameModalOverlay.classList.remove('fade-out');
  }, 300);
};

// Listen to key inputs in Modal Name Input for real-time validation and character count
if (modalNameInput) {
  modalNameInput.addEventListener('input', () => {
    const value = modalNameInput.value;
    const trimmed = value.trim();
    modalCharCount.textContent = value.length;
    modalContinueBtn.disabled = trimmed.length === 0;
  });
  
  modalNameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !modalContinueBtn.disabled) {
      modalContinueBtn.click();
    }
  });
}

// Handle Modal Continue button click
if (modalContinueBtn) {
  modalContinueBtn.addEventListener('click', () => {
    const finalName = modalNameInput.value.trim();
    if (finalName.length > 0) {
      localStorage.setItem('student_profile_name', finalName.substring(0, 25));
      closeNameModal();
      updateGreetingAndMotivation();
    }
  });
}

// Today's Progress details expand/collapse handler
const toggleProgressDetailsBtn = document.getElementById('toggleProgressDetailsBtn');
const progressDetailsContent = document.getElementById('progressDetailsContent');
const toggleProgressText = document.getElementById('toggleProgressText');

if (toggleProgressDetailsBtn && progressDetailsContent && toggleProgressText) {
  toggleProgressDetailsBtn.addEventListener('click', () => {
    const isCollapsed = progressDetailsContent.classList.contains('collapsed');
    if (isCollapsed) {
      progressDetailsContent.classList.remove('collapsed');
      toggleProgressText.textContent = '▲ Hide Progress Details';
    } else {
      progressDetailsContent.classList.add('collapsed');
      toggleProgressText.textContent = '▼ View Details';
    }
  });
}

// ==========================================================================
// 8. INITIAL SYSTEM STARTUP
// ==========================================================================
// This code block triggers automatically once the file is loaded by the browser.

loadTasks();
updateHeaderDate();
setMinDatepickerDate();
setupTheme();
updateDashboard();
renderTasks();

// On first launch, check if a username exists; if not, open modal prompt!
const savedName = localStorage.getItem('student_profile_name');
if (!savedName) {
  openNameModal('');
}
