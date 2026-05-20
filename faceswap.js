const FACE_CASES = {
  face1: {
    name: "人物 A",
    source: "assets/faces/face1_source.png",
    target: "assets/faces/face1_target.png",
  },
  face2: {
    name: "人物 B",
    source: "assets/faces/face2_source.png",
    target: "assets/faces/face2_target.png",
  },
  face3: {
    name: "人物 C",
    source: "assets/faces/face3_source.png",
    target: "assets/faces/face3_target.png",
  },
  face4: {
    name: "人物 D",
    source: "assets/faces/face4_source.png",
    target: "assets/faces/face4_target.png",
  },
};

const FACE_API_SCRIPTS = [
  "https://unpkg.com/face-api.js@0.22.2/dist/face-api.min.js",
  "https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@master/dist/face-api.min.js",
];

const MODEL_URLS = [
  "https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@master/weights",
  "https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights",
];

const DISPLAY_MAX = 360;
const DETECTOR_OPTIONS = () => new faceapi.TinyFaceDetectorOptions({
  inputSize: 224,
  scoreThreshold: 0.32,
});

const els = {
  status: document.getElementById("status"),
  pairSelect: document.getElementById("pairSelect"),
  sourceCanvas: document.getElementById("sourceCanvas"),
  targetCanvas: document.getElementById("targetCanvas"),
  resultCanvas: document.getElementById("resultCanvas"),
  directCanvas: document.getElementById("directCanvas"),
  poissonCanvas: document.getElementById("poissonCanvas"),
  sourceMeta: document.getElementById("sourceMeta"),
  targetMeta: document.getElementById("targetMeta"),
  resultMeta: document.getElementById("resultMeta"),
  sourceUpload: document.getElementById("sourceUpload"),
  targetUpload: document.getElementById("targetUpload"),
  sourceUploadBtn: document.getElementById("sourceUploadBtn"),
  targetUploadBtn: document.getElementById("targetUploadBtn"),
  detectBtn: document.getElementById("detectBtn"),
  blendBtn: document.getElementById("blendBtn"),
  saveBtn: document.getElementById("saveBtn"),
  swapBtn: document.getElementById("swapBtn"),
  landmarksBtn: document.getElementById("landmarksBtn"),
  blendSlider: document.getElementById("blendSlider"),
  blendValue: document.getElementById("blendValue"),
};

const state = {
  sourceImage: null,
  targetImage: null,
  sourceDetection: null,
  targetDetection: null,
  resultImageData: null,
  showLandmarks: true,
  blendRatio: 0.9,
  scriptLoaded: false,
  modelsLoaded: false,
  loadingModels: false,
};

init();

function init() {
  setReportLink();
  bindEvents();
  clearCanvas(els.sourceCanvas, "source");
  clearCanvas(els.targetCanvas, "target");
  clearCanvas(els.resultCanvas, "result");
  clearCanvas(els.directCanvas, "direct");
  clearCanvas(els.poissonCanvas, "poisson");
  loadPair(els.pairSelect.value);
}

function setReportLink() {
  const reportLink = document.getElementById("reportLink");
  if (!reportLink) {
    return;
  }
  reportLink.href = location.pathname.includes("/web/")
    ? "../report/option3_report.pdf"
    : "report/option3_report.pdf";
}

function bindEvents() {
  els.pairSelect.addEventListener("change", () => loadPair(els.pairSelect.value));
  els.detectBtn.addEventListener("click", detectCurrentFaces);
  els.blendBtn.addEventListener("click", blendCurrentFaces);
  els.saveBtn.addEventListener("click", saveResult);
  els.sourceUploadBtn.addEventListener("click", () => els.sourceUpload.click());
  els.targetUploadBtn.addEventListener("click", () => els.targetUpload.click());
  els.sourceUpload.addEventListener("change", () => loadUploadedImage("source"));
  els.targetUpload.addEventListener("change", () => loadUploadedImage("target"));
  els.swapBtn.addEventListener("click", swapImages);
  els.landmarksBtn.addEventListener("click", () => {
    state.showLandmarks = !state.showLandmarks;
    els.landmarksBtn.textContent = state.showLandmarks ? "隐藏检测点" : "显示检测点";
    redrawDetectedCanvases();
  });
  els.blendSlider.addEventListener("input", () => {
    state.blendRatio = Number(els.blendSlider.value) / 100;
    els.blendValue.textContent = `${els.blendSlider.value}%`;
    if (state.resultImageData) {
      blendCurrentFaces();
    }
  });
}

