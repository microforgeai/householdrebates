export function getArgValue(args: string[], flag: string): string | undefined {
  const idx = args.indexOf(flag);
  if (idx >= 0 && idx + 1 < args.length) {
    const val = args[idx + 1];
    if (!val.startsWith('--')) {
      return val;
    }
  }
  const eqPrefix = `${flag}=`;
  const eqArg = args.find((a) => a.startsWith(eqPrefix));
  if (eqArg) {
    return eqArg.slice(eqPrefix.length);
  }
  return undefined;
}
