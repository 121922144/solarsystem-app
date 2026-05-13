import { Canvas } from '@react-three/fiber';
import Scene from './scene';

export default function Planets() {
  return (
    <>
      <div className="absolute top-0 left-0 w-100vw h-100vh">
        <Canvas
          shadows
          camera={{ position: [-2.9, 1.6, 5.3], fov: 45, near: 0.1, far: 200 }}
        >
          <Scene />
        </Canvas>
      </div>
    </>
  );
}
