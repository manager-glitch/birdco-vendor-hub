import { useEffect, useRef, useState } from "react";
import { Canvas as FabricCanvas } from "fabric";
import { Button } from "@/components/ui/button";
import { Eraser, Undo2 } from "lucide-react";

interface SignatureCanvasProps {
  onSignatureComplete: (dataUrl: string) => void;
}

export const SignatureCanvas = ({ onSignatureComplete }: SignatureCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fabricCanvas, setFabricCanvas] = useState<FabricCanvas | null>(null);

  useEffect(() => {
    if (!canvasRef.current) {
      console.log("Canvas ref not ready");
      return;
    }

    try {
      console.log("Initializing Fabric canvas");
      const canvas = new FabricCanvas(canvasRef.current, {
        width: 500,
        height: 200,
        backgroundColor: "#ffffff",
        isDrawingMode: true,
      });

      if (canvas.freeDrawingBrush) {
        canvas.freeDrawingBrush.color = "#000000";
        canvas.freeDrawingBrush.width = 2;
      }

      setFabricCanvas(canvas);
      console.log("Fabric canvas initialized successfully");

      return () => {
        console.log("Disposing Fabric canvas");
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
    <div className="space-y-4">
      <div className="border-2 border-muted rounded-lg overflow-hidden bg-white">
        <canvas ref={canvasRef} />
      </div>
      <div className="flex gap-2 justify-end">
        <Button variant="outline" size="sm" onClick={handleClear}>
          <Eraser className="h-4 w-4 mr-2" />
          Clear
        </Button>
        <Button size="sm" onClick={handleSave}>
          Save Signature
        </Button>
      </div>
    </div>
  );
};
