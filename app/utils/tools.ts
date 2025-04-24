export function numberToFixed(num: number, fixed: number = 4) {
  if (num === 0 || Number.isNaN(num))
    return 0

  return Number(num.toFixed(fixed))
}