async function loadPair(id) {
  const item = FACE_CASES[id] || FACE_CASES.face1;
  setStatus(`正在加载 ${item.name}...`, "busy");
  try {
    const [source, target] = await Promise.all([loadImage(item.source), loadImage(item.target)]);
    state.sourceImage = source;
    state.targetImage = target;
    resetFaceState();
    drawImageToCanvas(els.sourceCanvas, source);
    drawImageToCanvas(els.targetCanvas, target);
    clearCanvas(els.resultCanvas, "result");
    clearCanvas(els.directCanvas, "direct");
    clearCanvas(els.poissonCanvas, "poisson");
    els.sourceMeta.textContent = `${item.name} source · ${source.naturalWidth} x ${source.naturalHeight}`;
    els.targetMeta.textContent = `${item.name} target · ${target.naturalWidth} x ${target.naturalHeight}`;
    els.resultMeta.textContent = "";
    setStatus("图片已加载，可以检测人脸。", "ready");
  } catch (error) {
    setStatus(`图片加载失败：${error.message}`, "error");
  }
}

async function loadUploadedImage(kind) {
  const input = kind === "source" ? els.sourceUpload : els.targetUpload;
  const file = input.files && input.files[0];
  if (!file) {
    return;
  }
  const url = URL.createObjectURL(file);
  try {
    const image = await loadImage(url);
    if (kind === "source") {
      state.sourceImage = image;
      state.sourceDetection = null;
      drawImageToCanvas(els.sourceCanvas, image);
      els.sourceMeta.textContent = `${file.name} · ${image.naturalWidth} x ${image.naturalHeight}`;
    } else {
      state.targetImage = image;
      state.targetDetection = null;
      drawImageToCanvas(els.targetCanvas, image);
      els.targetMeta.textContent = `${file.name} · ${image.naturalWidth} x ${image.naturalHeight}`;
    }
    state.resultImageData = null;
    els.blendBtn.disabled = true;
    els.saveBtn.disabled = true;
    clearCanvas(els.resultCanvas, "result");
    clearCanvas(els.directCanvas, "direct");
    clearCanvas(els.poissonCanvas, "poisson");
    setStatus("图片已更新，请重新检测人脸。", "ready");
  } catch (error) {
    setStatus(`上传图片读取失败：${error.message}`, "error");
  } finally {
    URL.revokeObjectURL(url);
    input.value = "";
  }
}

function swapImages() {
  const sourceImage = state.sourceImage;
  const sourceDetection = state.sourceDetection;
  const sourceMeta = els.sourceMeta.textContent;
  state.sourceImage = state.targetImage;
  state.sourceDetection = state.targetDetection;
  state.targetImage = sourceImage;
  state.targetDetection = sourceDetection;
  els.sourceMeta.textContent = els.targetMeta.textContent;
  els.targetMeta.textContent = sourceMeta;
  state.resultImageData = null;
  redrawDetectedCanvases();
  clearCanvas(els.resultCanvas, "result");
  clearCanvas(els.directCanvas, "direct");
  clearCanvas(els.poissonCanvas, "poisson");
  els.blendBtn.disabled = !(state.sourceDetection && state.targetDetection);
  els.saveBtn.disabled = true;
  setStatus(state.sourceDetection && state.targetDetection ? "已交换，可以对齐融合。" : "已交换，请重新检测人脸。", "ready");
}

async function detectCurrentFaces() {
  if (!state.sourceImage || !state.targetImage) {
    setStatus("请先加载源图和目标图。", "error");
    return;
  }
  setStatus("正在加载 face-api.js 与检测模型...", "busy");
  els.detectBtn.disabled = true;
  els.blendBtn.disabled = true;
  try {
    await loadModels();
    setStatus("正在检测人脸...", "busy");
    const [sourceDetection, targetDetection] = await Promise.all([
      detectSingleFace(state.sourceImage),
      detectSingleFace(state.targetImage),
    ]);
    if (!sourceDetection) {
      throw new Error("源图中未检测到人脸。");
    }
    if (!targetDetection) {
      throw new Error("目标图中未检测到人脸。");
    }
    state.sourceDetection = sourceDetection;
    state.targetDetection = targetDetection;
    redrawDetectedCanvases();
    els.sourceMeta.textContent = detectionText("源图", sourceDetection);
    els.targetMeta.textContent = detectionText("目标图", targetDetection);
    els.blendBtn.disabled = false;
    setStatus("检测完成，可以对齐融合。", "success");
  } catch (error) {
    setStatus(error.message, "error");
  } finally {
    els.detectBtn.disabled = false;
  }
}

