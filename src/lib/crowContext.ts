export interface CrowPageContext {
  pageType: "blog_post" | "site_page";
  path: string;
  slug?: string | null;
  day?: number | null;
  pubDate?: string;
  postTitle?: string;
  location?: string;
  city?: string | null;
  state?: string | null;
}

