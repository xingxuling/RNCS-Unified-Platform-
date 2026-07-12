export const NPC_ARCHETYPES = [
  "Guide","Gatekeeper","Merchant","Rival","Ally","Messenger",
  "Observer","Lover","Trickster","Archivist","Judge","Founder Echo",
] as const;
export type NpcArchetype = typeof NPC_ARCHETYPES[number];

export const NPC_ARCHETYPE_LABEL: Record<NpcArchetype, string> = {
  Guide:"引导者", Gatekeeper:"守门人", Merchant:"交易者", Rival:"对手",
  Ally:"同盟", Messenger:"信使", Observer:"观察者", Lover:"关系节点",
  Trickster:"扰动者", Archivist:"归档者", Judge:"审判者", "Founder Echo":"创始人回声",
};

// digit → archetype affinity
export const DIGIT_NPC_AFFINITY: Record<string, NpcArchetype[]> = {
  "0": ["Archivist","Observer"],
  "1": ["Guide","Judge"],
  "2": ["Ally","Lover","Messenger"],
  "3": ["Messenger","Trickster"],
  "4": ["Gatekeeper","Judge"],
  "5": ["Trickster","Messenger"],
  "6": ["Ally","Lover"],
  "7": ["Observer","Trickster"],
  "8": ["Merchant","Gatekeeper"],
  "9": ["Judge","Founder Echo"],
};
