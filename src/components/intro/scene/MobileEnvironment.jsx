import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import {
  BeveledBox,
  FacetedCylinder,
  PALETTE,
  TorusForm,
} from "./SceneKit";

export const PHONE_SCALE = 0.31;
export const PHONE_BASE_Y = -0.005;
const REFERENCE_SCREEN_WIDTH = 2.28;
const REFERENCE_SCREEN_HEIGHT = 4.56;
const SCREEN_AREA =
  REFERENCE_SCREEN_WIDTH * REFERENCE_SCREEN_HEIGHT;
const BEZEL_SCALE = 4.76 / REFERENCE_SCREEN_HEIGHT;
const BODY_SCALE = 5.18 / REFERENCE_SCREEN_HEIGHT;

export function getMobileDisplayMetrics(viewportAspect) {
  const aspect =
    Number.isFinite(viewportAspect) && viewportAspect > 0
      ? viewportAspect
      : 9 / 19.5;
  const landscape = aspect > 1;
  const localAspect = landscape ? 1 / aspect : aspect;
  let localScreenWidth = Math.sqrt(SCREEN_AREA * localAspect);
  let localScreenHeight = localScreenWidth / localAspect;
  const fitScale = Math.min(
    1,
    4.8 / localScreenWidth,
    5.2 / localScreenHeight,
  );
  localScreenWidth *= fitScale;
  localScreenHeight *= fitScale;

  const localBezelWidth = localScreenWidth * BEZEL_SCALE;
  const localBezelHeight = localScreenHeight * BEZEL_SCALE;
  const localBodyWidth = localScreenWidth * BODY_SCALE;
  const localBodyHeight = localScreenHeight * BODY_SCALE;
  const projectedScreenWidth =
    (landscape ? localScreenHeight : localScreenWidth) *
    PHONE_SCALE;
  const projectedScreenHeight =
    (landscape ? localScreenWidth : localScreenHeight) *
    PHONE_SCALE;
  const projectedBezelWidth =
    (landscape ? localBezelHeight : localBezelWidth) *
    PHONE_SCALE;
  const projectedBezelHeight =
    (landscape ? localBezelWidth : localBezelHeight) *
    PHONE_SCALE;

  return Object.freeze({
    aspect,
    landscape,
    localBezelHeight,
    localBezelWidth,
    localBodyHeight,
    localBodyWidth,
    localScreenHeight,
    localScreenWidth,
    projectedBezelHeight,
    projectedBezelWidth,
    projectedScreenHeight,
    projectedScreenWidth,
    rotationY: Math.PI + (landscape ? Math.PI / 2 : 0),
    bezelSurfaceY:
      PHONE_BASE_Y + (0.115 + 0.08 / 2) * PHONE_SCALE,
    screenY: PHONE_BASE_Y + 0.142 * PHONE_SCALE,
  });
}

const MOBILE_COLORS = Object.freeze({
  sofa: "#b94f5c",
  sofaShadow: "#994454",
  sofaWarm: "#c36a52",
  table: "#55417e",
  rug: "#275e64",
  book: "#6e9f5b",
  mug: "#3b9f96",
});

function Sofa() {
  return (
    <group position={[0, 0, -4.28]}>
      <BeveledBox
        size={[6.3, 0.72, 2.18]}
        position={[0, -0.08, 0]}
        radius={0.25}
        segments={3}
        color={MOBILE_COLORS.sofa}
        edgeOpacity={0.04}
        shininess={18}
      />
      <BeveledBox
        size={[6.14, 1.38, 0.46]}
        position={[0, 0.54, -1.01]}
        rotation={[-0.05, 0, 0]}
        radius={0.2}
        segments={3}
        color={MOBILE_COLORS.sofaShadow}
        edgeOpacity={0.05}
        shininess={16}
      />
      {[-2.88, 2.88].map((x) => (
        <BeveledBox
          key={x}
          size={[0.52, 1.02, 2.14]}
          position={[x, 0.24, 0]}
          radius={0.2}
          segments={3}
          color={MOBILE_COLORS.sofa}
          edgeOpacity={0.04}
          shininess={16}
        />
      ))}
      {[-1.88, 0, 1.88].map((x, index) => (
        <group key={x}>
          <BeveledBox
            size={[1.72, 0.34, 1.62]}
            position={[x, 0.46, 0.16]}
            radius={0.18}
            segments={3}
            color={
              [
                MOBILE_COLORS.sofa,
                MOBILE_COLORS.sofaWarm,
                MOBILE_COLORS.sofa,
              ][index]
            }
            edgeOpacity={0.04}
            shininess={14}
          />
          <BeveledBox
            size={[1.7, 1.04, 0.3]}
            position={[x, 0.74, -0.79]}
            rotation={[-0.08, 0, 0]}
            radius={0.18}
            segments={3}
            color={
              [
                MOBILE_COLORS.sofaShadow,
                MOBILE_COLORS.sofa,
                MOBILE_COLORS.sofaShadow,
              ][index]
            }
            edgeOpacity={0.04}
            shininess={14}
          />
        </group>
      ))}
      <BeveledBox
        size={[1.2, 0.22, 1.08]}
        position={[-1.77, 0.72, 0.08]}
        rotation={[0.04, 0.38, -0.06]}
        radius={0.18}
        segments={3}
        color={PALETTE.yellow}
        edgeOpacity={0.04}
        shininess={16}
      />
      {[-2.56, 2.56].map((x) =>
        [-0.72, 0.72].map((z) => (
          <BeveledBox
            key={`${x}-${z}`}
            size={[0.3, 0.48, 0.3]}
            position={[x, -0.58, z]}
            radius={0.055}
            color={PALETTE.graphite}
            edgeOpacity={0.03}
            shininess={20}
          />
        )),
      )}
    </group>
  );
}

