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

export const DESKTOP_MONITOR = {
  centerY: 2.05,
  screenWidth: 4.56,
  screenHeight: 2.51,
  screenZ: -1.39,
};

function ScreenCursor({ compact }) {
  const materialRef = useRef(null);

  useFrame(({ clock }) => {
    if (!materialRef.current) return;
    materialRef.current.opacity =
      Math.sin(clock.getElapsedTime() * Math.PI * 2) > -0.12
        ? 0.88
        : 0.08;
  });

  return (
    <mesh
      position={[
        compact ? -1.78 : -2.08,
        compact ? 2.84 : 3.14,
        DESKTOP_MONITOR.screenZ + 0.012,
      ]}
    >
      <planeGeometry args={[0.018, 0.12]} />
      <meshBasicMaterial
        ref={materialRef}
        color={PALETTE.highlight}
        transparent
        toneMapped={false}
      />
    </mesh>
  );
}

function WorkstationMonitor({ compact }) {
  const centerY = compact ? 1.85 : DESKTOP_MONITOR.centerY;
  const screenWidth = compact ? 4.15 : DESKTOP_MONITOR.screenWidth;
  const screenHeight = compact ? 2.38 : DESKTOP_MONITOR.screenHeight;

  return (
    <group>
      <BeveledBox
        size={[screenWidth + 0.72, screenHeight + 0.62, 0.94]}
        position={[0, centerY, -1.9]}
        radius={0.18}
        segments={3}
        color={PALETTE.body}
        edgeOpacity={0.2}
        shininess={66}
      />
      <BeveledBox
        size={[screenWidth + 0.2, screenHeight + 0.18, 0.13]}
        position={[0, centerY, DESKTOP_MONITOR.screenZ - 0.035]}
        radius={0.14}
        segments={3}
        color={PALETTE.deep}
        edgeOpacity={0.22}
        shininess={82}
      />
      <mesh position={[0, centerY, DESKTOP_MONITOR.screenZ + 0.036]}>
        <planeGeometry args={[screenWidth, screenHeight]} />
        <meshPhongMaterial
          color={PALETTE.background}
          emissive={PALETTE.background}
          specular={PALETTE.light}
          shininess={110}
          toneMapped={false}
        />
      </mesh>
      <mesh
        position={[-screenWidth * 0.16, centerY + 0.22, DESKTOP_MONITOR.screenZ + 0.04]}
        rotation={[0, 0, 0.12]}
      >
        <planeGeometry args={[screenWidth * 0.18, screenHeight * 0.92]} />
        <meshBasicMaterial
          color={PALETTE.highlight}
          transparent
          opacity={0.025}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
      <ScreenCursor compact={compact} />

      <FacetedCylinder
        radius={0.19}
        height={0.24}
        segments={14}
        position={[0, centerY - screenHeight * 0.64, -1.86]}
        rotation={[Math.PI / 2, 0, 0]}
        color={PALETTE.mid}
        edgeOpacity={0.16}
      />
      <BeveledBox
        size={[0.34, 1.1, 0.38]}
        position={[0, 0.69, -1.93]}
        radius={0.1}
        color={PALETTE.body}
        edgeOpacity={0.13}
      />
      <BeveledBox
        size={[1.85, 0.16, 0.94]}
        position={[0, 0.13, -1.66]}
        radius={0.1}
        color={PALETTE.deep}
        edgeOpacity={0.18}
      />

      {[-0.31, -0.17, -0.03].map((x) => (
        <BeveledBox
          key={x}
          size={[0.075, 0.06, 0.025]}
          position={[x, centerY - screenHeight / 2 - 0.18, DESKTOP_MONITOR.screenZ + 0.045]}
          radius={0.015}
          color={PALETTE.mid}
          edgeOpacity={0}
          castShadow={false}
        />
      ))}
      <FacetedCylinder
        radius={0.045}
        height={0.025}
        segments={12}
        position={[0.31, centerY - screenHeight / 2 - 0.18, DESKTOP_MONITOR.screenZ + 0.05]}
        rotation={[Math.PI / 2, 0, 0]}
        color={PALETTE.highlight}
        edgeOpacity={0}
        castShadow={false}
      />

      {[-0.31, -0.17, -0.03, 0.11, 0.25].map((x) => (
        <BeveledBox
          key={`vent-${x}`}
          size={[0.065, 0.5, 0.025]}
          position={[x + 1.55, centerY, -2.39]}
          radius={0.012}
          color={PALETTE.shadow}
          edgeOpacity={0}
        />
      ))}
    </group>
  );
}

