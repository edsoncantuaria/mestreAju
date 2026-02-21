
import React from 'react';
import { LucideIcon } from 'lucide-react';

interface FeatureHeaderProps {
  title: string;
  description: string;
  icon: LucideIcon;
}

export function FeatureHeader({ title, description, icon: Icon }: FeatureHeaderProps) {
  return (
    <div className="flex items-center gap-4 mb-8">
      <div className="p-3 rounded-xl bg-primary/20 text-accent ring-1 ring-primary/50">
        <Icon size={32} />
      </div>
      <div>
        <h1 className="text-3xl font-headline font-bold text-accent">{title}</h1>
        <p className="text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}
