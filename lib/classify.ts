// Works out a vehicle's category from what the owner typed, so a Lamborghini
// Huracán files itself under Car → Supercar and a Ducati Panigale V4 under
// Bike → Superbike. The owner can still change it.
import type { VehicleClass, VehicleKind } from "./types";

const SUPERCAR_MAKES = ["lamborghini", "ferrari", "mclaren", "bugatti", "pagani", "koenigsegg", "rimac", "aston martin", "lotus"];
const SUPERCAR_MODELS = [/porsche.*(911|918|carrera gt|gt2|gt3)/, /audi.*r8/, /mercedes.*(amg gt|sls)/, /nissan.*gt-?r/, /maserati.*mc20/, /chevrolet.*corvette/, /ford.*gt\b/, /acura.*nsx|honda.*nsx/, /lexus.*lfa/];
const LUXURY_MAKES = ["rolls-royce", "rolls royce", "bentley", "maybach", "range rover", "land rover"];
const SUPERBIKE_MODELS = [/ducati.*(panigale|superleggera|streetfighter|1299|1199|v4)/, /kawasaki.*(zx-?10|zx-?14|h2|ninja 1000)/, /bmw.*(s ?1000|m ?1000)/, /yamaha.*(r1|r-1)/, /honda.*(cbr ?1000|fireblade)/, /aprilia.*(rsv4|tuono)/, /suzuki.*(gsx-?r ?1000|hayabusa)/, /mv agusta/, /triumph.*(speed triple|daytona)/, /ktm.*(1290|rc 8)/];
const CRUISER_MAKES = ["harley", "harley-davidson", "indian", "royal enfield"];

export function suggestClass(kind: VehicleKind, make: string, model: string): VehicleClass | null {
  const s = `${make} ${model}`.toLowerCase().trim();
  if (!s) return null;
  if (kind === "car") {
    if (SUPERCAR_MAKES.some((m) => s.startsWith(m)) || SUPERCAR_MODELS.some((r) => r.test(s))) return "Supercar";
    if (LUXURY_MAKES.some((m) => s.startsWith(m))) return "Luxury";
    return null;
  }
  if (SUPERBIKE_MODELS.some((r) => r.test(s))) return "Superbike";
  if (CRUISER_MAKES.some((m) => s.startsWith(m))) return "Cruiser";
  return null;
}
