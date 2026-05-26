import { BranchMap } from "@/components/branch-map";
import { Chatbot } from "@/components/chatbot";
import { Navbar } from "@/components/navbar";

export default function BranchesPage() {
  return (
    <main className="min-h-screen pt-24">
      <Navbar />
      <BranchMap />
      <Chatbot />
    </main>
  );
}
