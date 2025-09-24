/* ===============================
   Agenda / Calendrier - script.js
   ===============================

HTML MINIMUM REQUIS (adaptable) :

<div class="agenda-container">
  <div class="calendar-header">
    <button id="prevMonth" aria-label="Mois précédent">◀</button>
    <h2 id="monthLabel"></h2>
    <button id="nextMonth" aria-label="Mois suivant">▶</button>
  </div>

  <div id="calendar" class="calendar-grid"></div>

  <aside id="dayEvents" class="day-panel">
    <h3 id="selectedDateLabel">Événements</h3>

    <ul id="eventsList" class="events-list"></ul>

    <form id="eventForm" autocomplete="off">
      <input type="hidden" id="eventId">
      <label> Date
        <input type="date" id="eventDate" required>
      </label>
      <label> Heure (optionnel)
        <input type="time" id="eventTime">
      </label>
      <label> Titre
        <input type="text" id="eventTitle" placeholder="Titre de l’événement" required>
      </label>
      <label> Note (optionnel)
        <textarea id="eventNote" rows="3" placeholder="Détails"></textarea>
      </label>
      <div class="form-actions">
        <button type="submit" id="saveBtn">Enregistrer</button>
        <button type="button" id="cancelEditBtn" class="ghost" hidden>Annuler édition</button>
      </div>
    </form>
  </aside>
</div>

CSS : libre – prévois un grid 7 colonnes pour #calendar, et styles pour .day, .today, .selected, .has-events, etc.
*/

/* ---------- Utils dates ---------- */
const MONTHS_FR = [
  "janvier","février","mars","avril","mai","juin",
  "juillet","août","septembre","octobre","novembre","décembre"
];
const WEEKDAYS_FR = ["Lun","Mar","Mer","Jeu","Ven","Sam","Dim"];

/** Renvoie 'YYYY-MM-DD' en local (TZ navigateur) */
function toISODate(d) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Parse 'YYYY-MM-DD' -> Date locale 00:00 */
function fromISODate(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/* ---------- État ---------- */
let state = {
  year: new Date().getFullYear(),
  month: new Date().getMonth(), // 0-11
  selectedISO: toISODate(new Date())
};

/* ---------- Persistance ---------- */
// Structure: { "YYYY-MM-DD": [ {id, title, time, note} ] }
const LS_KEY = "agenda.events.v1";

function loadEvents() {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY)) || {};
  } catch {
    return {};
  }
}
function saveEvents(map) {
  localStorage.setItem(LS_KEY, JSON.stringify(map));
}
function getDayEvents(iso) {
  const map = loadEvents();
  return map[iso] || [];
}
function upsertEvent(iso, event) {
  const map = loadEvents();
  map[iso] = map[iso] || [];
  const idx = map[iso].findIndex(e => e.id === event.id);
  if (idx >= 0) map[iso][idx] = event; else map[iso].push(event);
  // tri par time puis titre
  map[iso].sort((a,b)=>{
    const at = a.time || "";
    const bt = b.time || "";
    if (at === bt) return a.title.localeCompare(b.title);
    return at.localeCompare(bt);
  });
  saveEvents(map);
}
function deleteEvent(iso, id) {
  const map = loadEvents();
  if (!map[iso]) return;
  map[iso] = map[iso].filter(e => e.id !== id);
  if (map[iso].length === 0) delete map[iso];
  saveEvents(map);
}

/* ---------- Sélecteurs ---------- */
const $ = s => document.querySelector(s);
const calendarEl = $("#calendar");
const monthLabelEl = $("#monthLabel");
const prevBtn = $("#prevMonth");
const nextBtn = $("#nextMonth");

const selectedDateLabel = $("#selectedDateLabel");
const eventsListEl = $("#eventsList");
const form = $("#eventForm");
const eventIdInput = $("#eventId");
const eventDateInput = $("#eventDate");
const eventTimeInput = $("#eventTime");
const eventTitleInput = $("#eventTitle");
const eventNoteInput = $("#eventNote");
const cancelEditBtn = $("#cancelEditBtn");

