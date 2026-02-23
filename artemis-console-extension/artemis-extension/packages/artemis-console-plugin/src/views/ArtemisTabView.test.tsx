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
import { render, screen } from '@testing-library/react'
import { ArtemisTabs } from './ArtemisTabView'
import { artemisService } from '../artemis-service'

jest.mock('../artemis-service')
jest.mock('../context', () => ({
  useArtemisTree: jest.fn(() => ({
    tree: {},
    selectedNode: undefined,
    brokerNode: undefined,
    setSelectedNode: jest.fn(),
    findAndSelectNode: jest.fn()
  })),
  ArtemisContext: {
    Provider: ({ children }: any) => children
  }
}))
jest.mock('../brokers/BrokerDiagram', () => ({
  BrokerDiagram: () => null
}))
jest.mock('../producers/ProducerTable', () => ({
  ProducerTable: () => null
}))
jest.mock('../consumers/ConsumerTable', () => ({
  ConsumerTable: () => null
}))
jest.mock('../connections/ConnectionsTable', () => ({
  ConnectionsTable: () => null
}))
jest.mock('../sessions/SessionsTable', () => ({
  SessionsTable: () => null
}))
jest.mock('../addresses/AddressesTable', () => ({
  AddressesTable: () => null
}))
jest.mock('../queues/QueuesView', () => ({
  QueuesView: () => null
}))
jest.mock('../status/Status', () => ({
  Status: () => null
}))

type PermissionConfig = {
  canListConnections?: boolean
  canListSessions?: boolean
  canListProducers?: boolean
  canListConsumers?: boolean
  canListAddresses?: boolean
  canListQueues?: boolean
  canListNetworkTopology?: boolean
}

const setupPermissions = (config: PermissionConfig = {}) => {
  const defaults = {
    canListConnections: false,
    canListSessions: false,
    canListProducers: false,
    canListConsumers: false,
    canListAddresses: false,
    canListQueues: false,
    canListNetworkTopology: false
  }

  const permissions = { ...defaults, ...config }

  jest.spyOn(artemisService, 'canListConnections').mockReturnValue(permissions.canListConnections)
  jest.spyOn(artemisService, 'canListSessions').mockReturnValue(permissions.canListSessions)
  jest.spyOn(artemisService, 'canListProducers').mockReturnValue(permissions.canListProducers)
  jest.spyOn(artemisService, 'canListConsumers').mockReturnValue(permissions.canListConsumers)
  jest.spyOn(artemisService, 'canListAddresses').mockReturnValue(permissions.canListAddresses)
  jest.spyOn(artemisService, 'canListQueues').mockReturnValue(permissions.canListQueues)
  jest.spyOn(artemisService, 'canListNetworkTopology').mockReturnValue(permissions.canListNetworkTopology)
}

const assertTabVisibility = (expectedVisible: string[], expectedHidden: string[]) => {
  expectedVisible.forEach(tabName => {
    expect(screen.getByText(tabName)).toBeInTheDocument()
  })
  expectedHidden.forEach(tabName => {
    expect(screen.queryByText(tabName)).not.toBeInTheDocument()
  })
}

describe('ArtemisTabs', () => {

  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('renders Status tab unconditionally', () => {
    setupPermissions()
    render(<ArtemisTabs />)
    expect(screen.getByText('Status')).toBeInTheDocument()
  })

  test('renders Connections tab when canListConnections is true', () => {
    setupPermissions({ canListConnections: true })
    render(<ArtemisTabs />)
    assertTabVisibility(
      ['Status', 'Connections'],
      ['Sessions', 'Producers', 'Consumers', 'Addresses', 'Queues', 'Broker Diagram']
    )
  })

  test('renders Sessions tab when canListSessions is true', () => {
    setupPermissions({ canListSessions: true })
    render(<ArtemisTabs />)
    assertTabVisibility(
      ['Status', 'Sessions'],
      ['Connections', 'Producers', 'Consumers', 'Addresses', 'Queues', 'Broker Diagram']
    )
  })

  test('renders Producers tab when canListProducers is true', () => {
    setupPermissions({ canListProducers: true })
    render(<ArtemisTabs />)
    assertTabVisibility(
      ['Status', 'Producers'],
      ['Connections', 'Sessions', 'Consumers', 'Addresses', 'Queues', 'Broker Diagram']
    )
  })

  test('renders Consumers tab when canListConsumers is true', () => {
    setupPermissions({ canListConsumers: true })
    render(<ArtemisTabs />)
    assertTabVisibility(
      ['Status', 'Consumers'],
      ['Connections', 'Sessions', 'Producers', 'Addresses', 'Queues', 'Broker Diagram']
    )
  })

  test('renders Addresses tab when canListAddresses is true', () => {
    setupPermissions({ canListAddresses: true })
    render(<ArtemisTabs />)
    assertTabVisibility(
      ['Status', 'Addresses'],
      ['Connections', 'Sessions', 'Producers', 'Consumers', 'Queues', 'Broker Diagram']
    )
  })

  test('renders Queues tab when canListQueues is true', () => {
    setupPermissions({ canListQueues: true })
    render(<ArtemisTabs />)
    assertTabVisibility(
      ['Status', 'Queues'],
      ['Connections', 'Sessions', 'Producers', 'Consumers', 'Addresses', 'Broker Diagram']
    )
  })

  test('renders Broker Diagram tab when canListNetworkTopology is true', () => {
    setupPermissions({ canListNetworkTopology: true })
    render(<ArtemisTabs />)
    assertTabVisibility(
      ['Status', 'Broker Diagram'],
      ['Connections', 'Sessions', 'Producers', 'Consumers', 'Addresses', 'Queues']
    )
  })

  test('renders all tabs when all permissions are granted', () => {
    setupPermissions({
      canListConnections: true,
      canListSessions: true,
      canListProducers: true,
      canListConsumers: true,
      canListAddresses: true,
      canListQueues: true,
      canListNetworkTopology: true
    })
    render(<ArtemisTabs />)
    assertTabVisibility(
      ['Status', 'Connections', 'Sessions', 'Producers', 'Consumers', 'Addresses', 'Queues', 'Broker Diagram'],
      []
    )
  })

  test('renders only Status tab when no permissions are granted', () => {
    setupPermissions()
    render(<ArtemisTabs />)
    assertTabVisibility(
      ['Status'],
      ['Connections', 'Sessions', 'Producers', 'Consumers', 'Addresses', 'Queues', 'Broker Diagram']
    )
  })

})
