import { redirect } from "next/navigation";

/** Your garage now lives in My account. */
export default function GaragePage() {
  redirect("/me#garage");
}
