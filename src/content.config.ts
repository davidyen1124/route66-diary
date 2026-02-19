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
          latitude: z.number().optional(),
          longitude: z.number().optional(),
        }),
      )
      .optional(),
    weather: z.string().optional(),
    tags: z.array(z.string()).optional(),
  }),
});

export const collections = { blog };
