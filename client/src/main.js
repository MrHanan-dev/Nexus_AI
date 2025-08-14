import { streamCompletion, streamAnthropicCompletion, streamGeminiCompletion } from "./api.js";
import {
  isCursorInUserPrompt,
  insertMarker,
  parseConversation,
  placeCaretAtEnd,
  resetEditor as softResetEditor,
  fullResetEditor,
} from "./editor.js";
import { saveSession, loadSession } from "./file-handler.js";
import {
  initializeThemeSwitch,
  initializeTemplates,
  initializeStatusBar,
  initializeHistory,
  initializeExport,
  showToast
} from "./features.js";

const editor = document.getElementById("editor");
const saveBtn = document.getElementById("save-btn");
const loadBtn = document.getElementById("load-btn");
const configBtn = document.getElementById("config-btn");
const resetBtn = document.getElementById("reset-btn");
const configPopup = document.getElementById("config-popup");
const popupCancelBtn = document.getElementById("popup-cancel-btn");
const popupSaveBtn = document.getElementById("popup-save-btn");
const modelInput = document.getElementById("model-input");
const providerInput = document.getElementById("provider-input");

const MODEL_STORAGE_KEY = "nexuschat-llm-model";
const DEFAULT_MODEL = "gemini-pro";
const PROVIDER_STORAGE_KEY = "nexuschat-llm-provider";
const DEFAULT_PROVIDER = "gemini";
const ALLOWED_PROVIDERS = ["openai", "anthropic", "google", "gemini"];

let currentAbortController = null;

function getModel() {
  const stored = localStorage.getItem(MODEL_STORAGE_KEY);
  return stored && stored.trim() ? stored.trim() : DEFAULT_MODEL;
}

function getProvider() {
  const stored = (localStorage.getItem(PROVIDER_STORAGE_KEY) || "").toLowerCase();
  return ALLOWED_PROVIDERS.includes(stored) ? stored : DEFAULT_PROVIDER;
}

// Full reset – discard custom system prompt
function resetEditor() {
  if (currentAbortController) {
    currentAbortController.abort();
    currentAbortController = null;
  }
  fullResetEditor(editor);
}

// Soft reset via typing "clear" – keep current system prompt
function softReset() {
  if (currentAbortController) {
    currentAbortController.abort();
    currentAbortController = null;
  }
  softResetEditor(editor);
}

editor.addEventListener("keydown", async (e) => {
  if (e.key !== "Enter") return;

  // Only trigger if the cursor is inside a user prompt block
  if (!isCursorInUserPrompt(editor)) return;

  // In a user prompt block, Shift+Enter should add a newline.
  if (e.shiftKey) {
    return; // Allow default newline behavior
  }

  e.preventDefault(); // stop default newline for cleaner UX
  await runQuery();
});

saveBtn.addEventListener("click", () => {
  saveSession(editor.innerText);
});

loadBtn.addEventListener("click", () => {
  loadSession(editor);
});

resetBtn.addEventListener("click", () => {
  resetEditor();
});

configBtn.addEventListener("click", (e) => {
  e.stopPropagation(); // prevent this click from closing the popup immediately
  const isVisible = configPopup.style.display === "block";
  if (isVisible) {
    hidePopup();
  } else {
    modelInput.value = getModel();
    providerInput.value = getProvider();
    configPopup.style.display = "block";
    document.addEventListener("click", closePopupOnOutsideClick);
  }
});

function hidePopup() {
  configPopup.style.display = "none";
  document.removeEventListener("click", closePopupOnOutsideClick);
}

function closePopupOnOutsideClick(e) {
  if (!configPopup.contains(e.target)) {
    hidePopup();
  }
}

popupCancelBtn.addEventListener("click", hidePopup);

popupSaveBtn.addEventListener("click", () => {
  const newModel = modelInput.value.trim();
  if (newModel) {
    localStorage.setItem(MODEL_STORAGE_KEY, newModel);
  }

  const newProvider = providerInput.value.trim().toLowerCase();
  if (ALLOWED_PROVIDERS.includes(newProvider)) {
    localStorage.setItem(PROVIDER_STORAGE_KEY, newProvider);
  } else if (newProvider) {
    alert(`Unsupported provider: ${newProvider}. \n\nValid options: ${ALLOWED_PROVIDERS.join(", ")}`);
  }
  hidePopup();
});

async function runQuery() {
  // 1-- build messages array from the whole doc (user prompt is already in the editor)
  const messages = parseConversation(editor);

  const lastMessage = messages.at(-1);
  if (lastMessage?.role === "user" && lastMessage?.content.trim().toLowerCase() === "clear") {
    softReset();
    return;
  }

  // 2-- cancel any previous in-flight stream
  if (currentAbortController) {
    currentAbortController.abort();
  }
  const abortCtrl = new AbortController();
  currentAbortController = abortCtrl;

  // 3-- place a zero-width marker at caret and prepend the AI label on a new line
  const marker = insertMarker();
  marker.insertAdjacentText("beforebegin", "\n\n@ai: ");

  // 4-- stream tokens and insert them before marker
  try {
    // Always use Gemini provider and model
    const model = 'gemini-pro';
    const provider = 'gemini';
    
    // Update storage to ensure consistency
    localStorage.setItem(PROVIDER_STORAGE_KEY, provider);
    localStorage.setItem(MODEL_STORAGE_KEY, model);

    if (provider === "anthropic") {
      const systemMessage = messages.find((m) => m.role === "system");
      const system = systemMessage?.content;
      const otherMessages = messages.filter((m) => m.role !== "system");

      for await (const token of streamAnthropicCompletion(
        otherMessages,
        abortCtrl.signal,
        model,
        system
      )) {
        marker.insertAdjacentText("beforebegin", token);
        marker.scrollIntoView({ block: "nearest" }); // minimal autoscroll
      }
    } else if (provider === "gemini") {
      for await (const token of streamGeminiCompletion(
        messages,
        abortCtrl.signal,
        model
      )) {
        marker.insertAdjacentText("beforebegin", token);
        marker.scrollIntoView({ block: "nearest" });
      }
    } else {
      for await (const token of streamCompletion(messages, abortCtrl.signal, model)) {
        marker.insertAdjacentText("beforebegin", token);
        marker.scrollIntoView({ block: "nearest" }); // minimal autoscroll
      }
    }
  } catch (err) {
    if (err.name !== "AbortError") {
      console.error(err);
      // Show the error inline
      marker.insertAdjacentText("beforebegin", `[ERROR: ${err.message}]`);
      marker.scrollIntoView({ block: "nearest" });
    }
  } finally {
    marker.remove();
    currentAbortController = null;

    // After AI response, normalise trailing whitespace so we don't accumulate extra blank lines
    // Remove any spaces or newlines at the very end of the document
    editor.textContent = editor.textContent.replace(/\s+$/u, "");

    // Create a fresh prompt line for the user with exactly two leading newlines
    editor.append("\n\n@user: ");
    placeCaretAtEnd(editor);
  }
}

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  // First clear any existing storage
  localStorage.clear();
  
  // Initialize features
  initializeThemeSwitch();
  initializeTemplates();
  initializeStatusBar();
  initializeHistory();
  initializeExport();
  
  // Set Gemini as the default provider
  localStorage.setItem(PROVIDER_STORAGE_KEY, 'gemini');
  localStorage.setItem(MODEL_STORAGE_KEY, 'gemini-pro');
  
  // Update UI
  if (providerInput && modelInput) {
    providerInput.value = 'gemini';
    modelInput.value = 'gemini-pro';
  }
  
  // Reset the editor
  softResetEditor(editor);
}); 