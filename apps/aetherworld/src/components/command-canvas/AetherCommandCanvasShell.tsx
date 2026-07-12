import { useEffect, useState } from "react";
import { AetherTopBar } from "./AetherTopBar";
import { AetherPrimarySidebar } from "./AetherPrimarySidebar";
import { AetherCommandCenter } from "./AetherCommandCenter";
import { AetherCanvasWorkspace } from "./AetherCanvasWorkspace";
import { AetherObjectInspector } from "./AetherObjectInspector";
import { AetherRunsPanel } from "./AetherRunsPanel";
import { AetherCapabilityDock } from "./AetherCapabilityDock";
import { AetherCommandPalette } from "./AetherCommandPalette";
import { AetherLegacyRouteDrawer } from "./AetherLegacyRouteDrawer";
import { AetherQuickActions } from "./AetherQuickActions";
import { DEFAULT_UI_MODE, type AetherUiModeId } from "@/constants/command-canvas/aetherUiModes";
import { getRecentObjects } from "@/lib/command-canvas/recentObjectsEngine";

export function AetherCommandCanvasShell() {
  const [uiMode, setUiMode] = useState<AetherUiModeId>(DEFAULT_UI_MODE);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [legacyOpen, setLegacyOpen] = useState(false);
  const [selectedObjectId, setSelectedObjectId] = useState<string | undefined>();
  const [refreshTick, setRefreshTick] = useState(0);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const recent = getRecentObjects();
  const current = recent.find((r) => r.id === selectedObjectId) ?? recent[0];
  const isFocus = uiMode === "FOCUS_MODE";

  return (
    <div className="flex h-[calc(100vh-3rem)] min-h-[600px] w-full flex-col">
      <AetherTopBar
        uiMode={uiMode}
        setUiMode={setUiMode}
        onOpenPalette={() => setPaletteOpen(true)}
        onOpenLegacy={() => setLegacyOpen(true)}
        objectTitle={current?.title}
        objectType={current?.type}
      />
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {!isFocus && <AetherPrimarySidebar />}
        <div className="flex flex-1 min-w-0 flex-col gap-3 overflow-auto p-3">
          <AetherQuickActions />
          <div className="grid flex-1 grid-cols-1 gap-3 lg:grid-cols-[1.4fr_1fr]">
            <div className="flex flex-col gap-3 min-w-0">
              <AetherCommandCenter onResult={() => { setRefreshTick((t) => t + 1); }} />
              <AetherCanvasWorkspace
                key={`canvas-${refreshTick}`}
                selectedObjectId={selectedObjectId}
                onSelect={setSelectedObjectId}
              />
            </div>
            <div className="flex flex-col gap-3 min-w-0">
              <AetherCapabilityDock />
              {!isFocus && <AetherRunsPanel onSelect={(id) => setSelectedObjectId(id)} />}
            </div>
          </div>
        </div>
        {!isFocus && (
          <aside className="hidden w-80 shrink-0 border-l border-border/40 p-3 xl:block">
            <AetherObjectInspector objectId={current?.id} />
          </aside>
        )}
      </div>
      <AetherCommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
      <AetherLegacyRouteDrawer open={legacyOpen} onClose={() => setLegacyOpen(false)} />
    </div>
  );
}
