'use client'

/**
 * Industrial red lighting preset for the HeroScene3D canvas.
 * Keeps ambient intensity minimal to preserve deep shadows.
 */
export function Lights(): JSX.Element {
  return (
    <>
      <ambientLight intensity={0.1} />
      {/* Rim / key – top-left hard red */}
      <spotLight position={[-3, 5, 2]} angle={0.35} penumbra={0.5} intensity={10} color="#ff0000" decay={2} />
      {/* Side accent – sculpts Damaged_Metal texture */}
      <spotLight position={[4, 0, 2]} angle={0.45} penumbra={0.75} intensity={5} color="#cc0000" decay={2} />
      {/* Low rear fill – edge definition without filling shadows */}
      <pointLight position={[0, -2, -3]} intensity={2} color="#880000" decay={2} />
    </>
  )
}
