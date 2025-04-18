import { IndexFilters } from '@shopify/polaris';

const SubmissionFilters = ({ selectedTab, onSelect }) => (
  <IndexFilters
    tabs={[
      { content: 'Pending', id: 'Pending' },
      { content: 'Approved', id: 'Approved' },
      { content: 'Rejected', id: 'Rejected' },
    ]}
    selected={selectedTab}
    onSelect={onSelect}
  />
);

export default SubmissionFilters;