async function blendCurrentFaces() {
  if (!state.sourceDetection || !state.targetDetection) {
    setStatus("请先检测两张图片中的人脸。", "error");
    return;
  }
  setStatus("正在对齐与融合...", "busy");
  els.blendBtn.disabled = true;
  try {
    const targetSize = drawImageToCanvas(els.resultCanvas, state.targetImage);
    const targetImageData = getCanvasData(els.resultCanvas);
    const alignedCanvas = alignSourceToTarget(targetSize);
    const alignedData = getCanvasData(alignedCanvas);
    normalizeTransparentPixels(alignedData, targetImageData);
    const mask = createTargetFaceMask(targetSize);
    const direct = directBlend(targetImageData, alignedData, mask);
    const poisson = poissonBlend(targetImageData, alignedData, mask);
    putCanvasData(els.directCanvas, direct);
    putCanvasData(els.poissonCanvas, poisson);
    putCanvasData(els.resultCanvas, poisson);
    state.resultImageData = poisson;
    els.resultMeta.textContent = `${targetSize.width} x ${targetSize.height} · blend ${Math.round(state.blendRatio * 100)}%`;
    els.saveBtn.disabled = false;
    setStatus("融合完成。", "success");
  } catch (error) {
    setStatus(`融合失败：${error.message}`, "error");
  } finally {
    els.blendBtn.disabled = false;
  }
}

function alignSourceToTarget(targetSize) {
  const canvas = document.createElement("canvas");
  canvas.width = targetSize.width;
  canvas.height = targetSize.height;
  const context = canvas.getContext("2d");
  const sourceEye = getEyeInfo(state.sourceDetection.landmarks);
  const targetEye = getEyeInfo(state.targetDetection.landmarks, targetSize.width / state.targetImage.naturalWidth);
  const scale = targetEye.distance / sourceEye.distance;
  const angle = targetEye.angle - sourceEye.angle;
  context.save();
  context.translate(targetEye.center.x, targetEye.center.y);
  context.rotate(angle);
  context.scale(scale, scale);
  context.translate(-sourceEye.center.x, -sourceEye.center.y);
  context.drawImage(state.sourceImage, 0, 0);
  context.restore();
  return canvas;
}

function directBlend(targetImageData, sourceImageData, mask) {
  const output = cloneImageData(targetImageData);
  for (let i = 0; i < mask.alpha.length; i += 1) {
    const alpha = mask.alpha[i] * state.blendRatio;
    if (alpha <= 0) {
      continue;
    }
    const p = i * 4;
    for (let c = 0; c < 3; c += 1) {
      output.data[p + c] = sourceImageData.data[p + c] * alpha + targetImageData.data[p + c] * (1 - alpha);
    }
  }
  return output;
}

function poissonBlend(targetImageData, sourceImageData, mask) {
  const width = targetImageData.width;
  const height = targetImageData.height;
  const hardMask = mask.hard;
  const softAlpha = mask.alpha;
  const result = cloneImageData(targetImageData);
  const work = result.data;
  const source = sourceImageData.data;
  const target = targetImageData.data;
  const { minX, minY, maxX, maxY } = mask.bbox;

  for (let i = 0; i < hardMask.length; i += 1) {
    if (hardMask[i]) {
      const p = i * 4;
      work[p] = source[p];
      work[p + 1] = source[p + 1];
      work[p + 2] = source[p + 2];
      work[p + 3] = 255;
    }
  }

  const omega = 1.82;
  const iterations = 120;
  for (let iteration = 0; iteration < iterations; iteration += 1) {
    for (let y = Math.max(1, minY); y <= Math.min(height - 2, maxY); y += 1) {
      for (let x = Math.max(1, minX); x <= Math.min(width - 2, maxX); x += 1) {
        const index = y * width + x;
        if (!hardMask[index]) {
          continue;
        }
        const p = index * 4;
        const neighbors = [index - 1, index + 1, index - width, index + width];
        for (let c = 0; c < 3; c += 1) {
          let boundarySum = 0;
          let sourceNeighborSum = 0;
          for (const neighbor of neighbors) {
            sourceNeighborSum += source[neighbor * 4 + c];
            boundarySum += hardMask[neighbor] ? work[neighbor * 4 + c] : target[neighbor * 4 + c];
          }
          const guidance = 4 * source[p + c] - sourceNeighborSum;
          const next = (boundarySum + guidance) / 4;
          work[p + c] = clampByte(work[p + c] + omega * (next - work[p + c]));
        }
      }
    }
  }

  const output = cloneImageData(targetImageData);
  for (let i = 0; i < softAlpha.length; i += 1) {
    const alpha = softAlpha[i] * state.blendRatio;
    if (alpha <= 0) {
      continue;
    }
    const p = i * 4;
    for (let c = 0; c < 3; c += 1) {
      output.data[p + c] = clampByte(work[p + c] * alpha + target[p + c] * (1 - alpha));
    }
  }
  return output;
}

