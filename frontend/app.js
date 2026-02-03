// Change this if your API runs elsewhere (CI, container, remote)
const API_URL = (localStorage.getItem("API_URL") || "http://127.0.0.1:8000");
document.getElementById("apiUrlLabel").textContent = API_URL;

async function api(path, options = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (res.status === 204) return null;
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || `HTTP ${res.status}`);
  }
  return res.json();
}

function taskCard(task) {
  const div = document.createElement("div");
  div.className = "task";

  const row = document.createElement("div");
  row.className = "row";
  const titleEl = document.createElement("h3");
  titleEl.textContent = task.title;
  const badge = document.createElement("span");
  badge.className = "badge";
  badge.textContent = task.status;
  row.append(titleEl, badge);

  const p = document.createElement("p");
  if (task.description) {
    p.textContent = task.description;
  } else {
    const em = document.createElement("em");
    em.textContent = "Pas de description";
    p.appendChild(em);
  }

  const small = document.createElement("small");
  small.textContent = `id=${task.id} • créé=${new Date(task.created_at).toLocaleString()}`;

  const actions = document.createElement("div");
  actions.className = "actions";

  const select = document.createElement("select");
  select.dataset.role = "status";
  ["TODO", "DOING", "DONE"].forEach((value) => {
    const opt = document.createElement("option");
    opt.value = value;
    opt.textContent = value;
    if (task.status === value) opt.selected = true;
    select.appendChild(opt);
  });

  const saveBtn = document.createElement("button");
  saveBtn.className = "secondary";
  saveBtn.dataset.role = "save";
  saveBtn.textContent = "Mettre à jour";

  const deleteBtn = document.createElement("button");
  deleteBtn.dataset.role = "delete";
  deleteBtn.textContent = "Supprimer";

  actions.append(select, saveBtn, deleteBtn);
  div.append(row, p, small, actions);

  saveBtn.addEventListener("click", async () => {
    const status = select.value;
    await api(`/tasks/${task.id}`, { method: "PUT", body: JSON.stringify({ status }) });
    await refresh();
  });

  deleteBtn.addEventListener("click", async () => {
    if (!confirm("Supprimer cette tâche ?")) return;
    await api(`/tasks/${task.id}`, { method: "DELETE" });
    await refresh();
  });

  return div;
}

async function refresh() {
  const container = document.getElementById("tasks");
  container.innerHTML = "";
  try {
    const tasks = await api("/tasks");
    if (tasks.length === 0) {
      const p = document.createElement("p");
      const em = document.createElement("em");
      em.textContent = "Aucune tâche pour l’instant.";
      p.appendChild(em);
      container.appendChild(p);
      return;
    }
    tasks.forEach(t => container.appendChild(taskCard(t)));
  } catch (e) {
    const p1 = document.createElement("p");
    p1.style.color = "#b00020";
    const strong = document.createElement("strong");
    strong.textContent = "Erreur: ";
    p1.appendChild(strong);
    p1.append(e.message);

    const p2 = document.createElement("p");
    p2.textContent = "Vérifie que l’API tourne sur ";
    const code = document.createElement("code");
    code.textContent = API_URL;
    p2.appendChild(code);

    container.replaceChildren(p1, p2);
  }
}

document.getElementById("refreshBtn").addEventListener("click", refresh);

document.getElementById("createForm").addEventListener("submit", async (ev) => {
  ev.preventDefault();
  const title = document.getElementById("title").value.trim();
  const description = document.getElementById("description").value.trim() || null;

  await api("/tasks", { method: "POST", body: JSON.stringify({ title, description }) });

  document.getElementById("title").value = "";
  document.getElementById("description").value = "";
  await refresh();
});

refresh();
