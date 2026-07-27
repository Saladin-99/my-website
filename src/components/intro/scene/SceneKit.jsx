import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";

export const PALETTE = {
  background: "#08050d",
  floor: "#100918",
  shadow: "#160c21",
  deep: "#21132f",
  body: "#38224b",
  mid: "#5d4777",
  light: "#907caf",
  highlight: "#cfc2ed",
  line: "#c4b5ff",
  glow: "#eee8ff",
};

const clampRadius = (size, requestedRadius) => {
  const shortestSide = Math.min(...size);
  return Math.min(requestedRadius, shortestSide * 0.46);
};

function ModelMaterial({
  color = PALETTE.body,
  emissive = PALETTE.shadow,
  emissiveIntensity = 0.025,
  shininess = 42,
  flatShading = false,
  transparent = false,
  opacity = 1,
}) {
  return (
    <meshPhongMaterial
      color={color}
      emissive={emissive}
      emissiveIntensity={emissiveIntensity}
      specular={PALETTE.highlight}
      shininess={shininess}
      flatShading={flatShading}
      transparent={transparent}
      opacity={opacity}
      dithering
    />
  );
}

export function BeveledBox({
  size,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  radius = 0.08,
  segments = 2,
  color = PALETTE.body,
  edgeColor = PALETTE.line,
  edgeOpacity = 0.04,
  shininess = 42,
  flatShading = false,
  castShadow = true,
  receiveShadow = true,
  children,
}) {
  const safeRadius = clampRadius(size, radius);
  const showEdges = edgeOpacity >= 0.06;
  const geometry = useMemo(
    () =>
      new RoundedBoxGeometry(
        size[0],
        size[1],
        size[2],
        segments,
        Math.max(safeRadius, 0.002),
      ),
    [safeRadius, segments, size],
  );
  const edges = useMemo(
    () => (showEdges ? new THREE.EdgesGeometry(geometry, 32) : null),
    [geometry, showEdges],
  );

  useEffect(
    () => () => {
      geometry.dispose();
      edges?.dispose();
    },
    [edges, geometry],
  );

  return (
    <group position={position} rotation={rotation}>
      <mesh
        geometry={geometry}
        castShadow={castShadow}
        receiveShadow={receiveShadow}
      >
        <ModelMaterial
          color={color}
          shininess={shininess}
          flatShading={flatShading}
        />
      </mesh>
      {edges && (
        <lineSegments geometry={edges} renderOrder={2}>
          <lineBasicMaterial
            color={edgeColor}
            transparent
            opacity={edgeOpacity * 0.55}
            depthWrite={false}
          />
        </lineSegments>
      )}
      {children}
    </group>
  );
}

export function FacetedCylinder({
  radius = 0.5,
  radiusTop = radius,
  radiusBottom = radius,
  height = 1,
  segments = 12,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  color = PALETTE.body,
  edgeColor = PALETTE.line,
  edgeOpacity = 0.04,
  shininess = 48,
  castShadow = true,
  receiveShadow = true,
  children,
}) {
  const geometry = useMemo(
    () =>
      new THREE.CylinderGeometry(
        radiusTop,
        radiusBottom,
        height,
        segments,
        1,
        false,
      ),
    [height, radiusBottom, radiusTop, segments],
  );
  const showEdges = edgeOpacity >= 0.06;
  const edges = useMemo(
    () => (showEdges ? new THREE.EdgesGeometry(geometry, 34) : null),
    [geometry, showEdges],
  );

  useEffect(
    () => () => {
      geometry.dispose();
      edges?.dispose();
    },
    [edges, geometry],
  );

  return (
    <group position={position} rotation={rotation}>
      <mesh
        geometry={geometry}
        castShadow={castShadow}
        receiveShadow={receiveShadow}
      >
        <ModelMaterial color={color} shininess={shininess} />
      </mesh>
      {edges && (
        <lineSegments geometry={edges} renderOrder={2}>
          <lineBasicMaterial
            color={edgeColor}
            transparent
            opacity={edgeOpacity * 0.55}
            depthWrite={false}
          />
        </lineSegments>
      )}
      {children}
    </group>
  );
}

export function LowPolySphere({
  radius = 0.5,
  scale = [1, 1, 1],
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  color = PALETTE.body,
  widthSegments = 12,
  heightSegments = 8,
  shininess = 58,
  castShadow = true,
  receiveShadow = true,
}) {
  return (
    <mesh
      position={position}
      rotation={rotation}
      scale={scale}
      castShadow={castShadow}
      receiveShadow={receiveShadow}
    >
      <sphereGeometry
        args={[radius, widthSegments, heightSegments]}
      />
      <ModelMaterial color={color} shininess={shininess} />
    </mesh>
  );
}

export function TorusForm({
  radius = 0.5,
  tube = 0.08,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  color = PALETTE.body,
  radialSegments = 6,
  tubularSegments = 18,
  arc = Math.PI * 2,
  edgeOpacity = 0.04,
}) {
  const geometry = useMemo(
    () =>
      new THREE.TorusGeometry(
        radius,
        tube,
        radialSegments,
        tubularSegments,
        arc,
      ),
    [arc, radialSegments, radius, tube, tubularSegments],
  );
  const showEdges = edgeOpacity >= 0.06;
  const edges = useMemo(
    () => (showEdges ? new THREE.EdgesGeometry(geometry, 34) : null),
    [geometry, showEdges],
  );

  useEffect(
    () => () => {
      geometry.dispose();
      edges?.dispose();
    },
    [edges, geometry],
  );

  return (
    <group position={position} rotation={rotation}>
      <mesh geometry={geometry} castShadow receiveShadow>
        <ModelMaterial color={color} shininess={64} />
      </mesh>
      {edges && (
        <lineSegments geometry={edges} renderOrder={2}>
          <lineBasicMaterial
            color={PALETTE.line}
            transparent
            opacity={edgeOpacity * 0.55}
            depthWrite={false}
          />
        </lineSegments>
      )}
    </group>
  );
}

export function CableTube({
  points,
  radius = 0.025,
  color = PALETTE.mid,
}) {
  const geometry = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3(
      points.map(([x, y, z]) => new THREE.Vector3(x, y, z)),
    );
    return new THREE.TubeGeometry(curve, 28, radius, 5, false);
  }, [points, radius]);

  useEffect(() => () => geometry.dispose(), [geometry]);

  return (
    <mesh geometry={geometry} castShadow>
      <ModelMaterial color={color} shininess={32} />
    </mesh>
  );
}

export function PolygonPlane({
  points,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  color = PALETTE.mid,
  opacity = 1,
  castShadow = false,
  receiveShadow = false,
}) {
  const geometry = useMemo(() => {
    const shape = new THREE.Shape();
    points.forEach(([x, y], index) => {
      if (index === 0) shape.moveTo(x, y);
      else shape.lineTo(x, y);
    });
    shape.closePath();
    return new THREE.ShapeGeometry(shape);
  }, [points]);

  useEffect(() => () => geometry.dispose(), [geometry]);

  return (
    <mesh
      geometry={geometry}
      position={position}
      rotation={rotation}
      castShadow={castShadow}
      receiveShadow={receiveShadow}
    >
      <ModelMaterial
        color={color}
        flatShading={false}
        transparent={opacity < 1}
        opacity={opacity}
        shininess={24}
      />
    </mesh>
  );
}
