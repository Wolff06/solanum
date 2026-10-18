import { Box } from "@mui/material";
import type { ReactNode } from "react";
import CircuitView from "./circuit/CircuitView.tsx";
import StepViewer from "./circuit/StepViewer.tsx";
import InitialStateInput from "./inputs/InitialStateInput.tsx";
import StateInfo from "./inputs/StateInfo.tsx";
import GatePalette from "./inputs/GatePalette.tsx";
import type Qubit from "../quantum/Qubit.ts";
import type { Matrix2 } from "../quantum/Gates.ts";
import type { CircuitGate } from "./circuit/useCircuit.ts";

interface ControlsProps {
    initialState: Qubit;
    currentState: Qubit;
    gates: readonly CircuitGate[];
    onInitialStateChange: (q: Qubit) => void;
    onAddGate: (label: string, matrix: Matrix2) => void;
    onUndo: () => void;
    onClearAll: () => void;
}

/** Uniform full-width row. `grow` lets a row take more vertical space. */
function Row({ children, grow = 1 }: { children?: ReactNode; grow?: number }) {
    return (
        <Box sx={{ width: "100%", flex: `${grow} 1 0`, minHeight: 0, overflowY: "auto" }}>
            {children}
        </Box>
    );
}

export default function Controls({
                                     initialState, currentState, gates,
                                     onInitialStateChange, onAddGate, onUndo, onClearAll,
                                 }: ControlsProps) {
    return (
        <Box sx={{ display: "flex", flexDirection: "column", width: "100%", height: "100%", gap: 2 }}>
            <Row>
                <CircuitView gates={gates} onUndo={onUndo} onClearAll={onClearAll} />
            </Row>

            <Row>
                <StepViewer initial={initialState} gates={gates} />
            </Row>

            <Row grow={1.5}>
                <Box sx={{ display: "flex", width: "100%" }}>
                    <Box sx={{ flex: "1 1 0", minWidth: 0 }}>
                        <InitialStateInput initial={initialState} onChange={onInitialStateChange} />
                    </Box>
                    <Box sx={{ flex: "1 1 0", minWidth: 0 }}>
                        <StateInfo initial={initialState} current={currentState} />
                    </Box>
                </Box>
            </Row>

            <Row>
                <GatePalette onAddGate={onAddGate} />
            </Row>
        </Box>
    );
}