function createTargetFaceMask(size) {
  const scale = size.width / state.targetImage.naturalWidth;
  const box = state.targetDetection.detection.box;
  const centerX = (box.x + box.width / 2) * scale;
  const centerY = (box.y + box.height * 0.53) * scale;
  const radiusX = Math.max(18, box.width * 0.62 * scale);
  const radiusY = Math.max(24, box.height * 0.78 * scale);
  const alpha = new Float32Array(size.width * size.height);
  const hard = new Uint8Array(size.width * size.height);
  const bbox = {
    minX: size.width,
    minY: size.height,
    maxX: 0,
    maxY: 0,
  };

  for (let y = 0; y < size.height; y += 1) {
    for (let x = 0; x < size.width; x += 1) {
      const dx = (x - centerX) / radiusX;
      const dy = (y - centerY) / radiusY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance <= 1.14) {
        const index = y * size.width + x;
        const edge = smoothstep(1.14, 0.82, distance);
        alpha[index] = edge;
        if (distance <= 0.96) {
          hard[index] = 1;
          bbox.minX = Math.min(bbox.minX, x);
          bbox.minY = Math.min(bbox.minY, y);
          bbox.maxX = Math.max(bbox.maxX, x);
          bbox.maxY = Math.max(bbox.maxY, y);
        }
      }
    }
  }

  if (bbox.minX > bbox.maxX) {
    bbox.minX = bbox.minY = bbox.maxX = bbox.maxY = 0;
  }

  return { alpha, hard, bbox };
}

async function loadModels() {
  if (state.modelsLoaded) {
    return;
  }
  if (state.loadingModels) {
    await waitForModels();
    return;
  }
  state.loadingModels = true;
  try {
    await ensureFaceApi();
    let lastError = null;
    for (const modelUrl of MODEL_URLS) {
      try {
        await faceapi.nets.tinyFaceDetector.loadFromUri(modelUrl);
        await faceapi.nets.faceLandmark68TinyNet.loadFromUri(modelUrl);
        state.modelsLoaded = true;
        return;
      } catch (error) {
        lastError = error;
      }
    }
    throw lastError || new Error("检测模型加载失败。");
  } finally {
    state.loadingModels = false;
  }
}

function waitForModels() {
  return new Promise((resolve, reject) => {
    const start = performance.now();
    const timer = setInterval(() => {
      if (state.modelsLoaded) {
        clearInterval(timer);
        resolve();
      } else if (!state.loadingModels || performance.now() - start > 15000) {
        clearInterval(timer);
        reject(new Error("检测模型加载超时。"));
      }
    }, 120);
  });
}

