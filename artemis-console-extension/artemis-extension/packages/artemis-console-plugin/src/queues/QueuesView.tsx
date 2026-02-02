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
import React, { useState } from 'react'
import { Navigate } from '../views/ArtemisTabView';
import { QueuesTable } from './QueuesTable';
import { MessagesTable } from '../messages/MessagesTable';
import { Filter } from '../table/ArtemisTable';
import { Button, Modal, ModalVariant, TextContent, Title, Text, Icon, TextVariants, TextList, TextListItem, TextListItemVariants, TextListVariants } from '@patternfly/react-core';
import { Message, MessageView } from '../messages/MessageView';
import { HelpIcon } from '@patternfly/react-icons/dist/esm/icons/help-icon';
import { Link } from 'react-router-dom';

export type QueueNavigate = {
  search: Function
  filter?: Filter
  selectQueue: Function
}

export type MessageNavigate = {
  search: Function
  filter?: Filter
  selectMessage: Function
}

export type Queue = {
  name: string,
  address: string,
  routingType: string
}





export const QueuesView: React.FunctionComponent<Navigate> = navigate => {
  const initialMessage: Message = {
    messageID: '',
    address: '',
    durable: false,
    expiration: 0,
    largeMessage: false,
    persistentSize: 0,
    priority: 0,
    protocol: '',
    redelivered: false,
    timestamp: 0,
    type: 0,
    userID: ''
  };

  const [ activeTabKey, setActiveTabKey ] = useState<string | number>(0);
  const [ currentQueue, setCurrentQueue ] = useState<Queue>({name: "", address: "", routingType: "ANYCAST"});
  const [ currentMessage, setCurrentMessage ] = useState<Message>(initialMessage);
  const [ showHelpModal, setShowHelpModal ] = useState(false);

  const selectQueue = (queue: string, address: string, routingType: string) => {
    setCurrentQueue({
      name: queue,
      address: address, 
      routingType: routingType
    });
    setActiveTabKey(1);
  }

  const selectMessage = (message: Message) => {
    setCurrentMessage(message);
    setActiveTabKey(2);
  }

  const back = (tab: number) => {
      setActiveTabKey(tab);
  }

  return (
    <div>
        {activeTabKey === 0 &&
          <QueuesTable search={navigate.search} filter={navigate.filter} selectQueue={selectQueue}/>
        }
        {activeTabKey === 1 &&
        <>
        <Title headingLevel='h2'>Browsing {currentQueue.name + ' '} <Icon status="info"><HelpIcon  onClick={() => setShowHelpModal(true)}/></Icon></Title>
        <MessagesTable address={currentQueue.address} queue={currentQueue.name} routingType={currentQueue.routingType} selectMessage={selectMessage} back={back}/>
        </>
        }
        {activeTabKey === 2 &&
        <>
        <Title headingLevel='h2'>Viewing Message on {currentQueue.name}</Title>
        <MessageView currentMessage={currentMessage} back={back}/>
        </>
        }
        <Modal aria-label='copy-message-modal'
                variant={ModalVariant.medium}
                isOpen={showHelpModal}
                onClose={() => setShowHelpModal(false)}
                actions={[
                  <Button key="cancel" variant="secondary" onClick={() => setShowHelpModal(false)}>
                    Close
                  </Button>
                ]}>
          <TextContent>
            <Text component={TextVariants.h1}>Using Filter Expressions</Text>
            <Text component={TextVariants.h2}>Apache Artemis provides a powerful filter language based on a subset of the SQL 92 expression syntax.</Text>
            <Text>It is similar to the syntax used for JMS Message selectors. 
              For documentation on JMS selector syntax please the JavaDoc for javax.jms.Message or <Link target='_BLANK' to={'https://jakarta.ee/specifications/messaging/3.1/apidocs/jakarta.messaging/jakarta/jms/message'}>jakarta.jms.Message</Link></Text>
              <Text>A Filter will search for messages that have a matching property.</Text>
              <Text component={TextVariants.h3}>Filter Examples</Text>
              <TextList component={TextListVariants.dl}>
                <TextListItem component={TextListItemVariants.dt}>property = 'value'</TextListItem>
                <TextListItem component={TextListItemVariants.dd}> This will return any message where the message property <b>property</b> has the string value <b>value</b></TextListItem>
                <TextListItem component={TextListItemVariants.dt}>property = 1</TextListItem>
                <TextListItem component={TextListItemVariants.dd}> This will return any message where the message property <b>property</b> has the int, short, long or double value <b>1</b></TextListItem>
                <TextListItem component={TextListItemVariants.dt}>property {'>'} 1</TextListItem>
                <TextListItem component={TextListItemVariants.dd}> This will return any message where the message property <b>property</b> has an int, short, long or double value greater than <b>1</b></TextListItem>
                <TextListItem component={TextListItemVariants.dt}>property {'<>'} 'value'</TextListItem>
                <TextListItem component={TextListItemVariants.dd}> This will return any message where the message property <b>property</b> exists and does not equal <b>value</b></TextListItem>
                <TextListItem component={TextListItemVariants.dt}>property IN ('value1', 'value2')</TextListItem>
                <TextListItem component={TextListItemVariants.dd}> This will return any message where the message property <b>property</b> equals either <b>value1</b> or <b>value2</b></TextListItem>
                <TextListItem component={TextListItemVariants.dt}>property1 = 'value1' AND property2 = 'value2'</TextListItem>
                <TextListItem component={TextListItemVariants.dd}> This will return any message where the message property <b>property1</b> has the value <b>value1</b> and the message property <b>property2</b> has the value <b>value2</b></TextListItem>
                <TextListItem component={TextListItemVariants.dt}>property LIKE 'value%'</TextListItem>
                <TextListItem component={TextListItemVariants.dd}> This will return any message where the message property <b>property</b> has the pattern matching value <b>value%</b> such as <b>value1</b>, <b>value2345</b> etc</TextListItem>
                <TextListItem component={TextListItemVariants.dt}>property LIKE 'value_'</TextListItem>
                <TextListItem component={TextListItemVariants.dd}> This will return any message where the message property <b>property</b> has the pattern matching value <b>value_</b> such as <b>value1</b> but not <b>value2345</b></TextListItem>
                <TextListItem component={TextListItemVariants.dt}>property IS null</TextListItem>
                <TextListItem component={TextListItemVariants.dd}> This will return any message where the message property <b>property</b> has a null value or does not exist</TextListItem>
              </TextList>
              <Text>The following pre defined identifiers can also be used to filter messages </Text>
              <TextList component={TextListVariants.dl}>
                <TextListItem component={TextListItemVariants.dt}>AMQUserID</TextListItem>
                <TextListItem component={TextListItemVariants.dd}>The ID set by the user when the message is sent. This is analogous to the <b>JMSMessageID</b> for JMS-based clients.</TextListItem>
                <TextListItem component={TextListItemVariants.dt}>AMQAddress</TextListItem>
                <TextListItem component={TextListItemVariants.dd}>The address to which the message was sent.</TextListItem>
                <TextListItem component={TextListItemVariants.dt}>AMQGroupID</TextListItem>
                <TextListItem component={TextListItemVariants.dd}>The group ID used when sending the message.</TextListItem>
                <TextListItem component={TextListItemVariants.dt}>AMQPriority</TextListItem>
                <TextListItem component={TextListItemVariants.dd}>To refer to the priority of a message. Message priorities are integers with valid values from 0 - 9. 0 is the lowest priority and 9 is the highest. e.g. <i>AMQPriority = 3 AND animal = 'aardvark'</i></TextListItem>
                <TextListItem component={TextListItemVariants.dt}>AMQExpiration</TextListItem>
                <TextListItem component={TextListItemVariants.dd}>To refer to the expiration time of a message. The value is a long integer.</TextListItem>
                <TextListItem component={TextListItemVariants.dt}>AMQDurable</TextListItem>
                <TextListItem component={TextListItemVariants.dd}>To refer to whether a message is durable or not. The value is a string with valid values: <b>DURABLE</b> or <b>NON_DURABLE</b>.</TextListItem>
                <TextListItem component={TextListItemVariants.dt}>AMQTimestamp</TextListItem>
                <TextListItem component={TextListItemVariants.dd}>The timestamp of when the message was created. The value is a long integer.</TextListItem>
                <TextListItem component={TextListItemVariants.dt}>AMQSize</TextListItem>
                <TextListItem component={TextListItemVariants.dd}>The size of a message in bytes. The value is an integer.</TextListItem>
              </TextList>
          </TextContent>
          </Modal>
    </div>
  )
}