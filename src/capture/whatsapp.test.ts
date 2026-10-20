import { describe, expect, it } from "vitest";
import { extractWithRules } from "./rules";
import { exportInstant, looksLikeWhatsAppExport, MAX_EXPORT_MESSAGES, parseWhatsAppExport } from "./whatsapp";

const IPHONE = [
  "[12/10/2026, 9:42:15 AM] Siti (Project A site): Boss, need 1,500 m3 AAC 100mm by Tue 20 Oct. Can confirm ya",
  "[12/10/2026, 9:50:03 AM] Hakim: Project D perlukan seribu lima ratus kubik AAC 100mm 28hb",
  "dan tolong hantar pagi",
  "[12/10/2026, 10:01:00 AM] Messages and calls are end-to-end encrypted.",
  "[12/10/2026, 10:02:00 AM] Hakim: <Media omitted>",
  "[12/10/2026, 10:03:00 AM] Lim: ok thanks",
].join("\n");

const ANDROID = ["12/10/2026, 9:42 am - Siti: Project A need 500 m3 AAC 100mm by Tue 20 Oct", "12/10/2026, 6:05 pm - Lim: ok"].join("\n");

describe("a pasted WhatsApp export", () => {
  it("is told apart from a typed message by its first line", () => {
    expect(looksLikeWhatsAppExport(IPHONE)).toBe(true);
    expect(looksLikeWhatsAppExport(ANDROID)).toBe(true);
    expect(looksLikeWhatsAppExport("\n\n  [12/10/2026, 9:42 AM] A: hi")).toBe(true);
    expect(looksLikeWhatsAppExport("Boss, Project A site need 1,500 m3 AAC 100mm by Tue 20 Oct. Can confirm ya")).toBe(false);
    expect(looksLikeWhatsAppExport("")).toBe(false);
  });

  it("splits the iPhone shape into messages, joins continuation lines, and drops system and media lines", () => {
    const r = parseWhatsAppExport(IPHONE);
    expect(r.messages.map((m) => [m.id, m.sender])).toEqual([["chat-1", "Siti (Project A site)"], ["chat-2", "Hakim"], ["chat-3", "Lim"]]);
    expect(r.messages[1]!.text).toBe("Project D perlukan seribu lima ratus kubik AAC 100mm 28hb\ndan tolong hantar pagi");
    expect(r.ignored).toBe(2);
    expect(r.truncated).toBe(false);
    expect(r.messages.every((m) => m.channel === "whatsapp")).toBe(true);
  });

  it("splits the Android shape too, with am and pm", () => {
    const r = parseWhatsAppExport(ANDROID);
    expect(r.messages.map((m) => m.sender)).toEqual(["Siti", "Lim"]);
    expect(r.messages[0]!.receivedAt).toBe("2026-10-12T01:42:00Z"); // 9:42 am in Malaysia (UTC+8)
    expect(r.messages[1]!.receivedAt).toBe("2026-10-12T10:05:00Z");
  });

  it("reads each message with the same rules reader a typed message gets, using the time it arrived", () => {
    const [first, second] = parseWhatsAppExport(IPHONE).messages;
    const a = extractWithRules(first!)[0]!;
    expect(a.volumeM3).toMatchObject({ value: 1500, confidence: "confirmed" });
    expect(a.neededBy).toMatchObject({ value: "2026-10-20", confidence: "confirmed" });
    expect(extractWithRules(second!)[0]!.volumeM3).toMatchObject({ value: 1500, confidence: "inferred" });
  });

  it("strips the invisible marks and narrow spaces that WhatsApp inserts", () => {
    const r = parseWhatsAppExport("‎[12/10/2026, 9:42:15 AM] Siti: ‎Project A need 500 m3 AAC 100mm");
    expect(r.messages).toHaveLength(1);
    expect(r.messages[0]!.text).toBe("Project A need 500 m3 AAC 100mm");
  });

  it("keeps colons inside the message and the sender intact", () => {
    const r = parseWhatsAppExport("[12/10/2026, 9:42 AM] Siti: Project A: need 500 m3 AAC 100mm at 9:30");
    expect(r.messages[0]).toMatchObject({ sender: "Siti", text: "Project A: need 500 m3 AAC 100mm at 9:30" });
  });

  it("caps the number of messages and says so", () => {
    const many = Array.from({ length: MAX_EXPORT_MESSAGES + 4 }, (_, i) => `[12/10/2026, 9:${String(10 + i).padStart(2, "0")} AM] A: Project A ${i}`).join("\n");
    const r = parseWhatsAppExport(many);
    expect(r.messages).toHaveLength(MAX_EXPORT_MESSAGES);
    expect(r.truncated).toBe(true);
  });

  it("ignores impossible dates instead of inventing a time", () => {
    const r = parseWhatsAppExport("[31/02/2026, 9:42 AM] A: Project A 500 m3\n[12/13/2026, 9:42 AM] B: Project B 500 m3 AAC\n[12/10/2026, 25:00] C: x");
    // One line can only be day-first (31/02) and another only month-first (12/13): the export contradicts itself, so no
    // reading is trusted and every line is left out, rather than guessing which lines to believe.
    expect(r.messages).toEqual([]);
    expect(r.ignored).toBe(3);
  });

  it("returns nothing for text that is not an export", () => {
    expect(parseWhatsAppExport("just a plain message")).toEqual({ messages: [], ignored: 0, truncated: false, dateOrderAssumed: false });
  });
});

