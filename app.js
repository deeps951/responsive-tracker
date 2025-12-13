/**********************************************************
 * app.js
 *
 * This file controls:
 * 1. Logging the user in (via Supabase email magic link)
 * 2. Loading the 100-day curriculum
 * 3. Loading saved progress from Supabase
 * 4. Saving progress back to Supabase
 *
 * Think of this file as the "brain" of the app.
 **********************************************************/

import { supabase } from "./supabase.js";

/**********************************************************
 * GLOBAL STATE
 *
 * We keep track of:
 * - the logged-in user
 * - the user's saved progress
 **********************************************************/
let currentUser = null;
let progressMap = {};

/**********************************************************
 * AUTH: LOGIN WITH EMAIL
 *
 * This sends a magic login link to your email.
 * When you click the link, Supabase logs you in automatically.
 **********************************************************/
document
  .getElementById("login-btn")
  .addEventListener("click", async () => {
    const email = document.getElementById("email").value;

    if (!email) {
      alert("Please enter your email.");
      return;
    }

    await supabase.auth.signInWithOtp({ email });

    alert("Check your email for the login link.");
  });

/**********************************************************
 * CHECK LOGIN STATE
 *
 * When the page loads, we ask Supabase:
 * "Is someone already logged in?"
 **********************************************************/
async function checkAuth() {
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    // Not logged in yet
    return;
  }

  currentUser = user;

  // Hide login UI once authenticated
  document.getElementById("auth").style.display = "none";

  // Load cloud data
  await loadProgressFromSupabase();
  await loadDays();
}

/**********************************************************
 * LOAD USER PROGRESS FROM SUPABASE
 *
 * This fetches ALL saved progress rows for this user
 * and converts them into a lookup object for fast access.
 **********************************************************/
async function loadProgressFromSupabase() {
  const { data, error } = await supabase
    .from("progress")
    .select("*")
    .eq("user_id", currentUser.id);

  if (error) {
    console.error("Error loading progress:", error);
    return;
  }

  // Convert array into map: { dayNumber: progressRow }
  progressMap = {};
  data.forEach(row => {
    progressMap[row.day] = row;
  });
}

/**********************************************************
 * LOAD THE 100-DAY CURRICULUM
 *
 * This fetches days.json and builds the UI cards.
 **********************************************************/
async function loadDays() {
  const response = await fetch("./data/days.json");
  const days = await response.json();

  const container = document.getElementById("days-container");
  container.innerHTML = "";

  days.forEach(day => {
    const saved = progressMap[day.day];
    const completed = saved?.completed;
    const completedAt = saved?.completed_at;

    const card = document.createElement("div");
    card.className = "day-card";
    if (completed) card.classList.add("completed");

    card.innerHTML = `
      <h2>
        Day ${day.day}
        <span class="completion-date">
          ${completedAt ? `• Completed on ${completedAt}` : ""}
        </span>
      </h2>

      <p>${day.topic}</p>

      <textarea data-day="${day.day}">
${saved?.notes || ""}
      </textarea>

      <button class="complete-btn" data-day="${day.day}">
        ${completed ? "Completed ✔" : "Mark Complete"}
      </button>
    `;

    container.appendChild(card);
  });

  updateProgressBar();
}

/**********************************************************
 * HANDLE COMPLETE / UNCOMPLETE BUTTON CLICKS
 *
 * Clicking toggles the day in Supabase.
 **********************************************************/
document.addEventListener("click", async e => {
  if (!e.target.classList.contains("complete-btn")) return;

  const day = Number(e.target.dataset.day);
  const card = e.target.closest(".day-card");
  const textarea = card.querySelector("textarea");

  const existing = progressMap[day];

  if (existing) {
    // UNCOMPLETE: delete the row
    await supabase
      .from("progress")
      .delete()
      .eq("id", existing.id);

    delete progressMap[day];
    card.classList.remove("completed");
    e.target.textContent = "Mark Complete";
    card.querySelector(".completion-date").textContent = "";
  } else {
    // COMPLETE: insert or update
    const { data } = await supabase
      .from("progress")
      .insert({
        user_id: currentUser.id,
        day: day,
        completed: true,
        notes: textarea.value,
        completed_at: new Date().toISOString().split("T")[0]
      })
      .select()
      .single();

    progressMap[day] = data;
    card.classList.add("completed");
    e.target.textContent = "Completed ✔";
    card.querySelector(".completion-date").textContent =
      `• Completed on ${data.completed_at}`;
  }

  updateProgressBar();
});

/**********************************************************
 * UPDATE PROGRESS BAR
 **********************************************************/
function updateProgressBar() {
  const completedCount = Object.keys(progressMap).length;
  const percent = (completedCount / 100) * 100;
  document.getElementById("progress-fill").style.width = percent + "%";
}

/**********************************************************
 * BOOTSTRAP THE APP
 **********************************************************/
checkAuth();