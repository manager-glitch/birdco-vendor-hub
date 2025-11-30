import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SignatureCanvas } from "./SignatureCanvas";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CheckCircle, FileText } from "lucide-react";

interface ContractSigningDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  userRole: string;
  onContractSigned: () => void;
}

export const ContractSigningDialog = ({
  open,
  onOpenChange,
  userId,
  userRole,
  onContractSigned,
}: ContractSigningDialogProps) => {
  const [step, setStep] = useState<"review" | "sign">("review");
  const [loading, setLoading] = useState(false);

  const contractText = `
VENDOR/CHEF SERVICE AGREEMENT

This agreement is made on ${new Date().toLocaleDateString()} between:

Bird & Co. ("Company")
and
The undersigned Vendor/Chef ("Service Provider")

TERMS AND CONDITIONS:

1. SERVICE PROVISION
The Service Provider agrees to provide food services as requested by the Company for various events and opportunities.

2. COMPLIANCE
The Service Provider agrees to maintain all required certifications, licenses, and insurance throughout the term of this agreement.

3. QUALITY STANDARDS
All food and services provided must meet health and safety standards as outlined by local regulations.

4. PAYMENT TERMS
Payment terms will be agreed upon for each individual event or opportunity.

5. TERMINATION
Either party may terminate this agreement with 30 days written notice.

[Additional terms will be provided by the administrator]

By signing below, you acknowledge that you have read, understood, and agree to be bound by the terms of this agreement.
  `.trim();

  const handleSignatureComplete = async (signatureDataUrl: string) => {
    setLoading(true);
    try {
      // Convert data URL to blob
      const response = await fetch(signatureDataUrl);
      const blob = await response.blob();

      // Create a canvas to combine contract text and signature
      const canvas = document.createElement("canvas");
      canvas.width = 800;
      canvas.height = 1000;
      const ctx = canvas.getContext("2d");

      if (!ctx) throw new Error("Could not get canvas context");

      // White background
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw contract text
      ctx.fillStyle = "#000000";
      ctx.font = "12px Arial";
      const lines = contractText.split("\n");
      let y = 40;
      lines.forEach((line) => {
        ctx.fillText(line, 40, y);
        y += 20;
      });

      // Draw signature
      const img = new Image();
      img.src = signatureDataUrl;
      await new Promise((resolve) => {
        img.onload = resolve;
      });
      ctx.drawImage(img, 150, y + 20, 500, 200);

      // Add signature line and details
      ctx.beginPath();
      ctx.moveTo(150, y + 10);
      ctx.lineTo(650, y + 10);
      ctx.stroke();
      ctx.font = "10px Arial";
      ctx.fillText("Signature", 150, y + 240);
      ctx.fillText(`Date: ${new Date().toLocaleDateString()}`, 400, y + 240);
      ctx.fillText(`Time: ${new Date().toLocaleTimeString()}`, 400, y + 255);

      // Convert to blob
      const finalBlob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => resolve(blob!), "image/png");
      });

      // Upload to Supabase Storage
      const fileName = `signed_contract_${Date.now()}.png`;
      const filePath = `${userId}/signed_contract.png`;

      const { error: uploadError } = await supabase.storage
        .from("vendor-documents")
        .upload(filePath, finalBlob, { upsert: true });

      if (uploadError) throw uploadError;

      // Save to vendor_documents table
      const { error: dbError } = await supabase.from("vendor_documents").upsert(
        {
          vendor_id: userId,
          document_type: "signed_contract",
          file_path: filePath,
          file_name: fileName,
        },
        { onConflict: "vendor_id,document_type" }
      );

      if (dbError) throw dbError;

      toast.success("Contract signed successfully!");
      onContractSigned();
      onOpenChange(false);
      setStep("review");
    } catch (error: any) {
      console.error("Error signing contract:", error);
      toast.error("Failed to sign contract");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {step === "review" ? "Review Contract" : "Sign Contract"}
          </DialogTitle>
          <DialogDescription>
            {step === "review"
              ? "Please read the contract carefully before signing"
              : "Draw your signature below to sign the contract"}
          </DialogDescription>
        </DialogHeader>

        {step === "review" ? (
          <div className="space-y-4">
            <ScrollArea className="h-[400px] border rounded-lg p-4">
              <div className="whitespace-pre-wrap text-sm font-mono">{contractText}</div>
            </ScrollArea>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button 
                onClick={() => {
                  console.log("Moving to sign step");
                  setStep("sign");
                }}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                I Agree, Continue to Sign
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="border rounded-lg p-4 bg-muted/50">
              <p className="text-sm text-muted-foreground mb-2">
                By signing below, you confirm that you have read and agree to the terms of this contract.
              </p>
              <p className="text-xs text-muted-foreground">
                Date: {new Date().toLocaleDateString()} | Time: {new Date().toLocaleTimeString()}
              </p>
            </div>
            <SignatureCanvas onSignatureComplete={handleSignatureComplete} />
            <div className="flex justify-end">
              <Button variant="outline" onClick={() => setStep("review")} disabled={loading}>
                Back to Contract
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
