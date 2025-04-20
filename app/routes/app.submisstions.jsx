import { json } from "@remix-run/node";
import { useLoaderData, useSearchParams } from "@remix-run/react";
import {
  Page,
  Layout,
  Card,
  IndexTable,
  Text,
  Badge,
  Button,
  Pagination,
  TextField,
  IndexFilters,
  useSetIndexFiltersMode,
  useIndexResourceState,
  ChoiceList,
  useBreakpoints,
} from "@shopify/polaris";
import { useState, useCallback } from "react";
import  prisma from "../db.server";

export const loader = async ({ request }) => {
  const url = new URL(request.url);
  const searchParams = url.searchParams;
  const query = searchParams.get("query") || "";
  const status = searchParams.get("status") || "all";
  const page = parseInt(searchParams.get("page") || "1");
  const sortKey = searchParams.get("sortKey") || "createdAt";
  const sortDirection = searchParams.get("sortDirection") || "desc";
  const perPage = 10;

  const where = {
    ...(query && {
      OR: [
        { firstName: { contains: query, mode: "insensitive" } },
        { lastName: { contains: query, mode: "insensitive" } },
        { projectName: { contains: query, mode: "insensitive" } },
      ],
    }),
    ...(status !== "all" && { status }),
  };
  console.log(where,'submissions')

  const [submissions, total] = await Promise.all([
    prisma.projectSubmission.findMany({
      where,
      skip: (page - 1) * perPage,
      take: perPage,
      orderBy: { [sortKey]: sortDirection },
      include: {
        product: true,
        images: true,
      },
    }),
    prisma.projectSubmission.count({ where }),
  ]);

  return json({
    submissions,
    total,
    page,
    perPage,
    query,
    status,
    sortKey,
    sortDirection,
  });
};

