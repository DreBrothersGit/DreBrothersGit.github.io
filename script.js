/* ============================================================
   Cover Flow logic — the whole trick in one idea:

   Every card sits at the center of the stage. render() pushes
   each card into 3D space based on its OFFSET from the card
   that's currently in front:

     offset = cardIndex - currentIndex

     offset  0 -> front and center, flat
     offset +1 -> one step right, pushed back, tilted
     offset -1 -> one step left,  pushed back, tilted

   Three transforms do all the work:
     translateX -> slide left / right
     translateZ -> push back in 3D (needs the CSS perspective)
     rotateY   -> tilt like an album leaning on a shelf
   ============================================================ */

// ---- 1. THE DATA: the crate. -------------------------------
// Adding your next project = adding one object here.
// cover: "" means "not pressed yet" -> shows a blank sleeve.
const projects = [
  {
    title: "Vinyl Vault Recommender",
    tag: "Machine Learning · Recommendation Engine",
    cover: "covers/vinyl-vault.jpg",
    blurb: "A content-based recommendation engine trained on my own vinyl collection, then expanded to 100+ albums. TF-IDF vectors plus cosine similarity, built with scikit-learn.",
    tech: ["Python", "scikit-learn", "Streamlit"],
    demo: "https://vinyl-vault-recommender-nxfwwpchwcskhvyy4ntfum.streamlit.app/",   // live Oct 8, 2026
    code: "https://github.com/DreBrothersGit/vinyl-vault-recommender"
  },
  {
    title: "LessonForge",
    tag: "LLM App · EdTech",
    cover: "covers/lessonforge.jpg",
    blurb: "An AI teaching assistant that drafts lesson plans, quizzes, and plain-language explanations. Streamlit front end, Llama 3.1 8B through the Hugging Face Inference API.",
    tech: ["Python", "Streamlit", "Hugging Face"],
    demo: "https://teaching-assistant-forge.streamlit.app/",   // live Oct 8, 2026
    code: "https://github.com/DreBrothersGit/lesson-forge"    // repo live Oct 8, 2026
  },
  { title: "Side C", tag: "Coming soon", cover: "", teaser: "Still being pressed. Check back soon." },
  { title: "Side D", tag: "Coming soon", cover: "", teaser: "Still being pressed. Check back soon." },
  { title: "Side E", tag: "Coming soon", cover: "", teaser: "Still being pressed. Check back soon." }
];

// ---- 2. BUILD: one card per project ------------------------
const flow = document.getElementById("flow");
const detail = document.getElementById("detail");
let current = 0;            // index of the card in front
let userTookOver = false;   // stops the auto-drift once you touch it

projects.forEach((p, i) => {
  const card = document.createElement("div");
  card.className = "flow-card";
  if (p.cover) {
    card.innerHTML = '<img src="' + p.cover + '" alt="' + p.title + ' cover art">';
  } else {
    card.innerHTML = '<div class="sleeve"><span class="side">' + p.title +
                     '</span><em>coming soon</em></div>';
  }
  // Click a side card -> it swings to the front.
  // Click the front card -> opens its live demo (if it has one).
  card.addEventListener("click", () => {
    userTookOver = true;
    if (i === current && p.demo) {
      window.open(p.demo, "_blank");
    } else {
      current = i;
      render();
    }
  });
  flow.appendChild(card);
});

// ---- 3. THE 3D MATH: place every card from its offset ------
function render() {
  const spacing = window.innerWidth < 640 ? 130 : 210;  // tighter on phones
  const cards = flow.children;
  for (let i = 0; i < cards.length; i++) {
    const offset = i - current;
    const x = offset * spacing;            // slide left / right
    const z = -Math.abs(offset) * 170;     // sidelines sink back
    const tilt = offset * 42;              // lean toward the viewer
    cards[i].style.transform =
      "translateX(" + x + "px)" +
      " translateZ(" + z + "px)" +
      " rotateY(" + tilt + "deg)";
    cards[i].style.zIndex = 100 - Math.abs(offset);   // front card on top
    const tooFar = Math.abs(offset) > 2;
    cards[i].style.opacity = tooFar ? "0" : String(1 - Math.abs(offset) * 0.25);
    cards[i].style.pointerEvents = tooFar ? "none" : "auto";
  }
  showDetail(projects[current]);
}

// ---- 4. THE WRITE-UP under the flow ------------------------
function showDetail(p) {
  let html = '<p class="tag">' + p.tag + "</p>";
  html += "<h3>" + p.title + "</h3>";
  html += "<p>" + (p.blurb || p.teaser) + "</p>";
  if (p.tech) {
    html += '<div class="chips">' +
            p.tech.map(t => "<span>" + t + "</span>").join("") +
            "</div>";
  }
  const links = [];
  if (p.demo) links.push('<a class="btn btn-primary" href="' + p.demo +
                         '" target="_blank" rel="noopener">Live demo</a>');
  if (p.code) links.push('<a class="btn" href="' + p.code +
                         '" target="_blank" rel="noopener">Code</a>');
  if (links.length) html += '<div class="actions">' + links.join("") + "</div>";
  detail.innerHTML = html;
}

// ---- 5. CONTROLS: buttons, arrow keys, swipe ---------------
function go(dir) {
  userTookOver = true;
  // clamp so you can't scroll past either end of the crate
  current = Math.min(Math.max(current + dir, 0), projects.length - 1);
  render();
}
document.getElementById("prevBtn").addEventListener("click", () => go(-1));
document.getElementById("nextBtn").addEventListener("click", () => go(1));

document.addEventListener("keydown", (e) => {
  if (e.key === "ArrowLeft") go(-1);
  if (e.key === "ArrowRight") go(1);
});

// Basic swipe: remember where the finger landed, compare on lift
let touchX = null;
flow.addEventListener("touchstart", (e) => {
  touchX = e.touches[0].clientX;
}, { passive: true });
flow.addEventListener("touchend", (e) => {
  if (touchX === null) return;
  const dx = e.changedTouches[0].clientX - touchX;
  if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
  touchX = null;
}, { passive: true });

// ---- 6. AUTO-DRIFT: slowly flips until the visitor touches it
const drift = setInterval(() => {
  if (userTookOver) { clearInterval(drift); return; }
  current = (current + 1) % projects.length;
  render();
}, 3500);

window.addEventListener("resize", render);  // re-space on rotate/resize
render();   // first paint
