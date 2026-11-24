import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ClassDescription } from "@/components/class-description";

const render = (text: string) => renderToStaticMarkup(createElement(ClassDescription, { text }));

describe("class description Markdown", () => {
  it("renders headings, lists, emphasis and links under the class section heading", () => {
    const html = render("# What we cover\n\n- **Visa pathways**\n- [Official guidance](https://www.immigration.govt.nz/)");
    expect(html).toContain("<h3>What we cover</h3>");
    expect(html).toContain("<ul>");
    expect(html).toContain("<strong>Visa pathways</strong>");
    expect(html).toContain('href="https://www.immigration.govt.nz/"');
  });

  it("preserves single line breaks in existing descriptions", () => {
    expect(render("Wednesday, 12 pm\nThursday, 12 pm")).toMatch(/Wednesday, 12 pm<br\s*\/>\n?Thursday, 12 pm/);
  });

  it("does not render raw HTML, embedded images or unsafe links", () => {
    const html = render('<iframe src="https://example.com"></iframe>\n\n![Image](https://example.com/image.jpg)\n\n[Link](javascript:alert%281%29)');
    expect(html).not.toMatch(/<iframe|<img|javascript:/i);
    expect(html).toContain("Link");
  });
});
