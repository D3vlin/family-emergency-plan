import ThemeToggle from "@components/ThemeToggle/ThemeToggle";
import Home from "@pages/Home/Home";
import { useWizard, WizardProvider } from "@wizard/WizardContext";
import WizardLayout from "@wizard/WizardLayout";
import "./App.css";

export default function App() {
  return (
    <WizardProvider>
      <ThemeToggle />
      <AppScreen />
    </WizardProvider>
  );
}

function AppScreen() {
  const { currentScreen } = useWizard();
  return currentScreen === "home" ? <Home /> : <WizardLayout />;
}
