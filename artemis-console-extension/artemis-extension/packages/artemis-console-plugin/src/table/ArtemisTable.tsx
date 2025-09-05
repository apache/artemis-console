/*
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to You under the Apache License, Version 2.0
 * (the "License"); you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Button,
  DataList,
  DataListCheck,
  DataListItem,
  DataListItemRow,
  DataListCell,
  DataListItemCells,
  Toolbar,
  ToolbarContent,
  ToolbarItem,
  Modal,
  Pagination,
  PaginationVariant,
  Text,
  TextContent
} from '@patternfly/react-core';
import { SortAmountDownIcon } from '@patternfly/react-icons/dist/esm/icons/sort-amount-down-icon';
import { Thead, Tr, Th, Tbody, Td, IAction, ActionsColumn, Table, InnerScrollContainer } from '@patternfly/react-table';
import { artemisPreferencesService } from '../artemis-preferences-service';
import {
  MenuItem,
  Divider,
  MenuToggle,
  MenuList,
  Select
} from '@patternfly/react-core'

import { ArtemisFilters } from './ArtemisFilters';
import {Simulate} from "react-dom/test-utils";
import loadedData = Simulate.loadedData;

export type Column = {
  id: string
  name: string
  visible: boolean
  sortable: boolean
  filterable: boolean
  filter?: Function
  filterTab?: number
  link?: Function
}

export enum SortDirection {
  ASCENDING = 'asc',
  DESCENDING = 'desc'
}

export type ActiveSort = {
  id: string
  order: SortDirection
}

export type Filter = {
  column: string
  operation: string
  input: string
}

export type ToolbarAction = {
  name: string
  action: Function
}

export type TableData = {
  allColumns: Column[],
  getData: Function,
  getRowActions?: Function,
  toolbarActions?: ToolbarAction[],
  loadData?: number,
  storageColumnLocation?: string
  navigate?: Function
  filter?: Filter
}

export const ArtemisTable: React.FunctionComponent<TableData> = broker => {

const operationOptions = [
    { id: 'CONTAINS', name: 'Contains' },
    { id: 'NOT_CONTAINS', name: 'Does Not Contain' },
    { id: 'EQUALS', name: 'Equals' },
    { id: 'GREATER_THAN', name: 'Greater Than' },
    { id: 'LESS_THAN', name: 'Less Than' }
  ]
  
  const initialActiveSort = () => {
    if (broker.storageColumnLocation && sessionStorage.getItem(broker.storageColumnLocation + '.activesort')) {
      return JSON.parse(sessionStorage.getItem(broker.storageColumnLocation + '.activesort') as string);
    }
    return {
      id: broker.allColumns[0].id,
      order: SortDirection.ASCENDING
    };
  }

  const [rows, setRows] = useState([])
  const [resultsSize, setresultsSize] = useState(0)
  const [columnsLoaded, setColumnsLoaded] = useState(false);
  const [operationOpen, setOperationOpen] = useState(false);
  const onToggle = () => setOperationOpen(prev => !prev);
  const [columns, setColumns] = useState(broker.allColumns);
  const [activeSort, setActiveSort] = useState(initialActiveSort);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [isCompact, setIsCompact] = useState(false);
  const [perPage, setPerPage] = useState(10);
  const [perPageOption, setPerPageOption] = useState(1);
  const pageSize = artemisPreferencesService.loadTablePageSize(broker.storageColumnLocation);

  const rootElement = document.getElementById('root') as HTMLElement;
  const popperProps = {
    position: 'right' as const,
    appendTo: rootElement,
  };

  const visibleColumns = columns.filter((column) => column.visible);

  const initialFilter = () =>  {
    if (broker.storageColumnLocation && sessionStorage.getItem(broker.storageColumnLocation + '.filter')) {
      return JSON.parse(sessionStorage.getItem(broker.storageColumnLocation + '.filter') as string);
    }
    return {
      column: columns[1].id,
      operation: operationOptions[0].id,
      input: ''
    }
  }

  if (broker.filter) {
    sessionStorage.setItem(broker.storageColumnLocation + '.filter', JSON.stringify(broker.filter));
  }

  const [filter, setFilter] = useState(() => broker.filter !== undefined ? broker.filter : initialFilter());

  const listData = async () => {
    const data = await broker.getData(page, perPage, activeSort, filter);
    setRows(data.data);
    setresultsSize(data.count);
  };

  useEffect(() => {
    if (!columnsLoaded && broker.storageColumnLocation) {
      const updatedColumns: Column[] = artemisPreferencesService.loadColumnPreferences(broker.storageColumnLocation, broker.allColumns);
      if (pageSize == -1) {
        setIsCompact(true);
      }
      setColumns(updatedColumns);
      setColumnsLoaded(true);
    }
  }, [columnsLoaded]);

  useEffect(() => {
    listData();
  }, [page, perPage, activeSort, filter, broker.loadData]);

  const handleModalToggle = () => {
    setIsModalOpen(!isModalOpen);
  };

  const onSave = () => {
    setIsModalOpen(!isModalOpen);

    if (broker.storageColumnLocation) {
      artemisPreferencesService.saveColumnPreferences(broker.storageColumnLocation, columns);
    }
  };

  const selectAllColumns = () => {
    const updatedColumns = [...columns]
    updatedColumns.map((column) => {
      column.visible = true;
      return true;
    })
    setColumns(updatedColumns);
  };

  const unselectAllColumns = () => {
    const updatedColumns = [...columns]
    updatedColumns.map((column) => {
      column.visible = false;
      return false;
    })
    setColumns(updatedColumns);
  };

  const updateColumnStatus = (index: number, column: Column) => {
    const updatedColumns = [...columns];
    updatedColumns[index].visible = !columns[index].visible;
    setColumns(updatedColumns);
  }

  const updateActiveSort = (id: string, order: SortDirection) => {
    const updatedActiveSort: ActiveSort = {
      id: id,
      order: order
    };
    setActiveSort(updatedActiveSort)
    sessionStorage.setItem(broker.storageColumnLocation + ".activesort",JSON.stringify(updatedActiveSort));
  }

  const getRowActions = (row: never): IAction[] => {
    if (broker.getRowActions) {
      return broker.getRowActions(row);
    }
    return [];
  };

  const handleSetPage = (_event: React.MouseEvent | React.KeyboardEvent | MouseEvent, newPage: number) => {
    setPage(newPage);
  };

  const handlePerPageSelect = (_event: React.MouseEvent | React.KeyboardEvent | MouseEvent, newPerPage: number) => {
    setPerPageOption(newPerPage);
    if(broker.storageColumnLocation) {
      artemisPreferencesService.saveTablePageSize(broker.storageColumnLocation, newPerPage)
    }
    if (newPerPage === -1) {
      setIsCompact(true);
      setPerPage(resultsSize);
    } else {
      setIsCompact(false);
      setPerPage(newPerPage);
    }
    setPage(1);
  };

  const getKeyByValue = (producer: never, columnName: string) => {
    return producer[columnName];
  }

  const handleClick = (column: Column, row: any) => () => {
    if (column.filter) {
      const filter = column.filter(row);
      if (broker.navigate) {
        broker.navigate(column.filterTab, filter);
      }
    } else if (column.link) {
      column.link(row);
    }
  };

  const pageSizeOptions = [
    { title: '10 per page', value: 10 },
    { title: '20 per page', value: 20 },
    { title: '50 per page', value: 50 },
    { title: '100 per page', value: 100 },
    { title: 'All items', value: -1 },
  ];

  const renderPagination = (variant: PaginationVariant | undefined) => (
    <Pagination
      itemCount={resultsSize}
      page={page}
      perPage={perPageOption}
      onSetPage={handleSetPage}
      onPerPageSelect={handlePerPageSelect}
      isCompact={isCompact}
      perPageOptions={pageSizeOptions}
      variant={variant}
      titles={{
        paginationAriaLabel: `${variant} pagination`,
        perPageSuffix: ''
      }}
    />
  );
  const renderModal = () => {
    return (
      <Modal
        title="Manage columns"
        isOpen={isModalOpen}
        variant="small"
        description={
          <TextContent>
            <Text>Selected categories are displayed in the table.</Text>
            <Button isInline onClick={selectAllColumns} variant="link">
              Select all
            </Button>{ ' | ' }
            <Button isInline onClick={unselectAllColumns} variant="link">
              Unselect all
            </Button>
          </TextContent>
        }
        onClose={handleModalToggle}
        actions={[
          <Button id='columns-save-button' key="save" variant="primary" onClick={onSave}>
            Save
          </Button>,
          <Button key="close" variant="secondary" onClick={handleModalToggle}>
            Cancel
          </Button>
        ]}
      >
        <DataList aria-label="Table column management" id="table-column-management" isCompact>
          {columns.map((column, id) => (
            <DataListItem key={`table-column-management-${column.id}`} aria-labelledby={`table-column-management-${column.id}`}>
              <DataListItemRow>
                <DataListCheck
                  aria-labelledby={`table-column-management-item-${column.id}`}
                  checked={column.visible}
                  name={`check-${column.id}`}
                  id={`check-${column.id}`}
                  onChange={checked => updateColumnStatus(id, column)}
                />
                <DataListItemCells
                  dataListCells={[
                    <DataListCell id={`table-column-management-item-${column.id}`} key={`table-column-management-item-${column.id}`}>
                      <label htmlFor={`check-${column.id}`}>{column.name}</label>
                    </DataListCell>
                  ]}
                />
              </DataListItemRow>
            </DataListItem>
          ))}
        </DataList>
      </Modal>
    );
  };



  return (
    <React.Fragment>

      <Toolbar id="toolbar">
        <ToolbarContent>
          <ToolbarItem key='address-sort'>
            <Select
              aria-label="Options menu"
              isOpen={operationOpen}
              onOpenChange={setOperationOpen}
              onSelect={() => setOperationOpen(false)}
              toggle={(toggleRef) => (
                <MenuToggle
                  ref={toggleRef}
                  onClick={onToggle}
                  variant="plain"
                >
                  <SortAmountDownIcon />
                </MenuToggle>
              )}
            >
              <MenuList>
                {visibleColumns.map(column => (
                  <MenuItem
                    key={column.id}
                    isSelected={activeSort.id === column.id}
                    onClick={() => {
                      updateActiveSort(column.id, activeSort.order)
                    }}>
                    {column.name}
                  </MenuItem>
                ))}
                <Divider key="separator" />
                <MenuItem
                  onClick={() => {
                    updateActiveSort(activeSort.id, SortDirection.ASCENDING)
                  }}
                  isSelected={activeSort.order === SortDirection.ASCENDING}
                  id="ascending"
                  key="ascending"
                >
                  Ascending
                </MenuItem>
                <MenuItem
                  onClick={() => {
                    updateActiveSort(activeSort.id, SortDirection.DESCENDING)
                  }}
                  isSelected={activeSort.order === SortDirection.DESCENDING}
                  id="descending"
                  key="descending"
                >
                  Descending
                </MenuItem>
              </MenuList>
            </Select>
          </ToolbarItem>

          <ArtemisFilters
            columns={visibleColumns}
            operationOptions={operationOptions}
            initialFilter={filter}
            onApplyFilter={(f) => {
              setPage(1);
              setFilter(f);
              if (broker.storageColumnLocation) {
                sessionStorage.setItem(broker.storageColumnLocation + '.filter', JSON.stringify(f));
              }
            }}
          />

          <ToolbarItem key="column-select">
            <Button variant='link' onClick={handleModalToggle}>Manage Columns</Button>
          </ToolbarItem>
          {
            broker.toolbarActions?.map(action => (
              <ToolbarItem key={"toolbar-action-" + action.name}>
                <Button variant='link' onClick={() => action.action()}>{action.name}</Button>
              </ToolbarItem>))
          }
        </ToolbarContent>
      </Toolbar>

      <InnerScrollContainer>
      <Table variant="compact" aria-label="Data Table" id='data-table'>
      <Thead>
        <Tr>
          {visibleColumns.map((column, id) => {

            const isSorted = column.id === activeSort.id;
            const direction = isSorted ? activeSort.order : undefined;
            const nextDirection =
              isSorted && activeSort.order === SortDirection.ASCENDING
                ? SortDirection.DESCENDING
                : SortDirection.ASCENDING;
            return (
              <Th
                key={id}
                sort={{
                  sortBy: {
                    index: id,
                    direction: direction === SortDirection.ASCENDING ? 'asc' : 'desc'
                  },
                  onSort: () => updateActiveSort(column.id, nextDirection),
                  columnIndex: id
                }}
              >{column.name}</Th>
            );
          })}
        </Tr>
      </Thead>
        <Tbody>
          {rows.map((row, rowIndex) => (
            <Tr key={rowIndex}>
              {visibleColumns.map((column, id) => {
                const key = getKeyByValue(row, column.id)
                if(column.filter || column.link) {
                  return <Td key={id}><Link to="" onClick={handleClick(column, row)}>{key}</Link></Td>
                } else {
                  return <Td key={id}>{key}</Td>
                }
              })}
              <Td isActionCell>
                <ActionsColumn
                  items={getRowActions(row)}
                  popperProps={popperProps}
                />
              </Td>
          </Tr>
          ))}
        </Tbody>
      </Table>
      </InnerScrollContainer>
      {renderPagination(PaginationVariant.bottom)}
      {renderModal()}
    </React.Fragment>
  );
};