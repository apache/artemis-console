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
import { render, screen, within } from '@testing-library/react'
import { AddressesTable } from './AddressesTable'
import { artemisService } from '../artemis-service'

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn()
}))

jest.mock('@patternfly/react-core', () => ({
  ...jest.requireActual('@patternfly/react-core'),
  Modal: ({ children, 'aria-label': ariaLabel, ...props }: any) => (
    <div aria-label={ariaLabel} data-testid={`modal-${ariaLabel}`} {...props}>
      {children}
    </div>
  ),
  Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  Icon: ({ children }: any) => <span>{children}</span>,
  TextContent: ({ children }: any) => <div>{children}</div>,
  Text: ({ children }: any) => <p>{children}</p>,
  ModalVariant: {
    medium: 'medium'
  }
}))

jest.mock('../artemis-service', () => ({
  artemisService: {
    getAddresses: jest.fn(),
    canCreateQueue: jest.fn(() => false),
    canDeleteAddress: jest.fn(() => false),
    canCreateAddress: jest.fn(() => false),
    canSendMessageToAddress: jest.fn(() => false),
    getBrokerObjectName: jest.fn(() => Promise.resolve('org.apache.activemq.artemis:broker=127.0.0.1')),
    deleteAddress: jest.fn(() => Promise.resolve())
  }
}))
jest.mock('../table/ArtemisTable', () => ({
  ArtemisTable: () => <div data-testid="artemis-table">ArtemisTable</div>
}))
jest.mock('../queues/CreateQueue', () => ({
  CreateQueue: () => <div>CreateQueue</div>
}))
const mockContextValue = {
  tree: {},
  selectedNode: undefined,
  brokerNode: undefined,
  setSelectedNode: jest.fn(),
  findAndSelectNode: jest.fn()
}

jest.mock('../context', () => ({
  ArtemisContext: {
    Provider: ({ children }: any) => children
  }
}))

// Mock React.useContext to return our mock context value
jest.spyOn(require('react'), 'useContext').mockReturnValue(mockContextValue)
jest.mock('./CreateAddress', () => ({
  CreateAddress: () => <div>CreateAddress</div>
}))
jest.mock('../messages/SendMessage', () => ({
  SendMessage: () => <div>SendMessage</div>
}))
jest.mock('../util/jmx', () => ({
  createAddressObjectName: jest.fn((brokerObjectName: string, addressName: string) =>
    `${brokerObjectName},component=addresses,address="${addressName}"`
  )
}))
jest.mock('../artemis-preferences-service', () => ({
  columnStorage: {
    addresses: 'addresses-columns'
  }
}))
jest.mock('@hawtio/react', () => ({
  Attributes: () => <div>Attributes</div>,
  Operations: () => <div>Operations</div>,
  eventService: {
    notify: jest.fn()
  },
  jolokiaService: {
    errorMessage: jest.fn()
  },
  workspace: {
    refreshTree: jest.fn()
  },
  Logger: {
    get: jest.fn(() => ({
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn()
    })),
    setLevel: jest.fn()
  }
}))

type PermissionConfig = {
  canCreateQueue?: boolean
  canDeleteAddress?: boolean
  canCreateAddress?: boolean
  canSendMessageToAddress?: boolean
}

const setupPermissions = (config: PermissionConfig = {}) => {
  const defaults = {
    canCreateQueue: false,
    canDeleteAddress: false,
    canCreateAddress: false,
    canSendMessageToAddress: false
  }

  const permissions = { ...defaults, ...config }

  artemisService.canCreateQueue = jest.fn(() => permissions.canCreateQueue)
  artemisService.canDeleteAddress = jest.fn(() => permissions.canDeleteAddress)
  artemisService.canCreateAddress = jest.fn(() => permissions.canCreateAddress)
  artemisService.canSendMessageToAddress = jest.fn(() => permissions.canSendMessageToAddress)
}

const renderComponent = () => {
  const result = render(<AddressesTable search="" filter={undefined} />)
  // Wait for modals to potentially render in portals
  return result
}

