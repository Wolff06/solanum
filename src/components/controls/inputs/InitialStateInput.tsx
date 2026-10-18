import { useState } from "react";
import { Box, Slider, Tab, Tabs, TextField, Typography } from "@mui/material";
import Complex from "../../quantum/Complex.ts";
import Qubit from "../../quantum/Qubit.ts";

interface InitialStateInputProps {
    initial: Qubit;
    onChange: (q: Qubit) => void;
}

/** Text -> finite number, or null while the draft is empty/invalid (e.g. "-", "1e"). */
function parseNum(s: string): number | null {
    if (s.trim() === "") return null;
    const n = Number(s);
    return Number.isFinite(n) ? n : null;
}

const show = (n: number) => String(+n.toFixed(4));

export default function InitialStateInput({ initial, onChange }: InitialStateInputProps) {
    const [tab, setTab] = useState(0);

    return (
        <Box sx={{ width: "100%", p: 1, boxSizing: "border-box" }}>
            <Tabs value={tab} onChange={(_, v: number) => setTab(v)} variant="fullWidth">
                <Tab label="Amplitudes" />
                <Tab label="Angulos" />
            </Tabs>
            <Box sx={{ pt: 2 }}>
                {tab === 0
                    ? <AmplitudesTab initial={initial} onChange={onChange} />
                    : <AnglesTab initial={initial} onChange={onChange} />}
            </Box>
        </Box>
    );
}

/* ---------- Tab 1: α, β as complex numbers ---------- */

type Fields = { ar: string; ai: string; br: string; bi: string };

function AmplitudesTab({ initial, onChange }: InitialStateInputProps) {
    const [f, setF] = useState<Fields>({
        ar: show(initial.alpha.real), ai: show(initial.alpha.imaginary),
        br: show(initial.beta.real),  bi: show(initial.beta.imaginary),
    });

    const nums = {
        ar: parseNum(f.ar), ai: parseNum(f.ai),
        br: parseNum(f.br), bi: parseNum(f.bi),
    };
    const allValid = Object.values(nums).every(n => n !== null);
    const isZero = allValid && Object.values(nums).every(n => n === 0);
    const error = !allValid ? "Introduzca un número valido" : isZero ? "α y β no pueden ser ambos 0" : "";

    const update = (key: keyof Fields) => (value: string) => {
        const next = { ...f, [key]: value };
        setF(next);
        const ar = parseNum(next.ar), ai = parseNum(next.ai);
        const br = parseNum(next.br), bi = parseNum(next.bi);
        if (ar === null || ai === null || br === null || bi === null) return;
        if (ar === 0 && ai === 0 && br === 0 && bi === 0) return;
        onChange(new Qubit(new Complex(ar, ai), new Complex(br, bi))); // Qubit normalizes
    };

    return (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <ComplexRow name="α" re={f.ar} im={f.ai} onRe={update("ar")} onIm={update("ai")} error={!!error} />
            <ComplexRow name="β" re={f.br} im={f.bi} onRe={update("br")} onIm={update("bi")} error={!!error} />
            <Typography variant="caption" color={error ? "error" : "text.secondary"}>
                {error || "La entrada se normaliza automaticamente."}
            </Typography>
        </Box>
    );
}

function ComplexRow({ name, re, im, onRe, onIm, error }: {
    name: string; re: string; im: string;
    onRe: (v: string) => void; onIm: (v: string) => void; error: boolean;
}) {
    return (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography sx={{ width: 20, fontFamily: "monospace", fontWeight: 700 }}>{name}</Typography>
            <TextField size="small" label="Re" value={re} error={error}
                       onChange={e => onRe(e.target.value)} slotProps={{ htmlInput: { inputMode: "decimal" } }} />
            <Typography>+</Typography>
            <TextField size="small" label="Im" value={im} error={error}
                       onChange={e => onIm(e.target.value)} slotProps={{ htmlInput: { inputMode: "decimal" } }} />
            <Typography sx={{ fontFamily: "monospace" }}>i</Typography>
        </Box>
    );
}

/* ---------- Tab 2: θ, φ in radians ---------- */

function AnglesTab({ initial, onChange }: InitialStateInputProps) {
    // Local state on purpose: at the poles the Qubit reports φ = 0, which would
    // make the φ slider jump while you drag θ to 0 or π.
    const [theta, setTheta] = useState(initial.v.theta);
    const [phi, setPhi] = useState(initial.v.phi);

    const setT = (t: number) => { setTheta(t); onChange(Qubit.fromAngles(t, phi)); };
    const setP = (p: number) => { setPhi(p);   onChange(Qubit.fromAngles(theta, p)); };

    return (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <AngleField
                label="θ (polar)" value={theta} min={0} max={Math.PI} onChange={setT}
                marks={[
                    { value: 0, label: "0" },
                    { value: Math.PI / 2, label: "π/2" },
                    { value: Math.PI, label: "π" },
                ]}
            />
            <AngleField
                label="φ (azimuth)" value={phi} min={0} max={2 * Math.PI} exclusiveMax onChange={setP}
                marks={[
                    { value: 0, label: "0" },
                    { value: Math.PI, label: "π" },
                    { value: SLIDER_PHI_MAX, label: "2π" },
                ]}
            />
        </Box>
    );
}

/** Largest slider position below 2π, since φ must be in [0, 2π). */
const SLIDER_PHI_MAX = 6.28;

function AngleField({ label, value, min, max, exclusiveMax = false, marks, onChange }: {
    label: string; value: number; min: number; max: number; exclusiveMax?: boolean;
    marks: { value: number; label: string }[];
    onChange: (v: number) => void;
}) {
    // `draft` holds what the user is typing; null means "show the slider's value".
    const [draft, setDraft] = useState<string | null>(null);

    const parsed = draft === null ? value : parseNum(draft);
    const inRange = parsed !== null && parsed >= min && (exclusiveMax ? parsed < max : parsed <= max);

    const handleText = (s: string) => {
        setDraft(s);
        const n = parseNum(s);
        if (n !== null && n >= min && (exclusiveMax ? n < max : n <= max)) onChange(n);
    };

    return (
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Typography sx={{ width: 90, flexShrink: 0 }}>{label}</Typography>
            <Slider
                sx={{ mx: 1 }}
                min={min}
                max={exclusiveMax ? SLIDER_PHI_MAX : max}
                step={0.01}
                marks={marks}
                value={Math.min(value, exclusiveMax ? SLIDER_PHI_MAX : max)}
                onChange={(_, v) => { setDraft(null); onChange(v as number); }}
            />
            <TextField
                size="small"
                sx={{ width: 110, flexShrink: 0 }}
                value={draft ?? value.toFixed(3)}
                error={!inRange}
                onChange={e => handleText(e.target.value)}
                onBlur={() => setDraft(null)}
                helperText={inRange ? " " : "Fuera de rango"}
                slotProps={{ htmlInput: { inputMode: "decimal" } }}
            />
        </Box>
    );
}