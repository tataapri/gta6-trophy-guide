// Leonida Trophy Guide: an offline checklist and tracker for GTA VI's 55 trophies.
// Data lives in data/trophies.json (official names, descriptions, grades plus our
// guides) and data/roadmap.json (the platinum roadmap). Progress is saved only in
// this browser's localStorage and can be exported to a file and imported back.

const STORE_KEY = 'leonida-trophy-guide-v1';
const TROPHY_URL = 'data/trophies.json';
const ROADMAP_URL = 'data/roadmap.json';

const listEl = document.getElementById('trophyList');
const detailEl = document.getElementById('detailPanel');
const listMetaEl = document.getElementById('listMeta');
const searchEl = document.getElementById('search');
const kindEl = document.getElementById('kindFilter');
const gradeEl = document.getElementById('gradeFilter');
const sortEl = document.getElementById('sortFilter');
const earnedOnlyEl = document.getElementById('earnedFilter');
const spoilerEl = document.getElementById('spoilerToggle');

let trophies = [];
let roadmap = null;
let earned = new Set();
let spoilerMode = false;
let selectedId = null;

function loadSavedProgress() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORE_KEY) ?? '{}');
    earned = new Set(Array.isArray(raw.earned) ? raw.earned : []);
    spoilerMode = raw.spoiler === true;
  } catch {
    earned = new Set();
    spoilerMode = false;
  }
  spoilerEl.checked = spoilerMode;
}

function saveProgress() {
  localStorage.setItem(STORE_KEY, JSON.stringify({ earned: [...earned], spoiler: spoilerMode }));
}

async function loadTrophyData() {
  const [trophyDoc, roadmapDoc] = await Promise.all([
    (await fetch(TROPHY_URL)).json(),
    (await fetch(ROADMAP_URL)).json(),
  ]);
  trophies = trophyDoc.trophies;
  roadmap = roadmapDoc;
}

function trophyById(id) {
  return trophies.find((t) => t.id === id);
}

function isStoryHidden(t) {
  return spoilerMode && t.kind === 'story' && !earned.has(t.id);
}

function gradeOrder(t) {
  return { platinum: 0, gold: 1, silver: 2, bronze: 3 }[t.grade] ?? 4;
}

function applyFilters() {
  const q = searchEl.value.trim().toLowerCase();
  const kind = kindEl.value;
  const grade = gradeEl.value;
  const sort = sortEl.value;
  let shown = trophies.filter((t) => {
    if (kind === 'missable') {
      if (!t.missable) return false;
    } else if (kind === 'online') {
      return false; // the official list has no online trophies
    } else if (kind !== 'all' && t.kind !== kind) {
      return false;
    }
    if (grade !== 'all' && t.grade !== grade) return false;
    if (earnedOnlyEl.checked && earned.has(t.id)) return false;
    if (q && !(t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q))) return false;
    return true;
  });
  if (sort === 'grade') shown.sort((a, b) => gradeOrder(a) - gradeOrder(b) || a.id - b.id);
  else if (sort === 'difficulty') shown.sort((a, b) => a.difficulty - b.difficulty || a.id - b.id);
  else if (sort === 'name') shown.sort((a, b) => a.name.localeCompare(b.name));
  else shown.sort((a, b) => a.id - b.id);
  return shown;
}

function renderProgress() {
  const total = trophies.length;
  const done = trophies.filter((t) => earned.has(t.id)).length;
  const pct = total ? Math.round((done / total) * 100) : 0;
  document.getElementById('progressCount').textContent = `${done} of ${total}`;
  document.getElementById('progressPct').textContent = `${pct}%`;
  document.getElementById('progressRing').style.setProperty('--pct', pct);
  const byGrade = (g) => trophies.filter((t) => t.grade === g && earned.has(t.id)).length;
  document.getElementById('gradeLine').textContent =
    `${byGrade('platinum')} platinum · ${byGrade('gold')} gold · ${byGrade('silver')} silver · ${byGrade('bronze')} bronze`;
}

