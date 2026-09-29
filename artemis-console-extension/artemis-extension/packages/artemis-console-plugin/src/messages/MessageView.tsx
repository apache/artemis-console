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
import { Title, TextArea, Divider, Button } from '@patternfly/react-core';
import { Thead, Tr, Th, Tbody, Td, Table } from '@patternfly/react-table';
import { log } from '../globals';
import { artemisService } from '../artemis-service';

export type MessageProps = {
  currentMessage: Message,
  back?: Function,
  onNext?: () => void,
  onPrevious?: () => void,
  hasNext?: boolean,
  hasPrevious?: boolean,
  currentIndex?: number,
  totalCount?: number
}

export type Message = {
  messageID: string, 
  text?: string, 
  BodyPreview?: number[],
  address: string,
  durable: boolean,
  expiration: number,
  largeMessage: boolean,
  persistentSize: number,
  priority: number,
  protocol: string,
  redelivered: boolean,
  timestamp: number,
  type: number,
  userID: string,
  StringProperties?: any,
  BooleanProperties?: any,
  ByteProperties?: any,
  DoubleProperties?: any,
  FloatProperties?: any,
  LongProperties?: any,
  IntProperties?: any
  ShortProperties?: any
}

export const MessageView: React.FunctionComponent<MessageProps> = props => {

  const currentMessage = props.currentMessage;
  const [messageBody, setMessageBody] = useState("");
  const [messageTextMode, setMessageTextMode] = useState("");

  useEffect(() => {
    updateBodyText(currentMessage);
  }, [currentMessage])

  const updateBodyText = (currentMessage: Message): void =>  {
    log.debug("loading message:" + currentMessage);
    let body: string = "";
    let lenTxt: string = "";
    if (currentMessage.text) {
       body = currentMessage.text;
        lenTxt = "" + body.length;
        setMessageTextMode("text (" + lenTxt + " chars)");
        setMessageBody(body);
    } else if (currentMessage.BodyPreview) {
        const code = Number(localStorage["ArtemisBrowseBytesMessages"] || "1");
        setMessageTextMode("bytes (turned off)");
        let len = 0;
        if (code !== 99) {
            const bytesArr: string[] = [];
            const textArr: string[] = [];
            currentMessage.BodyPreview.forEach(function(b: number) {
                if (code === 1 || code === 2 || code === 16) {
                    // text
                    textArr.push(String.fromCharCode(b));
                }
                if (code === 1 || code === 4) {
                    const unsignedByte = b & 0xff;

                    if (unsignedByte < 16) {
                        // hex and must be 2 digit so they space out evenly
                        bytesArr.push('0' + unsignedByte.toString(16));
                    } else {
                        bytesArr.push(unsignedByte.toString(16));
                    }
                } else {
                    // just show as is without spacing out, as that is usually more used for hex than decimal
                    const s = b.toString(10);
                    bytesArr.push(s);
                }
            });
            const bytesData = bytesArr.join(" ");
            const textData = textArr.join("");
            if (code === 1 || code === 2) {
                // bytes and text
                len = currentMessage.BodyPreview.length;
                lenTxt = "" + textArr.length;
                body = "bytes:\n" + bytesData + "\n\ntext:\n" + textData;
               setMessageTextMode("bytes (" + len + " bytes) and text (" + lenTxt + " chars)");
            } else if (code === 16) {
                // text only
                len = currentMessage.BodyPreview.length;
                lenTxt = "" + textArr.length;
                body = "text:\n" + textData;
                setMessageTextMode("text (" + lenTxt + " chars)");
            } else {
                // bytes only
                len = currentMessage.BodyPreview.length;
                body = bytesData;
                setMessageTextMode("bytes (" + len + " bytes)");
            }
        }
        setMessageBody(body);
    } else {
      setMessageTextMode("unsupported");
      setMessageBody("Unsupported message body type which cannot be displayed by hawtio");
    }
  }

  return (
    <>
    <Title headingLevel="h4">
      Message ID: {currentMessage.messageID} ({(props.currentIndex ?? 0) + 1}/{props.totalCount})
    </Title>
    <Title headingLevel="h4">Displaying Body as : {messageTextMode}</Title>
    <TextArea id="body" autoResize isDisabled value={messageBody}></TextArea>
    <Title headingLevel="h4">Headers</Title>
    <Table variant="compact" aria-label="Headers Table">
      <Thead>
        <Tr id="heading">
          <Th>key</Th>
          <Th>value</Th>
        </Tr>
      </Thead>
      <Tbody>
        <Tr id="address">
          <Td id="address.key">address</Td>
          <Td id="address.val">{currentMessage.address}</Td>
        </Tr>
        <Tr id="durable">
          <Td>durable</Td>
          <Td>{"" + currentMessage.durable}</Td>
        </Tr>
        <Tr id="exp">
          <Td>expiration</Td>
          <Td>{artemisService.formatExpires(currentMessage.expiration, true)}</Td>
        </Tr>
        <Tr id="large">
          <Td>largeMessage</Td>
          <Td>{"" + currentMessage.largeMessage}</Td>
        </Tr>
        <Tr id="messageID">
          <Td>messageID</Td>
          <Td>{currentMessage.messageID}</Td>
        </Tr>
        <Tr id="persistentSize">
          <Td>persistentSize</Td>
          <Td>{artemisService.formatPersistentSize(currentMessage.persistentSize)}</Td>
        </Tr>
        <Tr id="priority">
          <Td>priority</Td>
          <Td>{currentMessage.priority}</Td>
        </Tr>
        <Tr id="protocol">
          <Td>protocol</Td>
          <Td>{currentMessage.protocol}</Td>
        </Tr>
        <Tr id="redelivered">
          <Td>redelivered</Td>
          <Td>{"" + currentMessage.redelivered}</Td>
        </Tr>
        <Tr id="timestamp">
          <Td>timestamp</Td>
          <Td>{artemisService.formatTimestamp(currentMessage.timestamp)}</Td>
        </Tr>
        <Tr id="type">
          <Td>type</Td>
          <Td>{artemisService.formatType(currentMessage)}</Td>
        </Tr>
        <Tr id="user">
          <Td>userID</Td>
          <Td>{currentMessage.userID}</Td>
        </Tr>
      </Tbody>    
    </Table>
    <Divider/>
    <Title headingLevel="h4">Properties</Title>
      <Table variant="compact" aria-label="Properties Table">
      <Thead>
        <Tr id="propsHeaders">
          <Th>key</Th>
          <Th>value</Th>
          <Th>type</Th>
        </Tr>
      </Thead>
      <Tbody>
      {
          getProps(currentMessage.StringProperties, "String")
      }
      {
          getProps(currentMessage.BooleanProperties, "Boolean")
      }
      {
          getProps(currentMessage.ByteProperties, "Byte")
      }
      {
          getProps(currentMessage.DoubleProperties, "Double")
      }
      {
          getProps(currentMessage.FloatProperties, "Float")
      }
      {
          getProps(currentMessage.IntProperties, "Integer")
      }
      {
          getProps(currentMessage.LongProperties, "Long")
      }
      {
          getProps(currentMessage.ShortProperties, "Short")
      }
      </Tbody>
      </Table>
    {props.back &&
        <><Button id='message-view-queues-button' onClick={() => { if (props.back) { props.back(0); } } }>Queues</Button>
        <Button id='message-view-browse-button'  onClick={() => { if (props.back) { props.back(1); } }}>Browse</Button></>
    }
    {(props.onPrevious || props.onNext) &&
      <>
        <Button id='message-view-previous-button' isDisabled={!props.hasPrevious} onClick={() => { if (props.onPrevious) { props.onPrevious(); } }}>Previous</Button>
        <Button id='message-view-next-button' isDisabled={!props.hasNext} onClick={() => { if (props.onNext) { props.onNext(); } }}>Next</Button>
      </>
    }
    </>
  )
}

function getProps(properties: any, type:string): React.ReactNode {
  if(properties) {
    return Object.keys(properties).map((key, index) => {
      return (
        <Tr id={key} key={key}>
          <Td id={key + "key"}>{key}</Td>
          <Td id={key + "val"}>{"" + properties[key]}</Td>
          <Td id={key + "type"}>{type}</Td>
        </Tr>
      );
    }
    )
  } else {
    return '';
  };
}
