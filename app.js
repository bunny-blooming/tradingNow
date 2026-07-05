const CHECK_ITEMS = [
  "오늘 매매 계획에 있던 종목인가?",
  "손절 기준을 숫자로 정했는가?",
  "매수 이유를 한 문장으로 설명할 수 있는가?",
  "예상 수익과 손실 비율을 받아들일 수 있는가?",
  "지금 급하게 따라 사는 상태가 아닌가?",
];

const STORAGE_KEY = "trading-note-records-v1";
const CHART_IMAGE_MAX_WIDTH = 720;

const checklist = document.querySelector("#checklist");
const checkProgress = document.querySelector("#checkProgress");
const gateMessage = document.querySelector("#gateMessage");
const lockState = document.querySelector("#lockState");
const tradeFields = document.querySelector("#tradeFields");
const tradeForm = document.querySelector("#tradeForm");
const todayLabel = document.querySelector("#todayLabel");
const chartInput = document.querySelector("#chartInput");
const chartPreview = document.querySelector("#chartPreview");
const chartEmpty = document.querySelector(".chart-empty");
const similarChartInput = document.querySelector("#similarChartInput");
const similarChartPreview = document.querySelector("#similarChartPreview");
const similarChartEmpty = document.querySelector(".similar-chart-empty");
const reasonInput = document.querySelector("#reasonInput");
const symbolInput = document.querySelector("#symbolInput");
const buyPriceInput = document.querySelector("#buyPriceInput");
const buyAmountInput = document.querySelector("#buyAmountInput");
const targetPriceInput = document.querySelector("#targetPriceInput");
const stopPriceInput = document.querySelector("#stopPriceInput");
const stopReasonInput = document.querySelector("#stopReasonInput");
const returnPreview = document.querySelector("#returnPreview");
const resetButton = document.querySelector("#resetButton");
const toggleRecordsButton = document.querySelector("#toggleRecordsButton");
const recordsPanel = document.querySelector("#recordsPanel");
const recordsList = document.querySelector("#recordsList");
const recordDetail = document.querySelector("#recordDetail");
const recordListItemTemplate = document.querySelector("#recordListItemTemplate");
const recordDetailTemplate = document.querySelector("#recordDetailTemplate");
const emptyState = document.querySelector("#emptyState");
const clearRecordsButton = document.querySelector("#clearRecordsButton");

let chartDataUrl = "";
let similarChartDataUrl = "";
let recordsOpen = false;
let selectedRecordId = "";

todayLabel.textContent = new Intl.DateTimeFormat("ko-KR", {
  month: "short",
  day: "numeric",
  weekday: "short",
}).format(new Date());

function getRecords() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function saveRecords(records) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

function parseMoney(value) {
  const normalized = String(value ?? "").replace(/,/g, "").trim();
  if (!normalized) {
    return NaN;
  }

  return Number(normalized);
}

function formatPrice(value) {
  const number = parseMoney(value);
  if (!Number.isFinite(number) || value === "" || value == null) {
    return "-";
  }

  return number.toLocaleString("ko-KR", {
    maximumFractionDigits: 2,
  });
}

function calculateReturn(buyPrice, targetPrice) {
  const buy = parseMoney(buyPrice);
  const target = parseMoney(targetPrice);
  if (!buy || !target) {
    return 0;
  }
  return ((target - buy) / buy) * 100;
}

