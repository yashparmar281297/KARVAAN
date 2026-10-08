// The four "Choose your corner" tiles — fixed photos so the section always looks
// the same. Supercars / Superbikes / Events are local copies in /public/media
// (Unsplash photos chosen by the site owner); Clubs is served from Unsplash.
export interface ExploreTile {
  href: string;
  title: string;
  image: string;
  focus: string; // object-position inside the square
}

export const EXPLORE_TILES: ExploreTile[] = [
  { href: "/cars", title: "Supercars", image: "/media/tile-supercars.jpg", focus: "50% 62%" }, // white Porsche 911 GT3 RS
  { href: "/bikes", title: "Superbikes", image: "/media/tile-superbikes.jpg", focus: "53% 50%" }, // red Ducati Panigale
  { href: "/clubs", title: "Clubs", image: "https://images.unsplash.com/photo-1588287960086-c4a332155b15", focus: "40% 55%" }, // car meet
  { href: "/events", title: "Events", image: "/media/tile-events.jpg", focus: "50% 58%" }, // superbike line-up
];
