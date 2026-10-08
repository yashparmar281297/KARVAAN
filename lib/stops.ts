import type { IconName } from "@/components/ui/Icon";
import type { StopKind } from "./types";

export const STOP_ICON: Record<StopKind, IconName> = { start: "flag", fuel: "fuel", food: "food", scenic: "mountain", photo: "camera", end: "pin" };
export const STOP_LABEL: Record<StopKind, string> = { start: "Start", fuel: "Fuel", food: "Food", scenic: "Scenic", photo: "Photo point", end: "Destination" };
