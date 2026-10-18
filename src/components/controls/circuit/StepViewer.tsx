import { useMemo } from "react";
import type { ReactNode } from "react";
import { Box, Paper, Typography } from "@mui/material";
import Qubit from "../../quantum/Qubit.ts";
import type Complex from "../../quantum/Complex.ts";
import type { Matrix2 } from "../../quantum/Gates.ts";
import type { CircuitGate } from "./useCircuit.ts";

interface StepViewerProps {
    /** Initial state; defaults to |0>. */
    initial?: Qubit;
    gates: readonly CircuitGate[];
}

/* ---------- number formatting ---------- */

const round3 = (n: number) => {
    const r = Math.round(n * 1000) / 1000;
    return Object.is(r, -0) ? 0 : r; // avoid "-0"
};

const minus = (s: string) => s.replace("-", "−");

/** 0.707 | -i | 0.5 + 0.5i | 0.5 − 0.5i ... */
function formatComplex(z: Complex): string {
    const re = round3(z.real);
    const im = round3(z.imaginary);
    if (im === 0) return minus(String(re));

    const abs = Math.abs(im);
    const imBody = abs === 1 ? "i" : `${abs}i`;
    if (re === 0) return (im < 0 ? "−" : "") + imBody;
    return `${minus(String(re))} ${im < 0 ? "−" : "+"} ${imBody}`;
}

/* ---------- small math building blocks ---------- */

/** Draws [ ... ] brackets around its children. */
function Bracketed({ children, highlight = false }: { children: ReactNode; highlight?: boolean }) {
    return (
        <Box
            sx={{
                display: "inline-grid",
                alignItems: "center",
                justifyItems: "center",
                columnGap: 2,
                rowGap: 0.5,
                px: 1.5,
                py: 0.5,
                borderTop: "none",
                borderBottom: "none",
                borderLeft: "2px solid",
                borderRight: "2px solid",
                borderColor: highlight ? "primary.main" : "text.primary",
                borderRadius: 1,
                fontFamily: "monospace",
                fontSize: "0.9rem",
                flexShrink: 0,
            }}
        >
            {children}
        </Box>
    );
}

function VectorView({ amps, highlight }: { amps: [Complex, Complex]; highlight?: boolean }) {
    return (
        <Bracketed highlight={highlight}>
            {amps.map((z, i) => (
                <Box key={i} sx={{ gridColumn: 1, minWidth: 48, textAlign: "center" }}>
                    {formatComplex(z)}
                </Box>
            ))}
        </Bracketed>
    );
}

function MatrixView({ m }: { m: Matrix2 }) {
    return (
        <Bracketed>
            {m.flatMap((row, r) =>
                row.map((z, c) => (
                    <Box
                        key={`${r}-${c}`}
                        sx={{ gridRow: r + 1, gridColumn: c + 1, minWidth: 48, textAlign: "center" }}
                    >
                        {formatComplex(z)}
                    </Box>
                ))
            )}
        </Bracketed>
    );
}

function Operator({ children }: { children: ReactNode }) {
    return (
        <Typography sx={{ fontSize: "1.25rem", userSelect: "none", flexShrink: 0 }}>
            {children}
        </Typography>
    );
}

/* ---------- one step ---------- */

function StepRow({
                     title, gate, input, output, isOutput,
                 }: {
    title: string;
    gate: CircuitGate;
    input: Qubit;
    output: Qubit;
    isOutput: boolean;
}) {
    return (
        <Paper variant="outlined" sx={{ p: 1.5 }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
                {title}
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 1.5 }}>
                <MatrixView m={gate.matrix} />
                <Operator>·</Operator>
                <VectorView amps={input.m} />
                <Operator>=</Operator>
                <VectorView amps={output.m} highlight={isOutput} />
                {isOutput && (
                    <Typography
                        variant="caption"
                        sx={{ fontWeight: 700, color: "primary.main", userSelect: "none" }}
                    >
                        SALIDA
                    </Typography>
                )}
            </Box>
        </Paper>
    );
}

/* ---------- main component ---------- */

const DEFAULT_INITIAL = new Qubit(); // |0>

export default function StepViewer({ initial = DEFAULT_INITIAL, gates }: StepViewerProps) {
    // states[0] = initial, states[k] = state after gate k
    const states = useMemo(() => {
        const out: Qubit[] = [initial];
        for (const g of gates) out.push(out[out.length - 1].apply(g.matrix));
        return out;
    }, [initial, gates]);

    const isEmpty = gates.length === 0;

    return (
        <Box
            sx={{
                display: "flex",
                flexDirection: "column",
                gap: 1.5,
                width: "100%",
                height: "100%",
                p: 2,
                boxSizing: "border-box",
                overflowY: "auto",
            }}
        >
            <Typography variant="subtitle2" color="text.secondary">
                Paso a paso
            </Typography>

            {isEmpty ? (
                <Paper variant="outlined" sx={{ p: 1.5 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
                        Entrada
                    </Typography>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                        <Typography sx={{ fontFamily: "monospace" }}>|ψ⟩ =</Typography>
                        <VectorView amps={initial.m} highlight />
                    </Box>
                </Paper>
            ) : (
                gates.map((gate, i) => (
                    <StepRow
                        key={gate.id}
                        title={`Paso ${i + 1} · ${gate.label}`}
                        gate={gate}
                        input={states[i]}
                        output={states[i + 1]}
                        isOutput={i === gates.length - 1}
                    />
                ))
            )}
        </Box>
    );
}