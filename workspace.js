// ============================================
// TASKFLOW WORKSPACE - NOTION-LIKE FUNCTIONALITY
// ============================================

// -------- DARK MODE --------
const toggleBtn = document.getElementById("darkModeToggle");
const darkModeIcon = toggleBtn.querySelector("i");

// Load dark mode preference from localStorage
if (localStorage.getItem("darkMode") === "true") {
  document.body.classList.add("dark");
  darkModeIcon.classList.remove("fa-moon");
  darkModeIcon.classList.add("fa-sun");
}

toggleBtn.addEventListener("click", () => {
  document.body.classList.toggle("dark");
  const isDark = document.body.classList.contains("dark");
  darkModeIcon.classList.toggle("fa-moon");
  darkModeIcon.classList.toggle("fa-sun");
  localStorage.setItem("darkMode", isDark);
});

// -------- DATA MANAGEMENT --------
let workspaceTasks = JSON.parse(localStorage.getItem("workspaceTasks")) || [];
let projects = JSON.parse(localStorage.getItem("projects")) || [
  { id: "work", name: "Work", icon: "fa-briefcase", color: "#6366f1" },
  { id: "personal", name: "Personal", icon: "fa-home", color: "#10b981" },
  { id: "shopping", name: "Shopping", icon: "fa-shopping-cart", color: "#f59e0b" }
];

let currentView = "list";
let selectedTask = null;
let selectedPriority = "medium";
let selectedDueDate = null;
let currentMonth = new Date();

// -------- UTILITY FUNCTIONS --------
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function saveTasks() {
  localStorage.setItem("workspaceTasks", JSON.stringify(workspaceTasks));
}

function saveProjects() {
  localStorage.setItem("projects", JSON.stringify(projects));
}

function formatDate(dateStr) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === tomorrow.toDateString()) return "Tomorrow";
  
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function isOverdue(dateStr) {
  if (!dateStr) return false;
  const date = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date < today;
}

function isToday(dateStr) {
  if (!dateStr) return false;
  const date = new Date(dateStr);
  const today = new Date();
  return date.toDateString() === today.toDateString();
}

function isUpcoming(dateStr) {
  if (!dateStr) return false;
  const date = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const weekFromNow = new Date(today);
  weekFromNow.setDate(weekFromNow.getDate() + 7);
  return date > today && date <= weekFromNow;
}

// -------- TASK CREATION --------
const quickTaskInput = document.getElementById("quickTaskInput");
const quickAddBtn = document.getElementById("quickAddBtn");
const priorityPicker = document.getElementById("priorityPicker");
const datePicker = document.getElementById("datePicker");

function addTask(text, options = {}) {
  if (!text.trim()) return;

  const newTask = {
    id: generateId(),
    text: text.trim(),
    completed: false,
    priority: options.priority || selectedPriority,
    dueDate: options.dueDate || selectedDueDate,
    project: options.project || null,
    tags: options.tags || [],
    subtasks: [],
    notes: "",
    description: "",
    status: "todo",
    createdAt: new Date().toISOString()
  };

  workspaceTasks.push(newTask);
  saveTasks();
  renderAllViews();
  updateStats();

  // Reset selections
  selectedPriority = "medium";
  selectedDueDate = null;
  quickTaskInput.value = "";
}

quickAddBtn.addEventListener("click", () => addTask(quickTaskInput.value));
quickTaskInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") addTask(quickTaskInput.value);
});

// Priority Picker
document.getElementById("setPriority").addEventListener("click", (e) => {
  e.stopPropagation();
  priorityPicker.classList.toggle("hidden");
  datePicker.classList.add("hidden");
});

document.querySelectorAll(".priority-option").forEach(btn => {
  btn.addEventListener("click", () => {
    selectedPriority = btn.dataset.priority;
    priorityPicker.classList.add("hidden");
    document.getElementById("setPriority").classList.add("active");
  });
});

// Date Picker
document.getElementById("setDueDate").addEventListener("click", (e) => {
  e.stopPropagation();
  datePicker.classList.toggle("hidden");
  priorityPicker.classList.add("hidden");
});

