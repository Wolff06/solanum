import { useEffect, useRef } from "react";
import { Box } from "@mui/material";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

/** Anything with x, y, z, so `qubit.v` can be passed directly. */
export interface BlochVector {
    x: number;
    y: number;
    z: number;
}

interface BlochSphereProps {
    initial: BlochVector;
    current: BlochVector;
}

/* ---------- constants ---------- */

const CAMERA_DISTANCE = 5;
const CAMERA_POLAR = THREE.MathUtils.degToRad(72); // fixed tilt from the vertical axis
const INITIAL_COLOR = 0x9e9e9e;
const CURRENT_COLOR = 0x0C0A00;
const ANIMATION_SPEED = 0.15; // fraction of the remaining rotation per frame

/**
 * Bloch (x, y, z) -> three.js (X, Y, Z).
 * Layout: Bloch Z is up (three Y), Bloch Y is screen-right (three X),
 * Bloch X is depth, toward the viewer (three Z).
 * y × z = x, so the mapping is a pure rotation (no mirroring).
 */
const toScene = (v: BlochVector) => new THREE.Vector3(v.y, v.z, v.x);

/* ---------- scene building blocks ---------- */

function makeCircle(u: THREE.Vector3, w: THREE.Vector3, color: number, opacity: number) {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i < 128; i++) {
        const t = (i / 128) * Math.PI * 2;
        pts.push(u.clone().multiplyScalar(Math.cos(t)).add(w.clone().multiplyScalar(Math.sin(t))));
    }
    const geo = new THREE.BufferGeometry().setFromPoints(pts);
    return new THREE.LineLoop(geo, new THREE.LineBasicMaterial({ color, transparent: true, opacity }));
}

function makeAxis(dir: THREE.Vector3, color: number) {
    const geo = new THREE.BufferGeometry().setFromPoints([
        dir.clone().multiplyScalar(-1.1),
        dir.clone().multiplyScalar(1.1),
    ]);
    return new THREE.Line(geo, new THREE.LineBasicMaterial({ color }));
}

function makeLabel(text: string, color: string, scale = 0.32) {
    const canvas = document.createElement("canvas");
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext("2d")!;
    ctx.font = "bold 56px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = color;
    ctx.fillText(text, 64, 64);
    const tex = new THREE.CanvasTexture(canvas);
    const mat = new THREE.SpriteMaterial({ map: tex, depthTest: false, transparent: true });
    const sprite = new THREE.Sprite(mat);
    sprite.scale.set(scale, scale, 1);
    return sprite;
}

/** An arrow whose orientation animates toward a target direction. */
class AnimatedArrow {
    readonly object: THREE.ArrowHelper;
    private readonly target = new THREE.Quaternion();
    private static readonly UP = new THREE.Vector3(0, 1, 0); // ArrowHelper points along +Y

    constructor(color: number, animated: boolean) {
        this.object = new THREE.ArrowHelper(AnimatedArrow.UP, new THREE.Vector3(), 1, color, 0.15, 0.08);
        this.animated = animated;
    }
    private readonly animated: boolean;

    setDirection(v: BlochVector, snap = false) {
        const dir = toScene(v);
        if (dir.lengthSq() < 1e-12) return;
        dir.normalize();
        this.object.setLength(Math.min(1, toScene(v).length()) || 1, 0.15, 0.08);
        this.target.setFromUnitVectors(AnimatedArrow.UP, dir);
        if (snap || !this.animated) this.object.quaternion.copy(this.target);
    }

    /** Call once per frame. */
    tick() {
        if (this.animated) this.object.quaternion.slerp(this.target, ANIMATION_SPEED);
    }
}

/* ---------- component ---------- */

interface SceneApi {
    setInitial: (v: BlochVector) => void;
    setCurrent: (v: BlochVector) => void;
}

