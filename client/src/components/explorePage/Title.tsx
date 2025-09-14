import React from "react";

type TitleProps = {};

const Title: React.FC<TitleProps> = () => {
  return (
    <div className="flex justify-center items-center flex-col">
      <p className="text-5xl font-bold p-5 py-8 text-center">
        Powerful features to supercharge your Interview Preparation
      </p>
      <p className="text-2xl font-semibold p-2 py-6 text-center">
        Enhance your interview preparation with Xcode,
        designed to help you crack you Dream Company.
      </p>
    </div>
  );
};
export default Title;
