import { Search, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

type QuackSearchProps = {
  value: string
  onChange: (value: string) => void
  className?: string
}

export function QuackSearch({ value, onChange, className }: QuackSearchProps) {
  return (
    <div className={className}>
      <label
        htmlFor="quack-search"
        className="mb-1.5 block text-sm font-medium text-foreground"
      >
        Search quacks
      </label>
      <div className="relative flex items-center">
        <Search className="absolute left-3 size-4 text-muted-foreground pointer-events-none" />
        <Input
          id="quack-search"
          type="search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Search quacks..."
          className="pl-9 pr-9"
        />
        {value ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-1 size-7 text-muted-foreground hover:text-foreground"
            onClick={() => onChange("")}
            aria-label="Clear search"
          >
            <X className="size-4" />
          </Button>
        ) : null}
      </div>
    </div>
  )
}
