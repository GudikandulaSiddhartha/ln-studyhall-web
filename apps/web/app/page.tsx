import { BranchMap } from "@/components/branch-map";
import { Chatbot } from "@/components/chatbot";
import { CursorGlow } from "@/components/cursor-glow";
import { Facilities } from "@/components/facilities";
import { Gallery } from "@/components/gallery";
import { Hero } from "@/components/hero";
import { Memberships } from "@/components/memberships";
import { Navbar } from "@/components/navbar";
import { WelcomePopup } from "@/components/welcome-popup";

export default function Home() {
  return (
    <main>
      <Navbar />
      <WelcomePopup />
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
