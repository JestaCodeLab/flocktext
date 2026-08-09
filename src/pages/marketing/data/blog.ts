import { marked } from 'marked';
import businessImage from '@/assets/images/business.png';
import churchImage from '@/assets/images/church.png';
import phoneImage from '@/assets/images/phone.png';
import appsImage from '@/assets/images/apps.jpeg';

export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  date: string;
  image: string;
  readingTime: number;
  html: string;
}

// Cover image per post, keyed by filename slug - the source markdown has no
// image field, so these are assigned by topic match against images already
// used elsewhere on the marketing site.
const coverImages: Record<string, string> = {
  'best-bulk-sms-app-ghana-businesses': businessImage,
  'church-sms-sunday-attendance-ghana': churchImage,
  'flocktext-vs-telco-sms-pricing': phoneImage,
  'sms-vs-email-vs-whatsapp-ghana': appsImage,
};

const rawPosts = import.meta.glob('/src/content/blog/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

// Frontmatter here is only ever `title`, `meta_description`, and `date`, each
// a single double-quoted line - a full YAML parser would be overkill for
// that shape.
function parseFrontmatter(raw: string): { title: string; description: string; date: string; body: string } {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) throw new Error('Blog post is missing frontmatter');
  const [, frontmatter, body] = match;
  const title = frontmatter.match(/title:\s*"(.*)"/)?.[1] ?? '';
  const description = frontmatter.match(/meta_description:\s*"(.*)"/)?.[1] ?? '';
  const date = frontmatter.match(/date:\s*"(.*)"/)?.[1] ?? '';
  // Strip the leading `# Title` line from the body - it duplicates the <h1>
  // the pages render from `title` above.
  const strippedBody = body.replace(/^\s*#\s+.*\n+/, '');
  return { title, description, date, body: strippedBody };
}

function parsePost(filePath: string, raw: string): BlogPost {
  const slug = filePath.split('/').pop()!.replace(/\.md$/, '');
  const { title, description, date, body } = parseFrontmatter(raw);
  const wordCount = body.trim().split(/\s+/).length;

  return {
    slug,
    title,
    description,
    date,
    image: coverImages[slug] ?? businessImage,
    readingTime: Math.max(1, Math.round(wordCount / 200)),
    html: marked.parse(body, { async: false }) as string,
  };
}

export const blogPosts: BlogPost[] = Object.entries(rawPosts)
  .map(([filePath, raw]) => parsePost(filePath, raw))
  .sort((a, b) => b.date.localeCompare(a.date) || a.slug.localeCompare(b.slug));

export function formatBlogDate(isoDate: string): string {
  return new Date(`${isoDate}T00:00:00Z`).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

export function getBlogPost(slug: string): BlogPost | undefined {
  return blogPosts.find((post) => post.slug === slug);
}

export function getRelatedPosts(slug: string, limit = 3): BlogPost[] {
  return blogPosts.filter((post) => post.slug !== slug).slice(0, limit);
}
