"use strict";
const content = window.QUANTUM_CONTENT;
const phone = "15928288152";
const $ = (selector) => document.querySelector(selector);
const create = (tag, className, text) => {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (text !== undefined) el.textContent = text;
  return el;
};
let activeCategory = "全部";
let toastTimer;

function showToast(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toast.hidden = true; }, 3200);
}

async function copyPhone() {
  try {
    await navigator.clipboard.writeText(phone);
    showToast("微信 / 电话已复制：15928288152");
  } catch {
    const area = create("textarea");
    area.value = phone;
    area.style.cssText = "position:fixed;opacity:0;left:0;top:0";
    // 放在当前模态窗口内，避免浏览器焦点限制使复制失败。
    const parent = document.querySelector("dialog[open]") || document.body;
    parent.append(area);
    area.focus();
    area.select();
    const copied = document.execCommand("copy");
    area.remove();
    showToast(copied ? "微信 / 电话已复制：15928288152" : "请手动复制页面中的微信号：15928288152");
  }
}

function openDialog(id) {
  document.querySelectorAll("dialog[open]").forEach((dialog) => dialog.close());
  document.getElementById(id).showModal();
}

function openContact(topic) {
  $("#contact-context").textContent = topic
    ? "交流主题：" + topic + "。添加微信时可以附上这个主题。"
    : "欢迎告诉我：你关注的技术方向，以及这次希望交流的问题。";
  openDialog("contact-dialog");
}

function showJob(job) {
  const detail = $("#job-detail");
  detail.replaceChildren();
  const title = create("h2", "", job.title);
  title.id = "job-dialog-title";
  const meta = create("div", "detail-meta");
  [job.id, ...job.tags, "地点：" + job.location, "薪资：" + job.salary].forEach((text) => meta.append(create("span", "", text)));
  detail.append(title, meta, create("p", "small muted", job.titleNote));
  const body = create("div", "prose");
  [["岗位职责", job.responsibilities], ["任职要求", job.requirements]].forEach(([heading, lines]) => {
    body.append(create("h3", "", heading));
    const list = create("ol");
    lines.forEach((text) => list.append(create("li", "", text)));
    body.append(list);
  });
  detail.append(body, create("p", "detail-notice", "发布于 " + job.publishedAt + " · 信息由主理人提供并脱敏整理。客户背景保密，当前招聘状态、工作地点与薪资请联系确认。"));
  const actions = create("div", "dialog-actions");
  const button = create("button", "button green", "交流这个岗位 ↗");
  button.type = "button";
  button.addEventListener("click", () => openContact(job.id + " · " + job.title));
  actions.append(button);
  detail.append(actions);
  openDialog("job-dialog");
}

function renderJobs() {
  const list = $("#jobs-list");
  const jobs = content.jobs.filter((job) => job.published);
  if (!jobs.length) {
    const empty = create("div", "empty");
    empty.append(create("h3", "", "下一份量子机会，正在整理。"), create("p", "", "岗位经确认并脱敏后，会在这里更新。欢迎先交流你的研究方向与职业期待。"));
    const contact = create("button", "text-link", "与我聊聊 →");
    contact.type = "button";
    contact.addEventListener("click", () => openContact());
    empty.append(contact);
    list.append(empty);
    return;
  }
  jobs.forEach((job) => {
    const article = create("article", "job");
    const info = create("div");
    const heading = create("div", "job-title");
    heading.append(create("h3", "", job.title), create("span", "job-code", job.id));
    const tags = create("div", "job-tags");
    job.tags.forEach((text) => tags.append(create("span", "", text)));
    info.append(heading, tags, create("p", "job-summary", job.summary));
    const button = create("button", "job-action");
    button.type = "button";
    button.setAttribute("aria-label", "查看" + job.title + "岗位详情");
    button.append(document.createTextNode("查看岗位详情 "), create("span", "", "→"));
    button.addEventListener("click", () => showJob(job));
    article.append(info, button);
    list.append(article);
  });
}

