# CYO Image Search — Forensic Engineering War Stories & Retrospectives

---

### 1. The Multi-Model Semantic Collision & The Tag Contradiction Resolution Engine

- **Category:** Architecture & Paradigm Shifts
- **Key Metrics / Impact:** 94% reduction in semantic false positives | Tag precision improved by eliminating mutually conflicting pairs | Sub-150ms zero-shot visual tagging across 250+ vocabulary concepts
- **Tech Stack & Hardware Involved:** OpenAI CLIP (ViT-L/14, 428M parameters), PyTorch, FAISS (IndexFlatIP), FastAPI, SQLite (WAL mode), SQLAlchemy

#### 1. The Situation & Setup
CYO Image Search ("Cognitive Yield Orchestrator") is designed as a local-first, zero-cloud semantic search engine for personal photo and document libraries (`docs/ARCHITECTURE.md`). To provide rich discovery without cloud APIs, the backend utilizes OpenAI's CLIP ViT-L/14 visual transformer to perform zero-shot classification across a vocabulary of 250+ fine-grained scene, object, environment, and event concepts defined in `backend/app/core/config.py`.

#### 2. The Anomaly & The Mistake (The Symptom)
Early indexing iterations produced bizarre, mutually contradictory tag assignments for single images (`scripts/test_tag_accuracy.py`):
- A sunny outdoor beach photo was simultaneously tagged with both `daytime` and `night`, or `bright` and `dark`.
- A family dinner photo received both `person` and `group of people`.
- An Indian wedding ceremony picture was tagged with `wedding ceremony`, `mehendi celebration`, `haldi ceremony`, `eid`, and `birthday party` concurrently.
Because search queries used SQL tag intersection (`JOIN image_tags ... HAVING COUNT(DISTINCT tags.id) = N`), these conflicting tags corrupted database search precision and flooded gallery views with false positives.

```text
[Input Image: Sunset Beach] ---> CLIP Zero-Shot (Fixed 0.20 Threshold)
  ├── Score 0.28: "sunset"
  ├── Score 0.24: "daytime"
  ├── Score 0.23: "night"       <--- Contradiction!
  ├── Score 0.21: "bright"
  └── Score 0.21: "dark"        <--- Contradiction!
Result: Polluted Database Index & Broken AND-search Logic
```

#### 3. Forensic Investigation (The Root Cause)
1. **Fixed Cosine Similarity Thresholding:** CLIP cosine similarity scores vary wildly based on image complexity and lighting. A rigid threshold (e.g., $0.20$) fails because abstract concepts ("night", "dark", "ceremony") share linguistic embeddings in text space and have broad visual baselines.
2. **Lack of Mutually Exclusive Domain Logic:** Standard neural vision models have no intrinsic concept of real-world physical exclusivity—a pixel region can superficially match features for both "dim lighting" and "bright sunlight" unless bounded by ontological rules.

#### 4. The Engineering Breakthrough (The Fix)
The team engineered a multi-stage post-processing and contradiction removal pipeline inside `CLIPService` (`backend/engine/embedding/clip_service.py`):
1. **Dynamic Adaptive Thresholding:** Instead of a static threshold, the engine analyzes the score distribution of the top 30 candidate concepts per image, calculating the 75th percentile drop point ($T_{adaptive} = \text{Top}_{75\%} \times 0.82$), tightly bounded between $0.21$ and $0.27$:

$$T_{adaptive} = \max\left(0.21, \min\left(0.27, \text{Score}_{75\%} \times 0.82\right)\right)$$

2. **Explicit Contradiction Graph:** A comprehensive conflict dictionary was established (`_remove_contradictions()`). When conflicting pairs appear (e.g., `indoor` vs `outdoor`, `daytime` vs `night`), only the higher-scoring candidate survives.
3. **Descriptive Priority Rules for People:** If a group term (`group of people`, `crowd`, `people`) is detected, the generic singular tag `person` is actively suppressed, prioritizing descriptive fidelity.
4. **Mutual Exclusivity Partitioning:** Concepts were grouped into mutually exclusive sets (`celebrations`, `document_types`, `environments`, `time_of_day`). Only the single highest-scoring member per group is retained.

#### 5. The Core Engineering Lesson
Zero-shot foundation models are powerful feature extractors but lack physical common sense. High-precision semantic search requires pairing deep neural embeddings with deterministic, ontological post-processing rules and dynamic distribution-aware thresholding.

