import React, { useRef, useEffect, Suspense, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, OrbitControls, Html } from '@react-three/drei';
import * as THREE from 'three';
import SkySphere from './SkySphere';

const MODEL_PATH = '/robot.glb';

const Model = ({ currentAction }) => {
  const modelRef = useRef();
  const { scene, animations } = useGLTF(MODEL_PATH);
  const mixerRef = useRef();
  const actionsRef = useRef({});
  const activeActionRef = useRef();
  const previousActionRef = useRef();

  useEffect(() => {
    if (!scene || animations.length === 0) return;

    mixerRef.current = new THREE.AnimationMixer(scene);
    animations.forEach((clip) => {
      actionsRef.current[clip.name] = mixerRef.current.clipAction(clip);
    });

    activeActionRef.current = actionsRef.current.idle1 || actionsRef.current.idle;
    activeActionRef.current?.play();

    return () => {
      // Cleanup mixer and actions to prevent memory leak
      mixerRef.current?.stopAllAction();
      mixerRef.current?.uncacheRoot(scene);
    };
  }, [scene, animations]);

  useFrame((state, delta) => {
    mixerRef.current?.update(delta);
  });

  useEffect(() => {
    const nextAction = actionsRef.current[currentAction];
    const previousAction = activeActionRef.current;

    if (nextAction && previousAction !== nextAction) {
      previousActionRef.current = previousAction;
      activeActionRef.current = nextAction;

      if (previousAction) {
        previousAction.fadeOut(0.5);
        nextAction
          .reset()
          .setEffectiveTimeScale(1)
          .setEffectiveWeight(1)
          .fadeIn(0.5)
          .play();
      } else {
        nextAction.play();
      }
    }
  }, [currentAction]);

  return (
    <primitive
      ref={modelRef}
      object={scene}
      scale={0.06}
      position={[0, -2.4, 0]}
      castShadow
    />
  );
};

const CharacterModel = ({ talking, background, wave }) => {
  const idleStates = ["idle1","idle2","idle6","idle7","idle8","idle9","idle10","idle11"];
  const talkStates = ["talk1","talk2","talk3","talk4","talk5","talk6"];
  const waveState = ["idle5"];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [repeatCount, setRepeatCount] = useState(0);

  const getRepeatLimit = () => Math.floor(Math.random() * 2) + 3;

  useEffect(() => {
    setRepeatCount(0);
    setCurrentIndex(0);

    const states = wave ? waveState : talking ? talkStates : idleStates;
    const randomIndex = Math.floor(Math.random() * states.length);
    setCurrentIndex(randomIndex);

    const interval = setInterval(() => {
      setRepeatCount((prev) => {
        if (prev < getRepeatLimit()) {
          return prev + 1;
        } else {
          const nextIndex = Math.floor(Math.random() * states.length);
          setCurrentIndex(nextIndex);
          return 0;
        }
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [talking, wave]); // Added `wave` to dependencies

  const action = wave ? waveState[0] : talking ? talkStates[currentIndex] : idleStates[currentIndex];

  
    return (
  <div className="w-full flex justify-center">
    <div className="w-full max-w-[900px] h-[80vh]">

      <Canvas
        shadows
        camera={{ position: [0, 0.9, 8] }}
        gl={{ preserveDrawingBuffer: true }}
      >
        {/* {background && <SkySphere />} */}

        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.4, 0]} receiveShadow>
          <planeGeometry args={[20, 20]} />
          <shadowMaterial opacity={0.4} />
        </mesh>

        <ambientLight intensity={0.5} />

        <directionalLight
          position={[10, 10, 5]}
          intensity={1}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />

        <Suspense
          fallback={
            <Html center>
              <span className="text-white text-lg">Loading...</span>
            </Html>
          }
        >
          <Model currentAction={action} />
        </Suspense>

        <OrbitControls enableRotate={false} enablePan={false} />
      </Canvas>

    </div>
  </div>

  );
};

export default CharacterModel;
