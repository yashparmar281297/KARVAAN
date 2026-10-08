import { redirect } from "next/navigation";

/** Following now lives in My account. */
export default function FollowingPage() {
  redirect("/me#following");
}
