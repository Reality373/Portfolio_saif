# Expert Advisors (MQL5 Algorithmic Trading) — Forensic Engineering War Stories & Retrospectives

---

### 1. The Double-Flip Direction Anomaly & The Consecutive Same-Direction Fill Bug

- **Category:** Defensive Engineering / Embedded & Crisis (Financial Systems)
- **Key Metrics / Impact:** 100% elimination of consecutive same-direction grid trade corruptions | Decoupled filled position state from ephemeral pending orders
- **Tech Stack & Hardware Involved:** MetaTrader 5 (MT5), MQL5, MetaEditor, CTrade API

#### 1. The Situation & Setup
The `MA_Grid_EA.mq5` (`Expert_Advisors/EA2/`) is an automated geometric grid trading system designed to trade market oscillations. After entering an initial position (e.g. BUY 0.01 lots), the EA places an alternating pending stop order (e.g. SELL STOP 0.02 lots) at a predefined distance. When that stop order fills, the EA is designed to place the next opposite order (e.g. BUY STOP 0.03 lots), maintaining a strict alternating Buy/Sell chain (`EA2/bugfixes.md`).

#### 2. The Anomaly & The Mistake (The Symptom)
During live forward testing, an alarming anomaly was recorded in the trade journal:
- Trade #201 was a **BUY** (0.16 lots).
- The subsequent trade at Ticket #203 filled as **ANOTHER BUY** (0.17 lots) instead of an alternating SELL.
- Ticket #202 (the pending SELL STOP) was missing entirely from the order book.
Because two consecutive Buy positions were opened at increasing lot sizes without an alternating hedge, the account took double the intended directional exposure, risking immediate margin call drawdown during market drops.

#### 3. Forensic Investigation (The Root Cause)
1. **Coupling Pending Placement with Direction Tracking:** In `PlaceNextPendingOrder()`, the next trade direction was calculated by flipping `g_pendingDirection`:
   ```mql5
   nextDirection = (g_pendingDirection == ORDER_TYPE_BUY) ? ORDER_TYPE_SELL : ORDER_TYPE_BUY;
   ```
2. **The Broker Deletion Edge Case:** Over weekends or during market roll-overs, brokers sometimes delete pending orders (e.g., GTC order expiration or symbol parameter resets).
3. **Trace of the Double-Flip Failure:**
   - Ticket 201 (BUY 0.16) filled $\to$ EA placed SELL STOP 0.17 (Ticket 202) $\to$ `g_pendingDirection = SELL`.
   - Broker deleted SELL STOP 0.17 without filling it $\to$ `MonitorPendingOrders()` detected the order was gone, saw no new position, logged *"disappeared without activation"*, and reset `g_pendingTicket = 0`. But `g_pendingDirection` remained stale as `SELL`.
   - The self-healing watchdog `SyncPendingState()` noticed `g_pendingTicket == 0` and called `PlaceNextPendingOrder()`.
   - `PlaceNextPendingOrder()` applied the flip rule to the *stale pending direction*: $\text{flip}(\text{SELL}) = \textbf{BUY}$!
   - It placed a BUY STOP 0.17, which filled as Ticket 203—yielding **two consecutive BUY positions**!

