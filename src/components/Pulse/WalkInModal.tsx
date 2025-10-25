"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/ui-components/dialog";
import { Button } from "@/ui-components/button";
import { Input } from "@/ui-components/input";
import { UserPlus, Loader2, Mail, Phone, MapPin, FileText } from "lucide-react";
import { toast } from "sonner";

interface WalkInModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (walkInData: WalkInData) => Promise<void>;
  barcodeValue?: string;
}

export interface WalkInData {
  name: string;
  email?: string;
  phone?: string;
  group?: string;
  notes?: string;
  barcode?: string;
}

export function WalkInModal({
  open,
  onOpenChange,
  onSubmit,
  barcodeValue
}: WalkInModalProps) {
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<WalkInData>({
    name: "",
    email: "",
    phone: "",
    group: "",
    notes: "",
    barcode: barcodeValue || ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error("Name is required");
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit(formData);
      toast.success("Walk-in added successfully!");
      
      // Reset form
      setFormData({
        name: "",
        email: "",
        phone: "",
        group: "",
        notes: "",
        barcode: ""
      });
      
      onOpenChange(false);
    } catch (error) {
      console.error("Error adding walk-in:", error);
      toast.error(error instanceof Error ? error.message : "Failed to add walk-in");
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (field: keyof WalkInData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="bg-orange-100 p-2 rounded-lg">
              <UserPlus className="h-5 w-5 text-orange-600" />
            </div>
            Add Walk-In
          </DialogTitle>
          <DialogDescription>
            Add someone who arrived without an RSVP
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name (Required) */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
              <span>Name</span>
              <span className="text-red-500">*</span>
            </label>
            <Input
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
              placeholder="Enter full name"
              required
              disabled={submitting}
              className="w-full"
            />
          </div>

          {/* Email (Optional) */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
              <Mail className="h-4 w-4 text-gray-400" />
              <span>Email</span>
              <span className="text-xs text-gray-400">(optional)</span>
            </label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => handleChange("email", e.target.value)}
              placeholder="email@example.com"
              disabled={submitting}
              className="w-full"
            />
          </div>

          {/* Phone (Optional) */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
              <Phone className="h-4 w-4 text-gray-400" />
              <span>Phone</span>
              <span className="text-xs text-gray-400">(optional)</span>
            </label>
            <Input
              type="tel"
              value={formData.phone}
              onChange={(e) => handleChange("phone", e.target.value)}
              placeholder="(555) 123-4567"
              disabled={submitting}
              className="w-full"
            />
          </div>

          {/* Group/Category (Optional) */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
              <MapPin className="h-4 w-4 text-gray-400" />
              <span>School/Group</span>
              <span className="text-xs text-gray-400">(optional)</span>
            </label>
            <Input
              value={formData.group}
              onChange={(e) => handleChange("group", e.target.value)}
              placeholder="Organization or group name"
              disabled={submitting}
              className="w-full"
            />
          </div>

          {/* Notes (Optional) */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
              <FileText className="h-4 w-4 text-gray-400" />
              <span>Notes</span>
              <span className="text-xs text-gray-400">(optional)</span>
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleChange("notes", e.target.value)}
              placeholder="Any additional information..."
              disabled={submitting}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Scanned Barcode (if available) */}
          {barcodeValue && (
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500 font-medium mb-1">Scanned Barcode</p>
              <p className="text-sm font-mono text-gray-900">{barcodeValue}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting || !formData.name.trim()}
              className="flex-1 bg-orange-600 hover:bg-orange-700 text-white"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add Walk-In
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
