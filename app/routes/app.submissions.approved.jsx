import { IndexTable, Text, Badge } from "@shopify/polaris";
import { useState, useEffect } from "react";
import { useFetcher } from "@remix-run/react";

export default function ApprovedSubmissions() {
  const fetcher = useFetcher();
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetcher.load("/api/submissions");
  }, []);

  useEffect(() => {
    if (fetcher.data) {
      const approvedSubmissions = (fetcher.data.submissions || []).filter(
        (submission) => submission.status === "approved"
      );
      setSubmissions(approvedSubmissions);
      setLoading(false);
    }
  }, [fetcher.data]);

  const rowMarkup = submissions.map(
    (
      {
        id,
        projectName,
        firstName,
        lastName,
        product,
        submittedAt,
        approvedAt,
      },
      index
    ) => (
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
        <IndexTable.Cell>
          <Text variant="bodyMd" as="span">
            {`${firstName} ${lastName}`}
          </Text>
        </IndexTable.Cell>
        <IndexTable.Cell>
          <Text variant="bodyMd" as="span">
            {product?.title || "N/A"}
          </Text>
        </IndexTable.Cell>
        <IndexTable.Cell>
          <Text variant="bodyMd" as="span">
            {new Date(submittedAt).toLocaleDateString()}
          </Text>
        </IndexTable.Cell>
        <IndexTable.Cell>
          <Text variant="bodyMd" as="span">
            {new Date(approvedAt).toLocaleDateString()}
          </Text>
        </IndexTable.Cell>
      </IndexTable.Row>
    )
  );

  return (
    <IndexTable
      resourceName={{ singular: "approved submission", plural: "approved submissions" }}
      itemCount={submissions.length}
      headings={[
        { title: "Project Name" },
        { title: "Designer" },
        { title: "Product" },
        { title: "Submitted" },
        { title: "Approved" },
      ]}
      selectable={false}
      loading={loading}
    >
      {rowMarkup}
    </IndexTable>
  );
} 