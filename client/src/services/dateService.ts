import moment from "moment";

export const formatDate = (dateString: string) => {
  // Parse the input date string with the given format
  const date = moment(dateString);

  // Format it to just show the date portion
  return date.format("MM/D/YYYY");
};

export const relativeDate = (dateString: string) => {
  // Parse the input date string with the given format
  const date = moment(dateString);

  // Calculate relative time from now
  return date.fromNow();
};