function groupDigits(digits) {
  const normalized = digits.replace(/^0+(?=\d)/, "");
  return normalized.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function formatMoneyText(value) {
  const cleaned = String(value ?? "").replace(/[^\d.]/g, "");
  if (!cleaned) {
    return "";
  }

  const dotIndex = cleaned.indexOf(".");
  if (dotIndex >= 0) {
    const integerPart = cleaned.slice(0, dotIndex);
    const decimalPart = cleaned.slice(dotIndex + 1).replace(/\./g, "");
    return `${groupDigits(integerPart) || "0"}.${decimalPart}`;
  }

  return groupDigits(cleaned);
}

function normalizeMoneyValue(value) {
  return String(value ?? "").replace(/,/g, "").trim();
}

function handleMoneyInput(event) {
  const input = event.target;
  input.value = formatMoneyText(input.value);
  updateReturnPreview();
}

function createRecordId() {
  if (crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function renderChecklist() {
  checklist.innerHTML = "";
  CHECK_ITEMS.forEach((text, index) => {
    const label = document.createElement("label");
    label.className = "check-item";
    label.innerHTML = `
      <input type="checkbox" data-check-index="${index}" />
      <span>${text}</span>
    `;
    checklist.append(label);
  });
}

function updateChecklistState() {
  const checks = [...checklist.querySelectorAll("input")];
  const done = checks.filter((item) => item.checked).length;
  const ready = done === CHECK_ITEMS.length;

  checkProgress.textContent = `${done}/${CHECK_ITEMS.length}`;
  tradeFields.disabled = !ready;
  lockState.textContent = ready ? "작성 가능" : "잠김";
  lockState.classList.toggle("ready", ready);
  gateMessage.textContent = ready
    ? "좋습니다. 이제 매수 이유를 기록하세요."
    : "체크가 모두 끝나면 기록창이 열립니다.";
}

function updateReturnPreview() {
  const rate = calculateReturn(buyPriceInput.value, targetPriceInput.value);
  const sign = rate > 0 ? "+" : "";
  const buyAmount = parseMoney(buyAmountInput.value);
  const stopRate = calculateReturn(buyPriceInput.value, stopPriceInput.value);
  const stopSign = stopRate > 0 ? "+" : "";
  const previewParts = [`예상 수익률 ${sign}${rate.toFixed(2)}%`];

  if (buyAmount > 0 && rate !== 0) {
    const expectedProfit = (buyAmount * rate) / 100;
    const profitSign = expectedProfit > 0 ? "+" : "";
    previewParts.push(`가능금액 기준 ${profitSign}${formatPrice(expectedProfit)}원`);
  }

  if (stopPriceInput.value) {
    previewParts.push(`손절률 ${stopSign}${stopRate.toFixed(2)}%`);
    if (buyAmount > 0 && stopRate !== 0) {
      const expectedLoss = (buyAmount * stopRate) / 100;
      const lossSign = expectedLoss > 0 ? "+" : "";
      previewParts.push(`손절금 ${lossSign}${formatPrice(expectedLoss)}원`);
    }
  }

  returnPreview.textContent = previewParts.join(" · ");
}

function resetTradeForm() {
  tradeForm.reset();
  chartDataUrl = "";
  similarChartDataUrl = "";
  chartPreview.hidden = true;
  chartPreview.removeAttribute("src");
  chartEmpty.hidden = false;
  similarChartPreview.hidden = true;
  similarChartPreview.removeAttribute("src");
  similarChartEmpty.hidden = false;
  updateReturnPreview();
}

function resetChecklist() {
  checklist.querySelectorAll("input").forEach((input) => {
    input.checked = false;
  });
  updateChecklistState();
}

function resizeImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("차트 이미지를 읽지 못했습니다."));
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => reject(new Error("지원하지 않는 이미지입니다."));
      image.onload = () => {
        const scale = Math.min(1, CHART_IMAGE_MAX_WIDTH / image.width);
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(image.width * scale);
        canvas.height = Math.round(image.height * scale);

        const context = canvas.getContext("2d");
        context.imageSmoothingQuality = "high";
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.72));
      };
      image.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

async function handleChartChange(event) {
  const file = event.target.files?.[0];
  if (!file) {
    return;
  }

  try {
    chartDataUrl = await resizeImage(file);
    chartPreview.src = chartDataUrl;
    chartPreview.hidden = false;
    chartEmpty.hidden = true;
  } catch (error) {
    alert(error.message);
    chartInput.value = "";
  }
}

async function handleSimilarChartChange(event) {
  const file = event.target.files?.[0];
  if (!file) {
    similarChartDataUrl = "";
    similarChartPreview.hidden = true;
    similarChartPreview.removeAttribute("src");
    similarChartEmpty.hidden = false;
    return;
  }

  try {
    similarChartDataUrl = await resizeImage(file);
    similarChartPreview.src = similarChartDataUrl;
    similarChartPreview.hidden = false;
    similarChartEmpty.hidden = true;
  } catch (error) {
    alert(error.message);
    similarChartInput.value = "";
  }
}

function deleteRecord(recordId) {
  if (!confirm("이 기록을 삭제할까요?")) {
    return;
  }

  saveRecords(getRecords().filter((item) => item.id !== recordId));
  selectedRecordId = "";
  renderRecords();
}

function renderRecordList(records) {
  recordsList.innerHTML = "";
  recordDetail.innerHTML = "";
  recordsList.hidden = false;
  recordDetail.hidden = true;

  records.forEach((record) => {
    const node = recordListItemTemplate.content.firstElementChild.cloneNode(true);
    const button = node.querySelector(".record-list-button");
    node.querySelector(".record-list-symbol").textContent = record.symbol || "종목명 없음";
    node.querySelector(".record-list-date").textContent = record.createdAt || "-";
    node.querySelector(".record-list-buy").textContent = formatPrice(record.buyPrice);
    node.querySelector(".record-list-target").textContent = formatPrice(record.targetPrice);
    button.addEventListener("click", () => {
      selectedRecordId = record.id;
      renderRecords();
    });

    recordsList.append(node);
  });
}

