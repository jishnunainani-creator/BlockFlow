

---

# ⚡ BlockFlow
> **Plan visually. Execute consistently. Improve intelligently.**

**BlockFlow** is a modern, high-performance personal interactive timetable manager and productivity intelligence platform. Built for students, developers, and professionals, BlockFlow replaces tedious manual daily planning with reusable activity blocks, visual drag-and-drop scheduling, smart conflict detection, multi-state task completion tracking, and AI-driven schedule intelligence.

---

## ✨ Features & Capabilities

### 🧩 1. Reusable Activity Block Library
- **One-Time Creation**: Create reusable blocks for courses, study goals, fitness, meetings, or side projects once and drag them into your timetable indefinitely.
- **Customization**: Every block features custom title, description/notes, color accents, priority levels, visual icon selector (15 icons), and default durations.
- **Custom Category Creator (`+ Add Category`)**: Create personalized categories (e.g., *Gaming*, *Side Project*, *Research*, *Music*) with automatic `LocalStorage` persistence.
- **Library Filtering & Sorting**: Filter blocks by category pills or color swatches, search by keyword, and sort by *Recently Used* or *Most Popular* usage counters.

### 📅 2. Interactive Drag & Drop Timetable Grid
- **Day & Date Header**: 7-day grid (Mon–Sun) with dynamic column headers displaying **Day Name + Exact Date** (e.g., `Mon, Jul 27`) and a glowing **TODAY** pulse indicator.
- **Fluid Drag & Drop**: Drag blocks from the library onto any time slot, or move scheduled blocks between days and times.
- **Snap Resizing**: Bottom handle vertical drag to resize duration with live snapping and duration tooltips.
- **Flexible Grid Resolution**: Switch grid intervals between `15m`, `30m`, `45m`, `60m`, `2h (120m)`, and `4h (240m)`.

### ⚠️ 3. Smart Conflict Detection & Resolution
- **Overlap Detection**: Automatically detects when two or more activity blocks overlap in the same time slot.
- **Conflict Banner & Drawer**: Displays warning badges (`⚠️`) on conflicting blocks and offers an interactive **Free Time Slot Suggestion Drawer** to resolve overlaps.

### ⌨️ 4. Productivity Keyboard Shortcuts
- `Ctrl + C` — Copy selected block
- `Ctrl + V` — Paste copied block
- `Ctrl + D` — Duplicate selected block
- `Delete` / `Backspace` — Remove selected block
- `Ctrl + Z` / `Ctrl + Y` — Full Undo & Redo state engine
- `Arrow Keys` — Navigate between timetable grid cells
- `Esc` — Deselect all active selections

### 📊 5. Multi-State Task Completion Tracking
- **7 Completion States**: Single-tap status switcher directly on timetable blocks supporting:
  - ⏳ `Not Started`
  - ▶️ `In Progress`
  - ✅ `Completed as Planned`
  - ⏱️ `Took Longer`
  - ⚡ `Finished Faster`
  - ⏭️ `Skipped`
  - ❌ `Missed`
- **Visual Distinction**: Completed or skipped tasks feature checkmarks, opacity tuning, line-through text, and colored status badges.

### 🤖 6. AI Productivity Intelligence Engine
- **Schedule Adherence Score**: Computes real-time adherence score (0–100%) and letter grade (`A+` to `D`).
- **Pattern Recognition**: Analyzes peak efficiency windows (morning vs. evening completion rates), detects late-night fatigue trends, and warns against high-intensity task overload without breaks.
- **Weekly AI Performance Review Report**: End-of-week report modal detailing top days, most productive activities, and 3 actionable AI recommendations.
- **✨ Adaptive AI Smart Schedule**: One-click action that auto-generates an optimized 7-day timetable fitting high-priority blocks into peak focus slots.

### 📑 7. Schedule Templates System
- **Save Active Week**: Save your current week's schedule as a reusable template.
- **Preset Routines**: 1-click loading of pre-configured schedule templates (e.g., *College Week Routine*).

### 📈 8. Productivity Analytics Dashboard
- Visual workload breakdown, category pie/bar distribution, daily total time, and top activity rankings.

### 🔔 9. Smart Reminders & Notifications
- Integrates browser **Web Notifications API** and Web Audio chimes to alert you 15 minutes before scheduled activities begin.

### 🌓 10. Dual-Theme Support & High Contrast
- Seamless switching between **Dark Mode**, **Light Mode**, and **System Theme** with high-contrast text visibility.

### ☁️ 11. Cloud Backup & Export
- **JSON Cloud Sync**: Full JSON export and import for cross-device backup and restoration.
- **High-Res Export**: Export timetable grid as a PNG image (`html2canvas`) or printable PDF vector document.

---

## 🛠️ Technology Stack

- **Core**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS v4, Vanilla CSS Design System Tokens
- **Icons**: Lucide React
- **Exporting**: Html2canvas, Native Browser Print Engine
- **Storage**: Client-Side `localStorage` with JSON Schema Validation
- **Architecture**: Modular React Context (`TimetableContext`, `ThemeContext`, `useUndoRedo`)
