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
import { ChartDonutUtilization,ChartDonutThreshold } from "@patternfly/react-charts"
import {
    Alert,
    Card,
    CardBody,
    CardTitle,
    Divider,
    ExpandableSection,
    Grid,
    GridItem,
    CardHeader,
    TextList,
    TextContent,
    TextListItem,
    TextListItemVariants,
    Dropdown,
    DropdownItem,
    Button,
    Modal,
    ModalVariant,
    DropdownList,
    MenuToggle,
    MenuToggleElement,
    PageSection,
    Spinner,
    Tooltip
} from "@patternfly/react-core"
import { EllipsisVIcon } from '@patternfly/react-icons/dist/esm/icons/ellipsis-v-icon'
import { ExclamationCircleIcon } from '@patternfly/react-icons/dist/esm/icons/exclamation-circle-icon'
import { OkIcon } from '@patternfly/react-icons/dist/esm/icons/ok-icon'
import { Attributes, eventService, jolokiaService, Operations } from '@hawtio/react';
import React, { ReactNode, useContext, useEffect, useState } from "react";
import { Acceptors, artemisService, BrokerInfo, BrokerState, ClusterConnections } from "../artemis-service";
import { ArtemisContext } from "../context";
import { Table, Tbody, Td, Th, Thead, Tr } from "@patternfly/react-table";
import { LockedIcon } from '@patternfly/react-icons'

