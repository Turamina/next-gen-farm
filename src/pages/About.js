import React from 'react';
import './About.css';

const About = () => {
  return (
    <div className="about-page">
      <div className="about-hero">
        <h1>About Next Gen Farm</h1>
        <p className="tagline">Revolutionizing Agriculture, Empowering Farmers</p>
      </div>

      <div className="about-content">
        <section className="about-section mission">
          <h2>Our Mission</h2>
          <p>
            At Next Gen Farm, we're committed to bridging the gap between farmers and consumers,
            creating a sustainable ecosystem that benefits both. Our mission is to revolutionize
            agricultural commerce through technology while preserving traditional farming values.
          </p>
        </section>

        <section className="about-section vision">
          <h2>Our Vision</h2>
          <p>
            We envision a future where technology empowers farmers to reach consumers directly,
            ensuring fair prices, fresh produce, and a transparent supply chain. We strive to
            make sustainable farming practices the norm, not the exception.
          </p>
        </section>

        <section className="about-section values">
          <h2>Our Values</h2>
          <div className="values-grid">
            <div className="value-item">
              <h3>🌱 Sustainability</h3>
              <p>Promoting eco-friendly farming practices and sustainable agriculture</p>
            </div>
            <div className="value-item">
              <h3>🤝 Integrity</h3>
              <p>Building trust through transparent business practices</p>
            </div>
            <div className="value-item">
              <h3>💪 Empowerment</h3>
              <p>Supporting farmers with technology and fair trade practices</p>
            </div>
            <div className="value-item">
              <h3>🔄 Innovation</h3>
              <p>Continuously improving through technology and feedback</p>
            </div>
          </div>
        </section>

        <section className="about-section story">
          <h2>Our Story</h2>
          <p>
            Founded in 2023, Next Gen Farm emerged from a simple yet powerful idea:
            what if we could use technology to bring farm-fresh products directly to
            consumers while ensuring farmers get their fair share? Today, we're proud
            to support over 1,000 farmers, serving fresh produce to more than 10,000
            satisfied customers.
          </p>
        </section>

        <section className="about-section achievements">
          <h2>Our Impact</h2>
          <div className="achievements-grid">
            <div className="achievement-item">
              <h3>1,000+</h3>
              <p>Farmers Empowered</p>
            </div>
            <div className="achievement-item">
              <h3>10,000+</h3>
              <p>Happy Customers</p>
            </div>
            <div className="achievement-item">
              <h3>50+</h3>
              <p>Cities Reached</p>
            </div>
            <div className="achievement-item">
              <h3>95%</h3>
              <p>Customer Satisfaction</p>
            </div>
          </div>
        </section>

        <section className="about-section team">
          <h2>Leadership Team</h2>
          <div className="team-grid">
            <div className="team-member">
              <div className="member-photo"></div>
              <h3>John Smith</h3>
              <p>CEO & Founder</p>
            </div>
            <div className="team-member">
              <div className="member-photo"></div>
              <h3>Sarah Johnson</h3>
              <p>Head of Operations</p>
            </div>
            <div className="team-member">
              <div className="member-photo"></div>
              <h3>Mike Chen</h3>
              <p>Technology Director</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default About;
