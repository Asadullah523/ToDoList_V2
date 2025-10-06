// Frontend script for ToDoList_v2
const API = '/api/todos';
function getToken(){ return localStorage.getItem('token'); }
function authHeader() { const token = getToken(); return token ? { 'Authorization': 'Bearer ' + token } : {}; }

// Redirect to login if no token
if (!getToken() && !window.location.pathname.endsWith('/login.html') && !window.location.pathname.endsWith('/signup.html')) {
  window.location.href = '/login.html';
}

// Clock
function startClock() {
  const el = document.getElementById('clock');
  if(!el) return;
  function tick(){
    const now = new Date();
    let hours = now.getHours();
    const minutes = String(now.getMinutes()).padStart(2,'0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    el.textContent = `${hours}:${minutes} ${ampm}`;
  }
  tick();
  setInterval(tick, 1000);
}

// Load tasks
async function loadTasks(){
  try{
    const res = await fetch(API, { headers: authHeader() });
    if(res.status === 401){ localStorage.removeItem('token'); window.location.href = '/login.html'; return; }
    const tasks = await res.json();
    renderTasks(tasks);
  }catch(err){ console.error(err); alert('Failed to load tasks'); }
}

function renderTasks(tasks){
  const list = document.getElementById('taskList');
  if(!list) return;
  list.innerHTML = '';
  const now = new Date();
  tasks.forEach(t => {
    const li = document.createElement('li');
    const left = document.createElement('div'); left.className = 'task-left';
    const title = document.createElement('div'); title.className = 'task-title'; title.textContent = t.text;
    const meta = document.createElement('div'); meta.className = 'task-meta';
    const due = t.dueDate ? new Date(t.dueDate) : null;
    meta.textContent = due ? ('Due: ' + due.toLocaleString('en-US', { month:'short', day:'numeric', hour:'numeric', minute:'2-digit', hour12:true })) : '';
    left.appendChild(title); left.appendChild(meta);
    li.appendChild(left);
    if(due && !t.completed && new Date(due) < now) li.classList.add('overdue');
    if(t.completed) li.classList.add('completed');

    const actions = document.createElement('div'); actions.className = 'task-actions';
    const del = document.createElement('button'); del.className = 'action-btn'; del.textContent = '❌';
    del.onclick = async () => { await fetch(API + '/' + t._id, { method: 'DELETE', headers: authHeader() }); loadTasks(); };
    const toggle = document.createElement('button'); toggle.className = 'action-btn'; toggle.textContent = t.completed ? '↩️' : '✅';
    toggle.onclick = async () => { await fetch(API + '/' + t._id, { method: 'PUT', headers: { 'Content-Type':'application/json', ...authHeader() }, body: JSON.stringify({ completed: !t.completed }) }); loadTasks(); };
    actions.appendChild(toggle); actions.appendChild(del);
    li.appendChild(actions);
    list.appendChild(li);
  });
}

// Add task
document.addEventListener('DOMContentLoaded', () => {
  startClock();
  const addBtn = document.getElementById('addTaskBtn');
  if(addBtn){
    addBtn.addEventListener('click', async () => {
      const textEl = document.getElementById('taskInput');
      const dateEl = document.getElementById('dueDate');
      const timeEl = document.getElementById('dueTime');
      const text = textEl.value.trim();
      const date = dateEl.value; const time = timeEl.value;
      if(!text) return alert('Enter task');
      let due = null;
      if(date && time){
        // combine date + time into ISO
        due = new Date(date + 'T' + time);
      }
      await fetch(API, { method: 'POST', headers: { 'Content-Type':'application/json', ...authHeader() }, body: JSON.stringify({ text, dueDate: due }) });
      textEl.value = ''; dateEl.value = ''; timeEl.value = '';
      loadTasks();
    });
  }

  const logout = document.getElementById('logoutBtn'); if(logout) logout.addEventListener('click', () => { localStorage.removeItem('token'); window.location.href = '/login.html'; });

  // initial load (only on index)
  if(window.location.pathname.endsWith('/index.html')) loadTasks();
});
