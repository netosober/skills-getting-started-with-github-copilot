document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageEl = document.getElementById("message");

  function showMessage(text, type = "info") {
    messageEl.textContent = text;
    messageEl.className = `message ${type}`;
    messageEl.classList.remove("hidden");
    setTimeout(() => messageEl.classList.add("hidden"), 5000);
  }

  async function loadActivities() {
    activitiesList.innerHTML = "<p>Loading activities...</p>";
    activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

    try {
      const res = await fetch("/activities");
      const activities = await res.json();

      activitiesList.innerHTML = "";
      Object.entries(activities).forEach(([name, activity]) => {
        // populate select
        const opt = document.createElement("option");
        opt.value = name;
        opt.textContent = name;
        activitySelect.appendChild(opt);

        // card
        const card = document.createElement("div");
        card.className = "activity-card";

        const participants = activity.participants || [];
        const participantsHtml = participants.length
          ? `<ul class="participants-list">${participants
              .map((p) => `<li class="participant-item">${p}</li>`)
              .join("")}</ul>`
          : `<p class="no-participants">No participants yet</p>`;

        card.innerHTML = `
          <h4>${name}</h4>
          <p>${activity.description}</p>
          <p><strong>Schedule:</strong> ${activity.schedule}</p>
          <p><strong>Spots:</strong> ${participants.length} / ${activity.max_participants}</p>
          <div class="participants">
            <h5>Participants (${participants.length})</h5>
            ${participantsHtml}
          </div>
        `;

        activitiesList.appendChild(card);
      });
    } catch (err) {
      activitiesList.innerHTML = "<p class='error'>Failed to load activities</p>";
      console.error(err);
    }
  }

  signupForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("email").value.trim();
    const activity = document.getElementById("activity").value;

    if (!email || !activity) {
      showMessage("Please provide an email and select an activity.", "error");
      return;
    }

    try {
      const url = `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`;
      const res = await fetch(url, { method: "POST" });

      if (res.ok) {
        const data = await res.json();
        showMessage(data.message || "Signed up successfully!", "success");
        await loadActivities(); // refresh participant lists
        signupForm.reset();
      } else {
        const err = await res.json().catch(() => ({}));
        showMessage(err.detail || "Signup failed", "error");
      }
    } catch (err) {
      console.error(err);
      showMessage("Network error during signup", "error");
    }
  });

  loadActivities();
});
