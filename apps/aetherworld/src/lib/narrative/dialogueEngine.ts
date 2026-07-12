export interface DialogueLine {
  speaker: string;
  line: string;
  subtext: string;
  emotion: string;
}

export interface DialogueResult {
  dialogueLines: DialogueLine[];
  dialogueStyle: string;
  conflictProgression: string;
}

export function generateDialogue(input: {
  speakers: string[];
  conflict: string;
  style: string;
  emotion?: string;
}): DialogueResult {
  const [a, b] = [input.speakers[0] ?? "A", input.speakers[1] ?? "B"];
  const emo = input.emotion ?? "克制";
  const lines: DialogueLine[] = [
    { speaker: a, line: `你知道这件事再拖下去会变成什么样。`,                     subtext: "我已经想过最坏的版本", emotion: emo },
    { speaker: b, line: `我没说要拖。我只是不想用你那种方式解决它。`,             subtext: "我害怕成为你",         emotion: "防御" },
    { speaker: a, line: `那你打算怎么做？`,                                        subtext: "我在等你给我一个理由",  emotion: "克制" },
    { speaker: b, line: `先承认一件事——我们俩都还没准备好。`,                     subtext: "请别再演下去了",       emotion: "脆弱" },
  ];
  return {
    dialogueLines: lines,
    dialogueStyle: input.style,
    conflictProgression: `从「${input.conflict}」表层 → 真实分歧显形`,
  };
}
