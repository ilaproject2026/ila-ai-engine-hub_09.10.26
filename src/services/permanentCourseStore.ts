import type {
  CourseChapter,
  ChatMessage,
  ChatSession,
  CoursePlan,
  AutonomousCoursePlan,
  CourseVersion,
  LibraryCourse,
  LibrarySlideItem,
} from './dbService';

export interface PermanentCourseItem {
  id: string;
  courseId: string;
  title: string;
  subtitle: string;
  category: string;
  overview: string;
  studiedBy: string;
  targetAudience: string;
  totalChapters: number;
  chapters: CourseChapter[];
  coursePlan?: CoursePlan;
  autonomousPlan?: AutonomousCoursePlan;
  messages: ChatMessage[];
  versions?: CourseVersion[];
  slideDecks?: Record<number, LibrarySlideItem[]>;
  isPermanent: boolean;
  locked: boolean;
  createdAt: number;
  updatedAt: number;
  lastDownloadedAt?: number;
  downloadCount?: number;
  sourceSessionId?: string;
  tags?: string[];
  rawCourseData?: any;
}

const LOCAL_STORAGE_KEY = 'ila_permanent_courses_v6';
const API_PERMANENT_ENDPOINT = '/api/permanent-courses';

/* =========================================================================
   PRE-SEEDED PRODUCTION MASTERCLASS COURSE (IN-CODE PERMANENT DATABASE)
   Allows continuous testing without re-generating courses or consuming tokens
   ========================================================================= */

