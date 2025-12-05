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
const targetAngleDisplay = document.querySelector('#target-angle');
const checkBtn = document.querySelector('#check-btn');

// Dialog 元素
const startOverlay = document.querySelector('#start-overlay');
const targetAngleInput = document.querySelector('#target-angle-input');
const startBtn = document.querySelector('#start-btn');
const resultOverlay = document.querySelector('#result-overlay');
const resultDialog = resultOverlay.querySelector('.dialog');
const resultTitle = document.querySelector('#result-title');
const resultMessage = document.querySelector('#result-message');
const resultBtn = document.querySelector('#result-btn');

// 音效
const successSound = document.querySelector('#success-sound');
const failSound = document.querySelector('#fail-sound');

// 狀態
let draggingHandle = null;
let handle1Angle = 180; // 左邊，180度
let handle2Angle = 0;   // 右邊，0度
let targetAngle = 90;   // 目標角度
let fixedHandle = null; // 固定的圓圈

// 初始化
function init() {
  drawTicks();
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

  // 開始按鈕
  startBtn.addEventListener('click', startGame);

  // 檢查答案按鈕
  checkBtn.addEventListener('click', checkAnswer);

  // 結果 Dialog 按鈕
  resultBtn.addEventListener('click', handleResultClose);

  // 輸入欄位驗證
  targetAngleInput.addEventListener('input', validateTargetInput);
}

// 驗證目標角度輸入
function validateTargetInput() {
  let value = parseInt(targetAngleInput.value, 10);

  if (isNaN(value)) {
    return;
  }

  if (value < 0) {
    targetAngleInput.value = 0;
  } else if (value > 180) {
    targetAngleInput.value = 180;
  }
}

// 開始遊戲
function startGame() {
  // 取得目標角度
  let inputValue = parseInt(targetAngleInput.value, 10);

  if (isNaN(inputValue) || inputValue < 0 || inputValue > 180) {
    inputValue = 90;
  }

  // 四捨五入到最近的 10 度
  targetAngle = Math.round(inputValue / SNAP_ANGLE) * SNAP_ANGLE;
  targetAngleDisplay.textContent = targetAngle;

  // 隱藏開始 Dialog
  startOverlay.classList.add('hidden');

  // 隨機選擇一個圓圈固定
  setupHandles();

  // 更新顯示
  updateDisplay();
}

// 設定圓圈（一個固定，一個可拖曳）
function setupHandles() {
  // 重置樣式
  handle1.classList.remove('fixed');
  handle2.classList.remove('fixed');

  // 隨機選擇固定哪個圓圈
  const fixHandle1 = Math.random() < 0.5;

  // 隨機產生固定點的角度（0-180，每 10 度）
  const fixedAngle = Math.floor(Math.random() * 19) * SNAP_ANGLE;

  if (fixHandle1) {
    fixedHandle = handle1;
    handle1Angle = fixedAngle;
    handle1.classList.add('fixed');

    // 可拖曳的圓圈放在對面
    handle2Angle = fixedAngle <= 90 ? 180 : 0;
  } else {
    fixedHandle = handle2;
    handle2Angle = fixedAngle;
    handle2.classList.add('fixed');

    // 可拖曳的圓圈放在對面
    handle1Angle = fixedAngle <= 90 ? 180 : 0;
  }
}

// 開始拖曳
function startDrag(event, handle) {
  // 如果是固定的圓圈，不能拖曳
  if (handle === fixedHandle) {
    return;
  }

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

// 檢查答案
function checkAnswer() {
  const currentAngle = Math.abs(handle1Angle - handle2Angle);

  if (currentAngle === targetAngle) {
    // 答對
    showResultDialog(true, '恭喜答對！', '角度是 ' + targetAngle + ' 度');
    playSound(successSound);
  } else {
    // 答錯
    showResultDialog(false, '答錯了！', '目前角度是 ' + currentAngle + ' 度，請再試一次');
    playSound(failSound);
  }
}

// 顯示結果 Dialog
function showResultDialog(isSuccess, title, message) {
  resultTitle.textContent = title;
  resultMessage.textContent = message;

  resultDialog.classList.remove('success', 'fail');
  resultDialog.classList.add(isSuccess ? 'success' : 'fail');

  resultOverlay.classList.remove('hidden');

  // 設定按鈕文字
  resultBtn.textContent = isSuccess ? '再玩一次' : '關閉';
  resultBtn.dataset.success = isSuccess;
}

// 處理結果 Dialog 關閉
function handleResultClose() {
  const isSuccess = resultBtn.dataset.success === 'true';

  resultOverlay.classList.add('hidden');

  if (isSuccess) {
    // 成功後重新開始，顯示開始 Dialog
    startOverlay.classList.remove('hidden');
  }
  // 失敗就直接關閉，讓使用者再試一次
}

// 播放音效
function playSound(audio) {
  audio.currentTime = 0;
  audio.play().catch(() => {
    // 忽略自動播放限制錯誤
  });
}

// 啟動應用
init();
