"use client";

import Image from "next/image";
import * as React from "react";
import Autoplay from "embla-carousel-autoplay";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { ArrowDown } from "lucide-react";
import { Button } from "../../ui/button";
import { Card } from "../../ui/card";

const HeroSection: React.FC = () => {
  const takeToFeaturedSection = () => {
    const element = document.getElementById("featured");
    element?.scrollIntoView({ behavior: "smooth", block: "end" });
  };

  const plugin = React.useRef(
    Autoplay({ delay: 3000, stopOnInteraction: true })
  );

  // Fix hydration issue by ensuring rendering happens only on client
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null; // Avoid mismatches by rendering only on client

  return (
    <div id="hero" className="h-screen flex flex-col">
      <div className="h-[5vh]" />
      {/* Title Section (Fixed Height) */}
      <div className="h-[10vh] flex items-center justify-center">
        <Card className="text-3xl font-bold text-center p-2 border cursor-default">
          This is what Xcode offers you
        </Card>
      </div>

      {/* Fullscreen Carousel (Fixed Height) */}
      <div className="h-full flex items-center justify-center p-10 w-full">
        <Carousel
          plugins={[plugin.current]}
          className="w-full max-w-6xl h-full"
          onMouseEnter={plugin.current.stop}
          onMouseLeave={plugin.current.reset}
        >
          <CarouselContent>
            {Array.from({ length: 3 }).map((_, index) => (
              <CarouselItem key={index}>
                <div className="flex w-full h-[70vh] items-center justify-center">
                  {/* Left Section (Text - 40%) */}
                  <div className="basis-2/5 h-full flex items-center justify-center p-10">
                    <p className="text-2xl font-medium text-center cursor-default">
                      {index === 0
                        ? "Solve Problems"
                        : index === 1
                        ? "Explore Xcode"
                        : "Start an Interview"}
                    </p>
                  </div>

                  {/* Right Section (Image - 60%) */}
                  <div className="basis-3/5 h-full flex justify-center items-center relative w-full border rounded-lg">
                    <Image
                      src={`/Image${index + 1}.png`} // Different images for slides
                      alt={`Slide ${index + 1}`}
                      priority
                      fill
                      className="object-center border rounded-lg"
                    />
                  </div>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext />
        </Carousel>
      </div>

      {/* Subtitle Section (Fixed Height) */}
      <div className="h-[10vh] flex items-center justify-center">
        <Button
          variant="outline"
          className="m-5 p-7 text-lg border-2 border-white shadow"
          onClick={takeToFeaturedSection}
        >
          <ArrowDown /> Learn More
        </Button>
      </div>
      <div className="h-[5vh]" />
    </div>
  );
};

export default HeroSection;
