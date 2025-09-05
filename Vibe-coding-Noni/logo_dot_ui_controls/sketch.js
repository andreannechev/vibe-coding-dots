
let dots = [];
let usecases = [];
let popup;
let simplex;

let rotationY = 0;
let rotationX = 0;
let targetRotationY = 0;
let targetRotationX = 0;

let settings = {
  dotStep: 10,
  dotSides: 4,
  dotSize: 6,
  layerCount: 2,
  layerSpacing: 60,
  zoom: 0.8
};

function preload() {
  usecases = [
    "AI for predictive maintenance",
    "AI-powered customer support",
    "Text-to-image generation",
    "Voice-to-text meeting summarizer",
    "AI in fraud detection",
    "Real-time language translation",
    "Personalized health insights",
    "Emotion detection via webcam"
  ];
}

function setup() {
  createCanvas(windowWidth, windowHeight, WEBGL);
  noStroke();
  setAttributes('depth', false);
  frameRate(30);
  pixelDensity(1);

  popup = select("#popup");
  simplex = new SimplexNoise();
  setupUIListeners();
  loadLogoFromUrl("https://upload.wikimedia.org/wikipedia/commons/thumb/5/51/IBM_logo.svg/1075px-IBM_logo.svg.png");
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  if (typeof lastLoadedUrl === "string") {
    loadLogoFromUrl(lastLoadedUrl);
  }
}

function draw() {
  background(0);
  let t = millis() * 0.0001;

  let centerX = width / 2;
  let centerY = height / 2;
  let offsetX = (mouseX - centerX) / centerX;
  let offsetY = (mouseY - centerY) / centerY;
  targetRotationY = offsetX * 0.4;
  targetRotationX = offsetY * 0.4;

  rotationY = lerp(rotationY, targetRotationY, 0.1);
  rotationX = lerp(rotationX, targetRotationX, 0.1);

  scale(settings.zoom / 100);
  rotateY(rotationY);
  rotateX(rotationX);

  for (let dot of dots) {
    if (frameCount % 2 === 0) {
      dot.offsetX = simplex.noise2D(dot.noiseSeedX, t) * 2.5;
      dot.offsetY = simplex.noise2D(dot.noiseSeedY, t) * 2.5;
      dot.offsetZ = simplex.noise2D(dot.noiseSeedZ, t) * 2.5;
    }

    push();
    translate(dot.x + dot.offsetX, dot.y + dot.offsetY, dot.z + dot.offsetZ);

    let c = dot.color;
    let lightenFactor = (dot.depthLayer % 2 === 0) ? 1 : 1.5;
    fill(
      constrain(red(c) * lightenFactor, 0, 255),
      constrain(green(c) * lightenFactor, 0, 255),
      constrain(blue(c) * lightenFactor, 0, 255),
      255 * dot.opacity
    );
    sphere(dot.size, settings.dotSides, settings.dotSides);
    pop();
  }
}

function mousePressed() {
  for (let dot of dots) {
    const dx = mouseX - width / 2 - dot.x;
    const dy = mouseY - height / 2 - dot.y;
    const dist2 = dx * dx + dy * dy;
    if (dist2 < 100) {
      showPopup(dot.usecase);
      break;
    }
  }
}

function showPopup(text) {
  let popupEl = document.getElementById("popup");
  popupEl.classList.remove("hidden");
  popupEl.style.left = mouseX + 'px';
  popupEl.style.top = mouseY + 'px';
  document.getElementById("popup-text").innerText = text;
}

let lastLoadedUrl = null;

function loadLogoFromUrl(url) {
  lastLoadedUrl = url;
  loadImage(url, img => {
    dots = [];
    img.loadPixels();
    const step = settings.dotStep;
    const maxLogoWidth = windowWidth * 0.8;
    const maxLogoHeight = windowHeight * 0.6;
    const scale = Math.min(maxLogoWidth / img.width, maxLogoHeight / img.height);
    const offsetX = -img.width * scale / 2;
    const offsetY = -img.height * scale / 2;

    let dotCount = 0;
    for (let layer = 0; layer < settings.layerCount; layer++) {
      for (let y = 0; y < img.height; y += step) {
        for (let x = 0; x < img.width; x += step) {
          const i = 4 * (y * img.width + x);
          const r = img.pixels[i];
          const g = img.pixels[i + 1];
          const b = img.pixels[i + 2];
          const a = img.pixels[i + 3];
          if (a > 200 && (r < 250 || g < 250 || b < 250)) {
            let dot = {
              x: random(-width, 2 * width),
              y: random(-height, 2 * height),
              z: random(-300, 300),
              tx: (x * scale) + offsetX,
              ty: (y * scale) + offsetY,
              tz: -layer * settings.layerSpacing,
              size: 0,
              targetSize: settings.dotSize,
              color: color(r, g, b),
              opacity: 0,
              usecase: random(usecases),
              noiseSeedX: random(1000),
              noiseSeedY: random(1000),
              noiseSeedZ: random(1000),
              offsetX: 0,
              offsetY: 0,
              offsetZ: 0,
              depthLayer: dotCount % 2
            };
            dots.push(dot);
            dotCount++;

            gsap.to(dot, {
              duration: 1.2,
              x: dot.tx,
              y: dot.ty,
              z: dot.tz,
              size: dot.targetSize,
              opacity: 1,
              ease: "power3.out",
              delay: Math.random() * 0.3
            });
          }
        }
      }
    }
  }, err => {
    alert("Failed to load image.");
  });
}

function setupUIListeners() {
  const urlInput = document.getElementById("imgUrl");
  const fileInput = document.getElementById("imgFile");
  const loadBtn = document.getElementById("loadBtn");

  loadBtn.addEventListener("click", () => {
    const url = urlInput.value.trim();
    if (url) loadLogoFromUrl(url);
  });

  fileInput.addEventListener("change", e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      loadLogoFromUrl(ev.target.result);
    };
    reader.readAsDataURL(file);
  });

  document.getElementById("dotCount").oninput = e => { settings.dotStep = parseInt(e.target.value); loadLogoFromUrl(lastLoadedUrl); };
  document.getElementById("dotSides").oninput = e => settings.dotSides = parseInt(e.target.value);
  document.getElementById("dotSize").oninput = e => { settings.dotSize = parseInt(e.target.value); loadLogoFromUrl(lastLoadedUrl); };
  document.getElementById("layerCount").oninput = e => { settings.layerCount = parseInt(e.target.value); loadLogoFromUrl(lastLoadedUrl); };
  document.getElementById("layerSpacing").oninput = e => { settings.layerSpacing = parseInt(e.target.value); loadLogoFromUrl(lastLoadedUrl); };
  document.getElementById("zoom").oninput = e => settings.zoom = parseInt(e.target.value);
}
