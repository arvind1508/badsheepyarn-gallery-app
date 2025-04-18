import React, { useState, useCallback } from 'react';
import {
  Page,
  Badge,
  LegacyCard,
  Tabs,
  Text,
  BlockStack,
  Button,
  Icon,
  Link,
  EmptyState,
} from '@shopify/polaris';
import { ArrowLeftIcon, ArrowRightIcon } from '@shopify/polaris-icons';
import { useParams, useNavigate } from '@remix-run/react';
import MyGallery from '../components/Gallery';

function NotFoundPage() {
  const navigate = useNavigate();
  
  return (
    <Page>
      <EmptyState
        heading="Submission not found"
        action={{
          content: 'Back to Submissions',
          onAction: () => navigate('/app/submisstions'),
        }}
        image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
      >
        <p>The submission you're looking for doesn't exist or has been removed.</p>
      </EmptyState>
    </Page>
  );
}

function ViewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [selectedTab, setSelectedTab] = useState(0);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  // Tab handling
  const handleTabChange = useCallback((selectedTabIndex) => {
    setSelectedTab(selectedTabIndex);
  }, []);
  
  // Mock project data - in real app, this would come from an API call
  const [project, setProject] = useState({
    id: id,
    name: 'Project A',
    date: 'Apr 1, 2025',
    status: 'Pending',
    designer: 'Alice Johnson',
    product: 'Smart Watch',
    email: 'alice@example.com',
    images: [
      'https://via.placeholder.com/800x500?text=Project+1',
      'https://via.placeholder.com/800x500?text=Project+2',
      'https://via.placeholder.com/800x500?text=Project+3',
    ],
  });

  // Check if project exists - in real app, this would be an API check
  if (!project) {
    return <NotFoundPage />;
  }

  // Gallery navigation
  const handlePrevImage = () => {
    setCurrentImageIndex((prev) =>
      prev === 0 ? project.images.length - 1 : prev - 1
    );
  };

  const handleNextImage = () => {
    setCurrentImageIndex((prev) =>
      prev === project.images.length - 1 ? 0 : prev + 1
    );
  };

  // Approve/Reject actions
  const handleAction = (newStatus) => {
    setProject((prev) => ({ ...prev, status: newStatus }));
    // Add API call here to update status
  };

  const statusBadge = () => {
    switch (project.status) {
      case 'Approved':
        return <Badge tone="success">Approved</Badge>;
      case 'Rejected':
        return <Badge tone="critical">Rejected</Badge>;
      default:
        return <Badge tone="warning">Pending</Badge>;
    }
  };

  // Tab content
  const tabs = [
    {
      id: 'details',
      content: 'Details',
      panel: (
        <LegacyCard title="Project Details" sectioned>
          <BlockStack vertical spacing="tight">
            <Text variant="bodyMd" as="p">
              <strong>Project Name:</strong> {project.name}
            </Text>
            <Text variant="bodyMd" as="p">
              <strong>Designer:</strong> {project.designer}
            </Text>
            <Text variant="bodyMd" as="p">
              <strong>Product:</strong> {project.product}
            </Text>
            <Text variant="bodyMd" as="p">
              <strong>Date:</strong> {project.date}
            </Text>
            <Text variant="bodyMd" as="p">
              <strong>Email:</strong> {project.email}
            </Text>
          </BlockStack>
        </LegacyCard>
      ),
    },
    {
      id: 'gallery',
      content: 'Gallery',
      panel: (
        <LegacyCard title="Project Gallery" sectioned>
          <MyGallery images={project.images} />
        </LegacyCard>
      ),
    },
  ];

  return (
    <Page
      backAction={{ content: 'Submissions', url: '/app/submisstions' }}
      title={`${project.name} - ${project.designer}`}
      titleMetadata={statusBadge()}
      subtitle={`Submission ID: ${project.id}`}
      compactTitle
      primaryAction={
        project.status === 'Pending' && {
          content: 'Approve',
          onAction: () => handleAction('Approved'),
        }
      }
      secondaryActions={
        project.status === 'Pending'
          ? [
              {
                content: 'Reject',
                onAction: () => handleAction('Rejected'),
                destructive: true,
              },
            ]
          : []
      }
      actionGroups={[
        {
          title: 'More Actions',
          actions: [
            {
              content: 'Download Images',
              onAction: () => alert('Download images action'),
            },
          ],
        },
      ]}
    >
      <Tabs tabs={tabs} selected={selectedTab} onSelect={handleTabChange}>
        {tabs[selectedTab].panel}
      </Tabs>
    </Page>
  );
}

export default ViewPage;