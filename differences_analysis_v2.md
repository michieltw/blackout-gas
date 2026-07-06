# Analysis: Updated GAS Frontend vs React Project (V2)

## 1. New Functional Additions in V2

| Feature | Description |
| :--- | :--- |
| **Game Settings** | New entity `GameSetting` and modal `Wedstrijd Regels`. Allows configuring rules per league (period lengths, shootout rules, etc.). |
| **Player Stats View** | Dedicated `viewStats` screen with a comprehensive table including `Stick Model` and `Training Attendance (%)`. |
| **Expanded Player Schema** | Players now track `stick_model`, `training_total`, `training_attended`, and `games_played`. |
| **Scorekeeper Permissions** | Settings modal includes toggles for visibility and editability by scorekeepers. |

## 2. Updated Integration Goals
1. **Dark Theme for Stats:** Apply the modern dark table style to the new Player Statistics view.
2. **Settings Modal UI:** Design a clean, responsive interface for the "Wedstrijd Regels" modal using the dark theme and Lucide icons.
3. **Data Field Consistency:** Ensure `current_team_id` and new player fields are correctly integrated without regressions.
4. **Enhanced Navigation:** Add the "Player Stats" icon (`bar-chart-3`) to the sidebar.
5. **Logic Restoration:** Carry over the "Parent Team" and "Farm Team" logic from the previous fix iteration.
