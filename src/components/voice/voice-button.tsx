"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useVoice } from "@/hooks/use-voice";
import { Mic, MicOff, Loader2, Check, X, Volume2 } from "lucide-react";

interface VoiceButtonProps {
  currentScreen?: string;
  onActionComplete?: () => void;
}

export function VoiceButton({
  currentScreen = "dashboard",
  onActionComplete,
}: VoiceButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const {
    isListening,
    isProcessing,
    isSupported,
    transcript,
    interimTranscript,
    result,
    error,
    startListening,
    stopListening,
    executeCommand,
    reset,
  } = useVoice(currentScreen);

  if (!isSupported) {
    return null;
  }

  const handleOpen = () => {
    setIsOpen(true);
    reset();
  };

  const handleClose = () => {
    if (isListening) {
      stopListening();
    }
    setIsOpen(false);
    reset();
  };

  const handleToggleListen = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const handleConfirm = async () => {
    await executeCommand(true);
    onActionComplete?.();
    setTimeout(() => handleClose(), 1500);
  };

  const handleCancel = async () => {
    await executeCommand(false);
    reset();
  };

  return (
    <>
      {/* Floating Voice Button */}
      <Button
        onClick={handleOpen}
        size="icon"
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg bg-gradient-to-br from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 z-40"
      >
        <Mic className="h-6 w-6" />
      </Button>

      {/* Voice Modal */}
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Volume2 className="h-5 w-5 text-primary" />
              Voice Command
            </DialogTitle>
          </DialogHeader>

          <div className="py-6 space-y-6">
            {/* Microphone Button */}
            <div className="flex justify-center">
              <button
                onClick={handleToggleListen}
                disabled={isProcessing}
                className={cn(
                  "w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300",
                  isListening
                    ? "bg-destructive text-white animate-pulse"
                    : "bg-primary text-primary-foreground hover:bg-primary/90",
                  isProcessing && "opacity-50 cursor-not-allowed",
                )}
              >
                {isProcessing ? (
                  <Loader2 className="h-10 w-10 animate-spin" />
                ) : isListening ? (
                  <MicOff className="h-10 w-10" />
                ) : (
                  <Mic className="h-10 w-10" />
                )}
              </button>
            </div>

            {/* Transcript Display */}
            <div className="min-h-[80px] p-4 rounded-lg bg-muted/50 text-center">
              {isListening && !transcript && !interimTranscript && (
                <p className="text-muted-foreground animate-pulse">
                  Listening...
                </p>
              )}
              {(transcript || interimTranscript) && (
                <p className="text-lg">
                  {transcript}
                  <span className="text-muted-foreground">
                    {interimTranscript}
                  </span>
                </p>
              )}
              {isProcessing && (
                <p className="text-muted-foreground">Processing...</p>
              )}
            </div>

            {/* Result Display */}
            {result && (
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-secondary/50">
                  <p className="text-sm font-medium mb-1">
                    {result.parsed?.intent === "add_expense" &&
                      "💸 New Expense"}
                    {result.parsed?.intent === "add_income" && "💰 New Income"}
                    {result.parsed?.intent === "add_savings" &&
                      "🐷 Savings Contribution"}
                    {result.parsed?.intent === "query_balance" &&
                      "📊 Balance Query"}
                  </p>
                  <p className="text-muted-foreground">
                    {result.message || result.parsed?.suggested_response}
                  </p>
                </div>

                {result.status === "needs_confirmation" && (
                  <div className="flex gap-2 justify-center">
                    <Button
                      variant="outline"
                      onClick={handleCancel}
                      disabled={isProcessing}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Cancel
                    </Button>
                    <Button onClick={handleConfirm} disabled={isProcessing}>
                      {isProcessing ? (
                        <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                      ) : (
                        <Check className="h-4 w-4 mr-1" />
                      )}
                      Confirm
                    </Button>
                  </div>
                )}

                {result.status === "success" && (
                  <div className="flex justify-center">
                    <div className="flex items-center gap-2 text-success">
                      <Check className="h-5 w-5" />
                      <span>Done!</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Error Display */}
            {error && (
              <p className="text-center text-destructive text-sm">{error}</p>
            )}

            {/* Instructions */}
            {!isListening && !result && !error && (
              <p className="text-center text-sm text-muted-foreground">
                Tap the microphone and speak your command
                <br />
                <span className="text-xs">
                  Example: "Gasté 5000 pesos en el super"
                </span>
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
