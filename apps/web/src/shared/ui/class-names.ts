// Joins the class names that apply, so components can add conditional ones.
export const classNames = (
  ...names: ReadonlyArray<string | false | null | undefined>
) => names.filter(Boolean).join(' ');
