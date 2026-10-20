import { describe, expect, it } from "vitest";
import { parseMalayNumber } from "./malay-numbers";

describe("Bahasa Malaysia number words", () => {
  it.each([
    ["seribu lima ratus", 1500],
    ["seribu", 1000],
    ["dua ribu", 2000],
    ["dua ribu lima ratus", 2500],
    ["tiga ribu dua ratus lima puluh", 3250],
    ["lima ratus", 500],
    ["seratus", 100],
    ["seratus dua puluh", 120],
    ["sepuluh", 10],
    ["sebelas", 11],
    ["dua belas", 12],
    ["sembilan belas", 19],
    ["lima puluh", 50],
    ["dua ratus lima puluh ribu", 250000],
    ["dua ribu dan lima ratus", 2500],
    ["  Seribu   LIMA ratus ", 1500],
  ])("reads %j as %i", (words, n) => {
    expect(parseMalayNumber(words)).toBe(n);
  });

  it.each(["", "   ", "lima lima", "belas", "ratus", "ribu", "seribu seribu", "dua ribu tiga ribu", "seribu dua ribu", "setengah ribu", "lima hundred", "kubik", "dua ratus tiga ratus", "seratus lima ratus", "lima ratus seribu", "tiga puluh lima ratus", "lima puluh dua ratus", "sepuluh sepuluh", "dua puluh dua puluh", "dua puluh sebelas", "sebelas dua", "dua belas tiga", "sepuluh lima"])("will not guess at %j", (words) => {
    expect(parseMalayNumber(words)).toBeNull();
  });
});