async function ensureFaceApi() {
  if (window.faceapi) {
    return;
  }
  let lastError = null;
  for (const src of FACE_API_SCRIPTS) {
    try {
      await loadScript(src);
      if (window.faceapi) {
        state.scriptLoaded = true;
        return;
      }
      lastError = new Error(`${src} 没有暴露 faceapi。`);
    } catch (error) {
      lastError = error;
    }
  }
  throw new Error(`face-api.js 未加载成功：${lastError ? lastError.message : "unknown error"}`);
}

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[data-face-api][src="${src}"]`);
    if (existing) {
      existing.addEventListener("load", resolve, { once: true });
      existing.addEventListener("error", reject, { once: true });
      return;
    }
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.dataset.faceApi = "true";
    script.onload = resolve;
    script.onerror = () => reject(new Error(`无法加载 ${src}`));
    document.head.append(script);
  });
}

async function detectSingleFace(image) {
  return faceapi.detectSingleFace(image, DETECTOR_OPTIONS()).withFaceLandmarks(true);
}

function redrawDetectedCanvases() {
  drawImageToCanvas(els.sourceCanvas, state.sourceImage, state.sourceDetection);
  drawImageToCanvas(els.targetCanvas, state.targetImage, state.targetDetection);
}

function drawImageToCanvas(canvas, image, detection = null) {
  const scale = Math.min(DISPLAY_MAX / image.naturalWidth, DISPLAY_MAX / image.naturalHeight, 3);
  const width = Math.max(1, Math.round(image.naturalWidth * scale));
  const height = Math.max(1, Math.round(image.naturalHeight * scale));
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  context.clearRect(0, 0, width, height);
  context.drawImage(image, 0, 0, width, height);
  if (detection && state.showLandmarks) {
    drawDetection(context, detection, scale);
  }
  return { width, height, scale };
}

function drawDetection(context, detection, scale) {
  const box = detection.detection.box;
  context.save();
  context.strokeStyle = "#00a66d";
  context.lineWidth = 2;
  context.strokeRect(box.x * scale, box.y * scale, box.width * scale, box.height * scale);
  context.fillStyle = "#ff6f59";
  for (const point of detection.landmarks.positions) {
    context.beginPath();
    context.arc(point.x * scale, point.y * scale, 2.2, 0, Math.PI * 2);
    context.fill();
  }
  context.restore();
}

function getEyeInfo(landmarks, scale = 1) {
  const leftEye = landmarks.getLeftEye();
  const rightEye = landmarks.getRightEye();
  const left = averagePoint(leftEye, scale);
  const right = averagePoint(rightEye, scale);
  const center = {
    x: (left.x + right.x) / 2,
    y: (left.y + right.y) / 2,
  };
  const angle = Math.atan2(right.y - left.y, right.x - left.x);
  const distance = Math.hypot(right.x - left.x, right.y - left.y);
  return { left, right, center, angle, distance };
}

function averagePoint(points, scale = 1) {
  return {
    x: points.reduce((sum, point) => sum + point.x, 0) / points.length * scale,
    y: points.reduce((sum, point) => sum + point.y, 0) / points.length * scale,
  };
}

function normalizeTransparentPixels(sourceImageData, targetImageData) {
  for (let p = 0; p < sourceImageData.data.length; p += 4) {
    if (sourceImageData.data[p + 3] < 8) {
      sourceImageData.data[p] = targetImageData.data[p];
      sourceImageData.data[p + 1] = targetImageData.data[p + 1];
      sourceImageData.data[p + 2] = targetImageData.data[p + 2];
      sourceImageData.data[p + 3] = 255;
    }
  }
}

function getCanvasData(canvas) {
  return canvas.getContext("2d").getImageData(0, 0, canvas.width, canvas.height);
}

function putCanvasData(canvas, imageData) {
  canvas.width = imageData.width;
  canvas.height = imageData.height;
  canvas.getContext("2d").putImageData(imageData, 0, 0);
}

function cloneImageData(imageData) {
  return new ImageData(new Uint8ClampedArray(imageData.data), imageData.width, imageData.height);
}

function clearCanvas(canvas, label) {
  const context = canvas.getContext("2d");
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "#edf3ea";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "rgba(16, 21, 15, 0.42)";
  context.font = "700 14px Inter, sans-serif";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(label, canvas.width / 2, canvas.height / 2);
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Cannot load ${src}`));
    image.src = src;
  });
}

function saveResult() {
  if (!state.resultImageData) {
    return;
  }
  const link = document.createElement("a");
  link.download = `face_poisson_${Date.now()}.png`;
  link.href = els.resultCanvas.toDataURL("image/png");
  link.click();
}

function detectionText(label, detection) {
  const box = detection.detection.box;
  return `${label}: ${Math.round(box.width)} x ${Math.round(box.height)} · score ${detection.detection.score.toFixed(2)}`;
}

function resetFaceState() {
  state.sourceDetection = null;
  state.targetDetection = null;
  state.resultImageData = null;
  els.blendBtn.disabled = true;
  els.saveBtn.disabled = true;
}

function setStatus(message, type = "") {
  els.status.textContent = message;
  els.status.className = `status ${type}`.trim();
}

function smoothstep(edge0, edge1, value) {
  const t = Math.max(0, Math.min(1, (value - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

function clampByte(value) {
  return Math.max(0, Math.min(255, Math.round(value)));
}
