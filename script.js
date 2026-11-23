const STORAGE_KEY = "study_chapter_tracker_v1";

// DOM Elements
const subjectForm = document.getElementById("subject-form");
const subjectNameInput = document.getElementById("subject-name");
const totalChapterInput = document.getElementById("total-chapter-input");
const doneChapterInput = document.getElementById("done-chapter-input");
const subjectsList = document.getElementById("subjects-list");
const mutedNote = document.querySelector(".muted-note");

// Summary & Progress Elements
const overallPercentText = document.getElementById("overall-percent");
const totalSubjectsText = document.getElementById("total-subjects");
const doneChaptersText = document.getElementById("done-chapters");
const totalChaptersText = document.getElementById("total-chapters");
const bottomPercentText = document.getElementById("bottom-percent-text");
const loaderFill = document.querySelector(".loader-fill");

// App State
let subjects = loadFromStorage();

// Save to localStorage
function saveToStorage() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(subjects));
}

// Load from localStorage
function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

// Calculate percentage safely
function calcPercent(done, total) {
  if (!total || total <= 0) return 0;
  const pct = (done / total) * 100;
  return Math.max(0, Math.min(100, Math.round(pct)));
}

// Update top summary cards & bottom 100% loading bar
function updateOverallProgress() {
  const subjectCount = subjects.length;
  const totalChapters = subjects.reduce((sum, item) => sum + item.total, 0);
  const doneChapters = subjects.reduce((sum, item) => sum + item.done, 0);
  const overallPct = calcPercent(doneChapters, totalChapters);

  totalSubjectsText.textContent = subjectCount;
  doneChaptersText.textContent = doneChapters;
  totalChaptersText.textContent = totalChapters;

  overallPercentText.textContent = `${overallPct}%`;
  bottomPercentText.textContent =
    overallPct === 100 ? "100% Complete — All Done!" : `${overallPct}% Complete`;

  loaderFill.style.width = `${overallPct}%`;
}

// Render all subject cards
function renderSubjects() {
  subjectsList.innerHTML = "";

  if (subjects.length === 0) {
    mutedNote.textContent = "Add your subjects to start tracking";
    subjectsList.innerHTML = `
      <p class="muted-note">
        Ekhono kono subject add kora hoy ni. Uporer form theke subject ar chapter add koro.
      </p>
    `;
    updateOverallProgress();
    return;
  }

  mutedNote.textContent = `${subjects.length} subject${subjects.length > 1 ? "s" : ""} tracked`;

  subjects.forEach((subject) => {
    const pct = calcPercent(subject.done, subject.total);
    const isCompleted = subject.total > 0 && subject.done >= subject.total;

    const card = document.createElement("article");
    card.className = "subject-card";
    card.dataset.id = subject.id;

    card.innerHTML = `
      <div class="card-top">
        <div>
          <h3>${escapeHTML(subject.name)}</h3>
          <p class="chapter-count">${subject.done} / ${subject.total} Chapters Done</p>
        </div>
        <span class="badge ${isCompleted ? "badge-success" : ""}">${pct}%</span>
      </div>

      <div class="mini-bar-track">
        <div class="mini-bar-fill" style="width: ${pct}%;"></div>
      </div>

      <div class="card-actions">
        <button
          type="button"
          class="btn-ghost btn-increment"
          ${isCompleted ? "disabled" : ""}
        >
          ${isCompleted ? "Completed" : "+1 Done"}
        </button>
        <button type="button" class="btn-danger btn-remove">Remove</button>
      </div>
    `;

    subjectsList.appendChild(card);
  });

  updateOverallProgress();
}

// Prevent HTML injection in user input
function escapeHTML(str) {
  return str
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// Add new subject
subjectForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const name = subjectNameInput.value.trim();
  const total = Number.parseInt(totalChapterInput.value, 10);
  let done = Number.parseInt(doneChapterInput.value, 10);

  if (!name || Number.isNaN(total) || total < 1) return;
  if (Number.isNaN(done) || done < 0) done = 0;
  if (done > total) done = total;

  const newSubject = {
    id: Date.now().toString(),
    name,
    total,
    done,
  };

  subjects.push(newSubject);
  saveToStorage();
  renderSubjects();

  subjectForm.reset();
  doneChapterInput.value = "0";
  subjectNameInput.focus();
});

// Event delegation for +1 Done & Remove buttons
subjectsList.addEventListener("click", (event) => {
  const card = event.target.closest(".subject-card");
  if (!card) return;

  const id = card.dataset.id;
  const targetIndex = subjects.findIndex((item) => item.id === id);
  if (targetIndex === -1) return;

  if (event.target.closest(".btn-increment")) {
    const current = subjects[targetIndex];
    if (current.done < current.total) {
      current.done += 1;
      saveToStorage();
      renderSubjects();
    }
    return;
  }

  if (event.target.closest(".btn-remove")) {
    subjects.splice(targetIndex, 1);
    saveToStorage();
    renderSubjects();
  }
});

// Initial render on page load
renderSubjects();
