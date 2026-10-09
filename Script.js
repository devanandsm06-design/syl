
const form = document.getElementById("task-form");
const input = document.getElementById("task-input");
const list = document.getElementById("task-list");
const emptyState = document.getElementById("empty-state");

const taskCount = document.getElementById("task-count");
const progressLabel = document.getElementById("progress-label");
const progressFill = document.getElementById("progress-fill");
const progressTrack = document.getElementById("progress-track");
const dateLabel = document.getElementById("today-date");
const filters = document.querySelectorAll(".filter");

let tasks = [];
let currentFilter = "all";

// Load saved tasks
try {
  const savedTasks = localStorage.getItem("monotask-tasks");
  const parsedTasks = savedTasks ? JSON.parse(savedTasks) : [];

  if (Array.isArray(parsedTasks)) {
    tasks = parsedTasks.filter(task =>
      task &&
      typeof task.id === "string" &&
      typeof task.title === "string" &&
      typeof task.completed === "boolean"
    );
  }
} catch {
  tasks = [];
}

// Show today's date
dateLabel.textContent = new Intl.DateTimeFormat("en-IN", {
  weekday: "long",
  day: "numeric",
  month: "long"
}).format(new Date()).toUpperCase();

// Save tasks on this device
function saveTasks() {
  try {
    localStorage.setItem("monotask-tasks", JSON.stringify(tasks));
  } catch {
    // The app can still work if browser storage is unavailable.
  }
}

// Add a new task
form.addEventListener("submit", function (event) {
  event.preventDefault();

  const title = input.value.trim();

  if (!title) {
    input.focus();
    return;
  }

  tasks.unshift({
    id: Date.now().toString() + Math.random().toString(36).slice(2),
    title: title,
    completed: false
  });

  saveTasks();
  renderTasks();

  input.value = "";
  input.focus();
});

// Filter buttons
filters.forEach(button => {
  button.addEventListener("click", function () {
    currentFilter = button.dataset.filter;

    filters.forEach(filter => {
      const isActive = filter === button;

      filter.classList.toggle("active", isActive);
      filter.setAttribute("aria-pressed", String(isActive));
    });

    renderTasks();
  });

  button.setAttribute(
    "aria-pressed",
    String(button.classList.contains("active"))
  );
});

// Create a task element safely
function createTaskElement(task) {
  const item = document.createElement("li");
  item.className = "task-item";
  item.dataset.id = task.id;

  if (task.completed) {
    item.classList.add("completed");
  }

  const main = document.createElement("div");
  main.className = "task-main";

  const checkButton = document.createElement("button");
  checkButton.type = "button";
  checkButton.className = "check-button";
  checkButton.dataset.action = "toggle";
  checkButton.textContent = task.completed ? "✓" : "";
  checkButton.setAttribute(
    "aria-label",
    task.completed ? "Mark as pending" : "Mark as completed"
  );

  const title = document.createElement("span");
  title.className = "task-copy";
  title.textContent = task.title;

  main.append(checkButton, title);

  const actions = document.createElement("div");
  actions.className = "task-actions";

  const deleteButton = document.createElement("button");
  deleteButton.type = "button";
  deleteButton.className = "task-action delete";
  deleteButton.dataset.action = "delete";
  deleteButton.textContent = "×";
  deleteButton.setAttribute("aria-label", "Delete " + task.title);
  deleteButton.title = "Delete task";

  actions.append(deleteButton);
  item.append(main, actions);

  return item;
}

// Display tasks and update progress
function renderTasks() {
  list.replaceChildren();

  const filteredTasks = tasks.filter(task => {
    if (currentFilter === "active") {
      return !task.completed;
    }

    if (currentFilter === "completed") {
      return task.completed;
    }

    return true;
  });

  filteredTasks.forEach(task => {
    list.appendChild(createTaskElement(task));
  });

  // Empty state
  emptyState.hidden = filteredTasks.length > 0;

  if (tasks.length === 0) {
    emptyState.querySelector("h3").textContent =
      "Nothing on the list.";

    emptyState.querySelector("p").textContent =
      "Add a task. Future you will appreciate it.";
  } else if (filteredTasks.length === 0) {
    emptyState.querySelector("h3").textContent =
      "Nothing here yet.";

    emptyState.querySelector("p").textContent =
      currentFilter === "active"
        ? "All your tasks are completed."
        : "Your completed tasks will appear here.";
  }

  // Count unfinished tasks
  const remaining = tasks.filter(task => !task.completed).length;
  const completed = tasks.length - remaining;

  taskCount.textContent = remaining;
  taskCount.setAttribute(
    "aria-label",
    remaining + " tasks remaining"
  );

  // Calculate completion percentage
  const percentage = tasks.length
    ? Math.round((completed / tasks.length) * 100)
    : 0;

  progressLabel.textContent = percentage + "% complete";
  progressFill.style.width = percentage + "%";

  progressTrack.setAttribute("aria-valuenow", percentage);
}


 // Handle completing and deleting tasks
list.addEventListener("click", function (event) {
  const button = event.target.closest("button[data-action]");
  if (!button) return;

  const item = button.closest(".task-item");
  if (!item) return;

  const task = tasks.find(t => t.id === item.dataset.id);
  if (!task) return;

  if (button.dataset.action === "toggle") {
    task.completed = !task.completed;
  } else if (button.dataset.action === "delete") {
    tasks = tasks.filter(t => t.id !== item.dataset.id);
  }

  saveTasks();
  renderTasks();
});

// Initial display
renderTasks();
