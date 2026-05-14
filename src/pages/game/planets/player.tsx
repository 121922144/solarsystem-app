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
  // jumping 用两个独立 action（基于克隆的 clip）交替播放，
  // 避免同一个 action 反复 reset 时从 clamp 末帧瞬切回首帧造成抖动
  const [jumpingActions, setJumpingActions] = useState<THREE.AnimationAction[]>(
    []
  );
  const activeJumpActionRef = useRef<THREE.AnimationAction | null>(null);
  const nextJumpIdxRef = useRef(0);
  const jumpDurationRef = useRef(0);
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
  const isJumpingRef = useRef(false); // 是否处于跳跃阶段
  const startJumpPosition = useRef<THREE.Vector3 | null>(null); // 记录跳跃前的位置

  // 游戏的状态
  const { gameState } = useGlobalState();
  const progress = useRef<string[]>([]);
  const prevGameState = useRef<GameState>('idle');
  const hasPlayedBackgroundMusic = useRef(false);
  const hasPlayedJumpSound = useRef(false);

  // gameOver 流程中的两层 setTimeout 和烟花的 cancel 函数，需要在重启时统一清理
  const gameOverTimeoutsRef = useRef<number[]>([]);
  const gameOverCancelledRef = useRef(false);
  const cancelFireworksRef = useRef<(() => void) | null>(null);

  // 停止烟花音效并重置播放位置
  const stopFireworksSound = useCallback(() => {
    const audio = document.getElementById(
      'fireworks-audio'
    ) as HTMLAudioElement | null;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
  }, []);

  // 统一清理 gameOver 留下的副作用（定时器 / 烟花粒子 / 烟花音效）
  const clearGameOverEffects = useCallback(() => {
    gameOverCancelledRef.current = true;
    gameOverTimeoutsRef.current.forEach(id => clearTimeout(id));
    gameOverTimeoutsRef.current = [];
    if (cancelFireworksRef.current) {
      cancelFireworksRef.current();
      cancelFireworksRef.current = null;
    }
    stopFireworksSound();
  }, [stopFireworksSound]);

  const changeAction = useCallback(
    (
      startAction: THREE.AnimationAction,
      endAction?: THREE.AnimationAction,
      loopMode: THREE.AnimationActionLoopStyles = THREE.LoopOnce,
      loopCount: number = 1,
      fadeDuration: number = 0.15
    ) => {
      if (!endAction) {
        // 直接播放新动作
        startAction.reset();
        startAction.setLoop(loopMode, loopCount);
        startAction.clampWhenFinished = loopMode === THREE.LoopOnce;
        startAction.play();
      } else {
        // 交叉淡入新动作，播放endAction
        startAction.crossFadeTo(endAction, fadeDuration, true);
        endAction.reset();
        endAction.setLoop(loopMode, loopCount);
        endAction.clampWhenFinished = loopMode === THREE.LoopOnce;
        endAction.play();
      }
    },
    []
  );

  // 触发一次跳跃：从 fromAction 平滑切到下一个空闲的 jumping action
  const triggerJump = useCallback(
    (fromAction: THREE.AnimationAction) => {
      if (jumpingActions.length < 2) return;
      const nextAction = jumpingActions[nextJumpIdxRef.current];
      nextJumpIdxRef.current = 1 - nextJumpIdxRef.current;
      changeAction(fromAction, nextAction);
      activeJumpActionRef.current = nextAction;
      isJumpingRef.current = true;
      startJumpPosition.current = mouse.position.clone();
    },
    [jumpingActions, changeAction, mouse]
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
      // 通过 clone 一份 jumping clip，得到两个互相独立的 AnimationAction，
      // 用于跳跃之间的交叉淡入，避免同一 action 重置造成的姿态瞬切
      const jumpClipA = animations[2];
      const jumpClipB = animations[2].clone();
      const jumpActionA = newMixer.clipAction(jumpClipA);
      const jumpActionB = newMixer.clipAction(jumpClipB);
      jumpDurationRef.current = jumpClipA.duration;
      const turnBackAction = newMixer.clipAction(animations[3]);
      const waveAndTurnAction = newMixer.clipAction(animations[4]);
      setWavingAndTurn(waveAndTurnAction);
      setJumpingActions([jumpActionA, jumpActionB]);
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

  // 组件卸载时兜底清理：避免退出页面后定时器、烟花粒子、烟花音效仍在运行
  useEffect(() => {
    return () => {
      clearGameOverEffects();
    };
  }, [clearGameOverEffects]);

  useEffect(() => {
    // 重新开始游戏
    if (prevGameState.current !== 'idle' && gameState === 'q1') {
      progress.current = [];
      mouse.position.copy(initialPosition);
      // 重置跳跃音效标志，确保新的游戏循环可以从头开始播放音效
      hasPlayedJumpSound.current = false;
      // 清理上一局 gameOver 遗留的副作用：未执行的定时器、烟花粒子、烟花音效
      clearGameOverEffects();
      // 停掉可能仍处于 clamp/循环状态的所有动作，避免它们以权重 0 驻留在 mixer 中
      jumpingActions.forEach(a => a.stop());
      if (clap) clap.stop();
      if (turnBack) turnBack.stop();
      if (wavingAndTurn) wavingAndTurn.stop();
      activeJumpActionRef.current = null;
      isJumpingRef.current = false;
      nextJumpIdxRef.current = 0;
      // 位置是瞬移回初始位置，没必要再 crossFade，直接硬切到 wavingAndTurn
      changeAction(wavingAndTurn);
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
        // 第一次跳跃：从 wavingAndTurn 平滑切到第一个 jumping action
        triggerJump(wavingAndTurn);
      } else {
        // 后续跳跃 / gameOver：从当前正在播放的 jumping action 切到另一个
        const fromAction = activeJumpActionRef.current ?? wavingAndTurn;
        triggerJump(fromAction);
      }
    }
  }, [gameState]);

  useFrame((state, delta) => {
    if (mixer) {
      mixer.update(delta);
    }
    // 同步跳跃动画和位置变化
    const activeJump = activeJumpActionRef.current;
    if (
      isJumpingRef.current &&
      activeJump &&
      startJumpPosition.current &&
      jumpDurationRef.current > 0
    ) {
      // 设置跳跃目标索引
      const lastState = progress.current.slice(-1)[0];
      const targetIndex =
        lastState === 'gameOver'
          ? targetPosition.current.length - 1
          : parseInt(lastState.charAt(1)) - 1; // q2->0, q3->1, q4->2, q5->3

      // 用 mixer 内部时间计算进度，确保与骨骼动画完全同步
      const animationProgress = Math.min(
        activeJump.time / jumpDurationRef.current,
        1
      );

      if (animationProgress < jumpProgress) {
        // 起跳准备阶段（0~10帧）：显式锁定根位置，避免任何漂移造成的视觉抖动
        mouse.position.copy(startJumpPosition.current);
      } else {
        // 只在跳跃刚开始时播放一次跳跃音效
        if (!hasPlayedJumpSound.current) {
          playJumpSound();
          hasPlayedJumpSound.current = true;
        }

        // 如果进度已经超过着陆点，则直接设置到目标位置
        if (animationProgress >= landingProgress) {
          mouse.position.copy(targetPosition.current[targetIndex]);
          isJumpingRef.current = false;
          // 重置跳跃音效标志，以便下次跳跃可以再次播放
          hasPlayedJumpSound.current = false;
          if (gameState === 'gameOver') {
            // 新的 gameOver 流程开始：重置取消标记，并登记两层 setTimeout
            gameOverCancelledRef.current = false;
            gameOverTimeoutsRef.current = [];
            const firstTimer = window.setTimeout(() => {
              if (gameOverCancelledRef.current) return;
              changeAction(activeJump, turnBack);
              const secondTimer = window.setTimeout(() => {
                if (gameOverCancelledRef.current) return;
                changeAction(turnBack, clap, THREE.LoopRepeat, Infinity);
                // 保存烟花 cancel 函数，重启时可统一清理
                cancelFireworksRef.current = confettiFireworks();
                playFireworksSound();
              }, 1000);
              gameOverTimeoutsRef.current.push(secondTimer);
            }, 1000);
            gameOverTimeoutsRef.current.push(firstTimer);
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
