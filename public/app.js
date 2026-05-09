const currentYear = new Date().getFullYear();
const storageKey = "xiaoshan-evaluation-records";

const fields = [
  "founderName",
  "birthYear",
  "age",
  "education",
  "overseasYears",
  "role",
  "coreMembers",
  "teamAverageAge",
  "companyStatus",
  "shareholding",
  "isLargestShareholder",
  "canPaySocialSecurity",
  "coreMemberOneName",
  "coreMemberTwoName",
  "coreTeamFullTimeQualified",
  "patentCount",
  "paperCount",
  "combinedDirection",
  "stage",
  "teamQualified",
  "ageQualified",
  "experienceQualified",
  "shareQualified",
  "landingXiaoshan",
  "industryQualified"
];

const fieldLabels = {
  founderName: "姓名",
  birthYear: "出生年",
  age: "年龄",
  education: "学历",
  overseasYears: "海外经历",
  role: "职务",
  coreMembers: "核心成员",
  teamAverageAge: "团队平均年龄",
  companyStatus: "企业状态",
  shareholding: "持股",
  isLargestShareholder: "是否第一大股东",
  canPaySocialSecurity: "可在萧山区缴纳社保",
  coreMemberOneName: "核心团队成员 1",
  coreMemberTwoName: "核心团队成员 2",
  coreTeamFullTimeQualified: "两名核心成员全职并后期缴纳社保",
  patentCount: "专利",
  paperCount: "论文",
  combinedDirection: "技术领域与产业方向",
  stage: "项目阶段",
  teamQualified: "团队总人数≥3人（含申报人）",
  ageQualified: "年龄符合",
  experienceQualified: "学历/经历符合",
  shareQualified: "持股≥20%",
  landingXiaoshan: "落地萧山",
  industryQualified: "产业符合"
};

const requiredFields = [
  "founderName",
  "birthYear",
  "education",
  "overseasYears",
  "role",
  "coreMembers",
  "teamAverageAge",
  "companyStatus",
  "shareholding",
  "coreMemberOneName",
  "coreMemberTwoName",
  "patentCount",
  "paperCount",
  "combinedDirection",
  "stage"
];

const form = document.querySelector("#evaluationForm");
const fileInput = document.querySelector("#projectFiles");
const uploadStatusText = document.querySelector("#uploadStatusText");
const uploadStatusDot = document.querySelector("#uploadStatusDot");
const fileList = document.querySelector("#fileList");
const startEvaluation = document.querySelector("#startEvaluation");
const exportReport = document.querySelector("#exportReport");
const gradeOutput = document.querySelector("#gradeOutput");
const resultSummary = document.querySelector("#resultSummary");
const fileReference = document.querySelector("#fileReference");
const agentAdvice = document.querySelector("#agentAdvice");
const criteriaToggle = document.querySelector("#criteriaToggle");
const criteriaCard = document.querySelector("#criteriaCard");
const recordList = document.querySelector("#recordList");
const clearRecords = document.querySelector("#clearRecords");
const detailModal = document.querySelector("#detailModal");
const modalContent = document.querySelector("#modalContent");

let uploadedFiles = [];
let autoFilledFields = new Set();
let hasEvaluated = false;

function element(id) {
  return document.querySelector(`#${id}`);
}

function numeric(value) {
  if (value === undefined || value === null || value === "") return 0;
  const normalized = String(value).replace(/[^\d.]/g, "");
  return Number(normalized || 0);
}

function getFormData() {
  return fields.reduce((data, id) => {
    const input = element(id);
    if (!input) return data;
    data[id] = input.type === "checkbox" ? input.checked : input.value.trim();
    return data;
  }, {});
}

function setFieldValue(id, value, source = "manual") {
  const input = element(id);
  if (!input || value === undefined || value === null || value === "") return;

  if (input.type === "checkbox") {
    input.checked = Boolean(value);
  } else {
    input.value = String(value);
  }

  if (source === "file") {
    autoFilledFields.add(id);
    input.classList.add("auto-filled");
  }
}

function clearAutoFillHighlight(event) {
  const input = event.target;
  if (!input.id || !autoFilledFields.has(input.id)) return;
  autoFilledFields.delete(input.id);
  input.classList.remove("auto-filled");
}

function setUploadStatus(text, state = "idle") {
  uploadStatusText.textContent = text;
  uploadStatusDot.classList.toggle("is-busy", state === "busy");
  uploadStatusDot.classList.toggle("is-done", state === "done");
}

