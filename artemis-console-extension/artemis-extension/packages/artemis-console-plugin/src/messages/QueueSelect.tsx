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
import React, { FormEvent, useEffect, useState } from 'react';
import { Button, MenuToggle, MenuToggleElement, Select, SelectList, SelectOption, TextInputGroup, TextInputGroupMain, TextInputGroupUtilities } from '@patternfly/react-core';
import { artemisService } from '../artemis-service';
import { ActiveSort, Filter, SortDirection } from '../table/ArtemisTable';
import { TimesIcon } from '@patternfly/react-icons/dist/esm/icons/times-icon.js'
import { eventService, jolokiaService } from '@hawtio/react'

export type QueueSelectProps = {
  selectQueue: Function
}

export const QueueSelectInput: React.FunctionComponent<QueueSelectProps> = (queueSelectProps) => {

  // TODO: there's something wrong with typeahead - also with Patternfly 4...

    const [queues, setQueues] = useState<any[]>()
    const [filterText, setFilterText] = useState<string>('')
    const [filter, setFilter] = useState<Filter>({
      column: 'name',
      operation: 'EQUALS',
      input: ''
    })
    const textInputRef = React.useRef<HTMLInputElement>();

    useEffect(() => {
      const listData = async () => {
        const activeSort:ActiveSort  = {
          id: 'name',
          order: SortDirection.ASCENDING
        }
        const data: any = await artemisService.getQueues(1, 10, activeSort, filter).catch(error => {
          eventService.notify({ type: "warning", message: jolokiaService.errorMessage(error) })
          return JSON.stringify({ data: [], count: 0 })
        })
        const queues = JSON.parse(data).data
        if (queues.length > 0) {
          setQueues(queues);
        } else {
          setQueues([{name: "No results found"}])
        }
      }
      listData();
  
    }, [filter])
  

    const [isOpen, setIsOpen] = useState(false);
    const [selected, setSelected] = useState('');


    const onToggle = () => {
      setIsOpen(!isOpen);
      if (isOpen) {
        textInputRef?.current?.focus();
      }
    };

    const handleSelectQueueChange = (_event: React.MouseEvent<Element, MouseEvent> | undefined, value: string | number | undefined) => {
      setIsOpen(false);
      const queueName: string = value as string;
      setSelected(queueName);
      setFilterText(queueName)
      queueSelectProps.selectQueue(queueName);
    }

    const clearSelection = () => {
      setSelected('');
      setFilterText('');
      setIsOpen(false);
      setFilter({
        column: 'name',
        operation: 'CONTAINS',
        input: ''
      });
      textInputRef?.current?.focus();
    };

    const onFilterClick = () => {
      if (!isOpen) {
        setIsOpen(true);
        textInputRef?.current?.focus();
      } else if (!filterText) {
        setIsOpen(false)
      }
    };

    const customFilter = (_event: FormEvent<HTMLInputElement>, value: string) => {
      setFilterText(value)

      const newFilter: Filter = {
        column: 'name',
        operation: 'CONTAINS',
        input: value
      }
      setFilter(newFilter);
    };

    return (
      <div>
        <span id={"select-queues"} hidden>
          Select a Queue
        </span>
        <Select
            toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
                <MenuToggle ref={toggleRef} variant='typeahead' isFullWidth aria-label='Select a Queue' onClick={onToggle}>
                  <TextInputGroup isPlain>
                    <TextInputGroupMain
                        value={filterText}
                        onClick={onFilterClick}
                        onChange={customFilter}
                        id="typeahead-select-input"
                        autoComplete="off"
                        placeholder="Type Queue Name"
                        role="combobox"
                        isExpanded={isOpen}
                        aria-controls="select-queue"
                        innerRef={textInputRef}
                    />
                    <TextInputGroupUtilities {...(!filterText ? { style: { display: 'none' } } : {})}>
                      <Button variant="plain" onClick={clearSelection} aria-label="Clear input value">
                        <TimesIcon aria-hidden/>
                      </Button>
                    </TextInputGroupUtilities>
                  </TextInputGroup>
                </MenuToggle>
            )}
            selected={selected}
            onSelect={handleSelectQueueChange}
            aria-labelledby="select-queue"
            isOpen={isOpen}
        >
          <SelectList>
            {
              queues?.map((queue: any, index) => {
                if (queue.name === 'No results found') {
                  return (<SelectOption disabled isAriaDisabled key={index} value={queue.name}>{queue.name}</SelectOption>)
                }
                return (<SelectOption key={index} value={queue.name}>{queue.name}</SelectOption>)
              })
            }
          </SelectList>
        </Select>
      </div>
    );
  
}