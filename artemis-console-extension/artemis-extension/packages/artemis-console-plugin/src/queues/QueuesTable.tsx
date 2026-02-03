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
import { ActiveSort, ArtemisTable, Column, Filter } from '../table/ArtemisTable';
import { artemisService } from '../artemis-service';
import { IAction } from '@patternfly/react-table';
import { Button, Modal, ModalVariant } from '@patternfly/react-core';
import { SendMessage } from '../messages/SendMessage';
import { Attributes, eventService, jolokiaService, Operations } from '@hawtio/react';
import { QueueNavigate } from './QueuesView.js';
import { ArtemisContext } from '../context';
import { createQueueObjectName } from '../util/jmx';
import { useNavigate } from 'react-router-dom';
import { columnStorage } from '../artemis-preferences-service';

export type queuePermissions = {
  canSend: boolean;
  canBrowse: boolean;
  canPurge: boolean;
  canDelete: boolean;
}

export const QueuesTable: React.FunctionComponent<QueueNavigate> = navigate => {
  const getAddressFilter = (row: any) => {
    const filter: Filter = {
      column: 'name',
      operation: 'EQUALS',
      input: row.address
    }
    return filter;
  }

  const getConsumersFilter = (row: any) => {
    const filter: Filter = {
      column: 'queue',
      operation: 'EQUALS',
      input: row.name
    }
    return filter;
  }

  const messageView = (row: any) => {
    navigate.selectQueue(row.name, row.address, row.routingType);
  }

  const allColumns: Column[] = [
    { id: 'id', name: 'ID', visible: false, sortable: true, filterable: true },
    { id: 'name', name: 'Name', visible: true, sortable: true, filterable: true, link: messageView },
    { id: 'address', name: 'Address', visible: true, sortable: true, filterable: true, filter: getAddressFilter, filterTab: 5},
    { id: 'routingType', name: 'Routing Type', visible: true, sortable: true, filterable: true },
    { id: 'filter', name: 'Filter', visible: true, sortable: true, filterable: true },
    { id: 'durable', name: 'Durable', visible: true, sortable: true, filterable: true },
    { id: 'maxConsumers', name: 'Max Consumers', visible: true, sortable: true, filterable: true },
    { id: 'purgeOnNoConsumers', name: 'Purge On No Consumers', visible: true, sortable: true, filterable: true },
    { id: 'consumerCount', name: 'Consumer Count', visible: true, sortable: true, filterable: true, filter: getConsumersFilter, filterTab: 4},
    { id: 'messageCount', name: 'Message Count', visible: true, sortable: true, filterable: true, link: messageView},
    { id: 'paused', name: 'Paused', visible: false, sortable: true, filterable: true },
    { id: 'persistedPause', name: 'Persisted Pause', visible: false, sortable: true, filterable: true },
    { id: 'temporary', name: 'Temporary', visible: false, sortable: true, filterable: true },
    { id: 'autoCreated', name: 'Auto Created', visible: false, sortable: true, filterable: true },
    { id: 'user', name: 'User', visible: false, sortable: true, filterable: true },
    { id: 'messagesAdded', name: 'Total Messages Added', visible: false, sortable: true, filterable: true },
    { id: 'messagesAcked', name: 'Total Messages Acked', visible: false, sortable: true, filterable: true },
    { id: 'deliveringCount', name: 'Delivering Count', visible: false, sortable: true, filterable: true },
    { id: 'messagesKilled', name: 'Messages Killed', visible: false, sortable: true, filterable: true },
    { id: 'directDeliver', name: 'Direct Deliver', visible: false, sortable: true, filterable: true },
    { id: 'exclusive', name: 'Exclusive', visible: false, sortable: true, filterable: true },
    { id: 'lastValue', name: 'Last Value', visible: false, sortable: true, filterable: true },
    { id: 'lastValueKey', name: 'Last Value Key', visible: false, sortable: true, filterable: true },
    { id: 'scheduledCount', name: 'Scheduled Count', visible: false, sortable: true, filterable: true },
    { id: 'groupRebalance', name: 'Group Rebalance', visible: false, sortable: true, filterable: true },
    { id: 'groupRebalancePauseDispatch', name: 'Group Rebalance Pause Dispatch', visible: false, sortable: true, filterable: true },
    { id: 'groupBuckets', name: 'Group Buckets', visible: false, sortable: true, filterable: true },
    { id: 'groupFirstKey', name: 'Group First Key', visible: false, sortable: true, filterable: true },
    { id: 'enabled', name: 'Queue Enabled', visible: false, sortable: true, filterable: true },
    { id: 'ringSize', name: 'Ring Size', visible: false, sortable: true, filterable: true },
    { id: 'consumersBeforeDispatch', name: 'Consumers Before Dispatch', visible: false, sortable: true, filterable: true },
    { id: 'delayBeforeDispatch', name: 'Delay Before Dispatch', visible: false, sortable: true, filterable: true },
    { id: 'autoDelete', name: 'Auto Delete', visible: false, sortable: true, filterable: true }
  ];

  const listQueues = async (page: number, perPage: number, activeSort: ActiveSort, filter: Filter): Promise<any> => {
    const response = await artemisService.getQueues(page, perPage, activeSort, filter).catch(error => {
      eventService.notify({ type: 'warning', message: jolokiaService.errorMessage(error)})
      return JSON.stringify({ data: [], count: 0 })
    })
    const data = JSON.parse(response);
    return data;
  }

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showPurgeDialog, setShowPurgeDialog] = useState(false);
  const [showSendDialog, setShowSendDialog] = useState(false);
  const [queue, setQueue] = useState("");
  const [address, setAddress] = useState("");
  const [routingType, setRoutingType] = useState("");
  const [queueToPurgeAddress, setQueueToPurgeAddress] = useState("");
  const [queueToPurgeRoutingType, setQueueToPurgeRoutingType] = useState("");
  const [showAttributesDialog, setShowAttributesDialog] = useState(false);
  const [showOperationsDialog, setShowOperationsDialog] = useState(false);
  const routenavigate = useNavigate();
  const { brokerNode, findAndSelectNode } = useContext(ArtemisContext);

  const [loadData, setLoadData] = useState(0);

  const closeDeleteDialog = () => {
    setShowDeleteDialog(false);
  };

  const closePurgeDialog = () => {
    setShowPurgeDialog(false);
  };

  const closeSendDialog = () => {
    setShowSendDialog(false);
  };

  const deleteQueue = async (name: string) => {
    await artemisService.deleteQueue(name)
      .then((value: unknown) => {
        setShowDeleteDialog(false);
        setLoadData(loadData + 1);
        eventService.notify({
          type: 'success',
          message: 'Queue Deleted',
          duration: 3000,
        })
      })
      .catch((error) => {
        setShowDeleteDialog(false);
        eventService.notify({type: 'danger', message: 'Queue Not Deleted: ' + jolokiaService.errorMessage(error) })
      });
  };

  const purgeQueue = (name: string, address: string, routingType: string) => {
    artemisService.purgeQueue(name, address, routingType)
      .then(() => {
        setShowPurgeDialog(false);
        setLoadData(loadData + 1);
        eventService.notify({
          type: 'success',
          message: 'Queue Purged',
          duration: 3000,
        })
      })
      .catch((error) => {
        setShowPurgeDialog(false);
        eventService.notify({type: 'danger', message: 'Queue Not Purged: ' + jolokiaService.errorMessage(error) })
      });
  };

  const showInJmxAction = (rowName: string, rowAddress: string, rowRoutingType: string): IAction => ({
    title: "Show in Artemis JMX",
    onClick: async () => {
      setAddress(rowName);
      const brokerObjectName = await artemisService.getBrokerObjectName();
      const queueObjectName = createQueueObjectName(brokerObjectName, rowAddress, rowRoutingType, rowName);
      findAndSelectNode(queueObjectName, rowName);
      routenavigate("/treeartemisJMX");
    }
  });

  const attributesAction = (rowName: string, rowAddress: string, rowRoutingType: string) => ({
    title: "Attributes",
    onClick: async () => {
      setAddress(rowName);
      const brokerObjectName = await artemisService.getBrokerObjectName();
      const queueObjectName = createQueueObjectName(
        brokerObjectName,
        rowAddress,
        rowRoutingType,
        rowName
      );
      findAndSelectNode(queueObjectName, rowName);
      setShowAttributesDialog(true);
    }
  });

  const operationsAction = (rowName: string, rowAddress: string, rowRoutingType: string): IAction => ({
    title: "Operations",
    onClick: async () => {
      setAddress(rowName);
      const brokerObjectName = await artemisService.getBrokerObjectName();
      const queueObjectName = createQueueObjectName(
        brokerObjectName,
        rowAddress,
        rowRoutingType,
        rowName
      );
      findAndSelectNode(queueObjectName, rowName);
      setShowOperationsDialog(true);
    }
  });

  const deleteAction = (rowname: string): IAction => ({
    title: "Delete",
    onClick: () => {
      setQueue(rowname);
      setShowDeleteDialog(true);
    }
  });

  const sendMessageAction = (rowName: string, rowAddress: string, rowRoutingType: string): IAction => ({
    title: "Send Message",
    onClick: () => {
      setQueue(rowName);
      setAddress(rowAddress);
      setRoutingType(rowRoutingType);
      setShowSendDialog(true);
    }
  });

  const purgeAction = (rowName: string, rowAddress: string, rowRoutingType: string): IAction => ({
    title: "Purge",
    onClick: () => {
      setQueue(rowName);
      setQueueToPurgeAddress(rowAddress);
      setQueueToPurgeRoutingType(rowRoutingType);
      setShowPurgeDialog(true);
    }
  });

  const browseAction = (rowName: string, rowAddress: string, rowRoutingType: string): IAction => ({
    title: "Browse Messages",
    onClick: () => {
      navigate.selectQueue(rowName, rowAddress, rowRoutingType);
    }
  });

  const permissions = artemisService.getQueuePermissions(brokerNode);

  const getRowActions = (row: any): IAction[] => {
    const rowName = row.name;
    const rowAddress = row.address;
    const rowRoutingType = row.routingType;
    var rowPerms = permissions[rowName];
    if(rowPerms == undefined) {
      //it may have a client id with /. in the name which is delimeted in the mbean name
      rowPerms = permissions[row.name.replaceAll('\\', '\\\\')];
    }
    const actions: IAction[] = [
      showInJmxAction(rowName, rowAddress, rowRoutingType),
      attributesAction(rowName, rowAddress, rowRoutingType),
      operationsAction(rowName, rowAddress, rowRoutingType)
    ];

  if (rowPerms?.canSend) {
    actions.push(sendMessageAction(rowName, rowAddress, rowRoutingType));
  }
  if (rowPerms?.canPurge) {
    actions.push(purgeAction(rowName, rowAddress, rowRoutingType));
  }
  if (rowPerms?.canBrowse) {
    actions.push(browseAction(rowName, rowAddress, rowRoutingType));
  }
  if (rowPerms?.canDelete) {
    actions.push(deleteAction(rowName));
  }

    return actions;

  };

  return (
    <><ArtemisTable allColumns={allColumns} getData={listQueues} getRowActions={getRowActions} loadData={loadData} storageColumnLocation={columnStorage.queues} navigate={navigate.search} filter={navigate.filter} /><Modal
      aria-label='queue-delete-modal'
      variant={ModalVariant.medium}
      title="Delete Queue?"
      isOpen={showDeleteDialog}
      onClose={() => setShowDeleteDialog(false)}
      actions={[
        <Button key="confirm" variant="primary" onClick={() => deleteQueue(queue)}>
          Confirm
        </Button>,
        <Button key="cancel" variant="secondary" onClick={closeDeleteDialog}>
          Cancel
        </Button>
      ]}><p>You are about to delete queue <b>{queue}</b>.</p>
      <p>This operation cannot be undone.</p>
    </Modal>
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
      aria-label='queue-purge-modal'
      variant={ModalVariant.medium}
      title="Purge Queue?"
      isOpen={showPurgeDialog}
      onClose={() => setShowPurgeDialog(false)}
      actions={[
        <Button key="confirm" variant="primary" onClick={() => purgeQueue(queue, queueToPurgeAddress, queueToPurgeRoutingType)}>
          Confirm
        </Button>,
        <Button key="cancel" variant="secondary" onClick={closePurgeDialog}>
          Cancel
        </Button>
      ]}><p>You are about to remove all messages from queue <b>{queue}</b>.</p>
        <p>This operation cannot be undone.</p>
      </Modal>
      <Modal
        aria-label='queue-send-modal'
        variant={ModalVariant.medium}
        isOpen={showSendDialog}
        onClose={() => setShowSendDialog(false)}
        actions={[
          <Button key="close" variant="secondary" onClick={closeSendDialog}>
            Cancel
          </Button>
        ]}>
        <SendMessage address={address} queue={queue} routingType={routingType} isAddress={false} />
      </Modal></>
  )
}
