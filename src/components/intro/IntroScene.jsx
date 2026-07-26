import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import * as THREE from "three";

const COLORS = {
  background: "#050706",
  line: "#9cb8a7",
  dim: "#315143",
  accent: "#7cffb2",
  surface: "#07100c",
};

function getSceneMode() {
  if (
    window.matchMedia("(orientation: portrait)").matches ||
    window.innerWidth < 700
  ) {
    return "mobile";
  }

  return window.innerWidth < 1024 ? "tablet" : "desktop";
}

function WireBox({
  size,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  color = COLORS.line,
  lineOpacity = 0.84,
  surfaceOpacity = 0.12,
  children,
}) {
  const [width, height, depth] = size;
  const edgeGeometry = useMemo(() => {
    const boxGeometry = new THREE.BoxGeometry(width, height, depth);
    const geometry = new THREE.EdgesGeometry(boxGeometry, 25);
    boxGeometry.dispose();
    return geometry;
  }, [depth, height, width]);

  useEffect(() => () => edgeGeometry.dispose(), [edgeGeometry]);

  return (
    <group position={position} rotation={rotation}>
      <mesh>
        <boxGeometry args={size} />
        <meshBasicMaterial
          color={COLORS.surface}
          transparent
          opacity={surfaceOpacity}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
      <lineSegments geometry={edgeGeometry}>
        <lineBasicMaterial
          color={color}
          transparent
          opacity={lineOpacity}
          toneMapped={false}
        />
      </lineSegments>
      {children}
    </group>
  );
}

function WireCylinder({
  radius = 0.5,
  height = 1,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  color = COLORS.line,
  opacity = 0.55,
  segments = 16,
}) {
  const edgeGeometry = useMemo(() => {
    const cylinderGeometry = new THREE.CylinderGeometry(
      radius,
      radius,
      height,
      segments,
    );
    const geometry = new THREE.EdgesGeometry(cylinderGeometry, 25);
    cylinderGeometry.dispose();
    return geometry;
  }, [height, radius, segments]);

  useEffect(() => () => edgeGeometry.dispose(), [edgeGeometry]);

  return (
    <group position={position} rotation={rotation}>
      <mesh>
        <cylinderGeometry args={[radius, radius, height, segments]} />
        <meshBasicMaterial
          color={COLORS.surface}
          transparent
          opacity={0.1}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
      <lineSegments geometry={edgeGeometry}>
        <lineBasicMaterial
          color={color}
          transparent
          opacity={opacity}
          toneMapped={false}
        />
      </lineSegments>
    </group>
  );
}

function Cable({ points, color = COLORS.dim }) {
  const geometry = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3(
      points.map(([x, y, z]) => new THREE.Vector3(x, y, z)),
    );
    return new THREE.BufferGeometry().setFromPoints(curve.getPoints(28));
  }, [points]);

  useEffect(() => () => geometry.dispose(), [geometry]);

  return (
    <line geometry={geometry}>
      <lineBasicMaterial
        color={color}
        transparent
        opacity={0.55}
        toneMapped={false}
      />
    </line>
  );
}

function SignalCursor({ position, rotation = [0, 0, 0], horizontal = false }) {
  const materialRef = useRef(null);

  useFrame(({ clock }) => {
    if (!materialRef.current) return;
    const pulse = Math.sin(clock.getElapsedTime() * Math.PI * 2);
    materialRef.current.opacity = pulse > -0.1 ? 0.95 : 0.12;
  });

  return (
    <mesh position={position} rotation={rotation}>
      <planeGeometry args={horizontal ? [0.42, 0.035] : [0.035, 0.3]} />
      <meshBasicMaterial
        ref={materialRef}
        color={COLORS.accent}
        transparent
        toneMapped={false}
      />
    </mesh>
  );
}

function AmbientVertices({ count }) {
  const materialRef = useRef(null);
  const geometry = useMemo(() => {
    let seed = 991;
    const random = () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };
    const positions = new Float32Array(count * 3);

    for (let index = 0; index < count; index += 1) {
      positions[index * 3] = (random() - 0.5) * 13;
      positions[index * 3 + 1] = random() * 5 + 0.2;
      positions[index * 3 + 2] = (random() - 0.5) * 9;
    }

    const pointsGeometry = new THREE.BufferGeometry();
    pointsGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(positions, 3),
    );
    return pointsGeometry;
  }, [count]);

  useEffect(() => () => geometry.dispose(), [geometry]);

  useFrame(({ clock }) => {
    if (materialRef.current) {
      materialRef.current.opacity =
        0.16 + Math.sin(clock.getElapsedTime() * 4.2) * 0.06;
    }
  });

  return (
    <points geometry={geometry}>
      <pointsMaterial
        ref={materialRef}
        color={COLORS.accent}
        size={0.025}
        transparent
        opacity={0.18}
        sizeAttenuation
        toneMapped={false}
      />
    </points>
  );
}