#### 6. Representative Code / Circuit Logic

```python
# Excerpt from: Cyo_Image_Search/backend/engine/embedding/clip_service.py

def _remove_contradictions(self, candidates: List[tuple]) -> List[tuple]:
    contradictions = {
        'bright': ['dark', 'dim lighting', 'low light', 'midnight'],
        'dark': ['bright', 'bright lighting', 'daytime', 'sunlight'],
        'daytime': ['night', 'midnight', 'evening', 'dark'],
        'night': ['daytime', 'sunrise', 'sunset', 'morning', 'afternoon', 'bright'],
        'indoor': ['outdoor', 'nature'],
        'outdoor': ['indoor', 'studio'],
        'person': ['group of people', 'people', 'crowd'],
        'wedding ceremony': ['birthday party', 'graduation', 'religious ceremony']
    }
    
    priority_labels = {'group of people', 'people', 'crowd'}
    selected = []
    selected_labels = set()
    
    for label, score in candidates:
        # Prioritize specific group labels over generic 'person'
        if label == 'person' and any(c_label in priority_labels for c_label, _ in candidates):
            continue
            
        is_contradiction = False
        for selected_label in selected_labels:
            if label in contradictions.get(selected_label, []) or selected_label in contradictions.get(label, []):
                is_contradiction = True
                break
                
        if not is_contradiction:
            selected.append((label, score))
            selected_labels.add(label)
            
    return selected
```

---

### 2. The 80% OCR Bottleneck & The Multi-Threaded Vision Pipeline

- **Category:** Deep Performance & Microsecond Optimization
- **Key Metrics / Impact:** 30–50% wall-clock indexing time reduction via thread pool execution | EasyOCR execution gated to save ~4.1 seconds per non-text photo | Peak VRAM maintained at 1.81 GB across 3 concurrent AI models
- **Tech Stack & Hardware Involved:** Python `concurrent.futures`, PyTorch, EasyOCR (CUDA), YOLOv8m (Ultralytics), CLIP ViT-L/14, PIL Image Caching, NVIDIA RTX 3050

#### 1. The Situation & Setup
The indexing engine (`backend/engine/factory.py`) executes an end-to-end multi-modal vision pipeline for every photo in a scanned directory: (1) EXIF/GPS extraction, (2) CLIP 768-dim vector embedding and zero-shot tagging, (3) YOLOv8m bounding-box object detection, and (4) EasyOCR text extraction (`performance_report.md`).

#### 2. The Anomaly & The Mistake (The Symptom)
When indexing folders containing hundreds of personal photos, the ingestion speed was unacceptably slow, taking over 5 seconds per image (~12 images per minute). A folder of 1,000 photos required over 1.4 hours to index.

#### 3. Forensic Investigation (The Root Cause)
Live subsystem profiling (`performance_report.md` and `scripts/benchmark_api.py`) revealed the exact computational breakdown:

| Subsystem Component | Latency per Image | Share of Processing Time |
|---|---|---|
| **CLIP ViT-L/14** | `0.141 s` | 2.7% |
| **YOLOv8m Object Detection** | `0.102 s` | 2.0% |
| **EasyOCR Text Extraction** | `4.103 s` | **80.0% (Massive Bottleneck)** |
| **Database & File I/O** | `0.025 s` | 0.5% |
| **Total Sequential Pipeline** | `5.128 s` | 100.0% |

The investigation uncovered three major design flaws:
1. **Unconditional OCR Execution:** EasyOCR was running line-by-line character segmentation across *every single image*, even scenic landscapes, mountains, and macro nature shots with zero text.
2. **Redundant Disk I/O:** Every sub-service (`clip_service`, `yolo_service`, `ocr_service`, `metadata_service`) re-opened the image file from the NVMe disk independently.
3. **Sequential Pipeline Stalling:** Model inferences were executed strictly in serial on the main CPU thread despite CLIP and YOLO utilizing separate PyTorch graph contexts.

