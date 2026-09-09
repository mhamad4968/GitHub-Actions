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

export function applyAsciiNumberInput(input, { allowDecimal = true } = {}) {
  input.classList.add("jy2-input-ascii-num");
  input.inputMode = allowDecimal ? "decimal" : "numeric";
  input.autocomplete = "off";

  const opts = { allowDecimal };

  const placeCaretAtEnd = () => {
    try {
      const len = input.value.length;
      input.setSelectionRange(len, len);
    } catch {
      // ignore
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
    const normalized = normalizeAsciiNumberDraft(input.value, opts);
    if (normalized !== input.value) {
      input.value = normalized;
      placeCaretAtEnd();
    }
  };

  input.addEventListener("beforeinput", (event) => {
    if (event.isComposing) return;
    const inputType = String(event.inputType || "");
    if (inputType.startsWith("delete")) return;

    if (inputType === "insertText" || inputType === "insertCompositionText") {
      const data = event.data ?? "";
      const start = input.selectionStart ?? input.value.length;
      const end = input.selectionEnd ?? input.value.length;
      const predicted = input.value.slice(0, start) + data + input.value.slice(end);
      const normalized = normalizeAsciiNumberDraft(predicted, opts);
      if (normalized !== predicted) {
        event.preventDefault();
        input.value = normalized;
        placeCaretAtEnd();
        dispatchInput();
      }
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

  input.addEventListener("compositionend", () => {
    sanitizeIfFocused();
  });

  input.addEventListener("input", () => {
    sanitizeIfFocused();
  });
}
