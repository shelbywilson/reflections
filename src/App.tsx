import { useState } from "react";
import "./App.css";
import Toolbar from "./components/Toolbar";
import OpticsProvider from "./contexts/OpticsContext";
import type { DisplayState } from "./util/types";
import OpticsCanvas from "./components/OpticsCanvas";

function App() {
  const [displayState, setDisplayState] = useState<DisplayState>({
    showVirtualMirrors: true
  })

  function updateDisplayState(key: keyof DisplayState, value: boolean) {
    setDisplayState((prev: DisplayState) => ({
      ...prev,
      [key]: value,
    }));
  }

  return (
    <OpticsProvider>
      <Toolbar
        displayState={displayState}
        setDisplayState={updateDisplayState}
      />
      <OpticsCanvas
        displayState={displayState}
      />
    </OpticsProvider>
  );
}

export default App;
