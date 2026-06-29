import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";

// Author-supplied recipe bodies are rendered as Markdown. This is safe because
// react-markdown does NOT render raw HTML (no rehype-raw), so any embedded markup
// is escaped to text; URLs are sanitized by react-markdown's default transform
// (javascript:/data: etc. are dropped). Images are disabled on purpose — photo
// support is deferred, and this avoids arbitrary external image loads.
const components: Components = {
  a(props) {
    const { href, title, children } = props;
    const external = !!href && /^https?:\/\//i.test(href);
    return (
      <a
        href={href}
        title={title}
        {...(external
          ? { target: "_blank", rel: "noopener noreferrer nofollow ugc" }
          : {})}
      >
        {children}
      </a>
    );
  },
};

/** Renders a recipe body string as Markdown (links, bold, lists, headings, code). */
export function RecipeBody({ content }: { content: string }) {
  return (
    <div className="recipe-body text-[15px]">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        disallowedElements={["img"]}
        unwrapDisallowed
        components={components}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
