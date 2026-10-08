import type { City, State } from "../types";

export const states: State[] = [
  { code: "MP", name: "Madhya Pradesh" },
  { code: "MH", name: "Maharashtra" },
  { code: "DL", name: "Delhi" },
  { code: "HR", name: "Haryana" },
  { code: "KA", name: "Karnataka" },
  { code: "TS", name: "Telangana" },
  { code: "RJ", name: "Rajasthan" },
  { code: "KL", name: "Kerala" },
  { code: "GA", name: "Goa" },
  { code: "CH", name: "Chandigarh" },
  { code: "HP", name: "Himachal Pradesh" },
  { code: "LA", name: "Ladakh" },
];

export const cities: City[] = [
  { slug: "indore", name: "Indore", state: "MP", rto: "MP 09" },
  { slug: "bhopal", name: "Bhopal", state: "MP", rto: "MP 04" },
  { slug: "mumbai", name: "Mumbai", state: "MH", rto: "MH 01" },
  { slug: "pune", name: "Pune", state: "MH", rto: "MH 12" },
  { slug: "delhi", name: "Delhi", state: "DL", rto: "DL 01" },
  { slug: "gurugram", name: "Gurugram", state: "HR", rto: "HR 26" },
  { slug: "bengaluru", name: "Bengaluru", state: "KA", rto: "KA 01" },
  { slug: "hyderabad", name: "Hyderabad", state: "TS", rto: "TS 09" },
  { slug: "jaipur", name: "Jaipur", state: "RJ", rto: "RJ 14" },
  { slug: "kochi", name: "Kochi", state: "KL", rto: "KL 07" },
  { slug: "panaji", name: "Panaji", state: "GA", rto: "GA 01" },
  { slug: "chandigarh", name: "Chandigarh", state: "CH", rto: "CH 01" },
];
