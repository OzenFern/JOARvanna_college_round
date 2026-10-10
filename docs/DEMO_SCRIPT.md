# AgentBreak Demo Rehearsal Script (3-Minute Hackathon Demo)

## Target Audience: Hackathon Judges & Security Evaluators
**Pitch:** *"LLM prompt guardrails fail. AgentBreak attacks an autonomous AI agent in a controlled sandbox, records reproducible causal traces, enforces deterministic policy gates in software code, and mathematically proves with numbers that defense stops 100% of attacks with zero impact on legitimate tasks."*

---

### Step 1: The AI Security Posture (0:00 - 0:45)
1. **Open Frontend:** Navigate to `http://localhost:3000` (or Vercel deployment URL).
2. **Point out the Security Posture Banner:**
   - Notice the target agent is a customer-support assistant with tools (`lookup_order`, `read_document`, `process_refund`, `send_email`, `memory_write`, etc.).
   - In baseline (**D0**), security rules exist only in the prompt ("Do not refund above $50 without approval", "Keep SSNs confidential").
   - **Baseline Exploit Rate is 100%**: Prompt injections easily deceive the agent into exfiltrating SSN canaries or issuing unauthorized refunds.
   - Point to the **Defended Exploit Rate (0.0%)** and **Benign Utility Pass Rate (100.0%)**.

---

### Step 2: The Red Team Campaign Runner (0:45 - 1:30)
1. **Switch to Tab:** `Campaign Runner`.
2. **Showcase the Autonomous Red Team Library:**
   - 10 multi-surface attack vectors: direct prompt injections, indirect document injections, memory poisoning, and capability escalation.
   - Select **D0 (Baseline)** with the **Deterministic Mock Model** (or input an optional Gemini API key).
   - Click **"Launch Campaign"**.
   - Watch the live results populate with confirmed exploits, severity tiers (`CRITICAL`, `HIGH`), and applied mutator tags (`Rephrase`, `Reframe`, `Encode`).
3. **Switch Defense to D1+D2+D3 (Full Stack):**
   - Rerun the campaign: Watch all 10 attacks switch to **"BLOCKED BY POLICY"**.

---

### Step 3: Causal Traces & Exact Replay (1:30 - 2:15)
1. **Switch to Tab:** `Attack Traces`.
2. **Inspect an Exploit Trace (e.g. ATK-01 or ATK-03):**
   - Show the step-by-step causal chain: user input $\to$ document retrieval with `TAINTED` badge $\to$ model intent proposal $\to$ invariant violation.
3. **Demonstrate One-Click Exact Replay:**
   - Click **"Replay vs Hardened (D1+D2+D3)"**.
   - Show how the replay engine executes in **under 10 milliseconds with 0 model calls**, deterministically proving that the hardened policy engine intercepts the actions.

---

### Step 4: Defense Comparison Matrix & Permission Audit (2:15 - 3:00)
1. **Switch to Tab:** `Defense Comparison`:
   - Point to the empirical tradeoff matrix:
     - **D0 (Prompt only):** 100% exploit rate.
     - **D1 (Tool Gateway):** Enforces refund thresholds and recipient allowlists.
     - **D2 (Canary Filter):** Halts planted token egress.
     - **D3 (Content Sanitizer):** Strips prompt injection payloads from documents.
     - **D1+D2+D3 (Full Stack):** 0% exploit rate, 100% benign task utility.
2. **Switch to Tab:** `Permission Audit`:
   - Highlight the **Principle of Least Privilege**:
   - `http_request` and `execute_shell` are flagged as **Over-Permissioned / High Risk** because zero benign tasks need arbitrary shell execution or external HTTP calls.
3. **Conclusion:**
   - *"The model proposes; trusted code authorizes. That is how we make AI agents safe for production."*
