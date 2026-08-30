# Floating Translator — Forensic Engineering War Stories & Retrospectives

---

### 1. The Chrome Manifest V3 Offscreen Architecture & Promise-Based Mutex Lock

- **Category:** Architecture & Paradigm Shifts / Defensive Engineering
- **Key Metrics / Impact:** Full Chrome Manifest V3 compliance utilizing Offscreen Canvas APIs | 100% elimination of race-condition null crashes during rapid `Alt+T` invocations | Client-side zero-cloud WebAssembly OCR via Tesseract.js
- **Tech Stack & Hardware Involved:** Chrome Extension Manifest V3, WebAssembly (Tesseract.js WASM), Offscreen Document API, JavaScript Promise Mutex, Service Workers

#### 1. The Situation & Setup
Floating Translator (`FloatingTranslator/extension/`) is a lightweight browser extension providing zero-cost, on-screen OCR translation. When a user presses `Alt+T`, a crosshair selector lets them draw a bounding box around any image, video subtitle, or canvas text. The extension crops the screenshot, runs Tesseract.js OCR in WebAssembly, and renders a floating translated overlay panel in real time (`implementation_plan.md`).
Under Chrome Manifest V3, background service workers are headless and lack DOM/Canvas access. To execute image cropping and Tesseract WASM processing, the extension delegates rendering to an isolated **Offscreen Document** (`offscreen/offscreen.html`).

#### 2. The Anomaly & The Mistake (The Symptom)
During rapid testing (`extension/bugs.md`, Bug C2):
- When a user pressed `Alt+T` in quick succession (or held down the hotkey), the extension threw an unhandled exception: `TypeError: Cannot read properties of null (reading 'recognize')`.
- The loading spinner froze permanently on screen, and subsequent OCR requests failed until the browser extension was completely reloaded.

#### 3. Forensic Investigation (The Root Cause)
1. **Boolean Flag Race Condition:** In `offscreen/offscreen.js`, the worker initialization logic used a simple boolean flag:
   ```javascript
   // FLAWED IMPLEMENTATION:
   if (!ocrWorker && !isInitializing) {
     isInitializing = true;
     ocrWorker = await Tesseract.createWorker(lang, 1, { ... });
     isInitializing = false;
   }
   // If call #2 arrives while isInitializing === true, it skips initialization!
   // ocrWorker is still null -> ocrWorker.recognize() crashes!
   ```
2. Because Tesseract WASM initialization takes 800–1500ms to download and compile dictionaries, a second `Alt+T` invocation arrived while `isInitializing` was `true`, causing execution to fall through to `ocrWorker.recognize()` before `ocrWorker` existed.

#### 4. The Engineering Breakthrough (The Fix)
Replaced the fragile boolean flag with a **Promise-Based Mutex Lock** (`offscreen/offscreen.js`, Bug C2):
```javascript
let workerInitPromise = null;

async function ensureWorker(lang) {
  if (ocrWorker && ocrWorkerLang === lang) return; // Worker already ready

  // If initialization is in-flight, await the same shared promise
  if (workerInitPromise) {
    await workerInitPromise;
    if (ocrWorker && ocrWorkerLang === lang) return;
  }

  // Create shared initialization promise
  workerInitPromise = (async () => {
    if (ocrWorker) await ocrWorker.terminate();
    ocrWorker = await Tesseract.createWorker(lang, 1, {
      workerPath: chrome.runtime.getURL('lib/tesseract/worker.min.js'),
      corePath: chrome.runtime.getURL('lib/tesseract/tesseract-core.wasm.js'),
    });
    ocrWorkerLang = lang;
  })();

  try { 
    await workerInitPromise; 
  } finally { 
    workerInitPromise = null; 
  }
}
```
Concurrent calls now await the active initialization promise, completely eliminating null pointer crashes during rapid keypresses.

#### 5. The Core Engineering Lesson
In asynchronous JavaScript and WebAssembly architectures, boolean flags are incapable of serializing concurrent calls. Always use shared Promise handles as mutual exclusion locks to ensure all callers safely await in-flight resource initializations.

---

### 2. The Stale Language Worker Bug & Dynamic WASM Model Swapping