export const PRESEEDED_ENTERPRISE_AI_COURSE: PermanentCourseItem = {
  id: 'perm_course_enterprise_ai_architecture_v1',
  courseId: 'perm_course_enterprise_ai_architecture_v1',
  title: 'Enterprise AI Architecture & Multi-Agent Engineering',
  subtitle: 'Autonomous Cognitive Workflows, Real-Time RAG Pipelines & Production LLM Serving',
  category: 'Enterprise Education',
  studiedBy: 'Enterprises & Business Leaders',
  targetAudience: 'Enterprises & Business Leaders',
  totalChapters: 4,
  isPermanent: true,
  locked: true,
  createdAt: 1789000000000,
  updatedAt: 1789000000000,
  downloadCount: 0,
  tags: ['Architecture', 'Multi-Agent', 'Enterprise AI', 'RAG', 'Production'],
  overview:
    'A comprehensive, enterprise-grade masterclass covering end-to-end cognitive architecture, autonomous multi-agent orchestration, advanced retrieval-augmented generation (RAG), and production inference optimization for enterprise systems.',
  chapters: [
    {
      id: 'ch_book_1',
      chapterNumber: 1,
      title: 'Book 1: Foundations of Cognitive Architecture & RAG Pipelines',
      summary: 'Theoretical underpinnings of transformer attention heads, context window mechanics, stateful agent loop architecture, and enterprise hybrid dense-sparse retrieval.',
      subTopics: [
        { id: 'sub_1_1', topicNumber: '1.1', title: 'Foundations of Modern Cognitive Architectures', summary: 'Separation of reasoning and persistent storage, sliding context windows, and deterministic guardrails.' },
        { id: 'sub_1_2', topicNumber: '1.2', title: 'Enterprise Retrieval-Augmented Generation (RAG)', summary: 'Hybrid dense-sparse retrieval, multi-vector embeddings, reciprocal rank fusion, and cross-encoder reranking.' },
      ],
      content: `# Book 1: Foundations of Cognitive Architecture & RAG Pipelines

### 1.1 Foundations of Modern Cognitive Architectures

[SLIDE: 1 | Foundations of Modern Cognitive Architectures | From Static LLMs to Stateful Reasoning Engines | Key Takeaways: Decoupling reasoning from storage ensures enterprise durability.]
[VIDEO_CUE: 00:00 - Introduction to Stateful Cognitive Loops]

#### Architectural Overview
Modern enterprise AI systems have evolved beyond simple monolithic chat completions into **stateful cognitive architectures**. A cognitive architecture separates high-level strategic reasoning from deterministic tool execution and data retrieval.

\`\`\`
+-------------------------------------------------------------+
|                Cognitive Orchestrator                       |
|  +-------------------+  +-------------------+  +----------+ |
|  | Context & Memory  |  | Reasoning Engine  |  | Tool Bus | |
|  +-------------------+  +-------------------+  +----------+ |
+-------------------------------------------------------------+
               |                       |
               v                       v
    [Vector Index / RAG]       [Autonomous Agents]
\`\`\`

#### Core Architectural Pillars
1. **Separation of Reasoning and Storage:** Foundation models serve as stateless reasoning engines, while external vector databases and SQLite provide durable state.
2. **Context Window Engineering:** Dynamic sliding windows, hierarchical context compression, and kv-cache utilization maximize reasoning depth while bounding latency.
3. **Deterministic Guardrails:** Semantic safety layers, JSON schema validators, and output parsers enforce strict contractual boundaries.

\`\`\`typescript
// Architectural contract for stateful cognitive loops
interface CognitiveLoopState {
  sessionId: string;
  stepIndex: number;
  memoryStore: DurableStore;
  toolRegistry: Map<string, ToolDefinition>;
  activeGuardrails: GuardrailPipeline[];
}
\`\`\`

#### Key Takeaways
- Cognitive architectures separate strategic planning from deterministic tool execution.
- External durable state stores prevent context window bloat and catastrophic forgetting.
- Structured schema validation ensures reliable orchestration in mission-critical environments.

---

### 1.2 Enterprise Retrieval-Augmented Generation (RAG)

[SLIDE: 2 | Production Hybrid RAG Architecture | Dense Semantics Combined with Lexical Precision | Key Takeaways: Hybrid dense-sparse retrieval prevents catastrophic terminology misses.]
[VIDEO_CUE: 03:45 - Hybrid Sparse-Dense Retrieval Architecture]

#### The Production RAG Pipeline
Naive vector search fails in production due to embedding collisions and semantic drift. Enterprise RAG combines **dense embeddings** (for semantic similarity) with **sparse BM25 lexical search** (for exact keyword/part-number matching).

\`\`\`
User Query ---> Hybrid Query Rewriter
                    |--> Dense Vector Search (HNSW)
                    |--> Sparse Lexical Search (BM25)
                    |--> Reciprocal Rank Fusion (RRF)
                    |--> Cross-Encoder Reranker
                    v
            Grounded LLM Generation
\`\`\`

#### Production Best Practices
- **Parent-Document Retrieval:** Index small semantic chunks for search precision, but inject the broader parent section into LLM context.
- **Cross-Encoder Reranking:** Re-score top 50 candidates using a dedicated cross-encoder before prompt assembly.
- **Strict Grounding Citations:** Enforce traceable snippet anchors for every factual claim.

\`\`\`python
# Hybrid RRF Fusion Algorithm
def reciprocal_rank_fusion(dense_ranks, sparse_ranks, k=60):
    scores = {}
    for rank, doc_id in enumerate(dense_ranks):
        scores[doc_id] = scores.get(doc_id, 0.0) + 1.0 / (k + rank)
    for rank, doc_id in enumerate(sparse_ranks):
        scores[doc_id] = scores.get(doc_id, 0.0) + 1.0 / (k + rank)
    return sorted(scores.items(), key=lambda x: x[1], reverse=True)
\`\`\`

#### Key Takeaways
- Hybrid dense-sparse search prevents accuracy degradation on technical terms.
- Cross-encoder reranking provides a 15-25% boost in contextual retrieval precision.
- Parent-document retrieval balances high search granularity with rich reading context.`,
      slides: [
        {
          slideNumber: 1,
          badge: 'Architecture 1.1',
          badgeColor: '#6366f1',
          title: 'Foundations of Modern Cognitive Architectures',
          subtitle: 'From Static LLMs to Stateful Reasoning Engines',
          bullets: [
            'Cognitive loops decouple strategic reasoning from deterministic execution.',
            'External memory stores replace volatile token context with durable state.',
            'Strict JSON contracts protect downstream APIs from hallucinations.',
          ],
          keyTakeaway: 'Separating reasoning from persistence is the cornerstone of enterprise AI reliability.',
          speakerNotes: 'Begin by explaining how enterprise AI shifted from naive prompts to stateful multi-agent systems.',
        },
        {
          slideNumber: 2,
          badge: 'RAG Pipeline 1.2',
          badgeColor: '#38bdf8',
          title: 'Production Hybrid RAG Architecture',
          subtitle: 'Dense Semantics Combined with Lexical Precision',
          bullets: [
            'BM25 + Dense Vectors eliminate blind spots in exact term search.',
            'Cross-Encoder Reranking filters out irrelevant noise before synthesis.',
            'Parent-Document retrieval ensures full contextual clarity.',
          ],
          keyTakeaway: 'Never rely on naive cosine similarity alone for enterprise documentation.',
          speakerNotes: 'Highlight why exact part numbers and financial figures require hybrid lexical search.',
        },
      ],
    },
    {
      id: 'ch_book_2',
      chapterNumber: 2,
      title: 'Book 2: Autonomous Multi-Agent Orchestration & Tool Systems',
      summary: 'Director-Worker agent topologies, reviewer-critic self-correction loops, strict JSON schema contracts, idempotency, and containerized tool execution.',
      subTopics: [
        { id: 'sub_2_1', topicNumber: '2.1', title: 'Multi-Agent Collaboration & Role Specialization', summary: 'Director-Worker topologies, peer-to-peer agent consensus, and hierarchical supervision.' },
        { id: 'sub_2_2', topicNumber: '2.2', title: 'Tool Execution, Function Calling & Schema Contracts', summary: 'Strict JSON Schema enforcement, timeout isolation, idempotency, and automated recovery.' },
      ],
      content: `# Book 2: Autonomous Multi-Agent Orchestration & Tool Systems

### 2.1 Multi-Agent Collaboration & Role Specialization

[SLIDE: 3 | Specialized Multi-Agent Topologies | Dividing Cognitive Labor for Flawless Execution | Key Takeaways: Cognitive decomposition is the secret to zero-hallucination agent systems.]
[VIDEO_CUE: 07:15 - Director-Worker Topologies and State Synchronization]

#### Agent Topology Patterns
In complex workflows, single prompts collapse under high cognitive load. Splitting responsibilities among **specialized agents** produces superior reliability:

\`\`\`
                  +-----------------------+
                  |    Director / Planner |
                  +-----------+-----------+
                              |
             +----------------+----------------+
             v                                 v
  +--------------------+             +--------------------+
  | Researcher Worker  |             | Code Author Worker |
  +----------+---------+             +---------+----------+
             |                                 |
             +----------------+----------------+
                              v
                  +-----------------------+
                  | Critic / Synthesizer  |
                  +-----------------------+
\`\`\`

1. **Director-Worker Topology:** A central planner decomposes the task and delegates specialized sub-goals to worker agents.
2. **Reviewer-Critic Loop:** A generator agent creates candidate outputs while a critic agent enforces rubric criteria and formatting constraints.
3. **Consensus Aggregators:** Multiple independent agents solve the same problem; a synthesizer combines the strongest reasoning branches.

#### Key Takeaways
- Specialized personas outperform generalist prompts on complex multi-step workflows.
- Critic-generator loops achieve self-correction without human intervention.
- Structured inter-agent messaging formats prevent compounding semantic errors.

---

### 2.2 Tool Execution, Function Calling & Schema Contracts

[SLIDE: 4 | Deterministic Tool Calling Contracts | Guaranteed Execution and Error Recovery | Key Takeaways: Treat model tool arguments as untrusted user input.]
[VIDEO_CUE: 10:30 - Safe Tool Calling and Idempotency Validation]

#### Contractual Reliability
Agents interact with the physical world through tool calling. Every tool call must be bounded by:
- **Strict JSON Schema Contracts:** Required parameter types, enums, and bounds checking.
- **Idempotency Keys:** Guaranteeing that retrying a network timeout does not double-execute transactions.
- **Execution Sandboxing:** Isolating database mutations and code interpreters in secure containers.

\`\`\`json
{
  "name": "execute_database_query",
  "description": "Executes an auditable read-only query against SQLite analytics replica",
  "parameters": {
    "type": "object",
    "properties": {
      "query": { "type": "string", "description": "SQL SELECT statement" },
      "idempotency_key": { "type": "string", "description": "Unique UUIDv4 per request" },
      "max_rows": { "type": "integer", "maximum": 500 }
    },
    "required": ["query", "idempotency_key"]
  }
}
\`\`\`

#### Key Takeaways
- Idempotency keys prevent duplicate side-effects during network retries.
- Schema validation at the agent boundary catches hallucinations before execution.
- Sandboxed runtimes prevent untrusted generated code from harming production environments.`,
      slides: [
        {
          slideNumber: 3,
          badge: 'Multi-Agent 2.1',
          badgeColor: '#10b981',
          title: 'Specialized Multi-Agent Topologies',
          subtitle: 'Dividing Cognitive Labor for Flawless Execution',
          bullets: [
            'Director decomposes complex user goals into atomic execution steps.',
            'Specialized workers execute tools and synthesize data in parallel.',
            'Reviewer agents validate outputs against safety and business criteria.',
          ],
          keyTakeaway: 'Cognitive decomposition is the secret to zero-hallucination agent systems.',
          speakerNotes: 'Walk the students through the lifecycle of a user request routed through three agents.',
        },
        {
          slideNumber: 4,
          badge: 'Tools & Contracts 2.2',
          badgeColor: '#f59e0b',
          title: 'Deterministic Tool Calling Contracts',
          subtitle: 'Guaranteed Execution and Error Recovery',
          bullets: [
            'Strict JSON Schema validation guarantees type correctness.',
            'Idempotency tokens eliminate duplicate transaction risks.',
            'Graceful error feedback loops allow agents to auto-correct bad parameters.',
          ],
          keyTakeaway: 'Always treat model tool arguments as untrusted user input.',
          speakerNotes: 'Emphasize the importance of validating tool inputs using standard JSON schemas.',
        },
      ],
    },
    {
      id: 'ch_book_3',
      chapterNumber: 3,
      title: 'Book 3: Autonomous Workflow Resilience & Continuous Evaluation',
      summary: 'Task decomposition graphs, durable step checkpointing, circuit breakers, self-healing reflection, LLM-as-a-judge benchmarking, and quantitative evaluation.',
      subTopics: [
        { id: 'sub_3_1', topicNumber: '3.1', title: 'Autonomous Workflow Engineering & Resilience', summary: 'Task decomposition graphs, exponential backoff, circuit breakers, and state checkpoints.' },
        { id: 'sub_3_2', topicNumber: '3.2', title: 'Evaluation, Benchmarking & Safety Guardrails', summary: 'Automated LLM-as-a-judge frameworks, golden test datasets, hallucination metrics, and compliance.' },
      ],
      content: `# Book 3: Autonomous Workflow Resilience & Continuous Evaluation

### 3.1 Autonomous Workflow Engineering & Resilience

[SLIDE: 5 | Autonomous Workflow Resilience | Durable Checkpoints and Circuit Breakers | Key Takeaways: Never run long-running autonomous agents without durable step persistence.]
[VIDEO_CUE: 14:00 - Distributed Workflow Checkpointing and Fault Recovery]

#### Distributed Resilience Patterns
Autonomous agent workflows often run for minutes or hours. Production reliability requires:
- **Durable Checkpoints:** Persisting step state to disk/database after every execution phase.
- **Circuit Breakers:** Tripping execution when repeated tool errors exceed threshold limits.
- **Self-Healing Retries:** Prompting the agent with the exact error stack to trigger recursive parameter correction.

\`\`\`
Step 1: Plan ---> [Durable Checkpoint 1]
Step 2: Tool Call -> Failure -> Error Reflected -> Self-Heal -> [Durable Checkpoint 2]
Step 3: Synthesis -> [Durable Checkpoint 3] ---> Verified Deliverable
\`\`\`

#### Key Takeaways
- Durable checkpointing allows workflows to resume instantly after process crashes.
- Circuit breakers prevent token burn during catastrophic API outages.
- In-context error reflection enables autonomous self-healing without developer intervention.

---

### 3.2 Evaluation, Benchmarking & Safety Guardrails

[SLIDE: 6 | Automated AI Evaluation Pipelines | Quantitative Benchmarking and Continuous Verification | Key Takeaways: Continuous regression benchmarking prevents prompt degradation over time.]
[VIDEO_CUE: 17:45 - Quantitative Hallucination and Faithfulness Scoring]

#### Continuous Quality Verification
Deploying AI with confidence requires quantitative quality benchmarks:
- **Faithfulness & Groundedness:** Verifying that 100% of claims originate directly from retrieved reference context.
- **Answer Relevance:** Measuring alignment between the user's initial inquiry and the final synthesized response.
- **Automated Regression Suites:** Executing automated LLM-as-a-judge evaluations against curated test suites on every PR.

$$\\text{Faithfulness} = \\frac{|\\text{Verified Claims Supported by Context}|}{|\\text{Total Claims Made in Response}|}$$

#### Key Takeaways
- Quantitative evaluation metrics replace subjective human spot-checks.
- Faithfulness scoring guarantees compliance and eliminates legal risk.
- Continuous regression benchmarking prevents prompt degradation over time.`,
      slides: [
        {
          slideNumber: 5,
          badge: 'Workflow Resilience 3.1',
          badgeColor: '#ec4899',
          title: 'Autonomous Workflow Resilience',
          subtitle: 'Durable Checkpoints and Circuit Breakers',
          bullets: [
            'Persistent state checkpoints save progress after every single step.',
            'Circuit breakers prevent infinite loop token wastage.',
            'Self-healing reflection enables autonomous error correction.',
          ],
          keyTakeaway: 'Never run long-running autonomous agents without durable step persistence.',
          speakerNotes: 'Explain how SQLite WAL checkpoints protect multi-minute autonomous pipelines.',
        },
        {
          slideNumber: 6,
          badge: 'Safety & Eval 3.2',
          badgeColor: '#8b5cf6',
          title: 'Automated AI Evaluation Pipelines',
          subtitle: 'Quantitative Benchmarking and Continuous Verification',
          bullets: [
            'LLM-as-a-Judge frameworks score groundedness and answer relevance.',
            'Automated regression suites catch prompt regressions before release.',
            'Audit logging provides complete traceability for enterprise compliance.',
          ],
          keyTakeaway: 'You cannot optimize what you do not quantitatively measure.',
          speakerNotes: 'Show students how to compute faithfulness scores on RAG responses.',
        },
      ],
    },
    {
      id: 'ch_book_4',
      chapterNumber: 4,
      title: 'Book 4: Production Serving & Domain Adaptation',
      summary: 'High-throughput inference optimization, continuous batching with vLLM, PagedAttention KV-cache, speculative decoding, and QLoRA domain adaptation.',
      subTopics: [
        { id: 'sub_4_1', topicNumber: '4.1', title: 'Production Deployment & Low-Latency Serving', summary: 'KV-cache management, speculative decoding, continuous batching, and high-throughput deployment.' },
        { id: 'sub_4_2', topicNumber: '4.2', title: 'Domain Specialization & Fine-Tuning Strategies', summary: 'LoRA, QLoRA, synthetic domain dataset generation, Direct Preference Optimization (DPO), and continuous adaptation.' },
      ],
      content: `# Book 4: Production Serving & Domain Adaptation

### 4.1 Production Deployment & Low-Latency Serving

[SLIDE: 7 | High-Throughput Production Serving | Maximizing GPU Efficiency with PagedAttention | Key Takeaways: System-level inference optimizations dramatically lower enterprise operating cost.]
[VIDEO_CUE: 21:10 - Continuous Batching & Memory Optimization with vLLM]

#### High-Throughput Inference Optimization
Scaling AI workloads to thousands of concurrent enterprise users requires modern serving techniques:
- **Continuous Batching:** Dynamic iteration-level scheduling (vLLM / TensorRT-LLM) maximizing GPU memory utilization.
- **PagedAttention:** Virtual memory paging for KV-cache, eliminating memory fragmentation.
- **Speculative Decoding:** Employing a tiny draft model to propose tokens validated in parallel by the target model.

\`\`\`
Traditional Serving:  [Batch 1: Waiting for longest seq...] [Idle GPU Slots]
Continuous Batching:  [Seq A (step 3)] [Seq B (step 1)] [Seq C (step 14)] -> 100% Saturated
\`\`\`

#### Key Takeaways
- Continuous batching increases server throughput by 3x-8x over static batching.
- PagedAttention resolves memory waste and supports massive context windows.
- Speculative decoding slashes time-to-first-token and streaming latency.

---

### 4.2 Domain Specialization & Fine-Tuning Strategies

[SLIDE: 8 | Domain Specialization: RAG + QLoRA | The Winning Combination for Enterprise Mastery | Key Takeaways: Use RAG for dynamic factual knowledge; use fine-tuning for behavior and form.]
[VIDEO_CUE: 24:30 - Fine-Tuning vs RAG Architecture Decisions]

#### When to Fine-Tune vs. When to RAG
A common enterprise mistake is choosing between RAG and fine-tuning. Production architectures synthesize both:
- **RAG for Dynamic Knowledge:** Real-time policies, inventory, customer data, and constantly shifting documentation.
- **Parameter-Efficient Fine-Tuning (PEFT/QLoRA) for Style & Structure:** Training the model to consistently emit proprietary schemas, tone, and reasoning syntax.
- **Direct Preference Optimization (DPO):** Aligning responses with enterprise stylistic guidelines using paired positive/negative examples.

| Capability | RAG Alone | Fine-Tuning Alone | Hybrid Architecture (RAG + QLoRA) |
| :--- | :--- | :--- | :--- |
| Dynamic Knowledge Update | Immediate | Requires Retraining | Immediate |
| Tone & Stylistic Adherence | Medium | Very High | Very High |
| Complex Domain Vocab | Medium | High | Optimal |
| Cost to Implement | Low | Moderate | Cost-Effective |

#### Key Takeaways
- RAG provides the facts; fine-tuning teaches the model how to reason and format.
- QLoRA enables low-cost domain specialization on standard enterprise GPUs.
- DPO provides stable, reproducible human-in-the-loop alignment without complex RL.`,
      slides: [
        {
          slideNumber: 7,
          badge: 'Serving Systems 4.1',
          badgeColor: '#06b6d4',
          title: 'High-Throughput Production Serving',
          subtitle: 'Maximizing GPU Efficiency with PagedAttention',
          bullets: [
            'Continuous batching maximizes GPU utilization under dynamic load.',
            'PagedAttention eliminates KV-cache fragmentation and OOM errors.',
            'Speculative decoding speeds up token generation by up to 2.5x.',
          ],
          keyTakeaway: 'System-level inference optimizations dramatically lower enterprise operating cost.',
          speakerNotes: 'Discuss vLLM and TensorRT-LLM architecture and hardware trade-offs.',
        },
        {
          slideNumber: 8,
          badge: 'Specialization 4.2',
          badgeColor: '#14b8a6',
          title: 'Domain Specialization: RAG + QLoRA',
          subtitle: 'The Winning Combination for Enterprise Mastery',
          bullets: [
            'RAG injects dynamic real-time knowledge and factual citations.',
            'QLoRA fine-tunes domain vocabulary, structured schemas, and voice.',
            'DPO aligns model behavior with strict company guidelines.',
          ],
          keyTakeaway: 'Use RAG for knowledge retrieval; use fine-tuning for behavior and form.',
          speakerNotes: 'Summarize the entire 4-book curriculum and emphasize continuous model improvement.',
        },
      ],
    },
  ],
  slideDecks: {
    1: [
      {
        id: 'slide_1_1',
        slideNumber: 1,
        badge: 'Architecture 1.1',
        badgeColor: '#6366f1',
        title: 'Foundations of Modern Cognitive Architectures',
        subtitle: 'From Static LLMs to Stateful Reasoning Engines',
        bullets: [
          'Cognitive loops decouple strategic reasoning from deterministic execution.',
          'External memory stores replace volatile token context with durable state.',
          'Strict JSON contracts protect downstream APIs from hallucinations.',
        ],
        keyTakeaway: 'Separating reasoning from persistence is the cornerstone of enterprise AI reliability.',
        speakerNotes: 'Begin by explaining how enterprise AI shifted from naive prompts to stateful multi-agent systems.',
      },
      {
        id: 'slide_1_2',
        slideNumber: 2,
        badge: 'RAG Pipeline 1.2',
        badgeColor: '#38bdf8',
        title: 'Production Hybrid RAG Architecture',
        subtitle: 'Dense Semantics Combined with Lexical Precision',
        bullets: [
          'BM25 + Dense Vectors eliminate blind spots in exact term search.',
          'Cross-Encoder Reranking filters out irrelevant noise before synthesis.',
          'Parent-Document retrieval ensures full contextual clarity.',
        ],
        keyTakeaway: 'Never rely on naive cosine similarity alone for enterprise documentation.',
        speakerNotes: 'Highlight why exact part numbers and financial figures require hybrid lexical search.',
      },
    ],
    2: [
      {
        id: 'slide_2_1',
        slideNumber: 1,
        badge: 'Multi-Agent 2.1',
        badgeColor: '#10b981',
        title: 'Specialized Multi-Agent Topologies',
        subtitle: 'Dividing Cognitive Labor for Flawless Execution',
        bullets: [
          'Director decomposes complex user goals into atomic execution steps.',
          'Specialized workers execute tools and synthesize data in parallel.',
          'Reviewer agents validate outputs against safety and business criteria.',
        ],
        keyTakeaway: 'Cognitive decomposition is the secret to zero-hallucination agent systems.',
        speakerNotes: 'Walk the students through the lifecycle of a user request routed through three agents.',
      },
      {
        id: 'slide_2_2',
        slideNumber: 2,
        badge: 'Tools & Contracts 2.2',
        badgeColor: '#f59e0b',
        title: 'Deterministic Tool Calling Contracts',
        subtitle: 'Guaranteed Execution and Error Recovery',
        bullets: [
          'Strict JSON Schema validation guarantees type correctness.',
          'Idempotency tokens eliminate duplicate transaction risks.',
          'Graceful error feedback loops allow agents to auto-correct bad parameters.',
        ],
        keyTakeaway: 'Always treat model tool arguments as untrusted user input.',
        speakerNotes: 'Emphasize the importance of validating tool inputs using standard JSON schemas.',
      },
    ],
    3: [
      {
        id: 'slide_3_1',
        slideNumber: 1,
        badge: 'Workflow Resilience 3.1',
        badgeColor: '#ec4899',
        title: 'Autonomous Workflow Resilience',
        subtitle: 'Durable Checkpoints and Circuit Breakers',
        bullets: [
          'Persistent state checkpoints save progress after every single step.',
          'Circuit breakers prevent infinite loop token wastage.',
          'Self-healing reflection enables autonomous error correction.',
        ],
        keyTakeaway: 'Never run long-running autonomous agents without durable step persistence.',
        speakerNotes: 'Explain how SQLite WAL checkpoints protect multi-minute autonomous pipelines.',
      },
      {
        id: 'slide_3_2',
        slideNumber: 2,
        badge: 'Safety & Eval 3.2',
        badgeColor: '#8b5cf6',
        title: 'Automated AI Evaluation Pipelines',
        subtitle: 'Quantitative Benchmarking and Continuous Verification',
        bullets: [
          'LLM-as-a-Judge frameworks score groundedness and answer relevance.',
          'Automated regression suites catch prompt regressions before release.',
          'Audit logging provides complete traceability for enterprise compliance.',
        ],
        keyTakeaway: 'You cannot optimize what you do not quantitatively measure.',
        speakerNotes: 'Show students how to compute faithfulness scores on RAG responses.',
      },
    ],
    4: [
      {
        id: 'slide_4_1',
        slideNumber: 1,
        badge: 'Serving Systems 4.1',
        badgeColor: '#06b6d4',
        title: 'High-Throughput Production Serving',
        subtitle: 'Maximizing GPU Efficiency with PagedAttention',
        bullets: [
          'Continuous batching maximizes GPU utilization under dynamic load.',
          'PagedAttention eliminates KV-cache fragmentation and OOM errors.',
          'Speculative decoding speeds up token generation by up to 2.5x.',
        ],
        keyTakeaway: 'System-level inference optimizations dramatically lower enterprise operating cost.',
        speakerNotes: 'Discuss vLLM and TensorRT-LLM architecture and hardware trade-offs.',
      },
      {
        id: 'slide_4_2',
        slideNumber: 2,
        badge: 'Specialization 4.2',
        badgeColor: '#14b8a6',
        title: 'Domain Specialization: RAG + QLoRA',
        subtitle: 'The Winning Combination for Enterprise Mastery',
        bullets: [
          'RAG injects dynamic real-time knowledge and factual citations.',
          'QLoRA fine-tunes domain vocabulary, structured schemas, and voice.',
          'DPO aligns model behavior with strict company guidelines.',
        ],
        keyTakeaway: 'Use RAG for knowledge retrieval; use fine-tuning for behavior and form.',
        speakerNotes: 'Summarize the entire 4-book curriculum and emphasize continuous model improvement.',
      },
    ],
  },
  messages: [
    {
      id: 'msg_perm_user_prompt',
      role: 'user',
      content: 'Generate a comprehensive 4-book enterprise masterclass on Enterprise AI Architecture & Multi-Agent Engineering with deep technical lessons, architectural diagrams, slide markers, and interactive video cue points.',
      timestamp: 1789000000000,
    },
    {
      id: 'msg_perm_book_1',
      role: 'assistant',
      content: `# Book 1: Foundations of Cognitive Architecture & RAG Pipelines

### 1.1 Foundations of Modern Cognitive Architectures

[SLIDE: 1 | Foundations of Modern Cognitive Architectures | From Static LLMs to Stateful Reasoning Engines | Key Takeaways: Decoupling reasoning from storage ensures enterprise durability.]
[VIDEO_CUE: 00:00 - Introduction to Stateful Cognitive Loops]

#### Architectural Overview
Modern enterprise AI systems have evolved beyond simple monolithic chat completions into **stateful cognitive architectures**. A cognitive architecture separates high-level strategic reasoning from deterministic tool execution and data retrieval.

\`\`\`
+-------------------------------------------------------------+
|                Cognitive Orchestrator                       |
|  +-------------------+  +-------------------+  +----------+ |
|  | Context & Memory  |  | Reasoning Engine  |  | Tool Bus | |
|  +-------------------+  +-------------------+  +----------+ |
+-------------------------------------------------------------+
               |                       |
               v                       v
    [Vector Index / RAG]       [Autonomous Agents]
\`\`\`

#### Core Architectural Pillars
1. **Separation of Reasoning and Storage:** Foundation models serve as stateless reasoning engines, while external vector databases and SQLite provide durable state.
2. **Context Window Engineering:** Dynamic sliding windows, hierarchical context compression, and kv-cache utilization maximize reasoning depth while bounding latency.
3. **Deterministic Guardrails:** Semantic safety layers, JSON schema validators, and output parsers enforce strict contractual boundaries.

\`\`\`typescript
// Architectural contract for stateful cognitive loops
interface CognitiveLoopState {
  sessionId: string;
  stepIndex: number;
  memoryStore: DurableStore;
  toolRegistry: Map<string, ToolDefinition>;
  activeGuardrails: GuardrailPipeline[];
}
\`\`\`

#### Key Takeaways
- Cognitive architectures separate strategic planning from deterministic tool execution.
- External durable state stores prevent context window bloat and catastrophic forgetting.
- Structured schema validation ensures reliable orchestration in mission-critical environments.

---

### 1.2 Enterprise Retrieval-Augmented Generation (RAG)

[SLIDE: 2 | Production Hybrid RAG Architecture | Dense Semantics Combined with Lexical Precision | Key Takeaways: Hybrid dense-sparse retrieval prevents catastrophic terminology misses.]
[VIDEO_CUE: 03:45 - Hybrid Sparse-Dense Retrieval Architecture]

#### The Production RAG Pipeline
Naive vector search fails in production due to embedding collisions and semantic drift. Enterprise RAG combines **dense embeddings** (for semantic similarity) with **sparse BM25 lexical search** (for exact keyword/part-number matching).

\`\`\`
User Query ---> Hybrid Query Rewriter
                    |--> Dense Vector Search (HNSW)
                    |--> Sparse Lexical Search (BM25)
                    |--> Reciprocal Rank Fusion (RRF)
                    |--> Cross-Encoder Reranker
                    v
            Grounded LLM Generation
\`\`\`

#### Production Best Practices
- **Parent-Document Retrieval:** Index small semantic chunks for search precision, but inject the broader parent section into LLM context.
- **Cross-Encoder Reranking:** Re-score top 50 candidates using a dedicated cross-encoder before prompt assembly.
- **Strict Grounding Citations:** Enforce traceable snippet anchors for every factual claim.

\`\`\`python
# Hybrid RRF Fusion Algorithm
def reciprocal_rank_fusion(dense_ranks, sparse_ranks, k=60):
    scores = {}
    for rank, doc_id in enumerate(dense_ranks):
        scores[doc_id] = scores.get(doc_id, 0.0) + 1.0 / (k + rank)
    for rank, doc_id in enumerate(sparse_ranks):
        scores[doc_id] = scores.get(doc_id, 0.0) + 1.0 / (k + rank)
    return sorted(scores.items(), key=lambda x: x[1], reverse=True)
\`\`\`

#### Key Takeaways
- Hybrid dense-sparse search prevents accuracy degradation on technical terms.
- Cross-encoder reranking provides a 15-25% boost in contextual retrieval precision.
- Parent-document retrieval balances high search granularity with rich reading context.`,
      timestamp: 1789000010000,
    },
    {
      id: 'msg_perm_book_2',
      role: 'assistant',
      content: `# Book 2: Autonomous Multi-Agent Orchestration & Tool Systems

### 2.1 Multi-Agent Collaboration & Role Specialization

[SLIDE: 3 | Specialized Multi-Agent Topologies | Dividing Cognitive Labor for Flawless Execution | Key Takeaways: Cognitive decomposition is the secret to zero-hallucination agent systems.]
[VIDEO_CUE: 07:15 - Director-Worker Topologies and State Synchronization]

#### Agent Topology Patterns
In complex workflows, single prompts collapse under high cognitive load. Splitting responsibilities among **specialized agents** produces superior reliability:

\`\`\`
                  +-----------------------+
                  |    Director / Planner |
                  +-----------+-----------+
                              |
             +----------------+----------------+
             v                                 v
  +--------------------+             +--------------------+
  | Researcher Worker  |             | Code Author Worker |
  +----------+---------+             +---------+----------+
             |                                 |
             +----------------+----------------+
                              v
                  +-----------------------+
                  | Critic / Synthesizer  |
                  +-----------------------+
\`\`\`

1. **Director-Worker Topology:** A central planner decomposes the task and delegates specialized sub-goals to worker agents.
2. **Reviewer-Critic Loop:** A generator agent creates candidate outputs while a critic agent enforces rubric criteria and formatting constraints.
3. **Consensus Aggregators:** Multiple independent agents solve the same problem; a synthesizer combines the strongest reasoning branches.

#### Key Takeaways
- Specialized personas outperform generalist prompts on complex multi-step workflows.
- Critic-generator loops achieve self-correction without human intervention.
- Structured inter-agent messaging formats prevent compounding semantic errors.

---

### 2.2 Tool Execution, Function Calling & Schema Contracts

[SLIDE: 4 | Deterministic Tool Calling Contracts | Guaranteed Execution and Error Recovery | Key Takeaways: Treat model tool arguments as untrusted user input.]
[VIDEO_CUE: 10:30 - Safe Tool Calling and Idempotency Validation]

#### Contractual Reliability
Agents interact with the physical world through tool calling. Every tool call must be bounded by:
- **Strict JSON Schema Contracts:** Required parameter types, enums, and bounds checking.
- **Idempotency Keys:** Guaranteeing that retrying a network timeout does not double-execute transactions.
- **Execution Sandboxing:** Isolating database mutations and code interpreters in secure containers.

\`\`\`json
{
  "name": "execute_database_query",
  "description": "Executes an auditable read-only query against SQLite analytics replica",
  "parameters": {
    "type": "object",
    "properties": {
      "query": { "type": "string", "description": "SQL SELECT statement" },
      "idempotency_key": { "type": "string", "description": "Unique UUIDv4 per request" },
      "max_rows": { "type": "integer", "maximum": 500 }
    },
    "required": ["query", "idempotency_key"]
  }
}
\`\`\`

#### Key Takeaways
- Idempotency keys prevent duplicate side-effects during network retries.
- Schema validation at the agent boundary catches hallucinations before execution.
- Sandboxed runtimes prevent untrusted generated code from harming production environments.`,
      timestamp: 1789000020000,
    },
    {
      id: 'msg_perm_book_3',
      role: 'assistant',
      content: `# Book 3: Autonomous Workflow Resilience & Continuous Evaluation

### 3.1 Autonomous Workflow Engineering & Resilience

[SLIDE: 5 | Autonomous Workflow Resilience | Durable Checkpoints and Circuit Breakers | Key Takeaways: Never run long-running autonomous agents without durable step persistence.]
[VIDEO_CUE: 14:00 - Distributed Workflow Checkpointing and Fault Recovery]

#### Distributed Resilience Patterns
Autonomous agent workflows often run for minutes or hours. Production reliability requires:
- **Durable Checkpoints:** Persisting step state to disk/database after every execution phase.
- **Circuit Breakers:** Tripping execution when repeated tool errors exceed threshold limits.
- **Self-Healing Retries:** Prompting the agent with the exact error stack to trigger recursive parameter correction.

\`\`\`
Step 1: Plan ---> [Durable Checkpoint 1]
Step 2: Tool Call -> Failure -> Error Reflected -> Self-Heal -> [Durable Checkpoint 2]
Step 3: Synthesis -> [Durable Checkpoint 3] ---> Verified Deliverable
\`\`\`

#### Key Takeaways
- Durable checkpointing allows workflows to resume instantly after process crashes.
- Circuit breakers prevent token burn during catastrophic API outages.
- In-context error reflection enables autonomous self-healing without developer intervention.

---

### 3.2 Evaluation, Benchmarking & Safety Guardrails

[SLIDE: 6 | Automated AI Evaluation Pipelines | Quantitative Benchmarking and Continuous Verification | Key Takeaways: Continuous regression benchmarking prevents prompt degradation over time.]
[VIDEO_CUE: 17:45 - Quantitative Hallucination and Faithfulness Scoring]

#### Continuous Quality Verification
Deploying AI with confidence requires quantitative quality benchmarks:
- **Faithfulness & Groundedness:** Verifying that 100% of claims originate directly from retrieved reference context.
- **Answer Relevance:** Measuring alignment between the user's initial inquiry and the final synthesized response.
- **Automated Regression Suites:** Executing automated LLM-as-a-judge evaluations against curated test suites on every PR.

$$\\text{Faithfulness} = \\frac{|\\text{Verified Claims Supported by Context}|}{|\\text{Total Claims Made in Response}|}$$

#### Key Takeaways
- Quantitative evaluation metrics replace subjective human spot-checks.
- Faithfulness scoring guarantees compliance and eliminates legal risk.
- Continuous regression benchmarking prevents prompt degradation over time.`,
      timestamp: 1789000030000,
    },
    {
      id: 'msg_perm_book_4',
      role: 'assistant',
      content: `# Book 4: Production Serving & Domain Adaptation

### 4.1 Production Deployment & Low-Latency Serving

[SLIDE: 7 | High-Throughput Production Serving | Maximizing GPU Efficiency with PagedAttention | Key Takeaways: System-level inference optimizations dramatically lower enterprise operating cost.]
[VIDEO_CUE: 21:10 - Continuous Batching & Memory Optimization with vLLM]

#### High-Throughput Inference Optimization
Scaling AI workloads to thousands of concurrent enterprise users requires modern serving techniques:
- **Continuous Batching:** Dynamic iteration-level scheduling (vLLM / TensorRT-LLM) maximizing GPU memory utilization.
- **PagedAttention:** Virtual memory paging for KV-cache, eliminating memory fragmentation.
- **Speculative Decoding:** Employing a tiny draft model to propose tokens validated in parallel by the target model.

\`\`\`
Traditional Serving:  [Batch 1: Waiting for longest seq...] [Idle GPU Slots]
Continuous Batching:  [Seq A (step 3)] [Seq B (step 1)] [Seq C (step 14)] -> 100% Saturated
\`\`\`

#### Key Takeaways
- Continuous batching increases server throughput by 3x-8x over static batching.
- PagedAttention resolves memory waste and supports massive context windows.
- Speculative decoding slashes time-to-first-token and streaming latency.

---

### 4.2 Domain Specialization & Fine-Tuning Strategies

[SLIDE: 8 | Domain Specialization: RAG + QLoRA | The Winning Combination for Enterprise Mastery | Key Takeaways: Use RAG for dynamic factual knowledge; use fine-tuning for behavior and form.]
[VIDEO_CUE: 24:30 - Fine-Tuning vs RAG Architecture Decisions]

#### When to Fine-Tune vs. When to RAG
A common enterprise mistake is choosing between RAG and fine-tuning. Production architectures synthesize both:
- **RAG for Dynamic Knowledge:** Real-time policies, inventory, customer data, and constantly shifting documentation.
- **Parameter-Efficient Fine-Tuning (PEFT/QLoRA) for Style & Structure:** Training the model to consistently emit proprietary schemas, tone, and reasoning syntax.
- **Direct Preference Optimization (DPO):** Aligning responses with enterprise stylistic guidelines using paired positive/negative examples.

| Capability | RAG Alone | Fine-Tuning Alone | Hybrid Architecture (RAG + QLoRA) |
| :--- | :--- | :--- | :--- |
| Dynamic Knowledge Update | Immediate | Requires Retraining | Immediate |
| Tone & Stylistic Adherence | Medium | Very High | Very High |
| Complex Domain Vocab | Medium | High | Optimal |
| Cost to Implement | Low | Moderate | Cost-Effective |

#### Key Takeaways
- RAG provides the facts; fine-tuning teaches the model how to reason and format.
- QLoRA enables low-cost domain specialization on standard enterprise GPUs.
- DPO provides stable, reproducible human-in-the-loop alignment without complex RL.`,
      timestamp: 1789000040000,
    },
  ],
  coursePlan: {
    title: 'Enterprise AI Architecture & Multi-Agent Engineering',
    subtitle: 'Autonomous Cognitive Workflows, Real-Time RAG Pipelines & Production LLM Serving',
    totalModules: 4,
    createdAt: 1789000000000,
    updatedAt: 1789000000000,
    modules: [
      {
        moduleNumber: 1,
        title: 'Book 1: Foundations of Cognitive Architecture & RAG Pipelines',
        summary: 'Core cognitive loops and enterprise hybrid retrieval architectures.',
        status: 'completed',
        subTopics: ['1.1 Modern Cognitive Architectures', '1.2 Enterprise RAG'],
      },
      {
        moduleNumber: 2,
        title: 'Book 2: Autonomous Multi-Agent Orchestration & Tool Systems',
        summary: 'Agent topologies, function calling contracts, and schema validation.',
        status: 'completed',
        subTopics: ['2.1 Role Specialization', '2.2 Schema Contracts'],
      },
      {
        moduleNumber: 3,
        title: 'Book 3: Autonomous Workflow Resilience & Continuous Evaluation',
        summary: 'Durable checkpoints, circuit breakers, and LLM-as-a-judge benchmarking.',
        status: 'completed',
        subTopics: ['3.1 Resilience Engineering', '3.2 Automated Evaluation'],
      },
      {
        moduleNumber: 4,
        title: 'Book 4: Production Serving & Domain Adaptation',
        summary: 'vLLM continuous batching, PagedAttention, and QLoRA fine-tuning.',
        status: 'completed',
        subTopics: ['4.1 Low-Latency Serving', '4.2 QLoRA & DPO'],
      },
    ],
  },
  autonomousPlan: {
    id: 'plan_perm_enterprise_ai_v1',
    prompt: 'Enterprise AI Architecture & Multi-Agent Engineering',
    courseTitle: 'Enterprise AI Architecture & Multi-Agent Engineering',
    courseSubtitle: 'Autonomous Cognitive Workflows, Real-Time RAG Pipelines & Production LLM Serving',
    totalSteps: 6,
    currentStepIndex: 5,
    status: 'completed',
    startedAt: 1789000000000,
    completedAt: 1789000045000,
    steps: [
      { id: 's1', stepNumber: 1, title: 'Curriculum Architecture', description: 'Curriculum roadmap', type: 'blueprint', status: 'completed' },
      { id: 's2', stepNumber: 2, title: 'Book 1: Foundations & RAG', description: 'Core principles', type: 'book_generation', bookNumber: 1, status: 'completed' },
      { id: 's3', stepNumber: 3, title: 'Book 2: Multi-Agent Collaboration', description: 'Agent loops', type: 'book_generation', bookNumber: 2, status: 'completed' },
      { id: 's4', stepNumber: 4, title: 'Book 3: Resilience & Evaluation', description: 'Testing & benchmarks', type: 'book_generation', bookNumber: 3, status: 'completed' },
      { id: 's5', stepNumber: 5, title: 'Book 4: Serving & Fine-Tuning', description: 'Production scale', type: 'book_generation', bookNumber: 4, status: 'completed' },
      { id: 's6', stepNumber: 6, title: 'Synthesis & Permanent Compilation', description: 'Locked into permanent store', type: 'synthesis', status: 'completed' },
    ],
  },
};

