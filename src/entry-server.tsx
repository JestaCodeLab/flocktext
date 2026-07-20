import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MarketingLayout } from '@/pages/marketing/MarketingLayout';
import { HomePage } from '@/pages/marketing/HomePage';
import { PricingPage } from '@/pages/marketing/PricingPage';
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
          </Route>
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );

  return { html, ...route };
}

export const prerenderRoutes = Object.keys(routeSeo);
