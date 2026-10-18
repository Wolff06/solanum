import { useState } from "react";
import { Box, ToggleButton, ToggleButtonGroup, Typography } from "@mui/material";
import type { ReactNode } from "react";
import type Complex from "../../quantum/Complex.ts";
import type Qubit from "../../quantum/Qubit.ts";

const num = (n: number) => {
    const r = +n.toFixed(4);
    return (Object.is(r, -0) ? 0 : r).toFixed(4);
};

const cx = (z: Complex) => {
    const re = +z.real.toFixed(4);
    const im = +z.imaginary.toFixed(4);
    return `${num(re)} ${im < 0 ? "−" : "+"} ${num(Math.abs(im))}i`;
};

const inPi = (rad: number) => `${(rad / Math.PI).toFixed(3)}π`;

interface StateInfoProps {
    initial: Qubit;
    current: Qubit;
}

type View = "current" | "initial";

function Item({ label, children }: { label: string; children: ReactNode }) {
    return (
        <Box sx={{ mb: 1.5 }}>
            <Typography variant="caption" color="text.secondary">{label}</Typography>
            <Typography component="div" sx={{ fontFamily: "monospace", fontSize: 14 }}>
                {children}
            </Typography>
        </Box>
    );
}

export default function StateInfo({ initial, current }: StateInfoProps) {
    const [view, setView] = useState<View>("current");

    const qubit = view === "current" ? current : initial;
    const { alpha, beta } = qubit;
    const [p0, p1] = qubit.probabilities;
    const { theta, phi, x, y, z } = qubit.v;

    return (
        <Box sx={{ width: "100%", p: 2, boxSizing: "border-box" }}>
            <ToggleButtonGroup
                exclusive
                size="small"
                fullWidth
                value={view}
                // MUI sends null when the active button is clicked again; ignore it
                // so one option is always selected.
                onChange={(_, v: View | null) => { if (v) setView(v); }}
                sx={{ mb: 2 }}
            >
                <ToggleButton value="current">Actual</ToggleButton>
                <ToggleButton value="initial">Inicial</ToggleButton>
            </ToggleButtonGroup>

            <Item label="Vector columna">
                <Box
                    sx={{
                        display: "inline-block", px: 1.5, py: 0.5,
                        borderLeft: "2px solid", borderRight: "2px solid", borderColor: "text.primary",
                    }}
                >
                    <div>{cx(alpha)}</div>
                    <div>{cx(beta)}</div>
                </Box>
            </Item>

            <Item label="Función de onda">
                |ψ⟩ = ({cx(alpha)})|0⟩ + ({cx(beta)})|1⟩
            </Item>

            <Item label="Probabilidades">
                P(0) = {num(p0)} &nbsp; P(1) = {num(p1)}
            </Item>

            <Item label="Angulos">
                θ = {num(theta)} rad ({inPi(theta)}) <br />
                φ = {num(phi)} rad ({inPi(phi)})
            </Item>

            <Item label="Vector de Bloch">
                ({num(x)}, {num(y)}, {num(z)})
            </Item>
        </Box>
    );
}