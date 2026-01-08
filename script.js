// Smooth scroll
function scrollToSection(id) {
  document.getElementById(id).scrollIntoView({ behavior: "smooth" });
}

// Dark mode toggle
const toggleBtn = document.getElementById("darkModeToggle");
toggleBtn.addEventListener("click", () => {
  document.body.classList.toggle("dark");
  toggleBtn.textContent = document.body.classList.contains("dark") ? "☀️" : "🌙";
});

// Back to Top Button
const backToTop = document.getElementById("backToTop");
window.addEventListener("scroll", () => {
  if (window.scrollY > 300) {
    backToTop.style.display = "block";
  } else {
    backToTop.style.display = "none";
  }
});
backToTop.addEventListener("click", () => {
  window.scrollTo({ top: 0, behavior: "smooth" });
});

// To-Do List Logic
const addTaskBtn = document.getElementById("addTaskBtn");
const taskInput = document.getElementById("taskInput");
const taskList = document.getElementById("taskList");

addTaskBtn.addEventListener("click", addTask);
taskInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") addTask();
});

function addTask() {
  const taskText = taskInput.value.trim();
  if (taskText === "") return;

  const li = document.createElement("li");
  li.innerHTML = `
    <span class="task-text">${taskText}</span>
    <div class="task-actions">
      <button class="check">✅</button>
      <button class="delete">❌</button>
    </div>
  `;

  // Mark as done
  li.querySelector(".check").addEventListener("click", () => {
    li.classList.toggle("checked");
  });

  // Delete task
  li.querySelector(".delete").addEventListener("click", () => {
    li.remove();
  });

  taskList.appendChild(li);
  taskInput.value = "";
}