function syncAgeFromBirthYear() {
  const birthYear = numeric(element("birthYear").value);
  const ageInput = element("age");
  const isValidBirthYear = birthYear >= 1900 && birthYear <= currentYear;
  ageInput.value = isValidBirthYear ? String(currentYear - birthYear) : "";
}

function syncDerivedChecks() {
  syncAgeFromBirthYear();
  const data = getFormData();
  const coreMembers = numeric(data.coreMembers);
  const totalTeamMembers = coreMembers + 1;
  const shareholding = numeric(data.shareholding);
  const education = data.education;
  const overseasYears = numeric(data.overseasYears);

  element("teamQualified").checked = totalTeamMembers >= 3 || element("teamQualified").checked;
  element("shareQualified").checked = shareholding >= 20 || element("shareQualified").checked;

  const hasEducationExperience =
    education === "博士" ||
    (education === "硕士" && overseasYears >= 2) ||
    overseasYears >= 3;
  element("experienceQualified").checked = hasEducationExperience || element("experienceQualified").checked;
}

function getMissingFields(data) {
  const missing = requiredFields.filter((id) => !data[id]);
  if (!data.canPaySocialSecurity && numeric(data.shareholding) <= 50) {
    missing.push("canPaySocialSecurity");
  }
  if (!data.coreTeamFullTimeQualified) {
    missing.push("coreTeamFullTimeQualified");
  }
  return [...new Set(missing)];
}

function evaluateProject(data) {
  const coreMembers = numeric(data.coreMembers);
  const totalTeamMembers = coreMembers + 1;
  const shareholding = numeric(data.shareholding);
  const patents = numeric(data.patentCount);
  const papers = numeric(data.paperCount);
  const overseasYears = numeric(data.overseasYears);
  const age = numeric(data.age) || (numeric(data.birthYear) ? currentYear - numeric(data.birthYear) : 0);
  const failReasons = [];
  const strengths = [];
  const cautions = [];
  let score = 0;

  const hardChecks = [
    ["teamQualified", totalTeamMembers >= 3, "团队总人数至少 3 人（含申报人）"],
    ["ageQualified", data.ageQualified, "年龄条件需确认符合"],
    ["experienceQualified", data.experienceQualified, "学历/海外经历需符合"],
    ["shareQualified", shareholding >= 20, "申报人持股不少于 20%"],
    ["landingXiaoshan", data.landingXiaoshan, "项目需落地萧山"],
    ["industryQualified", data.industryQualified, "产业方向需符合政策要求"]
  ];

  hardChecks.forEach(([, pass, label]) => {
    if (!pass) failReasons.push(label);
  });

  if (!data.canPaySocialSecurity && shareholding <= 50) {
    failReasons.push("申报人不能在萧山区缴纳社保时，持股需超过 50%");
  }

  if (!data.coreMemberOneName || !data.coreMemberTwoName || !data.coreTeamFullTimeQualified) {
    failReasons.push("除主申报人外，需两名核心团队成员全职并后期缴纳社保");
  }

  if (!data.isLargestShareholder) {
    cautions.push("建议确认申报人是否为第一大股东，避免股权结构审核风险。");
  }

  if (data.education === "博士") {
    score += 22;
    strengths.push("申报人学历为博士，人才基础较强。");
  } else if (data.education === "硕士") {
    score += 14;
    strengths.push("申报人学历为硕士，具备较好的专业基础。");
  } else if (data.education === "本科") {
    score += 8;
  }

  if (overseasYears >= 5) {
    score += 18;
    strengths.push("海外经历达到 5 年及以上，国际化背景突出。");
  } else if (overseasYears >= 3) {
    score += 12;
    strengths.push("海外经历达到 3 年及以上。");
  } else if (overseasYears > 0) {
    score += 5;
  }

  if (patents >= 3) {
    score += 18;
    strengths.push("专利数量较充足，具备技术壁垒信号。");
  } else if (patents >= 1) {
    score += 10;
    strengths.push("已有专利支撑技术可行性。");
  } else {
    cautions.push("暂未看到专利信息，建议补充知识产权证明。");
  }

  if (papers >= 2) {
    score += 10;
    strengths.push("论文数量可辅助证明研发能力。");
  } else if (papers >= 1) {
    score += 5;
  }

  if (data.stage === "量产") {
    score += 18;
    strengths.push("项目已进入量产阶段，产业化确定性更强。");
  } else if (data.stage === "原型") {
    score += 12;
    strengths.push("项目已有原型，具备进一步验证基础。");
  } else if (data.stage === "实验室") {
    score += 4;
    cautions.push("项目仍处实验室阶段，建议补充转化路径和里程碑。");
  }

  if (totalTeamMembers >= 4) {
    score += 8;
    strengths.push("团队总人数超过最低要求。");
  }

  if (shareholding >= 50) {
    score += 8;
    strengths.push("申报人持股比例较高，控制力较强。");
  } else if (shareholding >= 20) {
    score += 4;
  }

  if (age && age <= 45) {
    score += 4;
  }

  let grade = "C";
  if (failReasons.length > 0) {
    grade = "不符合";
  } else if (score >= 80) {
    grade = "A";
  } else if (score >= 55) {
    grade = "B";
  }

  const missing = getMissingFields(data);
  if (grade !== "不符合" && missing.length > 0) {
    cautions.push(`仍有信息不完整：${missing.map((id) => fieldLabels[id]).join("、")}。`);
  }

  const reasons = grade === "不符合" ? failReasons : strengths;
  const summary =
    grade === "不符合"
      ? `当前项目未通过硬性条件：${failReasons.join("；")}。`
      : `当前项目预估为 ${grade} 类，综合得分 ${score}。${strengths[0] || "项目满足基本申报条件。"}`;

  return {
    grade,
    score,
    summary,
    reasons,
    cautions,
    missing,
    failReasons,
    strengths
  };
}

