import { defineType, defineField } from 'sanity';

export const articleSchema = defineType({
  name: 'article',
  title: 'Article',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: { source: 'title', maxLength: 96 },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'tag',
      title: 'Category Tag',
      type: 'string',
      description: 'e.g. "AWS", "GenAI", "Security", "Networking"',
    }),
    defineField({
      name: 'excerpt',
      title: 'Excerpt',
      type: 'text',
      rows: 3,
      description: 'Short description shown on the article listing page.',
      validation: (Rule) => Rule.required().max(300),
    }),
    defineField({
      name: 'author',
      title: 'Author',
      type: 'string',
      initialValue: 'Katalyst Team',
    }),
    defineField({
      name: 'publishedAt',
      title: 'Published At',
      type: 'datetime',
    }),
    defineField({
      name: 'readTime',
      title: 'Read Time',
      type: 'string',
      description: 'e.g. "5 min read"',
    }),
    defineField({
      name: 'accessTier',
      title: 'Access Tier',
      type: 'string',
      options: {
        list: [
          { title: 'Free — all registered users', value: 'free' },
          { title: 'Premium — paid subscribers only', value: 'premium' },
        ],
        layout: 'radio',
      },
      initialValue: 'free',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'featured',
      title: 'Featured',
      type: 'boolean',
      description: 'Show this article prominently on the Resources page.',
      initialValue: false,
    }),
    defineField({
      name: 'coverImage',
      title: 'Cover Image',
      type: 'image',
      options: { hotspot: true },
    }),
    defineField({
      name: 'body',
      title: 'Body',
      type: 'array',
      of: [
        { type: 'block' },
        {
          type: 'image',
          options: { hotspot: true },
          fields: [
            {
              name: 'caption',
              title: 'Caption',
              type: 'string',
            },
            {
              name: 'alt',
              title: 'Alt text',
              type: 'string',
            },
          ],
        },
        {
          name: 'codeBlock',
          title: 'Code Block',
          type: 'object',
          fields: [
            { name: 'language', title: 'Language', type: 'string', description: 'e.g. python, typescript, bash' },
            { name: 'code', title: 'Code', type: 'text' },
          ],
          preview: {
            select: { language: 'language', code: 'code' },
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            prepare(value: any) {
              return { title: `[${value.language ?? 'code'}]`, subtitle: value.code?.slice(0, 60) };
            },
          },
        },
        {
          name: 'callout',
          title: 'Callout / Tip',
          type: 'object',
          fields: [
            { name: 'text', title: 'Text', type: 'text' },
            {
              name: 'variant',
              title: 'Variant',
              type: 'string',
              options: { list: ['info', 'warning', 'success'], layout: 'radio' },
              initialValue: 'info',
            },
          ],
          preview: {
            select: { text: 'text' },
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            prepare(value: any) {
              return { title: '💡 Callout', subtitle: value.text?.slice(0, 60) };
            },
          },
        },
        {
          name: 'youtubeEmbed',
          title: 'YouTube Embed',
          type: 'object',
          fields: [
            { name: 'videoId', title: 'YouTube Video ID', type: 'string', description: 'The part after ?v= in the URL' },
            { name: 'title', title: 'Video title', type: 'string' },
          ],
          preview: {
            select: { videoId: 'videoId', title: 'title' },
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            prepare(value: any) {
              return { title: `▶ ${value.title ?? value.videoId}` };
            },
          },
        },
      ],
    }),
    defineField({
      name: 'provider',
      title: 'Cloud Provider',
      type: 'string',
      description: 'Primary cloud platform this article covers.',
      options: {
        list: [
          { title: 'AWS', value: 'AWS' },
          { title: 'GCP (Google Cloud)', value: 'GCP' },
          { title: 'Azure', value: 'Azure' },
          { title: 'Oracle Cloud', value: 'Oracle' },
          { title: 'Databricks', value: 'Databricks' },
          { title: 'Snowflake', value: 'Snowflake' },
          { title: 'General / Multi-cloud', value: 'General' },
        ],
        layout: 'dropdown',
      },
      initialValue: 'General',
    }),
    defineField({
      name: 'category',
      title: 'Topic Category',
      type: 'string',
      description: 'Broad topic for filtering — used for the "Data & AI" filter.',
      options: {
        list: [
          { title: 'Cloud', value: 'Cloud' },
          { title: 'Data', value: 'Data' },
          { title: 'AI', value: 'AI' },
          { title: 'Security', value: 'Security' },
          { title: 'DevOps', value: 'DevOps' },
          { title: 'General', value: 'General' },
        ],
        layout: 'dropdown',
      },
      initialValue: 'General',
    }),
    defineField({
      name: 'organisation',
      title: 'Organisation / Source',
      type: 'string',
      description: 'Who published this — e.g. "AWS Blog", "Databricks Engineering", "LearnKloud Team".',
      initialValue: 'LearnKloud Team',
    }),
    defineField({
      name: 'relatedQuizId',
      title: 'Related Quiz ID',
      type: 'string',
      description: 'e.g. "clf-c02-full-exam" — links a practice quiz at the bottom of the article.',
    }),
  ],
  preview: {
    select: { title: 'title', subtitle: 'accessTier', media: 'coverImage' },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    prepare(value: any) {
      return {
        title: value.title,
        subtitle: value.subtitle === 'premium' ? '🔒 Premium' : '🆓 Free',
        media: value.media,
      };
    },
  },
  orderings: [
    {
      title: 'Published Date, Newest First',
      name: 'publishedAtDesc',
      by: [{ field: 'publishedAt', direction: 'desc' }],
    },
  ],
});
