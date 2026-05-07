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
import React, { FormEvent, useRef, useState } from 'react'
import xmlFormat from 'xml-formatter'

import {
  Button,
  Flex,
  FlexItem,
  Form,
  FormGroup,
  MenuToggle,
  MenuToggleElement,
  PageSection,
  Select,
  SelectList,
  SelectOption,
  TextInput,
  Title,
  Text,
  Checkbox,
  Tooltip,
  Popover,
  TextContent,
  TextArea
} from '@patternfly/react-core'
import { OutlinedQuestionCircleIcon } from '@patternfly/react-icons/dist/esm/icons/outlined-question-circle-icon'
import { InfoCircleIcon } from '@patternfly/react-icons/dist/esm/icons/info-circle-icon'
import { TrashIcon } from '@patternfly/react-icons/dist/esm/icons/trash-icon'
import { Language } from '@patternfly/react-code-editor'
import { eventService, jolokiaService } from '@hawtio/react'
import { artemisService } from '../artemis-service'
import { Message } from './MessageView'

type SendBodyMessageProps = {
  onBodyChange: (body: string) => void
  body?: string
}

type SendMessageProps = {
  queue: string
  routingType: string
  address: string
  isAddress: boolean
  message?: Message
}

const MessageBody: React.FunctionComponent<SendBodyMessageProps> = props => {
  const [messageBody, setMessageBody] = useState<string>(props.body?props.body:'')
  const [selectedFormat, setSelectedFormat] = useState<Language>(Language.xml)
  const [isDropdownOpen, setDropdownOpen] = useState(false)

  const handleAutoFormat = () => {
    try {
      if (selectedFormat === Language.xml) {
        updateMessageBody(xmlFormat(messageBody))
      } else if (selectedFormat === Language.json) {
        updateMessageBody(JSON.stringify(JSON.parse(messageBody), null, 2))
       }
    } catch {
      // ignore formatting errors
    }
  }

  const updateMessageBody = (body: string) => {
    setMessageBody(body)
    props.onBodyChange(body)
  }
  const handleToggle = () => {
    setDropdownOpen(!isDropdownOpen)
  }
  const handleFormatChange = (_event?: (React.MouseEvent<Element, MouseEvent> | undefined), value?: (string | number | undefined)) => {
    setSelectedFormat(value as Language)
    setDropdownOpen(false)
  }


  return (
    <>
      <FormGroup label='Message'>
        <TextArea
          value={messageBody}
          onChange={(_event, value) => updateMessageBody(value)}
          rows={12}
         />
      </FormGroup>
      <FormGroup>
        <Flex>
          <FlexItem flex={{ default: 'flexNone', md: 'flex_2' }}>
            {' '}
            <Select
              toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
                  <MenuToggle isFullWidth role='menu' ref={toggleRef} onClick={handleToggle}>
                    {selectedFormat}
                  </MenuToggle>
              )}
              aria-label='Select Format'
              onSelect={handleFormatChange}
              selected={selectedFormat}
              isOpen={isDropdownOpen}
            >
              <SelectList>
                <SelectOption label='plaintext' value={Language.plaintext}>{Language.plaintext}</SelectOption>
                <SelectOption label='xml' value={Language.xml}>{Language.xml}</SelectOption>
                <SelectOption label='json' value={Language.json}>{Language.json}</SelectOption>
              </SelectList>
            </Select>
          </FlexItem>{' '}
          <FlexItem flex={{ default: 'flexNone', md: 'flex_1' }}>
            <Button onClick={handleAutoFormat}>Format</Button>
          </FlexItem>
        </Flex>
      </FormGroup>
    </>
  )
}

type MessageHeadersProps = {
  onHeadersChange: (headers: { name: string; value: string }[]) => void
  headers?: any
}
const MessageHeaders: React.FunctionComponent<MessageHeadersProps> = props => {
  const initialheaders: Array<{ name: string; value: string }> = [];
  if(props.headers) {
    Object.keys(props.headers).forEach((key, index) => {
      initialheaders.push({
        name: key,
        value: props.headers?props.headers[key]:''
      });
  })
  }
  const [headers, setHeaders] = useState<Array<{ name: string; value: string }>>(initialheaders)

  const handleInputChange = (index: number, newValue: string, event: React.FormEvent<HTMLInputElement>) => {
    const updatedHeaders = [...headers]
    updatedHeaders[index] = { ...updatedHeaders[index], [event.currentTarget.name]: newValue }
    setHeaders(updatedHeaders)
    props.onHeadersChange(updatedHeaders)
  }
  const handleAddHeader = () => {
    const updatedHeaders = [...headers, { name: '', value: '' }]
    setHeaders(updatedHeaders)
    props.onHeadersChange(updatedHeaders)
  }

  const handleRemoveHeader = (index: number) => {
    const updatedHeaders = [...headers]
    updatedHeaders.splice(index, 1)
    setHeaders(updatedHeaders)
    props.onHeadersChange(updatedHeaders)
  }

  return (
    <>
      <FormGroup>
        {/* eslint-disable-next-line react/jsx-no-undef */}
        <Button variant='link' onClick={handleAddHeader}>
          Add Headers
        </Button>
      </FormGroup>
      <FormGroup>
        {headers.length > 0 && (
          <Flex>
            <FlexItem flex={{ default: 'flexNone', md: 'flex_2' }}>Name</FlexItem>
            <FlexItem flex={{ default: 'flexNone', md: 'flex_2' }}>Value</FlexItem>
            <FlexItem flex={{ default: 'flexNone', md: 'flex_1' }}></FlexItem>
          </Flex>
        )}

        {headers.length > 0 &&
          headers.map((header, index) => (
            <Flex key={index}>
              <FlexItem flex={{ default: 'flexNone', md: 'flex_2' }}>
                <TextInput
                  type='text'
                  aria-label={'name-input-' + index}
                  name='name'
                  value={header.name}
                  onChange={(event, newValue) => handleInputChange(index, newValue, event)}
                />
              </FlexItem>
              <FlexItem flex={{ default: 'flexNone', md: 'flex_2' }}>
                <TextInput
                  type='text'
                  name='value'
                  aria-label={'value-input-' + index}
                  value={header.value}
                  onChange={(event, newValue) => handleInputChange(index, newValue, event)}
                />
              </FlexItem>
              <FlexItem flex={{ default: 'flexNone', md: 'flex_1' }} span={4}>
                <Button variant='link' onClick={() => handleRemoveHeader(index)} aria-label='Remove Header'>
                  <TrashIcon />
                </Button>
              </FlexItem>
            </Flex>
          ))}
      </FormGroup>
    </>
  )
}

