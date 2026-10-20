# Backup demo: screen-recording script

> For the case where the network or the hosted link fails during the pitch. Record this once on a good connection, at 1280 px wide, from a **local production build** (`npm run build`, then `npx next start -p 3111`) with the model layer off, so the recording matches what the hosted demo shows. Timings are effort estimates for pacing, not deadlines. The spoken lines are the "Say" column of `demo-notes-and-qa.md` §1; this file is only the click list.

Before you press record:

1. Stop any old `next start` (find the PID with `netstat -ano | findstr :3111`; an old server serves a stale build).
2. Start fresh with `PLR_LEDGER_MODE=cookie` so the demo starts with nothing recorded and "Start the demo again" works. Open `http://localhost:3111/` in a clean browser window.
3. Check the first thing on every page is the yellow notice (synthetic data, fictional parties, not Chin Hin data). Say it out loud once.

| Time | Click | Pause on |
|---|---|---|
| 0:00 | `/` Overview | The three sourced public figures, then the one-example rule (Project A RM435,616 versus Contractor B RM18,073). |
| 0:30 | **Board** | The six bars; Week 42 covered, Week 43 red. Click **Show 6 more weeks**, then **Show the first weeks only**. Scroll to Reserved slots and the float what-if. |
| 1:15 | **Try it** → pick the deck's message → **Read it** | Five chips, the four-step trace, "1,800 m³ free, 3,800 m³ already requested". Then **Read a sample WhatsApp chat export**: point at the "seribu lima ratus kubik" line read as Inferred. |
| 2:15 | **Decisions** | Type a name. Edit the reply to Contractor B. Click **Approve and send**. |
| 3:00 | **Outbox** | The row with your name and your edited words; "nothing was sent". |
| 3:15 | **Weekly huddle** | The 30:00 timer, four blocks, reserved slots, the credit to the plant. |
| 3:45 | **Ask the board** | Type "Can we take 800 m3 for Johor next week?"; read the answer and the draft reply. |
| 4:15 | **Call-offs** | Reserve 300 m³ for Project D in Week 46; the spare drops from 1,000 to 700 m³. |
| 4:45 | **Finance**, then **Pilot scorecard**, then **Sources** | One sentence each; **Download as CSV** on Finance. |
| 5:30 | **Decisions** → **Start the demo again** | Resets the run so the next take starts clean. |

If a take goes wrong, **Start the demo again** and record again. Do not edit the recording to hide a failure: the recording stands in for the live demo and must show what it shows.

Not in this recording (needs a key, and is off in the hosted demo): the model reader and the photo reader. If you want them on camera, run locally with `PLR_LLM_MODE=live` and a key you control, keep the take separate, and say it is the model reader.