function CoffeeTable() {
  return (
    <group>
      <BeveledBox
        size={[5.65, 0.28, 5.36]}
        position={[0, -0.18, 0.34]}
        radius={0.18}
        segments={3}
        color={MOBILE_COLORS.table}
        edgeOpacity={0.07}
        shininess={36}
      />
      <BeveledBox
        size={[5.24, 0.13, 4.96]}
        position={[0, -0.35, 0.34]}
        radius={0.12}
        color={PALETTE.graphite}
        edgeOpacity={0.03}
        shininess={20}
      />
      {[
        [-2.32, -0.43, -1.72],
        [2.32, -0.43, -1.72],
        [-2.32, -0.43, 2.36],
        [2.32, -0.43, 2.36],
      ].map((position) => (
        <BeveledBox
          key={position.join("-")}
          size={[0.34, 0.42, 0.34]}
          position={position}
          radius={0.06}
          color={PALETTE.graphite}
          edgeOpacity={0.03}
          shininess={22}
        />
      ))}
    </group>
  );
}

function CoffeeMug() {
  return (
    <group position={[1.72, -0.04, 1.38]}>
      <FacetedCylinder
        radiusTop={0.36}
        radiusBottom={0.3}
        height={0.66}
        segments={14}
        position={[0, 0.33, 0]}
        color={MOBILE_COLORS.mug}
        edgeOpacity={0.05}
        shininess={72}
      />
      <FacetedCylinder
        radius={0.295}
        height={0.022}
        segments={16}
        position={[0, 0.67, 0]}
        color={PALETTE.background}
        edgeOpacity={0}
        shininess={96}
      />
      <TorusForm
        radius={0.21}
        tube={0.055}
        position={[0.38, 0.35, 0]}
        color={MOBILE_COLORS.mug}
        radialSegments={7}
        tubularSegments={18}
        edgeOpacity={0.03}
      />
    </group>
  );
}

function TableReading() {
  return (
    <group position={[-1.82, -0.005, 1.55]} rotation={[0, 0.14, 0]}>
      <BeveledBox
        size={[1.26, 0.065, 1.62]}
        position={[0, 0, 0]}
        radius={0.045}
        color={MOBILE_COLORS.book}
        edgeOpacity={0.05}
        shininess={24}
      />
      <BeveledBox
        size={[1.1, 0.038, 1.45]}
        position={[0.08, 0.052, -0.05]}
        rotation={[0, -0.05, 0]}
        radius={0.04}
        color={PALETTE.ivory}
        edgeOpacity={0.03}
        shininess={22}
      />
      <BeveledBox
        size={[0.7, 0.018, 0.09]}
        position={[0.08, 0.078, -0.36]}
        color={PALETTE.coral}
        edgeOpacity={0}
        castShadow={false}
      />
      {[-0.16, 0.05, 0.26].map((z) => (
        <BeveledBox
          key={z}
          size={[0.82, 0.012, 0.04]}
          position={[0.08, 0.078, z]}
          color={PALETTE.graphite}
          edgeOpacity={0}
          castShadow={false}
        />
      ))}
    </group>
  );
}

function RemoteControl() {
  return (
    <group position={[1.58, 0.01, -1.42]} rotation={[0, -0.24, 0]}>
      <BeveledBox
        size={[0.48, 0.13, 1.35]}
        radius={0.11}
        color={PALETTE.cobalt}
        edgeOpacity={0.05}
        shininess={36}
      />
      <FacetedCylinder
        radius={0.105}
        height={0.035}
        segments={10}
        position={[0, 0.085, -0.38]}
        color={PALETTE.coral}
        edgeOpacity={0.02}
      />
      {[-0.05, 0.18, 0.4].map((z, index) => (
        <BeveledBox
          key={z}
          size={[0.22, 0.025, 0.1]}
          position={[0, 0.083, z]}
          radius={0.022}
          color={
            [PALETTE.yellow, PALETTE.teal, PALETTE.coral][index]
          }
          edgeOpacity={0}
        />
      ))}
    </group>
  );
}

