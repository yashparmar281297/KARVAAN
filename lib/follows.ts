"use client";

// Follows, likes and saves for the signed-in person — stored on the server
// (one row per person per thing), shown with optimistic updates. Visitors who
// tap Follow / Like / Save are sent to "Create your free account", and the
// action is completed automatically afterwards.
import { useSocial } from "./session";

export type FollowKind = "owner" | "club" | "vehicle" | "business" | "event" | "brand";
export type LikeKind = "owner" | "club" | "vehicle" | "business" | "event" | "image";
export type SaveKind = "event" | "vehicle" | "club" | "business";

/** Everything the signed-in user follows, as "kind:id" keys. */
export function useFollows() {
  return useSocial().mine("follows");
}

export function useFollow(kind: FollowKind, id: string) {
  const s = useSocial();
  const key = `${kind}:${id}`;
  return {
    signedIn: !!s.session?.id,
    following: s.has("follows", key),
    toggle: () => s.set("follows", key),
    unfollow: () => s.set("follows", key, false),
  };
}

export function useLike(kind: LikeKind, id: string) {
  const s = useSocial();
  const key = `${kind}:${id}`;
  return {
    signedIn: !!s.session?.id,
    liked: s.has("likes", key),
    toggle: () => s.set("likes", key),
    like: () => s.set("likes", key, true),
  };
}

export function useSave(kind: SaveKind, id: string) {
  const s = useSocial();
  const key = `${kind}:${id}`;
  return { signedIn: !!s.session?.id, saved: s.has("saves", key), toggle: () => s.set("saves", key) };
}

/** How many people follow this — one per account. */
export function useFollowerTotal(kind: FollowKind, id: string) {
  return useSocial().count("follows", `${kind}:${id}`);
}

/** How many people like this — one per account. */
export function useLikeTotal(kind: LikeKind, id: string) {
  return useSocial().count("likes", `${kind}:${id}`);
}