function buildKeyRow(
  widths,
  z,
  offset = 0,
  shade = PALETTE.mid,
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
      color: index % 4 === 0 ? PALETTE.light : shade,
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
        PALETTE.body,
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
        PALETTE.body,
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
            specular: PALETTE.highlight,
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
        color={PALETTE.deep}
        edgeOpacity={0.2}
        radius={0.12}
        shininess={28}
      />
      <InstancedKeycaps />
      <BeveledBox
        size={[0.42, 0.045, 0.12]}
        position={[1.87, 0.15, 0.48]}
        radius={0.02}
        color={PALETTE.highlight}
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
        color={PALETTE.body}
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
          color={x < 0 ? PALETTE.light : PALETTE.mid}
          edgeOpacity={0.13}
        />
      ))}
      <FacetedCylinder
        radius={0.065}
        height={0.14}
        segments={10}
        position={[0, 0.31, -0.08]}
        rotation={[0, 0, Math.PI / 2]}
        color={PALETTE.highlight}
        edgeOpacity={0.08}
      />
    </group>
  );
}

function DesktopSpeakers() {
  return [-3.06, 3.06].map((x) => (
    <group key={x} position={[x, 0.48, -1.48]}>
      <BeveledBox
        size={[0.66, 1.08, 0.7]}
        radius={0.1}
        color={PALETTE.deep}
        edgeOpacity={0.1}
        shininess={32}
      />
      <FacetedCylinder
        radius={0.22}
        height={0.055}
        segments={14}
        position={[0, 0.12, 0.365]}
        rotation={[Math.PI / 2, 0, 0]}
        color={PALETTE.mid}
        edgeOpacity={0.06}
      >
        <FacetedCylinder
          radius={0.08}
          height={0.018}
          segments={12}
          position={[0, 0.036, 0]}
          color={PALETTE.shadow}
          edgeOpacity={0}
        />
      </FacetedCylinder>
      <FacetedCylinder
        radius={0.085}
        height={0.04}
        segments={12}
        position={[0, 0.39, 0.365]}
        rotation={[Math.PI / 2, 0, 0]}
        color={PALETTE.light}
        edgeOpacity={0.03}
      />
      <FacetedCylinder
        radius={0.025}
        height={0.02}
        segments={8}
        position={[0.22, -0.39, 0.372]}
        rotation={[Math.PI / 2, 0, 0]}
        color={PALETTE.highlight}
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
        color={PALETTE.deep}
        edgeOpacity={0.24}
        shininess={38}
      />
      <BeveledBox
        size={[1.28, 2.52, 0.07]}
        position={[0, 0, 1.075]}
        radius={0.035}
        color={PALETTE.shadow}
        edgeOpacity={0.14}
      />
      <BeveledBox
        size={[1.06, 0.3, 0.06]}
        position={[0, 0.86, 1.112]}
        radius={0.035}
        color={PALETTE.mid}
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
        color={PALETTE.highlight}
        edgeOpacity={0}
      />
      <BeveledBox
        size={[0.92, 0.23, 0.06]}
        position={[0, 0.46, 1.112]}
        radius={0.03}
        color={PALETTE.body}
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
          color={PALETTE.mid}
          edgeOpacity={0}
        />
      ))}
      <FacetedCylinder
        radius={0.13}
        height={0.035}
        segments={14}
        position={[0.31, -1.03, 1.125]}
        rotation={[Math.PI / 2, 0, 0]}
        color={PALETTE.highlight}
        edgeOpacity={0.08}
      />
      <BeveledBox
        size={[0.18, 0.07, 0.05]}
        position={[-0.25, -1.03, 1.125]}
        radius={0.018}
        color={PALETTE.light}
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
          color={PALETTE.light}
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
        color={PALETTE.mid}
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
            color={index === 1 ? PALETTE.highlight : PALETTE.light}
            edgeOpacity={0.08}
          />
          <mesh position={[0, pen.height / 2 + 0.075, 0]} castShadow>
            <coneGeometry args={[0.05, 0.15, 6]} />
            <meshPhongMaterial
              color={PALETTE.highlight}
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
        color={PALETTE.body}
        edgeOpacity={0.2}
        shininess={24}
      />
      <BeveledBox
        size={[2.24, 1.48, 0.3]}
        position={[0, 0.73, 0.94]}
        rotation={[-0.08, 0, 0]}
        radius={0.18}
        color={PALETTE.body}
        edgeOpacity={0.2}
        shininess={24}
      />
      {[-1.16, 1.16].map((x) => (
        <group key={x}>
          <BeveledBox
            size={[0.12, 0.66, 0.12]}
            position={[x, 0.33, 0.2]}
            radius={0.04}
            color={PALETTE.mid}
            edgeOpacity={0.08}
          />
          <BeveledBox
            size={[0.18, 0.12, 1.02]}
            position={[x, 0.68, 0.02]}
            radius={0.06}
            color={PALETTE.mid}
            edgeOpacity={0.1}
          />
        </group>
      ))}
      <FacetedCylinder
        radius={0.13}
        height={1.3}
        segments={12}
        position={[0, -0.78, 0]}
        color={PALETTE.mid}
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
              color={PALETTE.deep}
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

