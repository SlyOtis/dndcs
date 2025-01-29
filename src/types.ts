export interface Action {
  name: string;
  type: string;
  range: string;
  toHit: string;
  damage: string;
  notes: string;
  isWeapon?: boolean;
  description?: string;
}

export interface ActionCategory {
  title: string;
  actions: Action[];
}
