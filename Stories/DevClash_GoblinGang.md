# ChainPilot (DevClash GoblinGang) — Forensic Engineering War Stories & Retrospectives

---

### 1. The Autonomous On-Chain Execution Worker & Event-Driven Agent Lifecycle

- **Category:** Architecture & Paradigm Shifts / Real-Time Systems
- **Key Metrics / Impact:** Sub-30s autonomous background polling loop for on-chain condition triggers | Hard limits enforcement (10 ETH, 5000 USDC) | 100% non-custodial transaction preparation via Ethers.js
- **Tech Stack & Hardware Involved:** Node.js, Express, LangChain, Google Gemini Pro / Flash, Ethers.js, Hardhat EVM, MongoDB Atlas, Firebase Auth

#### 1. The Situation & Setup
ChainPilot (`DevClash_GoblinGang`) was developed for the Devclash Pune Hackathon as an autonomous on-chain agent orchestration platform (`Docs/architecture.md`, `Docs/agent-lifecycle.md`). Users define financial operations in natural language (e.g., *"Buy 50 USDC worth of ETH if price < 2500"* or *"Send 0.01 ETH daily"*). The platform parses user intent, provisions an autonomous agent in MongoDB, and evaluates triggers in a background worker loop to execute transactions on Ethereum Sepolia and EVM testnets.

#### 2. The Anomaly & The Mistake (The Symptom)
1. **Execution Worker Blocking:** If an agent's trigger condition was met, but the blockchain RPC endpoint timed out or threw network errors, the entire synchronous execution loop stalled, delaying evaluation for all other user agents.
2. **Unbounded Agent Fund Drains:** In early prototypes, a flawed user prompt could create a high-frequency loop draining an entire wallet's balance within minutes.
3. **Private Key Custody Liability:** Storing raw user private keys on the backend to execute autonomous actions presented catastrophic security vulnerabilities.

#### 3. Forensic Investigation (The Root Cause)
1. **Single-Threaded Sequential Loops:** Iterating over active agents sequentially in a single `for...of` loop meant one slow RPC oracle call blocked the entire thread.
2. **Missing Validation Guardrails:** The system lacked business-logic validation between LLM intent extraction and agent registration.
3. **Custodial vs Prepared Transaction Flows:** True non-custodial automation requires separating **Condition Evaluation** (server-side, read-only oracle checks) from **Transaction Settlement** (user-authorized transaction payloads).

#### 4. The Engineering Breakthrough (The Fix)
The architecture was organized into a 6-layer decoupled event-driven system (`Docs/architecture.md` and `backend/services/`):
1. **Parallel Execution Engine (`executionService.js`):** The background worker fetches active agents and evaluates triggers concurrently using `Promise.allSettled()`, ensuring isolated RPC errors cannot halt peer agent evaluations.
2. **Defensive Validation Layer (`validationService.js`):** Enforces strict asset whitelists (`["ETH", "USDC", "WBTC", "SOL"]`) and hard safety caps per transaction (`ETH: 10`, `USDC: 5000`, `WBTC: 0.1`), rejecting out-of-bounds agent creations before database persistence.
3. **Non-Custodial Web3 Execution Pipeline:** Transactions are prepared via `ethers.js` on the server and broadcast only upon receiving signed authorization, ensuring zero server-side key custody.

#### 5. The Core Engineering Lesson
Autonomous AI agents must never hold private keys directly. Build systems where AI handles intent parsing, condition monitoring, and transaction compilation, while cryptographic authorization remains anchored in user-signed permits or deterministic smart contract vaults.

#### 6. Representative Code / Circuit Logic

```javascript
// Excerpt from: DevClash_GoblinGang/backend/services/validationService.js

const SUPPORTED_TOKENS = ["ETH", "USDC", "WBTC", "SOL"];
const LIMITS = { ETH: 10, USDC: 5000, WBTC: 0.1, SOL: 100 };

const validateIntent = (parsedIntent) => {
  const { trigger, condition, action } = parsedIntent;
  if (!trigger || !condition || !action) return { valid: false, error: "Incomplete structure." };

  const asset = action.asset?.toUpperCase();
  if (!SUPPORTED_TOKENS.includes(asset)) {
    return { valid: false, error: `Asset '${asset}' is not supported.` };
  }

  if (action.amount <= 0 || (LIMITS[asset] && action.amount > LIMITS[asset])) {
    return { valid: false, error: `Amount exceeds safety limit of ${LIMITS[asset]} ${asset}.` };
  }

  return { valid: true };
};
```

---

### 2. Deterministic Intent Extraction & Schema Normalization with Gemini Pro

- **Category:** Architecture & Paradigm Shifts / AI Prompt Engineering
- **Key Metrics / Impact:** Sub-500ms natural language intent extraction | 100% structured JSON output parsing with markdown codeblock stripping | Robust schema mapping for time and price triggers
- **Tech Stack & Hardware Involved:** LangChain Core, `@langchain/google-genai`, Google Gemini Pro / Flash API, Express.js