function renderRoadmap() {
  if (!roadmap) return;
  document.getElementById('roadmapNote').textContent = roadmap.note;
  const stagesEl = document.getElementById('stages');
  stagesEl.replaceChildren();
  for (const stage of roadmap.stages) {
    const li = document.createElement('li');
    const h = document.createElement('h3');
    const num = document.createElement('span');
    num.className = 'stage-num';
    num.textContent = `Stage ${stage.stage}`;
    h.append(num, document.createTextNode(stage.name));
    const p = document.createElement('p');
    p.textContent = stage.text;
    const chips = document.createElement('div');
    chips.className = 'stage-trophies';
    for (const id of stage.trophies) {
      const t = trophyById(id);
      if (!t) continue;
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = `#${t.id} ${t.name}`;
      if (earned.has(t.id)) b.classList.add('earned');
      b.addEventListener('click', () => selectTrophy(t.id));
      chips.append(b);
    }
    li.append(h, p, chips);
    stagesEl.append(li);
  }
}

function tagEl(text, cls) {
  const s = document.createElement('span');
  s.className = `tag ${cls}`;
  s.textContent = text;
  return s;
}

function renderTrophyList() {
  const shown = applyFilters();
  listMetaEl.textContent = shown.length === trophies.length
    ? `Showing all ${trophies.length} trophies`
    : `Showing ${shown.length} of ${trophies.length} trophies`;
  listEl.replaceChildren();
  if (shown.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'empty';
    empty.textContent = kindEl.value === 'online'
      ? 'The official list has no online trophies — every one of the 55 is earned in single-player.'
      : 'No trophies match these filters. Clear the search or change a filter.';
    listEl.append(empty);
    return;
  }
  for (const t of shown) {
    const li = document.createElement('li');
    li.className = `grade-${t.grade}${earned.has(t.id) ? ' earned' : ''}${t.id === selectedId ? ' selected' : ''}`;
    const box = document.createElement('input');
    box.type = 'checkbox';
    box.checked = earned.has(t.id);
    box.setAttribute('aria-label', `Mark ${t.name} as earned`);
    box.addEventListener('change', (event) => {
      event.stopPropagation();
      toggleEarned(t.id);
    });
    const body = document.createElement('div');
    const name = document.createElement('p');
    name.className = 'trophy-name';
    name.textContent = isStoryHidden(t) ? 'Hidden story trophy' : t.name;
    const desc = document.createElement('p');
    desc.className = 'trophy-desc';
    desc.textContent = isStoryHidden(t)
      ? 'Spoiler-free mode hides this story trophy until you earn it.'
      : t.description;
    const tags = document.createElement('div');
    tags.className = 'trophy-tags';
    tags.append(tagEl(t.grade, `grade-${t.grade}`));
    if (t.kind !== 'platinum') tags.append(tagEl(t.kind, ''));
    if (t.missable) tags.append(tagEl('MISSABLE', 'missable'));
    if (t.hidden) tags.append(tagEl('hidden on PS5', 'hidden'));
    if (t.count) tags.append(tagEl(`× ${t.count}`, ''));
    body.append(name, desc, tags);
    li.append(box, body);
    li.addEventListener('click', (event) => {
      // A click on the checkbox toggles it through its own change handler;
      // the row click must not re-render the list under it first.
      if (event.target instanceof HTMLInputElement) return;
      selectTrophy(t.id);
    });
    listEl.append(li);
  }
}

function renderTrophyDetail() {
  const t = trophyById(selectedId) ?? trophies[0];
  if (!t) return;
  selectedId = t.id;
  detailEl.replaceChildren();
  const h = document.createElement('h2');
  h.textContent = isStoryHidden(t) ? 'Hidden story trophy' : t.name;
  const desc = document.createElement('p');
  desc.className = 'detail-desc';
  desc.textContent = isStoryHidden(t) ? 'Spoiler-free mode hides this story trophy until you earn it.' : t.description;
  const meta = document.createElement('div');
  meta.className = 'detail-meta';
  meta.append(tagEl(t.grade, `grade-${t.grade}`));
  meta.append(tagEl(t.kind, ''));
  if (t.missable) meta.append(tagEl('MISSABLE — do it before the story moves on', 'missable'));
  if (t.hidden) meta.append(tagEl('hidden on PlayStation until earned', 'hidden'));
  if (t.count) meta.append(tagEl(`counts to ${t.count}`, ''));
  const diff = document.createElement('p');
  diff.innerHTML = `Difficulty: <span class="difficulty">${'★'.repeat(t.difficulty)}${'☆'.repeat(5 - t.difficulty)}</span> (${t.difficulty} of 5)`;
  const how = document.createElement('h3');
  how.textContent = 'How to earn it';
  const guide = document.createElement('p');
  guide.textContent = t.guide;
  const stepsTitle = document.createElement('h3');
  stepsTitle.textContent = 'Steps';
  const steps = document.createElement('ol');
  for (const step of t.steps ?? []) {
    const li = document.createElement('li');
    li.textContent = step;
    steps.append(li);
  }
  const source = document.createElement('p');
  source.className = 'source-line';
  source.textContent = `Sources: ${t.source}. The official name, description and grade are PlayStation's own.`;
  const row = document.createElement('div');
  row.className = 'earn-row';
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.textContent = earned.has(t.id) ? '✓ Earned — click to undo' : 'Mark as earned';
  if (earned.has(t.id)) btn.classList.add('earned');
  btn.addEventListener('click', () => toggleEarned(t.id));
  row.append(btn);
  detailEl.append(h, desc, meta, diff, how, guide, stepsTitle, steps, row, source);
}

