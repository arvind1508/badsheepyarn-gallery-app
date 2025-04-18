import React from 'react';
import { BlockStack, Button, Card, InlineGrid, Text } from '@shopify/polaris';
import { CaretDownIcon, CaretUpIcon } from '@shopify/polaris-icons';

function CardWithHeaderIconActions({ content, title, isOpen, onToggle }) {
  return (
    <Card roundedAbove="sm">
      <BlockStack gap="200">
        <InlineGrid columns="1fr auto">
          <Text as="h2" variant="headingSm">
            {title}
          </Text>
          <Button
            onClick={onToggle}
            accessibilityLabel="Toggle content visibility"
            icon={isOpen ? CaretUpIcon : CaretDownIcon} // Toggle icon based on isOpen state
          />
        </InlineGrid>
        {isOpen && (
          <div>
            {content} {/* Only display content if isOpen is true */}
          </div>
        )}
      </BlockStack>
    </Card>
  );
}

export default CardWithHeaderIconActions;
