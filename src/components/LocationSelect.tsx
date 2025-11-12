import { useState } from 'react';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { LOCATIONS } from '@/lib/locations';

interface LocationSelectProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

export default function LocationSelect({ value, onChange, error }: LocationSelectProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="location">
        Transaction Location *
      </Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger 
          id="location" 
          className={error ? 'border-destructive' : ''}
        >
          <SelectValue placeholder="Select a city" />
        </SelectTrigger>
        <SelectContent className="max-h-[300px]">
          <SelectGroup>
            <SelectLabel>Indian Cities</SelectLabel>
            {LOCATIONS.indian_cities.map((city) => (
              <SelectItem key={city} value={city}>
                {city}
              </SelectItem>
            ))}
          </SelectGroup>
          <SelectGroup>
            <SelectLabel>American Cities</SelectLabel>
            {LOCATIONS.american_cities.map((city) => (
              <SelectItem key={city} value={city}>
                {city}
              </SelectItem>
            ))}
          </SelectGroup>
          <SelectGroup>
            <SelectLabel>World Cities</SelectLabel>
            {LOCATIONS.world_cities.map((city) => (
              <SelectItem key={city} value={city}>
                {city}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
      {error && (
        <p className="text-xs text-destructive flex items-center gap-1">
          <span>⚠</span> {error}
        </p>
      )}
      <p className="text-xs text-muted-foreground">
        Select transaction city and country
      </p>
    </div>
  );
}
