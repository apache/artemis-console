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
import { ActionGroup, Button, Form, Modal, ModalVariant, Popover, TextContent, Title, Text } from '@patternfly/react-core';
import React, { useState } from 'react'
import { eventService, jolokiaService, workspace } from '@hawtio/react';
import { artemisService } from '../artemis-service';
import { OutlinedQuestionCircleIcon } from '@patternfly/react-icons/dist/esm/icons/outlined-question-circle-icon.js';

type DeleteQueueProps = {
  queue: string
  address: string
  routingType: string
}
export const DeleteQueue: React.FunctionComponent<DeleteQueueProps> = (props: DeleteQueueProps) => {

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPurgeModal, setShowPurgeModal] = useState(false);


  const deleteQueue = async (name: string) => {
    await artemisService.deleteQueue(name)
      .then((value: unknown) => {
        setShowDeleteModal(false);
        workspace.refreshTree();
        eventService.notify({
          type: 'success',
          message: 'Queue Deleted',
          duration: 3000,
        })
      })
      .catch((error) => {
        setShowDeleteModal(false);
        eventService.notify({type: 'danger', message: 'Queue Not Deleted: ' + jolokiaService.errorMessage(error) })
      });
  };

  const purgeQueue = async () => {
    await artemisService.purgeQueue(props.queue, props.address, props.routingType)
      .then((value: unknown) => {
        setShowPurgeModal(false);
        eventService.notify({
          type: 'success',
          message: 'Queue Purged',
          duration: 3000,
        })
      })
      .catch((error) => {
        setShowPurgeModal(false);
        eventService.notify({type: 'warning', message: 'Queue Not Purged: ' + jolokiaService.errorMessage(error) })
      });
  };

  const HintDelete = () => (
    <TextContent>
      <Text component='p'>
      Delete the selected broker queue. The queue is deleted only if it has no consumers bound to it.
      </Text>
    </TextContent>
  )
  const HintPurge = () => (
    <TextContent>
      <Text component='p'>
      Delete all the messages in the selected broker queue.
      </Text>
    </TextContent>
  )

  return (
    <>
      <Title headingLevel="h2">Delete/Purge Queue {props.queue}{' '}
      </Title>
      <Form>
        <ActionGroup>
          <Button variant="primary" onClick={() => setShowDeleteModal(true)} >Delete</Button>
          <Text>{' '}<Popover bodyContent={HintDelete}><OutlinedQuestionCircleIcon /></Popover></Text>
        </ActionGroup>
      </Form>
      <Form>
        <ActionGroup>
          <Button variant="primary" onClick={() => setShowPurgeModal(true)} >Purge</Button>
          <Text>{' '}<Popover bodyContent={HintPurge}><OutlinedQuestionCircleIcon /></Popover></Text>
        </ActionGroup>
      </Form>
      <Modal
      aria-label='queue-delete-modal'
      variant={ModalVariant.medium}
      title="Delete Queue?"
      isOpen={showDeleteModal}
      onClose={() => setShowDeleteModal(false)}
      actions={[
        <Button key="confirm" variant="primary" onClick={() => deleteQueue(props.queue)}>
          Confirm
        </Button>,
        <Button key="cancel" variant="secondary" onClick={() => setShowDeleteModal(false)}>
          Cancel
        </Button>
      ]}><p>You are about to delete queue <b>{props.queue}</b>.</p>
      <p>This operation cannot be undone.</p>
    </Modal>
    <Modal
      aria-label='queue-purge-modal'
      variant={ModalVariant.medium}
      title="Purge Queue?"
      isOpen={showPurgeModal}
      onClose={() => setShowPurgeModal(false)}
      actions={[
        <Button key="confirm" variant="primary" onClick={() => purgeQueue()}>
          Confirm
        </Button>,
        <Button key="cancel" variant="secondary" onClick={() => setShowPurgeModal(false)}>
          Cancel
        </Button>
      ]}><p>You are about to delete all the messages in queue <b>{props.queue}</b>.</p>
      <p>This operation cannot be undone.</p>
    </Modal>
    </>
  )
}
