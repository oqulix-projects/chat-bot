import React, { useRef, useEffect, Suspense, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, OrbitControls, Html } from '@react-three/drei';
import * as THREE from 'three';
import './CharacterModel.css'
import SkySphere from './SkySphere';


// You will need to serve your model from a public folder or CDN.
// For this example, let's assume it's in the public/ folder.
const MODEL_PATH = '/robot.glb';

// Main component that loads the model and handles animation
const Model = ({ currentAction }) => {
  const modelRef = useRef();
  const { scene, animations } = useGLTF(MODEL_PATH);
  const mixerRef = useRef();
  const actionsRef = useRef({});
  const activeActionRef = useRef();
  const previousActionRef = useRef();

  // Initialize the animation mixer and actions when the model is loaded
  useEffect(() => {
    if (scene && animations.length > 0) {
      // Log the animation names found in the file for debugging.
      console.log('Animations found in the GLB file:', animations.map(clip => clip.name));

      mixerRef.current = new THREE.AnimationMixer(scene);
      animations.forEach(clip => {
        actionsRef.current[clip.name] = mixerRef.current.clipAction(clip);
      });
      activeActionRef.current = actionsRef.current.idle;
      if (activeActionRef.current) {
        activeActionRef.current.play();
      }
    }
  }, [scene, animations]);

  // Update the animation mixer on every frame
  useFrame((state, delta) => {
    mixerRef.current?.update(delta);
  });

  // Handle action changes with cross-fading
  useEffect(() => {
    const nextAction = actionsRef.current[currentAction];
    const previousAction = activeActionRef.current;

    if (nextAction && previousAction !== nextAction) {
      previousActionRef.current = previousAction;
      activeActionRef.current = nextAction;

      // Cross-fade to the new action
      if (previousAction) {
        previousAction.fadeOut(0.5); // Fade out over 0.5 seconds
        nextAction
          .reset()
          .setEffectiveTimeScale(1)
          .setEffectiveWeight(1)
          .fadeIn(0.5) // Fade in over 0.5 seconds
          .play();
      } else {
        nextAction.play();
      }
    }
  }, [currentAction]);

  // We are scaling the model down to 30% of its original size
  // and setting the camera's initial position to see the entire model.
  return <primitive ref={modelRef} object={scene} scale={0.06} position={[0, -2.4, 0]} castShadow />;
};

// Parent component that holds the Canvas and UI
const CharacterModel = ({ talking, background }) => {
  const idleStates = [
    "idle1","idle2","idle5","idle6",
    "idle7","idle8","idle9","idle10","idle11"
  ];

  const talkStates = [
    "talk1","talk2","talk3","talk4","talk5","talk6"
  ];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [repeatCount, setRepeatCount] = useState(0);

  // helper: random repeat between 3–4
  const getRepeatLimit = () => Math.floor(Math.random() * 2) + 3;

  useEffect(() => {
    // reset immediately on talking state change
    setRepeatCount(0);
    setCurrentIndex(0);

    const states = talking ? talkStates : idleStates;

    // pick a random starting action instantly
    const randomIndex = Math.floor(Math.random() * states.length);
    setCurrentIndex(randomIndex);

    const interval = setInterval(() => {
      setRepeatCount((prev) => {
        if (prev < getRepeatLimit()) {
          return prev + 1;
        } else {
          // switch to another random action
          const nextIndex = Math.floor(Math.random() * states.length);
          setCurrentIndex(nextIndex);
          return 0;
        }
      });
    }, 2000); // match your animation duration

    return () => clearInterval(interval);
  }, [talking]);

  const action = talking ? talkStates[currentIndex] : idleStates[currentIndex];
  return (
    <>
      <div className="container">
        <div className="canvas-container">
          <Canvas shadows camera={{ position: [0, 0.1, 8] }}>
            {background!=''&&<SkySphere/>}

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
            <Suspense fallback={<Html center><span className="loading-text">Loading...</span></Html>}>
              <Model currentAction={action} />
            </Suspense>
            {/* Disabled rotation and panning */}
            <OrbitControls enableRotate={false} enablePan={false} />
          </Canvas>
        </div>
      </div>
    </>
  );
};

export default CharacterModel;