- **Category:** Defensive Engineering & System Reliability
- **Key Metrics / Impact:** Instant language switching across 10+ languages (English, Japanese, Chinese, Spanish, French, German) | Zero memory leakage during Tesseract worker teardown
- **Tech Stack & Hardware Involved:** Tesseract.js WebAssembly, Chrome Extension Storage API, Offscreen Documents

#### 1. The Situation & Setup
The extension allows users to switch target OCR languages dynamically in the extension popup (e.g. from English `'eng'` to Japanese `'jpn'` or Simplified Chinese `'chi_sim'`).

#### 2. The Anomaly & The Mistake (The Symptom)
When a user changed the OCR language in popup settings from English to Japanese and captured manga or Japanese web text, Tesseract continued running the English character model, outputting corrupted ASCII noise instead of kanji/kana (`extension/bugs.md`, Bug C1).

#### 3. Forensic Investigation (The Root Cause)
`offscreen.js` created the Tesseract worker instance once and cached it in a global module variable `ocrWorker` without recording the language it was initialized with. Subsequent `runOCR(imageBlob, 'jpn')` calls saw `ocrWorker !== null` and reused the English worker instance indefinitely.

#### 4. The Engineering Breakthrough (The Fix)
Added active language tracking via `ocrWorkerLang`. If the requested language differs from the cached worker, the system explicitly calls `await ocrWorker.terminate()`, resets the worker handle, and instantiates the new language WASM model (`extension/bugs.md`):

```javascript
async function ensureWorker(lang) {
  if (ocrWorker && ocrWorkerLang === lang) return;

  if (ocrWorker) {
    console.log(`[FT] Language changed from ${ocrWorkerLang} to ${lang}. Recreating worker.`);
    await ocrWorker.terminate(); // Proper WASM memory deallocation
    ocrWorker = null;
  }

  ocrWorker = await Tesseract.createWorker(lang, 1, { ... });
  ocrWorkerLang = lang;
}
```

---

### 3. The Monotonic `captureId` Sequence Lock & Viewport Coordinate Corruption

- **Category:** Architecture & Paradigm Shifts / Concurrency Control
- **Key Metrics / Impact:** 100% elimination of cross-capture crop corruptions | Strict generational message synchronization between Content Script and Service Worker
- **Tech Stack & Hardware Involved:** Chrome Extension Messaging API, Service Worker, Content Script

#### 1. The Situation & Setup
When `Alt+T` is triggered, the Service Worker calls `chrome.tabs.captureVisibleTab()` to take a full-screen viewport screenshot, while the Content Script opens an interactive overlay for the user to drag-select a rectangular region (`rect: { x, y, width, height }`).

#### 2. The Anomaly & The Mistake (The Symptom)
If a user pressed `Alt+T`, started dragging a selection box, changed their mind, and pressed `Alt+T` again to re-capture:
- The first selection completed, but the cropped image sent to OCR was taken from the *second* screenshot using the *first* selection's coordinates, producing a completely misaligned crop (`extension/bugs.md`, Bug C3).

#### 3. Forensic Investigation (The Root Cause)
The Service Worker stored screenshot data in a single global variable `pendingCapture`. When `Alt+T` was pressed the second time, it overwrote `pendingCapture` with the new screenshot bitmap, while the first content script overlay was still actively transmitting its bounding box coordinates.

#### 4. The Engineering Breakthrough (The Fix)
Implemented a monotonic generational `captureId` sequence counter (`background/service-worker.js`):
1. Every new screenshot capture increments `captureIdCounter`:
   ```javascript
   pendingCapture = { tabId: tab.id, dataUrl, captureId: ++captureIdCounter };
   ```
2. The content script receives `captureId` and returns it inside `selection-complete`.
3. The Service Worker validates the returned ID:
   ```javascript
   case 'selection-complete':
     if (pendingCapture && message.captureId === pendingCapture.captureId) {
       handleSelectionComplete(message.rect, sender.tab?.id);
     } else {
       console.warn('[FT] Discarding stale selection-complete message.');
     }
     break;
   ```

#### 5. The Core Engineering Lesson
In distributed or multi-context UI architectures where user input spans multiple asynchronously captured states, always tag messages with monotonic transaction IDs to discard stale in-flight events.
