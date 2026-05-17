import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/Dashboard";
import ChatIA from "@/pages/ChatIA";
import InsightsIA from "@/pages/InsightsIA";
import AtendenteIA from "@/pages/AtendenteIA";
import Integracoes from "@/pages/Integracoes";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/chat-ia" component={ChatIA} />
      <Route path="/insights" component={InsightsIA} />
      <Route path="/atendente-ia" component={AtendenteIA} />
      <Route path="/integracoes" component={Integracoes} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
