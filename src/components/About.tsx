import React from 'react';
import { motion } from 'framer-motion';
import { 
  Building2, 
  Users, 
  Target, 
  Globe, 
  Award, 
  Lightbulb,
  TrendingUp,
  Shield,
  MapPin,
  Phone,
  Mail,
  Clock,
  User,
  Send
} from 'lucide-react';

const About: React.FC = () => {
  const features = [
    {
      icon: Target,
      title: 'Our Mission',
      description: 'To break down barriers between organizations and their data, making insights accessible to everyone.'
    },
    {
      icon: Lightbulb,
      title: 'Innovation',
      description: 'Cutting-edge no-code/low-code Business Intelligence solutions infused with artificial intelligence.'
    },
    {
      icon: TrendingUp,
      title: 'Growth',
      description: 'Empowering enterprises and governments to harness the true potential of their data.'
    },
    {
      icon: Shield,
      title: 'Reliability',
      description: 'Enterprise-grade solutions built with security, scalability, and performance in mind.'
    }
  ];

  const stats = [
    { label: 'Global Offices', value: '4', icon: Building2 },
    { label: 'Countries', value: '4', icon: Globe },
    { label: 'Expert Team', value: '50+', icon: Users },
    { label: 'Years Experience', value: '10+', icon: Award }
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h1 className="text-4xl font-bold text-gray-100 mb-4">About Inseyab</h1>
        <p className="text-xl text-gray-400 max-w-3xl mx-auto">
          Pioneering the future of AI-powered business intelligence and data analytics
        </p>
      </motion.div>

      {/* Company Logo/Brand Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-gray-800 border border-gray-700 rounded-2xl p-8 text-center relative overflow-hidden"
      >
        {/* Subtle background pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-purple-600/10"></div>
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-blue-500/5 to-purple-500/5"></div>
        
        <div className="relative z-10">
        <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 p-2">
          <img 
            src="/Inseyab logo copy.png" 
            alt="Inseyab Logo"
            className="w-full h-full object-contain"
          />
        </div>
        <h2 className="text-3xl font-bold text-gray-100 mb-4">Inseyab</h2>
        <p className="text-blue-100 text-lg max-w-2xl mx-auto">
          Transforming how organizations interact with their data through innovative AI solutions
        </p>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + index * 0.1 }}
            className="bg-gray-800 rounded-xl p-6 text-center border border-gray-700"
          >
            <stat.icon className="w-8 h-8 text-blue-400 mx-auto mb-3" />
            <div className="text-2xl font-bold text-gray-100 mb-1">{stat.value}</div>
            <div className="text-sm text-gray-400">{stat.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Our Story */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-gray-800 rounded-xl p-8 border border-gray-700"
      >
        <h3 className="text-2xl font-bold text-gray-100 mb-6">Our Story</h3>
        <div className="prose prose-invert max-w-none">
          <p className="text-gray-300 text-lg leading-relaxed mb-6">
            Inseyab was founded with a singular purpose: to break down the barriers between organizations 
            and their data. We realized that while data had the power to drive innovation, growth, and 
            progress, many enterprises and governments struggled to harness its true potential.
          </p>
          <p className="text-gray-300 text-lg leading-relaxed mb-6">
            Complex, time-consuming BI tools, coupled with a lack of skilled analysts, created a chasm 
            that left valuable insights untapped. Our founders, a passionate team of data enthusiasts 
            and AI experts, saw an opportunity to bridge this gap.
          </p>
          <p className="text-gray-300 text-lg leading-relaxed">
            They envisioned a world where decision-makers, regardless of their technical prowess, could 
            easily access, understand, and act on data. This vision led to the creation of Inseyab and 
            our cutting-edge no-code/low-code Business Intelligence solutions, infused with artificial intelligence.
          </p>
        </div>
      </motion.div>

      {/* Features */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {features.map((feature, index) => (
          <motion.div
            key={feature.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 + index * 0.1 }}
            className="bg-gray-800 rounded-xl p-6 border border-gray-700"
          >
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <feature.icon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h4 className="text-lg font-semibold text-gray-100 mb-2">{feature.title}</h4>
                <p className="text-gray-400">{feature.description}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Global Presence */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-gray-800 rounded-xl p-8 border border-gray-700"
      >
        <h3 className="text-2xl font-bold text-gray-100 mb-6 flex items-center">
          <Globe className="w-8 h-8 text-blue-400 mr-3" />
          Global Presence
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Building2 className="w-8 h-8 text-white" />
            </div>
            <h4 className="text-lg font-semibold text-gray-100 mb-2">UAE - Head Office</h4>
            <p className="text-gray-400 text-sm">Abu Dhabi</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Building2 className="w-8 h-8 text-white" />
            </div>
            <h4 className="text-lg font-semibold text-gray-100 mb-2">Saudi Arabia - Regional</h4>
            <p className="text-gray-400 text-sm">Riyadh</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Building2 className="w-8 h-8 text-white" />
            </div>
            <h4 className="text-lg font-semibold text-gray-100 mb-2">Pakistan - Development</h4>
            <p className="text-gray-400 text-sm">Karachi</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-orange-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Building2 className="w-8 h-8 text-white" />
            </div>
            <h4 className="text-lg font-semibold text-gray-100 mb-2">Malaysia - Regional</h4>
            <p className="text-gray-400 text-sm">Cyberjaya</p>
          </div>
        </div>
      </motion.div>

      {/* Leadership Team */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-gray-800 rounded-xl p-8 border border-gray-700"
      >
        <h3 className="text-2xl font-bold text-gray-100 mb-6 flex items-center">
          <Users className="w-8 h-8 text-blue-400 mr-3" />
          Leadership Team
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-20 h-20 rounded-full mx-auto mb-4 overflow-hidden border-4 border-blue-500">
              <img 
                src="/Dr Ehsan.png" 
                alt="Dr. Muhammad Ehsan"
                className="w-full h-full object-cover"
              />
            </div>
            <h4 className="text-lg font-semibold text-gray-100">Dr. Muhammad Ehsan</h4>
            <p className="text-blue-400 font-medium">Chief Executive Officer</p>
          </div>
          <div className="text-center">
            <div className="w-20 h-20 rounded-full mx-auto mb-4 overflow-hidden border-4 border-green-500">
              <img 
                src="/Saad Khan.jpeg" 
                alt="Muhammad Saad Khan"
                className="w-full h-full object-cover"
              />
            </div>
            <h4 className="text-lg font-semibold text-gray-100">Muhammad Saad Khan</h4>
            <p className="text-green-400 font-medium">Chief Operating Officer</p>
          </div>
          <div className="text-center">
            <div className="w-20 h-20 rounded-full mx-auto mb-4 overflow-hidden border-4 border-purple-500">
              <img 
                src="/Ali Nasir Picture.jpg" 
                alt="Ali Nasir"
                className="w-full h-full object-cover"
              />
            </div>
            <h4 className="text-lg font-semibold text-gray-100">Ali Nasir</h4>
            <p className="text-purple-400 font-medium">Product Owner & AI Consultant</p>
          </div>
        </div>
      </motion.div>

      {/* Contact Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="space-y-8"
      >
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-100 mb-4">Contact Us</h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Get in touch with our global team. We're here to help you transform your data into actionable insights.
          </p>
        </div>

        {/* Quick Contact */}
        <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30 rounded-2xl p-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div>
              <Globe className="w-8 h-8 text-blue-400 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-gray-100 mb-2">Website</h3>
              <a 
                href="https://inseyab.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 transition-colors"
              >
                inseyab.com
              </a>
            </div>
            <div>
              <Mail className="w-8 h-8 text-blue-400 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-gray-100 mb-2">General Inquiries</h3>
              <a 
                href="mailto:info@inseyab.com"
                className="text-blue-400 hover:text-blue-300 transition-colors"
              >
                info@inseyab.com
              </a>
            </div>
            <div>
              <Clock className="w-8 h-8 text-blue-400 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-gray-100 mb-2">Business Hours</h3>
              <p className="text-gray-300">Mon - Fri: 9:00 AM - 6:00 PM</p>
            </div>
          </div>
        </div>

        {/* Office Locations */}
        <div className="space-y-6">
          <h3 className="text-2xl font-bold text-gray-100 text-center">Our Global Offices</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[
              {
                type: 'HEAD OFFICE',
                country: 'United Arab Emirates',
                address: 'Office# 29, 3rd Floor Tower 1, Mazyad Mall, Z9 MBZ, Abu Dhabi, United Arab Emirates',
                contact: {
                  name: 'Muhammad Saad Khan',
                  phone: '+971 56 176 4597',
                  email: 'saad@inseyab.com'
                },
                color: 'from-green-500 to-emerald-600'
              },
              {
                type: 'REGIONAL OFFICE',
                country: 'Saudi Arabia',
                address: '8602, Prince Mansur Ibn Abdulaziz Road Al-Ulaya, Tower #19, Unit No:5, Riyadh 12611, Saudi Arabia PO BOX 3194',
                contact: {
                  name: 'Muhammad Saad Khan',
                  phone: '+966 53 857 4176',
                  email: 'saad@inseyab.com'
                },
                color: 'from-blue-500 to-cyan-600'
              },
              {
                type: 'REGIONAL OFFICE',
                country: 'Malaysia',
                address: 'Skypark, Jalan Teknokrat 1, Cyberjaya, 63000, Selangor, Malaysia',
                contact: {
                  name: 'Dr. Bob Niknejadi',
                  phone: '+60 12 972 0964',
                  email: 'bob@inseyab.com'
                },
                color: 'from-orange-500 to-red-600'
              },
              {
                type: 'DEVELOPMENT OFFICE',
                country: 'Pakistan',
                address: 'Office# 104 & 117, First Floor, NASTP Shahrah-e-Faisal Cantonment, Karachi, Karachi City, Sindh, 75240',
                contact: {
                  name: 'Kashif Ali Syed',
                  phone: '+92 333 2221470',
                  email: 'kashifalisyed@inseyab.com'
                },
                color: 'from-purple-500 to-violet-600'
              }
            ].map((office, index) => (
              <motion.div
                key={office.type + office.country}
                initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.9 + index * 0.1 }}
                className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden"
              >
                <div className={`bg-gradient-to-r ${office.color} p-4`}>
                  <div className="flex items-center space-x-3">
                    <Building2 className="w-6 h-6 text-white" />
                    <div>
                      <h4 className="text-lg font-bold text-white">{office.type}</h4>
                      <p className="text-white/80">{office.country}</p>
                    </div>
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="space-y-4">
                    {/* Address */}
                    <div className="flex items-start space-x-3">
                      <MapPin className="w-5 h-5 text-gray-400 mt-1 flex-shrink-0" />
                      <div>
                        <h5 className="font-semibold text-gray-100 mb-2">Address</h5>
                        <p className="text-gray-300 text-sm leading-relaxed">{office.address}</p>
                      </div>
                    </div>
                    
                    {/* Contact Person */}
                    <div className="flex items-start space-x-3">
                      <User className="w-5 h-5 text-gray-400 mt-1 flex-shrink-0" />
                      <div>
                        <h5 className="font-semibold text-gray-100 mb-2">Contact Person</h5>
                        <div className="space-y-2">
                          <p className="text-gray-300 font-medium">{office.contact.name}</p>
                          <div className="flex items-center space-x-2">
                            <Phone className="w-4 h-4 text-gray-400" />
                            <a 
                              href={`tel:${office.contact.phone}`}
                              className="text-blue-400 hover:text-blue-300 transition-colors text-sm"
                            >
                              {office.contact.phone}
                            </a>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Mail className="w-4 h-4 text-gray-400" />
                            <a 
                              href={`mailto:${office.contact.email}`}
                              className="text-blue-400 hover:text-blue-300 transition-colors text-sm"
                            >
                              {office.contact.email}
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Contact Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
          className="bg-gray-800 rounded-xl p-8 border border-gray-700"
        >
          <h3 className="text-2xl font-bold text-gray-100 mb-6 text-center">Send us a Message</h3>
          <form className="space-y-6 max-w-2xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  First Name
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Your first name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Last Name
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Your last name"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Email Address
              </label>
              <input
                type="email"
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="your.email@example.com"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Company
              </label>
              <input
                type="text"
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Your company name"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Subject
              </label>
              <select className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option value="">Select a subject</option>
                <option value="general">General Inquiry</option>
                <option value="sales">Sales & Partnerships</option>
                <option value="support">Technical Support</option>
                <option value="careers">Careers</option>
                <option value="media">Media & Press</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Message
              </label>
              <textarea
                rows={6}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Tell us about your project or inquiry..."
              ></textarea>
            </div>
            
            <div className="text-center">
              <button
                type="submit"
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-200 flex items-center space-x-2 mx-auto"
              >
                <Send className="w-5 h-5" />
                <span>Send Message</span>
              </button>
            </div>
          </form>
        </motion.div>

        {/* Call to Action */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.3 }}
          className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-8 text-center"
        >
          <h3 className="text-2xl font-bold text-white mb-4">Ready to Transform Your Data?</h3>
          <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
            Discover how Inseyab's AI-powered solutions can unlock the potential of your data 
            and drive your organization forward.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="https://inseyab.com"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              Visit Our Website
            </a>
            <button className="bg-transparent border-2 border-white text-white px-6 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors">
              Contact Us
            </button>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default About;