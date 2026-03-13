import type { Express } from 'express'
import type { AppContext } from '../context.js'

export function registerRoutes(_app: Express, _ctx: AppContext): void {
  // Each handler bead appends its import + registration call here.
  // This file starts empty and grows as handler beads are implemented.
}