export const Status: React.FunctionComponent = () => {

    const [brokerState, setBrokerState] = useState<BrokerState>({ loaded: false, accessible: false, message: "Loading..." })
    const [brokerInfo, setBrokerInfo] = useState<BrokerInfo>()
    const [acceptors, setAcceptors] = useState<Acceptors>();
    const [clusterConnections, setClusterConnections] = useState<ClusterConnections>()
    const { findAndSelectNode } = useContext(ArtemisContext)

    const [showAttributesDialog, setShowAttributesDialog] = useState(false);
    const [showOperationsDialog, setShowOperationsDialog] = useState(false);

    const getBrokerInfo = async () => {
        artemisService.getBrokerInfo()
            .then((brokerInfo) => {
                if (brokerInfo.info) {
                    setBrokerInfo(brokerInfo.info)
                }
                setBrokerState({ loaded: brokerInfo.loaded, accessible: brokerInfo.accessible, message: brokerInfo.message })
            })
            .catch((error) => {
                setBrokerState({ loaded: false, accessible: false, message: `Error loading broker: ${jolokiaService.errorMessage(error)}` })
                eventService.notify({type: 'warning', message: jolokiaService.errorMessage(error) })
            });
    }

    const getAcceptors = async () => {
        artemisService.createAcceptors()
            .then((acceptors) => {
                setAcceptors(acceptors)
            })
            .catch((error) => {
                eventService.notify({type: 'warning', message: jolokiaService.errorMessage(error) })
            });
    }

    const getClusterConnections = async () => {
        artemisService.createClusterConnections()
            .then((clusterConnections) => {
                setClusterConnections(clusterConnections)
            })
            .catch((error) => {
                eventService.notify({type: 'warning', message: jolokiaService.errorMessage(error) })
            });
    }

    useEffect(() => {
        // run only once at the beginning
        getBrokerInfo();
 
        getAcceptors();

        getClusterConnections();

        const refreshRate = jolokiaService.loadUpdateRate()
        const timer = setInterval(getBrokerInfo, refreshRate ?? 5000)
        return () => clearInterval(timer)

    }, [])

    useEffect(() => {
    // update frontend when brokerInfo, acceptors, or clusterConnections change
    }, [brokerInfo, acceptors, clusterConnections]);

    const [isBrokerInfoOpen, setIsBrokerInfoOpen] = useState<boolean>(false);

    const onBrokerInfoSelect = () => {
        setIsBrokerInfoOpen(!isBrokerInfoOpen);
    };

    const openAttributes = async () => {
        const brokerObjectName = await artemisService.getBrokerObjectName();
        findAndSelectNode(brokerObjectName, "");
        setShowAttributesDialog(true);
    }

    const openOperations = async () => {
        const brokerObjectName = await artemisService.getBrokerObjectName();
        findAndSelectNode(brokerObjectName, "");
        setShowOperationsDialog(true);
    }

    const diskSpaceUsed = brokerInfo?.diskStoreUsagePercentage ?? 0;
    const diskSpaceMax = brokerInfo?.maxDiskUsage ?? 0;
    const diskSpaceRemaining = diskSpaceMax - diskSpaceUsed;

    const statusActions = (
        <Dropdown
            onSelect={onBrokerInfoSelect}
            popperProps={{
                position: 'right'
            }}
            toggle={(toggleRef: React.RefObject<MenuToggleElement>) => (
                <MenuToggle variant="plain" isExpanded={isBrokerInfoOpen} ref={toggleRef} onClick={() => onBrokerInfoSelect()}>
                    <EllipsisVIcon aria-hidden="true" />
                </MenuToggle>
            )}
            isOpen={isBrokerInfoOpen}
        >
            <DropdownList>
                <DropdownItem key="attributes" component="button" onClick={() => openAttributes()}>
                    Attributes
                </DropdownItem>
                <DropdownItem key="operations" component="button" onClick={() => openOperations()}>
                    Operations
                </DropdownItem>
            </DropdownList>
        </Dropdown>
    );

    function actualValue(v: unknown): ReactNode {
        if (typeof v === 'object' && v && (".error" in v) && v[".error"]) {
            const msg = "error" in v ? v["error"] as string : "Not accessible"
            return (
                <Tooltip content={msg}>
                    <LockedIcon />
                </Tooltip>
            )
        } else {
            return (v ? "" + v : "")
        }
    }

    if (!brokerState.loaded) {
        return <Spinner size='lg' />
    }

    if (!brokerState.accessible) {
        return (
            <PageSection id='broker-info' variant='light'>
                <Alert variant="warning" title={brokerState.message} />
            </PageSection>
        )
    }

    return (
        <>
            <Grid hasGutter>
                <GridItem span={2} rowSpan={3}>
                    <Card isFullHeight={true} >
                        <CardHeader actions={{ actions: statusActions, hasNoOffset: false }}>
                            <CardTitle>Broker Info</CardTitle>
                        </CardHeader>
                        <CardBody>
                            <Divider />
                            <TextContent>
                                <TextList isPlain>
                                    <TextListItem component={TextListItemVariants.dd}>Version: {actualValue(brokerInfo?.version)}</TextListItem>
                                    <TextListItem component={TextListItemVariants.dd}>Uptime: {actualValue(brokerInfo?.uptime)}</TextListItem>
                                    <TextListItem component={TextListItemVariants.dd}>Started: {actualValue(brokerInfo?.started)}</TextListItem>
                                    <TextListItem component={TextListItemVariants.dd}>HA Policy: {actualValue(brokerInfo?.haPolicy)}</TextListItem>
                                </TextList>
                            </TextContent>
                        </CardBody>
                    </Card>
                </GridItem>
                <GridItem span={3} rowSpan={3}>
                    <Card isFullHeight={true}>
                        <CardHeader>
                            <CardTitle>Address Memory Used</CardTitle>
                        </CardHeader>
                        <CardBody>
                            <Divider />
                            <ChartDonutUtilization
                                ariaDesc="Address Memory Used"
                                ariaTitle="Address Memory Used"
                                constrainToVisibleArea
                                data={{ x: 'Used:', y: brokerInfo?.addressMemoryUsed }}
                                labels={["Used: " + brokerInfo?.addressMemoryUsed.toFixed(2) + "%"]}
                                name="chart2"
                                padding={{
                                    bottom: 20,
                                    left: 20,
                                    right: 20,
                                    top: 20
                                }}
                                subTitle="MiB Used"
                                title={"" + brokerInfo?.addressMemoryUsage.toFixed(2)}
                                width={350} />
                        </CardBody>
                    </Card>
                </GridItem>
                <GridItem span={3} rowSpan={3}>
                    <Card isFullHeight={true}>
                        <CardHeader>
                            <CardTitle>Disk Used</CardTitle>
                        </CardHeader>
                        <CardBody>
                            <Divider />
                            <ChartDonutThreshold
                                ariaDesc="Disk Used"
                                ariaTitle="Disk Used"
                                constrainToVisibleArea
                                padding={{
                                    bottom: 20,
                                    left: 20,
                                    right: 20,
                                    top: 20
                                }}
                                data={[
                                    { x: 'Usable at maxDiskUsage%', y: diskSpaceMax },
                                    { x: 'Max at 100%', y: 100 }
                                ]}
                                labels={[
                                    `Max disk usage: ${diskSpaceMax}%`,
                                    `Reserved disk space: ${100 - diskSpaceMax}%`
                                ]}
                                name="chart101"
                                width={350}>
                                <ChartDonutUtilization
                                    data={{ x: 'Used:', y: diskSpaceUsed }}
                                    labels={[
                                    diskSpaceRemaining < 0
                                        ? "No space remaining, broker is blocking producers!"
                                        : `Usable disk space remaining: ${diskSpaceRemaining.toFixed(2)}/${diskSpaceMax}%`
                                    ]}
                                    thresholds={[{ value: (diskSpaceMax - 10) }, { value: diskSpaceMax }]} // warning on 10% disk remaining, critical on 0%
                                    subTitle="Disk Used"
                                    title={diskSpaceUsed.toFixed(2) + "%"}/>
                            </ChartDonutThreshold>
                        </CardBody>
                    </Card>
                </GridItem>
            </Grid>
            <ExpandableSection toggleTextExpanded="Acceptors" toggleTextCollapsed="Acceptors">
                <Grid hasGutter span={4}>
                    {
                        acceptors?.acceptors.map((acceptor, index) => {
                            if (!(typeof acceptor.Name === 'object' && ".error" in acceptor.Name)) {
                                return (
                                <GridItem key={index}>
                                    <Card isFullHeight={true} isFlat={true}>

                                        <CardTitle>{acceptor.Name} ({typeof acceptor?.FactoryClassName === 'string' ? (acceptor?.FactoryClassName?.indexOf("Netty") === -1 ? "VM" : "TCP") : "?"}): {acceptor.Started &&
                                            <OkIcon color="green" />}{!acceptor.Started &&
                                            <ExclamationCircleIcon color="red" />}</CardTitle>
                                        <CardBody>
                                            <Divider />
                                            <Table variant="compact" aria-label="Column Management Table">
                                                <Thead>
                                                    <Tr key={"acceptor-list-param-title"}>
                                                        <Th key={"acceptor-list-param-key" + index}>key</Th>
                                                        <Th key={"acceptor-list-param-value" + index}>value</Th>
                                                    </Tr>
                                                </Thead>
                                                <Tbody>
                                                    {
                                                        Object.keys(acceptor.Parameters).map((key, index) => {
                                                            return (
                                                                <Tr key={"acceptor-list-param-val-" + index}>
                                                                    <Td key={"acceptor-params-key-" + key}>{key}</Td>
                                                                    <Td key={"acceptor-params-val-" + key}>{acceptor.Parameters[key]}</Td>
                                                                </Tr>

                                                            )
                                                        })
                                                    }
                                                </Tbody>
                                            </Table>
                                        </CardBody>
                                    </Card>
                                </GridItem>
                            )} else {
                                // return (<span>{acceptor.Name["message"]}</span>)
                                return null
                            }
                        })
                    }
                </Grid>
            </ExpandableSection>
            <ExpandableSection toggleText='Broker Network'>
                <Grid>
                    {
                        clusterConnections?.clusterConnections.map((clusterConnection, index) => (
                                <GridItem key={index} span={12}>
                                    <Card isFlat={true}>
                                        <CardTitle>{'Cluster(' + clusterConnection.Name + ')'}</CardTitle>
                                        <CardBody>
                                            <Table variant="compact" aria-label="Coluster Table">
                                            <Thead>
                                                <Tr key={"cluster-list-row-" + index}>
                                                    <Th key={"cluster-list-param-key-name" + index}>name</Th>
                                                    <Th key={"cluster-list-param-key-nodeid" + index}>node id</Th>
                                                    <Th key={"cluster-list-param-key-address" + index}>address</Th>
                                                    <Th key={"cluster-list-param-key-started" + index}>started</Th>
                                                    <Th key={"cluster-list-param-key-lb" + index}>load balancing</Th>
                                                    <Th key={"cluster-list-param-key-ma" + index}>messages acknowledged</Th>
                                                    <Th key={"cluster-list-param-key-mh" + index}>max hops</Th>
                                                    <Th key={"cluster-list-param-key-dd" + index}>duplicate detection</Th>
                                                </Tr>
                                            </Thead>
                                            <Tbody>
                                                <Tr key={"cluster-list-val-" + index}>
                                                    <Td key={"cluster-list-value-key-name" + index}>{clusterConnection.Name}</Td>
                                                    <Td key={"cluster-list-value-key-nodeid" + index}>{clusterConnection.NodeID}</Td>
                                                    <Td key={"cluster-list-value-key-address" + index}>{clusterConnection.Address}</Td>
                                                    <Td key={"cluster-list-value-key-started" + index}>{""+clusterConnection.Started}</Td>
                                                    <Td key={"cluster-list-value-key-lb" + index}>{clusterConnection.MessageLoadBalancingType}</Td>
                                                    <Td key={"cluster-list-value-key-ma" + index}>{clusterConnection.MessagesAcknowledged}</Td>
                                                    <Td key={"cluster-list-value-key-mh" + index}>{clusterConnection.MaxHops}</Td>
                                                    <Td key={"cluster-list-value-key-dd" + index}>{""+clusterConnection.DuplicateDetection}</Td>
                                                </Tr>
                                            </Tbody>
                                            </Table>
                                        </CardBody>
                                    </Card>
                                </GridItem>
                        ))
                    }
                </Grid>
                <Grid hasGutter>
                    {
                        brokerInfo?.networkTopology?.brokers?.map?.((broker, index) => (
                            <GridItem key={index} span={3}>
                                <Card isFlat={true}>
                                    <CardTitle>{broker.nodeID}</CardTitle>
                                    <Table variant="compact" aria-label="Network Table">
                                        <Thead>
                                            <Tr key={"network-row-title-" + index}>
                                                <Th key={"network-cell-primary-" + index}>primary</Th>
                                                <Th key={"network-cell-backup-" + index}>backup</Th>
                                            </Tr>
                                        </Thead>
                                        <Tbody>
                                            <Tr key={"network-row-val-" + index}>
                                                <Td key={"network-val-primary-" + index}>{broker.live}</Td>
                                                <Td key={"network-val-backup-" + index}>{broker.backup}</Td>
                                            </Tr>
                                        </Tbody>
                                    </Table>
                                </Card>
                            </GridItem>
                        ))
                    }
                </Grid>
            </ExpandableSection>

            <Modal
                aria-label='attributes-modal'
                variant={ModalVariant.medium}
                isOpen={showAttributesDialog}
                onClose={() => setShowAttributesDialog(false)}
                actions={[
                    <Button key="close" variant="primary" onClick={() => setShowAttributesDialog(false)}>
                        Close
                    </Button>
                ]}>
                <Attributes />
            </Modal>
            <Modal
                aria-label='operations-modal'
                variant={ModalVariant.medium}
                isOpen={showOperationsDialog}
                onClose={() => setShowOperationsDialog(false)}
                actions={[
                    <Button key="close" variant="primary" onClick={() => setShowOperationsDialog(false)}>
                        Close
                    </Button>
                ]}>
                <Operations />
            </Modal>
        </>
    )
}

