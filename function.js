document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("event-form");
  const dateInput = document.getElementById("event-date");
  const titleInput = document.getElementById("event-title");
  const agenda = document.getElementById("agenda");

  // Récupération des événements enregistrés (si existants)
  let events = JSON.parse(localStorage.getItem("events")) || {};

  // Fonction d'affichage
  function renderAgenda() {
    agenda.innerHTML = "";
    Object.keys(events)
      .sort()
      .forEach(date => {
        const dayDiv = document.createElement("div");
        dayDiv.className = "event-day";

        // Titre de la date
        const h3 = document.createElement("h3");
        h3.textContent = date;
        dayDiv.appendChild(h3);

        // Liste des événements
        const ul = document.createElement("ul");
        events[date].forEach(ev => {
          const li = document.createElement("li");
          li.textContent = ev;
          ul.appendChild(li);
        });

        dayDiv.appendChild(ul);
        agenda.appendChild(dayDiv);
      });
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

    // Sauvegarde dans le localStorage
    localStorage.setItem("events", JSON.stringify(events));

    // Mise à jour de l'affichage
    renderAgenda();

    // Reset du formulaire
    form.reset();
  });

  // Affichage initial
  renderAgenda();
});