function renderEvaluation(result) {
  gradeOutput.textContent = result.grade;
  gradeOutput.dataset.grade = result.grade;
  resultSummary.textContent = result.summary;

  if (uploadedFiles.length > 0) {
    const names = uploadedFiles.map((file) => file.name).join("、");
    fileReference.textContent = `以上评估结果参考了您上传的 ${names}`;
  } else {
    fileReference.textContent = "以上评估结果基于当前表单信息生成，尚未参考上传文件。";
  }

  const adviceItems = [
    ...result.reasons.map((text) => ({ type: "依据", text })),
    ...result.cautions.map((text) => ({ type: "建议", text }))
  ];

  agentAdvice.innerHTML =
    adviceItems.length > 0
      ? `<ul>${adviceItems.map((item) => `<li><strong>${item.type}：</strong>${escapeHtml(item.text)}</li>`).join("")}</ul>`
      : "<p>项目满足主要条件，暂无额外建议。</p>";
}

function saveRecord(data, result) {
  const records = getRecords();
  const record = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    data,
    result,
    files: uploadedFiles.map((file) => ({ name: file.name, size: file.size, type: file.type }))
  };
  records.unshift(record);
  localStorage.setItem(storageKey, JSON.stringify(records.slice(0, 20)));
  renderRecords();
}

function getRecords() {
  try {
    return JSON.parse(localStorage.getItem(storageKey) || "[]");
  } catch {
    return [];
  }
}

function renderRecords() {
  const records = getRecords();
  if (records.length === 0) {
    recordList.innerHTML = "<p>暂无评估记录。</p>";
    return;
  }

  recordList.innerHTML = records
    .map((record) => {
      const date = new Date(record.createdAt).toLocaleString("zh-CN", { hour12: false });
      const name = record.data.founderName || "未命名项目";
      return `
        <article class="record-item">
          <div>
            <strong>${escapeHtml(name)} · ${escapeHtml(record.result.grade)}</strong>
            <p>${escapeHtml(date)}</p>
          </div>
          <button class="record-button" type="button" data-record-id="${record.id}">查看详情</button>
        </article>
      `;
    })
    .join("");
}

