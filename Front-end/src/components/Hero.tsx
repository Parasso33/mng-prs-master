import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useApp } from '@/contexts/AppContext';

const Hero: React.FC = () => {
  const { translation } = useApp();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement search functionality
    console.log('Searching for:', searchQuery);
  };

  return (
    <section className="hero-gradient text-white py-16 mb-12">
      <div className="container mx-auto px-4 text-center">
        <h1 className="text-4xl md:text-5xl font-bold mb-6 animate-fade-in text-shadow-lg">
          {translation.welcome}
        </h1>
        
        <p className="text-lg md:text-xl mb-8 opacity-90 animate-slide-up max-w-2xl mx-auto">
          {translation.discover}
        </p>

        <form 
          onSubmit={handleSearch}
          className="search-glass max-w-2xl mx-auto relative animate-scale-in rounded-full overflow-hidden"
        >
          <div className="flex">
            <Input
              type="text"
              placeholder={translation.searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 border-0 bg-transparent text-white placeholder:text-white/70 
                         focus:ring-0 focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 
                         px-6 py-4 text-lg"
            />
            <Button
              type="submit"
              variant="secondary"
              className="m-2 rounded-full px-6 bg-white/20 hover:bg-white/30 
                         border-white/30 text-white font-medium"
            >
              {translation.searchBtn}
            </Button>
          </div>
        </form>
      </div>
    </section>
  );
};

export default Hero;