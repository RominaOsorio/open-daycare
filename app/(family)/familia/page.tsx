import { FeedScreen } from "@/app/components/feed/feed-screen";
import { requireParent } from "@/app/lib/dal";

export default async function FamiliaPage() {
  await requireParent();
  return <FeedScreen />;
}
