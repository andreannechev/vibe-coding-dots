let dots = [];
let usecases = [];
let usecaseMap = new Map();
let popup;
let simplex;

let rotationY = 0;
let rotationX = 0;
let targetRotationY = 0;
let targetRotationX = 0;

class UseCase {
  constructor(id, title, description, tags, cluster) {
    this.id = id;
    this.title = title;
    this.description = description;
    this.tags = tags;
    this.cluster = cluster;
  }
}

function preload() {
  loadJSON("usecases.json", data => {
    for (let item of data) {
      let uc = new UseCase(item.id, item.title, item.description, item.tags, item.cluster);
      usecases.push(uc);
      usecaseMap.set(item.id, uc);
    }
  });
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

  rotateY(rotationY);
  rotateX(rotationX);

  
  // Draw lines to related dots
  if (hoveredDot) {
    for (let other of dots) {
      if (other !== hoveredDot && areRelated(hoveredDot, other)) {
        stroke(255, 120);
        strokeWeight(1);
        line(
          hoveredDot.x + hoveredDot.offsetX,
          hoveredDot.y + hoveredDot.offsetY,
          hoveredDot.z + hoveredDot.offsetZ,
          other.x + other.offsetX,
          other.y + other.offsetY,
          other.z + other.offsetZ
        );
      }
    }
    noStroke();
  }
for (let dot of dots) {
    if (frameCount % 2 === 0) {
      dot.offsetX = simplex.noise2D(dot.noiseSeedX, t) * 2.5;
      dot.offsetY = simplex.noise2D(dot.noiseSeedY, t) * 2.5;
      dot.offsetZ = simplex.noise2D(dot.noiseSeedZ, t) * 2.5;
    }

    push();
    translate(dot.x + dot.offsetX, dot.y + dot.offsetY, dot.z + dot.offsetZ);

    let c = dot.color;
    let baseAlpha = 255 * dot.opacity;
    let lightenFactor = (dot.depthLayer % 2 === 0) ? 1 : 1.5;
    let r = constrain(red(c) * lightenFactor, 0, 255);
    let g = constrain(green(c) * lightenFactor, 0, 255);
    let b = constrain(blue(c) * lightenFactor, 0, 255);

    fill(r, g, b, baseAlpha);
    sphere(dot.size, 4, 4);
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

function showPopup(usecase) {
  let popupEl = document.getElementById("popup");
  popupEl.classList.remove("hidden");
  popupEl.style.left = mouseX + 'px';
  popupEl.style.top = mouseY + 'px';
  document.getElementById("popup-text").innerHTML = "<b>" + usecase.title + "</b><br><small>" + usecase.description + "</small>";
}

let lastLoadedUrl = null;

function loadLogoFromUrl(url) {
  lastLoadedUrl = url;
  loadImage(url, img => {
    dots = [];
    img.loadPixels();
    const step = Math.max(10, Math.floor(min(windowWidth, windowHeight) / 90));
    const maxLogoWidth = windowWidth * 0.8;
    const maxLogoHeight = windowHeight * 0.6;
    const scale = Math.min(maxLogoWidth / img.width, maxLogoHeight / img.height);
    const offsetX = -img.width * scale / 2;
    const offsetY = -img.height * scale / 2;

    let dotCount = 0;
    for (let y = 0; y < img.height; y += step) {
      for (let x = 0; x < img.width; x += step) {
        const i = 4 * (y * img.width + x);
        const r = img.pixels[i];
        const g = img.pixels[i + 1];
        const b = img.pixels[i + 2];
        const a = img.pixels[i + 3];
        if (a > 200 && (r < 250 || g < 250 || b < 250)) {
          let usecase = usecases[dotCount % usecases.length];
          let dot = {
            x: random(-width, 2 * width),
            y: random(-height, 2 * height),
            z: random(-300, 300),
            tx: (x * scale) + offsetX,
            ty: (y * scale) + offsetY,
            tz: 0,
            size: 0,
            targetSize: step * 0.65,
            color: color(r, g, b),
            opacity: 0,
            usecase: usecase,
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
}

// POPUP CLOSE LOGIC
window.addEventListener("DOMContentLoaded", () => {
  const popupEl = document.getElementById("popup");
  const popupCloseBtn = document.getElementById("popup-close");

  if (popupCloseBtn && popupEl) {
    popupCloseBtn.addEventListener("click", () => {
      popupEl.classList.add("hidden");
    });

    document.addEventListener("click", (e) => {
      if (!popupEl.contains(e.target) && !e.target.closest("canvas")) {
        popupEl.classList.add("hidden");
      }
    });
  }
});


function areRelated(dotA, dotB) {
  const tagsA = new Set(dotA.usecase.tags);
  return dotB.usecase.tags.some(tag => tagsA.has(tag));
}

let hoveredDot = null;

function mouseMoved() {
  hoveredDot = null;
  for (let dot of dots) {
    const dx = mouseX - width / 2 - dot.x;
    const dy = mouseY - height / 2 - dot.y;
    const dist2 = dx * dx + dy * dy;
    if (dist2 < 100) {
      hoveredDot = dot;
      break;
    }
  }
}

// Step 4: Semantic Cluster Explosion
let exploded = false;
let anchorDot = null;

function mousePressed() {
  let found = false;
  for (let dot of dots) {
    const dx = mouseX - width / 2 - dot.x;
    const dy = mouseY - height / 2 - dot.y;
    const dist2 = dx * dx + dy * dy;
    if (dist2 < 100) {
      showPopup(dot.usecase);
      anchorDot = dot;
      exploded = true;
      animateExplosion(dot);
      found = true;
      break;
    }
  }

  if (!found && exploded) {
    resetToOriginalFormation();
  }
}

function animateExplosion(centerDot) {
  const baseTags = new Set(centerDot.usecase.tags);
  for (let dot of dots) {
    if (dot === centerDot) continue;

    let shared = dot.usecase.tags.some(tag => baseTags.has(tag));
    if (shared) {
      let angle = random(TWO_PI);
      let radius = 150 + random(50);
      let height = random(-50, 50);
      let tx = centerDot.tx + cos(angle) * radius;
      let ty = centerDot.ty + sin(angle) * radius;
      let tz = centerDot.tz + height;

      gsap.to(dot, {
        duration: 1.2,
        x: tx,
        y: ty,
        z: tz,
        ease: "expo.out"
      });
    } else {
      // unrelated dots fade and hold
      gsap.to(dot, {
        duration: 1,
        opacity: 0.1,
        ease: "power2.inOut"
      });
    }
  }
}

function resetToOriginalFormation() {
  exploded = false;
  anchorDot = null;
  for (let dot of dots) {
    gsap.to(dot, {
      duration: 1.4,
      x: dot.tx,
      y: dot.ty,
      z: dot.tz,
      opacity: 1,
      ease: "expo.out"
    });
  }
}