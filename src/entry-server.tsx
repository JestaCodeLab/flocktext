import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MarketingLayout } from '@/pages/marketing/MarketingLayout';
import { HomePage } from '@/pages/marketing/HomePage';
import { PricingPage } from '@/pages/marketing/PricingPage';
import { TermsPage } from '@/pages/marketing/TermsPage';
import { PrivacyPage } from '@/pages/marketing/PrivacyPage';
import { SupportPage } from '@/pages/marketing/SupportPage';
import { BusinessesPage } from '@/pages/marketing/BusinessesPage';
import { ChurchesPage } from '@/pages/marketing/ChurchesPage';
import { SchoolsPage } from '@/pages/marketing/SchoolsPage';
import { BlogPage } from '@/pages/marketing/BlogPage';
import { BlogPostPage } from '@/pages/marketing/BlogPostPage';
import { routeSeo } from '@/pages/marketing/data/seo';

export function render(path: string) {
  const route = routeSeo[path];
  if (!route) throw new Error(`No prerenderable route for ${path}`);

  const queryClient = new QueryClient();
  const html = renderToStaticMarkup(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route element={<MarketingLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/pricing" element={<PricingPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/support" element={<SupportPage />} />
            <Route path="/businesses" element={<BusinessesPage />} />
            <Route path="/churches" element={<ChurchesPage />} />
            <Route path="/schools" element={<SchoolsPage />} />
            <Route path="/blog" element={<BlogPage />} />
            <Route path="/blog/:slug" element={<BlogPostPage />} />
          </Route>
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );

  return { html, ...route };
}

export const prerenderRoutes = Object.keys(routeSeo);
