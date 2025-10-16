# CollabCanvas Documentation

This folder contains all core project documentation for the CollabCanvas MVP development.

## 📋 Document Overview

### [PRD.md](./PRD.md)
**Product Requirements Document**

The single source of truth for product requirements, features, and acceptance criteria.

**Contents:**
- Executive summary and vision
- Core features and MVP scope
- Technical architecture overview
- Success metrics and performance targets
- Testing requirements
- Deployment specifications
- Explicitly out-of-scope features

**When to reference:**
- Before implementing any new feature
- When clarifying product requirements
- During scope discussions
- When writing acceptance tests

---

### [TASK_LIST.md](./TASK_LIST.md)
**Development Task Breakdown**

Granular, phase-by-phase breakdown of all development tasks for the MVP.

**Contents:**
- 7 development phases (Foundation → Submission)
- Checkboxes for task tracking
- Priority levels (Critical, High, Medium)
- Risk mitigation strategies
- Testing criteria per phase

**When to reference:**
- At the start of each work session
- To track progress
- To identify next tasks
- To understand task dependencies

**How to use:**
- Check off tasks as completed: `- [x] Task name`
- Follow phases sequentially
- Don't skip critical path items
- Check in after completing each task

---

### [ARCHITECTURE.md](./ARCHITECTURE.md)
**System Architecture & Technical Design**

Complete technical blueprint with architecture diagrams, data flows, and implementation patterns.

**Contents:**
- System architecture diagram (Mermaid)
- Layer-by-layer breakdown (Client, Services, Rendering, Backend)
- Data flow diagrams for key features
- Firestore collection schemas
- File structure and organization
- Performance considerations
- Security guidelines

**When to reference:**
- Before implementing any new component
- When making architectural decisions
- During code reviews
- When debugging sync or state issues
- When onboarding to the project

---

### [react-architecture-guide.md](./react-architecture-guide.md)
**React Development Standards**

Comprehensive guide for React SPA development patterns, best practices, and anti-patterns.

**Contents:**
- Component architecture principles
- State management patterns
- Custom hooks guidelines
- Performance optimization techniques
- TypeScript integration rules
- Testing requirements
- Code quality standards
- Common anti-patterns to avoid

**When to reference:**
- Before writing any React component
- When deciding on state management approach
- During code refactoring
- When reviewing code quality
- When performance optimization is needed

---

## 🎯 Quick Reference by Scenario

### "I'm starting a new task"
1. Check **TASK_LIST.md** for current task details
2. Review **PRD.md** for feature requirements
3. Reference **ARCHITECTURE.md** for technical approach
4. Follow patterns in **react-architecture-guide.md**

### "I need to implement a feature"
1. Verify it's in scope in **PRD.md**
2. Check task details in **TASK_LIST.md**
3. Review architecture in **ARCHITECTURE.md**
4. Follow React patterns in **react-architecture-guide.md**

### "I'm making an architectural decision"
1. Check if it aligns with **ARCHITECTURE.md**
2. Verify it supports MVP goals in **PRD.md**
3. Ensure it follows **react-architecture-guide.md** principles
4. If uncertain, ask before proceeding

### "I'm debugging an issue"
1. Check data flows in **ARCHITECTURE.md**
2. Review component patterns in **react-architecture-guide.md**
3. Verify requirements in **PRD.md**
4. Check if related task has notes in **TASK_LIST.md**

### "I'm doing a code review"
1. Verify against **react-architecture-guide.md** standards
2. Check adherence to **ARCHITECTURE.md** patterns
3. Confirm scope alignment with **PRD.md**
4. Mark task complete in **TASK_LIST.md**

---

## 📁 Related Documentation

### Context Summaries
Location: `../context-summaries/`

Task-by-task summaries created during development. These provide detailed context about:
- What was implemented
- Technical decisions made
- Current application state
- Known issues and TODOs
- Next steps

**Format:** `YYYY-MM-DD-task-name.md`

### Development Rules
Location: `../.cursorrules`

Rules and protocols for AI-assisted development, including:
- When to ask for clarification
- Task completion check-in process
- Context summary creation
- Code quality requirements
- Testing protocols

---

## 🔄 Document Update Protocol

### When to Update Documents

**PRD.md:**
- ✅ When MVP scope changes (requires approval)
- ✅ When adding new success metrics
- ❌ Not for implementation details

**TASK_LIST.md:**
- ✅ Check off completed tasks
- ✅ Add subtasks if needed for clarity
- ✅ Note blockers or issues
- ❌ Don't remove tasks (mark as N/A if truly not needed)

**ARCHITECTURE.md:**
- ✅ When adding new services or layers
- ✅ When changing data models
- ✅ When updating file structure
- ⚠️ Major changes require review

**react-architecture-guide.md:**
- ❌ This is a reference guide - don't modify
- ✅ Can add project-specific notes in separate file

### Update Process
1. Make proposed changes
2. Note changes in commit message
3. Review with team/lead
4. Update related documents if needed

---

## 🎓 Onboarding Checklist

New to the project? Read in this order:

- [ ] **PRD.md** - Understand the product vision and MVP scope
- [ ] **ARCHITECTURE.md** - Learn the technical design
- [ ] **react-architecture-guide.md** - Study React development standards
- [ ] **TASK_LIST.md** - See current progress and next tasks
- [ ] **../.cursorrules** - Understand development workflow
- [ ] **../context-summaries/** - Review recent development context

**Estimated reading time:** 60-90 minutes

---

## 📊 Document Maintenance

| Document | Owner | Update Frequency | Last Updated |
|----------|-------|------------------|--------------|
| PRD.md | Product | On scope changes | 2025-10-15 |
| TASK_LIST.md | Engineering | Daily (checkboxes) | 2025-10-15 |
| ARCHITECTURE.md | Engineering | On major changes | 2025-10-15 |
| react-architecture-guide.md | Reference | N/A (static) | 2025-10-15 |

---

## 💡 Tips for Effective Documentation Use

### Do:
✅ Reference docs before starting any task  
✅ Keep TASK_LIST.md checkboxes updated  
✅ Create context summaries after each task  
✅ Ask questions when docs are unclear  
✅ Suggest improvements to documentation  

### Don't:
❌ Skip reading relevant sections  
❌ Make assumptions without checking docs  
❌ Implement out-of-scope features  
❌ Deviate from architecture without discussion  
❌ Forget to update task status  

---

## 🔗 External Resources

- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Konva.js Docs](https://konvajs.org/docs/)
- [Firebase Documentation](https://firebase.google.com/docs)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)

---

## 📝 Document Versions

**Version 1.0** - Initial MVP documentation  
**Date:** October 15, 2025  
**Status:** Active Development

---

## Questions?

If documentation is unclear or missing information:
1. Check context summaries for recent decisions
2. Review related sections in other docs
3. Ask for clarification (per .cursorrules protocol)
4. Suggest documentation improvements

**Remember:** Good documentation saves time and prevents mistakes. When in doubt, read the docs!