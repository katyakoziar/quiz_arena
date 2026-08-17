(() => {
  // src_app.jsx
  var { useState, useEffect, useRef, useCallback } = React;
  var socket = io();
  var INK = "#0F0A26";
  var INK_2 = "#1C1140";
  var CARD = "#FFFFFF";
  var ACCENT = "#FFC53D";
  var OPTS = [
    { key: "A", shape: "triangle", bg: "#E8412C" },
    { key: "B", shape: "diamond", bg: "#1368CE" },
    { key: "C", shape: "circle", bg: "#D89E00" },
    { key: "D", shape: "square", bg: "#7B2FF7" }
  ];
  function newQuestion() {
    return { text: "", options: ["", "", "", ""], correct: 0, duration: 20 };
  }
  function ShapeIcon({ shape, color = "#fff", size = 22 }) {
    if (shape === "circle")
      return /* @__PURE__ */ React.createElement("div", { style: { width: size, height: size, borderRadius: "50%", background: color, flexShrink: 0 } });
    if (shape === "square")
      return /* @__PURE__ */ React.createElement("div", { style: { width: size, height: size, borderRadius: 6, background: color, flexShrink: 0 } });
    if (shape === "diamond")
      return /* @__PURE__ */ React.createElement("div", { style: { width: size * 0.78, height: size * 0.78, background: color, transform: "rotate(45deg)", borderRadius: 3, flexShrink: 0 } });
    return /* @__PURE__ */ React.createElement("div", { style: { width: 0, height: 0, borderLeft: `${size / 2}px solid transparent`, borderRight: `${size / 2}px solid transparent`, borderBottom: `${size}px solid ${color}`, flexShrink: 0 } });
  }
  function MarqueePin({ pin }) {
    const dots = Array.from({ length: 24 });
    return /* @__PURE__ */ React.createElement("div", { style: { position: "relative", display: "inline-block", padding: "34px 46px" } }, /* @__PURE__ */ React.createElement("div", { style: { position: "absolute", inset: 0, borderRadius: 22, background: "linear-gradient(135deg,#2a1a55,#160b34)", boxShadow: "0 18px 40px rgba(0,0,0,0.45)" } }), dots.map((_, i) => {
      const angle = i / dots.length * 360;
      const rad = angle * Math.PI / 180;
      return /* @__PURE__ */ React.createElement("div", { key: i, style: { position: "absolute", left: `calc(50% + ${Math.cos(rad) * 50}%)`, top: `calc(50% + ${Math.sin(rad) * 50}%)`, width: 7, height: 7, borderRadius: "50%", background: ACCENT, transform: "translate(-50%,-50%)", animation: `pinPulse 1.6s ease-in-out ${i % 6 * 0.12}s infinite` } });
    }), /* @__PURE__ */ React.createElement("div", { style: { position: "relative", fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: 52, letterSpacing: 8, color: "#fff", textShadow: "0 0 24px rgba(255,197,61,0.35)" } }, pin));
  }
  function Podium({ top3 }) {
    const order = [1, 0, 2];
    const heights = [128, 168, 100];
    const medalColor = ["#C7CDD6", "#FFC53D", "#E39A5E"];
    return /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "flex-end", justifyContent: "center", gap: 14, marginTop: 8 } }, order.map((idx, i) => {
      const p = top3[idx];
      if (!p) return /* @__PURE__ */ React.createElement("div", { key: i, style: { width: 110 } });
      return /* @__PURE__ */ React.createElement("div", { key: p.id, style: { display: "flex", flexDirection: "column", alignItems: "center", width: 110 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: idx === 0 ? 26 : 20, marginBottom: 4 } }, idx === 0 ? "\u{1F451}" : "\u{1F396}\uFE0F"), /* @__PURE__ */ React.createElement("div", { style: { fontFamily: "'Baloo 2', sans-serif", fontWeight: 700, color: "#fff", fontSize: 14, marginBottom: 4, textAlign: "center", maxWidth: 105, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" } }, p.name), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, color: "#FFC53D", fontWeight: 700, marginBottom: 8 } }, p.score, " \u0431."), /* @__PURE__ */ React.createElement("div", { style: { width: "100%", height: heights[i], borderRadius: "14px 14px 0 0", background: `linear-gradient(180deg, ${medalColor[idx]}, ${medalColor[idx]}99)`, display: "flex", alignItems: "flex-start", justifyContent: "center", paddingTop: 10, fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: 24, color: "#1C1140" } }, idx + 1));
    }));
  }
  function TimerRing({ fraction, seconds }) {
    const deg = Math.max(0, Math.min(1, fraction)) * 360;
    const color = fraction < 0.2 ? "#E8412C" : ACCENT;
    return /* @__PURE__ */ React.createElement("div", { style: { width: 84, height: 84, borderRadius: "50%", background: `conic-gradient(${color} ${deg}deg, rgba(255,255,255,0.12) ${deg}deg)`, display: "flex", alignItems: "center", justifyContent: "center", transition: "background 0.15s linear", flexShrink: 0 } }, /* @__PURE__ */ React.createElement("div", { style: { width: 68, height: 68, borderRadius: "50%", background: INK_2, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: 26, color: "#fff" } }, Math.ceil(Math.max(0, seconds))));
  }
  function Button({ children, onClick, disabled, variant = "primary", style, ...rest }) {
    const base = { fontFamily: "'Baloo 2', sans-serif", fontWeight: 700, fontSize: 18, borderRadius: 14, padding: "14px 26px", border: "none", cursor: disabled ? "not-allowed" : "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 10, transition: "transform 0.12s ease, filter 0.12s ease", opacity: disabled ? 0.5 : 1 };
    const variants = {
      primary: { background: ACCENT, color: "#1C1140" },
      ghost: { background: "rgba(255,255,255,0.08)", color: "#fff", border: "1px solid rgba(255,255,255,0.18)" }
    };
    return /* @__PURE__ */ React.createElement("button", { className: "qa-btn", onClick: disabled ? void 0 : onClick, style: { ...base, ...variants[variant], ...style }, ...rest }, children);
  }
  function TextField({ value, onChange, placeholder, style, ...rest }) {
    return /* @__PURE__ */ React.createElement("input", { value, onChange, placeholder, style: { fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: 16, borderRadius: 12, border: "2px solid #E4E1F0", padding: "13px 16px", outline: "none", width: "100%", boxSizing: "border-box", color: INK, ...style }, ...rest });
  }
  function Screen({ children, dark = true }) {
    return /* @__PURE__ */ React.createElement("div", { style: { minHeight: 560, width: "100%", maxWidth: 640, borderRadius: 24, background: dark ? "radial-gradient(circle at 20% 0%, #2a1a55 0%, #120a2e 55%, #0b0620 100%)" : "#F4F2FB", fontFamily: "'Inter', sans-serif", padding: 28, boxSizing: "border-box", display: "flex", flexDirection: "column", position: "relative", overflow: "hidden", boxShadow: "0 30px 80px rgba(0,0,0,0.5)" } }, children);
  }
  function HeaderBar({ left, right }) {
    return /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 } }, /* @__PURE__ */ React.createElement("span", { style: { color: "#B9AFDA", fontWeight: 700, fontSize: 13 } }, left), /* @__PURE__ */ React.createElement("span", { style: { color: "#B9AFDA", fontWeight: 700, fontSize: 13 } }, right));
  }
  function Leaderboard({ players, highlightId, compact }) {
    const list = compact ? players : players.slice(0, 8);
    return /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 8, flex: compact ? void 0 : 1, justifyContent: "center", maxWidth: 460, margin: "0 auto", width: "100%" } }, list.length === 0 && /* @__PURE__ */ React.createElement("p", { style: { color: "#7A70A0", textAlign: "center" } }, "\u041F\u043E\u043A\u0438 \u043D\u0435\u043C\u0430\u0454 \u0440\u0435\u0437\u0443\u043B\u044C\u0442\u0430\u0442\u0456\u0432"), list.map((p, i) => /* @__PURE__ */ React.createElement("div", { key: p.id, style: { display: "flex", alignItems: "center", gap: 12, background: p.id === highlightId ? "rgba(255,197,61,0.16)" : "rgba(255,255,255,0.06)", border: p.id === highlightId ? "1px solid rgba(255,197,61,0.5)" : "1px solid transparent", borderRadius: 12, padding: "10px 16px" } }, /* @__PURE__ */ React.createElement("span", { style: { width: 26, height: 26, borderRadius: "50%", background: i < 3 ? ACCENT : "rgba(255,255,255,0.12)", color: i < 3 ? "#1C1140" : "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 13, fontFamily: "'Baloo 2', sans-serif", flexShrink: 0 } }, i + 1), /* @__PURE__ */ React.createElement("span", { style: { flex: 1, color: "#fff", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" } }, p.name), /* @__PURE__ */ React.createElement("span", { style: { color: ACCENT, fontWeight: 800, fontFamily: "'Baloo 2', sans-serif" } }, p.score))));
  }
  function LoadingPane({ text = "\u0417\u0430\u0432\u0430\u043D\u0442\u0430\u0436\u0435\u043D\u043D\u044F\u2026" }) {
    return /* @__PURE__ */ React.createElement("div", { style: { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 28 }, className: "qa-fade" }, "\u23F3"), /* @__PURE__ */ React.createElement("p", { style: { color: "#B9AFDA", marginTop: 12 } }, text));
  }
  function ErrorPane({ msg, onReset }) {
    return /* @__PURE__ */ React.createElement("div", { style: { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center" } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 30 } }, "\u274C"), /* @__PURE__ */ React.createElement("p", { style: { color: "#fff", marginTop: 14, maxWidth: 320 } }, msg), /* @__PURE__ */ React.createElement(Button, { onClick: onReset, style: { marginTop: 18 } }, "\u041D\u0430 \u0433\u043E\u043B\u043E\u0432\u043D\u0443"));
  }
  function App() {
    const [role, setRole] = useState(null);
    const [pin, setPin] = useState(null);
    const [state, setState] = useState(null);
    const [connError, setConnError] = useState("");
    const [now, setNow] = useState(Date.now());
    const [draft, setDraft] = useState([newQuestion()]);
    const [creating, setCreating] = useState(false);
    const [createErr, setCreateErr] = useState("");
    const [pinInput, setPinInput] = useState("");
    const [nameInput, setNameInput] = useState("");
    const [joinError, setJoinError] = useState("");
    const [joining, setJoining] = useState(false);
    const [playerId, setPlayerId] = useState(null);
    const [playerName, setPlayerName] = useState("");
    const [answeredIndex, setAnsweredIndex] = useState(-1);
    const [lastResult, setLastResult] = useState(null);
    useEffect(() => {
      function onState(payload) {
        setState(payload);
      }
      function onHostLeft() {
        setConnError("\u0412\u0435\u0434\u0443\u0447\u0438\u0439 \u0437\u0430\u0432\u0435\u0440\u0448\u0438\u0432 \u0441\u0435\u0441\u0456\u044E.");
      }
      function onDisconnect() {
        setConnError("\u0412\u0442\u0440\u0430\u0447\u0435\u043D\u043E \u0437'\u0454\u0434\u043D\u0430\u043D\u043D\u044F \u0456\u0437 \u0441\u0435\u0440\u0432\u0435\u0440\u043E\u043C. \u0421\u043F\u0440\u043E\u0431\u0443\u0439\u0442\u0435 \u043E\u043D\u043E\u0432\u0438\u0442\u0438 \u0441\u0442\u043E\u0440\u0456\u043D\u043A\u0443.");
      }
      socket.on("state", onState);
      socket.on("host:left", onHostLeft);
      socket.on("disconnect", onDisconnect);
      return () => {
        socket.off("state", onState);
        socket.off("host:left", onHostLeft);
        socket.off("disconnect", onDisconnect);
      };
    }, []);
    useEffect(() => {
      if (!state || state.status !== "question") return;
      const t = setInterval(() => setNow(Date.now()), 200);
      return () => clearInterval(t);
    }, [state && state.status, state && state.currentIndex]);
    function resetAll() {
      setRole(null);
      setPin(null);
      setState(null);
      setConnError("");
      setDraft([newQuestion()]);
      setCreateErr("");
      setPinInput("");
      setNameInput("");
      setJoinError("");
      setJoining(false);
      setPlayerId(null);
      setPlayerName("");
      setAnsweredIndex(-1);
      setLastResult(null);
    }
    function updateQ(i, patch) {
      setDraft((d) => d.map((q, idx) => idx === i ? { ...q, ...patch } : q));
    }
    function updateOpt(i, oi, val) {
      setDraft((d) => d.map((q, idx) => idx === i ? { ...q, options: q.options.map((o, k) => k === oi ? val : o) } : q));
    }
    function addQuestion() {
      setDraft((d) => [...d, newQuestion()]);
    }
    function removeQuestion(i) {
      setDraft((d) => d.filter((_, idx) => idx !== i));
    }
    const draftValid = draft.length > 0 && draft.every((q) => q.text.trim() && q.options.every((o) => o.trim()) && q.duration > 0);
    function createGame() {
      if (!draftValid || creating) return;
      setCreating(true);
      setCreateErr("");
      socket.emit("host:create", { questions: draft }, (res) => {
        setCreating(false);
        if (res && res.error) {
          setCreateErr(res.error);
          return;
        }
        setRole("host");
        setPin(res.pin);
      });
    }
    function startQuiz() {
      socket.emit("host:start", { pin });
    }
    function endQuestionNow() {
      socket.emit("host:endQuestion", { pin });
    }
    function nextQuestion() {
      socket.emit("host:next", { pin });
    }
    function joinGame() {
      setJoinError("");
      const p = pinInput.trim();
      const name = nameInput.trim();
      if (!/^\d{4,6}$/.test(p)) {
        setJoinError("\u0412\u0432\u0435\u0434\u0456\u0442\u044C \u043A\u043E\u0440\u0435\u043A\u0442\u043D\u0438\u0439 PIN-\u043A\u043E\u0434 (4\u20136 \u0446\u0438\u0444\u0440).");
        return;
      }
      if (!name) {
        setJoinError("\u0412\u0432\u0435\u0434\u0456\u0442\u044C \u043D\u0456\u043A\u043D\u0435\u0439\u043C.");
        return;
      }
      setJoining(true);
      socket.emit("player:join", { pin: p, name }, (res) => {
        setJoining(false);
        if (res && res.error) {
          setJoinError(res.error);
          return;
        }
        setPlayerId(res.playerId);
        setPlayerName(name);
        setPin(res.pin);
        setRole("player");
      });
    }
    function answer(choiceIdx) {
      if (!state || state.status !== "question") return;
      if (answeredIndex === state.currentIndex) return;
      setAnsweredIndex(state.currentIndex);
      socket.emit("player:answer", { pin, playerId, choice: choiceIdx }, (res) => {
        if (res) setLastResult(res);
      });
    }
    if (!role) {
      return /* @__PURE__ */ React.createElement(Screen, null, /* @__PURE__ */ React.createElement("div", { style: { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center" }, className: "qa-fade" }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 8, marginBottom: 18 } }, OPTS.map((o) => /* @__PURE__ */ React.createElement(ShapeIcon, { key: o.key, shape: o.shape, color: o.bg, size: 26 }))), /* @__PURE__ */ React.createElement("h1", { style: { fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: 42, color: "#fff", margin: 0 } }, "Quiz Arena"), /* @__PURE__ */ React.createElement("p", { style: { color: "#B9AFDA", marginTop: 8, marginBottom: 40, fontSize: 15 } }, "\u0412\u0456\u043A\u0442\u043E\u0440\u0438\u043D\u0430 \u0432 \u0440\u0435\u0430\u043B\u044C\u043D\u043E\u043C\u0443 \u0447\u0430\u0441\u0456 \u2014 \u0441\u0432\u0456\u0439 \u0441\u0430\u0439\u0442, \u0441\u0432\u0456\u0439 \u0441\u0435\u0440\u0432\u0435\u0440"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 14, width: 280 } }, /* @__PURE__ */ React.createElement(Button, { onClick: () => setRole("host-setup"), style: { padding: "16px 24px" } }, "\u{1F680} \u0421\u0442\u0432\u043E\u0440\u0438\u0442\u0438 \u0433\u0440\u0443"), /* @__PURE__ */ React.createElement(Button, { variant: "ghost", onClick: () => setRole("player-join"), style: { padding: "16px 24px" } }, "\u{1F511} \u041F\u0440\u0438\u0454\u0434\u043D\u0430\u0442\u0438\u0441\u044F \u0434\u043E \u0433\u0440\u0438"))));
    }
    if (role === "host-setup") {
      return /* @__PURE__ */ React.createElement(Screen, { dark: false }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 } }, /* @__PURE__ */ React.createElement("h2", { style: { fontFamily: "'Baloo 2', sans-serif", fontSize: 26, color: INK, margin: 0 } }, "\u0421\u0442\u0432\u043E\u0440\u0435\u043D\u043D\u044F \u0432\u0456\u043A\u0442\u043E\u0440\u0438\u043D\u0438"), /* @__PURE__ */ React.createElement("button", { onClick: resetAll, style: { background: "none", border: "none", color: "#8B84AE", cursor: "pointer", fontWeight: 600 } }, "\u2190 \u041D\u0430\u0437\u0430\u0434")), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 16, overflowY: "auto", paddingRight: 4, maxHeight: 420 } }, draft.map((q, i) => /* @__PURE__ */ React.createElement("div", { key: i, style: { background: CARD, borderRadius: 16, padding: 18, boxShadow: "0 2px 10px rgba(30,20,70,0.08)" } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 } }, /* @__PURE__ */ React.createElement("span", { style: { fontFamily: "'Baloo 2', sans-serif", fontWeight: 700, color: "#7B2FF7" } }, "\u041F\u0438\u0442\u0430\u043D\u043D\u044F ", i + 1), draft.length > 1 && /* @__PURE__ */ React.createElement("button", { onClick: () => removeQuestion(i), style: { background: "none", border: "none", cursor: "pointer", color: "#E8412C" } }, "\u{1F5D1}")), /* @__PURE__ */ React.createElement(TextField, { value: q.text, onChange: (e) => updateQ(i, { text: e.target.value }), placeholder: "\u0422\u0435\u043A\u0441\u0442 \u043F\u0438\u0442\u0430\u043D\u043D\u044F", style: { marginBottom: 10 } }), /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 } }, q.options.map((opt, oi) => /* @__PURE__ */ React.createElement("div", { key: oi, style: { display: "flex", alignItems: "center", gap: 8 } }, /* @__PURE__ */ React.createElement("button", { onClick: () => updateQ(i, { correct: oi }), title: "\u041F\u043E\u0437\u043D\u0430\u0447\u0438\u0442\u0438 \u043F\u0440\u0430\u0432\u0438\u043B\u044C\u043D\u043E\u044E", style: { width: 30, height: 30, borderRadius: 8, border: "none", flexShrink: 0, cursor: "pointer", background: OPTS[oi].bg, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800 } }, q.correct === oi ? "\u2713" : ""), /* @__PURE__ */ React.createElement(TextField, { value: opt, onChange: (e) => updateOpt(i, oi, e.target.value), placeholder: `\u0412\u0430\u0440\u0456\u0430\u043D\u0442 ${OPTS[oi].key}` })))), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 8 } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 13, color: "#8B84AE", fontWeight: 600 } }, "\u0427\u0430\u0441 \u043D\u0430 \u0432\u0456\u0434\u043F\u043E\u0432\u0456\u0434\u044C (\u0441\u0435\u043A):"), /* @__PURE__ */ React.createElement(TextField, { value: q.duration, onChange: (e) => updateQ(i, { duration: Math.max(5, parseInt(e.target.value) || 0) }), style: { width: 70, padding: "8px 10px" } }))))), createErr && /* @__PURE__ */ React.createElement("p", { style: { color: "#E8412C", fontWeight: 600, marginTop: 10 } }, createErr), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 18 } }, /* @__PURE__ */ React.createElement(Button, { variant: "ghost", onClick: addQuestion, style: { color: INK, background: "#EDE9FB", border: "none" } }, "\u2795 \u0414\u043E\u0434\u0430\u0442\u0438 \u043F\u0438\u0442\u0430\u043D\u043D\u044F"), /* @__PURE__ */ React.createElement(Button, { onClick: createGame, disabled: !draftValid || creating }, creating ? "\u2026" : "\u25B6", " \u041F\u043E\u0447\u0430\u0442\u0438 \u0433\u0440\u0443")));
    }
    if (role === "player-join") {
      return /* @__PURE__ */ React.createElement(Screen, null, /* @__PURE__ */ React.createElement("div", { style: { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }, className: "qa-fade" }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 36, marginBottom: 10 } }, "\u{1F3AE}"), /* @__PURE__ */ React.createElement("h2", { style: { fontFamily: "'Baloo 2', sans-serif", color: "#fff", fontSize: 26, marginBottom: 22 } }, "\u041F\u0440\u0438\u0454\u0434\u043D\u0430\u0442\u0438\u0441\u044F \u0434\u043E \u0433\u0440\u0438"), /* @__PURE__ */ React.createElement("div", { style: { width: 280, display: "flex", flexDirection: "column", gap: 12 } }, /* @__PURE__ */ React.createElement(TextField, { value: pinInput, onChange: (e) => setPinInput(e.target.value.replace(/\D/g, "")), placeholder: "PIN-\u043A\u043E\u0434 \u0433\u0440\u0438", style: { textAlign: "center", fontSize: 22, letterSpacing: 4, fontFamily: "'Baloo 2', sans-serif" } }), /* @__PURE__ */ React.createElement(TextField, { value: nameInput, onChange: (e) => setNameInput(e.target.value.slice(0, 20)), placeholder: "\u0412\u0430\u0448 \u043D\u0456\u043A\u043D\u0435\u0439\u043C" }), joinError && /* @__PURE__ */ React.createElement("span", { style: { color: "#FF8B7A", fontSize: 13, fontWeight: 600 } }, joinError), /* @__PURE__ */ React.createElement(Button, { onClick: joinGame, disabled: joining, style: { marginTop: 6 } }, joining ? "\u2026" : "\u{1F511}", " \u041F\u0440\u0438\u0454\u0434\u043D\u0430\u0442\u0438\u0441\u044F"), /* @__PURE__ */ React.createElement("button", { onClick: resetAll, style: { background: "none", border: "none", color: "#8B84AE", cursor: "pointer" } }, "\u2190 \u041D\u0430\u0437\u0430\u0434"))));
    }
    if (connError) {
      return /* @__PURE__ */ React.createElement(Screen, null, /* @__PURE__ */ React.createElement(ErrorPane, { msg: connError, onReset: resetAll }));
    }
    if (!state) {
      return /* @__PURE__ */ React.createElement(Screen, null, /* @__PURE__ */ React.createElement(LoadingPane, null));
    }
    const players = state.players || [];
    if (role === "host") {
      if (state.status === "lobby") {
        return /* @__PURE__ */ React.createElement(Screen, null, /* @__PURE__ */ React.createElement("div", { style: { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center" }, className: "qa-fade" }, /* @__PURE__ */ React.createElement("p", { style: { color: "#B9AFDA", marginBottom: 4, fontSize: 14, fontWeight: 600 } }, "PIN-\u043A\u043E\u0434 \u0433\u0440\u0438"), /* @__PURE__ */ React.createElement(MarqueePin, { pin }), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 8, color: "#fff", marginTop: 26, marginBottom: 6 } }, /* @__PURE__ */ React.createElement("span", null, "\u{1F465}"), /* @__PURE__ */ React.createElement("span", { style: { fontFamily: "'Baloo 2', sans-serif", fontWeight: 700, fontSize: 18 } }, players.length, " \u0433\u0440\u0430\u0432\u0446\u0456\u0432 \u043F\u0440\u0438\u0454\u0434\u043D\u0430\u043B\u043E\u0441\u044F")), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", maxWidth: 460, marginBottom: 30 } }, players.map((p) => /* @__PURE__ */ React.createElement("span", { key: p.id, style: { background: "rgba(255,255,255,0.1)", color: "#fff", padding: "7px 14px", borderRadius: 20, fontSize: 14, fontWeight: 600 } }, p.name)), players.length === 0 && /* @__PURE__ */ React.createElement("span", { style: { color: "#7A70A0", fontSize: 14 } }, "\u041E\u0447\u0456\u043A\u0443\u0454\u043C\u043E \u043D\u0430 \u0433\u0440\u0430\u0432\u0446\u0456\u0432\u2026")), /* @__PURE__ */ React.createElement(Button, { onClick: startQuiz, disabled: players.length === 0, style: { padding: "16px 34px", fontSize: 20 } }, "\u25B6 \u041F\u043E\u0447\u0430\u0442\u0438 \u0432\u0456\u043A\u0442\u043E\u0440\u0438\u043D\u0443")));
      }
      if (state.status === "question") {
        const q = state.question;
        const elapsed = (now - state.questionStartTime) / 1e3;
        const remaining = Math.max(0, q.duration - elapsed);
        const fraction = remaining / q.duration;
        const answeredCount = players.filter((p) => p.answeredCurrent).length;
        return /* @__PURE__ */ React.createElement(Screen, null, /* @__PURE__ */ React.createElement(HeaderBar, { left: `\u041F\u0438\u0442\u0430\u043D\u043D\u044F ${state.currentIndex + 1} / ${state.totalQuestions}`, right: `${answeredCount}/${players.length} \u0432\u0456\u0434\u043F\u043E\u0432\u0456\u043B\u0438` }), /* @__PURE__ */ React.createElement("div", { className: "qa-fade", key: state.currentIndex, style: { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" } }, /* @__PURE__ */ React.createElement(TimerRing, { fraction, seconds: remaining }), /* @__PURE__ */ React.createElement("h2", { style: { fontFamily: "'Baloo 2', sans-serif", color: "#fff", fontSize: 28, textAlign: "center", margin: "22px 0 30px", maxWidth: 560 } }, q.text), /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, width: "100%", maxWidth: 560 } }, q.options.map((opt, i) => /* @__PURE__ */ React.createElement("div", { key: i, style: { background: OPTS[i].bg, borderRadius: 14, padding: "18px 16px", display: "flex", alignItems: "center", gap: 12, outline: i === q.correct ? "3px solid #FFC53D" : "none" } }, /* @__PURE__ */ React.createElement(ShapeIcon, { shape: OPTS[i].shape }), /* @__PURE__ */ React.createElement("span", { style: { color: "#fff", fontWeight: 700 } }, opt))))), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "center", marginTop: 10 } }, /* @__PURE__ */ React.createElement(Button, { variant: "ghost", onClick: endQuestionNow }, "\u0417\u0430\u0432\u0435\u0440\u0448\u0438\u0442\u0438 \u0434\u043E\u0441\u0442\u0440\u043E\u043A\u043E\u0432\u043E \u2192")));
      }
      if (state.status === "leaderboard") {
        const isLast = state.currentIndex + 1 >= state.totalQuestions;
        return /* @__PURE__ */ React.createElement(Screen, null, /* @__PURE__ */ React.createElement(HeaderBar, { left: `\u041F\u0456\u0441\u043B\u044F \u043F\u0438\u0442\u0430\u043D\u043D\u044F ${state.currentIndex + 1}`, right: `${players.length} \u0433\u0440\u0430\u0432\u0446\u0456\u0432` }), /* @__PURE__ */ React.createElement(Leaderboard, { players }), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "center", marginTop: 18 } }, /* @__PURE__ */ React.createElement(Button, { onClick: nextQuestion, style: { padding: "14px 30px" } }, isLast ? "\u{1F3C6} \u041F\u043E\u043A\u0430\u0437\u0430\u0442\u0438 \u0444\u0456\u043D\u0430\u043B\u044C\u043D\u0456 \u0440\u0435\u0437\u0443\u043B\u044C\u0442\u0430\u0442\u0438" : "\u041D\u0430\u0441\u0442\u0443\u043F\u043D\u0435 \u043F\u0438\u0442\u0430\u043D\u043D\u044F \u2192")));
      }
      if (state.status === "final") {
        const top3 = players.slice(0, 3);
        return /* @__PURE__ */ React.createElement(Screen, null, /* @__PURE__ */ React.createElement("div", { className: "qa-fade", style: { flex: 1, display: "flex", flexDirection: "column", alignItems: "center" } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 34 } }, "\u{1F3C6}"), /* @__PURE__ */ React.createElement("h2", { style: { fontFamily: "'Baloo 2', sans-serif", color: "#fff", fontSize: 30, margin: "10px 0 6px" } }, "\u0413\u0440\u0443 \u0437\u0430\u0432\u0435\u0440\u0448\u0435\u043D\u043E!"), /* @__PURE__ */ React.createElement("p", { style: { color: "#B9AFDA", marginBottom: 10, fontSize: 14 } }, "PIN ", pin), /* @__PURE__ */ React.createElement(Podium, { top3 }), /* @__PURE__ */ React.createElement("div", { style: { width: "100%", maxWidth: 420, marginTop: 26 } }, /* @__PURE__ */ React.createElement(Leaderboard, { players, compact: true })), /* @__PURE__ */ React.createElement(Button, { onClick: resetAll, style: { marginTop: 24 } }, "\u21BB \u041D\u043E\u0432\u0430 \u0433\u0440\u0430")));
      }
    }
    if (role === "player") {
      if (state.status === "lobby") {
        return /* @__PURE__ */ React.createElement(Screen, null, /* @__PURE__ */ React.createElement("div", { style: { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center" }, className: "qa-fade" }, /* @__PURE__ */ React.createElement("div", { style: { width: 76, height: 76, borderRadius: "50%", background: "rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 18, fontSize: 28 }, className: "qa-fade" }, "\u23F3"), /* @__PURE__ */ React.createElement("h2", { style: { fontFamily: "'Baloo 2', sans-serif", color: "#fff", fontSize: 24, margin: 0 } }, "\u041F\u0440\u0438\u0432\u0456\u0442, ", playerName, "!"), /* @__PURE__ */ React.createElement("p", { style: { color: "#B9AFDA", marginTop: 10 } }, "\u0427\u0435\u043A\u0430\u0454\u043C\u043E \u043D\u0430 \u0441\u0442\u0430\u0440\u0442 \u0432\u0456\u0434 \u0432\u0435\u0434\u0443\u0447\u043E\u0433\u043E\u2026")));
      }
      if (state.status === "question") {
        const q = state.question;
        const elapsed = (now - state.questionStartTime) / 1e3;
        const remaining = Math.max(0, q.duration - elapsed);
        const fraction = remaining / q.duration;
        const alreadyAnswered = answeredIndex === state.currentIndex;
        if (alreadyAnswered) {
          return /* @__PURE__ */ React.createElement(Screen, null, /* @__PURE__ */ React.createElement("div", { className: "qa-fade", style: { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center" } }, lastResult ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { style: { width: 92, height: 92, borderRadius: "50%", background: lastResult.correct ? "rgba(58,201,120,0.15)" : "rgba(232,65,44,0.15)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 18, fontSize: 40 } }, lastResult.correct ? "\u2705" : "\u274C"), /* @__PURE__ */ React.createElement("h2", { style: { fontFamily: "'Baloo 2', sans-serif", color: "#fff", fontSize: 26, margin: 0 } }, lastResult.correct ? "\u041F\u0440\u0430\u0432\u0438\u043B\u044C\u043D\u043E!" : "\u041D\u0435\u043F\u0440\u0430\u0432\u0438\u043B\u044C\u043D\u043E"), /* @__PURE__ */ React.createElement("p", { style: { color: ACCENT, fontFamily: "'Baloo 2', sans-serif", fontWeight: 700, fontSize: 20, marginTop: 8 } }, "+", lastResult.points, " \u0431\u0430\u043B\u0456\u0432")) : /* @__PURE__ */ React.createElement("div", { style: { fontSize: 28 }, className: "qa-fade" }, "\u23F3"), /* @__PURE__ */ React.createElement("p", { style: { color: "#7A70A0", marginTop: 20, fontSize: 14 } }, "\u041E\u0447\u0456\u043A\u0443\u0454\u043C\u043E \u043D\u0430 \u0456\u043D\u0448\u0438\u0445 \u0433\u0440\u0430\u0432\u0446\u0456\u0432\u2026")));
        }
        return /* @__PURE__ */ React.createElement(Screen, null, /* @__PURE__ */ React.createElement(HeaderBar, { left: `\u041F\u0438\u0442\u0430\u043D\u043D\u044F ${state.currentIndex + 1} / ${state.totalQuestions}`, right: playerName }), /* @__PURE__ */ React.createElement("div", { className: "qa-fade", key: state.currentIndex, style: { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" } }, /* @__PURE__ */ React.createElement(TimerRing, { fraction, seconds: remaining }), /* @__PURE__ */ React.createElement("h2", { style: { fontFamily: "'Baloo 2', sans-serif", color: "#fff", fontSize: 22, textAlign: "center", margin: "20px 0 26px", maxWidth: 520 } }, q.text), /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, width: "100%", maxWidth: 520 } }, q.options.map((opt, i) => /* @__PURE__ */ React.createElement("button", { key: i, className: "qa-opt", disabled: remaining <= 0, onClick: () => answer(i), style: { background: OPTS[i].bg, border: "none", borderRadius: 14, padding: "22px 14px", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, cursor: "pointer", minHeight: 84 } }, /* @__PURE__ */ React.createElement(ShapeIcon, { shape: OPTS[i].shape, size: 26 }), /* @__PURE__ */ React.createElement("span", { style: { color: "#fff", fontWeight: 700, fontSize: 16 } }, opt))))));
      }
      if (state.status === "leaderboard") {
        return /* @__PURE__ */ React.createElement(Screen, null, /* @__PURE__ */ React.createElement(HeaderBar, { left: `\u041F\u0456\u0441\u043B\u044F \u043F\u0438\u0442\u0430\u043D\u043D\u044F ${state.currentIndex + 1}`, right: playerName }), /* @__PURE__ */ React.createElement(Leaderboard, { players, highlightId: playerId }), /* @__PURE__ */ React.createElement("p", { style: { textAlign: "center", color: "#7A70A0", marginTop: 16, fontSize: 14 } }, "\u041E\u0447\u0456\u043A\u0443\u0454\u043C\u043E \u043D\u0430\u0441\u0442\u0443\u043F\u043D\u0435 \u043F\u0438\u0442\u0430\u043D\u043D\u044F\u2026"));
      }
      if (state.status === "final") {
        const top3 = players.slice(0, 3);
        const myRank = players.findIndex((p) => p.id === playerId) + 1;
        return /* @__PURE__ */ React.createElement(Screen, null, /* @__PURE__ */ React.createElement("div", { className: "qa-fade", style: { flex: 1, display: "flex", flexDirection: "column", alignItems: "center" } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 34 } }, "\u{1F3C6}"), /* @__PURE__ */ React.createElement("h2", { style: { fontFamily: "'Baloo 2', sans-serif", color: "#fff", fontSize: 26, margin: "10px 0 4px" } }, "\u0412\u0456\u043A\u0442\u043E\u0440\u0438\u043D\u0443 \u0437\u0430\u0432\u0435\u0440\u0448\u0435\u043D\u043E!"), myRank > 0 && /* @__PURE__ */ React.createElement("p", { style: { color: "#B9AFDA", marginBottom: 8, fontSize: 14 } }, "\u0412\u0430\u0448\u0435 \u043C\u0456\u0441\u0446\u0435: ", /* @__PURE__ */ React.createElement("b", { style: { color: ACCENT } }, "#", myRank)), /* @__PURE__ */ React.createElement(Podium, { top3 }), /* @__PURE__ */ React.createElement("div", { style: { width: "100%", maxWidth: 420, marginTop: 26 } }, /* @__PURE__ */ React.createElement(Leaderboard, { players, highlightId: playerId, compact: true })), /* @__PURE__ */ React.createElement(Button, { variant: "ghost", onClick: resetAll, style: { marginTop: 24 } }, "\u0412\u0438\u0439\u0442\u0438")));
      }
    }
    return /* @__PURE__ */ React.createElement(Screen, null, /* @__PURE__ */ React.createElement(LoadingPane, null));
  }
  ReactDOM.createRoot(document.getElementById("root")).render(/* @__PURE__ */ React.createElement(App, null));
})();
