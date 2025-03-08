import Autoplay from "embla-carousel-autoplay";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getLatestUploads } from "../../api/movie";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
} from "../ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "../ui/carousel";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

export default function HeroSlidShow() {
  const [slides, setSlides] = useState<LatestMovie[]>([]);
  const { t } = useTranslation();

  interface LatestMovie {
    id: string;
    title: string;
    storyLine: string;
    poster: string;
    responsivePosters: string;
    trailer: string;
  }
  const fetchLatestUploads = async () => {
    const { error, movies }: { error: string; movies: LatestMovie[] } =
      await getLatestUploads();
    if (error) {
      return toast.error(t(error));
    }
    setSlides([...movies]);
  };

  useEffect(() => {
    fetchLatestUploads();
  }, []);

  return (
    <Carousel
      plugins={[
        Autoplay({
          delay: 5000,
        }),
      ]}
      className="w-full max-w-7xl mx-auto"
    >
      <CarouselContent>
        {slides.map((s, i) => (
          <CarouselItem key={i} className="relative md:basis-1/2 lg:basis-1/3">
            <Link to={"/movie/" + s.id}>
              <img src={s.poster} alt="poster" className="rounded-sm" />
            </Link>
            <p className="absolute left-5 bottom-0 text-white text-lg font-semibold">
              {s.title}
            </p>
            {/* <Card className="border-0">
              <CardContent>
                <Link to={"/movie/" + s.id}>
                  <img src={s.poster} alt="poster" className="rounded-sm" />
                </Link>
                <CardDescription className="text-3xl">
                  {s.title}
                </CardDescription>
              </CardContent>
            </Card> */}
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious />
      <CarouselNext />
    </Carousel>
  );
}
