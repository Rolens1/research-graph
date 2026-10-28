import { LoginHero } from "@/components/auth/LoginHero";
import { LoginCard } from "@/components/auth/LoginCard";

type PageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function LoginPage({ searchParams }: PageProps) {
  const resolvedParams = await searchParams;
  const redirectTo =
    typeof resolvedParams.redirectTo === "string"
      ? resolvedParams.redirectTo
      : undefined;

  return (
    <main className="min-h-screen bg-neutral-canvas text-foreground flex items-center justify-center p-6 md:p-12 lg:p-16">
      <div className="w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
        {/* Left Column: Platform capabilities & Architectural Narrative */}
        <div className="lg:col-span-7">
          <LoginHero />
        </div>

        {/* Right Column: Secure Login Card */}
        <div className="lg:col-span-5 flex justify-center lg:justify-end">
          <LoginCard redirectTo={redirectTo} />
        </div>
      </div>
    </main>
  );
}