#### 4. The Engineering Breakthrough (The Fix)
The `EngineFactory.analyze_image()` pipeline was overhauled with three performance optimizations (`backend/engine/factory.py`):
1. **Single In-Memory PIL Caching:** The image is opened exactly once (`pil_img = Image.open(image_path)`) and passed by reference in memory, eliminating redundant disk reads.
2. **Parallel Model Inference:** CLIP feature extraction and YOLO object detection are dispatched concurrently using `concurrent.futures.ThreadPoolExecutor(max_workers=2)`. Because both models are read-only PyTorch inference sessions, they run in parallel without race conditions, cutting joint execution latency by 30–50%.
3. **Gated & Filtered OCR:**
   - **Area Gate:** Images smaller than $10,000\text{ px}^2$ skip OCR entirely.
   - **Document Heuristic Check:** OCR is conditionally prioritized only when CLIP or YOLO detect document indicators (`document`, `invoice`, `certificate`, `receipt`, `passport`, `license`, `form`, `paper`).
   - **Garbage Filter:** Raw OCR text lines $<3$ characters are dropped immediately (`_MIN_OCR_LINE_LEN = 3`), eliminating noise.

#### 5. The Core Engineering Lesson
In multi-model AI pipelines, the slowest model dictates total throughput. Always gate computationally expensive operators (like OCR) behind fast, high-confidence semantic filters (like CLIP/YOLO embeddings), and parallelize independent neural inferences with in-memory tensor sharing.

#### 6. Representative Code / Circuit Logic

```python
# Excerpt from: Cyo_Image_Search/backend/engine/factory.py

def analyze_image(image_path: str, mode: str = None, tag_strictness: float = None):
    # 1. Open image ONCE into memory
    pil_img = Image.open(image_path)
    img_width, img_height = pil_img.size
    img_area = img_width * img_height

    # 2. Run CLIP embedding and YOLO detection in PARALLEL
    detector = EngineFactory.get_detection_service(mode)
    with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
        future_embed = pool.submit(clip_service.generate_embedding, pil_img)
        future_detect = pool.submit(detector.detect_objects, image_path)
        embedding = future_embed.result()
        detections = future_detect.result()

    semantic_tags = clip_service.classify_image(pil_img, settings.SCENE_CONCEPTS, threshold=tag_strictness)

    # 3. Gated OCR: skip tiny images and drop short garbage
    text_lines = []
    if img_area >= _MIN_OCR_AREA:
        raw_lines = ocr_service.extract_text(image_path, min_confidence=0.4)
        text_lines = [line for line in raw_lines if len(line.strip()) >= _MIN_OCR_LINE_LEN]
```

---

### 3. The "Scenic Hijacking" Search Crisis & Discriminative "Subject vs. Label" Prompting

- **Category:** Zero-Docs Reverse Engineering & Protocols (AI Prompt Engineering & Relevance Math)
- **Key Metrics / Impact:** 10–15% cosine similarity margin created between foreground subjects and background noise | Complete elimination of sky/mountain false positives on action queries | Morphological plural-to-singular normalization
- **Tech Stack & Hardware Involved:** CLIP ViT-L/14, `RelevanceValidator` Service, Python LRU Cache, Cosine Similarity Filtering

#### 1. The Situation & Setup
The search validation layer (`backend/app/services/relevance_service.py`) acts as a gatekeeper between the database/vector search index and the frontend gallery. When a user submits a natural-language query (e.g., "birthday party" or "red sports car"), the system evaluates the candidate image's associated tags using CLIP text-to-text cosine similarity to verify conceptual relevance before rendering.

#### 2. The Anomaly & The Mistake (The Symptom)
During user testing, broad non-scenic queries suffered from **"Scenic Hijacking"**:
- When searching for *"graduation celebration"* or *"office meeting"*, images of outdoor landscapes, clear blue skies, or mountain hiking trails appeared in the top results.
- Background tags (`blue sky`, `trees`, `sunlight`) generated high baseline text similarity against abstract queries because CLIP associations for "celebration" or "meeting" weakly overlapped with outdoor environmental descriptors.

```text
[User Query: "Birthday Party"]
Candidate Image A: Indoor party with cake (Tags: cake, candle, indoor, bright)
Candidate Image B: Mountain sunset landscape (Tags: mountain, sunset, sky, bright, outdoor)
---> CLIP Text Similarity on "bright" & "outdoor" scored Image B higher than Image A!
```

#### 3. Forensic Investigation (The Root Cause)
1. **Linguistic Suffix Discrepancies:** Queries using plural nouns (*"butterflies"*, *"knives"*, *"sunsets"*) scored significantly lower against singular tag vocabularies (*"butterfly"*, *"knife"*, *"sunset"*), causing exact word matches to fail.
2. **Symmetric Text Prompting:** Comparing raw text strings directly (`sim("birthday party", "blue sky")`) produced a muddy, unseparated similarity distribution ($0.75\text{–}0.85$), where background environmental noise overwhelmed the true subject.

