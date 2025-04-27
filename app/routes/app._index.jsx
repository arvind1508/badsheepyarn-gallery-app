
import {
  Page,
  Layout,
  Text,
  BlockStack,
  Box,
  Grid,
} from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import { StatBox } from "../components/Stats";
import prisma from "../db.server";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";

export const loader = async ({ request }) => {
  await authenticate.admin(request);

  // Get today's date at midnight
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Get date 7 days ago
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

  // Get submissions for last 7 days
  const submissions = await prisma.projectSubmission.findMany({
    where: {
      createdAt: {
        gte: sevenDaysAgo,
        lte: new Date(),
      },
    },
    orderBy: {
      createdAt: 'asc',
    },
  });

  // Initialize arrays for each status
  const stats = {
    pending_submitions: Array(7).fill(0),
    approved_submitions: Array(7).fill(0),
    rejected_submitions: Array(7).fill(0),
  };

  // Group submissions by date and status
  submissions.forEach(submission => {
    const date = new Date(submission.createdAt);
    const dayIndex = Math.floor((date - sevenDaysAgo) / (1000 * 60 * 60 * 24));
    
    if (dayIndex >= 0 && dayIndex < 7) {
      switch (submission.status) {
        case 'pending':
          stats.pending_submitions[dayIndex]++;
          break;
        case 'approved':
          stats.approved_submitions[dayIndex]++;
          break;
        case 'rejected':
          stats.rejected_submitions[dayIndex]++;
          break;
      }
    }
  });

  return json({ stats });
};

export default function Index() {
  const { stats } = useLoaderData();

  return (
    <Page title="Hi 👋, Welcome to badsheepyarn Gallery Submission">
      <Layout>
        <Layout.Section>
          <Box padding='200'>
            <BlockStack gap='100'>
              <Text variant='headingMd'>Daily Stats</Text>
              <Text variant='bodySm' tone='subdued'>
                Shows rate of change from first entry of chart data to today
              </Text>
            </BlockStack>
          </Box>
        </Layout.Section>
        <Layout.Section>
          <Grid columns={3}>
            <Grid.Cell columnSpan={{ xs: 6, lg: 4 }}>
              <StatBox 
                title='Pending Submissions' 
                value={stats.pending_submitions.at(-1)} 
                data={stats.pending_submitions} 
              />
            </Grid.Cell>
            <Grid.Cell columnSpan={{ xs: 6, lg: 4 }}>
              <StatBox 
                title='Approved Submissions' 
                value={stats.approved_submitions.at(-1)} 
                data={stats.approved_submitions} 
              />
            </Grid.Cell>
            <Grid.Cell columnSpan={{ xs: 6, lg: 4 }}>
              <StatBox 
                title='Rejected Submissions' 
                value={stats.rejected_submitions.at(-1)} 
                data={stats.rejected_submitions} 
              />
            </Grid.Cell>
          </Grid>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
  