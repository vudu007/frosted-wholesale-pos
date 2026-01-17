import WebsiteHeader from '../components/WebsiteHeader';
import WebsiteFooter from '../components/WebsiteFooter';
import { Award, Users, TrendingUp, Heart, IceCream, Truck, Shield } from 'lucide-react';

export default function About() {
  return (
    <div className="min-h-screen bg-white">
      <WebsiteHeader />

      {/* Hero Section */}
      <section className="hero-gradient py-20 px-4 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-display font-bold mb-6 text-shadow">
            About Frosted Wholesale
          </h1>
          <p className="text-xl md:text-2xl text-white/90">
            Your trusted partner in premium ice cream distribution since 2010
          </p>
        </div>
      </section>

      {/* Our Story */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="section-title text-4xl font-display font-bold">
            Our Story
          </h2>
          <div className="prose prose-lg max-w-none">
            <p className="text-gray-600 text-lg leading-relaxed mb-6">
              Founded in 2010, Frosted Wholesale began with a simple mission: to provide restaurants, 
              retailers, and distributors with the highest quality ice cream at competitive wholesale prices. 
              What started as a small family business has grown into one of the nation's leading ice cream 
              wholesale suppliers.
            </p>
            <p className="text-gray-600 text-lg leading-relaxed mb-6">
              We believe that great ice cream starts with great ingredients. That's why we partner with 
              local dairy farms and use only natural flavors and premium ingredients in every batch. Our 
              commitment to quality has earned us the trust of thousands of businesses across the country.
            </p>
            <p className="text-gray-600 text-lg leading-relaxed">
              Today, we serve over 5,000 businesses nationwide, delivering millions of gallons of premium 
              ice cream every year. But despite our growth, we've never lost sight of what matters most: 
              quality, service, and building lasting relationships with our customers.
            </p>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="bg-white rounded-2xl p-8 shadow-card">
              <div className="w-16 h-16 bg-gradient-frosted rounded-full flex items-center justify-center mb-6">
                <Heart className="text-white" size={32} />
              </div>
              <h3 className="text-3xl font-display font-bold mb-4 text-frosted-purple">
                Our Mission
              </h3>
              <p className="text-gray-600 text-lg leading-relaxed">
                To deliver exceptional quality ice cream products and outstanding service that helps our 
                customers succeed. We're committed to using premium ingredients, sustainable practices, 
                and innovative solutions to meet the evolving needs of the food service industry.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-card">
              <div className="w-16 h-16 bg-gradient-frosted rounded-full flex items-center justify-center mb-6">
                <TrendingUp className="text-white" size={32} />
              </div>
              <h3 className="text-3xl font-display font-bold mb-4 text-frosted-purple">
                Our Vision
              </h3>
              <p className="text-gray-600 text-lg leading-relaxed">
                To be the most trusted and innovative ice cream wholesale supplier in the nation, known 
                for our unwavering commitment to quality, sustainability, and customer success. We envision 
                a future where every scoop brings joy and every partnership drives mutual growth.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="section-title text-4xl font-display font-bold">
            Our Core Values
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-frosted rounded-full flex items-center justify-center mx-auto mb-6">
                <Award className="text-white" size={36} />
              </div>
              <h3 className="text-2xl font-display font-bold mb-3 text-frosted-purple">
                Quality First
              </h3>
              <p className="text-gray-600">
                We never compromise on quality. Every batch is crafted with premium ingredients and 
                undergoes rigorous testing to ensure perfection.
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-frosted rounded-full flex items-center justify-center mx-auto mb-6">
                <Shield className="text-white" size={36} />
              </div>
              <h3 className="text-2xl font-display font-bold mb-3 text-frosted-purple">
                Integrity
              </h3>
              <p className="text-gray-600">
                Honesty and transparency guide everything we do. We build trust through consistent 
                delivery of our promises and ethical business practices.
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-frosted rounded-full flex items-center justify-center mx-auto mb-6">
                <Users className="text-white" size={36} />
              </div>
              <h3 className="text-2xl font-display font-bold mb-3 text-frosted-purple">
                Customer Focus
              </h3>
              <p className="text-gray-600">
                Your success is our success. We're dedicated to understanding your needs and providing 
                solutions that help your business thrive.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-4 bg-gradient-frosted text-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-display font-bold text-center mb-12 text-shadow">
            Frosted by the Numbers
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-5xl font-display font-bold mb-2">15+</div>
              <div className="text-white/80">Years in Business</div>
            </div>

            <div className="text-center">
              <div className="text-5xl font-display font-bold mb-2">5,000+</div>
              <div className="text-white/80">Happy Customers</div>
            </div>

            <div className="text-center">
              <div className="text-5xl font-display font-bold mb-2">50+</div>
              <div className="text-white/80">Ice Cream Flavors</div>
            </div>

            <div className="text-center">
              <div className="text-5xl font-display font-bold mb-2">10M+</div>
              <div className="text-white/80">Gallons Delivered</div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="section-title text-4xl font-display font-bold">
            Why Choose Frosted Wholesale?
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
            <div className="bg-white rounded-xl p-8 shadow-card hover:shadow-card-hover transition-all">
              <IceCream className="text-frosted-purple mb-4" size={48} />
              <h3 className="text-xl font-display font-bold mb-3">Premium Quality</h3>
              <p className="text-gray-600">
                Made with the finest ingredients and crafted to perfection. Every batch meets our 
                strict quality standards.
              </p>
            </div>

            <div className="bg-white rounded-xl p-8 shadow-card hover:shadow-card-hover transition-all">
              <Truck className="text-frosted-purple mb-4" size={48} />
              <h3 className="text-xl font-display font-bold mb-3">Reliable Delivery</h3>
              <p className="text-gray-600">
                Fast, dependable delivery nationwide. We ensure your products arrive fresh and on time, 
                every time.
              </p>
            </div>

            <div className="bg-white rounded-xl p-8 shadow-card hover:shadow-card-hover transition-all">
              <Users className="text-frosted-purple mb-4" size={48} />
              <h3 className="text-xl font-display font-bold mb-3">Dedicated Support</h3>
              <p className="text-gray-600">
                Our team is here to help you succeed. From ordering to delivery, we provide exceptional 
                customer service.
              </p>
            </div>
          </div>
        </div>
      </section>

      <WebsiteFooter />
    </div>
  );
}
