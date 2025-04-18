
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
import CustomAccordionWithPolaris from "../components/CustomAccordionWithPolaris";
  
  export const loader = async ({ request }) => {
    await authenticate.admin(request);
  
    return null;
  };
  const stats = {
    pending_submitions: [13, 20, 18, 5, 8, 15, 23],
    approved_submitions: [13, 20, 18, 5, 8, 15, 23],
    rejected_submitions: [13, 20, 18, 5, 8, 15, 23],

  };
  
  
  
  export default function Index() {
  
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
              <StatBox title='Pending Submisstion' value={stats.pending_submitions.at(-1)} data={stats.pending_submitions} />
            </Grid.Cell>
            <Grid.Cell columnSpan={{ xs: 6, lg: 4 }}>
              <StatBox title='Approved Submisstions' value={stats.approved_submitions.at(-1)} data={stats.approved_submitions} />
            </Grid.Cell>
            <Grid.Cell columnSpan={{ xs: 6, lg: 4 }}>
              <StatBox title='Rejected Submisstions' value={stats.rejected_submitions.at(-1)} data={stats.rejected_submitions} />
            </Grid.Cell>
          </Grid>
        </Layout.Section>
      </Layout>
    </Page>
    );
  }
  