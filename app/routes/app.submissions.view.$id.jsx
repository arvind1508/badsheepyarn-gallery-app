import { json } from "@remix-run/node";
import { useLoaderData, useNavigate, useSubmit } from "@remix-run/react";
import {
  Page,
  Layout,
  Card,
  Text,
  Badge,
  Spinner,
  Box,
  FormLayout,
  TextField,
  EmptyState,
  ChoiceList,
} from "@shopify/polaris";
import {SaveBar, useAppBridge} from '@shopify/app-bridge-react';
import { useState } from "react";
import prisma from "../db.server";

export const loader = async ({ params }) => {
  const submission = await prisma.projectSubmission.findUnique({
    where: { id: params.id },
    include: {
      product: true,
      images: true,
    },
  });

  if (!submission) {
    throw new Response("Not Found", { status: 404 });
  }

  return json({ submission });
};

export const action = async ({ request, params }) => {
  const formData = await request.formData();
  const status = formData.get("status");

  if (!status) {
    return json({ error: "Status is required" }, { status: 400 });
  }

  const submission = await prisma.projectSubmission.update({
    where: { id: params.id },
    data: { status },
  });

  return json({ submission });
};

export default function SubmissionDetails() {
  const { submission } = useLoaderData();
  const navigate = useNavigate();
  const submit = useSubmit();
  const shopify = useAppBridge();
  const [isUpdating, setIsUpdating] = useState(false);
  const [selected, setSelected] = useState([submission.status]);
  const [tempStatus, setTempStatus] = useState([submission.status]);
  const [showSaveBar, setShowSaveBar] = useState(false);

  const handleStatusChange = (value) => {
    setTempStatus(value);
    setShowSaveBar(value[0] !== submission.status);
    if (value[0]!== submission.status) {
      shopify.saveBar.show('my-save-bar');
    } else {
      shopify.saveBar.hide('my-save-bar');
    }
  };

  const handleSaveStatus = () => {
    if (tempStatus[0] !== submission.status) {
      setIsUpdating(true);
      const formData = new FormData();
      formData.append("status", tempStatus[0]);
      submit(formData, { method: "post" });
      setSelected(tempStatus);
      setIsUpdating(false);
      setShowSaveBar(false);
      console.log('Saving');
      shopify.saveBar.hide('my-save-bar');
    }
  };

  const handleDiscardChanges = () => {
    setTempStatus([submission.status]);
    setShowSaveBar(false);
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      pending: { tone: "warning", label: "PENDING" },
      approved: { tone: "success", label: "APPROVED" },
      rejected: { tone: "critical", label: "REJECTED" },
    };
    const { tone, label } = statusMap[status] || statusMap.pending;
    return <Badge tone={tone}>{label}</Badge>;
  };




  return (
    <>
    <SaveBar id="my-save-bar">
        <button variant="primary" onClick={handleSaveStatus}></button>
        <button onClick={handleDiscardChanges}></button>
      </SaveBar>
      
      <Page
        backAction={{ content: "Submissions", onAction: () => navigate("/app/submisstions") }}
        title={`Project: ${submission.projectName}`}
        titleMetadata={getStatusBadge(submission.status)}
      >
        <Layout>  
          <Layout.Section secondary>
            <Card>
              <Box padding="4">
                <Text variant="headingMd" as="h2">Status Management</Text>
                <Box paddingTop="4">
                  {isUpdating ? (
                    <Box padding="4" textAlign="center">
                      <Spinner size="small" />
                    </Box>
                  ) : (
                    <ChoiceList
                      title="Submission Status"
                      titleHidden
                      choices={[
                        {
                          label: 'Pending Review',
                          value: 'pending',
                          helpText: 'Submission is waiting for review',
                        },
                        {
                          label: 'Approved',
                          value: 'approved',
                          helpText: 'Submission has been approved',
                        },
                        {
                          label: 'Rejected',
                          value: 'rejected',
                          helpText: 'Submission has been rejected',
                        },
                      ]}
                      selected={tempStatus}
                      onChange={handleStatusChange}
                    />
                  )}
                </Box>
              </Box>
            </Card>
          </Layout.Section>
        {/* I want gap both section */}
        <br/>
        

        <Layout.Section>
          <Card>
            <Box padding="4">
              <FormLayout>
                <Text variant="headingMd" as="h2">Designer Information</Text>
                <FormLayout.Group>
                  <TextField
                    label="First Name"
                    value={submission.firstName}
                    disabled
                    autoComplete="off"
                  />
                  <TextField
                    label="Last Name"
                    value={submission.lastName}
                    disabled
                    autoComplete="off"
                  />
                </FormLayout.Group>
                <TextField
                  label="Email"
                  value={submission.email}
                  disabled
                  autoComplete="off"
                />
                {submission.socialMediaHandle && (
                  <TextField
                    label="Social Media"
                    value={submission.socialMediaHandle}
                    disabled
                    autoComplete="off"
                  />
                )}
              </FormLayout>
            </Box>

            <Box padding="4" borderTopWidth="1" borderColor="border">
              <FormLayout>
                <Text variant="headingMd" as="h2">Project Information</Text>
                <TextField
                  label="Project Name"
                  value={submission.projectName}
                  disabled
                  autoComplete="off"
                />
                {submission.product && (
                  <TextField
                    label="Product"
                    value={submission.product.title}
                    disabled
                    autoComplete="off"
                  />
                )}
              </FormLayout>
            </Box>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Card>
            <Box padding="4">
              <Text variant="headingMd" as="h2">Project Images</Text>
              <Box paddingTop="4">
                {submission.images && submission.images.length > 0 ? (
                  <div style={{ 
                    display: "grid", 
                    gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", 
                    gap: "1rem",
                    padding: "1rem",
                    background: "var(--p-surface-subdued)",
                    borderRadius: "var(--p-border-radius-2)"
                  }}>
                    {submission.images.map((image, index) => (
                      <div 
                        key={index}
                        style={{
                          position: 'relative',
                          aspectRatio: '1',
                          overflow: 'hidden',
                          borderRadius: 'var(--p-border-radius-2)',
                          boxShadow: 'var(--p-shadow-card)',
                          background: 'var(--p-surface)',
                        }}
                      >
                        <img
                          src={image.url}
                          alt={`Project image ${index + 1}`}
                          style={{ 
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            transition: 'transform 0.3s ease',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'scale(1.05)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'scale(1)';
                          }}
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    heading="No project images"
                    image=""
                  >
                    <p>This submission doesn't have any images uploaded yet.</p>
                  </EmptyState>
                )}
              </Box>
            </Box>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
    </>
  );
}