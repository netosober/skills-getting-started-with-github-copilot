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

  async function unregisterParticipant(activityName, email) {
    if (!confirm(`Remove ${email} from ${activityName}?`)) return;

    try {
      const url = `/activities/${encodeURIComponent(activityName)}/signup?email=${encodeURIComponent(email)}`;
      const res = await fetch(url, { method: "DELETE" });

      if (res.ok) {
        const data = await res.json();
        showMessage(data.message || "Participant removed", "success");
        if (data.activity) {
          updateParticipantsInCard(activityName, data.activity.participants, data.activity.max_participants);
        } else {
          await loadActivities();
        }
      } else {
        const err = await res.json().catch(() => ({}));
        showMessage(err.detail || "Failed to remove participant", "error");
      }
    } catch (err) {
      console.error(err);
      showMessage("Network error while removing participant", "error");
    }
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
  // attach activity name so we can update this card in-place later
  card.dataset.activityName = name;

        const participants = activity.participants || [];

        // build participants container
        const participantsContainer = document.createElement("div");
        participantsContainer.className = "participants";
        const heading = document.createElement("h5");
        heading.textContent = `Participants (${participants.length})`;
        participantsContainer.appendChild(heading);

        if (participants.length === 0) {
          const noP = document.createElement("p");
          noP.className = "no-participants";
          noP.textContent = "No participants yet";
          participantsContainer.appendChild(noP);
        } else {
          const ul = document.createElement("ul");
          ul.className = "participants-list";

          participants.forEach((p) => {
            const li = document.createElement("li");
            li.className = "participant-item";

            const span = document.createElement("span");
            span.textContent = p;

            const btn = document.createElement("button");
            btn.className = "delete-btn";
            btn.title = `Remove ${p}`;
            btn.innerHTML = "&times;"; // simple cross
            btn.addEventListener("click", () => unregisterParticipant(name, p));

            li.appendChild(span);
            li.appendChild(btn);
            ul.appendChild(li);
          });

          participantsContainer.appendChild(ul);
        }

        card.innerHTML = `
          <h4>${name}</h4>
          <p>${activity.description}</p>
          <p><strong>Schedule:</strong> ${activity.schedule}</p>
          <p class="spots"><strong>Spots:</strong> ${participants.length} / ${activity.max_participants}</p>
        `;

        card.appendChild(participantsContainer);
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
        // Update the specific activity card in-place if the server returned the activity
        if (data.activity) {
          updateParticipantsInCard(activity, data.activity.participants, data.activity.max_participants);
        } else {
          await loadActivities(); // fallback
        }
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

  // Update participants list for a specific activity card (in-place DOM update)
  function updateParticipantsInCard(activityName, participants, maxParticipants) {
    // find the card with matching data-activity-name
    const cards = activitiesList.querySelectorAll('.activity-card');
    for (const card of cards) {
      if (card.dataset.activityName === activityName) {
        // update spots
        const spotsP = card.querySelector('p.spots');
        if (spotsP) spotsP.innerHTML = `<strong>Spots:</strong> ${participants.length} / ${maxParticipants}`;

        const participantsContainer = card.querySelector('.participants');
        if (!participantsContainer) return;

        // update heading
        const heading = participantsContainer.querySelector('h5');
        if (heading) heading.textContent = `Participants (${participants.length})`;

        // remove existing list or message
        const existingList = participantsContainer.querySelector('.participants-list');
        const existingNo = participantsContainer.querySelector('.no-participants');
        if (existingList) existingList.remove();
        if (existingNo) existingNo.remove();

        if (participants.length === 0) {
          const noP = document.createElement('p');
          noP.className = 'no-participants';
          noP.textContent = 'No participants yet';
          participantsContainer.appendChild(noP);
        } else {
          const ul = document.createElement('ul');
          ul.className = 'participants-list';
          participants.forEach((p) => {
            const li = document.createElement('li');
            li.className = 'participant-item';

            const span = document.createElement('span');
            span.textContent = p;

            const btn = document.createElement('button');
            btn.className = 'delete-btn';
            btn.title = `Remove ${p}`;
            btn.innerHTML = '&times;';
            btn.addEventListener('click', () => unregisterParticipant(activityName, p));

            li.appendChild(span);
            li.appendChild(btn);
            ul.appendChild(li);
          });
          participantsContainer.appendChild(ul);
        }

        break;
      }
    }
  }
});
