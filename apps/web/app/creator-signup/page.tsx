import { redirect } from "next/navigation";
import { getCreatorUsernameAvailability } from "@reachfyp/api";

type CreatorSignupPageProps = {
  searchParams?: Promise<{
    username?: string;
    error?: string;
  }>;
};

export default async function CreatorSignupPage({ searchParams }: CreatorSignupPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const availability = getCreatorUsernameAvailability(String(resolvedSearchParams?.username ?? ""));

  const creatorUrl = new URL("/creator", "http://localhost");

  if (availability.username) {
    creatorUrl.searchParams.set("username", availability.username);
  } else if (resolvedSearchParams?.username) {
    creatorUrl.searchParams.set("username", String(resolvedSearchParams.username));
  }

  if (availability.status === "available" || availability.status === "claimable") {
    creatorUrl.searchParams.set("signup", "1");
  }

  if (resolvedSearchParams?.error) {
    creatorUrl.searchParams.set("error", resolvedSearchParams.error);
  }

  redirect(creatorUrl.pathname + creatorUrl.search);
}