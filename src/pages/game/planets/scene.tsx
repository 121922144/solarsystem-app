import { OrbitControls } from '@react-three/drei';
import Level, {
  Neptune,
  Uranus,
  Saturn,
  Jupiter,
  Mars,
  Earth,
  Venus,
  Mercury,
  Sun,
} from './level';
import Lights from './lights';
import Player from './player';
import * as THREE from 'three';

// 定义所有行星组件的数组
const planetComponents = [
  Neptune,
  Uranus,
  Saturn,
  Jupiter,
  Mars,
  Earth,
  Venus,
  Mercury,
  Sun,
];

export default function Scene() {
  // 如果需要使用 THREE 来创建辅助对象，可以取消下面的注释
  const axesHelper = new THREE.AxesHelper(5);

  return (
    <>
      {/* <primitive object={axesHelper} /> */}
      <OrbitControls />
      <Lights />
      <Level blocks={planetComponents} />
      <Player blocks={planetComponents} />
    </>
  );
}
