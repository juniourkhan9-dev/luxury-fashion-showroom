import React from 'react';
import { Info } from 'lucide-react';

export type StoreSectionTab = 'Store' | 'Clothing' | 'Caps' | 'Bags' | 'Shoes';

export interface SectionSpot {
  id: StoreSectionTab;
  name: string;
  cameraPos: [number, number, number];
  cameraTarget: [number, number, number];
}

export const STORE_SECTIONS: SectionSpot[] = [
  {
    id: 'Clothing',
    name: 'Clothing',
    cameraPos: [0.35, 1.70, 3.8],
    cameraTarget: [0.35, 1.80, 0],
  },
  {
    id: 'Store',
    name: 'Store',
    cameraPos: [-4.2, 1.70, 5.0],
    cameraTarget: [-7.5, 1.40, 5.0],
  },
  {
    id: 'Bags',
    name: 'Bags',
    cameraPos: [-4.2, 1.70, 5.0],
    cameraTarget: [-7.5, 1.40, 5.0],
  },
  {
    id: 'Caps',
    name: 'Caps',
    cameraPos: [4.2, 1.70, 5.0],
    cameraTarget: [7.5, 1.20, 5.0],
  },
  {
    id: 'Shoes',
    name: 'Shoes',
    cameraPos: [4.2, 1.70, 5.0],
    cameraTarget: [7.5, 1.20, 5.0],
  },
];

interface NavigationDockProps {
  activeTab: StoreSectionTab;
  onSelectTab: (tab: StoreSectionTab) => void;
  onOpenInfo: () => void;
}

export const NavigationDock: React.FC<NavigationDockProps> = ({
  activeTab,
  onSelectTab,
  onOpenInfo,
}) => {
  const tabs: StoreSectionTab[] = ['Store', 'Clothing', 'Caps', 'Bags', 'Shoes'];

  return (
    <nav
      aria-label="Store Navigation Bar"
      className="fixed bottom-7 left-1/2 -translate-x-1/2 z-30 pointer-events-auto"
    >
      {/* Sleek Frosted Rounded Pill Dock Matching Exact Reference Video frame_008.jpg & frame_003.jpg */}
      <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-white/70 backdrop-blur-xl shadow-xl border border-black/5 text-zinc-700">
        {tabs.map((tab) => {
          const isActive = activeTab === tab;

          return (
            <button
              key={tab}
              onClick={() => onSelectTab(tab)}
              className={`px-4 py-1.5 rounded-full text-xs font-sans tracking-tight transition-all duration-300 font-medium cursor-pointer ${
                isActive
                  ? 'bg-[#222328] text-white shadow-md font-semibold'
                  : 'hover:text-black hover:bg-black/5 text-zinc-600'
              }`}
            >
              {tab}
            </button>
          );
        })}

        {/* Info button 'i' on right of pill dock */}
        <button
          onClick={onOpenInfo}
          aria-label="Showroom Information and Controls"
          className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-black/5 text-zinc-600 hover:text-black transition-colors ml-0.5 cursor-pointer"
          title="Information & Controls"
        >
          <Info className="w-3.5 h-3.5" />
        </button>
      </div>
    </nav>
  );
};
