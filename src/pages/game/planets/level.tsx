import React from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

const boxGeometry = new THREE.BoxGeometry(1, 1, 1);
const floorMaterial = new THREE.MeshStandardMaterial({
  color: '#E7D6B2',
});
const floor2Material = new THREE.MeshStandardMaterial({
  color: '#f3c33f',
});

export function Sun({
  position = [0, 0, 0],
}: {
  position?: [number, number, number];
}) {
  const sun = useGLTF('/models/sun.glb');
  return (
    <group position={position}>
      {/* <mesh
        geometry={boxGeometry}
        material={floor2Material}
        position={[0, -0.9, 0]}
        scale={[4, 0.2, 4]}
      /> */}
      <primitive object={sun.scene} position={[0, 0.4, 0]} />
    </group>
  );
}

export function Mercury({
  position = [0, 0, 0],
}: {
  position?: [number, number, number];
}) {
  const mercury = useGLTF('/models/mercury.glb');
  return (
    <group position={position}>
      {/* <mesh
        geometry={boxGeometry}
        material={floorMaterial}
        position={[0, -1, 0]}
        scale={[4, 0.2, 4]}
      /> */}
      <primitive object={mercury.scene} />
    </group>
  );
}

export function Venus({
  position = [0, 0, 0],
}: {
  position?: [number, number, number];
}) {
  const venus = useGLTF('/models/venus.glb');
  return (
    <group position={position}>
      {/* <mesh
        geometry={boxGeometry}
        material={floorMaterial}
        position={[0, -1, 0]}
        scale={[4, 0.2, 4]}
      /> */}
      <primitive object={venus.scene} />
    </group>
  );
}

export function Earth({
  position = [0, 0, 0],
}: {
  position?: [number, number, number];
}) {
  const earth = useGLTF('/models/earth.glb');
  return (
    <group position={position}>
      {/* <mesh
        geometry={boxGeometry}
        material={floorMaterial}
        position={[0, -1, 0]}
        scale={[4, 0.2, 4]}
      /> */}
      <primitive object={earth.scene} />
    </group>
  );
}

export function Mars({
  position = [0, 0, 0],
}: {
  position?: [number, number, number];
}) {
  const mars = useGLTF('/models/mars.glb');
  const asteroid = useGLTF('/models/asteroid.glb');
  return (
    <group position={position}>
      {/* <mesh
        geometry={boxGeometry}
        material={floorMaterial}
        position={[0, -1, 0]}
        scale={[4, 0.2, 4]}
      /> */}
      <primitive object={mars.scene} />
      <primitive object={asteroid.scene} position-z={2} rotation-y={Math.PI} />
    </group>
  );
}

export function Jupiter({
  position = [0, 0, 0],
}: {
  position?: [number, number, number];
}) {
  const jupiter = useGLTF('/models/jupiter.glb');
  return (
    <group position={position}>
      {/* <mesh
        geometry={boxGeometry}
        material={floorMaterial}
        position={[0, -1, 0]}
        scale={[4, 0.2, 4]}
      /> */}
      <primitive object={jupiter.scene} />
    </group>
  );
}

export function Saturn({
  position = [0, 0, 0],
}: {
  position?: [number, number, number];
}) {
  const saturn = useGLTF('/models/saturn.glb');
  return (
    <group position={position}>
      {/* <mesh
        geometry={boxGeometry}
        material={floorMaterial}
        position={[0, -1, 0]}
        scale={[4, 0.2, 4]}
      /> */}
      <primitive object={saturn.scene} />
    </group>
  );
}

export function Uranus({
  position = [0, 0, 0],
}: {
  position?: [number, number, number];
}) {
  const uranus = useGLTF('/models/uranus.glb');
  return (
    <group position={position}>
      {/* <mesh
        geometry={boxGeometry}
        material={floorMaterial}
        position={[0, -1, 0]}
        scale={[4, 0.2, 4]}
      /> */}
      <primitive object={uranus.scene} />
    </group>
  );
}

export function Neptune({
  position = [0, 0, 0],
}: {
  position?: [number, number, number];
}) {
  const neptune = useGLTF('/models/neptune.glb');
  return (
    <group position={position}>
      {/* <mesh
        geometry={boxGeometry}
        material={floorMaterial}
        position={[0, -1, 0]}
        scale={[4, 0.2, 4]}
      /> */}
      <primitive object={neptune.scene} />
    </group>
  );
}

export default function Level({
  blocks,
}: {
  blocks: React.ComponentType<{
    position?: [number, number, number] | undefined;
  }>[];
}) {
  return (
    <>
      {blocks.map((Block, index) => (
        <Block key={index} position={[0, 0, -index * 4]} />
      ))}
    </>
  );
}
