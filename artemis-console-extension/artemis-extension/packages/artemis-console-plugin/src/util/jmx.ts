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
import { MBeanNode } from "@hawtio/react";

const ADDRESS_COMPONENT_PART = ",component=addresses,address=\"";
const ADDRESS_SUBCOMPONENT_PART = "\",subcomponent=queues,routing-type=\"";
const ADDRESS_TYPE_PART = "\",queue=\"";
const STRING_DELIMETER = "\"";
const QUEUE_COMPONENT = "component=queues";
const ADDRESS_COMPONENT = "component=addresses";

/**
 * Create the queue object name which would look like
 * "127.0.0.1",component=addresses,address="q1",subcomponent=queues,routing-type="anycast",queue="q1"
 */
export function createQueueObjectName(brokerMBean: string, address: string, routingType: string, queue: string): string {
    var queueMBeanName = queue;
    if(queueMBeanName.includes('\\')){
        //it may have a client id with /. in the name which is delimeted in the mbean name
        queueMBeanName = queueMBeanName.replaceAll('\\', '\\\\');
    }
    return brokerMBean + ADDRESS_COMPONENT_PART + address + ADDRESS_SUBCOMPONENT_PART + routingType.toLowerCase() + ADDRESS_TYPE_PART + queueMBeanName + STRING_DELIMETER;
}

export function createAddressObjectName(brokerMBean: string, address: string) {
    return brokerMBean + ADDRESS_COMPONENT_PART + address + STRING_DELIMETER;
}

export function isQueue(node: MBeanNode): boolean {
    return node != null && node.objectName != null && node.objectName?.includes(QUEUE_COMPONENT) as boolean;
}

export function isAddress(node: MBeanNode): boolean {
    return node != null && node.objectName != null && node.objectName?.includes(ADDRESS_COMPONENT) && !node.objectName?.includes(QUEUE_COMPONENT);
}
