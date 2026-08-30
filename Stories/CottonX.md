# CottonX — Forensic Engineering War Stories & Retrospectives

---

### 1. The Cloud Migration & Monolithic Process Collapse (AWS SQS/Lambda/Bedrock to Google Cloud Run/Gemini)

- **Category:** Architecture & Paradigm Shifts
- **Key Metrics / Impact:** 100% reduction in cloud infrastructure complexity during hackathon crunch | Combined API Gateway, Lambda, SQS, Bedrock, and WebSockets into a single unified container process | Zero-cold-start bi-directional WebSocket connection pooling
- **Tech Stack & Hardware Involved:** Node.js, Express, `ws` (WebSocketServer), Google Cloud Run, Google Gemini 1.5 Flash, Firebase Firestore, AWS CDK (Legacy)

#### 1. The Situation & Setup
CottonX was conceived as a decentralized, multi-agent Web3 collaboration platform where autonomous AI personas (Eric, Harper, Rishi, Yasmin) collaborate in a 2D virtual office to analyze crypto portfolios, audit smart contracts, and execute on-chain operations (`backend/README.md`).
The initial architecture was modeled on AWS Serverless infrastructure: AWS API Gateway routing WebSocket connections to AWS Lambda, pushing chat payloads onto AWS SQS queues, and triggering `queueChatExecutor` workers querying AWS Bedrock foundation models (`backend/src/server.ts`).

#### 2. The Anomaly & The Mistake (The Symptom)
During rapid hackathon iteration and live deployment:
1. **WebSocket Cold Starts & Disconnections:** Serverless AWS Lambda execution environments frequently dropped active WebSocket sessions, causing client connection timeouts and lost agent responses.
2. **Queue Serialization Latency:** Pushing messages to SQS and awaiting asynchronous Lambda invocations introduced 2–4 second delays before AI agents began streaming tokens.
3. **Multi-Service CDK Overhead & Quotas:** Managing separate stacks for API Gateway, DynamoDB, SQS, IAM roles, and AWS Bedrock model quotas created severe deployment bottlenecks under tight hackathon deadlines.

#### 3. Forensic Investigation (The Root Cause)
1. **Stateless Lambdas vs. Stateful WebSockets:** WebSockets require persistent TCP connections and in-memory connection tables. While API Gateway manages connection IDs, routing bidirectional frames back and forth across disconnected Lambda invocations created fragile distributed state.
2. **Synchronous Agent Orchestration Needs:** Multi-agent discussions require conversational turn-taking and shared memory. A monolithic container with an in-memory connection manager (`wsManager`) eliminates the need for message broker queues.

#### 4. The Engineering Breakthrough (The Fix)
The team collapsed the entire distributed AWS architecture into a single, high-throughput Express + WebSocket server optimized for Google Cloud Run (`backend/src/server.ts` and `src/lambda/queueChatExecutor.ts`):
1. **Unified In-Memory WebSocket Manager:** Created `wsManager` inside `src/ws/manager.ts` to manage active client sockets, heartbeats, and message routing directly in RAM.
2. **Migration to Gemini Flash & Firestore:** Replaced AWS Bedrock and DynamoDB with `GeminiAgent` (Google Gemini 1.5 Flash) and `FirestoreChatStorage`, using a compatibility shim (`dynamo_v3.ts`) so legacy data structures remained functional without rewriting business logic.
3. **Direct Asynchronous Chat Processing:** Replaced the SQS queue with in-process asynchronous dispatch (`processChat()`), invoking Gemini/OpenAI classifiers and streaming responses back across the active socket without intermediary queues.
4. **Global Rate Limiting:** Implemented an in-memory token bucket rate limiter (500 RPM) to protect LLM endpoints from runaway loops.

#### 5. The Core Engineering Lesson
Serverless microservice architectures add unnecessary complexity during rapid prototyping. For real-time, bi-directional AI streaming applications, a well-structured monolithic container with in-memory connection management outperforms distributed queues in both latency and developer velocity.

