export function normalizeAsciiNumberDraft(raw, { allowDecimal = true } = {}) {
  if (raw === null || raw === undefined) return "";
  const text = String(raw);
  if (text === "") return "";

  let out = "";
  let sawDot = false;
  for (const ch of text.normalize("NFKC")) {
    if (ch >= "0" && ch <= "9") {
      out += ch;
      continue;
    }
    const code = ch.charCodeAt(0);
    if (code >= 0xff10 && code <= 0xff19) {
      out += String.fromCharCode(code - 0xff10 + 0x30);
      continue;
    }
    if (allowDecimal && (ch === "." || ch === "。" || ch === "．")) {
      if (!sawDot) {
        out += ".";
        sawDot = true;
      }
      continue;
    }
  }
  return out;
}

function isFullwidthDigitOrDot(ch) {
  const code = ch.charCodeAt(0);
  return (
    (code >= 0xff10 && code <= 0xff19) ||
    ch === "。" ||
    ch === "．" ||
    (ch >= "０" && ch <= "９")
  );
}

function isLettersOnly(data) {
  if (!data) return false;
  const normalized = normalizeAsciiNumberDraft(data);
  if (normalized !== "") return false;
  for (const ch of data) {
    if (/[a-zA-Z]/.test(ch)) continue;
    if (isFullwidthDigitOrDot(ch)) return false;
    if (ch >= "0" && ch <= "9") return false;
    if (ch === "." || ch === "-" || ch === "+") return false;
  }
  return data.length > 0;
}

export function applyAsciiNumberInput(input, { allowDecimal = true } = {}) {
  input.classList.add("jy2-input-ascii-num");
  input.lang = "en";
  input.inputMode = allowDecimal ? "decimal" : "numeric";
  input.autocomplete = "off";
  input.autocapitalize = "off";
  input.spellcheck = false;
  try {
    input.style.imeMode = "disabled";
  } catch {
    // ignore
  }

  const opts = { allowDecimal };
  let composing = false;

  const placeCaretAtEnd = () => {
    try {
      const len = input.value.length;
      input.setSelectionRange(len, len);
    } catch {
      // ignore
    }
  };

  const placeCaretPreferKeep = (beforeLen, beforeStart, beforeEnd, normalized) => {
    if (normalized === input.value) return;
    try {
      const delta = normalized.length - beforeLen;
      if (delta === 0) {
        input.setSelectionRange(beforeStart, beforeEnd);
        return;
      }
      const start = Math.min(Math.max(0, beforeStart + delta), normalized.length);
      const end = Math.min(Math.max(0, beforeEnd + delta), normalized.length);
      input.setSelectionRange(start, end);
    } catch {
      placeCaretAtEnd();
    }
  };

  const dispatchInput = () => {
    try {
      const view = input.ownerDocument.defaultView;
      const EventCtor = (view && view.Event) || Event;
      input.dispatchEvent(new EventCtor("input", { bubbles: true }));
    } catch {
      // ignore
    }
  };

  const sanitizeIfFocused = () => {
    if (input !== input.ownerDocument.activeElement) return;
    const before = input.value;
    const beforeStart = input.selectionStart ?? before.length;
    const beforeEnd = input.selectionEnd ?? before.length;
    const normalized = normalizeAsciiNumberDraft(before, opts);
    if (normalized !== before) {
      input.value = normalized;
      placeCaretPreferKeep(before.length, beforeStart, beforeEnd, normalized);
    }
  };

  input.addEventListener("focus", () => {
    try {
      input.readOnly = true;
      const doc = input.ownerDocument;
      const raf = doc.defaultView?.requestAnimationFrame ?? requestAnimationFrame;
      raf.call(doc.defaultView ?? globalThis, () => {
        input.readOnly = false;
      });
    } catch {
      // ignore
    }
  });

  input.addEventListener("compositionstart", () => {
    composing = true;
  });

  input.addEventListener("compositionupdate", () => {
    sanitizeIfFocused();
  });

  input.addEventListener("compositionend", () => {
    composing = false;
    sanitizeIfFocused();
  });

  input.addEventListener("beforeinput", (event) => {
    if (event.isComposing || composing) return;
    const inputType = String(event.inputType || "");
    if (inputType.startsWith("delete")) return;
    if (inputType === "insertCompositionText") return;

    if (inputType === "insertText") {
      const data = event.data ?? "";
      const start = input.selectionStart ?? input.value.length;
      const end = input.selectionEnd ?? input.value.length;
      const predicted = input.value.slice(0, start) + data + input.value.slice(end);
      const normalized = normalizeAsciiNumberDraft(predicted, opts);
      if (normalized === predicted) return;
      if (isLettersOnly(data)) {
        event.preventDefault();
        return;
      }
      // Fullwidth digits/dots or mixed: allow native insert; input handler converts.
    }
  });

  input.addEventListener("paste", (event) => {
    event.preventDefault();
    const text = event.clipboardData?.getData("text/plain") ?? "";
    const start = input.selectionStart ?? input.value.length;
    const end = input.selectionEnd ?? input.value.length;
    const merged = input.value.slice(0, start) + text + input.value.slice(end);
    input.value = normalizeAsciiNumberDraft(merged, opts);
    placeCaretAtEnd();
    dispatchInput();
  });

  input.addEventListener("input", () => {
    sanitizeIfFocused();
  });
}