export default function Submissions() {
  const { submissions, total, page, perPage, query, status, sortKey, sortDirection } = useLoaderData();
  const [searchParams, setSearchParams] = useSearchParams();
  const { selectedResources, allResourcesSelected, handleSelectionChange } = useIndexResourceState(submissions);
  const [itemStrings, setItemStrings] = useState(["All", "Pending", "Approved", "Rejected"]);
  const [selected, setSelected] = useState(0);
  const { smUp } = useBreakpoints();
  const { mode, setMode } = useSetIndexFiltersMode();




  const onCreateNewView = async (value) => {
    setItemStrings([...itemStrings, value]);
    setSelected(itemStrings.length);
    return true;
  };

  const tabs = itemStrings.map((item, index) => ({
    content: item,
    index,
    onAction: () => {
      setSelected(index);
      setSearchParams((prev) => {
        prev.set("status", index === 0 ? "all" : item.toLowerCase());
        prev.set("page", "1");
        return prev;
      });
    },
    id: `${item.toLowerCase()}-tab`,
    isLocked: index === 0,
    actions: []
  }));

  // Sorting options
  const sortOptions = [
    { label: 'Date', value: 'createdAt', directionLabel: 'Newest first' },
    { label: 'Date', value: 'createdAt', directionLabel: 'Oldest first' },
    { label: 'Name', value: 'firstName', directionLabel: 'A-Z' },
    { label: 'Name', value: 'firstName', directionLabel: 'Z-A' },
    { label: 'Project', value: 'projectName', directionLabel: 'A-Z' },
    { label: 'Project', value: 'projectName', directionLabel: 'Z-A' },
  ];

  // Filter states
  const [nameFilter, setNameFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState([]);

  // Filter handlers
  const handleNameFilterChange = useCallback((value) => setNameFilter(value), []);
  const handleStatusFilterChange = useCallback((value) => setStatusFilter(value), []);

  const filters = [
    {
      key: 'name',
      label: 'Name',
      filter: (
        <TextField
          label="Name"
          value={nameFilter}
          onChange={handleNameFilterChange}
          autoComplete="off"
          labelHidden
        />
      ),
    },
    {
      key: 'status',
      label: 'Status',
      filter: (
        <ChoiceList
          title="Status"
          titleHidden
          choices={[
            { label: 'Pending', value: 'pending' },
            { label: 'Approved', value: 'approved' },
            { label: 'Rejected', value: 'rejected' },
          ]}
          selected={statusFilter}
          onChange={handleStatusFilterChange}
          allowMultiple
        />
      ),
    },
  ];

  const appliedFilters = [];
  if (nameFilter) {
    appliedFilters.push({
      key: 'name',
      label: `Name contains ${nameFilter}`,
      onRemove: () => setNameFilter(''),
    });
  }
  if (statusFilter.length > 0) {
    appliedFilters.push({
      key: 'status',
      label: `Status: ${statusFilter.join(', ')}`,
      onRemove: () => setStatusFilter([]),
    });
  }

  const handleSort = useCallback(
    (key) => {
      setSearchParams((prev) => {
        prev.set("sortKey", key);
        prev.set("sortDirection", sortDirection === "asc" ? "desc" : "asc");
        return prev;
      });
    },
    [sortDirection]
  );

  const handleSearch = useCallback((value) => {
    setSearchParams((prev) => {
      prev.set("query", value);
      prev.set("page", "1");
      return prev;
    });
  }, []);

  const handleSearchCancel = useCallback(() => {
    setSearchParams((prev) => {
      prev.delete("query");
      prev.set("page", "1");
      return prev;
    });
  }, []);

  const handlePagination = useCallback((page) => {
    setSearchParams((prev) => {
      prev.set("page", page.toString());
      return prev;
    });
  }, []);

  const resourceName = {
    singular: "submission",
    plural: "submissions",
  };

  const rowMarkup = submissions.map(
    ({ id, firstName, lastName, projectName, status, createdAt, product }, index) => (
      <IndexTable.Row
        id={id}
        key={id}
        selected={selectedResources.includes(id)}
        position={index}
      >
        <IndexTable.Cell>
          <Text variant="bodyMd" fontWeight="bold" as="span">
            {firstName} {lastName}
          </Text>
        </IndexTable.Cell>
        <IndexTable.Cell>{projectName}</IndexTable.Cell>
        <IndexTable.Cell>{product?.title || "No product selected"}</IndexTable.Cell>
        <IndexTable.Cell>
          <Badge status={status === "approved" ? "success" : status === "rejected" ? "critical" : "warning"}>
            {status}
          </Badge>
        </IndexTable.Cell>
        <IndexTable.Cell>
          {new Date(createdAt).toLocaleDateString()}
        </IndexTable.Cell>
        <IndexTable.Cell>
          <Button onClick={() => window.location.href = `/app/submissions/${id}`}>
            View Details
          </Button>
        </IndexTable.Cell>
      </IndexTable.Row>
    )
  );

  return (
    <Page title="Project Submissions">
      <Layout>
        <Layout.Section>
          <Card>
            <IndexFilters
              sortOptions={sortOptions}
              sortSelected={[sortKey, sortDirection]}
              queryValue={query}
              queryPlaceholder="Search submissions"
              onQueryChange={handleSearch}
              onQueryClear={handleSearchCancel}
              onSort={handleSort}
              tabs={tabs}
              selected={selected}
              onSelect={setSelected}
              canCreateNewView
              onCreateNewView={onCreateNewView}
              filters={filters}
              appliedFilters={appliedFilters}
              mode={mode}
              setMode={setMode}
              hideQueryField={false}
              hideFilters={false}
              cancelAction={{
                onAction: handleSearchCancel,
                disabled: false,
                loading: false,
              }}
            />
            <IndexTable
              resourceName={resourceName}
              itemCount={total}
              selectedItemsCount={
                allResourcesSelected ? "All" : selectedResources.length
              }
              onSelectionChange={handleSelectionChange}
              headings={[
                { title: "Name" },
                { title: "Project" },
                { title: "Product" },
                { title: "Status" },
                { title: "Date" },
                { title: "Actions" },
              ]}
              pagination={
                <Pagination
                  hasNext={page * perPage < total}
                  hasPrevious={page > 1}
                  onNext={() => handlePagination(page + 1)}
                  onPrevious={() => handlePagination(page - 1)}
                  label={`${(page - 1) * perPage + 1}-${Math.min(
                    page * perPage,
                    total
                  )} of ${total}`}
                />
              }
            >
              {rowMarkup}
            </IndexTable>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
} 