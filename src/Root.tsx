import { Composition } from "remotion";
import { RealEstateVideo } from "./RealEstateVideo";
import { PlotBuildVideo } from "./PlotBuildVideo";
import { CarouselSlide } from "./CarouselSlide";
import { SoldVideo } from "./SoldVideo";

// --- Default props dla demo/preview ---
const LISTING = {
  title: "Apartament z widokiem na morze",
  location: "Sopot, ul. Bohaterow Monte Cassino 15",
  price: "1 850 000 PLN",
  area: "95 m2",
  rooms: "4 pokoje",
  floor: "3 pietro",
  year: "2023",
  features: ["Taras 20m2", "Garaz podziemny", "Klimatyzacja"],
  agent: "Dariusz Szuca",
  agentPhone: "+48 500 100 200",
  photos: [
    { src: "photos/front.jpg", label: "Widok z zewnatrz" },
    { src: "photos/salon.jpg", label: "Salon" },
    { src: "photos/kuchnia.jpg", label: "Kuchnia" },
    { src: "photos/sypialnia.jpg", label: "Sypialnia" },
    { src: "photos/lazienka.jpg", label: "Lazienka" },
  ],
};

const PLOT_CONFIG = {
  plotImage: "plot/dzialka.jpg",
  wireframeImage: "plot/wireframe.jpg",
  renderImage: "plot/render-dom.jpg",
  ctaImage: "plot/render-cta.jpg",
  area: "3 456 m\u00B2",
  ctaText: "KUP TA DZIALKE I WYBUDUJ DOM MARZEN",
  agentName: "Dariusz Szuca",
  agentPhone: "+48 500 100 200",
};

const CAROUSEL_DEFAULT = {
  slideType: "cover" as const,
  title: "Apartament z widokiem na morze",
  location: "Sopot, ul. Bohaterow Monte Cassino 15",
  price: "1 850 000 PLN",
  area: "95 m2",
  rooms: "4 pokoje",
  floor: "3 pietro",
  year: "2023",
  features: ["Taras 20m2", "Garaz podziemny", "Klimatyzacja"],
  agent: "Dariusz Szuca",
  agentPhone: "+48 500 100 200",
  photoSrc: "photos/front.jpg",
  photoLabel: "Widok z zewnatrz",
  slideNumber: 1,
  totalSlides: 5,
};

const SOLD_DEFAULT = {
  title: "Apartament z widokiem na morze",
  location: "Sopot, ul. Bohaterow Monte Cassino 15",
  price: "1 850 000 PLN",
  agent: "Dariusz Szuca",
  agentPhone: "+48 500 100 200",
  photoSrc: "photos/front.jpg",
};

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {/* Rolka ofertowa 9:16 (19s) */}
      <Composition
        id="RealEstateReel"
        component={RealEstateVideo}
        durationInFrames={570}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{ listing: LISTING }}
      />

      {/* Wizualizacja dzialki 1:1 (17s) */}
      <Composition
        id="PlotBuild"
        component={PlotBuildVideo}
        durationInFrames={510}
        fps={30}
        width={1080}
        height={1080}
        defaultProps={{ config: PLOT_CONFIG }}
      />

      {/* Slajd karuzeli Instagram 1:1 (still) */}
      <Composition
        id="CarouselSlide"
        component={CarouselSlide}
        durationInFrames={1}
        fps={30}
        width={1080}
        height={1080}
        defaultProps={CAROUSEL_DEFAULT}
      />

      {/* Sprzedane! 1:1 (8s) */}
      <Composition
        id="SoldVideo"
        component={SoldVideo}
        durationInFrames={240}
        fps={30}
        width={1080}
        height={1080}
        defaultProps={SOLD_DEFAULT}
      />
    </>
  );
};
