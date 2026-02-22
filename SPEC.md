### Context

I currently manage a poker group tracker using a complex Excel workbook.

The Excel tracks:
- Poker sessions over time
- Multiple game types (Crazy, Texas, Pineapple, PLO)
- A fixed set of players + occasional guests
- For each session and player:
  - Number of rebuys
  - Profit/Loss

The workbook also contains summary sheets that calculate:
- Year-to-date total P&L per player
- P&L by game type
- Best / worst session
- Average rebuys
- Average buy-in
- Total sessions played
- Other aggregate stats

---

### Current Pain Points

The Excel solution has several structural limitations:

1. Rigid structure
   - Each player is represented by dedicated columns.
   - Adding a new player requires editing multiple sheets and formulas.

2. Hard-coded formulas
   - Summary sheets rely on fixed column references.
   - Any column shift breaks the logic.

3. Difficult scalability
   - Handling guests vs regular players is messy.
   - Historical stats are tightly coupled to layout.

4. No real data model
   - The file is essentially a UI layer with embedded logic.
   - No normalized structure.
   - No clear separation between data and analytics.

5. No automation
   - No API
   - No multi-user support
   - No history tracking or audit trail

---

### Goal

I want to replace the Excel system with a proper application backed by a real database.

The app should allow me to:

1. Track poker sessions easily
2. Manage players dynamically
3. Automatically compute statistics
4. Scale cleanly as the group grows

This is NOT meant to be a complex enterprise system.
It is a lightweight but well-designed personal tool.

---

### Core Functional Requirements

The system must support:

#### Player Management
- Create, edit, archive players
- Distinguish between regular players and temporary guests
- Keep a persistent player history

#### Session Tracking
For each poker session:
- Date
- Game type
- Max buy-in
- Participants

For each participant in a session:
- Number of rebuys
- Profit/Loss

Important: the model must support variable number of players per session.

---

### Analytics / Stats

The app must automatically compute per-player metrics:

Year-based stats:
- Total P&L
- P&L by game type
- Best / worst session
- Average buy-ins
- Average rebuys
- Total sessions played

It should also allow future extension like:
- Leaderboards
- Monthly breakdowns
- Trends over time

---

### Desired Direction (Architecture Level)

I want this designed using proper software principles:

- Normalized relational database schema
- Clear separation between:
  - Data layer
  - Business logic
  - Presentation layer

The design should follow standard patterns for:
- Many-to-many relationships
- Aggregation queries
- Efficient statistics computation

I want the system to be flexible enough so that:
- Adding new players requires zero schema changes
- Adding new game types is trivial
- Analytics can evolve without redesigning the database

---

### What I Want From You

Propose:

1. A clean database schema
2. Key entities and relationships
3. Recommended tech stack options
4. High-level API design
5. Suggested architecture (simple but scalable)
6. Optional UI approach ideas

Focus on clarity, maintainability, and simplicity.

Do NOT over-engineer.

Assume this is a personal project but designed like a professional system.

---

### Constraints

- Prefer simple, modern tools
- Avoid unnecessary complexity
- Keep the system easy to extend
- Prioritize developer productivity