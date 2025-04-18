import { Button, ButtonGroup } from '@shopify/polaris';

export default function SubmissionActions({ onApprove, onReject, onView, status }) {
  return (
    <ButtonGroup>
      <Button onClick={onView}>View</Button>
      {status === 'pending' && (
        <>
          <Button onClick={onApprove} tone="success">
            Approve
          </Button>
          <Button onClick={onReject} tone="critical">
            Reject
          </Button>
        </>
      )}
    </ButtonGroup>
  );
}
