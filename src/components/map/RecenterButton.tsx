import React from 'react';
import { Locate } from 'lucide-react';
import { Button } from '../ui/button';

interface RecenterButtonProps {
  onClick: () => void;
}

export default function RecenterButton({ onClick }: RecenterButtonProps) {
  return (
    <div className="absolute bottom-24 right-4 z-[9999]">
      <Button
        variant="secondary"
        size="icon"
        onClick={onClick}
        className="h-12 w-12 rounded-full shadow-xl bg-white hover:bg-gray-100 border-2 border-gray-200 transition-all duration-200 hover:scale-105"
      >
        <Locate className="h-6 w-6 text-gray-700" />
      </Button>
    </div>
  );
}