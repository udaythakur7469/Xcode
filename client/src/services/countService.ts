export const formatCount = (count: number): string => {
  if (count < 1000) {
    return count.toString();
  } else if (count < 1000000) {
    const thousands = count / 1000;
    // Remove .0 decimal for whole numbers
    return thousands % 1 === 0
      ? `${thousands}k`
      : `${thousands.toFixed(1).replace(/\.0$/, "")}k`;
  } else if (count < 1000000000) {
    const millions = count / 1000000;
    return millions % 1 === 0
      ? `${millions}M`
      : `${millions.toFixed(1).replace(/\.0$/, "")}M`;
  } else {
    const billions = count / 1000000000;
    return billions % 1 === 0
      ? `${billions}B`
      : `${billions.toFixed(1).replace(/\.0$/, "")}B`;
  }
};