describe("export timestamps", () => {
  it.each([
    ["12/10/2026", "9:42 AM", "2026-10-12T01:42:00Z"],
    ["12/10/26", "12:00 AM", "2026-10-11T16:00:00Z"],
    ["12/10/2026", "12:30 PM", "2026-10-12T04:30:00Z"],
    ["2026-10-12", "21:05", "2026-10-12T13:05:00Z"],
    ["1/1/2026", "0:15", "2025-12-31T16:15:00Z"],
  ])("%s %s is %s", (d, t, iso) => {
    expect(exportInstant(d, t)).toBe(iso);
  });

  it.each([["31/02/2026", "9:00"], ["12/10/2026", "13:00 PM"], ["12/10/2026", "9:61"], ["00/10/2026", "9:00"]])("%s %s is refused", (d, t) => {
    expect(exportInstant(d, t)).toBeNull();
  });
});

describe("years the demo will not read", () => {
  it.each(["1/1/0500", "31/12/9999", "1/1/1999", "1/1/2100"])("%s is refused, so the line is ignored instead of building a date the app cannot parse", (d) => {
    expect(exportInstant(d, "9:00 AM")).toBeNull();
    const r = parseWhatsAppExport(`[${d}, 9:00 AM] B: Contractor C nak 600 m3 AAC 100mm 26 Oct`);
    expect(r.messages).toEqual([]);
    expect(r.ignored).toBe(1);
  });
});

describe("date order is settled once per export", () => {
  it("reads a month-first export consistently, so 10/12 and 10/13 are 12 Oct and 13 Oct, not 10 Dec and 13 Oct", () => {
    const r = parseWhatsAppExport("[10/12/2026, 9:00 AM] A: Project A 500 m3 AAC 100mm\n[10/13/2026, 9:00 AM] B: Project B 500 m3 AAC 100mm");
    expect(r.messages.map((m) => m.receivedAt)).toEqual(["2026-10-12T01:00:00Z", "2026-10-13T01:00:00Z"]);
    expect(r.dateOrderAssumed).toBe(false);
  });
  it("reads a day-first export consistently, and says so when nothing decides", () => {
    expect(parseWhatsAppExport("[12/10/2026, 9:00 AM] A: Project A 500 m3\n[13/10/2026, 9:00 AM] B: Project B 500 m3").messages[0]!.receivedAt).toBe("2026-10-12T01:00:00Z");
    const open = parseWhatsAppExport("[10/12/2026, 9:00 AM] A: Project A 500 m3 AAC 100mm");
    expect(open.dateOrderAssumed).toBe(true);
    expect(open.messages[0]!.receivedAt).toBe("2026-12-10T01:00:00Z");
    expect(parseWhatsAppExport("[11/11/2026, 9:00 AM] A: Project A 500 m3").dateOrderAssumed).toBe(false);
  });
  it("refuses a three-digit year", () => {
    expect(exportInstant("12/10/202", "9:00 AM")).toBeNull();
  });
});