/* ---------- Rendu Calendrier ---------- */
function renderCalendar() {
  if (!calendarEl) return;

  calendarEl.innerHTML = "";

  // En-têtes des jours (lun->dim)
  const headerRow = document.createElement("div");
  headerRow.className = "weekday-row";
  WEEKDAYS_FR.forEach(w => {
    const h = document.createElement("div");
    h.className = "weekday";
    h.textContent = w;
    headerRow.appendChild(h);
  });
  calendarEl.appendChild(headerRow);

  // Infos mois
  const firstOfMonth = new Date(state.year, state.month, 1);
  const daysInMonth = new Date(state.year, state.month + 1, 0).getDate();

  // Décalage pour commencer lundi
  let startWeekDay = firstOfMonth.getDay(); // 0=Dim ... 6=Sam
  startWeekDay = (startWeekDay === 0 ? 7 : startWeekDay); // 1..7 (lun..dim)
  const leadingBlanks = startWeekDay - 1; // nb cases vides avant le 1er

  // Mois/année label
  if (monthLabelEl) {
    monthLabelEl.textContent = `${MONTHS_FR[state.month]} ${state.year}`;
  }

  // Récup des dates avec événements pour marquage
  const eventsMap = loadEvents();
  const thisMonthKey = `${state.year}-${String(state.month+1).padStart(2,"0")}-`;

  // Grille
  const grid = document.createElement("div");
  grid.className = "days-grid";

  // Cases vides initiales
  for (let i = 0; i < leadingBlanks; i++) {
    const blank = document.createElement("div");
    blank.className = "day blank";
    grid.appendChild(blank);
  }

  const todayISO = toISODate(new Date());

  for (let d = 1; d <= daysInMonth; d++) {
    const cell = document.createElement("button");
    cell.type = "button";
    cell.className = "day";
    cell.setAttribute("data-day", String(d));
    cell.textContent = d;

    const iso = `${state.year}-${String(state.month+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
    if (iso === todayISO) cell.classList.add("today");
    if (iso === state.selectedISO) cell.classList.add("selected");

    // Pastille si événements
    if (eventsMap[iso]?.length) {
      const dot = document.createElement("span");
      dot.className = "dot";
      dot.title = `${eventsMap[iso].length} événement(s)`;
      dot.textContent = "•";
      cell.appendChild(dot);
      cell.classList.add("has-events");
    }

    cell.addEventListener("click", () => {
      state.selectedISO = iso;
      // Si on clique un jour d’un autre mois (cas de grilles étendues), ici on reste simple: on suppose même mois.
      renderCalendar();
      renderDayPanel();
      // Pré-remplir la date du formulaire
      if (eventDateInput) eventDateInput.value = iso;
    });

    grid.appendChild(cell);
  }

  calendarEl.appendChild(grid);
}

/* ---------- Panneau du jour ---------- */
function renderDayPanel() {
  const iso = state.selectedISO;
  if (selectedDateLabel) {
    const d = fromISODate(iso);
    selectedDateLabel.textContent = `Événements du ${d.getDate()} ${MONTHS_FR[d.getMonth()]} ${d.getFullYear()}`;
  }

  if (eventsListEl) {
    eventsListEl.innerHTML = "";
    const events = getDayEvents(iso);
    if (events.length === 0) {
      const li = document.createElement("li");
      li.className = "empty";
      li.textContent = "Aucun événement pour ce jour.";
      eventsListEl.appendChild(li);
    } else {
      events.forEach(ev => {
        const li = document.createElement("li");
        li.className = "event-item";

        const main = document.createElement("div");
        main.className = "event-main";

        const time = document.createElement("span");
        time.className = "event-time";
        time.textContent = ev.time ? ev.time : "—";

        const title = document.createElement("span");
        title.className = "event-title";
        title.textContent = ev.title;

        main.appendChild(time);
        main.appendChild(title);

        if (ev.note) {
          const note = document.createElement("div");
          note.className = "event-note";
          note.textContent = ev.note;
          li.appendChild(note);
        }

        const actions = document.createElement("div");
        actions.className = "event-actions";

        const editBtn = document.createElement("button");
        editBtn.type = "button";
        editBtn.className = "small";
        editBtn.textContent = "Éditer";
        editBtn.addEventListener("click", () => startEdit(ev, iso));

        const delBtn = document.createElement("button");
        delBtn.type = "button";
        delBtn.className = "small danger";
        delBtn.textContent = "Supprimer";
        delBtn.addEventListener("click", () => {
          if (confirm("Supprimer cet événement ?")) {
            deleteEvent(iso, ev.id);
            renderCalendar();
            renderDayPanel();
            if (eventIdInput.value === ev.id) resetForm(); // si on supprimait celui en édition
          }
        });

        actions.appendChild(editBtn);
        actions.appendChild(delBtn);

        li.appendChild(main);
        li.appendChild(actions);
        eventsListEl.appendChild(li);
      });
    }
  }

  // Pré-remplir la date du formulaire sur le jour sélectionné
  if (eventDateInput && !eventIdInput.value) {
    eventDateInput.value = iso;
  }
}

/* ---------- Formulaire ---------- */
function resetForm() {
  if (!form) return;
  eventIdInput.value = "";
  eventDateInput.value = state.selectedISO;
  eventTimeInput.value = "";
  eventTitleInput.value = "";
  eventNoteInput.value = "";
  cancelEditBtn.hidden = true;
  form.querySelector("#saveBtn").textContent = "Enregistrer";
}

function startEdit(ev, iso) {
  eventIdInput.value = ev.id;
  eventDateInput.value = iso;
  eventTimeInput.value = ev.time || "";
  eventTitleInput.value = ev.title || "";
  eventNoteInput.value = ev.note || "";
  cancelEditBtn.hidden = false;
  form.querySelector("#saveBtn").textContent = "Mettre à jour";
  // Focus sur le titre pour aller vite
  eventTitleInput.focus();
}

if (form) {
  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const iso = eventDateInput.value;
    const payload = {
      id: eventIdInput.value || crypto.randomUUID(),
      title: eventTitleInput.value.trim(),
      time: eventTimeInput.value || "",
      note: eventNoteInput.value.trim()
    };

    if (!iso || !payload.title) return;

    upsertEvent(iso, payload);

    // Si on a modifié un autre jour, on le reflète
    if (state.selectedISO !== iso) {
      state.selectedISO = iso;
    }

    renderCalendar();
    renderDayPanel();
    resetForm();
  });
}

if (cancelEditBtn) {
  cancelEditBtn.addEventListener("click", resetForm);
}

/* ---------- Navigation mois ---------- */
if (prevBtn) {
  prevBtn.addEventListener("click", () => {
    state.month--;
    if (state.month < 0) { state.month = 11; state.year--; }
    renderCalendar();
  });
}
if (nextBtn) {
  nextBtn.addEventListener("click", () => {
    state.month++;
    if (state.month > 11) { state.month = 0; state.year++; }
    renderCalendar();
  });
}

/* ---------- Init ---------- */
document.addEventListener("DOMContentLoaded", () => {
  // S’assure que la date sélectionnée existe dans le mois affiché
  const sel = fromISODate(state.selectedISO);
  state.year = sel.getFullYear();
  state.month = sel.getMonth();

  renderCalendar();
  renderDayPanel();
});
