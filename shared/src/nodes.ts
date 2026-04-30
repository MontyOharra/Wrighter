// Node taxonomy + state contract shared across the codebase.
// Tracks ADRs 0004 (typed nodes), 0005 (structured state), 0006 (lifecycle), 0011 (re-fork generations).
// "Universal substrate" + completeness state machine reflect the design conversation that produced
// the universal-node-lifecycle direction (not yet codified as its own ADR — pending).

export type NodeType =
  | "idea"
  | "requirements"
  | "stack"
  | "architecture"
  | "data-model"
  | "api-surface"
  | "frontend"
  | "backend"
  | "deployment"
  | "decision"
  | "interface"
  | "note";

export type Lifecycle = "speculative" | "committed" | "superseded";

export type Completeness = "incomplete" | "ready" | "committed";

// Universal substrate — every node type carries this regardless of domain.
export interface UniversalNodeState {
  summary: string;
  purpose: string;
  questions: string[];
  decisions: string[];
  considerations: string[];
}

// Idea node — root of every project graph. Per the forging discussion.
export interface IdeaNodeState extends UniversalNodeState {
  target_user?: string;
  problem_statement?: string;
  must_haves?: string[];
}
