"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useRouter } from "next/navigation";
import React, { ReactNode } from "react";

type FeatureCardsProps = {
  logo: ReactNode;
  title: string;
  description: string;
  footer: string;
};

const FeatureCards: React.FC<FeatureCardsProps> = ({
  logo,
  title,
  description,
  footer,
}) => {
  const router = useRouter();

  const getNavigationPath = (footer: string) => {
    switch (footer) {
      case "Explore problems":
        return "/explore"; 
      case "Practice problems":
        return "/problems";
      case "Practice Interviews":
        return "/interview";
      default:
        return "/";
    }
  };
  return (
    <Card className="flex flex-col justify-start align-center h-full">
      <div className="p-5" />
      <CardHeader>
        {logo}
        <div className="p-2" />
        <CardTitle>
          {title}
          <div className="p-2" />
        </CardTitle>
        <CardDescription>
          {description}
          <div className="p-2" />
        </CardDescription>
      </CardHeader>
      <CardFooter>
        <Button onClick={() => router.push(getNavigationPath(footer))}>
          {footer}
        </Button>
        <div className="p-2" />
      </CardFooter>
    </Card>
  );
};
export default FeatureCards;
