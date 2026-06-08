import type { Metadata } from "next";
import { ProfileDashboard } from "@/components/profile-dashboard";
import { buildWalletProfile } from "@/lib/services/profile-service";
import { normalizeAddress } from "@/lib/validation";
import { shortAddress } from "@/lib/utils";

type Props = {
  params: Promise<{ address: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { address: rawAddress } = await params;
  try {
    const address = normalizeAddress(rawAddress);
    return {
      title: `${shortAddress(address)} Profile`,
      description: `Read-only wallet analytics, security, identity, and Guild role progress for ${address}.`
    };
  } catch {
    return { title: "Wallet Profile" };
  }
}

export default async function ProfilePage({ params }: Props) {
  const { address: rawAddress } = await params;
  const address = normalizeAddress(rawAddress);
  const profile = await buildWalletProfile(address);

  return (
    <main className="container py-6">
      <ProfileDashboard profile={profile} />
    </main>
  );
}
