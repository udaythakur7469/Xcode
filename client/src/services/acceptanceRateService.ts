export const toTwoDecimals = (acceptanceRate: number): number => {
  return Math.round((Number(acceptanceRate) || 0) * 100) / 100;
};