function toggleEarned(id) {
  if (earned.has(id)) earned.delete(id);
  else earned.add(id);
  saveProgress();
  renderProgress();
  renderRoadmap();
  renderTrophyList();
  renderTrophyDetail();
}

function selectTrophy(id) {
  selectedId = id;
  renderTrophyList();
  renderTrophyDetail();
}

function setSpoilerMode(on) {
  spoilerMode = on;
  saveProgress();
  renderTrophyList();
  renderTrophyDetail();
}

function exportProgress() {
  const blob = new Blob([JSON.stringify({ game: 'Grand Theft Auto VI', earned: [...earned].sort((a, b) => a - b) }, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'gta6-trophy-progress.json';
  a.click();
  URL.revokeObjectURL(a.href);
}

async function importProgress(file) {
  if (!file) return;
  try {
    const data = JSON.parse(await file.text());
    const ids = Array.isArray(data) ? data : data.earned;
    const valid = new Set(trophies.map((t) => t.id));
    earned = new Set(ids.filter((id) => valid.has(id)));
    saveProgress();
    renderProgress();
    renderRoadmap();
    renderTrophyList();
    renderTrophyDetail();
  } catch {
    alert('That file is not a trophy-progress export from this guide.');
  }
}

function resetProgress() {
  if (!confirm('Clear all earned trophies? This only affects this browser.')) return;
  earned = new Set();
  saveProgress();
  renderProgress();
  renderRoadmap();
  renderTrophyList();
  renderTrophyDetail();
}

function readUrlState() {
  const params = new URLSearchParams(location.search);
  if (params.get('spoiler') === '1') {
    spoilerMode = true;
    spoilerEl.checked = true;
  }
  if (params.get('filter') === 'missable') kindEl.value = 'missable';
  if (params.get('filter') === 'story') kindEl.value = 'story';
  const trophy = Number(params.get('trophy'));
  if (trophyById(trophy)) selectedId = trophy;
}

function wireControls() {
  searchEl.addEventListener('input', renderTrophyList);
  kindEl.addEventListener('change', renderTrophyList);
  gradeEl.addEventListener('change', renderTrophyList);
  sortEl.addEventListener('change', renderTrophyList);
  earnedOnlyEl.addEventListener('change', renderTrophyList);
  spoilerEl.addEventListener('change', () => setSpoilerMode(spoilerEl.checked));
  document.getElementById('exportBtn').addEventListener('click', exportProgress);
  document.getElementById('importFile').addEventListener('change', (event) => {
    importProgress(event.target.files[0]);
    event.target.value = '';
  });
  document.getElementById('resetBtn').addEventListener('click', resetProgress);
  document.getElementById('roadmapToggle').addEventListener('click', (event) => {
    const stages = document.getElementById('stages');
    const note = document.getElementById('roadmapNote');
    const hidden = stages.style.display === 'none';
    stages.style.display = hidden ? '' : 'none';
    note.style.display = hidden ? '' : 'none';
    event.target.textContent = hidden ? 'Hide roadmap' : 'Show roadmap';
    event.target.setAttribute('aria-expanded', String(hidden));
  });
}

loadSavedProgress();
await loadTrophyData();
readUrlState();
wireControls();
renderProgress();
renderRoadmap();
renderTrophyList();
renderTrophyDetail();
if (new URLSearchParams(location.search).get('view') === 'roadmap') {
  document.getElementById('roadmapSection').scrollIntoView();
}
