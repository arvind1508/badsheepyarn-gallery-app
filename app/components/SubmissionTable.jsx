import React from 'react';
import { IndexTable, Badge, Layout, Text } from '@shopify/polaris';
import SubmissionActions from './SubmissionActions';

const SubmissionTable = ({ submissions, selectedTab, onApprove, onReject }) => {
  const filteredSubmissions = submissions.filter((sub) => sub.status === selectedTab);

  return (
    <IndexTable
      resourceName={{ singular: 'submission', plural: 'submissions' }}
      itemCount={filteredSubmissions.length}
      headings={[
        { title: 'Project Name' },
        { title: 'Designer Name' },
        { title: 'Product Name' },
        { title: 'Date' },
        { title: 'Status' },
        { title: 'Actions' },
      ]}
    >
      {filteredSubmissions.map((submission) => (
        <IndexTable.Row key={submission.id} id={submission.id}>
          <IndexTable.Cell>{submission.name}</IndexTable.Cell>
          <IndexTable.Cell>{submission.product}</IndexTable.Cell>
          <IndexTable.Cell>{submission.designer}</IndexTable.Cell>


          <IndexTable.Cell>{submission.date}</IndexTable.Cell>
          <IndexTable.Cell>
            <Badge progress={submission.status === 'Approved' ? 'complete' : 'incomplete'}>
              {submission.status}
            </Badge>
          </IndexTable.Cell>
          <IndexTable.Cell>
            {submission.status === 'Pending' ? (
              <SubmissionActions
                onApprove={() => onApprove(submission.id)}
                onReject={() => onReject(submission.id)}
              />
            ) : (
              <Text variant="bodyMd" color={submission.status === 'Approved' ? 'success' : 'critical'}>
                {submission.status}
              </Text>
            )}
          </IndexTable.Cell>
        </IndexTable.Row>
      ))}
    </IndexTable>
  );
};

export default SubmissionTable;
