import { BranchMap } from "@/components/branch-map";
import { Chatbot } from "@/components/chatbot";
import { CursorGlow } from "@/components/cursor-glow";
import { Facilities } from "@/components/facilities";
import { Gallery } from "@/components/gallery";
import { Hero } from "@/components/hero";
import { Memberships } from "@/components/memberships";
import { Navbar } from "@/components/navbar";

export default function Home() {
  return (
    <main>
      <Navbar />
      <CursorGlow />
      <Hero />
      <Facilities />
      <Gallery />
      <Memberships />
      <BranchMap />
      <Chatbot />
    </main>
  );
}