export default function BlochSphere({ initial, current }: BlochSphereProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const apiRef = useRef<SceneApi | null>(null);

    // Build the scene once.
    useEffect(() => {
        const container = containerRef.current!;

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
        camera.position.set(
            0,
            CAMERA_DISTANCE * Math.cos(CAMERA_POLAR),
            CAMERA_DISTANCE * Math.sin(CAMERA_POLAR),
        );

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setPixelRatio(window.devicePixelRatio);
        container.appendChild(renderer.domElement);

        // Horizontal-only rotation: the polar angle is locked, no zoom, no pan.
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableZoom = false;
        controls.enablePan = false;
        controls.minPolarAngle = CAMERA_POLAR;
        controls.maxPolarAngle = CAMERA_POLAR;
        controls.enableDamping = true;

        // Sphere shell + reference circles
        scene.add(new THREE.Mesh(
            new THREE.SphereGeometry(1, 48, 32),
            new THREE.MeshBasicMaterial({ color: 0x90caf9, transparent: true, opacity: 0.08, depthWrite: false }),
        ));
        const X = new THREE.Vector3(0, 0, 1); // Bloch x (depth)
        const Y = new THREE.Vector3(1, 0, 0); // Bloch y (right)
        const Z = new THREE.Vector3(0, 1, 0); // Bloch z (up)
        scene.add(makeCircle(X, Y, 0x607d8b, 0.7));  // equator (Bloch XY plane)
        scene.add(makeCircle(X, Z, 0x607d8b, 0.3));  // meridian in Bloch XZ plane
        scene.add(makeCircle(Y, Z, 0x607d8b, 0.3));  // meridian in Bloch YZ plane

        // Axes
        scene.add(makeAxis(X, 0xe53935));
        scene.add(makeAxis(Y, 0x43a047));
        scene.add(makeAxis(Z, 0x1e88e5));

        // Labels
        const labels: [string, THREE.Vector3, string][] = [
            ["|0⟩", Z.clone().multiplyScalar(1.25), "#333"],
            ["|1⟩", Z.clone().multiplyScalar(-1.25), "#333"],
            ["|+⟩", X.clone().multiplyScalar(1.25), "#333"],
            ["|−⟩", X.clone().multiplyScalar(-1.25), "#333"],
            ["|+i⟩", Y.clone().multiplyScalar(1.3), "#333"],
            ["|−i⟩", Y.clone().multiplyScalar(-1.3), "#333"],
            ["x", X.clone().multiplyScalar(1.55), "#e53935"],
            ["y", Y.clone().multiplyScalar(1.55), "#43a047"],
            ["z", Z.clone().multiplyScalar(1.55), "#1e88e5"],
        ];
        for (const [text, pos, color] of labels) {
            const s = makeLabel(text, color);
            s.position.copy(pos);
            scene.add(s);
        }

        // Vectors: static (initial) and dynamic (current)
        const initialArrow = new AnimatedArrow(INITIAL_COLOR, false);
        const currentArrow = new AnimatedArrow(CURRENT_COLOR, true);
        scene.add(initialArrow.object, currentArrow.object);

        apiRef.current = {
            setInitial: v => initialArrow.setDirection(v, true),
            setCurrent: v => currentArrow.setDirection(v),
        };

        // Sizing
        const resize = () => {
            const { clientWidth: w, clientHeight: h } = container;
            if (w === 0 || h === 0) return;
            renderer.setSize(w, h);
            camera.aspect = w / h;
            camera.updateProjectionMatrix();
        };
        const observer = new ResizeObserver(resize);
        observer.observe(container);
        resize();

        // Render loop
        let frame = 0;
        const loop = () => {
            frame = requestAnimationFrame(loop);
            currentArrow.tick();
            controls.update();
            renderer.render(scene, camera);
        };
        loop();

        return () => {
            cancelAnimationFrame(frame);
            observer.disconnect();
            controls.dispose();
            scene.traverse(obj => {
                const o = obj as THREE.Mesh;
                o.geometry?.dispose();
                const mat = o.material as THREE.Material | THREE.Material[] | undefined;
                [mat].flat().forEach(m => {
                    if (!m) return;
                    (m as THREE.SpriteMaterial).map?.dispose();
                    m.dispose();
                });
            });
            renderer.dispose();
            renderer.domElement.remove();
            apiRef.current = null;
        };
    }, []);

    // Push state changes into the scene. Depend on the numbers, not the object identity.
    useEffect(() => {
        apiRef.current?.setInitial({ x: initial.x, y: initial.y, z: initial.z });
    }, [initial.x, initial.y, initial.z]);

    useEffect(() => {
        apiRef.current?.setCurrent({ x: current.x, y: current.y, z: current.z });
    }, [current.x, current.y, current.z]);

    return (
        <Box sx={{ position: "relative", width: "100%", height: "100%" }}>
            <Box ref={containerRef} sx={{ width: "100%", height: "100%", cursor: "grab" }} />
            <Box sx={{ position: "absolute", left: 16, bottom: 12, fontFamily: "monospace", fontSize: 13, userSelect: "none" }}>
                <Box component="span" sx={{ color: "#1976d2", fontWeight: 700 }}>━</Box> Actual &nbsp;
                <Box component="span" sx={{ color: "#9e9e9e", fontWeight: 700 }}>━</Box> Inicial
            </Box>
        </Box>
    );
}