/* =========================================================================
   IN-MEMORY PERMANENT STATE DATABASE
   Directly loaded in application memory & synchronized with disk JSON / SQLite
   ========================================================================= */

const inMemoryPermanentStore = new Map<string, PermanentCourseItem>();

// Seed initial in-memory database
inMemoryPermanentStore.set(PRESEEDED_ENTERPRISE_AI_COURSE.id, { ...PRESEEDED_ENTERPRISE_AI_COURSE });

/**
 * Loads cached permanent courses from localStorage
 */
function loadFromLocalStorage(): PermanentCourseItem[] {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Writes permanent courses to localStorage
 */
function saveToLocalStorage(items: PermanentCourseItem[]) {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(items));
  } catch (e) {
    console.warn('[PermanentCourseStore] Failed to write localStorage:', e);
  }
}

/**
 * Initializes and retrieves all permanent courses across:
 * 1. In-memory database
 * 2. Backend SQLite / File JSON store (/api/permanent-courses)
 * 3. LocalStorage cache fallback
 */
export async function getPermanentCourses(): Promise<PermanentCourseItem[]> {
  // 1. Populate from localStorage first for instant response
  const localList = loadFromLocalStorage();
  for (const item of localList) {
    if (item && item.id && !inMemoryPermanentStore.has(item.id)) {
      inMemoryPermanentStore.set(item.id, item);
    }
  }

  // 2. Fetch latest from backend persistent API
  try {
    const res = await fetch(API_PERMANENT_ENDPOINT, {
      headers: { 'Content-Type': 'application/json' },
    });
    if (res.ok) {
      const data = await res.json();
      const serverList: PermanentCourseItem[] = data.courses || [];
      for (const item of serverList) {
        if (item && item.id) {
          inMemoryPermanentStore.set(item.id, {
            ...item,
            isPermanent: true,
            locked: true,
          });
        }
      }
    }
  } catch (err) {
    console.warn('[PermanentCourseStore] Backend API offline, using local store:', err);
  }

  // Always ensure pre-seeded masterclass is up-to-date with complete messages, chapters, and slide decks
  const existingPreseeded = inMemoryPermanentStore.get(PRESEEDED_ENTERPRISE_AI_COURSE.id);
  inMemoryPermanentStore.set(PRESEEDED_ENTERPRISE_AI_COURSE.id, {
    ...PRESEEDED_ENTERPRISE_AI_COURSE,
    ...(existingPreseeded || {}),
    chapters: PRESEEDED_ENTERPRISE_AI_COURSE.chapters,
    messages: PRESEEDED_ENTERPRISE_AI_COURSE.messages,
    slideDecks: PRESEEDED_ENTERPRISE_AI_COURSE.slideDecks,
    isPermanent: true,
    locked: true,
  });

  const allItems = Array.from(inMemoryPermanentStore.values()).sort(
    (a, b) => b.updatedAt - a.updatedAt
  );

  // Sync back to localStorage
  saveToLocalStorage(allItems);

  return allItems;
}