function Monitor({ compact = false }) {
  const screenWidth = compact ? 4.15 : 4.8;
  const screenHeight = compact ? 2.38 : 2.75;

  return (
    <group>
      <WireBox
        size={[screenWidth, screenHeight, 0.26]}
        position={[0, compact ? 1.85 : 2.05, -1.75]}
        lineOpacity={0.88}
        surfaceOpacity={0.24}
      >
        <mesh position={[0, 0, 0.142]}>
          <planeGeometry args={[screenWidth - 0.24, screenHeight - 0.24]} />
          <meshBasicMaterial color={COLORS.background} toneMapped={false} />
        </mesh>
        <mesh position={[0, 0, 0.146]}>
          <planeGeometry args={[screenWidth - 0.36, 0.012]} />
          <meshBasicMaterial
            color={COLORS.dim}
            transparent
            opacity={0.34}
            toneMapped={false}
          />
        </mesh>
      </WireBox>
      <SignalCursor
        position={[-0.72, compact ? 1.83 : 2.03, -1.596]}
      />
      <WireBox
        size={[0.18, 1.05, 0.18]}
        position={[0, 0.72, -1.78]}
        color={COLORS.dim}
      />
      <WireBox
        size={[1.65, 0.12, 0.75]}
        position={[0, 0.18, -1.58]}
        color={COLORS.dim}
      />
    </group>
  );
}

function Keyboard() {
  return (
    <group position={[0, 0.2, 1.35]} rotation={[-0.05, 0, 0]}>
      <WireBox
        size={[4.15, 0.18, 1.25]}
        lineOpacity={0.52}
        surfaceOpacity={0.06}
      />
      {[-1.6, -1.07, -0.54, 0, 0.54, 1.07, 1.6].map((x) => (
        <WireBox
          key={x}
          size={[0.3, 0.035, 0.82]}
          position={[x, 0.11, 0]}
          color={COLORS.dim}
          lineOpacity={0.35}
          surfaceOpacity={0}
        />
      ))}
    </group>
  );
}

function DesktopDesk({ mode }) {
  const compact = mode === "tablet";
  const cablePoints = useMemo(
    () => [
      [2.3, 0.13, -1.45],
      [3.1, 0.12, -0.7],
      [2.8, 0.12, 0.25],
      [3.8, 0.13, 0.9],
    ],
    [],
  );

  return (
    <group>
      <gridHelper
        args={[14, 28, COLORS.dim, "#12271f"]}
        position={[0, -0.13, 0]}
      />
      <WireBox
        size={[11.8, 0.24, 7.3]}
        position={[0, -0.26, 0]}
        color={COLORS.dim}
        lineOpacity={0.4}
        surfaceOpacity={0.18}
      />
      <Monitor compact={compact} />
      <Keyboard />
      <WireBox
        size={[0.72, 0.32, 1.1]}
        position={[2.85, 0.2, 1.28]}
        rotation={[0, -0.12, 0]}
        lineOpacity={0.55}
      />

      {!compact && (
        <>
          <WireBox
            size={[1.45, 2.7, 2.05]}
            position={[-4.15, 1.25, -1.25]}
            lineOpacity={0.78}
            surfaceOpacity={0.16}
          />
          <WireCylinder
            radius={0.45}
            height={0.04}
            position={[-4.15, 1.7, -0.205]}
            rotation={[Math.PI / 2, 0, 0]}
            color={COLORS.accent}
            opacity={0.45}
            segments={18}
          />
          <WireCylinder
            radius={0.45}
            height={0.04}
            position={[-4.15, 0.7, -0.205]}
            rotation={[Math.PI / 2, 0, 0]}
            color={COLORS.dim}
            segments={18}
          />
          <WireCylinder
            radius={0.48}
            height={0.95}
            position={[4.25, 0.37, -1.85]}
            color={COLORS.line}
            opacity={0.45}
            segments={14}
          />
          <WireCylinder
            radius={0.28}
            height={0.08}
            position={[4.72, 0.52, -1.85]}
            rotation={[0, 0, Math.PI / 2]}
            color={COLORS.dim}
            opacity={0.42}
            segments={12}
          />
          <Cable points={cablePoints} />
        </>
      )}
      <AmbientVertices count={compact ? 34 : 58} />
    </group>
  );
}