export const SendMessage: React.FunctionComponent<SendMessageProps> = (props: SendMessageProps) => {
  const [isDurableChecked, setIsDurableChecked] = useState<boolean>(props.message? props.message.durable:true);
  const [isCreateIDChecked, setIsCreateIDChecked] = useState<boolean>(false);
  const [isUseLogonChecked, setIsUselogonChecked] = useState<boolean>(true);
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('password');
  
  const messageHeaders = useRef<Array<{ name: string; value: string }>>([])
  const messageBody = useRef<string>('')

  const updateHeaders = (headers: { name: string; value: string }[]) => {
    messageHeaders.current = [...headers]
  }
  const updateTheMessageBody = (body: string) => {
    messageBody.current = body
  }

  const handleUsernameChange = (_event: React.FormEvent<HTMLInputElement>, name: string) => {
    setUsername(name);
  };

  const handlePasswordChange = (_event: React.FormEvent<HTMLInputElement>, password: string) => {
    setPassword(password);
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (props.isAddress) {
      artemisService.doSendMessageToAddress(messageBody.current, messageHeaders.current, isDurableChecked, isCreateIDChecked, isUseLogonChecked, username, password, props.address)
        .then(() => {
          eventService.notify({
            type: 'success',
            message: "Message Successfully Sent",
          })
        })
        .catch((error) => {
          eventService.notify({type: 'warning', message: jolokiaService.errorMessage(error) })
        })
    } else {
      artemisService.doSendMessageToQueue(messageBody.current, messageHeaders.current, isDurableChecked, isCreateIDChecked, isUseLogonChecked, username, password, props.routingType.toLowerCase(), props.queue, props.address)
        .then(() => {
          eventService.notify({
            type: 'success',
            message: "Message Successfully Sent",
          })
        })
        .catch((error) => {
          eventService.notify({type: 'warning', message: jolokiaService.errorMessage(error) })
        })
    }
  }


  const Hint = () => (
    <TextContent>
      <Text component='p'>
        Use this page to send a message of type <code>TextMessage</code> to an address or queue. 
      </Text>
    </TextContent>
  )

  return (
    <PageSection variant='light'>
      <Title headingLevel='h2'>Send Message to {props.isAddress ? 'Address' : 'Queue'} {props.address}{' '}
        <Popover bodyContent={Hint}><OutlinedQuestionCircleIcon /></Popover></Title>
      <Text component='p'>  <br /></Text>
      <Form onSubmit={handleSubmit}>
        <FormGroup
          label="Durable"
          labelIcon={<Tooltip content='Mark the message as persistent and write it to the broker journal if the destination queue is durable.'><InfoCircleIcon /></Tooltip>}
        >
          <Checkbox
            isChecked={isDurableChecked}
            onChange={() => setIsDurableChecked(!isDurableChecked)}
            id="durable" />

        </FormGroup>
        <FormGroup label="Create Message ID"
          labelIcon={
            <Tooltip content='Select to request that the broker generates a universally unique identifier (UUID) on the message before it is routed. For a JMS client, the UUID is the JMS Message ID of the message. Normally, not required if you are using a non-JMS client.'><InfoCircleIcon />
            </Tooltip>}>
          <Checkbox
            isChecked={isCreateIDChecked}
            onChange={() => setIsCreateIDChecked(!isCreateIDChecked)}
            id="createid" />
        </FormGroup>
        <FormGroup label="Use Current Logged in User"
          labelIcon={<Tooltip content='Use the credentials of the user that is currently logged in to the console to send a message. If you want to use a different user, clear the checkbox and specify a username and password.'><InfoCircleIcon /></Tooltip>}
        >
          <Checkbox
            isChecked={isUseLogonChecked}
            onChange={() => setIsUselogonChecked(!isUseLogonChecked)}
            id="uselogon" />
        </FormGroup>
        {!isUseLogonChecked &&
          <><FormGroup label="Username">
            <TextInput
              value={username}
              type='text'
              onChange={handleUsernameChange}
              id="username"
              name="username" />
          </FormGroup><FormGroup label="Password">
              <TextInput
                value={password}
                type='password'
                onChange={handlePasswordChange}
                id="password"
                name="password" />
            </FormGroup></>
        }
        <MessageHeaders onHeadersChange={updateHeaders} headers={props.message?.StringProperties}/>
        <MessageBody onBodyChange={updateTheMessageBody} body={props.message?.text} />
        <FormGroup>

          <Button type='submit' className='pf-m-1-col'>
            Send
          </Button>
        </FormGroup>
      </Form>
    </PageSection>
  )
}
