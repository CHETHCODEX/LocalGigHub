import React from 'react';

const Footer = () => {
  return (
    <footer className="border-t border-white/10 mt-20 py-10 text-center text-sm text-gray-500">
      <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8 text-left mb-8">
        <div>
          <h3 className="text-white font-bold mb-4">Local<span className="text-neonPurple">Gig</span>Hub</h3>
          <p>Connecting local shops with nearby students for fast, simple gigs.</p>
        </div>
        <div>
          <h4 className="text-white font-semibold mb-4">Platform</h4>
          <ul className="space-y-2">
            <li><a href="/" className="hover:text-neonPurple transition-colors">Home</a></li>
            <li><a href="/marketplace" className="hover:text-neonPurple transition-colors">Browse Gigs</a></li>
          </ul>
        </div>
        <div>
          <h4 className="text-white font-semibold mb-4">Legal</h4>
          <ul className="space-y-2">
            <li><a href="/" className="hover:text-neonPurple transition-colors">Privacy Policy</a></li>
            <li><a href="/" className="hover:text-neonPurple transition-colors">Terms of Service</a></li>
          </ul>
        </div>
      </div>
      <p>© 2026 AI-Powered LocalGigHub. All rights reserved.</p>
    </footer>
  );
};

export default Footer;
