// 常數設定
const CENTER_X = 200;
const CENTER_Y = 200;
const RADIUS = 180;
const SNAP_ANGLE = 10; // 每 10 度為一個單位

// DOM 元素
const protractor = document.querySelector('#protractor');
const ticksGroup = document.querySelector('#ticks');
const handle1 = document.querySelector('#handle1');
const handle2 = document.querySelector('#handle2');
const line1 = document.querySelector('#line1');
const line2 = document.querySelector('#line2');
const currentAngleDisplay = document.querySelector('#current-angle');
const angleInput = document.querySelector('#angle-input');
const checkBtn = document.querySelector('#check-btn');
const resultDiv = document.querySelector('#result');

// 狀態
let draggingHandle = null;
let handle1Angle = 180; // 左邊，180度
let handle2Angle = 0;   // 右邊，0度

// 初始化
function init() {
  drawTicks();
  updateDisplay();
  setupEventListeners();
}

// 繪製刻度
function drawTicks() {
  for (let angle = 0; angle <= 180; angle += SNAP_ANGLE) {
    const radians = (angle * Math.PI) / 180;
    const x = CENTER_X + RADIUS * Math.cos(Math.PI - radians);
    const y = CENTER_Y - RADIUS * Math.sin(radians);

    // 刻度線
    const innerRadius = angle % 30 === 0 ? RADIUS - 20 : RADIUS - 12;
    const innerX = CENTER_X + innerRadius * Math.cos(Math.PI - radians);
    const innerY = CENTER_Y - innerRadius * Math.sin(radians);

    const tick = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    tick.setAttribute('class', 'tick');
    tick.setAttribute('x1', innerX);
    tick.setAttribute('y1', innerY);
    tick.setAttribute('x2', x);
    tick.setAttribute('y2', y);
    ticksGroup.appendChild(tick);

    // 刻度數字（每 30 度顯示）
    if (angle % 30 === 0) {
      const labelRadius = RADIUS - 35;
      const labelX = CENTER_X + labelRadius * Math.cos(Math.PI - radians);
      const labelY = CENTER_Y - labelRadius * Math.sin(radians) + 4;

      const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      label.setAttribute('class', 'tick-label');
      label.setAttribute('x', labelX);
      label.setAttribute('y', labelY);
      label.textContent = angle;
      ticksGroup.appendChild(label);
    }
  }
}

// 根據角度計算位置
function angleToPosition(angle) {
  const radians = (angle * Math.PI) / 180;
  return {
    x: CENTER_X + RADIUS * Math.cos(Math.PI - radians),
    y: CENTER_Y - RADIUS * Math.sin(radians)
  };
}

// 根據位置計算角度
function positionToAngle(x, y) {
  const dx = x - CENTER_X;
  const dy = CENTER_Y - y;
  let angle = Math.atan2(dy, -dx) * (180 / Math.PI);

  // 限制在 0-180 度之間
  angle = Math.max(0, Math.min(180, angle));

  // 吸附到最近的 10 度
  return Math.round(angle / SNAP_ANGLE) * SNAP_ANGLE;
}

// 取得滑鼠在 SVG 中的座標
function getMousePosition(event) {
  const rect = protractor.getBoundingClientRect();
  const scaleX = 400 / rect.width;
  const scaleY = 220 / rect.height;

  return {
    x: (event.clientX - rect.left) * scaleX,
    y: (event.clientY - rect.top) * scaleY
  };
}

// 更新顯示
function updateDisplay() {
  // 更新 handle1 位置
  const pos1 = angleToPosition(handle1Angle);
  handle1.setAttribute('cx', pos1.x);
  handle1.setAttribute('cy', pos1.y);
  handle1.setAttribute('data-angle', handle1Angle);

  // 更新 handle2 位置
  const pos2 = angleToPosition(handle2Angle);
  handle2.setAttribute('cx', pos2.x);
  handle2.setAttribute('cy', pos2.y);
  handle2.setAttribute('data-angle', handle2Angle);

  // 更新角度線
  line1.setAttribute('x2', pos1.x);
  line1.setAttribute('y2', pos1.y);
  line2.setAttribute('x2', pos2.x);
  line2.setAttribute('y2', pos2.y);

  // 計算並顯示角度
  const currentAngle = Math.abs(handle1Angle - handle2Angle);
  currentAngleDisplay.textContent = currentAngle;
}

// 設定事件監聽器
function setupEventListeners() {
  // 拖曳開始
  handle1.addEventListener('mousedown', (e) => startDrag(e, handle1));
  handle2.addEventListener('mousedown', (e) => startDrag(e, handle2));

  // 觸控支援
  handle1.addEventListener('touchstart', (e) => startDrag(e, handle1), { passive: false });
  handle2.addEventListener('touchstart', (e) => startDrag(e, handle2), { passive: false });

  // 拖曳移動與結束
  document.addEventListener('mousemove', onDrag);
  document.addEventListener('mouseup', endDrag);
  document.addEventListener('touchmove', onDrag, { passive: false });
  document.addEventListener('touchend', endDrag);

  // 檢查答案按鈕
  checkBtn.addEventListener('click', checkAnswer);

  // 輸入欄位驗證
  angleInput.addEventListener('input', validateInput);
}

// 開始拖曳
function startDrag(event, handle) {
  event.preventDefault();
  draggingHandle = handle;
  handle.classList.add('dragging');
}

// 拖曳中
function onDrag(event) {
  if (!draggingHandle) return;
  event.preventDefault();

  let clientX, clientY;
  if (event.touches) {
    clientX = event.touches[0].clientX;
    clientY = event.touches[0].clientY;
  } else {
    clientX = event.clientX;
    clientY = event.clientY;
  }

  const pos = getMousePosition({ clientX, clientY });
  const angle = positionToAngle(pos.x, pos.y);

  if (draggingHandle === handle1) {
    handle1Angle = angle;
  } else {
    handle2Angle = angle;
  }

  updateDisplay();
}

// 結束拖曳
function endDrag() {
  if (draggingHandle) {
    draggingHandle.classList.remove('dragging');
    draggingHandle = null;
  }
}

// 驗證輸入
function validateInput() {
  let value = parseInt(angleInput.value, 10);

  if (isNaN(value)) {
    return;
  }

  if (value < 0) {
    angleInput.value = 0;
  } else if (value > 180) {
    angleInput.value = 180;
  }
}

// 檢查答案
function checkAnswer() {
  const inputValue = parseInt(angleInput.value, 10);
  const currentAngle = Math.abs(handle1Angle - handle2Angle);

  // 清除之前的結果樣式
  resultDiv.classList.remove('correct', 'incorrect');

  if (isNaN(inputValue)) {
    resultDiv.textContent = '請輸入有效的數字！';
    resultDiv.classList.add('incorrect');
    return;
  }

  if (inputValue === currentAngle) {
    resultDiv.textContent = '正確！答案是 ' + currentAngle + ' 度';
    resultDiv.classList.add('correct');
  } else {
    resultDiv.textContent = '錯誤！請再試一次';
    resultDiv.classList.add('incorrect');
  }
}

// 啟動應用
init();
