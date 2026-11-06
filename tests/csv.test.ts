import { describe, expect, it } from "vitest";
import { csvCell } from "@/lib/csv";

describe("CSV fields", () => {
  it("quotes delimiters, quotes and line breaks", () => {
    expect(csvCell('A, "B"\nC')).toBe('"A, ""B""\nC"');
  });
  it("neutralises spreadsheet formulas", () => {
    for (const value of ["=SUM(1,2)", "+cmd", "-cmd", "@cmd", "  =cmd", "\tcmd"]) expect(csvCell(value)).toBe(`"'${value}"`);
    expect(csvCell(null)).toBe('""');
  });
});
