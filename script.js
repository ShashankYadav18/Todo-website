// Smooth scroll
function scrollToSection(id) {
  document.getElementById(id).scrollIntoView({ behavior: "smooth" });
}

// Mobile menu toggle
const mobileMenuBtn = document.getElementById("mobileMenuBtn");
const nav = document.querySelector("nav");

if (mobileMenuBtn) {
  mobileMenuBtn.addEventListener("click", () => {
    nav.classList.toggle("active");
    const icon = mobileMenuBtn.querySelector("i");
    icon.classList.toggle("fa-bars");
    icon.classList.toggle("fa-times");
  });

  // Close menu when clicking nav links
  nav.querySelectorAll("a").forEach(link => {
    link.addEventListener("click", () => {
      nav.classList.remove("active");
      const icon = mobileMenuBtn.querySelector("i");
      icon.classList.add("fa-bars");
      icon.classList.remove("fa-times");
    });
  });
}

// Dark mode toggle
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

// Back to Top Button
const backToTop = document.getElementById("backToTop");
window.addEventListener("scroll", () => {
  if (window.scrollY > 300) {
    backToTop.style.display = "flex";
  } else {
    backToTop.style.display = "none";
  }
});
backToTop.addEventListener("click", () => {
  window.scrollTo({ top: 0, behavior: "smooth" });
});

// ============================================
// TO-DO LIST WITH LOCALSTORAGE
// ============================================

// DOM Elements
const addTaskBtn = document.getElementById("addTaskBtn");
const taskInput = document.getElementById("taskInput");
const taskList = document.getElementById("taskList");
const taskCount = document.getElementById("taskCount");
const clearCompletedBtn = document.getElementById("clearCompleted");
const filterBtns = document.querySelectorAll(".filter-btn");

// Tasks array - loaded from localStorage or empty
let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
let currentFilter = "all";

// Initialize app
function init() {
  renderTasks();
  updateTaskCount();
}

// Save tasks to localStorage
function saveTasks() {
  localStorage.setItem("tasks", JSON.stringify(tasks));
}

// Generate unique ID for each task
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Add new task
function addTask() {
  const taskText = taskInput.value.trim();
  if (taskText === "") return;

  const newTask = {
    id: generateId(),
    text: taskText,
    completed: false,
    createdAt: new Date().toISOString()
  };

  tasks.push(newTask);
  saveTasks();
  renderTasks();
  updateTaskCount();
  taskInput.value = "";
  taskInput.focus();
}

// Delete task by ID
function deleteTask(id) {
  tasks = tasks.filter(task => task.id !== id);
  saveTasks();
  renderTasks();
  updateTaskCount();
}

// Toggle task completion
function toggleTask(id) {
  tasks = tasks.map(task => 
    task.id === id ? { ...task, completed: !task.completed } : task
  );
  saveTasks();
  renderTasks();
  updateTaskCount();
}

// Edit task
function editTask(id, li) {
  const task = tasks.find(t => t.id === id);
  if (!task) return;

  const taskTextSpan = li.querySelector(".task-text");
  const currentText = task.text;

  // Create edit input
  const editInput = document.createElement("input");
  editInput.type = "text";
  editInput.className = "edit-input";
  editInput.value = currentText;

  // Replace span with input
  taskTextSpan.replaceWith(editInput);
  editInput.focus();
  editInput.select();

  // Save on blur or Enter
  function saveEdit() {
    const newText = editInput.value.trim();
    if (newText && newText !== currentText) {
      tasks = tasks.map(t => 
        t.id === id ? { ...t, text: newText } : t
      );
      saveTasks();
    }
    renderTasks();
  }

  editInput.addEventListener("blur", saveEdit);
  editInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      editInput.blur();
    }
  });
  editInput.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      renderTasks(); // Cancel edit
    }
  });
}

// Render tasks based on current filter
function renderTasks() {
  taskList.innerHTML = "";

  let filteredTasks = tasks;
  if (currentFilter === "active") {
    filteredTasks = tasks.filter(task => !task.completed);
  } else if (currentFilter === "completed") {
    filteredTasks = tasks.filter(task => task.completed);
  }

  if (filteredTasks.length === 0) {
    const emptyMessage = document.createElement("li");
    emptyMessage.className = "empty-message";
    emptyMessage.textContent = currentFilter === "all" 
      ? "No tasks yet. Add one above!" 
      : `No ${currentFilter} tasks.`;
    taskList.appendChild(emptyMessage);
    return;
  }

  filteredTasks.forEach((task, index) => {
    const li = document.createElement("li");
    li.className = task.completed ? "checked" : "";
    li.style.animationDelay = `${index * 0.05}s`;

    li.innerHTML = `
      <div class="task-content">
        <input type="checkbox" class="task-checkbox" ${task.completed ? "checked" : ""}>
        <span class="task-text">${escapeHtml(task.text)}</span>
      </div>
      <div class="task-actions">
        <button class="edit" title="Edit">✏️</button>
        <button class="delete" title="Delete">❌</button>
      </div>
    `;

    // Checkbox toggle
    li.querySelector(".task-checkbox").addEventListener("change", () => {
      toggleTask(task.id);
    });

    // Edit task
    li.querySelector(".edit").addEventListener("click", () => {
      editTask(task.id, li);
    });

    // Delete task
    li.querySelector(".delete").addEventListener("click", () => {
      li.classList.add("removing");
      setTimeout(() => deleteTask(task.id), 300);
    });

    // Double-click to edit
    li.querySelector(".task-text").addEventListener("dblclick", () => {
      editTask(task.id, li);
    });

    taskList.appendChild(li);
  });
}

// Update task counter
function updateTaskCount() {
  const activeTasks = tasks.filter(task => !task.completed).length;
  const totalTasks = tasks.length;
  taskCount.textContent = `${activeTasks} of ${totalTasks} task${totalTasks !== 1 ? 's' : ''} remaining`;
}

// Clear all completed tasks
function clearCompleted() {
  const completedCount = tasks.filter(task => task.completed).length;
  if (completedCount === 0) return;

  if (confirm(`Delete ${completedCount} completed task${completedCount !== 1 ? 's' : ''}?`)) {
    tasks = tasks.filter(task => !task.completed);
    saveTasks();
    renderTasks();
    updateTaskCount();
  }
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

// Filter button handling
filterBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    filterBtns.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    currentFilter = btn.dataset.filter;
    renderTasks();
  });
});

// Event Listeners
addTaskBtn.addEventListener("click", addTask);
taskInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") addTask();
});
clearCompletedBtn.addEventListener("click", clearCompleted);

// Initialize the app
init();
