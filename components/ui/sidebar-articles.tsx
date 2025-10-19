import { News, type NewsArticle } from "@/components/ui/sidebar-news";

const DEMO_ARTICLES: NewsArticle[] = [
  {
    href: "https://github.com/Gerome-Elassaad/codinit-app",
    title: "Download Latest Version",
    summary: "Completely new version built with webcontainers",
    image: "https://mintcdn.com/codinitdev/NU0f94GmbRUSPIZu/assets/images/home-dark.png?w=1650&fit=max&auto=format&n=NU0f94GmbRUSPIZu&q=85&s=84d3f741ee571067dd9fb3b6854db7cb",
  },
  {
    href: "https://docs.codinit.dev/mcp-integration/mcp",
    title: "MCP Templates",
    summary:
      "Build with your favourite tools use our MCP Marketplace or import your own.",
    image: "https://codinit.dev/mcp.png",
  },
  {
    href: "https://github.com/Gerome-Elassaad/codinit-app/releases",
    title: "New Chat Interface",
    summary:
      "Prompt & edit your code directly within the chat interface & deploy directly to vercel or netlify.",
    image: "https://codinit.dev/chat.png",
  },
];

export function NewsArticles() {
  return (
    <div className="w-full">
      <h3 className="text-sm font-medium text-foreground mb-3">Latest News</h3>
      <div className="space-y-3">
        {DEMO_ARTICLES.map((article) => (
          <div key={article.href} className="group cursor-pointer" onClick={() => window.open(article.href, '_blank')}>
            <div className="flex gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
              <div className="relative w-12 h-12 shrink-0 rounded overflow-hidden bg-muted">
                {article.image && (
                  <img
                    src={article.image}
                    alt={article.title}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                  {article.title}
                </h4>
                <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                  {article.summary}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export { NewsArticle };
