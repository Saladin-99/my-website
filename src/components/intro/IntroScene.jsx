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
import DeviceBootOverlay from "./DeviceBootOverlay";

const COLORS = {
  background: "#0d0714",
  line: "#c4b5ff",
  dim: "#c4b5ff",
  accent: "#c4b5ff",
  orange: "#c4b5ff",
  lime: "#c4b5ff",
  violet: "#c4b5ff",
  surface: "#1b0d26",
};

const MONITOR_SCREEN_INSET = 0.24;
const PHONE_SCALE = 0.31;

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

function CylinderSideLines({
  radius,
  height,
  count = 10,
  color,
  opacity = 0.68,
}) {
  const geometry = useMemo(() => {
    const points = [];

    for (let index = 0; index < count; index += 1) {
      const angle = (index / count) * Math.PI * 2;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      points.push(
        new THREE.Vector3(x, -height / 2, z),
        new THREE.Vector3(x, height / 2, z),
      );
    }

    return new THREE.BufferGeometry().setFromPoints(points);
  }, [count, height, radius]);

  useEffect(() => () => geometry.dispose(), [geometry]);

  return (
    <lineSegments geometry={geometry}>
      <lineBasicMaterial
        color={color}
        transparent
        opacity={opacity}
        toneMapped={false}
      />
    </lineSegments>
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

function SignalCursor({
  position,
  rotation = [0, 0, 0],
  horizontal = false,
  size,
  color = COLORS.accent,
}) {
  const materialRef = useRef(null);

  useFrame(({ clock }) => {
    if (!materialRef.current) return;
    const pulse = Math.sin(clock.getElapsedTime() * Math.PI * 2);
    materialRef.current.opacity = pulse > -0.1 ? 0.95 : 0.12;
  });

  return (
    <mesh position={position} rotation={rotation}>
      <planeGeometry
        args={size ?? (horizontal ? [0.42, 0.035] : [0.035, 0.3])}
      />
      <meshBasicMaterial
        ref={materialRef}
        color={color}
        transparent
        toneMapped={false}
      />
    </mesh>
  );
}

function AmbientVertices({ count, color = COLORS.accent }) {
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
        color={color}
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
        color={COLORS.accent}
        lineOpacity={0.88}
        surfaceOpacity={0.24}
      >
        <mesh position={[0, 0, 0.142]}>
          <planeGeometry
            args={[
              screenWidth - MONITOR_SCREEN_INSET,
              screenHeight - MONITOR_SCREEN_INSET,
            ]}
          />
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
        position={[
          compact ? -1.78 : -2.08,
          compact ? 2.85 : 3.14,
          -1.596,
        ]}
        size={[0.018, 0.12]}
        color={COLORS.line}
      />
      <WireBox
        size={[0.18, 1.05, 0.18]}
        position={[0, 0.72, -1.78]}
        color={COLORS.violet}
      />
      <WireBox
        size={[1.65, 0.12, 0.75]}
        position={[0, 0.18, -1.58]}
        color={COLORS.violet}
      />
    </group>
  );
}

function KeyboardRow({
  widths,
  z,
  offset = 0,
  color = COLORS.orange,
}) {
  const gap = 0.07;
  const rowWidth =
    widths.reduce((total, width) => total + width, 0) +
    gap * (widths.length - 1);
  let cursor = -rowWidth / 2 + offset;

  return widths.map((width, index) => {
    const x = cursor + width / 2;
    cursor += width + gap;

    return (
      <WireBox
        key={`${z}-${index}`}
        size={[width, 0.065, 0.23]}
        position={[x, 0.135, z]}
        color={color}
        lineOpacity={0.5}
        surfaceOpacity={0.08}
      />
    );
  });
}

function Keyboard() {
  return (
    <group position={[0, 0.2, 1.35]} rotation={[-0.06, 0, 0]}>
      <WireBox
        size={[4.75, 0.18, 1.55]}
        color={COLORS.orange}
        lineOpacity={0.62}
        surfaceOpacity={0.08}
      />
      <KeyboardRow
        widths={Array(12).fill(0.27)}
        z={-0.5}
        color={COLORS.orange}
      />
      <KeyboardRow
        widths={[0.38, ...Array(9).fill(0.29), 0.5]}
        z={-0.17}
        offset={0.04}
        color={COLORS.dim}
      />
      <KeyboardRow
        widths={[0.5, ...Array(8).fill(0.3), 0.72]}
        z={0.16}
        offset={0.08}
        color={COLORS.accent}
      />
      <KeyboardRow
        widths={[0.42, 0.34, 0.34, 1.72, 0.34, 0.34, 0.55]}
        z={0.49}
        color={COLORS.violet}
      />
    </group>
  );
}

function Mouse() {
  return (
    <group position={[2.85, 0.2, 1.28]} rotation={[0, -0.12, 0]}>
      <WireBox
        size={[0.78, 0.32, 1.12]}
        color={COLORS.lime}
        lineOpacity={0.62}
        surfaceOpacity={0.11}
      />
      <WireBox
        size={[0.31, 0.045, 0.48]}
        position={[-0.18, 0.18, -0.25]}
        color={COLORS.accent}
        lineOpacity={0.72}
        surfaceOpacity={0.08}
      />
      <WireBox
        size={[0.31, 0.045, 0.48]}
        position={[0.18, 0.18, -0.25]}
        color={COLORS.orange}
        lineOpacity={0.72}
        surfaceOpacity={0.08}
      />
      <WireCylinder
        radius={0.065}
        height={0.13}
        position={[0, 0.22, -0.1]}
        rotation={[0, 0, Math.PI / 2]}
        color={COLORS.dim}
        opacity={0.8}
        segments={12}
      />
    </group>
  );
}

function CupWithPens() {
  const pens = [
    {
      position: [-0.13, 0.62, 0.02],
      rotation: [0, 0, -0.07],
      color: COLORS.accent,
    },
    {
      position: [0.02, 0.66, -0.07],
      rotation: [0.05, 0, 0.04],
      color: COLORS.orange,
    },
    {
      position: [0.15, 0.6, 0.08],
      rotation: [-0.04, 0, 0.08],
      color: COLORS.lime,
    },
  ];

  return (
    <group position={[4.25, 0, -1.85]}>
      <WireCylinder
        radius={0.48}
        height={0.95}
        position={[0, 0.37, 0]}
        color={COLORS.dim}
        opacity={0.45}
        segments={14}
      />
      <WireCylinder
        radius={0.28}
        height={0.08}
        position={[0.47, 0.52, 0]}
        rotation={[0, 0, Math.PI / 2]}
        color={COLORS.dim}
        opacity={0.42}
        segments={12}
      />
      {pens.map((pen, index) => (
        <WireCylinder
          key={`${pen.position[0]}-${index}`}
          radius={0.035}
          height={1.32}
          position={pen.position}
          rotation={pen.rotation}
          color={pen.color}
          opacity={0.88}
          segments={8}
        />
      ))}
    </group>
  );
}

function BullMark({ position, direction = 1 }) {
  const parts = [
    { size: [0.13, 0.065], position: [-0.01, 0, 0], rotation: 0.08 },
    { size: [0.062, 0.05], position: [0.075, 0.014, 0], rotation: -0.12 },
    { size: [0.056, 0.012], position: [0.102, 0.05, 0], rotation: 0.48 },
    { size: [0.052, 0.012], position: [0.105, 0.035, 0], rotation: -0.18 },
    { size: [0.018, 0.06], position: [-0.038, -0.046, 0], rotation: 0.18 },
    { size: [0.018, 0.06], position: [0.038, -0.043, 0], rotation: -0.2 },
    { size: [0.06, 0.012], position: [-0.092, 0.025, 0], rotation: 0.55 },
  ];

  return (
    <group position={position} scale={[direction, 1, 1]}>
      {parts.map((part, index) => (
        <mesh
          key={`${part.position[0]}-${part.position[1]}-${index}`}
          position={part.position}
          rotation={[0, 0, part.rotation]}
        >
          <planeGeometry args={part.size} />
          <meshBasicMaterial
            color="#e73545"
            depthWrite={false}
            side={THREE.DoubleSide}
            toneMapped={false}
          />
        </mesh>
      ))}
    </group>
  );
}

function RedBullCan() {
  return (
    <group position={[-3.15, 0.41, 1.35]}>
      <WireCylinder
        radius={0.31}
        height={1.1}
        color="#2d5fc0"
        opacity={0.84}
        segments={20}
      />
      <CylinderSideLines
        radius={0.31}
        height={1.02}
        count={10}
        color="#dce6f0"
      />
      <mesh position={[-0.085, 0, 0.318]} rotation={[0, 0, -0.14]}>
        <planeGeometry args={[0.145, 0.88]} />
        <meshBasicMaterial
          color="#dce6f0"
          transparent
          opacity={0.5}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
      <mesh position={[0.085, 0, 0.319]} rotation={[0, 0, 0.14]}>
        <planeGeometry args={[0.145, 0.88]} />
        <meshBasicMaterial
          color="#2453b8"
          transparent
          opacity={0.62}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
      <mesh position={[0, 0.08, 0.329]}>
        <circleGeometry args={[0.13, 24]} />
        <meshBasicMaterial
          color="#f2c84b"
          transparent
          opacity={0.88}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
      <BullMark position={[-0.083, 0.08, 0.334]} />
      <BullMark position={[0.083, 0.08, 0.334]} direction={-1} />
      {[-0.2, -0.29].map((y, index) => (
        <mesh key={y} position={[0, y, 0.33]}>
          <planeGeometry args={[index === 0 ? 0.3 : 0.22, 0.025]} />
          <meshBasicMaterial
            color={index === 0 ? "#2453b8" : "#dce6f0"}
            transparent
            opacity={0.72}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
      ))}
      <WireCylinder
        radius={0.315}
        height={0.055}
        position={[0, 0.51, 0]}
        color="#dce6f0"
        opacity={0.9}
        segments={20}
      />
      <WireCylinder
        radius={0.315}
        height={0.055}
        position={[0, -0.51, 0]}
        color="#2453b8"
        opacity={0.86}
        segments={20}
      />
      <mesh position={[0, 0.555, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.275, 24]} />
        <meshBasicMaterial
          color="#dce6f0"
          transparent
          opacity={0.42}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
      <WireCylinder
        radius={0.318}
        height={0.12}
        position={[0, 0.05, 0]}
        color="#2453b8"
        opacity={0.86}
        segments={20}
      />
      <WireCylinder
        radius={0.085}
        height={0.018}
        position={[0, 0.574, 0.035]}
        color="#dce6f0"
        opacity={0.78}
        segments={14}
      />
      <WireBox
        size={[0.09, 0.022, 0.2]}
        position={[0, 0.581, -0.04]}
        color="#2453b8"
        lineOpacity={0.8}
        surfaceOpacity={0.08}
      />
    </group>
  );
}

function DeskChair() {
  return (
    <group position={[0, -0.35, 4.5]}>
      <WireBox
        size={[2.35, 0.28, 1.7]}
        color={COLORS.violet}
        lineOpacity={0.52}
        surfaceOpacity={0.12}
      />
      <WireBox
        size={[2.5, 1.2, 0.3]}
        position={[0, 0.3, 1.05]}
        color={COLORS.dim}
        lineOpacity={0.62}
        surfaceOpacity={0.13}
      />
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
      <WireBox
        size={[11.8, 0.24, 7.3]}
        position={[0, -0.26, 0]}
        color={COLORS.violet}
        lineOpacity={0.4}
        surfaceOpacity={0.18}
      />
      <Monitor compact={compact} />
      <Keyboard />
      <Mouse />

      {!compact && (
        <>
          <DeskChair />
          <WireBox
            size={[1.45, 2.7, 2.05]}
            position={[-4.15, 1.25, -1.25]}
            color={COLORS.dim}
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
            color={COLORS.violet}
            segments={18}
          />
          <CupWithPens />
          <RedBullCan />
          <Cable points={cablePoints} color={COLORS.accent} />
        </>
      )}
      <AmbientVertices count={compact ? 34 : 58} color={COLORS.dim} />
    </group>
  );
}

function PhoneDisplay() {
  const screenMaterialRef = useRef(null);
  const glowMaterialRefs = useRef([]);
  const offColor = useMemo(() => new THREE.Color(COLORS.background), []);
  const awakeColor = useMemo(() => new THREE.Color("#251134"), []);

  useFrame(({ clock }) => {
    const wakeProgress = THREE.MathUtils.smootherstep(
      THREE.MathUtils.clamp((clock.getElapsedTime() - 1.7) / 1.1, 0, 1),
      0,
      1,
    );

    screenMaterialRef.current?.color.lerpColors(
      offColor,
      awakeColor,
      wakeProgress,
    );
    glowMaterialRefs.current.forEach((material, index) => {
      if (material) {
        material.opacity = wakeProgress * (index === 1 ? 0.28 : 0.2);
      }
    });
  });

  const glows = [
    { color: COLORS.accent, position: [-0.45, 0.153, -1.25], radius: 0.58 },
    { color: COLORS.dim, position: [0.4, 0.154, 0.1], radius: 0.72 },
    { color: COLORS.orange, position: [-0.28, 0.155, 1.5], radius: 0.5 },
  ];

  return (
    <>
      <mesh position={[0, 0.142, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[2.35, 4.88]} />
        <meshBasicMaterial
          ref={screenMaterialRef}
          color={COLORS.background}
          toneMapped={false}
        />
      </mesh>
      {glows.map((glow, index) => (
        <mesh
          key={`${glow.position.join("-")}-${index}`}
          position={glow.position}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <circleGeometry args={[glow.radius, 32]} />
          <meshBasicMaterial
            ref={(material) => {
              glowMaterialRefs.current[index] = material;
            }}
            color={glow.color}
            transparent
            opacity={0}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
      ))}
    </>
  );
}

function LivingRoomSofa() {
  return (
    <group position={[0, 0, -4.3]}>
      <WireBox
        size={[6.2, 0.7, 2.2]}
        position={[0, -0.05, 0]}
        color={COLORS.violet}
        lineOpacity={0.62}
        surfaceOpacity={0.13}
      />
      <WireBox
        size={[6.2, 1.15, 0.42]}
        position={[0, 0.42, -1.05]}
        color={COLORS.dim}
        lineOpacity={0.72}
        surfaceOpacity={0.16}
      />
      {[-2.86, 2.86].map((x) => (
        <WireBox
          key={x}
          size={[0.48, 0.9, 2.18]}
          position={[x, 0.24, 0]}
          color={x < 0 ? COLORS.accent : COLORS.orange}
          lineOpacity={0.66}
          surfaceOpacity={0.12}
        />
      ))}
      {[-1.9, 0, 1.9].map((x, index) => (
        <WireBox
          key={x}
          size={[1.68, 0.3, 1.58]}
          position={[x, 0.46, 0.12]}
          color={[COLORS.accent, COLORS.dim, COLORS.orange][index]}
          lineOpacity={0.58}
          surfaceOpacity={0.1}
        />
      ))}
    </group>
  );
}

function PhoneDevice() {
  return (
    <group
      position={[0, 0.08, 0]}
      rotation={[0, Math.PI, 0]}
      scale={PHONE_SCALE}
    >
      <WireBox
        size={[2.55, 0.22, 5.15]}
        position={[0, 0.02, 0]}
        color={COLORS.dim}
        lineOpacity={0.9}
        surfaceOpacity={0.25}
      />
      <PhoneDisplay />
      <WireBox
        size={[0.38, 0.025, 0.045]}
        position={[0, 0.16, -2.23]}
        color={COLORS.accent}
        lineOpacity={0.55}
        surfaceOpacity={0}
      />
      <WireCylinder
        radius={0.105}
        height={0.025}
        position={[0.48, 0.16, -2.23]}
        color={COLORS.dim}
        opacity={0.7}
        segments={16}
      />
      {[
        {
          size: [0.045, 0.08, 0.72],
          position: [-1.3, 0.03, -0.75],
          color: COLORS.orange,
        },
        {
          size: [0.045, 0.08, 0.48],
          position: [1.3, 0.03, -0.45],
          color: COLORS.accent,
        },
      ].map((button) => (
        <WireBox
          key={button.position[0]}
          size={button.size}
          position={button.position}
          color={button.color}
          lineOpacity={0.72}
          surfaceOpacity={0.08}
        />
      ))}
    </group>
  );
}

function MobilePhone() {
  return (
    <group>
      <WireBox
        size={[7.6, 0.16, 11.4]}
        position={[0, -0.56, 0]}
        color={COLORS.violet}
        lineOpacity={0.24}
        surfaceOpacity={0.12}
      />
      <WireBox
        size={[6.8, 0.07, 7.15]}
        position={[0, -0.43, 0.42]}
        color={COLORS.dim}
        lineOpacity={0.36}
        surfaceOpacity={0.06}
      />
      <LivingRoomSofa />
      <WireBox
        size={[5.6, 0.28, 5.35]}
        position={[0, -0.2, 0.35]}
        color={COLORS.orange}
        lineOpacity={0.58}
        surfaceOpacity={0.14}
      />
      <WireBox
        size={[1.2, 0.11, 1.55]}
        position={[-1.9, 0.01, 1.65]}
        rotation={[0, 0.16, 0]}
        color={COLORS.accent}
        lineOpacity={0.56}
        surfaceOpacity={0.08}
      />
      <WireBox
        size={[1.05, 0.08, 1.42]}
        position={[-1.78, 0.09, 1.58]}
        rotation={[0, 0.1, 0]}
        color={COLORS.violet}
        lineOpacity={0.5}
        surfaceOpacity={0.06}
      />
      <WireCylinder
        radius={0.36}
        height={0.62}
        position={[2, 0.23, 1.45]}
        color={COLORS.lime}
        opacity={0.62}
        segments={16}
      />
      <WireCylinder
        radius={0.17}
        height={0.08}
        position={[2.37, 0.24, 1.45]}
        rotation={[0, 0, Math.PI / 2]}
        color={COLORS.lime}
        opacity={0.5}
        segments={12}
      />
      <PhoneDevice />
      <AmbientVertices count={34} color={COLORS.accent} />
    </group>
  );
}

function CameraRig({ mode, onSequenceComplete }) {
  const { camera, invalidate, size } = useThree();
  const completedRef = useRef(false);
  const currentPosition = useMemo(() => new THREE.Vector3(), []);
  const currentTarget = useMemo(() => new THREE.Vector3(), []);
  const currentUp = useMemo(() => new THREE.Vector3(), []);
  const isMobile = mode === "mobile";

  const screenFraming = useMemo(() => {
    const tablet = mode === "tablet";
    const viewportAspect = Math.max(
      size.width / Math.max(size.height, 1),
      0.01,
    );
    const verticalTangent = Math.tan(
      THREE.MathUtils.degToRad(camera.fov) / 2,
    );
    const horizontalTangent = verticalTangent * viewportAspect;
    const monitorWidth = tablet ? 4.15 : 4.8;
    const monitorHeight = tablet ? 2.38 : 2.75;
    const screenWidth = isMobile
      ? 2.35 * PHONE_SCALE
      : monitorWidth - MONITOR_SCREEN_INSET;
    const screenHeight = isMobile
      ? 4.88 * PHONE_SCALE
      : monitorHeight - MONITOR_SCREEN_INSET;
    const verticalDistance = screenHeight / (2 * verticalTangent);
    const horizontalDistance = screenWidth / (2 * horizontalTangent);
    const coverDistance =
      Math.min(verticalDistance, horizontalDistance) * 0.99;

    if (isMobile) {
      const screenPlaneY = 0.08 + 0.142 * PHONE_SCALE;
      return {
        cover: new THREE.Vector3(0, screenPlaneY + coverDistance, 0),
        through: new THREE.Vector3(
          0,
          screenPlaneY + coverDistance * 0.34,
          0,
        ),
      };
    }

    const screenPlaneZ = -1.75 + 0.142;
    const screenCenterY = tablet ? 1.85 : 2.05;
    return {
      cover: new THREE.Vector3(
        0,
        screenCenterY,
        screenPlaneZ + coverDistance,
      ),
      through: new THREE.Vector3(
        0,
        screenCenterY,
        screenPlaneZ + coverDistance * 0.55,
      ),
    };
  }, [camera.fov, isMobile, mode, size.height, size.width]);

  const settings = useMemo(() => {
    if (isMobile) {
      return {
        stageOneStart: 0.8,
        stageOneEnd: 3.65,
        frameEnd: 3.65,
        holdEnd: 4.35,
        zoomEnd: 5.65,
        total: 8.2,
        start: new THREE.Vector3(0, 18.5, 0),
        control: new THREE.Vector3(0, 12.8, 0),
        stageOnePosition: screenFraming.cover.clone(),
        screenPosition: screenFraming.cover.clone(),
        end: screenFraming.through.clone(),
        targetStart: new THREE.Vector3(0, 0.03, 0),
        targetEnd: new THREE.Vector3(0, 0.03, 0),
        upStart: new THREE.Vector3(0, 0, 1),
        upEnd: new THREE.Vector3(0, 0, 1),
      };
    }

    const tablet = mode === "tablet";
    return {
      stageOneStart: 0.85,
      stageOneEnd: 3.35,
      frameEnd: 5.45,
      holdEnd: 6.15,
      zoomEnd: 7.15,
      total: 9.4,
      start: new THREE.Vector3(0, tablet ? 15 : 17.5, 0),
      control: new THREE.Vector3(
        0,
        tablet ? 8.8 : 10,
        tablet ? 6.9 : 8.2,
      ),
      stageOnePosition: new THREE.Vector3(
        0,
        tablet ? 1.85 : 2.05,
        screenFraming.cover.z + 5.2,
      ),
      screenPosition: screenFraming.cover.clone(),
      end: screenFraming.through.clone(),
      targetStart: new THREE.Vector3(0, 0.18, 0),
      targetEnd: new THREE.Vector3(0, tablet ? 1.85 : 2.04, -1.75),
      upStart: new THREE.Vector3(0, 0, -1),
      upEnd: new THREE.Vector3(0, 1, 0),
    };
  }, [isMobile, mode, screenFraming]);

  const curve = useMemo(
    () =>
      new THREE.QuadraticBezierCurve3(
        settings.start,
        settings.control,
        settings.stageOnePosition,
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
    currentUp.copy(settings.upStart);
    camera.up.copy(currentUp);
    camera.lookAt(currentTarget);
    camera.updateMatrixWorld();
    invalidate();
  }, [
    camera,
    currentPosition,
    currentTarget,
    currentUp,
    curve,
    invalidate,
    settings,
  ]);

  useFrame(({ clock }) => {
    const elapsed = clock.getElapsedTime();
    const getStageProgress = (start, end) =>
      THREE.MathUtils.smootherstep(
        THREE.MathUtils.clamp((elapsed - start) / (end - start), 0, 1),
        0,
        1,
      );

    if (elapsed <= settings.stageOneEnd) {
      const progress = getStageProgress(
        settings.stageOneStart,
        settings.stageOneEnd,
      );
      curve.getPoint(progress, currentPosition);
      currentTarget.lerpVectors(
        settings.targetStart,
        settings.targetEnd,
        progress,
      );
      currentUp
        .lerpVectors(settings.upStart, settings.upEnd, progress)
        .normalize();
    } else if (elapsed <= settings.frameEnd) {
      const progress = getStageProgress(
        settings.stageOneEnd,
        settings.frameEnd,
      );
      currentPosition.lerpVectors(
        settings.stageOnePosition,
        settings.screenPosition,
        progress,
      );
      currentTarget.copy(settings.targetEnd);
      currentUp.copy(settings.upEnd);
    } else if (elapsed <= settings.holdEnd) {
      currentPosition.copy(settings.screenPosition);
      currentTarget.copy(settings.targetEnd);
      currentUp.copy(settings.upEnd);
    } else {
      const progress = getStageProgress(settings.holdEnd, settings.zoomEnd);
      currentPosition.lerpVectors(
        settings.screenPosition,
        settings.end,
        progress,
      );
      currentTarget.copy(settings.targetEnd);
      currentUp.copy(settings.upEnd);
    }
    camera.position.copy(currentPosition);
    camera.up.copy(currentUp);
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
      <fog attach="fog" args={[COLORS.background, 22, 42]} />
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
      11000,
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
          far: 50,
          position:
            mode === "mobile"
              ? [0, 18.5, 0]
              : mode === "tablet"
                ? [0, 15, 0]
                : [0, 17.5, 0],
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

      <DeviceBootOverlay mode={mode} />

      <div className="intro-progress" aria-hidden="true">
        <span />
      </div>

      <button
        className="skip-intro"
        type="button"
        onClick={() => completeIntro("keyboard")}
      >
        Skip intro
        <span>Enter or Space</span>
      </button>
      <p className="sr-only">
        A brief animated device sequence is playing. Press Enter, Space,
        Escape, or the skip button to continue.
      </p>
    </div>
  );
}
