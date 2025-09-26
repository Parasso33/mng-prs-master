import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppProvider } from "@/contexts/AppContext";
import { ProfileProvider } from "@/contexts/ProfileContext"; //  import ProfileProvider
import { FavoritesProvider } from "@/contexts/FavoritesContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Home from "@/pages/Home";
import Browse from "@/pages/Browse";
import Login from "@/pages/Login";
import Popular from "@/pages/Popular";
import Latest from "@/pages/Latest";
import MangaDetails from "@/pages/MangaDetails";
import Reader from "@/pages/Reader";
import NotFound from "./pages/NotFound";
import Profile from "./pages/Profile";

const queryClient = new QueryClient();


const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AppProvider>
        <ProfileProvider> 
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <div className="min-h-screen flex flex-col">
              <Header />
              <main className="flex-1 flex flex-col">
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/browse" element={<Browse />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/popular" element={<Popular />} />
                  <Route path="/latest" element={<Latest />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/manga/:id" element={<MangaDetails />} />
                  <Route path="/reader/:mangaId/:chapterId" element={<Reader />} />
                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </main>
              <Footer />
            </div>
          </BrowserRouter>
        </ProfileProvider>
      </AppProvider>
    </TooltipProvider>
  </QueryClientProvider>
);


export default App;
