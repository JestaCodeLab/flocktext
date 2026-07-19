import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MarketingLayout } from '@/pages/marketing/MarketingLayout';
import { HomePage } from '@/pages/marketing/HomePage';
import { PricingPage } from '@/pages/marketing/PricingPage';

const meta: Record<string, { title: string; description: string }> = {
  '/': {
    title: 'FlockText — Bulk SMS for businesses, churches & institutions',
    description:
      'Reach everyone you serve by SMS. Contact groups, birthday automation, scheduled sends, and delivery reports for businesses, churches, and institutions.',
  },
  '/pricing': {
    title: 'Pricing — FlockText',
    description:
      'Simple pay-as-you-go SMS credit pricing. No subscriptions, no locked features — buy credits and send whenever you need to.',
  },
};

export function render(path: string) {
  const route = meta[path];
  if (!route) throw new Error(`No prerenderable route for ${path}`);

  const queryClient = new QueryClient();
  const html = renderToStaticMarkup(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route element={<MarketingLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/pricing" element={<PricingPage />} />
          </Route>
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );

  return { html, title: route.title, description: route.description };
}

export const prerenderRoutes = Object.keys(meta);