/**
 * Saves a course and its accompanying session immediately into the Permanent Store.
 * Called on:
 * - Course generation completion
 * - Course download (Word, Markdown, Slides, Video)
 * - Explicit user save
 */
export async function saveToPermanentStore(
  course: LibraryCourse | Partial<PermanentCourseItem>,
  session?: ChatSession,
  options?: { reason?: 'generation' | 'download' | 'manual'; format?: string }
): Promise<PermanentCourseItem> {
  const now = Date.now();
  const id = course.id || `perm_course_${now}_${Math.random().toString(36).substring(2, 8)}`;
  const title = course.title || session?.title || 'Masterclass Course';

  // Check existing record to preserve stats
  const existing = inMemoryPermanentStore.get(id);

  const chapters: CourseChapter[] =
    course.chapters && course.chapters.length > 0
      ? course.chapters
      : existing?.chapters || [];

  const messages: ChatMessage[] =
    session?.messages && session.messages.length > 0
      ? session.messages
      : existing?.messages || [];

  const permanentItem: PermanentCourseItem = {
    id,
    courseId: id,
    title,
    subtitle: course.subtitle || existing?.subtitle || '',
    category: course.category || existing?.category || 'Enterprise Education',
    overview: course.overview || existing?.overview || '',
    studiedBy: course.studiedBy || session?.studiedBy || existing?.studiedBy || 'General Student',
    targetAudience: course.targetAudience || session?.targetAudience || existing?.targetAudience || 'General Audience',
    totalChapters: chapters.length,
    chapters,
    coursePlan: session?.coursePlan || existing?.coursePlan,
    autonomousPlan: session?.autonomousPlan || existing?.autonomousPlan,
    messages,
    versions: course.versions || existing?.versions || [],
    slideDecks: course.slideDecks || existing?.slideDecks,
    isPermanent: true,
    locked: true,
    createdAt: existing?.createdAt || now,
    updatedAt: now,
    downloadCount: (existing?.downloadCount || 0) + (options?.reason === 'download' ? 1 : 0),
    lastDownloadedAt: options?.reason === 'download' ? now : existing?.lastDownloadedAt,
    sourceSessionId: session?.id || existing?.sourceSessionId,
    tags: course.tags || existing?.tags || ['Saved Course'],
    rawCourseData: course,
  };

  // 1. In-memory permanent store
  inMemoryPermanentStore.set(id, permanentItem);

  // 2. Synchronize to localStorage
  saveToLocalStorage(Array.from(inMemoryPermanentStore.values()));

  // 3. Persist to backend API
  try {
    await fetch(API_PERMANENT_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(permanentItem),
    });
  } catch (err) {
    console.warn('[PermanentCourseStore] Failed to sync to server API:', err);
  }

  // Dispatch browser event so all components react
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('ila_permanent_courses_updated', {
        detail: { courseId: id, action: options?.reason || 'save' },
      })
    );
  }

  return permanentItem;
}

