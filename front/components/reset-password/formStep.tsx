import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

type FormStepProps = {
  label: string;
  type?: string;
  value: string;
  placeholder_first?: string;
  placeholder_second?: string;
  onChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;

  buttonText: string;
  loading?: boolean;

  secondLabel?: string;
  secondValue?: string;
  onSecondChange?: (value: string) => void;
};

export function FormStep({
  label,
  type = "text",
  value,
  placeholder_first,
  placeholder_second,
  onChange,
  onSubmit,
  buttonText,
  loading,
  secondLabel,
  secondValue,
  onSecondChange,
}: FormStepProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>{label}</Label>
        <Input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required
          placeholder={placeholder_first}
        />
      </div>

      {secondLabel && onSecondChange && (
        <div className="space-y-2">
          <Label>{secondLabel}</Label>
          <Input
            type="password"
            value={secondValue}
            onChange={(e) => onSecondChange(e.target.value)}
            required
            placeholder={placeholder_second}
          />
        </div>
      )}

      <Button className="w-full cursor-pointer" disabled={loading}>
        {loading ? "Завантаження..." : buttonText}
      </Button>
    </form>
  );
}
