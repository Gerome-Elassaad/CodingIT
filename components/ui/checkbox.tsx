import * as React from "react"
import { Check } from "lucide-react"

import { cn } from "@/lib/utils"

export interface CheckboxProps {
  label?: string
  defaultChecked?: boolean
  disabled?: boolean
  className?: string
  onChange?: (checked: boolean) => void
}

const Checkbox = React.forwardRef<HTMLDivElement, CheckboxProps>(
  ({ label, defaultChecked = false, disabled = false, className, onChange }, ref) => {
    const [checked, setChecked] = React.useState(defaultChecked)

    const handleToggle = () => {
      if (!disabled) {
        const newChecked = !checked
        setChecked(newChecked)
        onChange?.(newChecked)
      }
    }

    return (
      <div
        ref={ref}
        className={cn("flex items-center gap-2", className)}
      >
        <button
          type="button"
          onClick={handleToggle}
          disabled={disabled}
          className={cn(
            "h-4 w-4 rounded border border-zinc-300 flex items-center justify-center transition-all duration-200",
            "[box-shadow:inset_0px_-1px_0px_0px_#e4e4e7,_0px_1px_3px_0px_rgba(228,_228,_231,_20%)]",
            !disabled && "hover:[box-shadow:inset_0px_-1px_0px_0px_#d4d4d8,_0px_1px_3px_0px_rgba(212,_212,_216,_30%)]",
            checked && "bg-orange-500 border-orange-500 [box-shadow:inset_0px_-1px_0px_0px_#c2410c,_0px_1px_3px_0px_rgba(234,_88,_12,_30%)]",
            disabled && "opacity-50 cursor-not-allowed"
          )}
        >
          {checked && <Check className="h-3 w-3 text-white" />}
        </button>
        {label && (
          <label
            onClick={handleToggle}
            className={cn(
              "text-sm select-none",
              !disabled && "cursor-pointer",
              disabled && "opacity-50 cursor-not-allowed"
            )}
          >
            {label}
          </label>
        )}
      </div>
    )
  }
)
Checkbox.displayName = "Checkbox"

export { Checkbox }