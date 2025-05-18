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
  Banner,
  DataTable,
  Tag,
  InlineStack,
  LegacyStack,
  Icon, 
  Divider,
} from "@shopify/polaris";
import {
  HashtagIcon,
  NoteIcon,
} from '@shopify/polaris-icons';
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
  const rejectionReason = formData.get("rejectionReason");

  if (!status) {
    return json({ error: "Status is required" }, { status: 400 });
  }

  const updateData = { 
    status,
    ...(status === "approved" && { approvedAt: new Date() }),
    ...(status === "rejected" && { rejectedAt: new Date(), rejectionReason }),
  };

  const submission = await prisma.projectSubmission.update({
    where: { id: params.id },
    data: updateData,
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
  const [rejectionReason, setRejectionReason] = useState(submission.rejectionReason || "");

  const CATEGORY_OPTIONS = {
    "socks": "Socks",
    "headware": "Headware",
    "shawls": "Shawls",
    "cowls": "Cowls",
    "blankets": "Blankets",
    "sweaters": "Sweaters",
    "mittens": "Mittens & Gloves",
    "tops": "Tops",
    "babies": "Babies",
    "scarves": "Scarves",
    "ponchos": "Ponchos",
    "vests": "Vests",
    "wip": "WIP",
    "toys": "Toys",
    "decor": "Decor",
    "wraps": "Wraps",
    "apparel": "Apparel",
    "accessories": "Accessories",
    "home-decor": "Home Decor",
    "art": "Art",
    "toys-games": "Toys & Games",
    "stationery": "Stationery",
    "jewelry": "Jewelry",
    "baby": "Baby",
    "crafts": "Crafts",
    "seasonal": "Seasonal",
    "other": "Other"
  };
  
  const getCategoryLabel = (value) => {
    return CATEGORY_OPTIONS[value] || value;
  };

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
      
      if (tempStatus[0] === "rejected" && rejectionReason) {
        formData.append("rejectionReason", rejectionReason);
      }
      
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
    setRejectionReason(submission.rejectionReason || "");
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

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString();
  };

  // Format the name based on preference
  const getDisplayName = () => {
    switch (submission.nameDisplayPreference) {
      case "full":
        return `${submission.firstName} ${submission.lastName}`;
      case "first":
        return submission.firstName;
      case "last":
        return submission.lastName;
      case "designer":
        return submission.designerName || `${submission.firstName} ${submission.lastName}`;
      default:
        return `${submission.firstName} ${submission.lastName}`;
    }
  };

  return (
    <>
    <SaveBar id="my-save-bar">
        <button variant="primary" onClick={handleSaveStatus}></button>
        <button onClick={handleDiscardChanges}></button>
      </SaveBar>
      
      <Page
        backAction={{ content: "Submissions", onAction: () => navigate("/app/submissions") }}
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
                
                {tempStatus[0] === "rejected" && (
                  <Box paddingTop="4">
                    <TextField
                      label="Rejection Reason"
                      value={rejectionReason}
                      onChange={setRejectionReason}
                      multiline={4}
                      autoComplete="off"
                      placeholder="Please provide a reason for rejection"
                    />
                  </Box>
                )}

                <Box paddingTop="4">
                  <DataTable
                    columnContentTypes={["text", "text"]}
                    headings={["Status Date", "Value"]}
                    rows={[
                      ["Submitted", formatDate(submission.submittedAt)],
                      ["Approved", formatDate(submission.approvedAt)],
                      ["Rejected", formatDate(submission.rejectedAt)],
                    ]}
                  />
                </Box>
              </Box>
            </Card>

            <Box paddingTop="4">
              <Card>
                <Box padding="4">
                  <Text variant="headingMd" as="h2">Project Classification</Text>
                  
                  <Box paddingTop="4">
                    <LegacyStack vertical spacing="tight">
                      <LegacyStack alignment="center" spacing="tight">
                        <Icon source={HashtagIcon} color="subdued" />
                        <Text variant="headingSm" as="h3">Categories</Text>
                      </LegacyStack>
                      
                      <Box 
                        paddingTop="2" 
                        paddingBottom="3" 
                        paddingInlineStart="3" 
                        paddingInlineEnd="3" 
                        background="surface-subdued" 
                        borderRadius="2"
                      >
                        {submission.categories && submission.categories.length > 0 ? (
                          <Box paddingTop="2" paddingBottom="1">
                            <InlineStack gap="2" wrap>
                              {submission.categories.map((category, index) => (
                                <Tag key={index}>{getCategoryLabel(category)}</Tag>
                              ))}
                            </InlineStack>
                          </Box>
                        ) : (
                          <Box paddingY="3" paddingX="3" textAlign="center">
                            <Text color="subdued">No categories assigned to this project</Text>
                          </Box>
                        )}
                      </Box>
                    </LegacyStack>
                  </Box>
                  
                  {submission.projectDetails && (
                    <>
                      <Divider borderColor="border" borderWidth="1" />
                      <Box paddingTop="4">
                        <LegacyStack vertical spacing="tight">
                          <LegacyStack alignment="center" spacing="tight">
                            <Icon source={NoteIcon} color="subdued" />
                            <Text variant="headingSm" as="h3">Project Details</Text>
                          </LegacyStack>
                          
                          <Box 
                            paddingTop="3" 
                            paddingBottom="3" 
                            paddingInlineStart="3" 
                            paddingInlineEnd="3" 
                            background="surface-subdued" 
                            borderRadius="2"
                          >
                            <div 
                              className="rich-text-content"
                              dangerouslySetInnerHTML={{ __html: submission.projectDetails }}
                              style={{
                                lineHeight: '1.5',
                                fontSize: '14px',
                              }}
                            />
                          </Box>
                        </LegacyStack>
                      </Box>
                    </>
                  )}
                </Box>
              </Card>
            </Box>

            <Box paddingTop="4">
              <Card>
                <Box padding="4">
                  <Text variant="headingMd" as="h2">Store Information</Text>
                  <Box paddingTop="4">
                    <TextField
                      label="Shop"
                      value={submission.shop || "N/A"}
                      disabled
                      autoComplete="off"
                    />
                  </Box>
                </Box>
              </Card>
            </Box>
          </Layout.Section>
          
          <Layout.Section>
            <Card>
              <Box padding="4">
                <FormLayout>
                  <Text variant="headingMd" as="h2">Designer Information</Text>
                  <Banner title={`Display name preference: ${submission.nameDisplayPreference}`}>
                    <p>This submission will display as: <strong>{getDisplayName()}</strong></p>
                  </Banner>
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
                  {submission.designerName && (
                    <TextField
                      label="Designer Name"
                      value={submission.designerName}
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
                  {submission.patternName && (
                    <TextField
                      label="Pattern Name"
                      value={submission.patternName}
                      disabled
                      autoComplete="off"
                    />
                  )}
                  {submission.patternLink && (
                    <TextField
                      label="Pattern Link"
                      value={submission.patternLink}
                      disabled
                      autoComplete="off"
                    />
                  )}
                  {submission.product && (
                    <>
                      <TextField
                        label="Product"
                        value={submission.product.title}
                        disabled
                        autoComplete="off"
                      />
                      <FormLayout.Group>
                        <TextField
                          label="Product Handle"
                          value={submission.product.handle}
                          disabled
                          autoComplete="off"
                        />
                        <TextField
                          label="Price"
                          value={`$${submission.product.price.toFixed(2)}`}
                          disabled
                          autoComplete="off"
                        />
                      </FormLayout.Group>
                      {submission.product.selectedOption && (
                        <TextField
                          label="Selected Options"
                          value={JSON.stringify(submission.product.selectedOption, null, 2)}
                          disabled
                          multiline={3}
                          autoComplete="off"
                        />
                      )}
                    </>
                  )}
                </FormLayout>
              </Box>
            </Card>
          </Layout.Section>

          <Layout.Section>
            <Card>
              <Box padding="4">
               
                <Box paddingTop="4">
                  <Text variant="headingSm" as="h3">Submission Images</Text>
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