import React from 'react';

const CubeSpinner = ({ 
  size = 'w-11 h-11', 
  speed = 'duration-2000',
  color = 'orange'
}) => {
  // Color variants for customization
  const colorVariants = {
    orange: {
      bg: 'bg-orange-500/20',
      border: 'border-orange-500',
      glow: 'shadow-orange-500/50'
    },
    blue: {
      bg: 'bg-blue-500/20',
      border: 'border-blue-500',
      glow: 'shadow-blue-500/50'
    },
    purple: {
      bg: 'bg-purple-500/20',
      border: 'border-purple-500',
      glow: 'shadow-purple-500/50'
    },
    green: {
      bg: 'bg-green-500/20',
      border: 'border-green-500',
      glow: 'shadow-green-500/50'
    },
    red: {
      bg: 'bg-red-500/20',
      border: 'border-red-500',
      glow: 'shadow-red-500/50'
    }
  };

  const currentColor = colorVariants[color] || colorVariants.orange;

  const spinnerStyle = {
    transformStyle: 'preserve-3d',
    animation: `cubeSpinner 2s infinite ease-in-out`
  };

  const faceStyle = {
    position: 'absolute',
    width: '100%',
    height: '100%'
  };

  return (
    <>
      <style jsx>{`
        @keyframes cubeSpinner {
          0% {
            transform: rotate(45deg) rotateX(-25deg) rotateY(25deg);
          }
          50% {
            transform: rotate(45deg) rotateX(-385deg) rotateY(25deg);
          }
          100% {
            transform: rotate(45deg) rotateX(-385deg) rotateY(385deg);
          }
        }
      `}</style>
      
      <div className="flex items-center justify-center">
        <div 
          className={`${size} ${speed} relative`}
          style={spinnerStyle}
        >
          {/* Front face */}
          <div 
            className={`${currentColor.bg} ${currentColor.border} ${currentColor.glow} border-2 shadow-lg backdrop-blur-sm`}
            style={{
              ...faceStyle,
              transform: 'translateZ(22px)'
            }}
          />
          
          {/* Back face */}
          <div 
            className={`${currentColor.bg} ${currentColor.border} ${currentColor.glow} border-2 shadow-lg backdrop-blur-sm`}
            style={{
              ...faceStyle,
              transform: 'translateZ(-22px) rotateY(180deg)'
            }}
          />
          
          {/* Right face */}
          <div 
            className={`${currentColor.bg} ${currentColor.border} ${currentColor.glow} border-2 shadow-lg backdrop-blur-sm`}
            style={{
              ...faceStyle,
              transform: 'rotateY(-270deg) translateX(50%)',
              transformOrigin: 'top right'
            }}
          />
          
          {/* Left face */}
          <div 
            className={`${currentColor.bg} ${currentColor.border} ${currentColor.glow} border-2 shadow-lg backdrop-blur-sm`}
            style={{
              ...faceStyle,
              transform: 'rotateY(270deg) translateX(-50%)',
              transformOrigin: 'center left'
            }}
          />
          
          {/* Top face */}
          <div 
            className={`${currentColor.bg} ${currentColor.border} ${currentColor.glow} border-2 shadow-lg backdrop-blur-sm`}
            style={{
              ...faceStyle,
              transform: 'rotateX(90deg) translateY(-50%)',
              transformOrigin: 'top center'
            }}
          />
          
          {/* Bottom face */}
          <div 
            className={`${currentColor.bg} ${currentColor.border} ${currentColor.glow} border-2 shadow-lg backdrop-blur-sm`}
            style={{
              ...faceStyle,
              transform: 'rotateX(-90deg) translateY(50%)',
              transformOrigin: 'bottom center'
            }}
          />
        </div>
      </div>
    </>
  );
};

// Demo component showing different variations
const SpinnerDemo = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-white text-center mb-12 bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent">
          3D Cube Spinner Collection
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
          {/* Default Orange */}
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10 hover:border-orange-500/50 transition-all duration-300">
            <h3 className="text-white text-lg font-semibold mb-4 text-center">Orange (Default)</h3>
            <CubeSpinner />
          </div>
          
          {/* Large Blue */}
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10 hover:border-blue-500/50 transition-all duration-300">
            <h3 className="text-white text-lg font-semibold mb-4 text-center">Large Blue</h3>
            <CubeSpinner size="w-16 h-16" color="blue" />
          </div>
          
          {/* Fast Purple */}
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10 hover:border-purple-500/50 transition-all duration-300">
            <h3 className="text-white text-lg font-semibold mb-4 text-center">Fast Purple</h3>
            <CubeSpinner color="purple" speed="duration-1000" />
          </div>
          
          {/* Small Green */}
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10 hover:border-green-500/50 transition-all duration-300">
            <h3 className="text-white text-lg font-semibold mb-4 text-center">Small Green</h3>
            <CubeSpinner size="w-8 h-8" color="green" />
          </div>
          
          {/* Slow Red */}
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10 hover:border-red-500/50 transition-all duration-300">
            <h3 className="text-white text-lg font-semibold mb-4 text-center">Slow Red</h3>
            <CubeSpinner color="red" speed="duration-3000" />
          </div>
          
          {/* Extra Large Orange */}
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10 hover:border-orange-500/50 transition-all duration-300">
            <h3 className="text-white text-lg font-semibold mb-4 text-center">Extra Large</h3>
            <CubeSpinner size="w-20 h-20" />
          </div>
        </div>
        
        <div className="mt-16 bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
          <h2 className="text-2xl font-bold text-white mb-4">Usage Examples</h2>
          <div className="bg-slate-800 rounded-lg p-4 font-mono text-sm text-green-400">
            <div className="mb-2">{`// Default spinner`}</div>
            <div className="mb-2">{`<CubeSpinner />`}</div>
            <div className="mb-2">{`// Large blue spinner`}</div>
            <div className="mb-2">{`<CubeSpinner size="w-16 h-16" color="blue" />`}</div>
            <div className="mb-2">{`// Fast purple spinner`}</div>
            <div>{`<CubeSpinner color="purple" speed="duration-1000" />`}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpinnerDemo;