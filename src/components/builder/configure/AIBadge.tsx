"use client";

import { Wand2 } from "lucide-react";

const AIBadge = () => (
  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/20 text-primary text-xs font-medium">
    <Wand2 className="w-3 h-3" />
    AI
  </span>
);

export default AIBadge;