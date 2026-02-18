import { readFileSync } from "fs";
import path from "path";

/** Remove script tags - they modify document.documentElement and cause hydration errors */
function stripScripts(html: string): string {
  return html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");
}

/** Extract body content from full HTML document to avoid nested html/body */
function extractBodyContent(html: string): string {
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  const body = bodyMatch ? bodyMatch[1] : html;
  return stripScripts(body);
}

/** Extract head content (styles, links) for same look - skip script to avoid conflicts */
function extractHeadAssets(html: string): string {
  const headMatch = html.match(/<head[^>]*>([\s\S]*?)<\/head>/i);
  if (!headMatch) return "";

  const head = headMatch[1];
  const styles =
    head.match(/<style[^>]*>[\s\S]*?<\/style>/gi)?.join("") ?? "";
  const links =
    head.match(/<link[^>]+rel=["']stylesheet["'][^>]*>/gi)?.join("") ?? "";
  return styles + links;
}

export function getFakeLandingContent(templateFileName: string) {
  const filePath = path.join(
    process.cwd(),
    "src",
    "app",
    "landing-pages",
    templateFileName
  );
  const fullHtml = readFileSync(filePath, "utf-8");
  return {
    headAssets: extractHeadAssets(fullHtml),
    bodyContent: extractBodyContent(fullHtml),
  };
}
