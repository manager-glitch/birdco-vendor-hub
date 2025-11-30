import { useEffect, useRef, useState } from "react";
import { Canvas as FabricCanvas } from "fabric";
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
      const canvasWidth = Math.min(containerWidth - 32, 600); // Max 600px, with padding
      const canvasHeight = 250;

      const canvas = new FabricCanvas(canvasRef.current, {
        width: canvasWidth,
        height: canvasHeight,
        backgroundColor: "#ffffff",
        isDrawingMode: true,
      });

      if (canvas.freeDrawingBrush) {
        canvas.freeDrawingBrush.color = "#000000";
        canvas.freeDrawingBrush.width = 3;
      }

      setFabricCanvas(canvas);
      console.log("Fabric canvas initialized successfully", { canvasWidth, canvasHeight });

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
      <div className="border-2 border-muted rounded-lg overflow-hidden bg-white touch-none">
        <canvas ref={canvasRef} className="w-full" />
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
