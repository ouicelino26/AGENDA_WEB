document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("event-form");
  const dateInput = document.getElementById("event-date");
  const titleInput = document.getElementById("event-title");
  const agenda = document.getElementById("agenda");

  // Récupération des événements sauvegardés
  let events = JSON.parse(localStorage.getItem("events")) || {};

  // Fonction d'affichage
  function renderAgenda() {
    agenda.innerHTML = "";
    Object.keys(events)
      .sort()
      .forEach(date => {
        const dayDiv = document.createElement("div");
        dayDiv.className = "event-day";

        // Date en titre
        const h3 = document.createElement("h3");
        h3.textContent = date;
        dayDiv.appendChild(h3);

        // Liste des événements
        const ul = document.createElement("ul");
        events[date].forEach((ev, index) => {
          const li = document.createElement("li");
          li.textContent = ev + " ";

          // Bouton supprimer
          const btn = document.createElement("button");
          btn.textContent = "❌";
          btn.className = "delete-btn";
          btn.addEventListener("click", () => {
            deleteEvent(date, index);
          });

          li.appendChild(btn);
          ul.appendChild(li);
        });

        dayDiv.appendChild(ul);
        agenda.appendChild(dayDiv);
      });
  }

  // Fonction suppression
  function deleteEvent(date, index) {
    events[date].splice(index, 1);

    // Si la date n’a plus d’événements, on la supprime
    if (events[date].length === 0) {
      delete events[date];
    }

    localStorage.setItem("events", JSON.stringify(events));
    renderAgenda();
  }

  // Gestion de l'ajout d'événement
  form.addEventListener("submit", e => {
    e.preventDefault();

    const date = dateInput.value;
    const title = titleInput.value.trim();
    if (!date || !title) return;

    if (!events[date]) {
      events[date] = [];
    }
    events[date].push(title);

    localStorage.setItem("events", JSON.stringify(events));
    renderAgenda();
    form.reset();
  });

  // Affichage initial
  renderAgenda();
});