function PhoneScreen({ display }) {
  const materialRef = useRef(null);
  const elapsedRef = useRef(0);
  const offColor = useMemo(() => new THREE.Color(PALETTE.background), []);
  const awakeColor = useMemo(() => new THREE.Color(PALETTE.deep), []);
  const {
    localScreenHeight,
    localScreenWidth,
  } = display;

  useFrame((_, delta) => {
    elapsedRef.current += delta;
    const progress = THREE.MathUtils.smootherstep(
      THREE.MathUtils.clamp((elapsedRef.current - 1.7) / 1.15, 0, 1),
      0,
      1,
    );
    materialRef.current?.color.lerpColors(
      offColor,
      awakeColor,
      progress,
    );
    if (materialRef.current) {
      materialRef.current.emissiveIntensity = progress * 0.18;
    }
  });

  return (
    <>
      <mesh
        position={[0, 0.142, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
      >
        <planeGeometry
          args={[localScreenWidth, localScreenHeight]}
        />
        <meshPhongMaterial
          ref={materialRef}
          color={PALETTE.background}
          emissive={PALETTE.cyan}
          emissiveIntensity={0}
          specular={PALETTE.glow}
          shininess={118}
          toneMapped={false}
        />
      </mesh>
      <mesh
        position={[
          -localScreenWidth * 0.149,
          0.146,
          -localScreenHeight * 0.035,
        ]}
        rotation={[-Math.PI / 2, 0, -0.09]}
      >
        <planeGeometry
          args={[
            localScreenWidth * 0.123,
            localScreenHeight * 0.866,
          ]}
        />
        <meshBasicMaterial
          color={PALETTE.glow}
          transparent
          opacity={0.025}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
    </>
  );
}

function OldSmartphone({ display }) {
  const {
    localBezelHeight,
    localBezelWidth,
    localBodyHeight,
    localBodyWidth,
    localScreenHeight,
    localScreenWidth,
    rotationY,
  } = display;
  const topControlZ = -localScreenHeight / 2 + 0.03;
  const homeControlZ = localScreenHeight / 2 - 0.03;

  return (
    <group
      position={[0, PHONE_BASE_Y, 0]}
      rotation={[0, rotationY, 0]}
      scale={PHONE_SCALE}
    >
      <BeveledBox
        size={[localBodyWidth, 0.24, localBodyHeight]}
        position={[0, 0.02, 0]}
        radius={0.24}
        segments={4}
        color={PALETTE.graphite}
        edgeOpacity={0.08}
        shininess={78}
      />
      <BeveledBox
        size={[localBezelWidth, 0.08, localBezelHeight]}
        position={[0, 0.115, 0]}
        radius={0.18}
        segments={3}
        color={PALETTE.cobalt}
        edgeOpacity={0.04}
        shininess={88}
      />
      <PhoneScreen display={display} />
      <BeveledBox
        size={[0.42, 0.025, 0.06]}
        position={[0, 0.158, topControlZ]}
        radius={0.018}
        color={PALETTE.silver}
        edgeOpacity={0}
        castShadow={false}
      />
      <FacetedCylinder
        radius={0.09}
        height={0.025}
        segments={12}
        position={[
          localScreenWidth * 0.21,
          0.159,
          topControlZ,
        ]}
        color={PALETTE.lime}
        edgeOpacity={0}
        castShadow={false}
      />
      <TorusForm
        radius={0.2}
        tube={0.035}
        position={[0, 0.16, homeControlZ]}
        rotation={[Math.PI / 2, 0, 0]}
        color={PALETTE.silver}
        edgeOpacity={0.02}
      />
      <BeveledBox
        size={[0.05, 0.08, 0.74]}
        position={[
          -localBodyWidth / 2 - 0.02,
          0.025,
          -localScreenHeight * 0.158,
        ]}
        radius={0.018}
        color={PALETTE.silver}
        edgeOpacity={0}
      />
      <BeveledBox
        size={[0.05, 0.08, 0.5]}
        position={[
          localBodyWidth / 2 + 0.02,
          0.025,
          -localScreenHeight * 0.092,
        ]}
        radius={0.018}
        color={PALETTE.silver}
        edgeOpacity={0}
      />
    </group>
  );
}

function LivingRoomFloor() {
  return (
    <>
      <BeveledBox
        size={[9.4, 0.16, 14.6]}
        position={[0, -0.62, 0]}
        radius={0.06}
        color={PALETTE.floor}
        edgeOpacity={0.02}
        shininess={16}
        castShadow={false}
      />
      <BeveledBox
        size={[6.92, 0.06, 7.35]}
        position={[0, -0.5, 0.42]}
        radius={0.2}
        segments={3}
        color={MOBILE_COLORS.rug}
        edgeOpacity={0.03}
        shininess={8}
        castShadow={false}
      />
      {[-2.1, -0.7, 0.7, 2.1].map((x, index) => (
        <BeveledBox
          key={x}
          size={[0.035, 0.012, 6.7]}
          position={[x, -0.46, 0.42]}
          radius={0.004}
          color={
            [
              PALETTE.coral,
              PALETTE.yellow,
              PALETTE.teal,
              PALETTE.blue,
            ][index]
          }
          edgeOpacity={0}
          castShadow={false}
        />
      ))}
    </>
  );
}

export default function MobileEnvironment({ display }) {
  return (
    <group>
      <LivingRoomFloor />
      <Sofa />
      <CoffeeTable />
      <TableReading />
      <RemoteControl />
      <CoffeeMug />
      <OldSmartphone display={display} />
    </group>
  );
}
