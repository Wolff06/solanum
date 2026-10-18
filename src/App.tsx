import { Box, CssBaseline } from "@mui/material";
import Controls from "./components/controls/Controls.tsx";
import {useMemo, useState} from "react";
import Qubit from "./components/quantum/Qubit.ts";
import {runCircuit, useCircuit} from "./components/controls/circuit/useCircuit.ts";
import BlochSphere from "./components/quantum/sphere/BlochSphere.tsx";

export default function App() {
    const [initialState, setInitialState] = useState(() => new Qubit());
    const { gates, addGate, undo, clearAll } = useCircuit();
    const currentState = useMemo(() => runCircuit(initialState, gates), [initialState, gates]);

  return (
      <>
        <CssBaseline />
        <Box
            sx={{
              display: "flex",
              width: "100vw",
              height: "100vh",
              overflow: "hidden",
            }}
        >
          <Box
              sx={{
                flex: "1 1 0",
                minWidth: 0,
                height: "100%",
              }}
          >
            <BlochSphere initial={initialState.v} current={currentState.v} />
          </Box>

          <Box
              sx={{
                flex: "1 1 0",
                minWidth: 0,
                height: "100%",
              }}
          >
              <Controls
                  initialState={initialState}
                  currentState={currentState}
                  gates={gates}
                  onInitialStateChange={setInitialState}
                  onAddGate={addGate}
                  onUndo={undo}
                  onClearAll={clearAll}
              />
          </Box>
        </Box>
      </>
  );
}