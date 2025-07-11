'use client'

import { HeroPill } from "@/components/ui/hero-pill"
import { StarBorder } from "@/components/ui/star-border"

export function HeroPillFirst() {
  return (
    <StarBorder color="hsl(var(--chart-1))">
      <HeroPill 
      href="https://waitlist.codinit.dev"
      announcement="📣 Join The Launch Day Waitlist!"
      isExternal
      className="bg-slate-900/20 ring-1 ring-border [&_div]:bg-slate-100 [&_div]:text-slate-900 [&_p]:text-slate-900 [&_svg_path]:fill-slate-900 dark:[&_div]:bg-slate-900 dark:[&_div]:text-slate-100 dark:[&_p]:text-slate-100 dark:[&_svg_path]:fill-white"
      />
    </StarBorder>
  )
}

export function HeroPillSecond() {
  return (
    <StarBorder color="hsl(var(--chart-1))">
      <HeroPill 
        href="https://waitlist.codinit.dev"
        announcement="📣 Join The Launch Day Waitlist!"
        isExternal
        className="bg-slate-900/20 ring-1 ring-border [&_div]:bg-slate-100 [&_div]:text-slate-900 [&_p]:text-slate-900 [&_svg_path]:fill-slate-900 dark:[&_div]:bg-slate-900 dark:[&_div]:text-slate-100 dark:[&_p]:text-slate-100 dark:[&_svg_path]:fill-white"
      />
    </StarBorder>
  )
}
