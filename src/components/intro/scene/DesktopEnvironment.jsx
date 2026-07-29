import { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import {
  BeveledBox,
  CableTube,
  FacetedCylinder,
  LowPolySphere,
  PALETTE,
  PolygonPlane,
  TorusForm,
} from "./SceneKit";

const DESKTOP_SCREEN_Z = -1.39;
const DESKTOP_SCREEN_FACE_OFFSET = 0.036;

export function getDesktopDisplayMetrics(
  viewportAspect,
  compact = false,
) {
  const aspect =
    Number.isFinite(viewportAspect) && viewportAspect > 0
      ? viewportAspect
      : 16 / 9;
  const referenceWidth = compact ? 4.15 : 4.56;
  const referenceHeight = compact ? 2.38 : 2.51;
  const referenceArea = referenceWidth * referenceHeight;
  let screenWidth = Math.sqrt(referenceArea * aspect);
  let screenHeight = screenWidth / aspect;
  const maxWidth = compact ? 5.4 : 6.2;
  const maxHeight = compact ? 2.9 : 3.05;
  const fitScale = Math.min(
    1,
    maxWidth / screenWidth,
    maxHeight / screenHeight,
  );
  screenWidth *= fitScale;
  screenHeight *= fitScale;

  return Object.freeze({
    aspect,
    compact,
    centerY: compact ? 1.85 : 2.05,
    screenHeight,
    screenPlaneZ:
      DESKTOP_SCREEN_Z + DESKTOP_SCREEN_FACE_OFFSET,
    screenWidth,
    screenZ: DESKTOP_SCREEN_Z,
  });
}

const KEY_SPECTRUM = [
  PALETTE.coral,
  PALETTE.orange,
  PALETTE.yellow,
  PALETTE.lime,
  PALETTE.teal,
  PALETTE.cyan,
  PALETTE.blue,
  PALETTE.violet,
];

const ROOM_BOOK_COLORS = [
  PALETTE.coral,
  PALETTE.yellow,
  PALETTE.teal,
  PALETTE.cobalt,
  PALETTE.violet,
];

function ScreenCursor({ display }) {
  const materialRef = useRef(null);
  const elapsedRef = useRef(0);
  const {
    centerY,
    screenHeight,
    screenWidth,
    screenZ,
  } = display;

  useFrame((_, delta) => {
    if (!materialRef.current) return;
    elapsedRef.current += delta;
    materialRef.current.opacity =
      Math.sin(elapsedRef.current * Math.PI * 2) > -0.12
        ? 0.88
        : 0.08;
  });

  return (
    <mesh
      position={[
        -screenWidth / 2 + 0.2,
        centerY + screenHeight / 2 - 0.16,
        screenZ + 0.052,
      ]}
      renderOrder={23}
    >
      <planeGeometry args={[0.018, 0.12]} />
      <meshBasicMaterial
        ref={materialRef}
        color={PALETTE.glow}
        transparent
        depthWrite={false}
        toneMapped={false}
      />
    </mesh>
  );
}

function WorkstationMonitor({ display }) {
  const {
    centerY,
    screenHeight,
    screenWidth,
    screenZ,
  } = display;
  const controlY = centerY - screenHeight / 2 - 0.27;
  const topVentY = centerY + screenHeight / 2 + 0.39;

  return (
    <group>
      <BeveledBox
        size={[screenWidth + 0.1, screenHeight + 0.15, 0.55]}
        position={[0, centerY, screenZ - 1.95]}
        radius={0.16}
        segments={3}
        color="#8f775f"
        edgeOpacity={0.1}
        shininess={20}
      />
      <BeveledBox
        size={[screenWidth + 0.55, screenHeight + 0.5, 0.95]}
        position={[0, centerY - 0.01, screenZ - 1.35]}
        radius={0.2}
        segments={3}
        color="#ad966f"
        edgeOpacity={0.12}
        shininess={24}
      />
      <BeveledBox
        size={[screenWidth + 0.9, screenHeight + 0.78, 0.9]}
        position={[0, centerY - 0.02, screenZ - 0.67]}
        radius={0.24}
        segments={3}
        color="#c7b887"
        edgeOpacity={0.14}
        shininess={28}
      />
      <BeveledBox
        size={[screenWidth + 1.04, screenHeight + 0.94, 0.34]}
        position={[
          0,
          centerY - 0.08,
          screenZ - 0.19,
        ]}
        radius={0.26}
        segments={3}
        color={PALETTE.ivory}
        edgeOpacity={0.2}
        shininess={38}
      />
      <BeveledBox
        size={[screenWidth + 0.3, screenHeight + 0.26, 0.14]}
        position={[
          0,
          centerY,
          screenZ - 0.045,
        ]}
        radius={0.18}
        segments={3}
        color={PALETTE.monitorBezel}
        edgeOpacity={0.22}
        shininess={70}
      />
      <mesh
        position={[0, centerY, screenZ + 0.036]}
        renderOrder={-10}
      >
        <planeGeometry args={[screenWidth, screenHeight]} />
        <meshBasicMaterial
          color={PALETTE.background}
          toneMapped={false}
        />
      </mesh>
      {[-1, 1].map((side) => (
        <mesh
          key={`screen-edge-${side}`}
          position={[
            side * (screenWidth / 2 - 0.025),
            centerY,
            screenZ + 0.043,
          ]}
          renderOrder={20}
        >
          <planeGeometry args={[0.05, screenHeight * 0.94]} />
          <meshBasicMaterial
            color={PALETTE.violet}
            transparent
            opacity={0.13}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
      ))}
      <mesh
        position={[
          -screenWidth * 0.17,
          centerY + 0.22,
          screenZ + 0.047,
        ]}
        rotation={[0, 0, 0.12]}
        renderOrder={21}
      >
        <planeGeometry args={[screenWidth * 0.14, screenHeight * 0.86]} />
        <meshBasicMaterial
          color={PALETTE.cyan}
          transparent
          opacity={0.035}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
      <mesh
        position={[
          0,
          centerY - screenHeight * 0.26,
          screenZ + 0.048,
        ]}
        renderOrder={22}
      >
        <planeGeometry args={[screenWidth * 0.84, 0.018]} />
        <meshBasicMaterial
          color={PALETTE.magenta}
          transparent
          opacity={0.08}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
      <ScreenCursor display={display} />

      <FacetedCylinder
        radius={0.56}
        height={0.12}
        segments={14}
        position={[0, 0.34, -2.15]}
        color={PALETTE.graphite}
        edgeOpacity={0.12}
      />
      <BeveledBox
        size={[0.92, 0.38, 0.72]}
        position={[0, 0.2, -2.15]}
        radius={0.12}
        color="#ad966f"
        edgeOpacity={0.12}
        shininess={24}
      />
      <BeveledBox
        size={[2.35, 0.18, 1.48]}
        position={[0, 0, -2.12]}
        radius={0.12}
        color={PALETTE.ivory}
        edgeOpacity={0.18}
        shininess={30}
      />
      <FacetedCylinder
        radius={0.12}
        height={1}
        segments={12}
        position={[0, 0.43, -2.15]}
        rotation={[0, 0, Math.PI / 2]}
        color={PALETTE.graphite}
        edgeOpacity={0.08}
      />
      {[-0.88, 0.88].map((x) => (
        <BeveledBox
          key={`crt-foot-${x}`}
          size={[0.32, 0.06, 0.36]}
          position={[x, -0.115, -2.12]}
          radius={0.04}
          color={PALETTE.graphite}
          edgeOpacity={0}
        />
      ))}

      <BeveledBox
        size={[0.76, 0.1, 0.04]}
        position={[
          -1.62,
          controlY,
          screenZ + 0.012,
        ]}
        radius={0.025}
        color={PALETTE.cobalt}
        edgeOpacity={0.08}
      />
      <BeveledBox
        size={[0.48, 0.035, 0.018]}
        position={[
          -1.62,
          controlY,
          screenZ + 0.036,
        ]}
        radius={0.01}
        color={PALETTE.ivory}
        edgeOpacity={0}
        castShadow={false}
      />
      {[-0.56, -0.39, -0.22].map((x) => (
        <BeveledBox
          key={x}
          size={[0.085, 0.065, 0.035]}
          position={[
            x,
            controlY,
            screenZ + 0.018,
          ]}
          radius={0.015}
          color={PALETTE.teal}
          edgeOpacity={0}
          castShadow={false}
        />
      ))}
      <FacetedCylinder
        radius={0.09}
        height={0.04}
        segments={14}
        position={[
          0.3,
          controlY,
          screenZ + 0.024,
        ]}
        rotation={[Math.PI / 2, 0, 0]}
        color={PALETTE.coral}
        edgeOpacity={0.05}
        castShadow={false}
      />
      <FacetedCylinder
        radius={0.12}
        height={0.04}
        segments={14}
        position={[
          0.66,
          controlY,
          screenZ + 0.024,
        ]}
        rotation={[Math.PI / 2, 0, 0]}
        color={PALETTE.graphite}
        edgeOpacity={0.06}
        castShadow={false}
      />
      <FacetedCylinder
        radius={0.032}
        height={0.025}
        segments={10}
        position={[
          0.91,
          controlY,
          screenZ + 0.03,
        ]}
        rotation={[Math.PI / 2, 0, 0]}
        color={PALETTE.lime}
        edgeOpacity={0}
        castShadow={false}
      />

      {Array.from({ length: 7 }, (_, index) => (
        <BeveledBox
          key={`top-vent-${index}`}
          size={[0.08, 0.025, 0.72]}
          position={[
            (index - 3) * 0.22,
            topVentY,
            screenZ - 0.95,
          ]}
          radius={0.012}
          color={PALETTE.graphite}
          edgeOpacity={0}
          castShadow={false}
        />
      ))}
      {Array.from({ length: 5 }, (_, index) => (
        <BeveledBox
          key={`side-vent-${index}`}
          size={[0.025, 0.11, 0.62]}
          position={[
            screenWidth / 2 + 0.445,
            centerY + (index - 2) * 0.23,
            screenZ - 0.82,
          ]}
          radius={0.01}
          color={PALETTE.graphite}
          edgeOpacity={0}
          castShadow={false}
        />
      ))}
    </group>
  );
}

function buildKeyRow(
  widths,
  z,
  offset = 0,
) {
  const gap = 0.055;
  const total =
    widths.reduce((sum, width) => sum + width, 0) +
    gap * (widths.length - 1);
  let cursor = -total / 2 + offset;

  return widths.map((width, index) => {
    const x = cursor + width / 2;
    cursor += width + gap;
    return {
      width,
      x,
      z,
      color:
        width > 0.35
          ? PALETTE.ivory
          : KEY_SPECTRUM[
              Math.round(
                (index / Math.max(widths.length - 1, 1)) *
                  (KEY_SPECTRUM.length - 1),
              )
            ],
    };
  });
}

function InstancedKeycaps() {
  const meshRefs = useRef(new Map());
  const geometry = useMemo(
    () => new RoundedBoxGeometry(1, 0.085, 0.235, 2, 0.025),
    [],
  );
  const keys = useMemo(
    () => [
      ...buildKeyRow(Array(13).fill(0.26), -0.51),
      ...buildKeyRow(
        [0.4, ...Array(10).fill(0.27), 0.46],
        -0.18,
        0.025,
      ),
      ...buildKeyRow(
        [0.5, ...Array(9).fill(0.28), 0.63],
        0.15,
        0.06,
      ),
      ...buildKeyRow(
        [0.42, 0.32, 0.32, 1.72, 0.32, 0.32, 0.5],
        0.48,
        0,
      ),
    ],
    [],
  );
  const groups = useMemo(
    () =>
      Object.entries(
        keys.reduce((result, key) => {
          if (!result[key.color]) result[key.color] = [];
          result[key.color].push(key);
          return result;
        }, {}),
      ),
    [keys],
  );
  const materials = useMemo(
    () =>
      new Map(
        groups.map(([color]) => [
          color,
          new THREE.MeshPhongMaterial({
            color,
            emissive: PALETTE.shadow,
            emissiveIntensity: 0.025,
            specular: PALETTE.glow,
            shininess: 52,
            dithering: true,
          }),
        ]),
      ),
    [groups],
  );

  useLayoutEffect(() => {
    const matrix = new THREE.Matrix4();
    const position = new THREE.Vector3();
    const quaternion = new THREE.Quaternion();
    const scale = new THREE.Vector3();

    groups.forEach(([color, colorKeys]) => {
      const mesh = meshRefs.current.get(color);
      if (!mesh) return;
      colorKeys.forEach((key, index) => {
        position.set(key.x, 0.145, key.z);
        scale.set(key.width, 1, 1);
        matrix.compose(position, quaternion, scale);
        mesh.setMatrixAt(index, matrix);
      });
      mesh.instanceMatrix.needsUpdate = true;
      mesh.computeBoundingSphere();
    });
  }, [groups]);

  useLayoutEffect(
    () => () => {
      geometry.dispose();
      materials.forEach((material) => material.dispose());
    },
    [geometry, materials],
  );

  return groups.map(([color, colorKeys]) => (
    <instancedMesh
      key={color}
      ref={(mesh) => {
        if (mesh) meshRefs.current.set(color, mesh);
        else meshRefs.current.delete(color);
      }}
      args={[geometry, materials.get(color), colorKeys.length]}
      castShadow
      receiveShadow
    />
  ));
}

function Keyboard() {
  return (
    <group position={[0, 0.12, 1.38]} rotation={[-0.045, 0, 0]}>
      <BeveledBox
        size={[4.75, 0.2, 1.58]}
        color={PALETTE.plum}
        edgeOpacity={0.2}
        radius={0.12}
        shininess={28}
      />
      <InstancedKeycaps />
      <BeveledBox
        size={[0.42, 0.045, 0.12]}
        position={[1.87, 0.15, 0.48]}
        radius={0.02}
        color={PALETTE.teal}
        edgeOpacity={0}
      />
    </group>
  );
}

function Mouse() {
  return (
    <group position={[2.95, 0.16, 1.28]} rotation={[0, -0.12, 0]}>
      <BeveledBox
        size={[1.55, 0.035, 1.85]}
        position={[0, -0.055, 0.08]}
        radius={0.13}
        color={PALETTE.shadow}
        edgeOpacity={0.1}
        shininess={18}
      />
      <LowPolySphere
        radius={1}
        scale={[0.43, 0.24, 0.64]}
        position={[0, 0.08, 0]}
        color={PALETTE.cobalt}
        widthSegments={16}
        heightSegments={10}
        shininess={82}
      />
      {[-0.19, 0.19].map((x) => (
        <BeveledBox
          key={x}
          size={[0.34, 0.04, 0.49]}
          position={[x, 0.265, -0.23]}
          radius={0.055}
          color={PALETTE.ivory}
          edgeOpacity={0.13}
        />
      ))}
      <FacetedCylinder
        radius={0.065}
        height={0.14}
        segments={10}
        position={[0, 0.31, -0.08]}
        rotation={[0, 0, Math.PI / 2]}
        color={PALETTE.coral}
        edgeOpacity={0.08}
      />
    </group>
  );
}

function DesktopSpeakers({ screenWidth }) {
  const speakerX = screenWidth / 2 + 0.78;

  return [-speakerX, speakerX].map((x) => (
    <group key={x} position={[x, 0.48, -1.48]}>
      <BeveledBox
        size={[0.66, 1.08, 0.7]}
        radius={0.1}
        color={PALETTE.violet}
        edgeOpacity={0.1}
        shininess={32}
      />
      <FacetedCylinder
        radius={0.22}
        height={0.055}
        segments={14}
        position={[0, 0.12, 0.365]}
        rotation={[Math.PI / 2, 0, 0]}
        color={PALETTE.teal}
        edgeOpacity={0.06}
      >
        <FacetedCylinder
          radius={0.08}
          height={0.018}
          segments={12}
          position={[0, 0.036, 0]}
          color={PALETTE.graphite}
          edgeOpacity={0}
        />
      </FacetedCylinder>
      <FacetedCylinder
        radius={0.085}
        height={0.04}
        segments={12}
        position={[0, 0.39, 0.365]}
        rotation={[Math.PI / 2, 0, 0]}
        color={PALETTE.yellow}
        edgeOpacity={0.03}
      />
      <FacetedCylinder
        radius={0.025}
        height={0.02}
        segments={8}
        position={[0.22, -0.39, 0.372]}
        rotation={[Math.PI / 2, 0, 0]}
        color={PALETTE.lime}
        edgeOpacity={0}
      />
    </group>
  ));
}

function ComputerTower() {
  const screwPositions = [
    [-0.59, 1.16],
    [0.59, 1.16],
    [-0.59, -1.16],
    [0.59, -1.16],
  ];

  return (
    <group position={[-4.18, 1.22, -1.16]}>
      <BeveledBox
        size={[1.5, 2.8, 2.12]}
        radius={0.12}
        color={PALETTE.cobalt}
        edgeOpacity={0.24}
        shininess={38}
      />
      <BeveledBox
        size={[1.28, 2.52, 0.07]}
        position={[0, 0, 1.075]}
        radius={0.035}
        color={PALETTE.graphite}
        edgeOpacity={0.14}
      />
      <BeveledBox
        size={[1.06, 0.3, 0.06]}
        position={[0, 0.86, 1.112]}
        radius={0.035}
        color={PALETTE.ivory}
        edgeOpacity={0.08}
      />
      <BeveledBox
        size={[0.82, 0.055, 0.025]}
        position={[-0.07, 0.87, 1.151]}
        radius={0.014}
        color={PALETTE.shadow}
        edgeOpacity={0}
      />
      <FacetedCylinder
        radius={0.028}
        height={0.02}
        segments={8}
        position={[0.43, 0.87, 1.151]}
        rotation={[Math.PI / 2, 0, 0]}
        color={PALETTE.lime}
        edgeOpacity={0}
      />
      <BeveledBox
        size={[0.92, 0.23, 0.06]}
        position={[0, 0.46, 1.112]}
        radius={0.03}
        color={PALETTE.ivory}
        edgeOpacity={0.07}
      />
      <BeveledBox
        size={[0.62, 0.035, 0.025]}
        position={[-0.08, 0.46, 1.151]}
        radius={0.01}
        color={PALETTE.shadow}
        edgeOpacity={0}
      />
      {[-0.2, -0.37, -0.54, -0.71].map((y) => (
        <BeveledBox
          key={y}
          size={[0.92, 0.055, 0.035]}
          position={[0, y, 1.135]}
          radius={0.018}
          color={PALETTE.teal}
          edgeOpacity={0}
        />
      ))}
      <FacetedCylinder
        radius={0.13}
        height={0.035}
        segments={14}
        position={[0.31, -1.03, 1.125]}
        rotation={[Math.PI / 2, 0, 0]}
        color={PALETTE.coral}
        edgeOpacity={0.08}
      />
      <BeveledBox
        size={[0.18, 0.07, 0.05]}
        position={[-0.25, -1.03, 1.125]}
        radius={0.018}
        color={PALETTE.yellow}
        edgeOpacity={0.08}
      />
      {screwPositions.map(([x, y]) => (
        <FacetedCylinder
          key={`${x}-${y}`}
          radius={0.027}
          height={0.018}
          segments={8}
          position={[x, y, -1.068]}
          rotation={[Math.PI / 2, 0, 0]}
          color={PALETTE.silver}
          edgeOpacity={0}
        />
      ))}
      {[-0.49, 0.49].map((x) => (
        <BeveledBox
          key={x}
          size={[0.22, 0.14, 1.64]}
          position={[x, -1.47, 0]}
          radius={0.04}
          color={PALETTE.shadow}
          edgeOpacity={0.1}
        />
      ))}
    </group>
  );
}

function PencilCup() {
  const pens = [
    { x: -0.13, z: 0.03, tilt: -0.08, height: 1.32 },
    { x: 0.02, z: -0.09, tilt: 0.045, height: 1.46 },
    { x: 0.15, z: 0.08, tilt: 0.09, height: 1.25 },
  ];

  return (
    <group position={[4.25, 0.05, -1.72]}>
      <FacetedCylinder
        radiusTop={0.48}
        radiusBottom={0.42}
        height={0.92}
        segments={12}
        position={[0, 0.36, 0]}
        color={PALETTE.orange}
        edgeOpacity={0.18}
      />
      <FacetedCylinder
        radius={0.39}
        height={0.025}
        segments={16}
        position={[0, 0.835, 0]}
        color={PALETTE.background}
        edgeOpacity={0.08}
      />
      {pens.map((pen, index) => (
        <group
          key={pen.x}
          position={[pen.x, 0.93, pen.z]}
          rotation={[0, 0, pen.tilt]}
        >
          <FacetedCylinder
            radius={0.035}
            height={pen.height}
            segments={6}
            color={
              [PALETTE.coral, PALETTE.teal, PALETTE.violet][index]
            }
            edgeOpacity={0.08}
          />
          <mesh position={[0, pen.height / 2 + 0.075, 0]} castShadow>
            <coneGeometry args={[0.05, 0.15, 6]} />
            <meshPhongMaterial
              color={PALETTE.ivory}
              emissive={PALETTE.shadow}
              specular={PALETTE.glow}
              shininess={42}
              flatShading
              toneMapped={false}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function EnergyCan() {
  return (
    <group position={[-3.1, 0.44, 1.34]}>
      <FacetedCylinder
        radiusTop={0.3}
        radiusBottom={0.29}
        height={1.08}
        segments={18}
        color="#7b87a0"
        edgeColor="#d7dce8"
        edgeOpacity={0.24}
        shininess={92}
      />
      <PolygonPlane
        points={[
          [-0.13, -0.43],
          [0.01, -0.5],
          [0.13, 0.43],
          [-0.01, 0.5],
        ]}
        position={[-0.09, 0, 0.302]}
        color="#274d8f"
      />
      <PolygonPlane
        points={[
          [-0.13, -0.43],
          [0.01, -0.5],
          [0.13, 0.43],
          [-0.01, 0.5],
        ]}
        position={[0.1, 0, 0.303]}
        rotation={[0, 0, Math.PI]}
        color="#b9c1d0"
      />
      <FacetedCylinder
        radius={0.12}
        height={0.025}
        segments={14}
        position={[0, 0.03, 0.318]}
        rotation={[Math.PI / 2, 0, 0]}
        color="#d6a52a"
        edgeOpacity={0}
      />
      <FacetedCylinder
        radius={0.305}
        height={0.045}
        segments={18}
        position={[0, 0.535, 0]}
        color="#cad0dc"
        edgeOpacity={0.16}
      >
        <TorusForm
          radius={0.08}
          tube={0.018}
          position={[0, 0.027, 0.025]}
          rotation={[Math.PI / 2, 0, 0]}
          color="#7a8291"
          edgeOpacity={0.04}
        />
      </FacetedCylinder>
    </group>
  );
}

function OfficeChair() {
  return (
    <group position={[0, -0.4, 4.78]}>
      <BeveledBox
        size={[2.35, 0.3, 1.72]}
        radius={0.2}
        color="#9e456d"
        edgeOpacity={0.2}
        shininess={24}
      />
      <BeveledBox
        size={[2.24, 1.48, 0.3]}
        position={[0, 0.73, 0.94]}
        rotation={[-0.08, 0, 0]}
        radius={0.18}
        color="#9e456d"
        edgeOpacity={0.2}
        shininess={24}
      />
      {[-1.16, 1.16].map((x) => (
        <group key={x}>
          <BeveledBox
            size={[0.12, 0.66, 0.12]}
            position={[x, 0.33, 0.2]}
            radius={0.04}
            color={PALETTE.graphite}
            edgeOpacity={0.08}
          />
          <BeveledBox
            size={[0.18, 0.12, 1.02]}
            position={[x, 0.68, 0.02]}
            radius={0.06}
            color={PALETTE.deep}
            edgeOpacity={0.1}
          />
        </group>
      ))}
      <FacetedCylinder
        radius={0.13}
        height={1.3}
        segments={12}
        position={[0, -0.78, 0]}
        color={PALETTE.graphite}
        edgeOpacity={0.12}
      />
      <FacetedCylinder
        radius={0.28}
        height={0.12}
        segments={14}
        position={[0, -1.4, 0]}
        color={PALETTE.deep}
        edgeOpacity={0.12}
      />
      {Array.from({ length: 5 }, (_, index) => {
        const angle = (index / 5) * Math.PI * 2;
        return (
          <group
            key={angle}
            rotation={[0, angle, 0]}
            position={[0, -1.43, 0]}
          >
            <BeveledBox
              size={[0.12, 0.09, 1.18]}
              position={[0, 0, 0.48]}
              radius={0.04}
              color={PALETTE.graphite}
              edgeOpacity={0.1}
            />
            <FacetedCylinder
              radius={0.1}
              height={0.08}
              segments={10}
              position={[0, -0.08, 1.05]}
              rotation={[0, 0, Math.PI / 2]}
              color={PALETTE.shadow}
              edgeOpacity={0.08}
            />
          </group>
        );
      })}
    </group>
  );
}

function RetroRoom({ compact }) {
  return (
    <group>
      <BeveledBox
        size={[24, 9.75, 0.22]}
        position={[0, 1.7, -6.2]}
        radius={0.06}
        segments={2}
        color="#b77a72"
        edgeOpacity={0.04}
        shininess={10}
        castShadow={false}
      />
      <BeveledBox
        size={[23.85, 2.65, 0.1]}
        position={[0, -1.78, -6.065]}
        radius={0.035}
        color="#586a8e"
        edgeOpacity={0.03}
        shininess={12}
        castShadow={false}
      />
      <BeveledBox
        size={[24, 0.14, 0.12]}
        position={[0, -0.42, -5.99]}
        radius={0.025}
        color={PALETTE.ivory}
        edgeOpacity={0.04}
        castShadow={false}
      />
      <BeveledBox
        size={[24, 0.24, 0.16]}
        position={[0, -3, -5.95]}
        radius={0.035}
        color={PALETTE.ivory}
        edgeOpacity={0.04}
        castShadow={false}
      />
      {[-10, -7.5, -5, -2.5, 0, 2.5, 5, 7.5, 10].map(
        (x) => (
          <BeveledBox
            key={`wall-panel-${x}`}
            size={[0.065, 2.45, 0.055]}
            position={[x, -1.76, -5.975]}
            radius={0.015}
            color="#7181a1"
            edgeOpacity={0}
            castShadow={false}
          />
        ),
      )}

      {Array.from({ length: 13 }, (_, index) => (
        <BeveledBox
          key={`floorboard-${index}`}
          size={[22.5, 0.08, 1.1]}
          position={[0, -3.095, -5.55 + index * 1.13]}
          radius={0.018}
          color={index % 2 === 0 ? "#795363" : "#68475a"}
          edgeColor="#3b2a45"
          edgeOpacity={0.04}
          shininess={16}
          castShadow={false}
        />
      ))}
      <BeveledBox
        size={[6.4, 0.045, 3.8]}
        position={[0, -3.025, 4.45]}
        radius={0.24}
        color="#9b5d70"
        edgeOpacity={0.04}
        shininess={10}
        castShadow={false}
      />
      <BeveledBox
        size={[5.76, 0.024, 3.16]}
        position={[0, -2.995, 4.45]}
        radius={0.19}
        color="#d09363"
        edgeOpacity={0.05}
        shininess={8}
        castShadow={false}
      />
      <BeveledBox
        size={[5.08, 0.018, 2.5]}
        position={[0, -2.976, 4.45]}
        radius={0.15}
        color={PALETTE.darkTeal}
        edgeOpacity={0.04}
        shininess={8}
        castShadow={false}
      />

      <group position={[4.35, 2.5, -5.88]}>
        <BeveledBox
          size={[3.1, 3.35, 0.2]}
          radius={0.11}
          color={PALETTE.ivory}
          edgeOpacity={0.08}
          shininess={28}
          castShadow={false}
        />
        <BeveledBox
          size={[2.72, 2.97, 0.055]}
          position={[0, 0, 0.125]}
          radius={0.055}
          color={PALETTE.cobalt}
          edgeOpacity={0}
          castShadow={false}
        />
        <BeveledBox
          size={[2.54, 1.35, 0.025]}
          position={[0, 0.68, 0.165]}
          radius={0.025}
          color={PALETTE.violet}
          edgeOpacity={0}
          castShadow={false}
        />
        <BeveledBox
          size={[2.54, 1.35, 0.025]}
          position={[0, -0.68, 0.165]}
          radius={0.025}
          color={PALETTE.coral}
          edgeOpacity={0}
          castShadow={false}
        />
        <FacetedCylinder
          radius={0.42}
          height={0.025}
          segments={18}
          position={[0.35, -0.38, 0.205]}
          rotation={[Math.PI / 2, 0, 0]}
          color={PALETTE.yellow}
          edgeOpacity={0.03}
          castShadow={false}
        />
        <BeveledBox
          size={[0.1, 3.02, 0.06]}
          position={[0, 0, 0.22]}
          radius={0.02}
          color={PALETTE.ivory}
          edgeOpacity={0}
          castShadow={false}
        />
        <BeveledBox
          size={[2.78, 0.1, 0.06]}
          position={[0, 0, 0.22]}
          radius={0.02}
          color={PALETTE.ivory}
          edgeOpacity={0}
          castShadow={false}
        />
        <BeveledBox
          size={[0.46, 3.68, 0.24]}
          position={[-1.72, 0, 0.04]}
          radius={0.15}
          color={PALETTE.magenta}
          edgeOpacity={0.04}
          shininess={18}
          castShadow={false}
        />
        <BeveledBox
          size={[0.46, 3.68, 0.24]}
          position={[1.72, 0, 0.04]}
          radius={0.15}
          color={PALETTE.orange}
          edgeOpacity={0.04}
          shininess={18}
          castShadow={false}
        />
        <BeveledBox
          size={[3.86, 0.25, 0.22]}
          position={[0, 1.82, 0.03]}
          radius={0.08}
          color={PALETTE.graphite}
          edgeOpacity={0.06}
          castShadow={false}
        />
      </group>

      <group position={[0, 5.05, -5.9]}>
        <BeveledBox
          size={[3.45, 1.2, 0.18]}
          radius={0.08}
          color={PALETTE.ivory}
          edgeOpacity={0.07}
          castShadow={false}
        />
        <BeveledBox
          size={[3.12, 0.87, 0.04]}
          position={[0, 0, 0.115]}
          radius={0.045}
          color={PALETTE.plum}
          edgeOpacity={0}
          castShadow={false}
        />
        {[
          [-1.03, PALETTE.coral, 0.46],
          [-0.42, PALETTE.orange, 0.62],
          [0.22, PALETTE.teal, 0.42],
          [0.83, PALETTE.violet, 0.66],
          [1.24, PALETTE.yellow, 0.32],
        ].map(([x, color, height]) => (
          <BeveledBox
            key={`wall-print-${x}`}
            size={[0.4, height, 0.025]}
            position={[x, 0, 0.15]}
            radius={0.05}
            color={color}
            edgeOpacity={0}
            castShadow={false}
          />
        ))}
      </group>

      {!compact && (
        <>
          <group position={[-4.4, 3.55, -5.78]}>
            <BeveledBox
              size={[3, 0.18, 0.72]}
              radius={0.055}
              color={PALETTE.darkTeal}
              edgeOpacity={0.08}
              shininess={22}
              castShadow={false}
            />
            {ROOM_BOOK_COLORS.map((color, index) => (
              <BeveledBox
                key={`shelf-book-${color}`}
                size={[
                  0.34 + (index % 2) * 0.08,
                  0.9 + (index % 3) * 0.15,
                  0.42,
                ]}
                position={[
                  -0.96 + index * 0.48,
                  0.55 + (index % 3) * 0.075,
                  0.02,
                ]}
                rotation={[0, 0, index === 4 ? -0.1 : 0]}
                radius={0.035}
                color={color}
                edgeOpacity={0.05}
                shininess={16}
                castShadow={false}
              />
            ))}
            <BeveledBox
              size={[0.14, 1.1, 0.14]}
              position={[-1.08, -0.58, -0.12]}
              radius={0.03}
              color={PALETTE.graphite}
              edgeOpacity={0.03}
              castShadow={false}
            />
            <BeveledBox
              size={[0.14, 1.1, 0.14]}
              position={[1.08, -0.58, -0.12]}
              radius={0.03}
              color={PALETTE.graphite}
              edgeOpacity={0.03}
              castShadow={false}
            />
          </group>

          <group position={[-5.55, -3.03, -4.78]}>
            <FacetedCylinder
              radiusTop={0.48}
              radiusBottom={0.36}
              height={0.78}
              segments={12}
              position={[0, 0.39, 0]}
              color={PALETTE.orange}
              edgeOpacity={0.08}
              shininess={26}
            />
            <LowPolySphere
              radius={0.58}
              scale={[0.8, 1.25, 0.8]}
              position={[-0.24, 1.15, 0]}
              rotation={[0.1, 0, -0.28]}
              color={PALETTE.teal}
              widthSegments={9}
              heightSegments={6}
              shininess={18}
            />
            <LowPolySphere
              radius={0.56}
              scale={[0.78, 1.18, 0.78]}
              position={[0.22, 1.08, 0.06]}
              rotation={[-0.08, 0, 0.3]}
              color={PALETTE.lime}
              widthSegments={9}
              heightSegments={6}
              shininess={18}
            />
            <LowPolySphere
              radius={0.48}
              scale={[0.78, 1.12, 0.78]}
              position={[0, 1.45, -0.08]}
              color={PALETTE.cyan}
              widthSegments={9}
              heightSegments={6}
              shininess={18}
            />
          </group>
        </>
      )}

      <pointLight
        color="#ffd19a"
        intensity={1.8}
        distance={9}
        decay={2}
        position={[4.6, 3.8, -4.65]}
      />
    </group>
  );
}

function DeskStructure() {
  return (
    <>
      <BeveledBox
        size={[11.8, 0.3, 7.3]}
        position={[0, -0.25, 0]}
        radius={0.1}
        color={PALETTE.darkTeal}
        edgeOpacity={0.2}
        shininess={28}
      />
      <BeveledBox
        size={[11.35, 0.18, 0.22]}
        position={[0, -0.48, 3.43]}
        radius={0.05}
        color={PALETTE.graphite}
        edgeOpacity={0.08}
      />
      {[
        [-5.25, -1.72, -2.9],
        [5.25, -1.72, -2.9],
        [-5.25, -1.72, 2.9],
        [5.25, -1.72, 2.9],
      ].map((position) => (
        <BeveledBox
          key={position.join("-")}
          size={[0.38, 2.82, 0.38]}
          position={position}
          radius={0.07}
          color={PALETTE.graphite}
          edgeOpacity={0.12}
          shininess={22}
        />
      ))}
      <BeveledBox
        size={[2.25, 2.55, 2.05]}
        position={[4.15, -1.7, -1.62]}
        radius={0.11}
        color={PALETTE.graphite}
        edgeOpacity={0.12}
        shininess={20}
      />
      {[-0.95, -1.7, -2.45].map((y) => (
        <BeveledBox
          key={y}
          size={[1.94, 0.56, 0.08]}
          position={[4.15, y, -0.55]}
          radius={0.035}
          color={PALETTE.cobalt}
          edgeOpacity={0.1}
        >
          <BeveledBox
            size={[0.46, 0.06, 0.06]}
            position={[0, 0, 0.055]}
            radius={0.02}
            color={PALETTE.yellow}
            edgeOpacity={0}
          />
        </BeveledBox>
      ))}
    </>
  );
}

export default function DesktopEnvironment({
  compact = false,
  display,
}) {
  const environmentRef = useRef(null);
  const showSpeakers = display.screenWidth <= 4.62;
  const mouseCable = useMemo(
    () => [
      [3.0, 0.34, 0.7],
      [3.1, 0.26, 0.15],
      [2.78, 0.24, -0.45],
      [2.3, 0.2, -1.2],
    ],
    [],
  );
  const monitorCable = useMemo(
    () => [
      [1.35, 0.16, -1.85],
      [2.2, 0.1, -1.65],
      [3.25, 0.04, -2.15],
      [4.5, -0.05, -2.72],
    ],
    [],
  );

  useLayoutEffect(() => {
    const environment = environmentRef.current;
    if (!environment) return;

    environment.traverse((object) => {
      object.matrixAutoUpdate = true;
      object.matrixWorldAutoUpdate = true;
    });
    environment.updateMatrixWorld(true);
    environment.traverse((object) => {
      object.matrixAutoUpdate = false;
      object.matrixWorldAutoUpdate = false;
    });
  }, [display]);

  return (
    <group ref={environmentRef}>
      <RetroRoom compact={compact} />
      <DeskStructure />
      <WorkstationMonitor display={display} />
      {!compact && showSpeakers && (
        <DesktopSpeakers screenWidth={display.screenWidth} />
      )}
      <Keyboard />
      <Mouse />
      <CableTube
        points={mouseCable}
        radius={0.022}
        color={PALETTE.graphite}
      />

      {!compact && (
        <>
          <ComputerTower />
          <PencilCup />
          <EnergyCan />
          <OfficeChair />
          <CableTube
            points={monitorCable}
            radius={0.03}
            color={PALETTE.graphite}
          />
          <BeveledBox
            size={[1.15, 0.045, 0.9]}
            position={[-1.9, -0.055, -0.42]}
            rotation={[0, 0.16, 0]}
            radius={0.045}
            color={PALETTE.lime}
            edgeOpacity={0.1}
          />
          <BeveledBox
            size={[0.42, 0.05, 0.42]}
            position={[-1.76, -0.015, -0.28]}
            rotation={[0, 0.12, 0]}
            radius={0.035}
            color={PALETTE.yellow}
            edgeOpacity={0.08}
          />
        </>
      )}
    </group>
  );
}