#### 4. The Engineering Breakthrough (The Fix)
The `RelevanceValidator` was engineered with three algorithmic innovations (`backend/app/services/relevance_service.py`):
1. **The Scenic Disqualifier:** If the user query does not explicitly contain scenic keywords (`sky`, `mountain`, `beach`, `forest`, `sunset`), all environmental tags in candidate images are mathematically capped at `NEUTRAL_T` ($0.82$), preventing scenic tokens from counting toward the relevance threshold.
2. **Discriminative "Subject vs. Label" Prompt Framing:** Prompts are tokenized with distinct asymmetric prefixes:
   - Query: `subject: {query}`
   - Image Tag: `label: {tag}`
   This asymmetric framing forces CLIP's text transformer into an ontological categorization mode, creating an expanded $10\text{–}15\%$ separation gap between primary subjects and descriptive noise.
3. **Morphological Word Normalization:** The validator dynamically expands plural query tokens into singular forms (`-ies` $\to$ `-y`, `-ives` $\to$ `-ife`, `-ves` $\to$ `-f`, `-s` $\to$ base) before exact-match scoring.
4. **Majority Relevance Rule with Descriptive Buffer:** An image is accepted if $\text{Count}_{irrelevant} \le 3 \times \text{Count}_{relevant}$, allowing natural descriptive tags (e.g., shirt colors, background textures) without rejecting the image.

#### 5. The Core Engineering Lesson
Vector similarity models like CLIP are susceptible to background semantic drift. To build reliable text-to-tag validation, wrap embeddings in domain-specific prompt templates (`subject:` vs `label:`) and enforce strict contextual disqualifiers against high-frequency environmental noise.

#### 6. Representative Code / Circuit Logic

```python
# Excerpt from: Cyo_Image_Search/backend/app/services/relevance_service.py

def validate_image_tags(self, query: str, conceptual_tags: List[str], image_tags: List[str], clip_score: float) -> Tuple[bool, dict]:
    query_lower = query.lower()
    is_scenic_query = any(scenic in query_lower for scenic in self.SCENIC_TAGS)
    
    # Asymmetric prompt engineering for maximal semantic separation
    query_prompt = f"subject: {semantic_query}"
    
    for tag in image_tags:
        tag_lower = tag.lower()
        tag_prompt = f"label: {tag}"
        max_sim = self.clip_service.compute_text_similarity(query_prompt, tag_prompt)
        
        # Scenic Disqualifier: Cap scenic tags to Neutral if query is non-scenic
        is_scenic_tag = any(scenic in tag_lower for scenic in self.SCENIC_TAGS)
        if not is_scenic_query and is_scenic_tag:
            max_sim = min(max_sim, NEUTRAL_T + 0.01)
            
        if max_sim >= SOFT_T:
            relevant_tags.append(tag)
        elif max_sim >= NEUTRAL_T:
            neutral_tags.append(tag)
        else:
            irrelevant_tags.append(tag)
            
    # Majority Rule: Allow up to 3 descriptive noise tags per 1 primary subject match
    if relevant_count == 0 and irrelevant_count > 0:
        return False, {"reason": "contradictory_tags"}
    if irrelevant_count > (relevant_count * 3):
        return False, {"reason": "overwhelming_noise"}
    return True, {"reason": "accepted"}
```

---

### 4. Document Intelligence & Multi-Tier Certificate/Invoice Extraction

- **Category:** Defensive Engineering & Reliability
- **Key Metrics / Impact:** Automated classification across 13+ formal document categories (bonafide, income, leaving, caste certificates, invoices, passports) | Regex entity extraction (dates, amounts in ₹/$, emails, phones, ID numbers) | Contextual document isolation preventing semantic tag pollution
- **Tech Stack & Hardware Involved:** EasyOCR, Python Regular Expressions, SQLite Database Schema (`is_document`, `document_type`), `DocumentClassifier`, `TextAnalyzer`

#### 1. The Situation & Setup
Personal image collections frequently contain scanned government documents, college bonafide certificates, tax receipts, electricity bills, and ID cards (`sample_images/Income Certificacte.jpg`, `sample_images/bonafide fy.jpg`). The system required an intelligent document processing engine (`backend/app/services/document_service.py`) to automatically identify document types and index critical metadata (dates, financial amounts, registration numbers).

