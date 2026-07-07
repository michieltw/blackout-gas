# Analysis: GAS Frontend vs React Project

## 1. Functional Differences

| Feature | GAS Frontend (HTML/JS) | React Project |
| :--- | :--- | :--- |
| **XP System** | Integrated `XP_THRESHOLDS` and `LEVEL_NAMES` in code. Direct `xp` field in Player. | `src/lib/xp.js` utility. Logic matches GAS (thresholds/names). |
| **League Management** | `league-switcher` in sidebar. Support for "Standard League" fallback in `localStorage`. | Currently single-league focused in UI (no switcher visible in `AppLayout.jsx`). |
| **Admin Operations** | Modals for creating Teams, Players, and Games. | Dedicated `/admin` and `/scorekeeper` pages. |
| **Data Fetching** | `api.call` wrapper (supports GAS & Mock). Logic in `navigate` function. | `react-query` and `base44Client.js`. Components handle their own state/fetching. |
| **Routing** | Custom `navigate` function with `view` strings and `params`. | `react-router-dom` with real URLs and `Outlet`. |
| **Live View** | Rink visualization and Play-by-Play list. | `SpectatorView.jsx` (similar rink/events layout). |

## 2. Design & UI/UX Differences

| Aspect | GAS Frontend (HTML/JS) | React Project (Target Style) |
| :--- | :--- | :--- |
| **Theme** | Light/Mixed (White bg, Slate sidebar). | Dark Mode (Pure black/dark grey bg). |
| **Accent Color** | Strong Gold/Yellow (`#eab308`). | Primary White/Light Gray with "Papaya Yellow" accents. |
| **Borders/Corners** | Very round (`rounded-3xl`, `2rem`). | Moderate roundness (`rounded-xl` / `0.75rem`). |
| **Typography** | Default Sans + Monospace for clocks. | 'Inter' for UI, 'JetBrains Mono' for data/clocks. |
| **Visual Depth** | Heavy shadows and pulse animations. | Flat/Minimalist with subtle glassmorphism (`glass-panel`). |
| **Navigation** | Fixed icons in dark sidebar. | Collapsible sidebar with active states (`primary/10`). |

## 3. Implementation Goals for Updated GAS Code
1. **Apply React Dark Theme:** Use CSS variables for `--background: 0 0% 5%`, `--card: 0 0% 8%`, etc.
2. **Standardize Components:** Update cards, buttons, and tables to match Shadcn UI design.
3. **Refine UX:** Clean up the sidebar, improve modal styling, and ensure responsive consistency.
4. **Preserve Logic:** Keep the `LeagueSwitcher`, XP system thresholds, and GAS API compatibility.
5. **Color Palette:** Shift from "Gold" to "Papaya Yellow" (`#FFD700` or HSL equivalent) used sparingly.
