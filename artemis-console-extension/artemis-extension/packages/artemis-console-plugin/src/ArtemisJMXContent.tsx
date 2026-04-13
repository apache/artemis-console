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
import { PageGroup, PageSection, PageSectionVariants, Title, Divider, Text, EmptyState, EmptyStateIcon, EmptyStateVariant } from "@patternfly/react-core"
import { useContext } from "react";
import { ArtemisContext } from "./context";
import { CubesIcon } from "@patternfly/react-icons/dist/esm/icons/cubes-icon.js";
import './ArtemisJMXContent.css' 
import { ArtemisJMXTabs } from "./views/ArtemisJMXTabView";

export const ArtemisJmxContent: React.FunctionComponent = () => {

    const { selectedNode } = useContext(ArtemisContext);

    if(!selectedNode) {
    return  (
            <PageSection variant={PageSectionVariants.light} isFilled>
                <EmptyState variant={EmptyStateVariant.full}>
                <EmptyStateIcon icon={CubesIcon} />
                <Title headingLevel='h1' size='lg'>
                    Select Artemis Node
                </Title>
                </EmptyState>
            </PageSection>
        )
    }

    return (
        <PageGroup id='artemis-jmx-content'>
        <PageSection id='jmx-content-header' variant={PageSectionVariants.light}>
            <Title headingLevel='h1'>{selectedNode.name}</Title>
            <Text component='small'>{selectedNode.objectName}</Text>
        </PageSection>
        <Divider />
        <PageSection
            id='artemis-jmx-content-main'
            variant={PageSectionVariants.light}
            padding={{ default: 'noPadding' }}
            hasOverflowScroll
            aria-label='jmx-content-main'
        >
            <ArtemisJMXTabs/>
        </PageSection>
      </PageGroup>
    )
}