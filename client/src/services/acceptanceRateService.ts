export const toTwoDecimals = async (
  acceptanceRate: number,
): Promise<number> => {
  return Math.round(acceptanceRate * 100) / 100;
};