document.querySelectorAll(".date-option").forEach(btn => {
  btn.addEventListener("click", () => {
    const today = new Date();
    if (btn.dataset.date === "today") {
      selectedDueDate = today.toISOString().split("T")[0];
    } else if (btn.dataset.date === "tomorrow") {
      today.setDate(today.getDate() + 1);
      selectedDueDate = today.toISOString().split("T")[0];
    } else if (btn.dataset.date === "week") {
      today.setDate(today.getDate() + 7);
      selectedDueDate = today.toISOString().split("T")[0];
    }
    datePicker.classList.add("hidden");
    document.getElementById("setDueDate").classList.add("active");
  });
});

document.getElementById("customDate").addEventListener("change", (e) => {
  selectedDueDate = e.target.value;
  datePicker.classList.add("hidden");
  document.getElementById("setDueDate").classList.add("active");
});

// Close pickers when clicking outside
document.addEventListener("click", (e) => {
  if (!e.target.closest(".quick-add-section")) {
    priorityPicker.classList.add("hidden");
    datePicker.classList.add("hidden");
  }
});

// -------- VIEW SWITCHING --------
const viewBtns = document.querySelectorAll(".view-btn");
const listView = document.getElementById("listView");
const boardView = document.getElementById("boardView");
const calendarView = document.getElementById("calendarView");

viewBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    viewBtns.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    currentView = btn.dataset.view;

    listView.classList.remove("active");
    boardView.classList.remove("active");
    calendarView.classList.remove("active");

    if (currentView === "list") listView.classList.add("active");
    else if (currentView === "board") boardView.classList.add("active");
    else if (currentView === "calendar") {
      calendarView.classList.add("active");
      renderCalendar();
    }
  });
});

// -------- LIST VIEW RENDERING --------
function renderListView() {
  const todayTasks = document.getElementById("todayTasks");
  const upcomingTasks = document.getElementById("upcomingTasks");
  const somedayTasks = document.getElementById("somedayTasks");
  const completedTasks = document.getElementById("completedTasks");

  todayTasks.innerHTML = "";
  upcomingTasks.innerHTML = "";
  somedayTasks.innerHTML = "";
  completedTasks.innerHTML = "";

  let todayCount = 0, upcomingCount = 0, somedayCount = 0, completedCount = 0;

  workspaceTasks.forEach(task => {
    const li = createTaskListItem(task);

    if (task.completed) {
      completedTasks.appendChild(li);
      completedCount++;
    } else if (isToday(task.dueDate) || isOverdue(task.dueDate)) {
      todayTasks.appendChild(li);
      todayCount++;
    } else if (isUpcoming(task.dueDate)) {
      upcomingTasks.appendChild(li);
      upcomingCount++;
    } else {
      somedayTasks.appendChild(li);
      somedayCount++;
    }
  });

  // Update counts
  document.querySelector('[data-group="today"]').querySelector(".group-count").textContent = todayCount;
  document.querySelector('[data-group="upcoming"]').querySelector(".group-count").textContent = upcomingCount;
  document.querySelector('[data-group="someday"]').querySelector(".group-count").textContent = somedayCount;
  document.querySelector('[data-group="completed"]').querySelector(".group-count").textContent = completedCount;
}

function createTaskListItem(task) {
  const li = document.createElement("li");
  li.className = `priority-${task.priority}`;
  if (task.completed) li.classList.add("completed");
  li.dataset.taskId = task.id;

  li.innerHTML = `
    <div class="task-checkbox ${task.completed ? "checked" : ""}" data-id="${task.id}"></div>
    <div class="task-content">
      <div class="task-title">${task.text}</div>
      <div class="task-meta">
        ${task.dueDate ? `<span class="task-due ${isOverdue(task.dueDate) && !task.completed ? "overdue" : ""}"><i class="fas fa-calendar"></i> ${formatDate(task.dueDate)}</span>` : ""}
        ${task.project ? `<span class="task-project"><i class="fas fa-folder"></i> ${getProjectName(task.project)}</span>` : ""}
        ${task.subtasks.length > 0 ? `<span class="task-subtasks"><i class="fas fa-tasks"></i> ${task.subtasks.filter(s => s.completed).length}/${task.subtasks.length}</span>` : ""}
      </div>
    </div>
    <div class="task-actions">
      <button class="task-action-btn edit-btn" data-id="${task.id}"><i class="fas fa-edit"></i></button>
      <button class="task-action-btn delete" data-id="${task.id}"><i class="fas fa-trash"></i></button>
    </div>
  `;

  // Toggle completion
  li.querySelector(".task-checkbox").addEventListener("click", (e) => {
    e.stopPropagation();
    toggleTaskCompletion(task.id);
  });

  // Open detail panel
  li.addEventListener("click", () => openTaskDetail(task.id));

  // Delete
  li.querySelector(".delete").addEventListener("click", (e) => {
    e.stopPropagation();
    deleteTask(task.id);
  });

  return li;
}

