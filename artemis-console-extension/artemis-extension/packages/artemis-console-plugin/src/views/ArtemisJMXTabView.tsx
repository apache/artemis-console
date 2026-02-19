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
import { Tabs, Tab, TabTitleText, Button, Modal, ModalVariant, PageSection } from '@patternfly/react-core';
import { Attributes, Chart, MBeanNode, Operations } from '@hawtio/react';
import { CreateQueue } from '../queues/CreateQueue';
import { DeleteAddress } from '../addresses/DeleteAddress';
import { isAddress as isAnAddress, isQueue, mbeanUnescape } from '../util/jmx'
import { MessagesTable } from '../messages/MessagesTable';
import { SendMessage } from '../messages/SendMessage';
import { Message, MessageView } from '../messages/MessageView';
import { DeleteQueue } from '../queues/DeleteQueue';
import { artemisService } from '../artemis-service';
import { ArtemisContext } from '../context';



export const ArtemisJMXTabs: React.FunctionComponent = () => {
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

  const { selectedNode, brokerNode } = useContext(ArtemisContext);
  const [activeTabKey, setActiveTabKey] = useState<string | number>(0);
  const [ showMessageDialog, setShowMessageDialog ] = useState<boolean>(false);
  const [ currentMessage, setCurrentMessage ] = useState<Message>(initialMessage);

  if(!selectedNode) {
    return  ('');
  }

  const isAddress = isAnAddress(selectedNode)
  const isAQueue = isQueue(selectedNode);

  let prop = selectedNode.getProperty("routing-type");
  const routingType: string  = mbeanUnescape(prop === undefined?'':prop);
  prop = selectedNode.getProperty("address");
  const address: string | undefined = mbeanUnescape(prop === undefined?'':prop);
  prop = selectedNode.getProperty("queue");
  const queue: string | undefined = mbeanUnescape(prop === undefined?'':prop);

  const handleTabClick = ( event: React.MouseEvent<any> | React.KeyboardEvent | MouseEvent, tabIndex: string | number
  ) => {
    setActiveTabKey(tabIndex);
  };

  const selectMessage = (message: Message) => {
    setCurrentMessage(message);
    setShowMessageDialog(true);
  }


  
  return (
    <div>
      <Tabs activeKey={activeTabKey}
            onSelect={handleTabClick} 
            aria-label="artemistabs" >
        <Tab eventKey={0} title={<TabTitleText>Attributes</TabTitleText>} aria-label="Attributes">
        {activeTabKey === 0 &&
          <Attributes/>
        }
        </Tab>
        <Tab eventKey={1} title={<TabTitleText>Operations</TabTitleText>} aria-label="Operations">
        {activeTabKey === 1 &&
          <Operations/>
        }
        </Tab>
        <Tab eventKey={2} title={<TabTitleText>Chart</TabTitleText>} aria-label="Chart">
        {activeTabKey === 2 &&
          <Chart/>
        }
        </Tab>
        { isAddress && artemisService.canCreateQueue(brokerNode) &&
          <Tab eventKey={3} title={<TabTitleText>Create Queue</TabTitleText>} aria-label="Create Queue">
              {activeTabKey === 3 &&
                <PageSection padding={{default: 'padding'}}>
                  <CreateQueue address={selectedNode.name}/>
                </PageSection>
              }
          </Tab> 
        }
        { isAddress && artemisService.canDeleteAddress(brokerNode) &&
          <Tab eventKey={4} title={<TabTitleText>Delete Address</TabTitleText>} aria-label="">
              {activeTabKey === 4 &&
                <PageSection padding={{default: 'padding'}}>
                  <DeleteAddress address={selectedNode.name}/>
                </PageSection>
              }
          </Tab> 
        }
        {
          isAddress && artemisService.checkCanSendMessageToAddress(selectedNode as MBeanNode) &&
          <Tab eventKey={5} title={<TabTitleText>Send Message</TabTitleText>} aria-label="">
              {activeTabKey === 5 &&
                <SendMessage queue={queue} routingType={routingType} address={address} isAddress={true}/>
              }
          </Tab> 
        }
        { isAQueue && artemisService.checkCanBrowseQueue(selectedNode as MBeanNode) &&
          <Tab eventKey={6} title={<TabTitleText>Browse Messages</TabTitleText>} aria-label="">
             {activeTabKey === 6 &&
             <PageSection padding={{default: 'padding'}}>
                <MessagesTable address={address} queue={queue} routingType={routingType} selectMessage={selectMessage} back={undefined} />
                <Modal
                  aria-label='message-view-modal'
                  variant={ModalVariant.medium}
                  isOpen={showMessageDialog}
                  onClose={() => setShowMessageDialog(false)}
                  actions={[
                    <Button key="close" variant="secondary" onClick={() => setShowMessageDialog(false)}>
                      Close
                    </Button>
                  ]}>
                  <MessageView currentMessage={currentMessage} />
                </Modal>
              </PageSection>
           }
          </Tab>
        }
        { isAQueue && artemisService.canDeleteQueue(brokerNode) &&
          <Tab eventKey={7} title={<TabTitleText>Delete Queue</TabTitleText>} aria-label="">
              {activeTabKey === 7 &&
                <PageSection padding={{default: 'padding'}}>
                  <DeleteQueue queue={selectedNode.name} address={address} routingType={routingType}/>
                </PageSection>
              }
          </Tab> 
        }
        { isAQueue && artemisService.checkCanSendMessageToQueue(selectedNode as MBeanNode) &&
          <Tab eventKey={8} title={<TabTitleText>Send Message</TabTitleText>} aria-label="">
              {activeTabKey === 8 &&
                <SendMessage queue={selectedNode.name} routingType={routingType} address={address} isAddress={false}/>
              }
          </Tab> 
        }
      </Tabs> 
    </div>
  )

}
