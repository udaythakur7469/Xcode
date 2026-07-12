export const toTwoDecimals = (acceptanceRate: number): number => {
  return Math.round(acceptanceRate * 100) / 100;
};
