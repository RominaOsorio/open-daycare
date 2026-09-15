import { FeedScreen } from "@/app/components/feed/feed-screen";
import { requireStaff } from "@/app/lib/dal";

export default async function Home() {
  await requireStaff();
  return <FeedScreen />;
}
