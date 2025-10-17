# Context Summaries

This folder contains task-by-task development context summaries created during the CollabCanvas MVP development process.

## 📝 Purpose

Context summaries serve as **development breadcrumbs** that allow developers (human or AI) to:
- Understand what was implemented in previous sessions
- Learn about technical decisions and their rationale
- Quickly get up to speed on current application state
- Avoid repeating past mistakes or discussions
- Resume work seamlessly across sessions

**Think of these as:** A detailed development journal that captures the "why" and "how" behind code changes.

---

## 📁 File Naming Convention

**Format:** `YYYY-MM-DD-task-name.md`

**Examples:**
- `2025-10-15-canvas-pan-zoom.md`
- `2025-10-16-user-presence-system.md`
- `2025-10-17-rectangle-drawing-tool.md`

**Special files:**
- `SESSION_SUMMARY.md` - High-level summary created every ~10 tasks or 2 hours
- `SESSION_SUMMARY-YYYY-MM-DD.md` - Archived session summaries

---

## 📋 Summary Template

Each context summary should follow this structure:

```markdown
# Context Summary: [Task Name]
**Date:** [Date]
**Phase:** [Phase from TASK_LIST.md]
**Status:** Completed | In Progress | Blocked

## What Was Built
[2-3 sentence summary of what was implemented]

## Key Files Modified/Created
- `path/to/file.tsx` - [Brief description]
- `path/to/file.ts` - [Brief description]

## Technical Decisions Made
- [Decision 1 and rationale]
- [Decision 2 and rationale]

## Dependencies & Integrations
- [What this task depends on]
- [What future tasks depend on this]

## State of the Application
- [What works now]
- [What's not yet implemented]

## Known Issues/Technical Debt
- [Any compromises or TODOs]

## Testing Notes
- [How to test this feature]
- [Known edge cases]

## Next Steps
- [What should be done next]
- [Any prerequisites for next task]

## Code Snippets for Reference
[Include critical code patterns that future sessions should know about]

## Questions for Next Session
- [Any open questions or decisions deferred]
```

---

## 🎯 When to Create Summaries

### Required
- ✅ After completing any task in `_docs/TASK_LIST.md`
- ✅ After significant architectural decisions
- ✅ Before switching between development phases
- ✅ At end of work session (if tasks were completed)

### Recommended
- 💡 Before major refactoring efforts
- 💡 After resolving complex bugs
- 💡 When making tradeoff decisions
- 💡 After performance optimizations

### Optional
- 📝 After minor bug fixes
- 📝 After documentation updates
- 📝 During experimental/spike work

---

## 🔍 How to Use Context Summaries

### Starting a New Session
1. Check `SESSION_SUMMARY.md` for high-level state
2. Read the most recent 2-3 task summaries
3. Identify the next task from `_docs/TASK_LIST.md`
4. Reference relevant summaries for context

### When Stuck or Debugging
1. Search summaries for related features/components
2. Review technical decisions that might be relevant
3. Check "Known Issues" sections for similar problems
4. Look at code snippets for reference patterns

### During Code Review
1. Reference summary for context on changes
2. Verify decisions align with documented rationale
3. Check if known issues were addressed

### For Onboarding
1. Read summaries in chronological order
2. Focus on "Technical Decisions" and "State of Application"
3. Note patterns in "Code Snippets for Reference"
4. Review "Known Issues" to understand technical debt

---

## 🔄 Maintenance Guidelines

### During Development
- Create summaries immediately after completing tasks
- Update `SESSION_SUMMARY.md` every ~10 tasks
- Keep summaries concise but informative (aim for 1-2 pages)

### Periodic Review
- Archive old session summaries monthly
- Review summaries for patterns (repeated issues, common decisions)
- Update templates if needed

### Git Tracking
These files **should be committed** to Git because they:
- Provide valuable context for team members
- Document decision-making process
- Help with onboarding
- Support code archaeology

**Exception:** `SESSION_SUMMARY.md` (working file) can be .gitignored if it's too noisy during active development.

---

## 💡 Best Practices

### Writing Good Summaries

**Do:**
- ✅ Be specific about what was implemented
- ✅ Explain *why* decisions were made, not just *what*
- ✅ Include code snippets for non-obvious patterns
- ✅ Note what was tried but didn't work
- ✅ Flag dependencies for future tasks
- ✅ Be honest about technical debt

**Don't:**
- ❌ Write overly verbose summaries (keep under 2 pages)
- ❌ Skip explaining technical decisions
- ❌ Forget to update "State of Application"
- ❌ Leave out known issues or TODOs
- ❌ Copy/paste large code blocks (link to files instead)

### Example: Good vs Bad

**❌ Bad Summary:**
```markdown
# Context Summary: Add Login

Created login component. It works.

## Files Changed
- Login.tsx
```

**✅ Good Summary:**
```markdown
# Context Summary: User Presence System

Implemented real-time user presence tracking using Firestore onSnapshot listeners.

## Technical Decisions Made
- Used Firestore's onDisconnect() for automatic cleanup vs polling heartbeats
  - Rationale: More reliable, less network overhead
- Debounced cursor updates to 50ms to meet performance requirements
  - Tested: 16ms (60fps) caused excessive Firestore writes
  
## Known Issues
- Users disconnecting mid-drag don't release locks immediately (30-60s delay)
  - Workaround: onDisconnect handler, but needs manual testing
  
## Next Steps
- Implement cursor rendering (depends on this presence data)
- Add visual indicator for disconnected users
```

---

## 🔎 Quick Search Guide

Looking for something specific? Search summaries for:

### Architecture Decisions
**Search for:** "Technical Decisions", "Rationale", "Trade-off"

### Performance Issues
**Search for:** "Performance", "Optimization", "60 FPS", "Latency"

### Known Bugs
**Search for:** "Known Issues", "TODO", "Bug", "Edge case"

### Integration Points
**Search for:** "Dependencies", "Integrations", "Depends on"

### Code Patterns
**Search for:** "Code Snippets", "Pattern", "Example"

---

## 📈 Success Metrics

Good context summaries should enable:
- ⏱️ **Faster onboarding** - New developers productive in <1 hour
- 🔄 **Seamless handoffs** - Pick up work without long explanations
- 🐛 **Easier debugging** - Find root cause by searching past decisions
- 📚 **Knowledge retention** - Understand why things were built a certain way
- 🚀 **Velocity** - Less time clarifying, more time building

---

## 🗂️ Archive Policy

**When to archive:**
- After MVP completion
- When starting new major features
- Every 50+ summaries

**How to archive:**
```bash
mkdir archives/mvp-development
mv 2025-10-*.md archives/mvp-development/
```

**What to keep accessible:**
- Current phase summaries
- Recent session summaries
- Architectural decision summaries

---

## 📞 Questions?

If you're unsure about:
- **What to include?** → Follow the template, focus on decisions and rationale
- **How detailed?** → Enough that someone else can continue your work
- **When to create?** → After every completed task, per `.cursorrules`

**Remember:** Future you (or future AI) will thank you for good summaries!

---

## 📝 Template Files

For convenience, a blank template is available:
- Copy `TEMPLATE.md` when creating new summaries
- Or use the Cursor AI agent (it creates them automatically)

---

**Last Updated:** October 15, 2025  
**Status:** Active Development  
**Summaries Created:** 0 / ~30 (estimated for MVP)