function openRecordDetail(recordId) {
  const record = getRecords().find((item) => item.id === recordId);
  if (!record) return;

  const data = record.data;
  const fileNames = record.files.length > 0 ? record.files.map((file) => file.name).join("、") : "未上传文件";
  const groups = [
    ["申报人基础信息", ["founderName", "birthYear", "age", "education", "overseasYears", "role"]],
    [
      "团队与企业",
      [
        "coreMembers",
        "teamAverageAge",
        "companyStatus",
        "shareholding",
        "isLargestShareholder",
        "canPaySocialSecurity",
        "coreMemberOneName",
        "coreMemberTwoName",
        "coreTeamFullTimeQualified"
      ]
    ],
    ["技术信息", ["patentCount", "paperCount", "combinedDirection", "stage"]],
    ["硬性条件", ["teamQualified", "ageQualified", "experienceQualified", "shareQualified", "landingXiaoshan", "industryQualified"]]
  ];

  modalContent.innerHTML = `
    <section class="detail-section">
      <h3>评估结论</h3>
      <div class="detail-grid">
        <div class="detail-cell"><span>预估等级</span><strong>${escapeHtml(record.result.grade)}</strong></div>
        <div class="detail-cell"><span>综合得分</span><strong>${record.result.score}</strong></div>
        <div class="detail-cell"><span>参考文件</span><strong>${escapeHtml(fileNames)}</strong></div>
        <div class="detail-cell"><span>评估时间</span><strong>${escapeHtml(new Date(record.createdAt).toLocaleString("zh-CN", { hour12: false }))}</strong></div>
      </div>
    </section>
    ${groups
      .map(
        ([title, ids]) => `
          <section class="detail-section">
            <h3>${title}</h3>
            <div class="detail-grid">
              ${ids.map((id) => renderDetailCell(id, data[id])).join("")}
            </div>
          </section>
        `
      )
      .join("")}
    <section class="detail-section">
      <h3>详细评估理由</h3>
      <ol class="reason-list">
        ${[...record.result.reasons, ...record.result.cautions].map((reason) => `<li>${escapeHtml(reason)}</li>`).join("")}
      </ol>
    </section>
  `;

  detailModal.hidden = false;
}

function renderDetailCell(id, value) {
  let displayValue = value;
  if (typeof value === "boolean") displayValue = value ? "是" : "否";
  if (displayValue === "" || displayValue === undefined || displayValue === null) displayValue = "未填写";
  if (id === "shareholding" && displayValue !== "未填写") displayValue = `${displayValue}%`;
  if (id === "overseasYears" && displayValue !== "未填写") displayValue = `${displayValue} 年`;
  if (id === "patentCount" && displayValue !== "未填写") displayValue = `${displayValue} 项`;
  if (id === "paperCount" && displayValue !== "未填写") displayValue = `${displayValue} 篇`;
  return `<div class="detail-cell"><span>${escapeHtml(fieldLabels[id])}</span><strong>${escapeHtml(String(displayValue))}</strong></div>`;
}

function closeModal() {
  detailModal.hidden = true;
}

function parseProjectText(text) {
  const compact = text.replace(/\s+/g, " ");
  const extracted = {};

  const patterns = [
    ["founderName", /(?:姓名|申报人|创始人)[:：\s]*([\u4e00-\u9fa5A-Za-z·]{2,24})/],
    ["birthYear", /(?:出生年|出生年份|出生于)[:：\s]*(19\d{2}|20\d{2})/],
    ["age", /(?:年龄)[:：\s]*(\d{2})/],
    ["education", /(博士|硕士|本科)/],
    ["overseasYears", /(?:海外经历|海外工作|海外学习|留学|海外)[:：\s]*(\d+(?:\.\d+)?)\s*年/],
    ["role", /(?:职务|职位|担任)[:：\s]*([\u4e00-\u9fa5A-Za-z /]{2,40})/],
    ["coreMembers", /(?:核心成员|团队人数|核心团队)[:：\s]*(\d+)\s*人/],
    ["teamAverageAge", /(?:团队平均年龄|平均年龄|团队平均)[:：\s]*(\d{2})\s*岁?/],
    ["companyStatus", /(已注册|拟落地)/],
    ["shareholding", /(?:持股|股份|股权)[:：\s]*(\d+(?:\.\d+)?)\s*%/],
    ["patentCount", /(?:专利)[:：\s]*(\d+)\s*(?:项|件)/],
    ["paperCount", /(?:论文)[:：\s]*(\d+)\s*篇/],
    ["combinedDirection", /(?:技术领域与产业方向|技术领域|产业方向|领域)[:：\s]*([\u4e00-\u9fa5A-Za-z0-9 /、，,-]{2,48})/],
    ["stage", /(实验室|原型|量产)/]
  ];

  patterns.forEach(([field, pattern]) => {
    const match = compact.match(pattern);
    if (match) extracted[field] = match[1];
  });

  if (/第一大股东|控股股东/.test(compact)) extracted.isLargestShareholder = true;
  if (/萧山区.{0,12}社保|缴纳社保|可在萧山/.test(compact)) extracted.canPaySocialSecurity = true;
  if (/落地萧山|萧山落地|落户萧山/.test(compact)) extracted.landingXiaoshan = true;
  if (/产业符合|符合产业|符合.*方向/.test(compact)) extracted.industryQualified = true;
  if (/全职/.test(compact) && /缴纳社保/.test(compact)) extracted.coreTeamFullTimeQualified = true;

  const memberMatch = compact.match(/(?:核心成员1|核心成员一|成员1)[:：\s]*([\u4e00-\u9fa5A-Za-z·]{2,24}).{0,24}(?:核心成员2|核心成员二|成员2)[:：\s]*([\u4e00-\u9fa5A-Za-z·]{2,24})/);
  if (memberMatch) {
    extracted.coreMemberOneName = memberMatch[1];
    extracted.coreMemberTwoName = memberMatch[2];
  }

  return extracted;
}

