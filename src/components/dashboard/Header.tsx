import { Settings, X, HeartPulse, CircleUserRound } from "lucide-react";

interface HeaderProps {
  isSettingsOpen: boolean;
  setIsSettingsOpen: (open: boolean) => void;
}

export default function Header({
  isSettingsOpen,
  setIsSettingsOpen,
}: HeaderProps) {
  return (
    <header className="bg-blue-700 text-white p-4 shadow-md ">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center space-x-2">         
          <HeartPulse className="h-8 w-8" />
          <h1 className="text-2xl font-bold">Medlex+</h1>
        </div>
        <div className="flex items-centre space-x-10" >
          
        <button
          onClick={() => setIsSettingsOpen(!isSettingsOpen)}
          className="p rounded-full hover:bg-blue-700 transition-colors"
          aria-label={isSettingsOpen ? "Close settings" : "Open settings"}
        >
          {isSettingsOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Settings className="h-6 w-6" />
          )}
        </button>
        <CircleUserRound  className="h-6 w-6"/>  
        </div>
        
      </div>
   
    </header>
  );
}
