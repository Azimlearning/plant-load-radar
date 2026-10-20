# Reader evaluation: Rules reader

On the 22 invented sample messages with hand-written gold readings. The gold shares an author with the rules reader and the messages are invented, so this shows behaviour on these cases, not accuracy on real ones.

- Messages whose number of order lines matches the gold: 22 of 22 (100%)
- Messages where "needs a person" matches the gold: 22 of 22 (100%)
- Values the grounding step had to demote (the reader said confirmed, the words did not support it): 0

| Field | Right | Wrong | Value accuracy | Invented and confirmed | Correctly left unsure |
|---|---|---|---|---|---|
| customer | 21 | 0 | 100% | 0 | 0 |
| product | 21 | 0 | 100% | 0 | 0 |
| volumeM3 | 16 | 0 | 100% | 0 | 5 |
| neededBy | 20 | 0 | 100% | 0 | 1 |
| reference | 5 | 0 | 100% | 0 | 16 |

**Invented and confirmed** is the number to watch: a value the gold says is missing or conflicting that the reader still marked Confirmed after grounding. It should be zero.
