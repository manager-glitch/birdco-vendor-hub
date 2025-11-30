import { useEffect, useRef, useState } from "react";
import { Canvas as FabricCanvas, PencilBrush } from "fabric";
import { Button } from "@/components/ui/button";
import { Eraser } from "lucide-react";

interface SignatureCanvasProps {
  onSignatureComplete: (dataUrl: string) => void;
}

export const SignatureCanvas = ({ onSignatureComplete }: SignatureCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [fabricCanvas, setFabricCanvas] = useState<FabricCanvas | null>(null);

  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) {
      console.log("Canvas ref not ready");
      return;
    }

    try {
      console.log("Initializing Fabric canvas");
      
      // Get container width for responsive sizing
      const containerWidth = containerRef.current.offsetWidth;
      const canvasWidth = Math.min(containerWidth - 32, 600);
      const canvasHeight = 250;

      // Create canvas WITHOUT drawing mode first
      const canvas = new FabricCanvas(canvasRef.current, {
        width: canvasWidth,
        height: canvasHeight,
        backgroundColor: "#ffffff",
        isDrawingMode: false,
      });

      // Create and configure the brush explicitly
      const brush = new PencilBrush(canvas);
      brush.color = "#000000";
      brush.width = 4;
      canvas.freeDrawingBrush = brush;

      console.log("Brush created:", {
        color: brush.color,
        width: brush.width,
        brushType: brush.constructor.name
      });

      // NOW enable drawing mode
      canvas.isDrawingMode = true;

      console.log("Drawing mode enabled:", canvas.isDrawingMode);

      // Log drawing events
      canvas.on('path:created', (e) => {
        console.log("Path created!", e);
      });

      // Enable touch scrolling prevention
      const canvasElement = canvasRef.current;
      const preventScroll = (e: TouchEvent) => {
        console.log("Touch event:", e.type);
        e.preventDefault();
      };
      
      canvasElement.addEventListener('touchstart', preventScroll, { passive: false });
      canvasElement.addEventListener('touchmove', preventScroll, { passive: false });

      setFabricCanvas(canvas);
      console.log("Canvas ready for drawing");

      // Handle window resize
      const handleResize = () => {
        if (!containerRef.current) return;
        const newWidth = Math.min(containerRef.current.offsetWidth - 32, 600);
        canvas.setDimensions({ width: newWidth, height: canvasHeight });
        canvas.renderAll();
      };

      window.addEventListener('resize', handleResize);

      return () => {
        console.log("Disposing Fabric canvas");
        window.removeEventListener('resize', handleResize);
        canvasElement.removeEventListener('touchstart', preventScroll);
        canvasElement.removeEventListener('touchmove', preventScroll);
        canvas.dispose();
      };
    } catch (error) {
      console.error("Error initializing Fabric canvas:", error);
    }
  }, []);

  const handleClear = () => {
    if (!fabricCanvas) return;
    fabricCanvas.clear();
    fabricCanvas.backgroundColor = "#ffffff";
    fabricCanvas.renderAll();
  };

  const handleSave = () => {
    if (!fabricCanvas) return;
    const dataUrl = fabricCanvas.toDataURL({
      format: "png",
      quality: 1,
      multiplier: 2,
    });
    onSignatureComplete(dataUrl);
  };

  return (
    <div ref={containerRef} className="space-y-4 w-full">
      <div className="text-center mb-2">
        <p className="text-sm text-muted-foreground">
          Sign below using your finger or mouse
        </p>
      </div>
      <div className="border-2 border-muted rounded-lg overflow-hidden bg-white" style={{ touchAction: 'none' }}>
        <canvas ref={canvasRef} className="w-full" style={{ display: 'block' }} />
      </div>
      <div className="flex gap-2 justify-end flex-wrap">
        <Button variant="outline" size="default" onClick={handleClear} className="flex-1 sm:flex-none">
          <Eraser className="h-4 w-4 mr-2" />
          Clear
        </Button>
        <Button size="default" onClick={handleSave} className="flex-1 sm:flex-none">
          Save Signature
        </Button>
      </div>
    </div>
  );
};
