import React, { useState, useRef, useEffect } from 'react';

const WhatsAppButton = () => {
  const phoneNumber = '9545235223';
  const message = encodeURIComponent('Hi RestroBazaar Team,\nI want to know more about your packaging products for my business.\nPlease assist me.');
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`;

  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hasMoved, setHasMoved] = useState(false);
  const buttonRef = useRef(null);

  // Initialize position based on screen size
  useEffect(() => {
    const updatePosition = () => {
      const isMobile = window.innerWidth < 768;
      const buttonSize = isMobile ? 48 : 56; // Approximate button size
      
      if (isMobile) {
        // Mobile: position above bottom nav (80px from bottom, 16px from right)
        setPosition({ 
          x: window.innerWidth - buttonSize - 16, 
          y: window.innerHeight - 80 
        });
      } else {
        // Desktop: bottom-right corner
        setPosition({ 
          x: window.innerWidth - buttonSize - 24, 
          y: window.innerHeight - buttonSize - 24 
        });
      }
    };

    updatePosition();
    
    // Update on window resize
    window.addEventListener('resize', updatePosition);
    return () => window.removeEventListener('resize', updatePosition);
  }, []);

  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsDragging(true);
    setHasMoved(false);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  const handleTouchStart = (e) => {
    const touch = e.touches[0];
    setIsDragging(true);
    setHasMoved(false);
    setDragStart({
      x: touch.clientX - position.x,
      y: touch.clientY - position.y,
    });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    
    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;
    
    // Check if user actually moved (more than 5px)
    const moved = Math.abs(e.clientX - (position.x + dragStart.x)) > 5 || 
                  Math.abs(e.clientY - (position.y + dragStart.y)) > 5;
    if (moved) setHasMoved(true);
    
    // Constrain to viewport bounds
    const buttonWidth = buttonRef.current?.offsetWidth || 48;
    const buttonHeight = buttonRef.current?.offsetHeight || 48;
    const maxX = window.innerWidth - buttonWidth;
    const maxY = window.innerHeight - buttonHeight;
    
    setPosition({
      x: Math.max(0, Math.min(newX, maxX)),
      y: Math.max(0, Math.min(newY, maxY)),
    });
  };

  const handleTouchMove = (e) => {
    if (!isDragging) return;
    e.preventDefault();
    
    const touch = e.touches[0];
    const newX = touch.clientX - dragStart.x;
    const newY = touch.clientY - dragStart.y;
    
    // Check if user actually moved (more than 5px)
    const moved = Math.abs(touch.clientX - (position.x + dragStart.x)) > 5 || 
                  Math.abs(touch.clientY - (position.y + dragStart.y)) > 5;
    if (moved) setHasMoved(true);
    
    // Constrain to viewport bounds
    const buttonWidth = buttonRef.current?.offsetWidth || 48;
    const buttonHeight = buttonRef.current?.offsetHeight || 48;
    const maxX = window.innerWidth - buttonWidth;
    const maxY = window.innerHeight - buttonHeight;
    
    setPosition({
      x: Math.max(0, Math.min(newX, maxX)),
      y: Math.max(0, Math.min(newY, maxY)),
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('touchmove', handleTouchMove, { passive: false });
      document.addEventListener('touchend', handleTouchEnd);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
      };
    }
  }, [isDragging, dragStart, position]);

  const handleClick = (e) => {
    // Only open WhatsApp if we didn't drag
    if (!hasMoved) {
      window.open(whatsappUrl, '_blank');
    }
    setHasMoved(false);
  };

  // Don't render if position is not initialized
  if (position.x === 0 && position.y === 0) {
    return null;
  }

  return (
    <div
      ref={buttonRef}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      onClick={handleClick}
      className={`hidden md:block fixed z-50 group select-none ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: 'translate(0, 0)',
      }}
      title="Drag to move or click to contact on WhatsApp"
    >
      <div className={`bg-green-500 hover:bg-green-600 rounded-full p-2 md:p-3 shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center ${isDragging ? 'scale-110' : 'hover:scale-110'}`}>
        <svg
          className="w-5 h-5 md:w-6 md:h-6 text-white"
          fill="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
        </svg>
      </div>
      <div className="absolute bottom-full right-0 mb-2 px-2 py-1 md:px-3 md:py-1 bg-gray-800 text-white text-xs md:text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap pointer-events-none">
        Get Early Access
      </div>
    </div>
  );
};

export default WhatsAppButton;