function getProjectName(projectId) {
  const project = projects.find(p => p.id === projectId);
  return project ? project.name : "";
}

// -------- BOARD VIEW RENDERING --------
function renderBoardView() {
  const todoColumn = document.getElementById("todoColumn");
  const inprogressColumn = document.getElementById("inprogressColumn");
  const reviewColumn = document.getElementById("reviewColumn");
  const doneColumn = document.getElementById("doneColumn");

  todoColumn.innerHTML = "";
  inprogressColumn.innerHTML = "";
  reviewColumn.innerHTML = "";
  doneColumn.innerHTML = "";

  let todoCount = 0, inprogressCount = 0, reviewCount = 0, doneCount = 0;

  workspaceTasks.forEach(task => {
    const card = createKanbanCard(task);

    switch (task.status) {
      case "inprogress":
        inprogressColumn.appendChild(card);
        inprogressCount++;
        break;
      case "review":
        reviewColumn.appendChild(card);
        reviewCount++;
        break;
      case "done":
        doneColumn.appendChild(card);
        doneCount++;
        break;
      default:
        todoColumn.appendChild(card);
        todoCount++;
    }
  });

  // Update counts
  document.querySelector('[data-status="todo"] .column-count').textContent = todoCount;
  document.querySelector('[data-status="inprogress"] .column-count').textContent = inprogressCount;
  document.querySelector('[data-status="review"] .column-count').textContent = reviewCount;
  document.querySelector('[data-status="done"] .column-count').textContent = doneCount;
}

function createKanbanCard(task) {
  const card = document.createElement("div");
  card.className = "kanban-card";
  card.draggable = true;
  card.dataset.taskId = task.id;

  card.innerHTML = `
    <div class="kanban-card-title">${task.text}</div>
    <div class="kanban-card-meta">
      <div class="kanban-card-tags">
        ${task.priority === "urgent" ? '<span class="kanban-card-tag tag-urgent">Urgent</span>' : ""}
        ${task.priority === "high" ? '<span class="kanban-card-tag tag-bug">High</span>' : ""}
      </div>
      ${task.dueDate ? `<span><i class="fas fa-calendar"></i> ${formatDate(task.dueDate)}</span>` : ""}
    </div>
  `;

  card.addEventListener("click", () => openTaskDetail(task.id));

  // Drag and drop
  card.addEventListener("dragstart", (e) => {
    e.dataTransfer.setData("taskId", task.id);
    card.style.opacity = "0.5";
  });

  card.addEventListener("dragend", () => {
    card.style.opacity = "1";
  });

  return card;
}

// Drag and drop for columns
document.querySelectorAll(".column-tasks").forEach(column => {
  column.addEventListener("dragover", (e) => e.preventDefault());
  
  column.addEventListener("drop", (e) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData("taskId");
    const status = column.closest(".kanban-column").dataset.status;
    
    const task = workspaceTasks.find(t => t.id === taskId);
    if (task) {
      task.status = status;
      if (status === "done") task.completed = true;
      else task.completed = false;
      saveTasks();
      renderAllViews();
      updateStats();
    }
  });
});

// Add card buttons
document.querySelectorAll(".add-card-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    const status = btn.closest(".kanban-column").dataset.status;
    const text = prompt("Enter task name:");
    if (text) {
      addTask(text, { status });
    }
  });
});

