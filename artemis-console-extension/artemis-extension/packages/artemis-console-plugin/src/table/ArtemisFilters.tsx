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

import React, { useRef, useState } from 'react';
import { Button, Select, SelectList, SelectOption, MenuToggleElement, MenuToggle, TextInput, ToolbarItem } from '@patternfly/react-core';

export type ArtemisFiltersProps = {
  columns: { id: string; name: string; visible: boolean }[];
  operationOptions: { id: string; name: string }[];
  initialFilter: { column: string; operation: string; input: string };
  onApplyFilter: (filter: { column: string; operation: string; input: string }) => void;
};

export const ArtemisFilters: React.FC<ArtemisFiltersProps> = ({ columns, operationOptions, initialFilter, onApplyFilter }) => {
  const searchRef = useRef<HTMLInputElement>(null);

  const [filterColumn, setFilterColumn] = useState(
    columns.find(c => c.id === initialFilter.column)
  );
  const [filterOperation, setFilterOperation] = useState(
    operationOptions.find(o => o.id === initialFilter.operation)
  );

  const [columnOpen, setColumnOpen] = useState(false);
  const [operationOpen, setOperationOpen] = useState(false);

  const applyFilter = () => {
    const filterValue = searchRef.current?.value ?? "";
    if (filterOperation && filterColumn) {
      onApplyFilter({ column: filterColumn.id, operation: filterOperation.id, input: filterValue });
    }
  }

  return (
    <>
      <ToolbarItem variant="search-filter" key='column-id-select'>
        <Select
          toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
            <MenuToggle isFullWidth role='menu' ref={toggleRef} onClick={() => setColumnOpen(prev => !prev)}>
              {filterColumn?.name}
            </MenuToggle>
          )}
          aria-label="Select Input"
          isOpen={columnOpen}
          onOpenChange={setColumnOpen}
          onSelect={(_e, selection) => {
            const selectedColumn = columns.find(c => c.name === selection);
            setFilterColumn(selectedColumn);
            setColumnOpen(false); }}
          selected={filterColumn?.name}
        >
          <SelectList>
            {columns.map(column => (
              <SelectOption key={column.id} value={column.name}>{column.name}</SelectOption>
            ))}
          </SelectList>
        </Select>
      </ToolbarItem>

      <ToolbarItem variant="search-filter" key="filter-type">
        <Select
          toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
            <MenuToggle isFullWidth role='menu' ref={toggleRef} onClick={() => setOperationOpen(prev => !prev)}>
              {filterOperation?.name}
            </MenuToggle>
          )}
          aria-label="Select Input"
          isOpen={operationOpen}
          onOpenChange={setOperationOpen}
          onSelect={(_e, selection) => {
            const selectedOperation = operationOptions.find(o => o.name === selection);
            setFilterOperation(selectedOperation);
            setOperationOpen(false); }}
          selected={filterOperation?.name}
        >
          <SelectList>
            {operationOptions.map(operation => (
              <SelectOption key={operation.id} value={operation.name}>{operation.name}</SelectOption>
            ))}
          </SelectList>
        </Select>
      </ToolbarItem>

      <ToolbarItem variant="search-filter" key="search=text">
        <TextInput
          aria-label="Search"
          ref={searchRef}
          defaultValue={initialFilter.input}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              applyFilter();
            }
          }
        }
        />
      </ToolbarItem>

      <Button onClick={applyFilter}>Search</Button>
    </>
  );
};