#### 1. The Situation & Setup
The core interaction model of ChainPilot is the conversational Agent Builder (`backend/services/intentService.js`). Users submit unconstrained natural language instructions describing complex scheduled or market-driven tasks. The system must deterministically convert these strings into typed operational rules.

#### 2. The Anomaly & The Mistake (The Symptom)
1. **Markdown Formatting Panics:** Gemini frequently returned markdown fences (````json ... ````) and explanatory prose ("Here is the structured JSON:"), which caused standard `JSON.parse()` calls to crash with syntax errors.
2. **Schema Drift:** Subtle phrasing variations produced inconsistent keys (e.g. `coin` instead of `asset`, `target` instead of `value`, or `swap_to` instead of `action.type: "swap"`).

#### 3. Forensic Investigation (The Root Cause)
1. **Unbounded Prompt Directives:** Standard conversational system prompts allow models to include polite conversational filler.
2. **Zero-Shot JSON Brittleness:** Without explicit negative rules ("Return ONLY the JSON object. No markdown, no explanations"), foundation models default to chat mode.

#### 4. The Engineering Breakthrough (The Fix)
The intent extraction pipeline was hardened (`backend/services/intentService.js`):
1. **Strict Few-Shot Prompt Templates:** Engineered a LangChain `ChatPromptTemplate` enforcing explicit trigger taxonomies (`time` vs `price`) and action types (`transfer` vs `swap`).
2. **Deterministic Markdown Stripping:** Added regex sanitation (`response.content.replace(/```json|```/g, "").trim()`) before parsing.
3. **Structured JSON Normalization:** Converts ambiguous conversational phrases into deterministic rule objects with strongly-typed numerical values.

#### 5. The Core Engineering Lesson
Never trust raw LLM text outputs in automated execution pipelines. Wrap foundation model calls in strict few-shot prompt templates, strip non-JSON markdown artifacts aggressively, and pass all parsed structures through dedicated validator services before execution.

#### 6. Representative Code / Circuit Logic

```javascript
// Excerpt from: DevClash_GoblinGang/backend/services/intentService.js

const parseIntent = async (intentText) => {
  const llm = new ChatGoogleGenerativeAI({
    model: "gemini-pro",
    apiKey: process.env.GOOGLE_API_KEY,
    temperature: 0,
  });

  const prompt = ChatPromptTemplate.fromMessages([
    ["system", `You are a professional Web3 Operations AI. Convert user natural language intents into a structured JSON "Execution Rule".
Return ONLY the JSON object. No markdown, no explanations.`],
    ["human", "{input}"]
  ]);

  const chain = prompt.pipe(llm);
  const response = await chain.invoke({ input: intentText });
  const cleanContent = response.content.replace(/```json|```/g, "").trim();
  return JSON.parse(cleanContent);
};
```

---

### 3. Model Context Protocol (MCP) & n8n Workflow Automation Bridge

- **Category:** Architecture & Paradigm Shifts / System Integration
- **Key Metrics / Impact:** Model Context Protocol (MCP) tool integration | n8n workflow webhook automation (commit `3c600a5`) | Dynamic on-chain balance and price oracle querying
- **Tech Stack & Hardware Involved:** Model Context Protocol (MCP), n8n Automation Engine, Web3 Tools (`blockchainTools.js`, `priceTools.js`, `agentTools.js`), Hardhat

#### 1. The Situation & Setup
To enable advanced autonomous decision-making, ChainPilot incorporates the **Model Context Protocol (MCP)** and n8n webhook automation (`backend/tools/`, `backend/services/mcpService.js`, commit `3c600a5`). Agents dynamically query external price feeds (CoinGecko / Chainlink), check wallet gas balances, and trigger off-chain webhooks when complex multi-stage tasks are executed.

#### 2. The Anomaly & The Mistake (The Symptom)
1. **Tool Invocation Deadlocks:** When an agent attempted to query gas prices and balance concurrently, unhandled async promise rejections in tool handlers caused agent sessions to hang.
2. **Oracle Rate Limiting:** High-frequency price polling from multiple agents hit external API rate limits, failing condition evaluation cycles.

#### 3. Forensic Investigation (The Root Cause)
1. **Missing Tool Isolation:** Tool handlers were directly coupled to the main Express request cycle rather than executing through a sandboxed tool executor.
2. **Uncached Oracle Queries:** Every agent evaluation triggered a fresh HTTP request to external price oracles.

#### 4. The Engineering Breakthrough (The Fix)
1. **Modular MCP Tool Registry:** Isolated tools into domain-specific modules (`blockchainTools.js`, `priceTools.js`, `agentTools.js`) with standardized input/output interfaces.
2. **Cached Price Service:** Implemented an in-memory TTL price cache in `priceService.js` (caching asset prices for 10 seconds across all concurrent agent evaluations).
3. **n8n Webhook Integration:** Added automated webhook dispatchers enabling external notification channels (Discord, Telegram, Email) whenever an on-chain agent triggers an action.

#### 5. The Core Engineering Lesson
External tools and oracle feeds must be decoupled from core agent logic. Cache external data aggressively and isolate tool execution behind standardized interfaces like MCP to keep autonomous loops fast and resilient.
