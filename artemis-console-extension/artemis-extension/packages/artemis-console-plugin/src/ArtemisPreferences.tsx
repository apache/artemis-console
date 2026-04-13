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
import { CardBody, Flex, FlexItem, Form, FormGroup, FormSection, Icon, MenuToggle, MenuToggleElement, Select, SelectList, SelectOption, TextInput, Tooltip } from '@patternfly/react-core'
import React, { FormEvent, useState } from 'react'
import { artemisPreferencesService, ArtemisOptions } from './artemis-preferences-service'
import { HelpIcon } from '@patternfly/react-icons/dist/esm/icons/help-icon.js'

export const ArtemisPreferences: React.FunctionComponent = () => (
  <CardBody>
    <Form isHorizontal>
      <ArtemisPreferencesForm />
    </Form>
  </CardBody>
)

export const TooltipHelpIcon = ({ tooltip }: { tooltip: string }) => (
  <Icon size='md'>
    <Tooltip content={tooltip}>
      <HelpIcon />
    </Tooltip>
  </Icon>
)


type FormatType = {
  id: string;
  description: string;
  index: number;
}


const ArtemisPreferencesForm: React.FunctionComponent = () => {
  const off: FormatType = { id: "off", description: "Off", index: 99 };
  const text: FormatType = { id: "text", description: "Text", index: 16 }
  const decimal: FormatType = { id: "decimal", description: "Decimal", index: 8 }
  const hex: FormatType = { id: "hex", description: "Hex", index: 4 }
  const decimaltext: FormatType = { id: "decimaltext", description: "Decimal and Text", index: 2 }
  const hexttext: FormatType = { id: "hexttext", description: "Hex and Text", index: 1 }

  const formats = [off, text, decimal, hex, decimaltext, hexttext];

  const [artemisPreferences, setArtemisPreferences] = useState(artemisPreferencesService.loadArtemisPreferences())
  const [isDropdownOpen, setDropdownOpen] = React.useState(false);
  const format = formats.find(format => format.index === artemisPreferences.artemisBrowseBytesMessages);
  const [selectedFormat, setSelectedFormat] = useState(format ? format.description : off.description);

  const [selectedPageSize, setSelectedPageSize] = useState(artemisPreferencesService.loadArtemisPreferences().artemisDefaultPageSize)
  const [artemisMaxDiagramAddressSize, setArtemisMaxDiagramAddressSize] = useState(artemisPreferencesService.loadArtemisPreferences().artemisMaxDiagramAddressSize)

  const [isPageSizeDropdownOpen, setPageSizeDropdownOpen] = React.useState(false);

  const updatePreferences = (value: string | number | boolean, key: keyof ArtemisOptions): void => {
    const updatedPreferences = { ...artemisPreferences, ...{ [key]: value } }

    artemisPreferencesService.saveArtemisPreferences(updatedPreferences)
    setArtemisPreferences(updatedPreferences)
  }

  const updateStringValueFor = (key: keyof ArtemisOptions): ((event: React.FormEvent<HTMLInputElement>, value: string) => void) => {
    return (_event: React.FormEvent<HTMLInputElement>, value: string) => {
      if (!value) return

      updatePreferences(value, key)
    }
  }

  const handleToggle = () => {
    setDropdownOpen(!isDropdownOpen)
  }

  const handlePageSizeToggle = () => {
    setPageSizeDropdownOpen(!isPageSizeDropdownOpen)
  }

  const handleFormatChange = (event?: React.MouseEvent<Element, MouseEvent>, value?: string | number) => {
    setSelectedFormat(value as string);
    setDropdownOpen(false);
    const format = formats.find(format => format.description === value);
    if (format) {
      updatePreferences(format?.index, 'artemisBrowseBytesMessages');
    }
  }

  const handlePageSizeChange = (event?: React.MouseEvent<Element, MouseEvent>, value?: string | number) => {
    setSelectedPageSize(value as number);
    setPageSizeDropdownOpen(false);
    updatePreferences(value as number, 'artemisDefaultPageSize');
    artemisPreferencesService.resetPageSizes();
  }

  const handleMaxDiagramAddressSize = (event: FormEvent<HTMLInputElement>, value: string) => {
    setArtemisMaxDiagramAddressSize(Number(value));
    updatePreferences(Number(value), 'artemisMaxDiagramAddressSize');
  }

  return (
    <FormSection title='Artemis' titleElement='h2'>
      <FormGroup
        hasNoPaddingTop
        label='Dead-letter address regex'
        fieldId='artemis-form-artemisDLQ'
        labelIcon={
          <TooltipHelpIcon tooltip='A regular expression to match one or more dead-letter addresses' />
        }
      >
        <TextInput
          id='artemis-input-artemisDLQ'
          type='text'
          value={artemisPreferences.artemisDLQ}
          onChange={updateStringValueFor('artemisDLQ')}
        />
      </FormGroup>
      <FormGroup
        hasNoPaddingTop
        label='Expiry address regex'
        fieldId='artemis-form-expiry'
        labelIcon={<TooltipHelpIcon tooltip='A regular expression to match one or more expiry addresses' />}
      >
        <TextInput
          id='artemis-input-expiry'
          type='text'
          value={artemisPreferences.artemisExpiryQueue}
          onChange={updateStringValueFor('artemisExpiryQueue')}
        />
      </FormGroup>
      <FormGroup
        hasNoPaddingTop
        label='Browse Bytes Messages'
        fieldId='artemis-form-showJMXView'
        labelIcon={
          <TooltipHelpIcon tooltip='Format in which a BytesMessage body is shown' />
        }>
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
                <SelectOption label={off.id} value={off.description}>{off.description}</SelectOption>
                <SelectOption label={text.id} value={text.description}>{text.description}</SelectOption>
                <SelectOption label={decimal.id} value={decimal.description}>{decimal.description}</SelectOption>
                <SelectOption label={hex.id} value={hex.description}>{hex.description}</SelectOption>
                <SelectOption label={decimaltext.id} value={decimaltext.description}>{decimaltext.description}</SelectOption>
                <SelectOption label={hexttext.id} value={hexttext.description}>{hexttext.description}</SelectOption>
              </SelectList>
            </Select>
          </FlexItem>
        </Flex>
      </FormGroup>
      <FormGroup
        hasNoPaddingTop
        label='Default Page Size'
        fieldId='artemis-form-default-pagesize'
        labelIcon={
          <TooltipHelpIcon tooltip='he default page size to use for Artemis table views. This will replace all page sizes to the default' />
        }>
        <Flex>
          <FlexItem flex={{ default: 'flexNone', md: 'flex_2' }}>
            {' '}
            <Select
              toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
                  <MenuToggle isFullWidth role='menu' ref={toggleRef} onClick={handlePageSizeToggle}>
                    {selectedPageSize}
                  </MenuToggle>
                )}
              aria-label='Select Format'
              onSelect={handlePageSizeChange}
              selected={selectedPageSize}
              isOpen={isPageSizeDropdownOpen}
            >
              <SelectList>
                <SelectOption label={"10"} value={"10"}>{"10"}</SelectOption>
                <SelectOption label={"20"} value={"20"}>{"20"}</SelectOption>
                <SelectOption label={"50"} value={"50"}>{"50"}</SelectOption>
                <SelectOption label={"100"} value={"100"}>{"100"}</SelectOption>
                <SelectOption label={"All"} value={"-1"}>{"-1"}</SelectOption>
              </SelectList>
            </Select>
          </FlexItem>
        </Flex>
      </FormGroup>

      <FormGroup
        hasNoPaddingTop
        label='Max Diagram Address Size'
        fieldId='artemis-form-diagram'
        labelIcon={<TooltipHelpIcon tooltip='How many addresses will be loaded in the broker diagram tab' />}
      >
        <TextInput
          id='artemis-input-diagram'
          type='number'
          value={artemisMaxDiagramAddressSize}
          onChange={handleMaxDiagramAddressSize}
        />
      </FormGroup>

    </FormSection>
  )
}
