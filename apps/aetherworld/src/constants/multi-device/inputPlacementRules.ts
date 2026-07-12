export const INPUT_PLACEMENT_RULES = {
  DESKTOP: { placement: "bottom-center", multiline: true, showModePicker: true },
  TABLET: { placement: "bottom-center", multiline: true, showModePicker: true },
  MOBILE: { placement: "fixed-bottom", multiline: false, showModePicker: false },
} as const;

export const MOBILE_INPUT_PLACEHOLDER = "可以问问题，也可以让我做事……";
