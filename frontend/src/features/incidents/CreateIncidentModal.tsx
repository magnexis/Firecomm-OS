import React, { useEffect, useMemo, useState } from "react";
import type { IncidentPriority, User } from "../../types";

export interface IncidentFormSeed {
  title?: string;
  address?: string;
  priority?: IncidentPriority;
  notes?: string;
  sourceMessageId?: string;
  sourceMessagePreview?: string;
}

/**
 * CreateIncidentModal component
 * Collects incident data and optional message seed to emit creation event.
 */
interface CreateIncidentModalProps {
  open: boolean;
  onClose: () => void;
  units: User[];
  seed?: IncidentFormSeed | null;
  onSubmit: (payload: {
    title: string;
    address: string;
    priority: IncidentPriority;
    notes: string;
    unitsAssigned: string[];
    sourceMessageId?: string;
    sourceMessagePreview?: string;
  }) => Promise<void>;
}

const PRIORITY_OPTIONS: Array<{ value: IncidentPriority; label: string; color: string }> = [
  { value: "low", label: "Low", color: "bg-emerald-600/20 text-emerald-200 border-emerald-500/40" },
  { value: "medium", label: "Medium", color: "bg-amber-600/20 text-amber-200 border-amber-500/40" },
  { value: "high", label: "High", color: "bg-orange-600/20 text-orange-200 border-orange-500/40" },
  { value: "critical", label: "Critical", color: "bg-red-700/20 text-red-100 border-red-500/50" },
];

function seedToTitle(seed?: IncidentFormSeed | null): string {
  if (!seed?.title) return "";
  return seed.title;
}

export const CreateIncidentModal: React.FC<CreateIncidentModalProps> = ({
  open,
  onClose,
  units,
  seed,
  onSubmit,
}) => {
  const [title, setTitle] = useState("");
  const [address, setAddress] = useState("");
  const [priority, setPriority] = useState<IncidentPriority>("medium");
  const [notes, setNotes] = useState("");
  const [unitsAssigned, setUnitsAssigned] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;

    setTitle(seedToTitle(seed));
    setAddress(seed?.address || "");
    setPriority(seed?.priority || "medium");
    setNotes(seed?.notes || "");
    setUnitsAssigned([]);
  }, [open, seed]);

  const canSubmit = useMemo(() => title.trim().length > 0 && address.trim().length > 0 && !isSubmitting, [
    title,
    address,
    isSubmitting,
  ]);

  if (!open) return null;

  const handleToggleUnit = (unitId: string) => {
    setUnitsAssigned((current) =>
      current.includes(unitId) ? current.filter((entry) => entry !== unitId) : [...current, unitId]
    );
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSubmit) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        title: title.trim(),
        address: address.trim(),
        priority,
        notes: notes.trim(),
        unitsAssigned,
        sourceMessageId: seed?.sourceMessageId,
        sourceMessagePreview: seed?.sourceMessagePreview,
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-2xl max-h-[92vh] overflow-y-auto border border-[#243248] bg-[#0a121f] shadow-2xl"
      >
        <div className="px-5 py-4 border-b border-[#243248] flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-white tracking-wide">Create Incident</h3>
            <p className="text-xs text-dark-400">Dispatch and stations can create live incidents.</p>
          </div>
          <button type="button" onClick={onClose} className="text-dark-400 hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-dark-300 uppercase tracking-wider mb-1.5">Title</label>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Structure Fire"
              className="input-field w-full"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-dark-300 uppercase tracking-wider mb-1.5">Address</label>
            <input
              value={address}
              onChange={(event) => setAddress(event.target.value)}
              placeholder="123 Main St"
              className="input-field w-full"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-dark-300 uppercase tracking-wider mb-1.5">Priority</label>
            <div className="grid grid-cols-4 gap-2">
              {PRIORITY_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setPriority(option.value)}
                  className={`px-2 py-2 text-xs border transition-colors ${
                    priority === option.value
                      ? option.color
                      : "bg-dark-900 text-dark-300 border-dark-700 hover:bg-dark-800"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-dark-300 uppercase tracking-wider mb-1.5">Notes</label>
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={3}
              placeholder="Hydrants available on north side, smoke visible from roof..."
              className="input-field w-full resize-y"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-dark-300 uppercase tracking-wider mb-1.5">Assign Units</label>
            <div className="max-h-40 overflow-y-auto border border-dark-700 bg-dark-900/70 p-2 grid grid-cols-2 gap-2">
              {units.map((unit) => (
                <button
                  type="button"
                  key={unit.id}
                  onClick={() => handleToggleUnit(unit.id)}
                  className={`text-left px-2 py-1.5 border text-xs transition-colors ${
                    unitsAssigned.includes(unit.id)
                      ? "bg-fire-700/20 border-fire-500/50 text-fire-100"
                      : "border-dark-700 bg-dark-900 text-dark-300 hover:bg-dark-800"
                  }`}
                >
                  <p className="font-semibold text-white">{unit.name}</p>
                  <p className="text-[10px] text-dark-400">{unit.station}</p>
                </button>
              ))}
              {units.length === 0 && <p className="text-xs text-dark-500 px-1">No units online</p>}
            </div>
          </div>
        </div>

        <div className="px-5 py-4 border-t border-[#243248] flex justify-end gap-2">
          <button type="button" className="btn-secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={!canSubmit}>
            {isSubmitting ? "Creating..." : "Create Incident"}
          </button>
        </div>
      </form>
    </div>
  );
};
