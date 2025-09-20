import React from 'react'
import { useLoader } from '@react-three/fiber'
import * as THREE from 'three'

const SkySphere = () => {
  const texture = useLoader(THREE.TextureLoader, '/myg360.jpg')
  return (
    <mesh scale={[-0.1, 0.1, 0.15]}>
      {/* flip normals so inside is visible */}
      <sphereGeometry args={[1500, 30, 10]} />
      <meshBasicMaterial map={texture} side={THREE.BackSide} />
    </mesh>
  )
}

export default SkySphere
