import { useCallback, useRef, useState } from "react";
import type Qubit from "../../quantum/Qubit.ts";
import type { Matrix2 } from "../../quantum/Gates.ts";

export interface CircuitGate {
    id: number;          // stable React key (the same gate can appear twice, e.g. H, H)
    label: string;       // what the box displays: "X", "H", "Rx(π/2)"...
    matrix: Matrix2;
}

export function useCircuit() {
    const nextId = useRef(0);
    const [gates, setGates] = useState<readonly CircuitGate[]>([]);

    /** Gates are only ever appended at the end of the lane. */
    const addGate = useCallback((label: string, matrix: Matrix2) => {
        const id = nextId.current++;
        setGates(prev => [...prev, { id, label, matrix }]);
    }, []);

    const undo = useCallback(() => setGates(prev => prev.slice(0, -1)), []);
    const clearAll = useCallback(() => setGates([]), []);

    return { gates, addGate, undo, clearAll };
}

/** Run the initial state through the whole circuit. */
export function runCircuit(initial: Qubit, gates: readonly CircuitGate[]): Qubit {
    return gates.reduce((q, g) => q.apply(g.matrix), initial);
}