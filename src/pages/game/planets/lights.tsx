import { useHelper } from '@react-three/drei';
import { useRef } from 'react';
import * as THREE from 'three';

export default function Light() {
  const light = useRef<THREE.SpotLight>(null);

  // useHelper(light, THREE.SpotLightHelper, 'cyan');
  return (
    <>
      <spotLight
        ref={light}
        position={[-1, 2, 1]}
        intensity={2}
        shadow-mapSize={[1024, 1024]}
        shadow-camera-near={1}
        shadow-camera-far={10}
        shadow-camera-top={10}
        shadow-camera-right={10}
        shadow-camera-bottom={-10}
        shadow-camera-left={-10}
      />
      <directionalLight
        position={[2, 2, 2]}
        intensity={1}
        shadow-mapSize={[1024, 1024]}
        shadow-camera-near={1}
        shadow-camera-far={10}
        shadow-camera-top={10}
        shadow-camera-right={10}
        shadow-camera-bottom={-10}
        shadow-camera-left={-10}
      />
      <ambientLight intensity={0.5} />
    </>
  );
}
