import Chat from "@/components/Chat";

export default async function HomePage() {
  // ✅ No need to fetch user data anymore - layout handles it
  return <Chat />;
}
