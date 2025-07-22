import { useEffect, useState } from 'react';

interface Particle {
  id: number;
  x: number;
  size: number;
  animationDelay: number;
}

export function FloatingParticles() {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    const createParticles = () => {
      const newParticles: Particle[] = [];
      const particleCount = window.innerWidth > 768 ? 15 : 8; // Fewer particles on mobile
      
      for (let i = 0; i < particleCount; i++) {
        newParticles.push({
          id: i,
          x: Math.random() * 100, // Random X position (0-100%)
          size: Math.random() * 4 + 2, // Random size (2-6px)
          animationDelay: Math.random() * 20, // Random animation delay (0-20s)
        });
      }
      
      setParticles(newParticles);
    };

    createParticles();
    
    // Recreate particles on window resize
    const handleResize = () => createParticles();
    window.addEventListener('resize', handleResize);
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="floating-particles">
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="particle"
          style={{
            left: `${particle.x}%`,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            animationDelay: `${particle.animationDelay}s`,
          }}
        />
      ))}
    </div>
  );
}
