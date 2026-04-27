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
import { render, screen, waitFor, fireEvent, within } from '@testing-library/react'
import { Status } from './Status'
import { artemisService, BrokerInfo, BrokerState, BrokerNetworkTopology } from '../artemis-service'
import { jolokiaService, MBeanTree } from '@hawtio/react'
import { ArtemisContext } from '../context'
import { artemisPluginName } from '../globals'

jest.mock('../artemis-service')
jest.mock('@hawtio/react', () => ({
  ...jest.requireActual('@hawtio/react'),
  jolokiaService: {
    loadUpdateRate: jest.fn(),
    errorMessage: jest.fn((error) => error.message || 'Error')
  },
  eventService: {
    notify: jest.fn()
  }
}))

const mockBrokerInfo: BrokerInfo = {
  name: '127.0.0.1',
  nodeID: '0',
  objectName: 'org.apache.activemq.artemis:broker=127.0.0.1',
  version: '2.50.0',
  uptime: '1 day',
  started: 'true',
  haPolicy: 'Primary',
  globalMaxSizeMB: 1024,
  addressMemoryUsed: 25.5,
  addressMemoryUsage: 256,
  networkTopology: new BrokerNetworkTopology([])
}

const mockBrokerState: BrokerState = {
  loaded: true,
  accessible: true,
  message: 'Success'
}

const renderWithContext = () => {
  const contextValue = {
    tree: MBeanTree.createEmpty(artemisPluginName),
    selectedNode: null,
    brokerNode: undefined,
    setSelectedNode: jest.fn(),
    findAndSelectNode: jest.fn()
  }

  return render(
    <ArtemisContext.Provider value={contextValue}>
      <Status />
    </ArtemisContext.Provider>
  )
}

