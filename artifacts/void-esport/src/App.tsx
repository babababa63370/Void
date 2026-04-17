import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Join from "@/pages/join";
import Rules from "@/pages/rules";
import Terms from "@/pages/terms";
import Privacy from "@/pages/privacy";
import Roster from "@/pages/roster";
import PlayersLogin from "@/pages/players-login";
import CookieBanner from "@/components/cookie-banner";
import { I18nProvider, NON_EN_LANGS, type Lang } from "@/i18n/context";

const queryClient = new QueryClient();

function getRouterBase(): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  const pathname = window.location.pathname;
  const relative = pathname.startsWith(base) ? pathname.slice(base.length) : pathname;
  const firstSeg = relative.split("/").filter(Boolean)[0];
  const isLangPrefix = firstSeg && NON_EN_LANGS.includes(firstSeg as Lang);
  return isLangPrefix ? `${base}/${firstSeg}` : base;
}

const routerBase = getRouterBase();

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/roster" component={Roster} />
      <Route path="/join" component={Join} />
      <Route path="/rules" component={Rules} />
      <Route path="/terms" component={Terms} />
      <Route path="/privacy" component={Privacy} />
      <Route path="/players-login" component={PlayersLogin} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <I18nProvider>
        <TooltipProvider>
          <WouterRouter base={routerBase}>
            <Router />
          </WouterRouter>
          <Toaster />
          <CookieBanner />
        </TooltipProvider>
      </I18nProvider>
    </QueryClientProvider>
  );
}

export default App;