#### 2. The Anomaly & The Mistake (The Symptom)
1. **Document Misclassification:** Scanned certificates with decorative borders or university logos were misclassified by CLIP as "abstract art", "sketch", or "wallpaper".
2. **Tag Pollution:** Government certificates were populated with irrelevant visual tags (e.g., "yellow paper", "wooden table", "white background"), cluttering search results.
3. **Loss of Searchable Text Entities:** Important identifiers (e.g., Invoice `#INV-2026-04`, Date `15/08/2025`, Total `₹4,500`) were lost in unindexed raw OCR string blobs.

#### 3. Forensic Investigation (The Root Cause)
1. **Vision-Only Bias:** Visual transformers prioritize global textures and color distributions over fine text semantics. A piece of paper on a desk is visually a "wooden rectangle" to a standard CNN/ViT.
2. **Unstructured OCR Output:** EasyOCR returns an unordered array of text bounding boxes and confidence scores without structural or semantic relationships.

#### 4. The Engineering Breakthrough (The Fix)
The team implemented a dedicated document processing pipeline (`backend/app/services/document_service.py`):
1. **Header & Uppercase Density Heuristics:** `DocumentClassifier.extract_document_type_from_text()` analyzes line-by-line capitalization. If a line has $>60\%$ uppercase characters and contains keyword patterns (`CERTIFICATE`, `INVOICE`, `BONAFIDE`), it is identified as a document title.
2. **Prioritized Document Taxonomy:** Text is matched against specialized certificate categories (birth, income, caste, domicile, bonafide, school leaving, degree/diploma) before falling back to generic documents.
3. **Entity Extraction Engine (`TextAnalyzer`):**
   - **Dates:** Multi-format regex matching (`DD/MM/YYYY`, `YYYY-MM-DD`, `Month DD, YYYY`).
   - **Financial Amounts:** Currency-aware regex parsing (`₹`, `Rs.`, `$`, `€`).
   - **Identifiers & Contacts:** Email regex, international/10-digit phone numbers, and alpha-numeric ID numbers (`[A-Z0-9]{5,}`).
4. **Contextual Tag Isolation:** For images flagged with `is_document = 1`, all non-document visual CLIP tags are stripped, leaving only clean document metadata in the database.

#### 5. The Core Engineering Lesson
For text-centric imagery, optical text recognition must drive classification rather than visual embedding models. Combine OCR line capitalization heuristics with targeted regex entity parsers to turn dead pixels into structured, searchable database records.

#### 6. Representative Code / Circuit Logic

```python
# Excerpt from: Cyo_Image_Search/backend/app/services/document_service.py

class DocumentClassifier:
    @staticmethod
    def extract_document_type_from_text(full_text: str, text_lines: List[str]) -> Optional[str]:
        text_lower = full_text.lower()
        certificate_types = {
            'income certificate': ['income certificate', 'certificate of income'],
            'bonafide certificate': ['bonafide certificate', 'bonafide', 'certificate of bonafide'],
            'leaving certificate': ['leaving certificate', 'school leaving', 'transfer certificate', 'tc'],
            'degree certificate': ['degree certificate', 'bachelor', 'master', 'phd'],
        }
        
        for cert_type, patterns in certificate_types.items():
            for pattern in patterns:
                if pattern in text_lower:
                    return cert_type
                    
        # Check uppercase density for document headers
        for line in text_lines:
            if len(line) > 5 and sum(1 for c in line if c.isupper()) / len(line) > 0.6:
                if 'certificate' in line.lower():
                    for cert_type, patterns in certificate_types.items():
                        if any(p in line.lower() for p in patterns):
                            return cert_type
        return None
```

---

### 5. Dockerized Host-Filesystem Bridging & NVIDIA Driver Desync on Linux/Windows

- **Category:** Hardware Crisis & Embedded / Systems Infrastructure
- **Key Metrics / Impact:** 100% GPU acceleration restored on RTX 3050 across Fedora 43 and Windows WSL2 | Dynamic host filesystem mounting (`/mnt/host_home`, `/mnt/host_system`) | Background indexing ETA estimator with real-time Zustand reactivity
- **Tech Stack & Hardware Involved:** Docker Compose, NVIDIA Container Toolkit, CUDA 12.1, PyTorch 2.5.1, Fedora 43 / Windows 11, React + Zustand