describe('Status', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()

    ;(jolokiaService.loadUpdateRate as jest.Mock).mockReturnValue(5000)
    ;(artemisService.getBrokerInfo as jest.Mock).mockResolvedValue({
      info: mockBrokerInfo,
      ...mockBrokerState
    })
    ;(artemisService.createAcceptors as jest.Mock).mockResolvedValue({ acceptors: [] })
    ;(artemisService.createLockCoordinators as jest.Mock).mockResolvedValue({ lockCoordinators: [] })
    ;(artemisService.createClusterConnections as jest.Mock).mockResolvedValue({ clusterConnections: [] })
    ;(artemisService.getBrokerObjectName as jest.Mock).mockResolvedValue('org.apache.activemq.artemis:broker=127.0.0.1')
  })

  afterEach(() => {
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
  })

  test('sets up auto-refresh on initial render', async () => {
    renderWithContext()

    await waitFor(() => {
      expect(artemisService.getBrokerInfo).toHaveBeenCalledTimes(1)
    })

    jest.advanceTimersByTime(5000)

    await waitFor(() => {
      expect(artemisService.getBrokerInfo).toHaveBeenCalledTimes(2)
    })

    jest.advanceTimersByTime(5000)

    await waitFor(() => {
      expect(artemisService.getBrokerInfo).toHaveBeenCalledTimes(3)
    })
  })

  test('pauses auto-refresh when Operations dialog is opened', async () => {
    renderWithContext()

    await waitFor(() => {
      expect(artemisService.getBrokerInfo).toHaveBeenCalledTimes(1)
    })

    await waitFor(() => {
      expect(screen.getByText('Broker Info')).toBeInTheDocument()
    })

    jest.advanceTimersByTime(5000)

    await waitFor(() => {
      expect(artemisService.getBrokerInfo).toHaveBeenCalledTimes(2)
    })

    const brokerInfoCard = screen.getByText('Broker Info').closest('.pf-v5-c-card') as HTMLElement
    const menuToggle = within(brokerInfoCard).getByRole('button', { expanded: false })
    fireEvent.click(menuToggle)

    const operationsButton = await screen.findByText('Operations')
    fireEvent.click(operationsButton)

    await waitFor(() => {
      expect(screen.getByLabelText('operations-modal')).toBeInTheDocument()
    })

    const callCountBeforePause = (artemisService.getBrokerInfo as jest.Mock).mock.calls.length

    jest.advanceTimersByTime(5000)
    jest.advanceTimersByTime(5000)
    jest.advanceTimersByTime(5000)

    await waitFor(() => {
      expect(artemisService.getBrokerInfo).toHaveBeenCalledTimes(callCountBeforePause)
    })
  })

  test('resumes auto-refresh when Operations dialog is closed', async () => {
    renderWithContext()

    await waitFor(() => {
      expect(artemisService.getBrokerInfo).toHaveBeenCalledTimes(1)
    })

    await waitFor(() => {
      expect(screen.getByText('Broker Info')).toBeInTheDocument()
    })

    const brokerInfoCard = screen.getByText('Broker Info').closest('.pf-v5-c-card') as HTMLElement
    const menuToggle = within(brokerInfoCard).getByRole('button', { expanded: false })
    fireEvent.click(menuToggle)

    const operationsButton = await screen.findByText('Operations')
    fireEvent.click(operationsButton)

    await waitFor(() => {
      expect(screen.getByLabelText('operations-modal')).toBeInTheDocument()
    })

    const callCountWhenDialogOpened = (artemisService.getBrokerInfo as jest.Mock).mock.calls.length

    jest.advanceTimersByTime(10000)

    await waitFor(() => {
      expect(artemisService.getBrokerInfo).toHaveBeenCalledTimes(callCountWhenDialogOpened)
    })

    const closeButtons = screen.getAllByRole('button', { name: 'Close' })
    const primaryCloseButton = closeButtons.find(btn => btn.classList.contains('pf-m-primary'))
    fireEvent.click(primaryCloseButton!)

    await waitFor(() => {
      expect(screen.queryByLabelText('operations-modal')).not.toBeInTheDocument()
    })

    const callCountAfterClose = (artemisService.getBrokerInfo as jest.Mock).mock.calls.length

    jest.advanceTimersByTime(5000)

    await waitFor(() => {
      expect(artemisService.getBrokerInfo).toHaveBeenCalledTimes(callCountAfterClose + 1)
    })
  })

  test('allows Attributes dialog to receive updates during auto-refresh', async () => {
    renderWithContext()

    await waitFor(() => {
      expect(artemisService.getBrokerInfo).toHaveBeenCalledTimes(1)
    })

    await waitFor(() => {
      expect(screen.getByText('Broker Info')).toBeInTheDocument()
    })

    const brokerInfoCard = screen.getByText('Broker Info').closest('.pf-v5-c-card') as HTMLElement
    const menuToggle = within(brokerInfoCard).getByRole('button', { expanded: false })
    fireEvent.click(menuToggle)

    const attributesButton = await screen.findByText('Attributes')
    fireEvent.click(attributesButton)

    await waitFor(() => {
      expect(screen.getByLabelText('attributes-modal')).toBeInTheDocument()
    })

    const callCountBeforeInterval = (artemisService.getBrokerInfo as jest.Mock).mock.calls.length

    jest.advanceTimersByTime(5000)

    await waitFor(() => {
      expect(artemisService.getBrokerInfo).toHaveBeenCalledTimes(callCountBeforeInterval + 1)
    })
  })

  test('cleans up interval on unmount', async () => {
    const { unmount } = render(<Status />)

    await waitFor(() => {
      expect(artemisService.getBrokerInfo).toHaveBeenCalledTimes(1)
    })

    jest.advanceTimersByTime(5000)

    await waitFor(() => {
      expect(artemisService.getBrokerInfo).toHaveBeenCalledTimes(2)
    })

    const callCountBeforeUnmount = (artemisService.getBrokerInfo as jest.Mock).mock.calls.length

    unmount()

    jest.advanceTimersByTime(10000)

    expect(artemisService.getBrokerInfo).toHaveBeenCalledTimes(callCountBeforeUnmount)
  })
})
