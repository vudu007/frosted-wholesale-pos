import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, Facebook, Twitter, Instagram, IceCream } from 'lucide-react';

export default function WebsiteFooter() {
  return (
    <footer className="bg-frosted-dark text-white py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div>
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-gradient-frosted rounded-full flex items-center justify-center">
                <IceCream className="text-white" size={20} />
              </div>
              <h3 className="text-xl font-display font-bold">Frosted Wholesale</h3>
            </div>
            <p className="text-gray-400 text-sm">
              Premium ice cream supplier for restaurants, retailers, and distributors nationwide.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-display font-bold text-lg mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-gray-400 hover:text-secondary transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/shop" className="text-gray-400 hover:text-secondary transition-colors">
                  Shop
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-gray-400 hover:text-secondary transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-gray-400 hover:text-secondary transition-colors">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h4 className="font-display font-bold text-lg mb-4">Customer Service</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/login" className="text-gray-400 hover:text-secondary transition-colors">
                  My Account
                </Link>
              </li>
              <li>
                <Link to="/account" className="text-gray-400 hover:text-secondary transition-colors">
                  Order History
                </Link>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-secondary transition-colors">
                  Shipping Info
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-secondary transition-colors">
                  Returns Policy
                </a>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="font-display font-bold text-lg mb-4">Contact Us</h4>
            <ul className="space-y-3">
              <li className="flex items-start space-x-2">
                <Mail size={18} className="text-secondary mt-1 flex-shrink-0" />
                <a href="mailto:info@frostedwholesale.com" className="text-gray-400 hover:text-secondary transition-colors text-sm">
                  info@frostedwholesale.com
                </a>
              </li>
              <li className="flex items-start space-x-2">
                <Phone size={18} className="text-secondary mt-1 flex-shrink-0" />
                <a href="tel:+18005551234" className="text-gray-400 hover:text-secondary transition-colors text-sm">
                  +1 (800) 555-1234
                </a>
              </li>
              <li className="flex items-start space-x-2">
                <MapPin size={18} className="text-secondary mt-1 flex-shrink-0" />
                <span className="text-gray-400 text-sm">
                  123 Ice Cream Lane<br />
                  Sweet City, SC 12345
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Social Media & Copyright */}
        <div className="border-t border-gray-700 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-400 text-sm mb-4 md:mb-0">
            &copy; 2025 Frosted Wholesale. All rights reserved.
          </p>
          
          <div className="flex space-x-4">
            <a 
              href="#" 
              className="w-10 h-10 bg-gray-700 hover:bg-gradient-frosted rounded-full flex items-center justify-center transition-all"
            >
              <Facebook size={18} />
            </a>
            <a 
              href="#" 
              className="w-10 h-10 bg-gray-700 hover:bg-gradient-frosted rounded-full flex items-center justify-center transition-all"
            >
              <Twitter size={18} />
            </a>
            <a 
              href="#" 
              className="w-10 h-10 bg-gray-700 hover:bg-gradient-frosted rounded-full flex items-center justify-center transition-all"
            >
              <Instagram size={18} />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
