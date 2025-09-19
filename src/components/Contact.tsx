import React from 'react';
import { motion } from 'framer-motion';
import { 
  MapPin, 
  Phone, 
  Mail, 
  Building2, 
  Globe, 
  Clock,
  User,
  Send
} from 'lucide-react';

const Contact: React.FC = () => {
  const offices = [
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
  ];

  const leadership = [
    {
      name: 'Dr. Muhammad Ehsan',
      title: 'Chief Executive Officer',
      photo: '/Dr Ehsan.png'
    },
    {
      name: 'Muhammad Saad Khan',
      title: 'Chief Operating Officer',
      photo: '/Saad Khan.jpeg'
    },
    {
      name: 'Ali Nasir',
      title: 'Product Owner & AI Consultant',
      photo: '/Ali Nasir Picture.jpg'
    }
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h1 className="text-4xl font-bold text-gray-100 mb-4">Contact Inseyab</h1>
        <p className="text-xl text-gray-400 max-w-3xl mx-auto">
          Get in touch with our global team. We're here to help you transform your data into actionable insights.
        </p>
      </motion.div>

      {/* Quick Contact */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
          <div>
            <Globe className="w-8 h-8 text-white mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-white mb-2">Website</h3>
            <a 
              href="https://inseyab.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-100 hover:text-white transition-colors"
            >
              inseyab.com
            </a>
          </div>
          <div>
            <Mail className="w-8 h-8 text-white mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-white mb-2">General Inquiries</h3>
            <a 
              href="mailto:info@inseyab.com"
              className="text-blue-100 hover:text-white transition-colors"
            >
              info@inseyab.com
            </a>
          </div>
          <div>
            <Clock className="w-8 h-8 text-white mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-white mb-2">Business Hours</h3>
            <p className="text-blue-100">Mon - Fri: 9:00 AM - 6:00 PM</p>
          </div>
        </div>
      </motion.div>

      {/* Office Locations */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-100 text-center mb-8">Our Global Offices</h2>
        {offices.map((office, index) => (
          <motion.div
            key={office.type}
            initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 + index * 0.1 }}
            className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden"
          >
            <div className={`bg-gradient-to-r ${office.color} p-4`}>
              <div className="flex items-center space-x-3">
                <Building2 className="w-6 h-6 text-white" />
                <div>
                  <h3 className="text-lg font-bold text-white">{office.type}</h3>
                  <p className="text-white/80">{office.country}</p>
                </div>
              </div>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Address */}
                <div>
                  <div className="flex items-start space-x-3 mb-4">
                    <MapPin className="w-5 h-5 text-gray-400 mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-gray-100 mb-2">Address</h4>
                      <p className="text-gray-300 text-sm leading-relaxed">{office.address}</p>
                    </div>
                  </div>
                </div>
                
                {/* Contact Person */}
                <div>
                  <div className="flex items-start space-x-3">
                    <User className="w-5 h-5 text-gray-400 mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-gray-100 mb-2">Contact Person</h4>
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
            </div>
          </motion.div>
        ))}
      </div>

      {/* Leadership Team */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-gray-800 rounded-xl p-8 border border-gray-700"
      >
        <h3 className="text-2xl font-bold text-gray-100 mb-6 text-center">Leadership Team</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {leadership.map((leader, index) => (
            <motion.div
              key={leader.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 + index * 0.1 }}
              className="text-center p-6 bg-gray-700 rounded-xl"
            >
              <div className="w-20 h-20 rounded-full mx-auto mb-4 overflow-hidden border-4 border-gray-500">
                <img 
                  src={leader.photo} 
                  alt={leader.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <h4 className="text-lg font-semibold text-gray-100 mb-1">{leader.name}</h4>
              <p className="text-gray-400 text-sm">{leader.title}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Contact Form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
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

      {/* Map or Additional Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="bg-gradient-to-r from-gray-800 to-gray-700 rounded-xl p-8 border border-gray-600 text-center"
      >
        <h3 className="text-xl font-bold text-gray-100 mb-4">Ready to Get Started?</h3>
        <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
          Whether you're looking to implement AI solutions, need technical support, or want to explore 
          partnership opportunities, our team is ready to help you succeed.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="https://inseyab.com"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Explore Our Solutions
          </a>
          <a
            href="mailto:info@inseyab.com"
            className="bg-transparent border-2 border-gray-500 text-gray-300 px-6 py-3 rounded-lg font-semibold hover:border-gray-400 hover:text-gray-200 transition-colors"
          >
            Schedule a Consultation
          </a>
        </div>
      </motion.div>
    </div>
  );
};

export default Contact;