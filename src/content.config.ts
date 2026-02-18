import { defineCollection, z } from "astro:content";

const blog = defineCollection({
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    city: z.string().optional(),
    state: z.string().optional(),
    location: z.string().optional(),
    mapPoints: z
      .array(
        z.object({
          label: z.string(),
          latitude: z.number(),
          longitude: z.number(),
        }),
      )
      .optional(),
    mapPointHints: z.array(z.string()).optional(),
    weather: z.string().optional(),
  }),
});

export const collections = { blog };
