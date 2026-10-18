import { Box, Button, Stack, Tooltip, Typography } from "@mui/material";
import * as Gates from "../../quantum/Gates.ts";
import type { Matrix2 } from "../../quantum/Gates.ts";

interface GateDef {
    label: string;   // symbol shown on the button
    name: string;    // tooltip
    matrix: Matrix2;
}

const GATES: readonly GateDef[] = [
    { label: "X", name: "Pauli-X (NOT)",            matrix: Gates.X },
    { label: "Y", name: "Pauli-Y",                  matrix: Gates.Y },
    { label: "Z", name: "Pauli-Z (inversión fase)",     matrix: Gates.Z },
    { label: "H", name: "Hadamard",                 matrix: Gates.H },
    { label: "S", name: "S (fase π/2)",            matrix: Gates.S },
    { label: "T", name: "T (fase π/4)",            matrix: Gates.T },
];

interface GatePaletteProps {
    onAddGate: (label: string, matrix: Matrix2) => void;
}

export default function GatePalette({ onAddGate }: GatePaletteProps) {
    return (
        <Box
            sx={{
                display: "flex",
                flexDirection: "column",
                gap: 1,
                width: "100%",
                height: "100%",
                p: 2,
                boxSizing: "border-box",
            }}
        >
            <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                    Compuertas
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    Añade una compuerta
                </Typography>
            </Box>

            <Stack direction="row" useFlexGap sx={{ flexWrap: "wrap", gap: 1 }}>
                {GATES.map(({ label, name, matrix }) => (
                    <Tooltip key={label} title={name} arrow>
                        <Button
                            variant="outlined"
                            onClick={() => onAddGate(label, matrix)}
                            sx={{
                                minWidth: 48,
                                height: 48,
                                fontFamily: "monospace",
                                fontWeight: 700,
                                fontSize: "1rem",
                            }}
                        >
                            {label}
                        </Button>
                    </Tooltip>
                ))}
            </Stack>
        </Box>
    );
}