/**
 * Records a course download event in the Permanent Store.
 */
export async function recordCourseDownload(
  courseId: string,
  format: string = 'word'
): Promise<void> {
  const existing = inMemoryPermanentStore.get(courseId);
  if (existing) {
    const updated: PermanentCourseItem = {
      ...existing,
      downloadCount: (existing.downloadCount || 0) + 1,
      lastDownloadedAt: Date.now(),
      updatedAt: Date.now(),
    };
    inMemoryPermanentStore.set(courseId, updated);
    saveToLocalStorage(Array.from(inMemoryPermanentStore.values()));

    try {
      await fetch(`${API_PERMANENT_ENDPOINT}/${encodeURIComponent(courseId)}/download`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ format, timestamp: Date.now() }),
      });
    } catch {
      // ignore
    }
  }
}

/**
 * Deletes a course from the permanent store ONLY when explicitly requested by manual command.
 * Normal refresh, state resets, or new course creations CANNOT delete permanent courses.
 */
export async function deletePermanentCourse(
  courseId: string,
  options?: { confirmManualDelete?: boolean }
): Promise<boolean> {
  if (!options?.confirmManualDelete) {
    console.warn(
      `[PermanentCourseStore] Refusing to delete locked course '${courseId}' without confirmManualDelete: true.`
    );
    return false;
  }

  inMemoryPermanentStore.delete(courseId);
  saveToLocalStorage(Array.from(inMemoryPermanentStore.values()));

  try {
    await fetch(`${API_PERMANENT_ENDPOINT}/${encodeURIComponent(courseId)}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ manualConfirm: true }),
    });
  } catch (err) {
    console.warn('[PermanentCourseStore] Failed to delete from backend API:', err);
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('ila_permanent_course_deleted', { detail: { id: courseId } })
    );
  }

  return true;
}

/**
 * Converts a PermanentCourseItem into a full ChatSession entity for immediate workspace use.
 */
export function convertPermanentCourseToSession(item: PermanentCourseItem): ChatSession {
  const msgs =
    item.messages && item.messages.length > 0
      ? item.messages
      : PRESEEDED_ENTERPRISE_AI_COURSE.messages;

  return {
    id: item.sourceSessionId || `session_perm_${item.id}`,
    title: item.title,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    isPinned: true,
    productType: 'course_creator',
    studiedBy: item.studiedBy,
    messages: msgs || [],
    coursePlan: item.coursePlan || PRESEEDED_ENTERPRISE_AI_COURSE.coursePlan,
    autonomousPlan: item.autonomousPlan || PRESEEDED_ENTERPRISE_AI_COURSE.autonomousPlan,
    attachedDocuments: [],
    isPermanent: true,
    locked: true,
  };
}

/**
 * Converts a PermanentCourseItem into a LibraryCourse entity.
 */
export function convertPermanentToLibraryCourse(item: PermanentCourseItem): LibraryCourse {
  const slideDecksByChapter =
    item.slideDecks || PRESEEDED_ENTERPRISE_AI_COURSE.slideDecks || {};

  return {
    id: item.id,
    title: item.title,
    subtitle: item.subtitle,
    category: item.category,
    overview: item.overview,
    studiedBy: item.studiedBy,
    targetAudience: item.targetAudience,
    totalChapters: item.totalChapters,
    chapters: item.chapters,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    sourceSessionId: item.sourceSessionId || `session_perm_${item.id}`,
    tags: item.tags,
    isFavorite: true,
    versions: item.versions,
    slideDecks: slideDecksByChapter,
    slideAiCourseData: {
      courseId: item.id,
      slideDecksByChapter: slideDecksByChapter as any,
      updatedAt: item.updatedAt,
    },
    isPermanent: true,
    locked: true,
  };
}

/* =========================================================================
   GLOBAL DEVELOPER & TEST UTILITIES ATTACHED TO WINDOW
   Allows developers to inspect, export, or manually manage permanent courses
   ========================================================================= */

if (typeof window !== 'undefined') {
  (window as any).__ILA_PERMANENT_STORE__ = {
    getAll: () => Array.from(inMemoryPermanentStore.values()),
    getById: (id: string) => inMemoryPermanentStore.get(id),
    save: (c: LibraryCourse, s?: ChatSession) => saveToPermanentStore(c, s, { reason: 'manual' }),
    recordDownload: (id: string, fmt: string) => recordCourseDownload(id, fmt),
    delete: (id: string, confirm: boolean = true) =>
      deletePermanentCourse(id, { confirmManualDelete: confirm }),
    exportJson: () => JSON.stringify(Array.from(inMemoryPermanentStore.values()), null, 2),
    resetToDefault: () => {
      inMemoryPermanentStore.clear();
      inMemoryPermanentStore.set(PRESEEDED_ENTERPRISE_AI_COURSE.id, { ...PRESEEDED_ENTERPRISE_AI_COURSE });
      saveToLocalStorage(Array.from(inMemoryPermanentStore.values()));
    },
  };
}