function renderResources() {
  const query = $("#resource-search").value.trim().toLocaleLowerCase();
  const resources = content.resources.filter((item) =>
    (activeCategory === "全部" || item.categories.includes(activeCategory)) &&
    [item.title, item.description, item.source, ...item.categories].join(" ").toLocaleLowerCase().includes(query)
  );
  const list = $("#resource-list");
  list.replaceChildren();
  resources.forEach((item) => {
    const link = create("a", "resource");
    link.href = item.url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.setAttribute("aria-label", item.title + "，打开原始来源（新窗口）");
    const top = create("div", "resource-top");
    const heading = create("h3", "", item.title);
    heading.append(create("span", "resource-type", item.type));
    const arrow = create("span", "arrow", "↗");
    arrow.setAttribute("aria-hidden", "true");
    top.append(heading, arrow);
    const meta = create("div", "resource-meta");
    meta.append(create("span", "", item.categories.join(" / ")), create("span", "", "来源：" + item.source), create("span", "", "收录：" + item.addedAt));
    link.append(top, create("p", "", item.description), meta);
    list.append(link);
  });
  $("#empty-resources").hidden = resources.length !== 0;
  $("#result-count").textContent = "找到 " + resources.length + " 条资料";
  document.querySelectorAll("[data-category]").forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.category === activeCategory)));
}

document.querySelectorAll("[data-category]").forEach((button) => button.addEventListener("click", () => {
  activeCategory = button.dataset.category;
  renderResources();
}));
$("#resource-search").addEventListener("input", renderResources);
$("#reset-search").addEventListener("click", () => {
  activeCategory = "全部";
  $("#resource-search").value = "";
  renderResources();
  $("#resource-search").focus();
});
document.querySelectorAll(".contact-trigger").forEach((button) => button.addEventListener("click", () => openContact(button.dataset.topic)));
document.querySelectorAll("[data-copy-phone]").forEach((button) => button.addEventListener("click", copyPhone));
document.querySelectorAll("[data-close]").forEach((button) => button.addEventListener("click", () => button.closest("dialog").close()));
document.querySelectorAll("dialog").forEach((dialog) => dialog.addEventListener("click", (event) => {
  const bounds = dialog.getBoundingClientRect();
  if (event.target === dialog && (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom)) dialog.close();
}));

$("#show-principles").addEventListener("click", () => openDialog("principles-dialog"));

// 纯装饰的波形，不表达设备参数或科学结论。
for (let i = 0; i < 48; i++) {
  const points = [];
  for (let x = 25; x <= 630; x += 5) {
    const amplitude = 64 + i * 1.5;
    const phase = i * 0.038;
    const y = 200 + amplitude * Math.sin((x - 140) / 114 + phase) * Math.sin((x + 15) / 250 + i * 0.018);
    points.push((x === 25 ? "M" : "L") + x + "," + y.toFixed(2));
  }
  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("d", points.join(" "));
  path.setAttribute("stroke", "#d5dec0");
  path.setAttribute("stroke-width", "0.6");
  path.setAttribute("opacity", String(0.2 + (i % 6) * 0.05));
  $("#wave-lines").append(path);
}
renderJobs();
renderResources();

function renderNotes() {
  content.notes.forEach((note) => {
    const article = create("article");
    article.append(create("span", "small muted", (note.type || "个人手记") + " · " + note.date), create("h3", "", note.title), create("p", "", note.summary));
    const read = create("button", "text-link", "阅读文章 →");
    read.type = "button";
    read.addEventListener("click", () => {
      $("#note-title").textContent = note.title;
      $("#note-dialog .dialog-head .small").textContent = note.type || "个人手记";
      const body = $("#note-dialog .prose");
      body.replaceChildren(...note.paragraphs.map((text) => create("p", "", text)));
      if (note.sources && note.sources.length) {
        body.append(create("h3", "", "资料来源"));
        note.sources.forEach((source) => {
          const paragraph = create("p");
          const link = create("a", "text-link", source.title + " ↗");
          link.href = source.url;
          link.target = "_blank";
          link.rel = "noopener noreferrer";
          paragraph.append(link);
          body.append(paragraph);
        });
      }
      openDialog("note-dialog");
    });
    article.append(read);
    $("#notes-list").append(article);
  });
}
renderNotes();
