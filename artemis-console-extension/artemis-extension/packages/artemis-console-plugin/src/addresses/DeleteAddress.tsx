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
import { ActionGroup, Text, Button, Form, Icon, Modal, ModalVariant, TextContent, Title, Popover } from '@patternfly/react-core';
import React, { useState } from 'react'
import { ExclamationCircleIcon } from '@patternfly/react-icons/dist/esm/icons/exclamation-circle-icon.js';
import { eventService, jolokiaService, workspace } from '@hawtio/react';
import { artemisService } from '../artemis-service';
import { OutlinedQuestionCircleIcon } from '@patternfly/react-icons/dist/esm/icons/outlined-question-circle-icon.js';

type DeleteAddressProps = {
  address: string
}
export const DeleteAddress: React.FunctionComponent<DeleteAddressProps> = (props: DeleteAddressProps) => {

  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const handleDeleteAddress = () => {
    artemisService.deleteAddress(props.address)
      .then(() => {
        setShowDeleteModal(false);

        workspace.refreshTree();
        eventService.notify({
          type: 'success',
          message: "Address Successfully Deleted",
        })
      })
      .catch((error) => {
        setShowDeleteModal(false);
        eventService.notify({type: 'warning', message: jolokiaService.errorMessage(error) })
      })
  };

  const Hint = () => (
    <TextContent>
        <Text component='p'>
          Use this page to delete the selected address on the broker. The address is deleted only if it has no queues bound to it.
        </Text>
    </TextContent>
)

  return (
    <>
      <Title headingLevel="h2">Delete Address {props.address}{' '}
          <Popover bodyContent={Hint}><OutlinedQuestionCircleIcon /></Popover>
      </Title>
      <Form>
        <ActionGroup>
          <Button variant="primary" onClick={() => setShowDeleteModal(true)} >Delete</Button>
        </ActionGroup>
      </Form><Modal
      aria-label='delete-address-modal'
      variant={ModalVariant.medium}
      isOpen={showDeleteModal}
      onClose={() => setShowDeleteModal(false)}
      actions={[
        <Button key="cancel" variant="secondary" onClick={() => handleDeleteAddress()}>
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
          You are about to delete address {props.address}
        </Text>
        <Text component="p">
          This operation cannot be undone.
        </Text>
      </TextContent>
    </Modal>
    </>
  )
}
