import { getCollection } from "astro:content";
import rss from "@astrojs/rss";
import { SITE_DESCRIPTION, SITE_TITLE } from "../consts";
import { buildBlogSlugIndex, blogEntryUrl } from "../lib/blogSlugs";

export async function GET(context) {
  const posts = await getCollection("blog");
  const slugIndex = buildBlogSlugIndex(posts);
  return rss({
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    site: context.site,
    items: posts.map((post) => ({
      ...post.data,
      link: blogEntryUrl(post, slugIndex),
    })),
  });
}
