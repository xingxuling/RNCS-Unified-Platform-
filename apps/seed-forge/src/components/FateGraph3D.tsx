import { useEffect, useState, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, Line, Sphere } from '@react-three/drei';
import { Card } from '@/components/ui/card';
import { worldEngine, CausalNode } from '@/lib/worldEngine';
import * as THREE from 'three';
import { Maximize2, Minimize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Node3DProps {
  node: CausalNode;
  position: [number, number, number];
  color: string;
}

const Node3D = ({ node, position, color }: Node3DProps) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += 0.01;
      meshRef.current.rotation.y += 0.01;
      if (hovered) {
        meshRef.current.scale.lerp(new THREE.Vector3(1.2, 1.2, 1.2), 0.1);
      } else {
        meshRef.current.scale.lerp(new THREE.Vector3(1, 1, 1), 0.1);
      }
    }
  });

  return (
    <group position={position}>
      <Sphere
        ref={meshRef}
        args={[0.5, 32, 32]}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={hovered ? 0.8 : 0.4}
          metalness={0.8}
          roughness={0.2}
        />
      </Sphere>
      
      {/* Outer glow ring */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.7, 0.05, 16, 32]} />
        <meshBasicMaterial color={color} transparent opacity={0.3} />
      </mesh>

      <Text
        position={[0, -1, 0]}
        fontSize={0.3}
        color="white"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.02}
        outlineColor="#000000"
      >
        {node.type}
      </Text>
    </group>
  );
};

const ConnectionLine = ({ start, end, color }: { start: [number, number, number]; end: [number, number, number]; color: string }) => {
  return (
    <Line
      points={[start, end]}
      color={color}
      lineWidth={2}
      transparent
      opacity={0.6}
    />
  );
};

const Scene = () => {
  const [nodes, setNodes] = useState<CausalNode[]>([]);

  useEffect(() => {
    const updateNodes = () => {
      setNodes(worldEngine.getCausalGraph());
    };

    updateNodes();
    const interval = setInterval(updateNodes, 1000);
    return () => clearInterval(interval);
  }, []);

  const getOperatorColor = (type: string): string => {
    switch (type) {
      case 'CREATE': return '#06b6d4'; // cyan
      case 'LOOP': return '#a855f7'; // purple
      case 'BREAK': return '#ef4444'; // red
      case 'SHIFT': return '#f59e0b'; // amber
      case 'WEAVE': return '#10b981'; // green
      default: return '#6b7280'; // gray
    }
  };

  // Position nodes in a spiral pattern
  const positions = nodes.map((_, index) => {
    const radius = 3 + index * 0.5;
    const angle = index * 0.8;
    const y = index * 0.8 - nodes.length * 0.4;
    return [
      Math.cos(angle) * radius,
      y,
      Math.sin(angle) * radius,
    ] as [number, number, number];
  });

  return (
    <>
      <ambientLight intensity={0.3} />
      <pointLight position={[10, 10, 10]} intensity={1} color="#06b6d4" />
      <pointLight position={[-10, -10, -10]} intensity={0.5} color="#a855f7" />
      
      {/* Background stars */}
      {Array.from({ length: 200 }).map((_, i) => (
        <Sphere
          key={i}
          args={[0.02, 8, 8]}
          position={[
            (Math.random() - 0.5) * 50,
            (Math.random() - 0.5) * 50,
            (Math.random() - 0.5) * 50,
          ]}
        >
          <meshBasicMaterial color="white" />
        </Sphere>
      ))}

      {/* Causal nodes */}
      {nodes.map((node, index) => (
        <Node3D
          key={node.id}
          node={node}
          position={positions[index]}
          color={getOperatorColor(node.type)}
        />
      ))}

      {/* Connection lines */}
      {nodes.map((node, index) => {
        if (index > 0) {
          return (
            <ConnectionLine
              key={`line-${node.id}`}
              start={positions[index - 1]}
              end={positions[index]}
              color={getOperatorColor(node.type)}
            />
          );
        }
        return null;
      })}

      <OrbitControls
        enableDamping
        dampingFactor={0.05}
        rotateSpeed={0.5}
        zoomSpeed={0.8}
        minDistance={5}
        maxDistance={30}
      />
    </>
  );
};

export const FateGraph3D = () => {
  const [fullscreen, setFullscreen] = useState(false);

  return (
    <Card className={`bg-card/30 backdrop-blur border-primary/20 transition-all ${
      fullscreen ? 'fixed inset-4 z-50' : 'p-6 h-[600px]'
    }`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-glow-cyan">3D Fate Visualization</h3>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setFullscreen(!fullscreen)}
          className="text-primary hover:text-primary/80"
        >
          {fullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
        </Button>
      </div>

      <div className={`${fullscreen ? 'h-[calc(100%-4rem)]' : 'h-[500px]'} rounded-lg overflow-hidden bg-background/50 border border-primary/20`}>
        <Canvas camera={{ position: [0, 5, 15], fov: 60 }}>
          <Scene />
        </Canvas>
      </div>

      <div className="mt-3 text-xs text-muted-foreground">
        <div className="flex gap-4 flex-wrap">
          <span>🖱️ Drag to rotate</span>
          <span>🔍 Scroll to zoom</span>
          <span>✨ Hover over nodes for details</span>
        </div>
      </div>
    </Card>
  );
};
