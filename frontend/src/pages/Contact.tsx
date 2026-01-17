import { useState } from 'react';
import WebsiteHeader from '../components/WebsiteHeader';
import WebsiteFooter from '../components/WebsiteFooter';
import { Mail, Phone, MapPin, Clock, Send, MessageSquare } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    phone: '',
    message: '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Simulate form submission
    setTimeout(() => {
      toast.success('Thank you! We\'ll get back to you within 24 hours.');
      setFormData({ name: '', email: '', company: '', phone: '', message: '' });
      setLoading(false);
    }, 1000);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="min-h-screen bg-white">
      <WebsiteHeader />

      {/* Hero Section */}
      <section className="hero-gradient py-20 px-4 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-display font-bold mb-6 text-shadow">
            Get in Touch
          </h1>
          <p className="text-xl md:text-2xl text-white/90">
            Ready to stock premium ice cream? Let's talk about your needs.
          </p>
        </div>
      </section>

      {/* Contact Info Cards */}
      <section className="py-12 px-4 -mt-12">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl p-6 shadow-card hover:shadow-card-hover transition-all text-center">
              <div className="w-16 h-16 bg-gradient-frosted rounded-full flex items-center justify-center mx-auto mb-4">
                <Phone className="text-white" size={28} />
              </div>
              <h3 className="font-display font-bold text-lg mb-2">Call Us</h3>
              <a href="tel:+18005551234" className="text-frosted-purple hover:text-secondary transition-colors">
                +1 (800) 555-1234
              </a>
              <p className="text-gray-500 text-sm mt-1">Mon-Fri, 8am-6pm EST</p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-card hover:shadow-card-hover transition-all text-center">
              <div className="w-16 h-16 bg-gradient-frosted rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="text-white" size={28} />
              </div>
              <h3 className="font-display font-bold text-lg mb-2">Email Us</h3>
              <a href="mailto:info@frostedwholesale.com" className="text-frosted-purple hover:text-secondary transition-colors">
                info@frostedwholesale.com
              </a>
              <p className="text-gray-500 text-sm mt-1">We reply within 24 hours</p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-card hover:shadow-card-hover transition-all text-center">
              <div className="w-16 h-16 bg-gradient-frosted rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="text-white" size={28} />
              </div>
              <h3 className="font-display font-bold text-lg mb-2">Visit Us</h3>
              <p className="text-frosted-purple">
                123 Ice Cream Lane<br />
                Sweet City, SC 12345
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Form */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="section-title text-4xl font-display font-bold">
              Request a Quote
            </h2>
            <p className="text-gray-600 text-lg mt-4">
              Fill out the form below and our team will get back to you with a customized quote.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-card p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Your Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="input-frosted"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="input-frosted"
                  placeholder="john@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Company Name *
                </label>
                <input
                  type="text"
                  name="company"
                  value={formData.company}
                  onChange={handleChange}
                  required
                  className="input-frosted"
                  placeholder="Your Restaurant/Store"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="input-frosted"
                  placeholder="+1 (555) 123-4567"
                />
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Tell us about your needs *
              </label>
              <textarea
                name="message"
                value={formData.message}
                onChange={handleChange}
                required
                rows={6}
                className="input-frosted resize-none"
                placeholder="Please include details about order size, preferred flavors, delivery area, and any special requirements..."
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-frosted-primary flex items-center justify-center space-x-2"
            >
              {loading ? (
                <div className="spinner" />
              ) : (
                <>
                  <Send size={20} />
                  <span>Submit Request</span>
                </>
              )}
            </button>

            <p className="text-gray-500 text-sm text-center mt-4">
              By submitting this form, you agree to our privacy policy and terms of service.
            </p>
          </form>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="section-title text-4xl font-display font-bold">
            Frequently Asked Questions
          </h2>

          <div className="space-y-6 mt-12">
            <div className="bg-white rounded-xl p-6 shadow-card">
              <h3 className="font-display font-bold text-xl mb-3 text-frosted-purple flex items-center">
                <MessageSquare className="mr-3" size={24} />
                What is the minimum order quantity?
              </h3>
              <p className="text-gray-600 ml-9">
                Our minimum order is 5 gallons, but we offer the best pricing for orders of 50+ gallons. 
                Contact us for volume discounts and custom pricing.
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-card">
              <h3 className="font-display font-bold text-xl mb-3 text-frosted-purple flex items-center">
                <MessageSquare className="mr-3" size={24} />
                Do you offer custom flavors?
              </h3>
              <p className="text-gray-600 ml-9">
                Yes! We can create custom flavors tailored to your brand. Minimum order quantities apply 
                for custom flavors. Contact our team to discuss your ideas.
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-card">
              <h3 className="font-display font-bold text-xl mb-3 text-frosted-purple flex items-center">
                <MessageSquare className="mr-3" size={24} />
                What are your delivery areas?
              </h3>
              <p className="text-gray-600 ml-9">
                We deliver nationwide! Delivery times vary by location. Most orders arrive within 3-5 
                business days. Expedited shipping is available for an additional fee.
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-card">
              <h3 className="font-display font-bold text-xl mb-3 text-frosted-purple flex items-center">
                <MessageSquare className="mr-3" size={24} />
                What payment terms do you offer?
              </h3>
              <p className="text-gray-600 ml-9">
                We offer flexible payment terms based on order size: 1-3 items require immediate payment, 
                4-10 items get 1 week terms, and 11+ items get 2 week terms. Net 30 terms available for 
                approved accounts.
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-card">
              <h3 className="font-display font-bold text-xl mb-3 text-frosted-purple flex items-center">
                <MessageSquare className="mr-3" size={24} />
                How do I track my order?
              </h3>
              <p className="text-gray-600 ml-9">
                Once your order ships, you'll receive a tracking number via email. You can also log into 
                your account to view order status and tracking information.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Business Hours */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-block bg-white rounded-2xl shadow-card p-8">
            <div className="w-20 h-20 bg-gradient-frosted rounded-full flex items-center justify-center mx-auto mb-6">
              <Clock className="text-white" size={36} />
            </div>
            <h2 className="text-3xl font-display font-bold mb-6 text-frosted-purple">
              Business Hours
            </h2>
            <div className="space-y-3 text-lg">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-gray-700">Monday - Friday:</span>
                <span className="text-gray-600">8:00 AM - 6:00 PM EST</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-semibold text-gray-700">Saturday:</span>
                <span className="text-gray-600">9:00 AM - 2:00 PM EST</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-semibold text-gray-700">Sunday:</span>
                <span className="text-gray-600">Closed</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <WebsiteFooter />
    </div>
  );
}
