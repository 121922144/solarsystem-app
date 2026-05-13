import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useGlobalState, GameState } from '../lib/use-global-state';
import { confettiFireworks } from '../confetti-fireworks';
import * as THREE from 'three';

export default function Player({ blocks }: { blocks: React.ComponentType[] }) {
  const { scene: mouse, animations } = useGLTF('/models/mouse5.glb');
  const [mixer, setMixer] = useState<THREE.AnimationMixer>(null!);
  const [wavingAndTurn, setWavingAndTurn] = useState<THREE.AnimationAction>(
    null!
  );
  const [jumping, setJumping] = useState<THREE.AnimationAction>(null!);
  const [turnBack, setTurnBack] = useState<THREE.AnimationAction>(null!);
  const [clap, setClap] = useState<THREE.AnimationAction>(null!);

  // 保存初始位置
  const [initialPosition] = useState(() => new THREE.Vector3(0, 0.52, 0));

  // 跳跃目标位置，根据blocks数量动态生成
  const targetPosition = useRef<THREE.Vector3[]>([]);
  const [smoothedCameraPosition] = useState(() => new THREE.Vector3(0, 0, 0));
  const [smoothedCameraTarget] = useState(() => new THREE.Vector3(0, 0, 0));
  const jumpProgress = 10 / 47; // 跳跃动画总帧数47帧，第10帧开始起跳
  const landingProgress = 28 / 47; // 跳跃动画总帧数47帧，第28帧开始落地
  const jumpStartTime = useRef(0); // 记录跳跃时间
  const startJumpPosition = useRef<THREE.Vector3 | null>(null); // 记录跳跃前的位置

  // 游戏的状态
  const { gameState } = useGlobalState();
  const progress = useRef<string[]>([]);
  const prevGameState = useRef<GameState>('idle');
  const hasPlayedBackgroundMusic = useRef(false);
  const hasPlayedJumpSound = useRef(false);

  const changeAction = useCallback(
    (
      startAction: THREE.AnimationAction,
      endAction?: THREE.AnimationAction,
      loopMode: THREE.AnimationActionLoopStyles = THREE.LoopOnce,
      loopCount: number = 1
    ) => {
      if (!endAction) {
        // 直接播放新动作
        startAction.reset();
        startAction.setLoop(loopMode, loopCount);
        startAction.clampWhenFinished = loopMode === THREE.LoopOnce;
        startAction.play();
      } else {
        // 交叉淡入新动作，播放endAction
        startAction.crossFadeTo(endAction, 0.05, true);
        endAction.reset();
        endAction.setLoop(loopMode, loopCount);
        endAction.clampWhenFinished = loopMode === THREE.LoopOnce;
        endAction.play();
      }
    },
    []
  );

  // 播放背景音乐
  const playBackgroundMusic = useCallback(() => {
    const audio = document.getElementById(
      'background-music'
    ) as HTMLAudioElement;
    if (audio) {
      audio.volume = 0.1;
      audio.play().catch(error => {
        console.error('播放背景音乐失败:', error);
      });
    }
  }, []);

  // 播放跳跃音效
  const playJumpSound = useCallback(() => {
    const audio = document.getElementById('jump-audio') as HTMLAudioElement;
    if (audio) {
      // 重置音频到开始位置
      audio.currentTime = 0;
      // 播放音效
      audio.play().catch(error => {
        console.error('播放跳跃音效失败:', error);
      });
    }
  }, []);

  // 播放烟花音效
  const playFireworksSound = useCallback(() => {
    const audio = document.getElementById(
      'fireworks-audio'
    ) as HTMLAudioElement;
    if (audio) {
      // 重置音频到开始位置
      audio.currentTime = 0;
      // 播放音效
      audio.play().catch(error => {
        console.error('播放烟花音效失败:', error);
      });
    }
  }, []);

  // 初始化动画混合器和动作
  useEffect(() => {
    if (mouse && animations.length >= 5) {
      const newMixer = new THREE.AnimationMixer(mouse);
      setMixer(newMixer);
      const clapAction = newMixer.clipAction(animations[0]);
      const jumpAction = newMixer.clipAction(animations[2]);
      const turnBackAction = newMixer.clipAction(animations[3]);
      const waveAndTurnAction = newMixer.clipAction(animations[4]);
      setWavingAndTurn(waveAndTurnAction);
      setJumping(jumpAction);
      setTurnBack(turnBackAction);
      setClap(clapAction);
      // 跳跃目标位置
      targetPosition.current = Array.from(
        { length: blocks.length },
        (_, index) => {
          const isLastElement = index === blocks.length - 1;
          return new THREE.Vector3(0, isLastElement ? 1.5 : 0.52, -index * 4);
        }
      );
      // 设置初始位置
      mouse.position.copy(initialPosition);
    }
  }, [mouse, animations, initialPosition]);

  useEffect(() => {
    // 重新开始游戏
    if (prevGameState.current !== 'idle' && gameState === 'q1') {
      progress.current = [];
      mouse.position.copy(initialPosition);
      // 重置跳跃音效标志，确保新的游戏循环可以从头开始播放音效
      hasPlayedJumpSound.current = false;
      changeAction(clap, wavingAndTurn);
    }
    if (!progress.current.includes(gameState) && gameState !== 'idle') {
      progress.current.push(gameState);
      prevGameState.current = gameState;
      if (gameState === 'q1') {
        changeAction(wavingAndTurn);
        // 首次播放wavingAndTurn动作时播放背景音乐
        if (!hasPlayedBackgroundMusic.current) {
          playBackgroundMusic();
          hasPlayedBackgroundMusic.current = true;
        }
      } else if (gameState === 'q2') {
        changeAction(wavingAndTurn, jumping);
        jumpStartTime.current = Date.now(); // 记录跳跃开始时间
        startJumpPosition.current = mouse.position.clone(); // 记录跳跃前的位置
      } else {
        changeAction(jumping);
        jumpStartTime.current = Date.now(); // 记录跳跃开始时间
        startJumpPosition.current = mouse.position.clone(); // 记录跳跃前的位置
      }
    }
  }, [gameState]);

  useFrame((state, delta) => {
    if (mixer) {
      mixer.update(delta);
    }
    // 同步跳跃动画和位置变化
    if (jumpStartTime.current && startJumpPosition.current) {
      // 设置跳跃目标索引
      const targetIndex =
        progress.current.slice(-1)[0] === 'gameOver'
          ? targetPosition.current.length - 1
          : parseInt(progress.current.slice(-1)[0].charAt(1)) - 1; // q2->0, q3->1, q4->2, q5->3
      // 获取跳跃动画的持续时间
      const jumpClip = jumping.getClip();
      const jumpDuration = jumpClip.duration;

      // 计算动画播放进度 (0 to 1)
      const elapsed = (Date.now() - jumpStartTime.current) / 1000;
      const animationProgress = Math.min(elapsed / jumpDuration, 1);

      // 只有当动画进度超过起跳阈值时才开始移动位置，第10帧开始起跳
      if (animationProgress >= jumpProgress) {
        // 只在跳跃刚开始时播放一次跳跃音效
        if (!hasPlayedJumpSound.current) {
          playJumpSound();
          hasPlayedJumpSound.current = true;
        }

        // 如果进度已经超过着陆点，则直接设置到目标位置
        if (animationProgress >= landingProgress) {
          mouse.position.copy(targetPosition.current[targetIndex]);
          jumpStartTime.current = 0;
          // 重置跳跃音效标志，以便下次跳跃可以再次播放
          hasPlayedJumpSound.current = false;
          if (gameState === 'gameOver') {
            setTimeout(async () => {
              changeAction(jumping, turnBack);
              await new Promise<void>(resolve => setTimeout(resolve, 1000));
              changeAction(turnBack, clap, THREE.LoopRepeat, Infinity);
              confettiFireworks();
              playFireworksSound();
            }, 1000);
          }
        } else {
          // 计算在起跳和着陆之间的插值进度
          const segmentProgress = Math.min(
            (animationProgress - jumpProgress) /
              (landingProgress - jumpProgress),
            1
          );
          const easeProgress = 1 - Math.pow(1 - segmentProgress, 2);

          // 根据动画进度插值位置，从跳跃开始位置到目标位置
          mouse.position.lerpVectors(
            startJumpPosition.current, // 跳跃开始位置
            targetPosition.current[targetIndex], // 目标位置
            easeProgress
          );
        }
      }
    }

    // 摄像机跟随
    const cameraPosition = new THREE.Vector3().copy(mouse.position);
    cameraPosition.z += 6;
    cameraPosition.y += 2;
    cameraPosition.x -= 2.5;
    const cameraTarget = new THREE.Vector3().copy(mouse.position);
    // 使用基于delta时间的平滑插值，确保在不同帧率下的一致性
    const smoothFactor = 1 - Math.exp(-5 * delta);
    smoothedCameraPosition.lerp(cameraPosition, smoothFactor);
    smoothedCameraTarget.lerp(cameraTarget, smoothFactor);
    state.camera.position.copy(smoothedCameraPosition);
    state.camera.lookAt(smoothedCameraTarget);
  });

  return (
    <>
      <primitive object={mouse} />
    </>
  );
}
