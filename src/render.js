const dataUrl = "data/guide.json";
const storageKey = "qbitai-editor-guide-checks";

const state = {
  data: null,
  checked: new Set(JSON.parse(localStorage.getItem(storageKey) || "[]")),
};

const els = {
  modules: document.getElementById("modules"),
  toc: document.getElementById("toc"),
  checklist: document.getElementById("checklist"),
  resources: document.getElementById("resources"),
  progressValue: document.getElementById("progressValue"),
  progressFill: document.getElementById("progressFill"),
  progressNote: document.getElementById("progressNote"),
  searchInput: document.getElementById("searchInput"),
  toast: document.getElementById("toast"),
};

function escapeHtml(text = "") {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function markdownInline(text = "") {
  let value = escapeHtml(text).replace(/\\([~_\-.#+])/g, "$1");
  value = value.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<span class="image-token">$1</span>');
  value = value.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, label, url) => {
    const safeUrl = String(url).replace(/"/g, "%22");
    return `<a href="${safeUrl}" target="_blank" rel="noreferrer">${label}</a>`;
  });
  value = value.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  value = value.replace(/\*([^*]+)\*/g, "<em>$1</em>");
  return value;
}

function renderText(items = []) {
  let html = "";
  let list = [];

  function flushList() {
    if (!list.length) return;
    html += `<ul>${list.map((item) => `<li>${markdownInline(item.text)}</li>`).join("")}</ul>`;
    list = [];
  }

  for (const item of items) {
    if (item.type === "li") {
      list.push(item);
      continue;
    }

    flushList();
    html += `<p>${markdownInline(item.text)}</p>`;
  }

  flushList();
  return html;
}

function buildTemplateBox(data) {
  return `
    <div class="template-box">
      <pre>${escapeHtml(data.outlineTemplate)}</pre>
      <button class="ghost-btn copy-template" type="button">复制模板</button>
    </div>
  `;
}

function buildSubPanel(subsection, index, moduleIndex, data) {
  const template = subsection.title.includes("如何写提纲") ? buildTemplateBox(data) : "";
  return `
    <div class="tab-panel${index === 0 ? " active" : ""}" data-panel="${moduleIndex}-${index}">
      <div class="text-block">${renderText(subsection.body)}${template}</div>
    </div>
  `;
}

function buildModule(moduleData, moduleIndex, data) {
  const module = document.createElement("section");
  const moduleId = `section-${moduleIndex}`;
  const childTabs = (moduleData.children || [])
    .map((subsection, subIndex) => `
      <button class="tab${subIndex === 0 ? " active" : ""}" data-tab="${moduleIndex}-${subIndex}">
        ${escapeHtml(subsection.title)}
      </button>
    `)
    .join("");
  const panels = (moduleData.children || [])
    .map((subsection, subIndex) => buildSubPanel(subsection, subIndex, moduleIndex, data))
    .join("");
  const timeline = moduleData.title.includes("日常工作流程")
    ? `
      <div class="timeline">
        <div class="time-step"><strong>8:30</strong><span>开工，回复查收任务</span></div>
        <div class="time-step"><strong>9:30</strong><span>提交提纲并 @ 带班老师</span></div>
        <div class="time-step"><strong>11:30</strong><span>提交初稿并进入审稿</span></div>
      </div>
    `
    : "";

  module.className = "module";
  module.id = moduleId;
  module.dataset.search = [
    moduleData.parent,
    moduleData.title,
    ...(moduleData.body || []).map((item) => item.text),
    ...(moduleData.children || []).flatMap((sub) => [
      sub.title,
      ...(sub.body || []).map((item) => item.text),
    ]),
  ].join(" ").toLowerCase();
  module.innerHTML = `
    <header class="module-head">
      <div class="module-title">
        <span class="module-index">${moduleIndex + 1}</span>
        <div>
          <p class="module-parent">${escapeHtml(moduleData.parent)}</p>
          <h2>${escapeHtml(moduleData.title)}</h2>
        </div>
      </div>
      <button class="collapse-btn" type="button">收起⌃</button>
    </header>
    <div class="module-body">
      <div class="text-block">${timeline}${renderText(moduleData.body)}</div>
      ${moduleData.children?.length ? `<div class="tabs">${childTabs}</div>${panels}` : ""}
    </div>
  `;
  return module;
}

function renderHero(data) {
  document.title = data.title;
  document.getElementById("heroTitle").textContent = data.title.replace(/（.*?）/g, "");
  document.getElementById("heroIntro").innerHTML = data.intro
    .slice(0, 4)
    .map((line) => `<p>${markdownInline(line)}</p>`)
    .join("");
  document.getElementById("heroFocus").innerHTML = (data.heroFocus || [])
    .map((item) => `<li><span class="check-dot">✓</span><span>${escapeHtml(item)}</span></li>`)
    .join("");
  document.getElementById("moduleCount").textContent = `${data.stats.modules} 个模块`;
  document.getElementById("wordCount").textContent = `${data.stats.words} 字原文`;
  document.getElementById("sourceDocument").textContent = `原始文档：${data.sourceDocument}`;
  document.getElementById("sourceStamp").textContent = `生成日期：${data.sourceStamp}`;
}

function renderModules(data) {
  els.modules.innerHTML = "";
  els.toc.innerHTML = "";

  data.modules.forEach((moduleData, moduleIndex) => {
    els.modules.appendChild(buildModule(moduleData, moduleIndex, data));

    const item = document.createElement("li");
    item.innerHTML = `
      <a href="#section-${moduleIndex}">
        <span class="toc-mark">${moduleIndex + 1}</span>
        <span>${escapeHtml(moduleData.title)}</span>
      </a>
    `;
    els.toc.appendChild(item);
  });
}

function renderChecklist(data) {
  els.checklist.innerHTML = "";

  data.checkItems.forEach((item, index) => {
    const id = `check-${index}`;
    const label = document.createElement("label");
    label.className = "check-row";
    label.innerHTML = `
      <input type="checkbox" ${state.checked.has(id) ? "checked" : ""} />
      <span>${escapeHtml(item)}</span>
    `;
    label.querySelector("input").addEventListener("change", (event) => {
      event.target.checked ? state.checked.add(id) : state.checked.delete(id);
      saveChecks(data);
    });
    els.checklist.appendChild(label);
  });

  updateProgress(data);
}

function renderResources(data) {
  els.resources.innerHTML = "";
  data.resources.forEach((resource) => {
    const card = document.createElement("div");
    card.className = "resource-card";
    card.innerHTML = `<strong>${escapeHtml(resource.title)}</strong><span>${escapeHtml(resource.description)}</span>`;
    els.resources.appendChild(card);
  });
}

function saveChecks(data) {
  localStorage.setItem(storageKey, JSON.stringify([...state.checked]));
  updateProgress(data);
}

function updateProgress(data) {
  const total = data.checkItems.length;
  const done = state.checked.size;
  const pct = total ? Math.round((done / total) * 100) : 0;
  els.progressValue.textContent = `${pct}%`;
  els.progressFill.style.width = `${pct}%`;
  els.progressNote.textContent = `完成 ${done} / ${total} 项`;
}

function showToast(message) {
  els.toast.textContent = message;
  els.toast.classList.add("show");
  window.setTimeout(() => els.toast.classList.remove("show"), 1500);
}

function bindEvents(data) {
  document.addEventListener("click", (event) => {
    const tab = event.target.closest(".tab");
    if (tab) {
      const [moduleIndex] = tab.dataset.tab.split("-");
      document.querySelectorAll(`[data-tab^="${moduleIndex}-"]`).forEach((item) => item.classList.remove("active"));
      document.querySelectorAll(`[data-panel^="${moduleIndex}-"]`).forEach((item) => item.classList.remove("active"));
      tab.classList.add("active");
      document.querySelector(`[data-panel="${tab.dataset.tab}"]`)?.classList.add("active");
    }

    const collapse = event.target.closest(".collapse-btn");
    if (collapse) {
      const module = collapse.closest(".module");
      module.classList.toggle("collapsed");
      collapse.textContent = module.classList.contains("collapsed") ? "展开⌄" : "收起⌃";
    }

    const scroll = event.target.closest("[data-scroll]");
    if (scroll) {
      document.querySelector(scroll.dataset.scroll)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    const copy = event.target.closest(".copy-template");
    if (copy) {
      navigator.clipboard?.writeText(data.outlineTemplate).catch(() => {});
      showToast("提纲模板已复制");
    }
  });

  document.getElementById("expandAll").addEventListener("click", () => {
    document.querySelectorAll(".module").forEach((module) => module.classList.remove("collapsed"));
    document.querySelectorAll(".collapse-btn").forEach((button) => {
      button.textContent = "收起⌃";
    });
  });

  els.searchInput.addEventListener("input", (event) => {
    const query = event.target.value.trim().toLowerCase();
    document.querySelectorAll(".module").forEach((module) => {
      module.classList.toggle("hidden", Boolean(query) && !module.dataset.search.includes(query));
    });
  });
}

function observeSections() {
  const links = [...document.querySelectorAll(".toc a")];
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      links.forEach((link) => {
        link.classList.toggle("active", link.getAttribute("href") === `#${entry.target.id}`);
      });
    });
  }, { rootMargin: "-20% 0px -70% 0px" });
  document.querySelectorAll(".module").forEach((module) => observer.observe(module));
}

async function init() {
  const response = await fetch(dataUrl);
  if (!response.ok) throw new Error(`无法加载 ${dataUrl}`);
  const data = await response.json();
  state.data = data;

  renderHero(data);
  renderModules(data);
  renderChecklist(data);
  renderResources(data);
  bindEvents(data);
  observeSections();
}

init().catch((error) => {
  console.error(error);
  els.modules.innerHTML = `<section class="module"><div class="module-body text-block"><p>内容加载失败，请检查 data/guide.json。</p></div></section>`;
});