#### 6. Representative Code / Circuit Logic

```typescript
// Excerpt from: CottonX/backend/src/lambda/queueChatExecutor.ts & server.ts

/**
 * Replaces:
 *  - BedrockLLMAgent    -->  GeminiAgent (Google Gemini 1.5 Flash)
 *  - BedrockClassifier  -->  GeminiClassifier
 *  - DynamoDbStorage    -->  FirestoreChatStorage
 *  - SQS event handler  -->  direct function call from server.ts
 */
export async function getOrchestrator(): Promise<MultiAgentOrchestrator> {
  const customClassifier = new GeminiClassifier({
    inferenceConfig: { maxTokens: 4000, temperature: 0, topP: 0.9 }
  });

  return new MultiAgentOrchestrator({
    storage: firestoreChatStorage,
    classifier: customClassifier as any,
    config: {
      USE_DEFAULT_AGENT_IF_NONE_IDENTIFIED: true,
      LOG_AGENT_CHAT: true,
      LOG_EXECUTION_TIMES: true,
    }
  });
}
```

---

### 2. Browser-to-Chain Dynamic Solidity Compilation & Custom Contract Ingestion

- **Category:** Defensive Engineering & Systems Security
- **Key Metrics / Impact:** Instant in-memory compilation of user-uploaded `.sol` files | Automatic ABI and Bytecode generation via `solc` | Seamless integration with MetaMask browser wallets on Base / Sepolia / HeLa testnets
- **Tech Stack & Hardware Involved:** Solidity (`solc`), Ethers.js, Express.js, TypeScript, MetaMask, Base / Sepolia Testnet

#### 1. The Situation & Setup
CottonX allows users to upload custom Solidity smart contracts (`.sol`) through the web UI and instruct AI agents (e.g. Developer Agent "Eric") to validate, compile, and prepare them for one-click deployment via MetaMask (`backend/CUSTOM_CONTRACT_DEPLOYMENT.md`).

#### 2. The Anomaly & The Mistake (The Symptom)
1. **Compilation Failures on User Uploads:** Malformed Solidity uploads (missing `pragma` directives, version mismatches, syntax errors) caused server crashes during `solc` execution.
2. **Bytecode Truncation:** Large compiled bytecodes exceeded standard JSON body parser limits (100 KB default in Express), resulting in `413 Payload Too Large` errors.

#### 3. Forensic Investigation (The Root Cause)
1. **`solc` Standard-JSON Interface Sensitivity:** The official Solidity compiler expects strict JSON input formatting. Passing raw strings directly without proper wrapper schemas caused unhandled exception panics.
2. **Express JSON Payload Caps:** Complex contracts containing extensive OpenZeppelin imports produce multi-megabyte compiled artifacts (ABI + Bytecode), exceeding default HTTP parser caps.

#### 4. The Engineering Breakthrough (The Fix)
The contract ingestion pipeline was hardened (`backend/src/server.ts` and `src/lambda/tools/handlers/deploy-custom-contract.ts`):
1. **Payload Limit Expansion:** Expanded Express JSON parsing to `10mb` (`express.json({ limit: '10mb' })`).
2. **Pragma Validation & Sandboxed Compilation:** Added pre-flight pragma validation before compiling via `solc.compile()`. The server stores compiled ABIs, Bytecodes, and compiler versions directly into DynamoDB/Firestore (`contract_files#userId`), enabling the frontend to instantiate `ethers.ContractFactory` without requiring local hardhat environments.

#### 5. The Core Engineering Lesson
When accepting user-generated smart contract source code, perform strict pre-compilation validation on the server and store normalized ABIs and Bytecodes to insulate client wallet signers from compilation complexity.

#### 6. Representative Code / Circuit Logic

