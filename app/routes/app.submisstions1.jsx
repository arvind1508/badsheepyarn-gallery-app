import {
  IndexTable,
  LegacyCard,
  IndexFilters,
  Text,
  Badge,
  useBreakpoints,
  Toast,
  Pagination,
} from '@shopify/polaris';
import { useState, useCallback, useEffect } from 'react';
import { useNavigate, useFetcher } from '@remix-run/react';
import SubmissionActions from '../components/SubmissionActions';

function Page() {
  const navigate = useNavigate();
  const fetcher = useFetcher();
  const [submissions, setSubmissions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [selected, setSelected] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [mode, setMode] = useState('default');

  const tabs = [
    {
      content: 'All',
      id: 'all',
      panelID: 'all-content',
    },
    {
      content: 'Pending',
      id: 'pending',
      panelID: 'pending-content',
    },
    {
      content: 'Approved',
      id: 'approved',
      panelID: 'approved-content',
    },
  ];

  // Fetch submissions when tab or page changes
  useEffect(() => {
    const status = selected === 0 ? 'all' : tabs[selected].id;
    fetcher.load(`/api/submissions?page=${currentPage}&status=${status}`);
  }, [selected, currentPage]);

  // Update submissions when data is loaded
  useEffect(() => {
    if (fetcher.data) {
      setSubmissions(fetcher.data.submissions || []);
      setTotalPages(fetcher.data.pagination?.totalPages || 1);
      setIsLoading(false);
    }
  }, [fetcher.data]);

  const handleTabChange = useCallback((selectedTabIndex) => {
    setSelected(selectedTabIndex);
    setCurrentPage(1); // Reset to first page when changing tabs
  }, []);

  const onApprove = async (id) => {
    try {
      const response = await fetch(`/api/submissions/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'approved' }),
      });

      if (response.ok) {
        setToast({
          content: 'Submission approved successfully',
          error: false,
        });
        // Refresh submissions
        const status = selected === 0 ? 'all' : tabs[selected].id;
        fetcher.load(`/api/submissions?page=${currentPage}&status=${status}`);
      } else {
        throw new Error('Failed to approve submission');
      }
    } catch (error) {
      setToast({
        content: 'Error approving submission',
        error: true,
      });
    }
  };

  const onReject = async (id) => {
    try {
      const response = await fetch(`/api/submissions/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'rejected' }),
      });

      if (response.ok) {
        setToast({
          content: 'Submission rejected successfully',
          error: false,
        });
        // Refresh submissions
        const status = selected === 0 ? 'all' : tabs[selected].id;
        fetcher.load(`/api/submissions?page=${currentPage}&status=${status}`);
      } else {
        throw new Error('Failed to reject submission');
      }
    } catch (error) {
      setToast({
        content: 'Error rejecting submission',
        error: true,
      });
    }
  };

  const onView = (id) => {
    navigate(`/app/view/${id}`);
  };

  const rowMarkup = submissions.map(
    ({ id, projectName, submittedAt, designerName, product, status }, index) => (
      <IndexTable.Row
        id={id}
        key={id}
        selected={false}
        position={index}
      >
        <IndexTable.Cell>
          <Text variant="bodyMd" fontWeight="bold" as="span">
            {projectName}
          </Text>
        </IndexTable.Cell>
        <IndexTable.Cell>{designerName}</IndexTable.Cell>
        <IndexTable.Cell>{product?.title}</IndexTable.Cell>
        <IndexTable.Cell>{new Date(submittedAt).toLocaleDateString()}</IndexTable.Cell>
        <IndexTable.Cell>
          <Badge tone={status === 'approved' ? 'success' : status === 'rejected' ? 'critical' : 'attention'}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Badge>
        </IndexTable.Cell>
        <IndexTable.Cell>
          <SubmissionActions
            onApprove={() => onApprove(id)}
            onReject={() => onReject(id)}
            onView={() => onView(id)}
            status={status}
          />
        </IndexTable.Cell>
      </IndexTable.Row>
    ),
  );

  return (
    <>
      <LegacyCard>
        <IndexFilters
          tabs={tabs}
          selected={selected}
          onSelect={handleTabChange}
          canCreateNewView={false}
          hideQueryField
          hideFilters
          mode={mode}
          setMode={setMode}
          
        />
        <IndexTable
          condensed={useBreakpoints().smDown}
          resourceName={{ singular: 'submission', plural: 'submissions' }}
          itemCount={submissions.length}
          headings={[
            { title: 'Project Name' },
            { title: 'Designer' },
            { title: 'Product' },
            { title: 'Date' },
            { title: 'Status' },
            { title: 'Actions' },
          ]}
          loading={isLoading}
        >
          {rowMarkup}
        </IndexTable>
        <div style={{ 
          padding: '1rem',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <Pagination
            hasPrevious={currentPage > 1}
            hasNext={currentPage < totalPages}
            onPrevious={() => setCurrentPage(currentPage - 1)}
            onNext={() => setCurrentPage(currentPage + 1)}
            label={`Page ${currentPage} of ${totalPages}`}
          />
        </div>
      </LegacyCard>
      {toast && (
        <Toast
          content={toast.content}
          error={toast.error}
          onDismiss={() => setToast(null)}
        />
      )}
    </>
  );
}

export default Page;