// -------- CALENDAR VIEW --------
function renderCalendar() {
  const calendarDays = document.getElementById("calendarDays");
  const currentMonthEl = document.getElementById("currentMonth");
  
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  
  currentMonthEl.textContent = currentMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDay = firstDay.getDay();
  const totalDays = lastDay.getDate();
  
  calendarDays.innerHTML = "";
  
  // Previous month days
  const prevMonthLastDay = new Date(year, month, 0).getDate();
  for (let i = startDay - 1; i >= 0; i--) {
    const day = document.createElement("div");
    day.className = "calendar-day other-month";
    day.innerHTML = `<div class="day-number">${prevMonthLastDay - i}</div>`;
    calendarDays.appendChild(day);
  }
  
  // Current month days
  const today = new Date();
  for (let i = 1; i <= totalDays; i++) {
    const day = document.createElement("div");
    day.className = "calendar-day";
    
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(i).padStart(2, "0")}`;
    
    if (today.getFullYear() === year && today.getMonth() === month && today.getDate() === i) {
      day.classList.add("today");
    }
    
    // Get tasks for this day
    const dayTasks = workspaceTasks.filter(t => t.dueDate === dateStr && !t.completed);
    
    day.innerHTML = `
      <div class="day-number">${i}</div>
      ${dayTasks.slice(0, 3).map(t => `<div class="calendar-task">${t.text}</div>`).join("")}
      ${dayTasks.length > 3 ? `<div class="calendar-task">+${dayTasks.length - 3} more</div>` : ""}
    `;
    
    day.addEventListener("click", () => {
      selectedDueDate = dateStr;
      const text = prompt("Add task for " + formatDate(dateStr) + ":");
      if (text) addTask(text);
    });
    
    calendarDays.appendChild(day);
  }
  
  // Next month days
  const remainingDays = 42 - (startDay + totalDays);
  for (let i = 1; i <= remainingDays; i++) {
    const day = document.createElement("div");
    day.className = "calendar-day other-month";
    day.innerHTML = `<div class="day-number">${i}</div>`;
    calendarDays.appendChild(day);
  }
}

document.getElementById("prevMonth").addEventListener("click", () => {
  currentMonth.setMonth(currentMonth.getMonth() - 1);
  renderCalendar();
});

document.getElementById("nextMonth").addEventListener("click", () => {
  currentMonth.setMonth(currentMonth.getMonth() + 1);
  renderCalendar();
});

document.getElementById("goToday").addEventListener("click", () => {
  currentMonth = new Date();
  renderCalendar();
});

// -------- TASK DETAIL PANEL --------
const taskDetailPanel = document.getElementById("taskDetailPanel");
const closePanelBtn = document.getElementById("closePanelBtn");

function openTaskDetail(taskId) {
  selectedTask = workspaceTasks.find(t => t.id === taskId);
  if (!selectedTask) return;

  taskDetailPanel.classList.remove("hidden");
  
  document.getElementById("detailTitle").value = selectedTask.text;
  document.getElementById("detailDescription").value = selectedTask.description || "";
  document.getElementById("detailPriority").value = selectedTask.priority;
  document.getElementById("detailDueDate").value = selectedTask.dueDate || "";
  document.getElementById("detailProject").value = selectedTask.project || "";
  document.getElementById("notesEditor").textContent = selectedTask.notes || "";
  document.getElementById("createdDate").textContent = `Created: ${new Date(selectedTask.createdAt).toLocaleDateString()}`;
  
  renderSubtasks();
  renderSelectedTags();
}

closePanelBtn.addEventListener("click", () => {
  taskDetailPanel.classList.add("hidden");
  selectedTask = null;
});

// Auto-save changes
["detailTitle", "detailDescription", "detailPriority", "detailDueDate", "detailProject"].forEach(id => {
  document.getElementById(id).addEventListener("change", saveTaskDetail);
});

document.getElementById("notesEditor").addEventListener("blur", saveTaskDetail);

function saveTaskDetail() {
  if (!selectedTask) return;

  selectedTask.text = document.getElementById("detailTitle").value;
  selectedTask.description = document.getElementById("detailDescription").value;
  selectedTask.priority = document.getElementById("detailPriority").value;
  selectedTask.dueDate = document.getElementById("detailDueDate").value;
  selectedTask.project = document.getElementById("detailProject").value;
  selectedTask.notes = document.getElementById("notesEditor").textContent;

  saveTasks();
  renderAllViews();
}

// Subtasks
function renderSubtasks() {
  const subtaskList = document.getElementById("subtaskList");
  subtaskList.innerHTML = "";

  if (!selectedTask) return;

  selectedTask.subtasks.forEach((subtask, index) => {
    const li = document.createElement("li");
    li.className = `subtask-item ${subtask.completed ? "completed" : ""}`;
    li.innerHTML = `
      <input type="checkbox" ${subtask.completed ? "checked" : ""} data-index="${index}">
      <span>${subtask.text}</span>
      <i class="fas fa-times" data-index="${index}" style="cursor:pointer;color:var(--gray-400);"></i>
    `;

    li.querySelector("input").addEventListener("change", (e) => {
      selectedTask.subtasks[index].completed = e.target.checked;
      saveTasks();
      renderSubtasks();
      renderAllViews();
    });

    li.querySelector("i").addEventListener("click", () => {
      selectedTask.subtasks.splice(index, 1);
      saveTasks();
      renderSubtasks();
    });

    subtaskList.appendChild(li);
  });
}

document.getElementById("addSubtaskBtn").addEventListener("click", () => {
  const input = document.getElementById("subtaskInput");
  if (!input.value.trim() || !selectedTask) return;

  selectedTask.subtasks.push({
    text: input.value.trim(),
    completed: false
  });

  saveTasks();
  input.value = "";
  renderSubtasks();
});

// Tags
function renderSelectedTags() {
  const container = document.getElementById("selectedTags");
  container.innerHTML = "";

  if (!selectedTask) return;

  selectedTask.tags.forEach((tag, index) => {
    const span = document.createElement("span");
    span.className = "selected-tag";
    span.innerHTML = `${tag} <i class="fas fa-times" data-index="${index}"></i>`;
    
    span.querySelector("i").addEventListener("click", () => {
      selectedTask.tags.splice(index, 1);
      saveTasks();
      renderSelectedTags();
    });

    container.appendChild(span);
  });
}

document.getElementById("tagInput").addEventListener("keypress", (e) => {
  if (e.key === "Enter" && selectedTask) {
    const tag = e.target.value.trim();
    if (tag && !selectedTask.tags.includes(tag)) {
      selectedTask.tags.push(tag);
      saveTasks();
      renderSelectedTags();
    }
    e.target.value = "";
  }
});

// Delete task
document.getElementById("deleteTaskBtn").addEventListener("click", () => {
  if (selectedTask) {
    deleteTask(selectedTask.id);
    taskDetailPanel.classList.add("hidden");
    selectedTask = null;
  }
});

// -------- TASK OPERATIONS --------
function toggleTaskCompletion(id) {
  const task = workspaceTasks.find(t => t.id === id);
  if (task) {
    task.completed = !task.completed;
    task.status = task.completed ? "done" : "todo";
    saveTasks();
    renderAllViews();
    updateStats();
  }
}

function deleteTask(id) {
  workspaceTasks = workspaceTasks.filter(t => t.id !== id);
  saveTasks();
  renderAllViews();
  updateStats();
}

// -------- SEARCH --------
const searchModal = document.getElementById("searchModal");
const globalSearch = document.getElementById("globalSearch");
const searchResults = document.getElementById("searchResults");

document.getElementById("searchBtn").addEventListener("click", () => {
  searchModal.classList.remove("hidden");
  globalSearch.focus();
});

document.getElementById("closeSearchModal").addEventListener("click", () => {
  searchModal.classList.add("hidden");
});

globalSearch.addEventListener("input", (e) => {
  const query = e.target.value.toLowerCase();
  
  if (!query) {
    searchResults.innerHTML = '<p class="search-hint">Start typing to search...</p>';
    return;
  }

  const results = workspaceTasks.filter(t => 
    t.text.toLowerCase().includes(query) ||
    t.description?.toLowerCase().includes(query) ||
    t.notes?.toLowerCase().includes(query)
  );

  if (results.length === 0) {
    searchResults.innerHTML = '<p class="search-hint">No results found</p>';
    return;
  }

  searchResults.innerHTML = results.map(task => `
    <div class="search-result-item" data-id="${task.id}">
      <i class="fas ${task.completed ? "fa-check-circle" : "fa-circle"}"></i>
      <div>
        <div>${task.text}</div>
        <small style="color:var(--gray-400);">${task.project ? getProjectName(task.project) : "No project"}</small>
      </div>
    </div>
  `).join("");

  searchResults.querySelectorAll(".search-result-item").forEach(item => {
    item.addEventListener("click", () => {
      searchModal.classList.add("hidden");
      openTaskDetail(item.dataset.id);
    });
  });
});

// Keyboard shortcut for search
document.addEventListener("keydown", (e) => {
  if (e.key === "/" && !e.target.matches("input, textarea, [contenteditable]")) {
    e.preventDefault();
    searchModal.classList.remove("hidden");
    globalSearch.focus();
  }
  if (e.key === "Escape") {
    searchModal.classList.add("hidden");
    taskDetailPanel.classList.add("hidden");
  }
});

// -------- PROJECT MODAL --------
const projectModal = document.getElementById("projectModal");
let selectedIcon = "fa-folder";
let selectedColor = "#6366f1";

document.getElementById("addProjectBtn").addEventListener("click", () => {
  projectModal.classList.remove("hidden");
});

document.getElementById("closeProjectModal").addEventListener("click", () => {
  projectModal.classList.add("hidden");
});

document.getElementById("cancelProject").addEventListener("click", () => {
  projectModal.classList.add("hidden");
});

document.querySelectorAll(".icon-option").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".icon-option").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    selectedIcon = btn.dataset.icon;
  });
});

document.querySelectorAll(".color-option").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".color-option").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    selectedColor = btn.dataset.color;
  });
});

document.getElementById("saveProject").addEventListener("click", () => {
  const name = document.getElementById("projectName").value.trim();
  if (!name) return;

  const newProject = {
    id: generateId(),
    name,
    icon: selectedIcon,
    color: selectedColor
  };

  projects.push(newProject);
  saveProjects();
  renderProjects();
  projectModal.classList.add("hidden");
  document.getElementById("projectName").value = "";
});

function renderProjects() {
  const projectList = document.getElementById("projectList");
  projectList.innerHTML = "";

  projects.forEach(project => {
    const taskCount = workspaceTasks.filter(t => t.project === project.id && !t.completed).length;
    
    const li = document.createElement("li");
    li.className = "sidebar-item";
    li.dataset.board = project.id;
    li.innerHTML = `
      <i class="fas ${project.icon}" style="color: ${project.color}"></i>
      <span>${project.name}</span>
      <span class="item-count">${taskCount}</span>
    `;

    li.addEventListener("click", () => {
      document.querySelectorAll(".sidebar-item").forEach(s => s.classList.remove("active"));
      li.classList.add("active");
      // Filter tasks by project (could be implemented)
    });

    projectList.appendChild(li);
  });

  // Update project dropdown in detail panel
  const detailProject = document.getElementById("detailProject");
  detailProject.innerHTML = '<option value="">No Project</option>';
  projects.forEach(p => {
    detailProject.innerHTML += `<option value="${p.id}">${p.name}</option>`;
  });
}

// -------- GROUP HEADER COLLAPSE --------
document.querySelectorAll(".group-header").forEach(header => {
  header.addEventListener("click", () => {
    header.classList.toggle("collapsed");
    const list = header.nextElementSibling;
    list.style.display = header.classList.contains("collapsed") ? "none" : "block";
  });
});

// -------- STATS --------
function updateStats() {
  const today = new Date().toDateString();
  const completedToday = workspaceTasks.filter(t => 
    t.completed && new Date(t.createdAt).toDateString() === today
  ).length;
  
  const pending = workspaceTasks.filter(t => !t.completed).length;
  const total = workspaceTasks.length;
  const completionRate = total > 0 ? Math.round((workspaceTasks.filter(t => t.completed).length / total) * 100) : 0;

  document.getElementById("completedToday").textContent = completedToday;
  document.getElementById("pendingTasks").textContent = pending;
  document.getElementById("completionProgress").style.width = completionRate + "%";

  // Update project counts
  renderProjects();
}

// -------- SEARCH FILTER --------
document.getElementById("taskSearch").addEventListener("input", (e) => {
  const query = e.target.value.toLowerCase();
  document.querySelectorAll(".task-list li").forEach(li => {
    const title = li.querySelector(".task-title").textContent.toLowerCase();
    li.style.display = title.includes(query) ? "" : "none";
  });
});

// -------- RENDER ALL --------
function renderAllViews() {
  renderListView();
  renderBoardView();
  if (currentView === "calendar") renderCalendar();
}

// -------- SIDEBAR NAVIGATION --------
document.querySelectorAll(".sidebar-item").forEach(item => {
  item.addEventListener("click", () => {
    document.querySelectorAll(".sidebar-item").forEach(s => s.classList.remove("active"));
    item.classList.add("active");
  });
});

// -------- INITIALIZE --------
function init() {
  renderAllViews();
  renderProjects();
  updateStats();
}

init();
