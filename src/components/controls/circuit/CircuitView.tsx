import { useEffect, useRef } from "react";
import { Box, Button, Stack, Typography } from "@mui/material";
import type { CircuitGate } from "./useCircuit.ts";
import UndoIcon from '@mui/icons-material/Undo';
import ClearAllIcon from '@mui/icons-material/ClearAll';

interface CircuitViewProps {
    gates: readonly CircuitGate[];
    onUndo: () => void;
    onClearAll: () => void;
}

/** A piece of the qubit wire. The last one grows to fill leftover space. */
function Wire({ grow = false }: { grow?: boolean }) {
    return (
        <Box
            sx={{
                height: 2,
                bgcolor: "text.primary",
                minWidth: 32,                       // gap never collapses below this
                flex: grow ? "1 0 32px" : "0 0 32px",
            }}
        />
    );
}

function GateBox({ label }: { label: string }) {
    return (
        <Box
            sx={{
                flexShrink: 0,
                minWidth: 40,
                height: 40,
                px: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "2px solid",
                borderColor: "primary.main",
                borderRadius: 1,
                bgcolor: "background.paper",
                fontFamily: "monospace",
                fontWeight: 700,
                userSelect: "none",
            }}
        >
            {label}
        </Box>
    );
}

function Terminal({ label }: { label: string }) {
    return (
        <Typography
            sx={{ flexShrink: 0, fontFamily: "monospace", fontWeight: 700, userSelect: "none" }}
        >
            {label}
        </Typography>
    );
}

export default function CircuitView({ gates, onUndo, onClearAll }: CircuitViewProps) {
    const laneRef = useRef<HTMLDivElement>(null);
    const isEmpty = gates.length === 0;

    // Keep the newest gate in view when the lane overflows.
    useEffect(() => {
        const el = laneRef.current;
        if (el) el.scrollTo({ left: el.scrollWidth, behavior: "smooth" });
    }, [gates.length]);

    return (
        <Box
            sx={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                gap: 2,
                width: "100%",
                height: "100%",
                p: 2,
                boxSizing: "border-box",
            }}
        >

            <Box
                ref={laneRef}
                sx={{ display: "flex", alignItems: "center", overflowX: "auto", pb: 1}}
            >
                <Terminal label="|ψ⟩" />
                <Wire />
                {gates.map(gate => (
                    <Box key={gate.id} sx={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
                        <GateBox label={gate.label} />
                        <Wire />
                    </Box>
                ))}
                <Wire grow />
                <Terminal label="SALIDA" />
            </Box>

            <Stack direction="row" spacing={1} sx={{ justifyContent: 'flex-end' }}>
                <Button size="small" variant="outlined" disabled={isEmpty} onClick={onUndo}>
                    <UndoIcon />
                </Button>
                <Button
                    size="small"
                    variant="outlined"
                    color="error"
                    disabled={isEmpty}
                    onClick={onClearAll}
                >
                    <ClearAllIcon />
                </Button>
            </Stack>
        </Box>
    );
}