function renderRecordDetail(record) {
  recordsList.innerHTML = "";
  recordsList.hidden = true;
  recordDetail.innerHTML = "";
  recordDetail.hidden = false;

  const node = recordDetailTemplate.content.firstElementChild.cloneNode(true);
  const rate = calculateReturn(record.buyPrice, record.targetPrice);
  const sign = rate > 0 ? "+" : "";

  node.querySelector(".record-symbol").textContent = record.symbol || "종목명 없음";
  node.querySelector(".record-date").textContent = record.createdAt || "-";
  node.querySelector(".record-chart").src = record.chart;

  const similarChart = node.querySelector(".record-similar-chart");
  if (record.similarChart) {
    similarChart.hidden = false;
    similarChart.querySelector("img").src = record.similarChart;
  }

  node.querySelector(".record-reason").textContent = record.reason || "-";
  node.querySelector(".record-stop-reason").textContent = record.stopReason || "-";
  node.querySelector(".record-buy").textContent = formatPrice(record.buyPrice);
  node.querySelector(".record-amount").textContent = `${formatPrice(record.buyAmount)}원`;
  node.querySelector(".record-target").textContent = formatPrice(record.targetPrice);
  node.querySelector(".record-stop").textContent = formatPrice(record.stopPrice);
  node.querySelector(".record-return").textContent = `${sign}${rate.toFixed(2)}%`;
  node.querySelector(".back-record").addEventListener("click", () => {
    selectedRecordId = "";
    renderRecords();
  });
  node.querySelector(".delete-record").addEventListener("click", () => deleteRecord(record.id));

  recordDetail.append(node);
}

function renderRecords() {
  const records = getRecords();
  const hasRecords = records.length > 0;
  const selectedRecord = records.find((record) => record.id === selectedRecordId);

  emptyState.hidden = hasRecords;
  toggleRecordsButton.disabled = !hasRecords;
  toggleRecordsButton.textContent = recordsOpen ? "기록 닫기" : `기록 보기 (${records.length})`;
  recordsPanel.hidden = !recordsOpen || !hasRecords;

  if (!recordsOpen || !hasRecords) {
    selectedRecordId = "";
    recordsList.innerHTML = "";
    recordDetail.innerHTML = "";
    return;
  }

  if (selectedRecord) {
    renderRecordDetail(selectedRecord);
    return;
  }

  selectedRecordId = "";
  renderRecordList(records);
}

function handleSubmit(event) {
  event.preventDefault();

  if (!chartDataUrl) {
    alert("차트 스크린샷을 먼저 넣어주세요.");
    return;
  }

  const record = {
    id: createRecordId(),
    symbol: symbolInput.value.trim(),
    reason: reasonInput.value.trim(),
    buyPrice: normalizeMoneyValue(buyPriceInput.value),
    buyAmount: normalizeMoneyValue(buyAmountInput.value),
    targetPrice: normalizeMoneyValue(targetPriceInput.value),
    stopPrice: normalizeMoneyValue(stopPriceInput.value),
    stopReason: stopReasonInput.value.trim(),
    chart: chartDataUrl,
    similarChart: similarChartDataUrl,
    createdAt: new Intl.DateTimeFormat("ko-KR", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date()),
  };

  if (
    !record.symbol ||
    !record.reason ||
    !record.buyPrice ||
    !record.buyAmount ||
    !record.targetPrice ||
    !record.stopPrice ||
    !record.stopReason
  ) {
    alert("종목명, 매수 이유, 매수가, 매수 가능금액, 예상 매도가, 손절가, 손절 이유를 모두 적어주세요.");
    return;
  }

  saveRecords([record, ...getRecords()]);
  recordsOpen = true;
  selectedRecordId = record.id;
  resetTradeForm();
  resetChecklist();
  renderRecords();
}

function clearRecords() {
  if (!getRecords().length) {
    return;
  }

  if (confirm("저장한 기록을 모두 삭제할까요?")) {
    saveRecords([]);
    recordsOpen = false;
    selectedRecordId = "";
    renderRecords();
  }
}

function toggleRecords() {
  recordsOpen = !recordsOpen;
  selectedRecordId = "";
  renderRecords();
}

function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("service-worker.js");
  }
}

renderChecklist();
updateChecklistState();
updateReturnPreview();
renderRecords();
registerServiceWorker();

checklist.addEventListener("change", updateChecklistState);
chartInput.addEventListener("change", handleChartChange);
similarChartInput.addEventListener("change", handleSimilarChartChange);
buyPriceInput.addEventListener("input", handleMoneyInput);
buyAmountInput.addEventListener("input", handleMoneyInput);
targetPriceInput.addEventListener("input", handleMoneyInput);
stopPriceInput.addEventListener("input", handleMoneyInput);
tradeForm.addEventListener("submit", handleSubmit);
resetButton.addEventListener("click", resetTradeForm);
toggleRecordsButton.addEventListener("click", toggleRecords);
clearRecordsButton.addEventListener("click", clearRecords);
