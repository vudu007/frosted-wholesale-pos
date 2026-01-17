import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Truck, Award, Clock, ArrowRight, IceCream } from 'lucide-react';
import api from '../utils/api';
import WebsiteHeader from '../components/WebsiteHeader';
import WebsiteFooter from '../components/WebsiteFooter';

type Product = {
  id: string;
  name: string;
  price: string;
  image?: string;
  group?: string;
};

export default function Home() {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await api.get('/products');
        setFeaturedProducts(response.data.slice(0, 3));
      } catch (error) {
        console.error('Failed to fetch products:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <WebsiteHeader />

      {/* Hero Section */}
      <section className="hero-gradient py-24 px-4 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-display font-bold mb-6 text-shadow">
            Premium Ice Cream in Bulk
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-white/90 max-w-2xl mx-auto">
            Wholesale supplier for restaurants, retailers, and distributors. Taste the quality, enjoy the profit.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/shop" className="btn-frosted-primary">
              Browse Products <ArrowRight className="inline ml-2" size={20} />
            </Link>
            <Link to="/contact" className="btn-frosted">
              Get a Quote
            </Link>
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="section-title text-4xl md:text-5xl font-display font-bold">
            Why Choose Frosted Wholesale?
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
            <div className="frosted-card group">
              <img 
                src="https://images.unsplash.com/photo-1497534446932-c925b458314e?auto=format&fit=crop&w=800" 
                alt="Premium Ingredients" 
                className="frosted-card-image"
              />
              <div className="frosted-card-content">
                <h3 className="text-2xl font-display font-bold mb-3 text-frosted-purple">
                  Premium Ingredients
                </h3>
                <p className="text-gray-600">
                  We use only the finest dairy and natural flavors for unforgettable taste.
                </p>
              </div>
            </div>

            <div className="frosted-card group">
              <img 
                src="https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=800" 
                alt="Bulk Options" 
                className="frosted-card-image"
              />
              <div className="frosted-card-content">
                <h3 className="text-2xl font-display font-bold mb-3 text-frosted-purple">
                  Flexible Bulk Options
                </h3>
                <p className="text-gray-600">
                  From 5-gallon drums to pallet deliveries — we scale to your needs.
                </p>
              </div>
            </div>

            <div className="frosted-card group">
              <img 
                src="https://images.unsplash.com/photo-1581579181651-5e15a11b3e6c?auto=format&fit=crop&w=800" 
                alt="Fast Delivery" 
                className="frosted-card-image"
              />
              <div className="frosted-card-content">
                <h3 className="text-2xl font-display font-bold mb-3 text-frosted-purple">
                  Fast & Reliable Delivery
                </h3>
                <p className="text-gray-600">
                  Quick turnaround and nationwide logistics keep your shelves full.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="section-title text-4xl md:text-5xl font-display font-bold">
            Our Services
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mt-12">
            <div className="feature-item bg-white rounded-xl p-8 shadow-card hover:shadow-card-hover transition-all">
              <div className="w-16 h-16 bg-gradient-frosted rounded-full flex items-center justify-center mx-auto mb-4">
                <IceCream className="text-white" size={32} />
              </div>
              <h3 className="text-xl font-display font-bold mb-2">Custom Orders</h3>
              <p className="text-gray-600">Tailor-made flavors and packaging.</p>
            </div>

            <div className="feature-item bg-white rounded-xl p-8 shadow-card hover:shadow-card-hover transition-all">
              <div className="w-16 h-16 bg-gradient-frosted rounded-full flex items-center justify-center mx-auto mb-4">
                <Award className="text-white" size={32} />
              </div>
              <h3 className="text-xl font-display font-bold mb-2">Quality Guarantee</h3>
              <p className="text-gray-600">Every batch lab-tested for safety.</p>
            </div>

            <div className="feature-item bg-white rounded-xl p-8 shadow-card hover:shadow-card-hover transition-all">
              <div className="w-16 h-16 bg-gradient-frosted rounded-full flex items-center justify-center mx-auto mb-4">
                <Truck className="text-white" size={32} />
              </div>
              <h3 className="text-xl font-display font-bold mb-2">Storage Solutions</h3>
              <p className="text-gray-600">Proper handling and storage guidance.</p>
            </div>

            <div className="feature-item bg-white rounded-xl p-8 shadow-card hover:shadow-card-hover transition-all">
              <div className="w-16 h-16 bg-gradient-frosted rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="text-white" size={32} />
              </div>
              <h3 className="text-xl font-display font-bold mb-2">Bulk Pricing</h3>
              <p className="text-gray-600">Competitive rates for large orders.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      {!loading && featuredProducts.length > 0 && (
        <section className="py-20 px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="section-title text-4xl md:text-5xl font-display font-bold">
              Featured Products
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
              {featuredProducts.map((product) => (
                <div key={product.id} className="frosted-card group">
                  <div className="frosted-card-image bg-gradient-frosted flex items-center justify-center">
                    <IceCream className="text-white" size={64} />
                  </div>
                  <div className="frosted-card-content">
                    <h3 className="text-xl font-display font-bold mb-2">{product.name}</h3>
                    <p className="text-2xl font-bold text-frosted-purple mb-4">₦{product.price}</p>
                    <Link 
                      to="/shop" 
                      className="inline-block w-full text-center py-3 bg-gradient-frosted text-white rounded-full font-semibold hover:shadow-lg transition-all"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            <div className="text-center mt-12">
              <Link to="/shop" className="btn-frosted-primary">
                View All Products <ArrowRight className="inline ml-2" size={20} />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="hero-gradient py-20 px-4 text-center">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-display font-bold mb-6 text-shadow">
            Ready to Stock Premium Ice Cream?
          </h2>
          <p className="text-xl mb-8 text-white/90">
            Join hundreds of satisfied retailers and restaurants. Get your quote today!
          </p>
          <Link to="/contact" className="btn-frosted text-lg px-10 py-4">
            Request a Quote <ArrowRight className="inline ml-2" size={20} />
          </Link>
        </div>
      </section>

      <WebsiteFooter />
    </div>
  );
}
