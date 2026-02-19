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
import { eventService, EVENT_REFRESH,MBeanNode, MBeanTree, PluginNodeSelectionContext, workspace } from "@hawtio/react";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { useNavigate } from 'react-router-dom'
import { artemisPluginName } from "./globals";
import { configManager } from "./config-manager";
  
/**
 * Custom React hook for using the Artemis MBean tree.
 */
export function useArtemisTree() {

    const [tree, setTree] = useState(MBeanTree.createEmpty(artemisPluginName))
    const [loaded, setLoaded] = useState(false)
    const [brokerNode, setBrokerNode] = useState<MBeanNode>(); 
    const { selectedNode, setSelectedNode } = useContext(PluginNodeSelectionContext)
    const navigate = useNavigate();

    const refSelectedNode = useRef<MBeanNode | null>()
    refSelectedNode.current = selectedNode

    const populateTree = async () => {
        const wkspTree: MBeanTree = await workspace.getTree();
        const config = await configManager.getArtemisconfig();
        const rootNode = wkspTree.find(node => node.name === config.jmx.domain)
        if (rootNode && rootNode.children && rootNode.children.length > 0) {
            if (rootNode.children[0].objectName) {
                rootNode.children[0].addMetadata("type", "brokerType");
                setBrokerNode(rootNode.children[0]);
            }
            // Expand the nodes to redisplay the path
            if (refSelectedNode.current) {
                let curr: MBeanNode | null = refSelectedNode.current
                while (curr) {
                    curr.defaultExpanded = true
                    curr = curr.parent
                }
            }
            const subTree: MBeanTree = MBeanTree.createFromNodes(artemisPluginName, [rootNode])
            setTree(subTree)

        } else {
            setTree(wkspTree)
            // No Artemis contexts so redirect to the JMX view and select the first tree node
            navigate('jmx')
            eventService.notify({
                type: 'warning',
                message: 'No Artemis domain detected in target. Redirecting to back to jmx.',
            })
        }
    }

    useEffect(() => {
        const loadTree = async () => {
            await populateTree()
            setLoaded(true)
        }

        const listener = () => {
            setLoaded(false)
            loadTree()
        }
        eventService.onRefresh(listener)

        loadTree()

        return () => eventService.removeListener(EVENT_REFRESH, listener)
        /*
         * This effect should only be called on mount so cannot depend on selectedNode
         * But cannot have [] removed either as this seems to execute the effect repeatedly
         * So disable the lint check.
         */
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const findAndSelectNode = (objectName: string, name: string) => {
        let node: MBeanNode | null = tree.find(node => { 
            return node.objectName === objectName 
        });
        if (!node) {
            //need some special sauce here if we are lazy loading to populate the mbean
            const parentNode = tree.find(node => node.name === "addresses");
            node = new MBeanNode(parentNode, name, false);
            node.objectName = objectName;
            parentNode?.children?.push(node);
        }
        setSelectedNode(node);
    }
    return { tree, loaded, brokerNode, selectedNode, setSelectedNode, findAndSelectNode }
}


type ArtemisTreeContext = {
    tree: MBeanTree
    selectedNode: MBeanNode | null
    brokerNode: MBeanNode | undefined
    setSelectedNode: (selected: MBeanNode | null) => void
    findAndSelectNode: (objectName: string, name: string) => void
}

export const ArtemisContext = createContext<ArtemisTreeContext>({
    tree: MBeanTree.createEmpty(artemisPluginName),
    selectedNode: null,
    brokerNode: undefined,
    setSelectedNode: () => {
        /* no-op */
    },
    findAndSelectNode: (objectName: string, name: string) => {
        /* no-op */
    }
})