import { redirect } from "next/navigation";

type BrandSignupPageProps = {
  searchParams?: Promise<{
    error?: string;
  }>;
};

export default async function BrandSignupPage({ searchParams }: BrandSignupPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const brandUrl = new URL("/brand", "http://localhost");

  brandUrl.searchParams.set("signup", "1");

  if (resolvedSearchParams?.error) {
    brandUrl.searchParams.set("error", resolvedSearchParams.error);
  }

  redirect(brandUrl.pathname + brandUrl.search);
}