describe('AddressesTable', () => {

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Delete Address Modal Conditional Rendering', () => {

    test('should render delete modal in DOM when canDeleteAddress is true', () => {
      setupPermissions({ canDeleteAddress: true })
      renderComponent()

      // Check in both the main container and document body (for portals)
      const deleteModal = document.querySelector('[aria-label="delete-address-modal"]')
      expect(deleteModal).toBeInTheDocument()
    })

    test('should NOT render delete modal in DOM when canDeleteAddress is false', () => {
      setupPermissions({ canDeleteAddress: false })
      renderComponent()

      const deleteModal = document.querySelector('[aria-label="delete-address-modal"]')
      expect(deleteModal).not.toBeInTheDocument()
    })

    test('should NOT render delete modal when canDeleteAddress is false even if canCreateAddress is true', () => {
      setupPermissions({
        canDeleteAddress: false,
        canCreateAddress: true
      })
      renderComponent()

      const deleteModal = document.querySelector('[aria-label="delete-address-modal"]')
      expect(deleteModal).not.toBeInTheDocument()
    })

    test('should render delete modal based on canDeleteAddress permission, not canCreateAddress', () => {
      setupPermissions({
        canDeleteAddress: true,
        canCreateAddress: false
      })
      renderComponent()

      const deleteModal = document.querySelector('[aria-label="delete-address-modal"]')
      expect(deleteModal).toBeInTheDocument()
    })

    test('canDeleteAddress permission correctly controls modal rendering', () => {
      // First render with permission false
      const { rerender } = render(<AddressesTable search="" filter={undefined} />)
      setupPermissions({ canDeleteAddress: false })
      rerender(<AddressesTable search="" filter={undefined} />)

      let deleteModal = document.querySelector('[aria-label="delete-address-modal"]')
      expect(deleteModal).not.toBeInTheDocument()

      // Re-render with permission true
      setupPermissions({ canDeleteAddress: true })
      rerender(<AddressesTable search="" filter={undefined} />)

      deleteModal = document.querySelector('[aria-label="delete-address-modal"]')
      expect(deleteModal).toBeInTheDocument()
    })
  })

  describe('Service Permission Calls', () => {

    test('should call canDeleteAddress service method', () => {
      setupPermissions({ canDeleteAddress: true })
      renderComponent()

      expect(artemisService.canDeleteAddress).toHaveBeenCalled()
    })

    test('should call canCreateAddress service method', () => {
      setupPermissions({ canCreateAddress: true })
      renderComponent()

      expect(artemisService.canCreateAddress).toHaveBeenCalled()
    })

    test('should call both canDeleteAddress and canCreateAddress independently', () => {
      setupPermissions({
        canDeleteAddress: true,
        canCreateAddress: false
      })
      renderComponent()

      expect(artemisService.canDeleteAddress).toHaveBeenCalled()
      expect(artemisService.canCreateAddress).toHaveBeenCalled()
    })
  })

  describe('Component Rendering', () => {

    test('should render ArtemisTable component', () => {
      setupPermissions()
      renderComponent()

      expect(screen.getByTestId('artemis-table')).toBeInTheDocument()
    })

    test('should render all modals when canDeleteAddress is true', () => {
      setupPermissions({ canDeleteAddress: true })
      renderComponent()

      // All modals should be in the DOM (though not visible)
      expect(document.querySelector('[aria-label="create-queue-modal"]')).toBeInTheDocument()
      expect(document.querySelector('[aria-label="delete-address-modal"]')).toBeInTheDocument()
      expect(document.querySelector('[aria-label="attributes-modal"]')).toBeInTheDocument()
      expect(document.querySelector('[aria-label="operations-modal"]')).toBeInTheDocument()
      expect(document.querySelector('[aria-label="create=address-modal"]')).toBeInTheDocument()
      expect(document.querySelector('[aria-label="send-modal"]')).toBeInTheDocument()
    })

    test('should not render delete modal but render other modals when canDeleteAddress is false', () => {
      setupPermissions({ canDeleteAddress: false })
      renderComponent()

      // Delete modal should NOT be in DOM
      expect(document.querySelector('[aria-label="delete-address-modal"]')).not.toBeInTheDocument()

      // Other modals should still be in DOM
      expect(document.querySelector('[aria-label="create-queue-modal"]')).toBeInTheDocument()
      expect(document.querySelector('[aria-label="attributes-modal"]')).toBeInTheDocument()
      expect(document.querySelector('[aria-label="operations-modal"]')).toBeInTheDocument()
      expect(document.querySelector('[aria-label="create=address-modal"]')).toBeInTheDocument()
      expect(document.querySelector('[aria-label="send-modal"]')).toBeInTheDocument()
    })
  })
})
