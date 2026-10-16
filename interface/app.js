// An example interface: what's on the air now, the last 20 recorded calls
// (click one to play it), and live audio. Replace it with yours.
//
// The recorder serves its API beside this page: /api/client.js is the
// client library, and the API reference is at /api/docs.

import { TrunkClient, LivePlayer, escapeHtml as esc, duration } from "/api/client.js";

const $ = (id) => document.getElementById(id);

// Connects to the recorder that served this page, and reconnects by itself.
const rec = new TrunkClient();
// Plays live audio, one call at a time.
const player = new LivePlayer({ onNowPlaying: () => drawAir() });
let live = false;

// ── Connection ───────────────────────────────────────────────────────────────

function drawState() {
  const s = $("state");
  if (!rec.connected) {
    s.textContent = rec.exited ? "The recorder stopped; waiting for it" : "Connecting…";
    s.dataset.state = "off";
  } else if (rec.phase.phase === "running") {
    s.textContent = "Recording";
    s.dataset.state = "on";
  } else if (rec.phase.phase === "starting" || rec.phase.phase === "stopping") {
    s.textContent = rec.phase.phase === "starting" ? "Starting…" : "Stopping…";
    s.dataset.state = "idle";
  } else {
    s.textContent = rec.phase.error ? `Not recording: ${rec.phase.error}` : "Connected, not recording";
    s.dataset.state = "idle";
  }
}

// ── On the air ───────────────────────────────────────────────────────────────

function drawAir() {
  // The recorder's clock, to say how long each call has been going.
  const now = rec.status?.nowS ?? 0;
  const calls = [...rec.calls].sort((a, b) => b.emergency - a.emergency || a.startS - b.startS);
  $("air").innerHTML = calls.length
    ? calls
        .map((c) => {
          const cls = [c.state, c.emergency ? "emergency" : "", player.nowPlaying?.callId === c.id ? "playing" : ""].join(" ");
          const note = c.emergency ? "Emergency" : c.state === "monitoring" ? (c.encrypted ? "Encrypted" : "Not recorded") : "";
          return `<li class="${cls}">
            <span class="name">${esc(c.alphaTag || `Talkgroup ${c.talkgroup}`)}</span>
            <span class="meta">${esc(c.systemName)} · ${duration(Math.max(0, now - c.startS))}${note ? ` · <b>${esc(note)}</b>` : ""}</span>
          </li>`;
        })
        .join("")
    : `<li class="empty">${rec.phase.phase === "running" ? "Quiet right now." : "Nothing: the recorder isn't recording."}</li>`;
}

// ── Recorded calls ───────────────────────────────────────────────────────────

const audio = $("player");
let playing = null; // the path of the recorded call playing

function drawRecorded() {
  const recent = rec.history.slice(0, 20);
  $("recorded").innerHTML = recent.length
    ? recent
        .map((e) => {
          const r = e.record;
          const time = new Date(r.start_time * 1000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
          // audio: false when the recording wasn't kept.
          const gone = e.audio === false;
          const on = playing === e.path;
          return `<li class="${r.emergency ? "emergency" : ""}">
            <button type="button" class="play" data-path="${esc(e.path)}" ${gone ? "disabled" : ""}
              aria-label="${on ? "Stop" : "Play"}">${on ? "■" : "▶"}</button>
            <span class="name">${esc(r.talkgroup_tag || `Talkgroup ${r.talkgroup}`)}</span>
            <span class="meta">${esc(r.short_name ?? "")} · ${esc(time)} · ${duration(r.call_length)}</span>
          </li>`;
        })
        .join("")
    : `<li class="empty">No calls recorded yet.</li>`;
}

$("recorded").addEventListener("click", (ev) => {
  const button = ev.target.closest("button.play");
  if (!button) return;
  const entry = rec.history.find((e) => e.path === button.dataset.path);
  if (!entry || playing === entry.path) {
    audio.pause();
    playing = null;
  } else {
    audio.src = rec.callUrl(entry); // its .wav; rec.callUrl(entry, "json") for its details
    audio.play().catch(() => {});
    playing = entry.path;
  }
  drawRecorded();
});
audio.addEventListener("ended", () => {
  playing = null;
  drawRecorded();
});

// ── Live audio ───────────────────────────────────────────────────────────────

$("live").addEventListener("click", async () => {
  live = !live;
  if (live) {
    await player.resume(); // browsers only play sound after a click
    rec.listen(); // every call; rec.listen({ talkgroup: 101 }) for one
  } else {
    rec.listen(false);
    player.stop();
  }
  $("live").textContent = live ? "Stop listening" : "Listen live";
  $("live").setAttribute("aria-pressed", String(live));
});
rec.on("audio", (chunk) => {
  if (live) player.play(chunk);
});

// ── Updates ──────────────────────────────────────────────────────────────────

// Status comes several times a second; the recorded list changes only when a call is.
rec.on("change", () => {
  drawState();
  drawAir();
});
rec.on("hello", drawRecorded);
rec.on("concluded", drawRecorded);

drawState();
drawAir();
drawRecorded();