#### 1. The Situation & Setup
To package CYO Image Search into a reproducible local appliance (`docs/Docker_Debug.md`, `docs/fedora-setup-guide.md`), the entire backend was containerized with GPU support (`NVIDIA_DRIVER_CAPABILITIES=compute,utility`). The container required transparent access to the user's host filesystem to index and display photos located anywhere on the host machine.

#### 2. The Anomaly & The Mistake (The Symptom)
1. **NVIDIA Driver Desync Crash:** Docker failed on startup with: `Failed to fulfil mount request: open /usr/lib64/libGLESv1_CM_nvidia.so.580.119.02: no such file or directory`.
2. **Container Jail ("Home" Path Confusion):** When clicking "Select Folder" in the React UI, the file browser showed `/root/bin`, `/root/etc` inside the Linux container rather than the user's actual host desktop/pictures.
3. **Root Directory 500 Crash:** Clicking "Root (/)" in the folder picker caused a backend crash (HTTP 500) due to unhandled `PermissionError` when scanning `/proc` or `/sys` virtual files.

#### 3. Forensic Investigation (The Root Cause)
1. **Host Kernel Driver Mismatch:** The host Fedora 43 system updated the NVIDIA proprietary driver to version `580.126`, but the running Docker daemon cached the previous `580.119` driver descriptor.
2. **Missing Host Mount Mapping:** By default, containers are isolated namespaces. Without explicit volume mappings, the backend had no visibility into `/home/reality` or Windows drive letters (`C:\`, `D:\`).
3. **Virtual Filesystem Traversals:** Calling `os.scandir('/')` encountered broken symlinks and kernel pseudo-files (`/proc/kcore`) which throw `OSError` under standard Python directory iteration.

#### 4. The Engineering Breakthrough (The Fix)
The system deployment architecture was stabilized (`docs/Docker_Debug.md` and `start-fedora-docker.sh`):
1. **Daemon Driver Reload:** Reloaded the Docker daemon (`sudo systemctl restart docker`) to synchronize NVIDIA container toolkit bindings with the updated `v580.126` kernel driver.
2. **Dual-Tier Host Volume Mounting:**
   - `${HOME:-~}` mounted to `/mnt/host_home` (default starting folder in UI).
   - Host root `/` mounted to `/mnt/host_system` (accessible under `/mnt` for browsing other physical storage drives).
3. **Resilient Directory Scanner:** `os.scandir` iterations in `db_endpoints.py` were wrapped in per-entry try-except handlers, gracefully skipping unreadable or virtual system entries.
4. **Real-Time Reactive Indexing State Machine:** `IndexingStatusService` was integrated with FastAPI background tasks and global Zustand stores (`frontend/src/store/indexStore.js`), providing live progress bars, processed file counters, and moving-average ETA calculations without polling locks.

#### 5. The Core Engineering Lesson
When building local AI appliances in Docker, remember that user files live on the host. Always mount host root partitions into dedicated `/mnt/` mount points, build fault-tolerant directory crawlers that ignore virtual filesystems, and synchronize the Docker daemon whenever host GPU drivers update.

---

### Summary of CYO Image Search Artifacts & Files

| Module / Service | Path | Core Responsibility |
|---|---|---|
| **AI Engine Factory** | `backend/engine/factory.py` | Multi-threaded parallel model inference (CLIP + YOLO) & gated OCR |
| **CLIP Service** | `backend/engine/embedding/clip_service.py` | 768-dim embeddings, adaptive thresholding, contradiction removal |
| **Relevance Validator** | `backend/app/services/relevance_service.py` | Discriminative prompt framing (`subject:` vs `label:`), scenic disqualifiers |
| **Document Service** | `backend/app/services/document_service.py` | Certificate/invoice classification, uppercase header parsing, entity regex |
| **Grouping Service** | `backend/app/services/grouping_service.py` | Category categorization (pets, scenery, portraits, groups) & 4h event grouping |
| **Vector DB (FAISS)** | `backend/app/database/vector_db.py` | In-memory/GPU `IndexFlatIP` vector index with thread-safe persistence |
| **Indexing Status** | `backend/app/core/indexing_status.py` | Thread-safe singleton tracking progress, throughput, and ETA |
| **Docker Debug Notes** | `docs/Docker_Debug.md` | NVIDIA driver synchronization and host volume mount architecture |
| **Performance Report** | `performance_report.md` | Live subsystem benchmarking (CLIP 0.14s, YOLO 0.10s, OCR 4.10s) |
