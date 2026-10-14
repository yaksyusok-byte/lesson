import type { Block } from "./model";
/** Future adapters must call a configured server; API keys must not be saved in the browser. */
export interface ExerciseRequest {
  theory: string;
  grade: string;
  topic: string;
}
export interface ExerciseService {
  generate(request: ExerciseRequest): Promise<Block[]>;
}
export const exerciseService: ExerciseService | null = null;