function DeskStructure() {
  return (
    <>
      <BeveledBox
        size={[11.8, 0.3, 7.3]}
        position={[0, -0.25, 0]}
        radius={0.1}
        color={PALETTE.deep}
        edgeOpacity={0.2}
        shininess={28}
      />
      <BeveledBox
        size={[11.35, 0.18, 0.22]}
        position={[0, -0.48, 3.43]}
        radius={0.05}
        color={PALETTE.shadow}
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
          color={PALETTE.shadow}
          edgeOpacity={0.12}
          shininess={22}
        />
      ))}
      <BeveledBox
        size={[2.25, 2.55, 2.05]}
        position={[4.15, -1.7, -1.62]}
        radius={0.11}
        color={PALETTE.shadow}
        edgeOpacity={0.12}
        shininess={20}
      />
      {[-0.95, -1.7, -2.45].map((y) => (
        <BeveledBox
          key={y}
          size={[1.94, 0.56, 0.08]}
          position={[4.15, y, -0.55]}
          radius={0.035}
          color={PALETTE.body}
          edgeOpacity={0.1}
        >
          <BeveledBox
            size={[0.46, 0.06, 0.06]}
            position={[0, 0, 0.055]}
            radius={0.02}
            color={PALETTE.light}
            edgeOpacity={0}
          />
        </BeveledBox>
      ))}
    </>
  );
}

export default function DesktopEnvironment({ compact = false }) {
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

  return (
    <group>
      <DeskStructure />
      <WorkstationMonitor compact={compact} />
      {!compact && <DesktopSpeakers />}
      <Keyboard />
      <Mouse />
      <CableTube points={mouseCable} radius={0.022} />

      {!compact && (
        <>
          <ComputerTower />
          <PencilCup />
          <EnergyCan />
          <OfficeChair />
          <CableTube
            points={monitorCable}
            radius={0.03}
            color={PALETTE.body}
          />
          <BeveledBox
            size={[1.15, 0.045, 0.9]}
            position={[-1.9, -0.055, -0.42]}
            rotation={[0, 0.16, 0]}
            radius={0.045}
            color={PALETTE.mid}
            edgeOpacity={0.1}
          />
          <BeveledBox
            size={[0.42, 0.05, 0.42]}
            position={[-1.76, -0.015, -0.28]}
            rotation={[0, 0.12, 0]}
            radius={0.035}
            color={PALETTE.light}
            edgeOpacity={0.08}
          />
        </>
      )}
    </group>
  );
}