function MobilePhone() {
  const cablePoints = useMemo(
    () => [
      [1.05, 0.02, 2.2],
      [1.7, 0.01, 2.75],
      [1.35, 0.01, 3.45],
      [2.1, 0.01, 3.9],
    ],
    [],
  );

  return (
    <group>
      <gridHelper
        args={[9, 18, COLORS.dim, "#10231c"]}
        position={[0, -0.11, 0]}
      />
      <WireBox
        size={[7, 0.18, 8]}
        position={[0, -0.22, 0]}
        color={COLORS.dim}
        lineOpacity={0.32}
        surfaceOpacity={0.16}
      />
      <WireBox
        size={[2.55, 0.22, 5.15]}
        position={[0, 0.02, 0]}
        color={COLORS.line}
        lineOpacity={0.9}
        surfaceOpacity={0.25}
      />
      <mesh position={[0, 0.142, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[2.35, 4.88]} />
        <meshBasicMaterial color={COLORS.background} toneMapped={false} />
      </mesh>
      <WireBox
        size={[0.66, 0.025, 0.045]}
        position={[0, 0.16, -2.2]}
        color={COLORS.dim}
        lineOpacity={0.55}
        surfaceOpacity={0}
      />
      <SignalCursor
        horizontal
        position={[-0.42, 0.155, -0.28]}
        rotation={[-Math.PI / 2, 0, 0]}
      />
      <Cable points={cablePoints} />
      <AmbientVertices count={24} />
    </group>
  );
}

function CameraRig({ mode, onSequenceComplete }) {
  const { camera, invalidate } = useThree();
  const completedRef = useRef(false);
  const currentPosition = useMemo(() => new THREE.Vector3(), []);
  const currentTarget = useMemo(() => new THREE.Vector3(), []);
  const isMobile = mode === "mobile";

  const settings = useMemo(() => {
    if (isMobile) {
      return {
        delay: 0.22,
        duration: 1.08,
        total: 1.48,
        start: new THREE.Vector3(0.25, 8.2, 0.55),
        control: new THREE.Vector3(0.12, 5.2, 0.24),
        end: new THREE.Vector3(0, 2.25, 0.02),
        targetStart: new THREE.Vector3(0, 0, 0),
        targetEnd: new THREE.Vector3(0, 0.03, 0),
      };
    }

    const tablet = mode === "tablet";
    return {
      delay: tablet ? 0.26 : 0.36,
      duration: tablet ? 1.18 : 1.42,
      total: tablet ? 1.68 : 2.02,
      start: new THREE.Vector3(
        tablet ? 0.25 : 0.42,
        tablet ? 8.2 : 10.2,
        tablet ? 2.25 : 3.1,
      ),
      control: new THREE.Vector3(0.12, tablet ? 5.1 : 6.2, 3.2),
      end: new THREE.Vector3(0, tablet ? 1.86 : 2.05, 1.02),
      targetStart: new THREE.Vector3(0, 0.18, 0),
      targetEnd: new THREE.Vector3(0, tablet ? 1.85 : 2.04, -1.75),
    };
  }, [isMobile, mode]);

  const curve = useMemo(
    () =>
      new THREE.QuadraticBezierCurve3(
        settings.start,
        settings.control,
        settings.end,
      ),
    [settings],
  );

  useLayoutEffect(() => {
    const easedProgress = 0;
    curve.getPoint(easedProgress, currentPosition);
    currentTarget.lerpVectors(
      settings.targetStart,
      settings.targetEnd,
      easedProgress,
    );
    camera.position.copy(currentPosition);
    camera.up.set(0, isMobile ? 0 : 1, isMobile ? -1 : 0);
    camera.lookAt(currentTarget);
    camera.updateMatrixWorld();
    invalidate();
  }, [
    camera,
    currentPosition,
    currentTarget,
    curve,
    isMobile,
    invalidate,
    settings,
  ]);

  useFrame(({ clock }) => {
    const elapsed = clock.getElapsedTime();
    const rawProgress = THREE.MathUtils.clamp(
      (elapsed - settings.delay) / settings.duration,
      0,
      1,
    );
    const easedProgress = THREE.MathUtils.smootherstep(rawProgress, 0, 1);

    curve.getPoint(easedProgress, currentPosition);
    currentTarget.lerpVectors(
      settings.targetStart,
      settings.targetEnd,
      easedProgress,
    );
    camera.position.copy(currentPosition);
    camera.up.set(0, isMobile ? 0 : 1, isMobile ? -1 : 0);
    camera.lookAt(currentTarget);

    if (elapsed >= settings.total && !completedRef.current) {
      completedRef.current = true;
      onSequenceComplete("complete");
    }
  });

  return null;
}

function Scene({ mode, onSequenceComplete }) {
  return (
    <>
      <color attach="background" args={[COLORS.background]} />
      <fog attach="fog" args={[COLORS.background, 13, 28]} />
      {mode === "mobile" ? (
        <MobilePhone />
      ) : (
        <DesktopDesk mode={mode} />
      )}
      <CameraRig mode={mode} onSequenceComplete={onSequenceComplete} />
    </>
  );
}

export default function IntroScene({ onComplete }) {
  const [mode] = useState(getSceneMode);
  const [exiting, setExiting] = useState(false);
  const completionRef = useRef(false);
  const exitTimerRef = useRef(null);

  const completeIntro = useCallback(
    (reason) => {
      if (completionRef.current) return;
      completionRef.current = true;
      setExiting(true);
      exitTimerRef.current = window.setTimeout(
        () => onComplete(reason),
        reason === "complete" ? 120 : 190,
      );
    },
    [onComplete],
  );

  useEffect(() => {
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    );

    const handleKeyDown = (event) => {
      const activeTag = document.activeElement?.tagName;
      const isEditable =
        activeTag === "INPUT" ||
        activeTag === "TEXTAREA" ||
        document.activeElement?.isContentEditable;
      const shouldSkip =
        !event.repeat &&
        !event.isComposing &&
        !event.altKey &&
        !event.ctrlKey &&
        !event.metaKey &&
        !isEditable &&
        (event.key === "Enter" ||
          event.key === " " ||
          event.key === "Escape");

      if (!shouldSkip) return;
      event.preventDefault();
      completeIntro("keyboard");
    };

    const handleMotionChange = (event) => {
      if (event.matches) completeIntro("reduced-motion");
    };

    const handleVisibilityChange = () => {
      if (document.hidden) completeIntro("hidden");
    };

    window.addEventListener("keydown", handleKeyDown);
    reducedMotion.addEventListener("change", handleMotionChange);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    const watchdog = window.setTimeout(
      () => completeIntro("watchdog"),
      2800,
    );

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      reducedMotion.removeEventListener("change", handleMotionChange);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.clearTimeout(watchdog);
      window.clearTimeout(exitTimerRef.current);
    };
  }, [completeIntro]);

  return (
    <div
      className={`intro-layer intro-layer--${mode} ${
        exiting ? "is-exiting" : ""
      }`}
      onPointerDown={(event) => {
        if (event.target.closest("button")) return;
        completeIntro("pointer");
      }}
    >
      <Canvas
        aria-hidden="true"
        camera={{
          fov: mode === "mobile" ? 42 : mode === "tablet" ? 40 : 36,
          near: 0.05,
          far: 30,
          position:
            mode === "mobile"
              ? [0.25, 8.2, 0.55]
              : [0.42, 10.2, 3.1],
        }}
        dpr={mode === "mobile" ? 1 : [1, 1.5]}
        gl={{
          antialias: mode !== "mobile",
          alpha: false,
          powerPreference: "high-performance",
        }}
        onCreated={({ gl }) => {
          gl.domElement.addEventListener(
            "webglcontextlost",
            (event) => {
              event.preventDefault();
              completeIntro("webgl-error");
            },
            { once: true },
          );
        }}
        fallback={<div className="intro-fallback" />}
      >
        <Scene mode={mode} onSequenceComplete={completeIntro} />
      </Canvas>

      <div className="intro-chrome" aria-hidden="true">
        <div className="intro-readout">
          <span>BOOT / SCENE_{mode.toUpperCase()}</span>
          <span className="intro-readout-status">SIGNAL ACQUIRED</span>
        </div>
        <div className="intro-reticle">
          <span />
          <span />
        </div>
        <div className="intro-progress">
          <span />
        </div>
      </div>

      <button
        className="skip-intro"
        type="button"
        onClick={() => completeIntro("keyboard")}
      >
        Skip intro
        <span>ENTER / SPACE</span>
      </button>
      <p className="sr-only">
        A brief animated desk sequence is playing. Press Enter, Space, Escape,
        or the skip button to continue.
      </p>
    </div>
  );
}
