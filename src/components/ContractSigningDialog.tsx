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

  const contractText = `Bird & Co Events Ltd Vendor Terms & Conditions

Last Updated: 11 January 2026

These Vendor Terms & Conditions ("Terms") govern the contractual relationship between Bird & Co Events Ltd, a company incorporated in England and Wales ("Bird & Co", "we", "us", "our"), and the vendor entity or individual accepting these Terms ("Vendor", "you", "your").

By electronically accepting these Terms via the Bird & Co platform or mobile application (the "Platform"), you confirm that you have read, understood and agree to be legally bound by them.


1. About Bird & Co

Bird & Co operates a curated events and hospitality platform connecting clients with approved food, drink and hospitality vendors for private, public and corporate events.


2. Eligibility & Registration

2.1 You must be at least eighteen (18) years old and legally authorised to operate the business you represent.

2.2 You confirm that all information provided during registration is true, accurate and kept up to date.

2.3 Bird & Co reserves the right, at its sole discretion, to approve, reject, suspend or remove any vendor from the Platform.


3. Term

3.1 These Terms commence on the date of electronic acceptance and remain in force until terminated in accordance with Section 12.


4. Vendor Obligations

You agree that you shall:

4.1 Perform all services and supply all goods to a professional standard consistent with Bird & Co's brand, event requirements and industry best practice.

4.2 Comply with all applicable laws, regulations, licences and industry standards, including health & safety, food hygiene, trading standards and employment law.

4.3 Ensure that all staff engaged by you are properly trained, professional and suitably presented.

4.4 Attend events punctually and comply with all instructions, schedules, site rules and client requirements communicated by Bird & Co.

4.5 Provide all equipment, stock and materials required to deliver your services unless otherwise expressly agreed in writing.

4.6 Act at all times as an independent contractor. Nothing in these Terms creates any partnership, joint venture, agency or employment relationship between you and Bird & Co.


5. Fees, Commission & Payment

5.1 Bird & Co may charge commission, platform fees or participation fees as agreed per booking or event.

5.2 Applicable fees and commission rates will be displayed within the Platform or confirmed in writing.

5.3 Subject to receipt of payment from the client, payments to vendors shall be processed within fourteen (14) days following completion of the relevant event.

5.4 Bird & Co reserves the right to withhold, deduct or offset sums reasonably required to cover refunds, complaints, chargebacks, damages or losses arising from your services or breach of these Terms.

5.5 Bird & Co shall not be liable for non-payment resulting from client default or cancellation.

5.6 Where applicable, you shall provide a valid VAT invoice prior to payment.


6. Insurance, Indemnity & Liability

6.1 You must maintain, at a minimum, throughout the Term:
• Public Liability Insurance of not less than £5,000,000 per claim
• Employers' Liability Insurance where required by law

6.2 Proof of current insurance must be uploaded to the Platform and kept up to date.

6.3 You shall fully indemnify and hold harmless Bird & Co against all claims, losses, liabilities, damages, costs and expenses arising from:
• your services or goods;
• your staff or contractors;
• your equipment or materials; or
• your breach of these Terms.

6.4 To the fullest extent permitted by law, Bird & Co shall not be liable for any indirect, consequential or economic loss including loss of profit, revenue or reputation.

6.5 Bird & Co's total liability in respect of any booking or event shall not exceed the fees actually received by Bird & Co for that booking.


7. Health, Safety & Compliance

7.1 You shall comply with all health, safety and legal requirements at all times.

7.2 Alcohol may only be supplied where you hold all required licences and permissions.

7.3 Bird & Co may remove or suspend you from an event for non-compliance, without compensation.

7.4 Where Bird & Co reasonably believes service delivery or compliance is at risk, it may appoint an alternative vendor and recover associated costs from you.


8. Vendor Cancellation & Failure to Perform

8.1 You must not cancel or materially alter your services without Bird & Co's prior written consent.

8.2 In the event of cancellation, no-show, late arrival or material failure to perform, Bird & Co may:
• withhold payment;
• recover replacement costs;
• recover refunds issued to clients; and
• remove you from the Platform.


9. Branding, Content & Marketing

9.1 You retain ownership of your intellectual property and brand assets.

9.2 You grant Bird & Co a non-exclusive, royalty-free, worldwide licence to use your name, logo, images and descriptions for Platform display, marketing and promotional purposes.

9.3 This licence shall survive termination in respect of materials already created or published.


10. Data Protection

10.1 Both parties shall comply with the UK GDPR and the Data Protection Act 2018.

10.2 You must not collect, store or use client or guest data except strictly as necessary to fulfil bookings.

10.3 You must not use client data for marketing, remarketing or future bookings outside of Bird & Co.


11. Non-Circumvention & Non-Solicitation

11.1 Bird & Co introduces vendors to clients, venues, partners and event opportunities ("Introduced Parties").

11.2 Bird & Co shall be deemed the introducing party for all business originating through the Platform, website, marketing, events or communications.

11.3 During the Term and for twelve (12) months after termination, you shall not, directly or indirectly:
• solicit or contract with an Introduced Party outside of Bird & Co;
• accept repeat business or referrals without Bird & Co's written consent;
• take any action intended to bypass Bird & Co's role or fees.

11.4 Any enquiry or repeat booking from an Introduced Party must be referred back to Bird & Co.

11.5 Breach of this section entitles Bird & Co to recover its commission, charge a circumvention fee equal to its standard commission, and seek damages or injunctive relief.


12. Suspension & Termination

12.1 Bird & Co may suspend or terminate your account immediately for breach, legal non-compliance or reputational risk.

12.2 You may terminate via the Platform subject to completion of existing bookings and obligations.

12.3 Termination shall not affect accrued rights or continuing obligations.

12.4 Sections 6, 9, 10, 11 and 13 shall survive termination.


13. Confidentiality

You shall keep confidential all non-public commercial, client, pricing and event information relating to Bird & Co. This obligation shall continue indefinitely.


14. Force Majeure

Neither party shall be liable for failure or delay caused by events beyond reasonable control, provided reasonable steps are taken to mitigate impact.


15. Governing Law

These Terms are governed by the laws of England and Wales. The courts of England and Wales shall have exclusive jurisdiction.


16. Electronic Acceptance

By accepting these Terms electronically, you confirm that:
• you have authority to bind the business you represent;
• you agree to be legally bound by these Terms; and
• electronic acceptance constitutes a valid and binding agreement under UK law.

Date of Acceptance: ${new Date().toLocaleDateString()}
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
      <DialogContent className="max-w-3xl max-h-[90vh] w-[95vw] sm:w-full">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
            <FileText className="h-4 w-4 sm:h-5 sm:w-5" />
            {step === "review" ? "Review Contract" : "Sign Contract"}
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            {step === "review"
              ? "Please read the contract carefully before signing"
              : "Draw your signature below to sign the contract"}
          </DialogDescription>
        </DialogHeader>

        {step === "review" ? (
          <div className="space-y-4">
            <ScrollArea className="h-[50vh] sm:h-[400px] border rounded-lg p-3 sm:p-4">
              <div className="whitespace-pre-wrap text-xs sm:text-sm font-mono">{contractText}</div>
            </ScrollArea>
            <div className="flex flex-col sm:flex-row justify-end gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
                Cancel
              </Button>
              <Button 
                onClick={() => {
                  console.log("Moving to sign step");
                  setStep("sign");
                }}
                className="w-full sm:w-auto"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                I Agree, Continue to Sign
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="border rounded-lg p-3 sm:p-4 bg-muted/50">
              <p className="text-xs sm:text-sm text-muted-foreground mb-2">
                By signing below, you confirm that you have read and agree to the terms of this contract.
              </p>
              <p className="text-xs text-muted-foreground">
                Date: {new Date().toLocaleDateString()} | Time: {new Date().toLocaleTimeString()}
              </p>
            </div>
            <SignatureCanvas onSignatureComplete={handleSignatureComplete} />
            <div className="flex justify-end">
              <Button 
                variant="outline" 
                onClick={() => setStep("review")} 
                disabled={loading}
                className="w-full sm:w-auto"
              >
                Back to Contract
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