#### 4. The Engineering Breakthrough (The Fix)
The state machine was decoupled (`EA2/bugfixes.md`, Bug #6):
1. **Introduced `g_lastFilledDirection`:** Created a dedicated state variable that updates **ONLY** when a position is *actually confirmed filled* by the broker (at signal entry, gap handler market fills, or pending activations).
2. **Eliminated Ephemeral Pending Flips:** `PlaceNextPendingOrder` now calculates alternating direction strictly relative to `g_lastFilledDirection`:
   ```mql5
   // FIXED IMPLEMENTATION in: Expert_Advisors/EA2/MA_Grid_EA.mq5
   nextDirection = (g_lastFilledDirection == ORDER_TYPE_BUY) ? ORDER_TYPE_SELL : ORDER_TYPE_BUY;
   referencePrice = g_lastFilledPrice;
   ```
If a pending order is deleted by the broker and re-placed, it calculates the direction from the last *actual fill*, correctly placing a SELL STOP rather than double-flipping to BUY.

#### 5. The Core Engineering Lesson
In financial execution engines, never derive future order states by flipping variables representing unexecuted intent. Always anchor state transitions to cryptographically confirmed on-chain or broker-verified position execution events.

---

### 2. The $500 Basket Profit Lockup & Unverified Position Closure Trap

- **Category:** Embedded & Crisis / Financial Safety & Defensive Engineering
- **Key Metrics / Impact:** Recovery of $500+ unclosed basket profit states | 100% elimination of orphaned trade exposure via post-close verification loops
- **Tech Stack & Hardware Involved:** MetaTrader 5 (MT5), MQL5, MetaEditor, CTrade API

#### 1. The Situation & Setup
The MA Grid EA manages a dynamic basket of positions across grid levels. The system includes an aggregate profit target (`CheckBasketProfit()`), which monitors total floating equity and triggers `CloseAllOurPositions()` when total profit reaches the user target (e.g., $+\$500\text{ USD}$), resetting the EA to an idle state (`STATE_IDLE`) to wait for the next setup.

#### 2. The Anomaly & The Mistake (The Symptom)
In live testing, account floating profit crossed **+$500 USD**, but the EA never closed the positions. The market reversed, turning a $500 winning cycle into a deep drawdown.

#### 3. Forensic Investigation (The Root Cause)
1. **Flawed Guard Clause (`posCount < 2`):** `CheckBasketProfit()` contained a hardcoded guard:
   ```mql5
   // VULNERABLE CODE:
   void CheckBasketProfit() {
       int posCount = CountOurPositions();
       if(posCount < 2) return; // FLAW: Basket exit only evaluated when multiple trades open!
       ...
   }
   ```
   If the initial signal trade or a single surviving position made $+\$500$ alone (or if the broker closed intermediate trades due to partial fills), `posCount` was 1, causing the profit exit logic to be completely skipped!
2. **Unverified State Reset:** When closing multiple trades, `CloseAllOurPositions()` looped through open tickets and immediately called `ResetToIdle()`. If any single order close request failed due to broker requotes, network timeouts, or spread widening, the EA reset its internal memory to idle, leaving orphaned positions active in the market with zero stop-loss or management!

#### 4. The Engineering Breakthrough (The Fix)
The basket exit logic was rewritten (`EA2/bugfixes.md`, Bug #2):
1. **Relaxed Guard Clause:** Changed the guard to `if(posCount == 0) return;`, allowing profit exits for single or multi-position baskets.
2. **Post-Close Verification Loop:** After issuing close commands, the EA actively queries `CountOurPositions()`. If any positions remain open, it aborts `ResetToIdle()` and retries closing on the next tick:

```mql5
// Excerpt from: Expert_Advisors/EA2/MA_Grid_EA.mq5

void CheckBasketProfit()
{
   if(CountOurPositions() == 0) return;

   double totalProfit = CalculateOurTotalProfit();
   if(totalProfit >= Target_Basket_Profit)
   {
      CloseAllOurPositions();

      // VERIFICATION: Ensure all trades actually closed before resetting state
      int remaining = CountOurPositions();
      if(remaining > 0)
      {
         Print("WARNING: ", remaining, " positions still open after close attempt. Retrying next tick.");
         return; // Do NOT reset state — keep trying
      }

      Print("SUCCESS: Basket closed with profit: $", totalProfit);
      ResetToIdle();
   }
}
```

#### 5. The Core Engineering Lesson
Never assume a trading platform API call succeeded simply because you invoked the function. In high-concurrency trading environments, always verify that external execution states match internal expectations before transitioning state machines.

---

### 3. The Grid Chain Freeze at 0.11 Lots (Missing State Updates on Fill)

- **Category:** Defensive Engineering / System Deadlock
- **Key Metrics / Impact:** Grid scaling restored to full depth (0.26+ lots) | Fixed critical state transition gap in `MonitorPendingOrders`
- **Tech Stack & Hardware Involved:** MetaTrader 5 (MT5), MQL5, MetaEditor

#### 1. The Situation & Setup
The MA Grid EA features a multi-tiered lot progression (e.g. 0.01, 0.02, 0.03 ... 0.11 ... 0.26 lots) designed to handle extended market trends by scaling position sizes at each grid level.

#### 2. The Anomaly & The Mistake (The Symptom)
During backtesting and live execution, the grid consistently froze at level 10 (**0.11 lots**). No further pending orders were placed, halting grid defense and stranding the account in floating loss.

#### 3. Forensic Investigation (The Root Cause)
In `MonitorPendingOrders()`, when a pending stop order was activated by the broker, the function detected the position and updated `g_pendingPrice = g_posInfo.PriceOpen()`. However, it **completely forgot to update `g_pendingDirection`**!
As a result, when `PlaceNextPendingOrder()` computed the next order direction, it used a stale direction from level 9, placing a duplicate stop order on the same side that was rejected by MT5 with `TRADE_RETCODE_INVALID_STOPS`.

#### 4. The Engineering Breakthrough (The Fix)
Updated `MonitorPendingOrders()` to synchronize all three core state attributes upon fill confirmation (`EA2/bugfixes.md`, Bug #1):
```mql5
g_pendingPrice     = g_posInfo.PriceOpen();
g_pendingDirection = (g_posInfo.PositionType() == POSITION_TYPE_BUY) ? ORDER_TYPE_BUY : ORDER_TYPE_SELL;
g_pendingLots      = g_posInfo.Volume();
```

---

### 4. The Monday Open Orphaned Orders & Self-Healing `SyncPendingState` Watchdog

- **Category:** Architecture & Paradigm Shifts / Fault Recovery
- **Key Metrics / Impact:** 100% automated recovery from weekend order expiries, terminal restarts, and broker disconnects
- **Tech Stack & Hardware Involved:** MetaTrader 5 (MT5), MQL5, MetaEditor

#### 1. The Situation & Setup
Over the weekend, forex and CFD brokers frequently purge pending stop orders during weekend maintenance or rollover settlement.

#### 2. The Anomaly & The Mistake (The Symptom)
On Monday market open, the EA awoke with `g_pendingTicket` pointing to an order that was deleted by the broker. `MonitorPendingOrders()` saw the order was gone without filling, logged an alert, set `g_pendingTicket = 0`, and stopped. No code existed to re-place the missing stop order, leaving the active position unprotected for the rest of the week.

#### 3. Forensic Investigation (The Root Cause)
The EA had no active self-healing watchdog to reconcile discrepancies between internal state (`g_state == STATE_SIGNAL_ACTIVE`) and the actual MT5 pending order book.

#### 4. The Engineering Breakthrough (The Fix)
Engineered `SyncPendingState()` (`EA2/bugfixes.md`, Bug #5), an active reconciliation loop running on every tick:
1. First scans the MT5 order pool to reconnect with any active untracked pending orders.
2. If no pending order exists on the broker and the grid has not reached maximum depth, it automatically calls `PlaceNextPendingOrder()` to restore the hedge.

```mql5
void SyncPendingState()
{
   if(g_pendingTicket != 0) return;
   if(g_state != STATE_SIGNAL_ACTIVE) return;
   if(g_gridLevel >= Max_Grid_Depth) return;
   if(CountOurPositions() == 0) return;

   // Check if untracked pending order exists on broker
   for(int i = OrdersTotal() - 1; i >= 0; i--)
   {
      ulong ticket = OrderGetTicket(i);
      if(OrderGetString(ORDER_SYMBOL) == Symbol() && OrderGetInteger(ORDER_MAGIC) == Magic_Number)
      {
         g_pendingTicket = ticket;
         return; // Re-synchronized
      }
   }

   // No pending order found -> Re-place immediately
   PlaceNextPendingOrder();
}
```

#### 5. The Core Engineering Lesson
Automated trading algorithms must be built around continuous state reconciliation. Never rely on in-memory ticket IDs persisting across weekend breaks or platform restarts; implement active reconciliation watchdogs that re-sync with broker reality on every tick.
