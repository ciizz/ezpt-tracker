# CLAUDE.md

This project is developed using a coding agent.

This file defines the rules and constraints the agent must follow when working on this repository.

---

## 🧭 General Principles

- Keep the system simple and maintainable
- Do NOT overengineer
- Prefer clarity over abstraction
- Avoid unnecessary frameworks or complexity
- This is a personal project but should follow professional design standards

---

## 🔄 Required Development Workflow

The agent MUST always follow this order:

1. Read `SPEC.md`
2. Read `CLAUDE.md`
3. Propose architecture and implementation plan
4. Wait for approval
5. Implement step-by-step

The agent must NEVER:

- Start coding without proposing a plan first
- Introduce new technologies without justification
- Add features outside MVP scope
- Make breaking architectural changes without explanation

---

## 🧱 Technical Requirements

### Database

- Must use a relational database (PostgreSQL preferred)
- Must follow normalized schema design
- Must support many-to-many relationships cleanly
- Must allow adding players without schema changes

No NoSQL databases.

---

## 🔐 Authentication Model (Important)

The system must support a **very simple access model**:

### Public Access
- Anyone can access the app
- Anyone can view sessions and statistics
- No login required for viewing

### Admin Access
- There is only ONE admin user
- Admin authentication is required ONLY for write operations

The admin must be able to:
- Add/edit/delete sessions
- Add/edit/archive players

No other roles are needed.

Do NOT implement:
- Multi-user accounts
- Complex role systems
- Permissions frameworks
- Social login

Keep authentication extremely simple.

Acceptable approaches:
- Single admin password
- Environment-based admin credential
- Simple login session

Avoid overengineering.

---

## 🛠️ Stack Philosophy

The chosen stack must prioritize:

- Fast development speed
- Simplicity
- Maintainability
- Clear separation of concerns

Avoid:

- Overly complex frameworks
- Microservices
- Event-driven architecture
- Unnecessary infrastructure

This is a **single-admin personal app**, not an enterprise system.

---

## 🧩 Architecture Expectations

The system must be structured into clear layers:

### Data Layer
- Database schema
- Models
- Migrations

### Business Logic Layer
- Core domain logic
- Statistics calculations
- Validation

### API Layer
- CRUD endpoints
- Stats endpoints

### Frontend Layer
- Simple UI for session tracking and stats viewing

---

## 🪜 Implementation Strategy

The agent must implement in the following phases:

### Phase 1 — Database Foundation
- Schema design
- Migrations
- Seed data

### Phase 2 — Player Management
- Create / edit / archive players
- Player listing

### Phase 3 — Session Tracking
- Create sessions
- Add participants dynamically
- Record rebuys and profit/loss

### Phase 4 — Statistics Engine
- Yearly stats
- Game-type stats
- Aggregation queries

### Phase 5 — Authentication
- Implement simple admin login
- Protect write operations only

### Phase 6 — UI Layer
- Session entry page
- Player management page
- Stats dashboard

Each phase must be independently testable.

---

## 📊 Domain Rules

The system tracks poker sessions.

Key domain concepts:

- A session has a date, game type, and max buy-in
- A session has multiple participants
- Each participant has:
  - Number of rebuys
  - Profit/Loss

Players can participate in multiple sessions.

Guests may exist but should not require schema changes.

---

## 📁 Existing Excel File (Important Context)

The repository includes an existing Excel file representing the current tracking system.

The agent must:

- Treat the Excel file as a **reference only**
- Use it to understand:
  - Domain structure
  - Existing metrics
  - Current workflow
  - Required statistics

The agent must NOT attempt to replicate Excel’s layout.

Instead, the agent must design a proper normalized data model that supports the same functionality cleanly.

---

## 🚫 Non-Goals (Important)

Do NOT implement:

- Multi-user accounts
- Complex permissions systems
- Payments
- Real-time sync
- Mobile apps
- Notifications
- Advanced analytics

---

## ✅ Acceptance Criteria

The system must allow:

- Public viewing of all sessions and stats
- Admin-only write operations
- Adding players without schema changes
- Creating sessions with variable participants
- Tracking rebuys and profit/loss per participant
- Computing stats automatically
- Filtering stats by year
- Extending to new game types easily

---

## 🧪 Code Quality Expectations

- Use clear naming conventions
- Keep functions small and focused
- Avoid premature optimization
- Add comments for non-obvious logic
- Follow idiomatic patterns for the chosen stack

---

## 📚 Documentation Requirements

The agent must maintain a `README.md` that includes:

- How to run locally
- Database setup instructions
- Environment variables
- How to run migrations
- How to seed data

---

## 🤔 Decision-Making Behavior

When uncertain, the agent must:

- Ask clarifying questions
- Explain tradeoffs
- Provide recommendations
- Avoid making hidden assumptions

---

## 🧾 Execution Rule

Before writing any code, the agent must output:

- Proposed database schema
- Entity relationships
- API endpoints
- UI page structure
- Step-by-step implementation plan

Then wait for approval.

---

## End of CLAUDE.md