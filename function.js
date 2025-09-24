document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("event-form");
  const dateInput = document.getElementById("event-date");
  const titleInput = document.getElementById("event-title");
  const agenda = document.getElementById("agenda");

  // Récupération des événements sauvegardés
  let events = JSON.parse(localStorage.getItem("events")) || {};
  let currentDate = new Date();

  // Convertir le code priorité en texte
  function priorityLabel(code) {
    switch (code) {
      case "H": return "Haute";
      case "M": return "Moyenne";
      case "P": return "Petite";
      default: return "Inconnue";
    }
  }

  // Fonction suppression
  function deleteEvent(date, index) {
    events[date].splice(index, 1);
    if (events[date].length === 0) {
      delete events[date];
    }
    localStorage.setItem("events", JSON.stringify(events));
    renderCalendar();
  }

  // Fonction modification
  function editEvent(date, index) {
    const event = events[date][index];

    // Demander un nouveau titre
    const newTitle = prompt("Modifier le titre :", event.title);
    if (!newTitle) return;

    // Demander une nouvelle priorité
    const newPriority = prompt(
      "Modifier la priorité (H = Haute, M = Moyenne, P = Petite) :",
      event.priority
    );
    if (!["H", "M", "P"].includes(newPriority)) return;

    // Mise à jour
    events[date][index] = { title: newTitle, priority: newPriority };
    localStorage.setItem("events", JSON.stringify(events));
    renderCalendar();
  }

  // Fonction d'affichage sous forme de calendrier
  function renderCalendar() {
    agenda.innerHTML = "";

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // Navigation + titre du mois
    const nav = document.createElement("div");
    nav.className = "calendar-nav";

    const prevBtn = document.createElement("button");
    prevBtn.textContent = "◀";
    prevBtn.addEventListener("click", () => {
      currentDate.setMonth(currentDate.getMonth() - 1);
      renderCalendar();
    });

    const nextBtn = document.createElement("button");
    nextBtn.textContent = "▶";
    nextBtn.addEventListener("click", () => {
      currentDate.setMonth(currentDate.getMonth() + 1);
      renderCalendar();
    });

    const title = document.createElement("h2");
    title.textContent = currentDate.toLocaleDateString("fr-FR", {
      month: "long",
      year: "numeric"
    });

    nav.appendChild(prevBtn);
    nav.appendChild(title);
    nav.appendChild(nextBtn);
    agenda.appendChild(nav);

    // Grille calendrier
    const calendar = document.createElement("div");
    calendar.id = "calendar";

    // Premier jour du mois
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Décalage (lundi = 0, dimanche = 6)
    let startDay = firstDay === 0 ? 6 : firstDay - 1;

    // Cases vides avant le 1er
    for (let i = 0; i < startDay; i++) {
      const emptyCell = document.createElement("div");
      emptyCell.className = "day empty";
      calendar.appendChild(emptyCell);
    }

    // Cases pour chaque jour
    for (let day = 1; day <= daysInMonth; day++) {
      const cell = document.createElement("div");
      cell.className = "day";

      const fullDate = `${year}-${String(month + 1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;

      // Numéro du jour
      const h3 = document.createElement("h3");
      h3.textContent = day;
      cell.appendChild(h3);

      // Événements de ce jour
      if (events[fullDate]) {
        events[fullDate].forEach((ev, index) => {
          const wrapper = document.createElement("div");
          wrapper.className = "event priority-" + ev.priority;

          // titre
          const span = document.createElement("span");
          span.textContent = ev.title;
          wrapper.appendChild(span);

          // bouton modifier
          const editBtn = document.createElement("button");
          editBtn.textContent = "✏️";
          editBtn.className = "edit-btn";
          editBtn.addEventListener("click", () => {
            editEvent(fullDate, index);
          });
          wrapper.appendChild(editBtn);

          // bouton supprimer
          const delBtn = document.createElement("button");
          delBtn.textContent = "❌";
          delBtn.className = "delete-btn";
          delBtn.addEventListener("click", () => {
            deleteEvent(fullDate, index);
          });
          wrapper.appendChild(delBtn);

          cell.appendChild(wrapper);
        });
      }

      calendar.appendChild(cell);
    }

    agenda.appendChild(calendar);
  }

  // Gestion ajout d'événement
  form.addEventListener("submit", e => {
    e.preventDefault();

    const date = dateInput.value;
    const title = titleInput.value.trim();
    const priority = document.querySelector("input[name='event-priority']:checked")?.value;

    if (!date || !title || !priority) return;

    if (!events[date]) {
      events[date] = [];
    }
    events[date].push({ title, priority });

    localStorage.setItem("events", JSON.stringify(events));
    renderCalendar();
    form.reset();
  });

  // Affichage initial
  renderCalendar();
});
