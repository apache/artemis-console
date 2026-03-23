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
import React, { useContext, useState } from 'react'
import { ActiveSort, ArtemisTable, Column, Filter, ToolbarAction } from '../table/ArtemisTable';
import { Navigate } from '../views/ArtemisTabView.js';
import { artemisService } from '../artemis-service';
import { IAction } from '@patternfly/react-table';
import { ExclamationCircleIcon } from '@patternfly/react-icons/dist/esm/icons/exclamation-circle-icon';
import { Button, Icon, Modal, ModalVariant, TextContent, Text } from '@patternfly/react-core';
import { CreateQueue } from '../queues/CreateQueue';
import { Attributes, eventService, jolokiaService, Operations, workspace } from '@hawtio/react';
import { ArtemisContext } from '../context';
import { CreateAddress } from './CreateAddress';
import { SendMessage } from '../messages/SendMessage';
import { createAddressObjectName } from '../util/jmx';
import { useNavigate } from 'react-router-dom';
import { columnStorage } from '../artemis-preferences-service';

export const AddressesTable: React.FunctionComponent<Navigate> = (navigate) => {
  const getQueueFilter = (row: any) => {
    const filter: Filter = {
      column: 'address',
      operation: 'EQUALS',
      input: row.name
    }
    return filter;
  }
  const allColumns: Column[] = [
    { id: 'id', name: 'ID', visible: false, sortable: true, filterable: true },
    { id: 'name', name: 'Name', visible: true, sortable: true, filterable: true },
    { id: 'routingTypes', name: 'Routing Types', visible: true, sortable: true, filterable: true },
    { id: 'queueCount', name: 'Queue Count', visible: true, sortable: true, filterable: true, filter: getQueueFilter, filterTab: 6 },
    { id: 'internal', name: 'Internal', visible: false, sortable: true, filterable: true },
    { id: 'temporary', name: 'Temporary', visible: false, sortable: true, filterable: true },
    { id: 'autoCreated', name: 'Auto Created', visible: false, sortable: true, filterable: true },
    { id: 'paused', name: 'Paused', visible: false, sortable: true, filterable: true },
    { id: 'currentDuplicateIdCacheSize', name: 'Current Duplicate ID Cache Size', visible: false, sortable: true, filterable: true },
    { id: 'retroactiveResource', name: 'Retroactive Resource', visible: false, sortable: true, filterable: true },
    { id: 'unroutedMessageCount', name: 'Unrouted Message Count', visible: false, sortable: true, filterable: true },
    { id: 'routedMessageCount', name: 'Routed Message Count', visible: false, sortable: true, filterable: true },
    { id: 'messageCount', name: 'Message Count', visible: true, sortable: true, filterable: true },
    { id: 'numberOfBytesPerPage', name: 'Number Of Bytes Per Page', visible: false, sortable: true, filterable: true },
    { id: 'addressLimitPercent', name: 'Address Limit Percent', visible: true, sortable: true, filterable: true },
    { id: 'paging', name: 'Paging', visible: true, sortable: true, filterable: true },
    { id: 'numberOfPages', name: 'Number Of Pages', visible: false, sortable: true, filterable: true },
    { id: 'addressSize', name: 'Address Size', visible: true, sortable: true, filterable: true },
    { id: 'maxPageReadBytes', name: 'Max Page Read Bytes', visible: false, sortable: true, filterable: true },
    { id: 'maxPageReadMessages', name: 'Max Page Read Messages', visible: false, sortable: true, filterable: true },
    { id: 'prefetchPageBytes', name: 'Prefetch Page Bytes', visible: false, sortable: true, filterable: true },
    { id: 'prefetchPageMessages', name: 'Prefetch Page Messages', visible: false, sortable: true, filterable: true }
  ];

  const listAddresses = async (page: number, perPage: number, activeSort: ActiveSort, filter: Filter): Promise<any> => {
    const response = await artemisService.getAddresses(page, perPage, activeSort, filter).catch(error => {
      eventService.notify({ type: 'warning', message: jolokiaService.errorMessage(error)})
      return JSON.stringify({ data: [], count: 0 })
    })
    const data = JSON.parse(response);
    return data;
  }

  const { tree, selectedNode, brokerNode, setSelectedNode, findAndSelectNode } = useContext(ArtemisContext);
  const routenavigate = useNavigate();


  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showAttributesDialog, setShowAttributesDialog] = useState(false);
  const [showOperationsDialog, setShowOperationsDialog] = useState(false);
  const [showCreateAddressDialog, setShowCreateAddressDialog] = useState(false);
  const [showSendDialog, setShowSendDialog] = useState(false);
  const [address, setAddress] = useState("");
  const [loadData, setLoadData] = useState(0);
  const canCreateQueue = artemisService.canCreateQueue(brokerNode);
  const canDeleteAddress = artemisService.canDeleteAddress(brokerNode);
  const canCreateAddress = artemisService.canCreateAddress(brokerNode);


  const createAction: ToolbarAction = {
    name: "Create Address",
    action: () => {
      setShowCreateAddressDialog(true);
    }
  }

  const getRowActions = (row: any): IAction[] => {
    const actions: IAction[] = [
      {
        title: 'Show in Artemis JMX',
        onClick: async () => {
          setAddress(row.name);
          const brokerObjectName = await artemisService.getBrokerObjectName();
          const addressObjectName = createAddressObjectName(brokerObjectName, row.name);
          findAndSelectNode(addressObjectName, row.name);
          routenavigate('/treeartemisJMX')
        }
      },
      {
        title: 'Attributes',
        onClick: async () => {
          setAddress(row.name);
          const brokerObjectName = await artemisService.getBrokerObjectName();
          const addressObjectName = createAddressObjectName(brokerObjectName, row.name);
          findAndSelectNode(addressObjectName, row.name);
          setShowAttributesDialog(true);
        }
      },
      {
        title: 'Operations',
        onClick: async () => {
          setAddress(row.name);
          const brokerObjectName = await artemisService.getBrokerObjectName();
          const addressObjectName = createAddressObjectName(brokerObjectName, row.name);
          findAndSelectNode(addressObjectName, row.name);
          setShowOperationsDialog(true);
        }
      }
    ];

    if (canDeleteAddress) {
      actions.push(
        {
          title: 'Delete Address',
          onClick: () => {
            setAddress(row.name);
            setShowDeleteDialog(true);
          }
        }
      );
    }

    const canSendMessage = artemisService.canSendMessageToAddress(brokerNode, row.name);
    if (canSendMessage) {
      actions.push(
        {
          title: 'Send Message',
          onClick: () => {
            setAddress(row.name);
            setShowSendDialog(true);
          }
        }
      );
    }
    if (canCreateQueue) {
      actions.push({
        title: 'Create Queue',
        onClick: () => {
          setAddress(row.name);
          setShowCreateDialog(true);
        }
      });
    }
    return actions;
  };

  const reload = () => {
    setLoadData(loadData + 1);
  }

  const handleDeleteAddress = () => {
    artemisService.deleteAddress(address)
      .then(() => {
        setShowDeleteDialog(false);
        workspace.refreshTree();
        reload();
        eventService.notify({
          type: 'success',
          message: "Address Successfully Deleted",
        })
      })
      .catch((error) => {
        setShowDeleteDialog(false);
        eventService.notify({type: 'warning', message: jolokiaService.errorMessage(error) })
      })
  };

  return (
    <ArtemisContext.Provider value={{ tree, selectedNode, brokerNode, setSelectedNode, findAndSelectNode }}>
      <ArtemisTable getRowActions={getRowActions} allColumns={allColumns} getData={listAddresses} loadData={loadData} storageColumnLocation={columnStorage.addresses}  toolbarActions={[createAction]} navigate={navigate.search} filter={navigate.filter}/>
      <Modal
        aria-label='create-queue-modal'
        variant={ModalVariant.medium}
        isOpen={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        actions={[
          <Button key="close" variant="primary" onClick={() => setShowCreateDialog(false)}>
            Close
          </Button>
        ]}>
        <CreateQueue address={address}/>
      </Modal>
      { canDeleteAddress && <Modal
        aria-label='delete-address-modal'
        variant={ModalVariant.medium}
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        actions={[
          <Button key="cancel" variant="secondary" onClick={() => setShowDeleteDialog(false)}>
            Cancel
          </Button>,
          <Button key="delete" variant="primary" onClick={handleDeleteAddress}>
            Confirm
          </Button>
        ]}>
        <TextContent>
          <Text component="h2">
            Confirm Delete Address
          </Text>
          <Text component="p">
            <Icon isInline status='warning'>
              <ExclamationCircleIcon />
            </Icon>
            You are about to delete address {address}
          </Text>
          <Text component="p">
            This operation cannot be undone.
          </Text>
        </TextContent>
      </Modal>
      }
      <Modal
        aria-label='attributes-modal'
        variant={ModalVariant.medium}
        isOpen={showAttributesDialog}
        onClose={() => setShowAttributesDialog(false)}
        actions={[
          <Button key="close" variant="primary" onClick={() => setShowAttributesDialog(false)}>
            Close
          </Button>
        ]}>
        <Attributes />
      </Modal>
      <Modal
        aria-label='operations-modal'
        variant={ModalVariant.medium}
        isOpen={showOperationsDialog}
        onClose={() => setShowOperationsDialog(false)}
        actions={[
          <Button key="close" variant="primary" onClick={() => setShowOperationsDialog(false)}>
            Close
          </Button>
        ]}>
        <Operations />
      </Modal>
      <Modal
        aria-label='create=address-modal'
        variant={ModalVariant.medium}
        isOpen={showCreateAddressDialog}
        onClose={() => setShowCreateAddressDialog(false)}
        actions={[
          <Button key="close" variant="primary" onClick={() => setShowCreateAddressDialog(false)}>
            Close
          </Button>
        ]}>
        <CreateAddress reload={reload}/>
      </Modal>
      <Modal
        aria-label='send-modal'
        variant={ModalVariant.medium}
        isOpen={showSendDialog}
        onClose={() => setShowSendDialog(false)}
        actions={[
          <Button key="close" variant="secondary" onClick={() => setShowSendDialog(false)}>
            Cancel
          </Button>
        ]}>
        <SendMessage address={address} queue={''} routingType={''} isAddress={true} />
      </Modal>
    </ArtemisContext.Provider>
  )

}
