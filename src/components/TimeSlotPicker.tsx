import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface TimeSlotPickerProps {
  value: string;
  onChange: (value: string) => void;
}

const DEFAULT_SLOTS = [
  "08:00", "09:00", "10:00", "11:00",
  "13:00", "14:00", "15:00", "16:00", "17:00",
];

export default function TimeSlotPicker({ value, onChange }: TimeSlotPickerProps) {
  const [custom, setCustom] = useState<boolean>(false);

  const handleSelect = (slot: string) => {
    setCustom(false);
    onChange(slot);
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
        {DEFAULT_SLOTS.map((slot) => (
          <Button
            key={slot}
            type="button"
            variant={value === slot ? "default" : "outline"}
            className="w-full"
            onClick={() => handleSelect(slot)}
            aria-pressed={value === slot}
            aria-label={`Selecionar horário ${slot}`}
          >
            {slot}
          </Button>
        ))}
        <Button
          type="button"
          variant={custom ? "default" : "outline"}
          className="w-full"
          onClick={() => {
            setCustom(true);
            if (!value) onChange("09:00");
          }}
          aria-pressed={custom}
          aria-label="Inserir outro horário"
        >
          Outro...
        </Button>
      </div>

      {custom && (
        <div className="flex items-center gap-2">
          <Input
            id="preferred_time"
            type="time"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="flex-1"
          />
          <Button type="button" onClick={() => setCustom(false)} variant="secondary">
            OK
          </Button>
        </div>
      )}
    </div>
  );
}
