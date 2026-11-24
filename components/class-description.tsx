import Markdown from "react-markdown";
import remarkBreaks from "remark-breaks";

export function ClassDescription({ text }: { text: string }) {
  return <div className="class-description">
    <Markdown
      skipHtml
      remarkPlugins={[remarkBreaks]}
      disallowedElements={["img"]}
      components={{ h1: "h3", h2: "h3", h3: "h3", h4: "h4", h5: "h4", h6: "h4" }}
    >{text}</Markdown>
  </div>;
}
