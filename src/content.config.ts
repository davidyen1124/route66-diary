import { defineCollection, z } from "astro:content";

const blog = defineCollection({
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    heroImage: z.string().optional(),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    locationSource: z.enum(["explicit", "inferred"]).optional(),
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
