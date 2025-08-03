/* ── 1. Grab canvas & ctx ───────────────────────────────────────── */
const canvas = document.getElementById("stage");
const ctx    = canvas.getContext("2d");

/* ── 2. Safe resize helper (works with flex or grid) ───────────── */
function resizeCanvas() {
    const width  = canvas.clientWidth;   // current CSS width
    const height = canvas.clientHeight;  // current CSS height
    if (!width || !height) return;       // layout not ready yet

    if (canvas.width !== width || canvas.height !== height) {
        canvas.width  = width;             // bitmap = css-pixels
        canvas.height = height;
        draw();                            // re-paint existing nodes
    }
}

/* Wait one frame so flexbox sidebar has settled */
requestAnimationFrame(resizeCanvas);
window.addEventListener("resize", resizeCanvas);

/* ── list of nodes and number ─────────────────────────────── */
const nodes   = [];
let   counter = 0;

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    nodes.forEach(paintNode);
}

const R = 22;
function paintNode({ x, y, name }) {
    const g = ctx.createRadialGradient(x, y, 6, x, y, R);
    g.addColorStop(0,   "#16233b");
    g.addColorStop(0.7, "#2e4a7f");
    g.addColorStop(1,   "#3e5c96");

    ctx.fillStyle   = g;
    ctx.strokeStyle = "#d8d8d8";
    ctx.lineWidth   = 2;

    ctx.beginPath();
    ctx.arc(x, y, R, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle   = "#fff";
    ctx.font        = '16px "Inter", sans-serif';
    ctx.textAlign   = "center";
    ctx.textBaseline= "middle";
    ctx.fillText(name, x, y + 1);
}

/* waits for a click */
canvas.addEventListener("click", (e) => {

    // get canvas size
    const rect = canvas.getBoundingClientRect();

    // the click position minus the canvas size
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // letters start at 65
    const name = String.fromCharCode(65 + counter);
    counter++;
    // coordinate of click
    nodes.push({ x, y, name });
    draw();
});


