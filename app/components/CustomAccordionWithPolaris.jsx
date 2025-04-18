import { useState } from 'react';
import { Card, Button, Box } from '@shopify/polaris';
import CardWithHeaderIconActions from './Card'; // Import your CardWithHeaderIconActions

const CustomAccordionWithPolaris = () => {
  const [activeIndex, setActiveIndex] = useState(null); // Track which section is open

  // Sample dynamic content
  const sections = [
    { title: 'About App', content: 'This is the content for section 1.' },
    { title: 'How to Setup?', content: 'This is the content for section 2.' },
  ];

  const handleToggle = (index) => {
    setActiveIndex(activeIndex === index ? null : index); // Toggle open/close
  };

  return (
    <div className="space-y-4">
      {sections.map((section, index) => (
        <div key={index} className="w-full">
           
          <CardWithHeaderIconActions
            title={section.title}
            content={section.content}
            isOpen={activeIndex === index} // Pass the active state to manage open/close
            onToggle={() => handleToggle(index)} // Handle the toggle function
          />
        </div>
      ))}
    </div>
  );
};

export default CustomAccordionWithPolaris;
