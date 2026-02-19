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
import { beforeAll, describe, expect, test } from "@jest/globals"
import { artemisService } from "./artemis-service";
import { SortDirection } from './table/ArtemisTable'
import { userService, parseMBeanName } from '@hawtio/react'

beforeAll(async () => {
  // needed to determine Jolokia URL
  await userService.fetchUser().catch(e => {
    console.error("error fetching user:", e)
  })
})

/**
 * A set of tests that run against a running broker instance to test the integration API
 */
describe("Artemis Service basic tests", () => {

  test("Jolokia instance creation", async () => {
    expect.assertions(1)
    let addresses = artemisService.getAddresses(
        1, 50,
        { id: "0", order: SortDirection.ASCENDING },
        { column: "", operation: "", input: "" }
    )
    await expect(addresses).resolves.toContain("DLQ");
  })

  test("Splitting ObjectNames", () => {
    const mbean = "org.apache.activemq.artemis:broker=\"0.0.0.0:61616\",component=acceptors,filter=\"x,y,z=a\",name=amqp"
    const parsed = parseMBeanName(mbean)
    expect(parsed.domain).toEqual("org.apache.activemq.artemis")
    expect(parsed.properties["broker"]).toEqual("\"0.0.0.0:61616\"")
    expect(parsed.properties["filter"]).toEqual("\"x,y,z=a\"")
    expect(parsed.properties["name"]).toEqual("amqp")
  })

})