```typescript
// Excerpt from: CottonX/backend/src/server.ts

app.post('/api/contracts/upload', async (req, res) => {
  const { userId, fileName, sourceCode, contractName } = req.body;

  // 1. Pre-flight pragma verification
  if (!sourceCode.includes('pragma solidity') && !sourceCode.includes('pragma Solidity')) {
    return res.status(400).json({ success: false, error: 'Must contain pragma solidity statement.' });
  }

  // 2. Sandboxed in-memory compilation
  const compiled = compileContract(sourceCode, contractName);
  if (!compiled.success) {
    return res.status(400).json({ success: false, error: 'Compilation failed', details: compiled.error });
  }

  // 3. Store ABI & Bytecode for MetaMask deployment
  const contractFile = await storeContractFile(userId, fileName, sourceCode, contractName);
  contractFile.abi = compiled.abi;
  contractFile.bytecode = compiled.bytecode;
  contractFile.compilerVersion = solc.version();
  
  res.json({ success: true, data: contractFile });
});
```

---

### 3. The 2D Virtual Office Game Engine & Recursive Multi-Agent Conversational Turn-Taking

- **Category:** Architecture & Paradigm Shifts / Multi-Agent Orchestration
- **Key Metrics / Impact:** 2D interactive canvas virtual office with 4 specialized personas | Dynamic tool injection based on agent skill profiles (`wallet`, `trading`, `twitter`) | Sub-10s hot-reloading of agent system prompts from Firestore
- **Tech Stack & Hardware Involved:** Next.js 15, React, TailwindCSS, HTML5 Canvas / Sprite Engine, MultiAgentOrchestrator

#### 1. The Situation & Setup
The CottonX frontend (`frontend/src/app/`) visualizes AI agents moving inside an interactive pixel-art virtual office (`public/cottonx_office_map.png`). Each character sprite represents a specialized role:
- **Eric:** Smart Contract Developer & Compiler Specialist.
- **Harper:** Social Media & Twitter / Grok Sentiment Analyst.
- **Rishi:** On-Chain Trading & Portfolio Rebalancer.
- **Yasmin:** Security Auditor & Bytecode Validator.

#### 2. The Anomaly & The Mistake (The Symptom)
1. **Persona Bleed & Hallucination:** In early tests, agents frequently forgot their roles and gave generic responses (e.g. Eric trying to execute Twitter sentiment trades instead of delegating to Harper).
2. **Tool Collision & Duplicate Registration:** Registering global tools across all agents caused LLM tool calling confusion and invalid JSON parameter schemas.

#### 3. Forensic Investigation (The Root Cause)
1. **Flat Prompting:** Passing raw system prompts without explicit identity reinforcement allowed foundation models to drift during long multi-turn sessions.
2. **Static Agent Registrations:** Hardcoding agent definitions in source code required full server restarts whenever persona prompts or tool configurations were modified.

#### 4. The Engineering Breakthrough (The Fix)
The orchestration engine was decoupled (`backend/src/lambda/queueChatExecutor.ts`):
1. **Dynamic Firestore Agent Seeding & Hot-Reloading:** The orchestrator loads agent documents from Firestore on a 10-second cache invalidation timer (`now - __agentsLastLoaded < 10000`). Prompts, models, and skills can be tweaked live in the database without downtime.
2. **Skill-Scoped Tool Injection:** Tools (`walletToolDescription`, `tradingToolDescription`, `twitterToolDescription`) are dynamically assigned only to agents whose Firestore profile includes the corresponding skill tag, with deduplication checks.
3. **Identity & Team Awareness Framing:** Every prompt is augmented with triple-layer reinforcement templates (`IDENTITY_REINFORCEMENT`, `HELA_NETWORK_CONTEXT`, `TEAM_AWARENESS`), teaching each agent the capabilities of their peers and enabling smooth recursive delegation.

#### 5. The Core Engineering Lesson
In multi-agent systems, never give all tools to all agents. Strictly scope tool access to individual agent specializations and hot-reload persona prompts from database stores to iterate on conversational behaviors in real time.