async function handleFiles(event) {
  uploadedFiles = Array.from(event.target.files || []);
  fileList.innerHTML = uploadedFiles.map((file) => `<span class="file-pill">${escapeHtml(file.name)}</span>`).join("");

  if (uploadedFiles.length === 0) {
    setUploadStatus("待上传");
    return;
  }

  setUploadStatus("文件已读取", "done");
  await wait(450);
  setUploadStatus("AI 正在解析", "busy");

  const textBlocks = [];
  for (const file of uploadedFiles) {
    const text = await file.text();
    textBlocks.push(text);
  }

  const extracted = parseProjectText(textBlocks.join("\n"));
  Object.entries(extracted).forEach(([id, value]) => setFieldValue(id, value, "file"));
  syncDerivedChecks();

  await wait(650);
  const filledCount = Object.keys(extracted).length;
  setUploadStatus(filledCount > 0 ? `解析完成，已自动填充 ${filledCount} 项` : "解析完成，未识别到可自动填充字段", "done");
}

function exportMissingReport() {
  const data = getFormData();
  const result = evaluateProject(data);
  const missingLabels = result.missing.map((id) => fieldLabels[id]);
  const lines = [
    "5213 项目补充信息报告",
    `生成时间：${new Date().toLocaleString("zh-CN", { hour12: false })}`,
    "",
    `项目/申报人：${data.founderName || "未填写"}`,
    `当前预估等级：${result.grade}`,
    "",
    "需补充或确认的信息：",
    ...(missingLabels.length > 0 ? missingLabels.map((label) => `- ${label}`) : ["- 暂无明显缺失字段"]),
    "",
    "评估风险与建议：",
    ...[...result.failReasons, ...result.cautions].map((item) => `- ${item}`),
    "",
    "已上传文件：",
    ...(uploadedFiles.length > 0 ? uploadedFiles.map((file) => `- ${file.name}`) : ["- 未上传"])
  ];

  downloadTextFile(`5213补充信息报告-${data.founderName || "项目"}.txt`, lines.join("\n"));
}

function downloadTextFile(filename, content) {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

fileInput.addEventListener("change", handleFiles);
form.addEventListener("input", (event) => {
  clearAutoFillHighlight(event);
  if (event.target.id === "birthYear") {
    syncAgeFromBirthYear();
  }
  if (hasEvaluated) {
    resultSummary.textContent = "表单已修改，请再次点击“开始自主评估”更新预估等级。";
  }
});

startEvaluation.addEventListener("click", () => {
  syncDerivedChecks();
  const data = getFormData();
  const result = evaluateProject(data);
  hasEvaluated = true;
  renderEvaluation(result);
  saveRecord(data, result);
});

exportReport.addEventListener("click", exportMissingReport);

criteriaToggle.addEventListener("click", () => {
  const expanded = criteriaToggle.getAttribute("aria-expanded") === "true";
  criteriaToggle.setAttribute("aria-expanded", String(!expanded));
  criteriaCard.hidden = expanded;
});

recordList.addEventListener("click", (event) => {
  const button = event.target.closest("[data-record-id]");
  if (!button) return;
  openRecordDetail(button.dataset.recordId);
});

clearRecords.addEventListener("click", () => {
  localStorage.removeItem(storageKey);
  renderRecords();
});

detailModal.addEventListener("click", (event) => {
  if (event.target.matches("[data-close-modal]")) closeModal();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeModal();
});

renderRecords();
