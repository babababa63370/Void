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
import RosterPlayer from "@/pages/roster-player";
import PlayersLogin from "@/pages/players-login";
import Meonix from "@/pages/meonix";
import Staff from "@/pages/staff";
import About from "@/pages/about";
import Achievements from "@/pages/achievements";
import Matcherino from "@/pages/matcherino";
import MatcherinoEvent from "@/pages/matcherino-event";
import CookieBanner from "@/components/cookie-banner";
import { I18nProvider } from "@/i18n/context";

const queryClient = new QueryClient();

const routerBase = import.meta.env.BASE_URL.replace(/\/$/, "");

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/roster" component={Roster} />
      <Route path="/roster/:username" component={RosterPlayer} />
      <Route path="/about" component={About} />
      <Route path="/achievements" component={Achievements} />
      <Route path="/matcherino" component={Matcherino} />
      <Route path="/matcherino/:id" component={MatcherinoEvent} />
      <Route path="/join" component={Join} />
      <Route path="/rules" component={Rules} />
      <Route path="/terms" component={Terms} />
      <Route path="/privacy" component={Privacy} />
      <Route path="/players-login" component={PlayersLogin} />
      <Route path="/meonix" component={Meonix} />
      <Route path="/staff" component={Staff} />
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
