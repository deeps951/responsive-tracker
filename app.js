async function loadDays() {
  const response = await fetch("./data/days.json");
  const days = await response.json();

  // Load saved progress from localStorage
  const saved = JSON.parse(localStorage.getItem("progress")) || {};
  const container = document.getElementById("days-container");

  days.forEach(day => {
    const card = document.createElement("div");
    card.className = "day-card";

    const isCompleted = saved[day.day]?.completed || false;
    const completionDate = saved[day.day]?.date || "";

    if (isCompleted) {
      card.classList.add("completed");
    }

    card.innerHTML = `
      <h2>
        Day ${day.day}
        <span class="completion-date">
          ${completionDate ? `• Completed on ${completionDate}` : ""}
        </span>
      </h2>

      <p>${day.topic}</p>

      <textarea data-day="${day.day}" placeholder="Your notes here…">${
        saved[day.day]?.notes || ""
      }</textarea>

      <button class="complete-btn" data-day="${day.day}">
        ${isCompleted ? "Completed ✔" : "Mark Complete"}
      </button>
    `;

    container.appendChild(card);
  });

  updateProgress();
}

/* ----------------------------------------------------------
   TOGGLE COMPLETE <-> INCOMPLETE + SAVE NOTES + SAVE DATE
----------------------------------------------------------- */
document.addEventListener("click", e => {
  if (e.target.classList.contains("complete-btn")) {
    const day = e.target.getAttribute("data-day");
    const textarea = document.querySelector(`textarea[data-day="${day}"]`);
    const card = e.target.closest(".day-card");

    let saved = JSON.parse(localStorage.getItem("progress")) || {};

    // If already completed → undo it
    if (saved[day]?.completed) {
      delete saved[day];
      localStorage.setItem("progress", JSON.stringify(saved));

      // Update UI
      card.classList.remove("completed");
      e.target.textContent = "Mark Complete";

      const dateSpan = card.querySelector(".completion-date");
      dateSpan.textContent = "";
    } 
    
    // Otherwise → mark as complete
    else {
      const today = new Date().toLocaleDateString();

      saved[day] = {
        completed: true,
        notes: textarea.value,
        date: today
      };

      localStorage.setItem("progress", JSON.stringify(saved));

      // Update UI
      card.classList.add("completed");
      e.target.textContent = "Completed ✔";

      const dateSpan = card.querySelector(".completion-date");
      dateSpan.textContent = `• Completed on ${today}`;
    }

    updateProgress();
  }
});

/* ----------------------------------------------------------
   PROGRESS BAR UPDATE
----------------------------------------------------------- */
function updateProgress() {
  const saved = JSON.parse(localStorage.getItem("progress")) || {};
  const completed = Object.values(saved).filter(d => d.completed).length;
  const percent = (completed / 100) * 100;
  document.getElementById("progress-fill").style.width = percent + "%";
}

loadDays();