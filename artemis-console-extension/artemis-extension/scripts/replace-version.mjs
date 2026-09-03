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
/* eslint-disable no-console */

import { readFileSync, writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { globSync as glob } from 'node:fs'

const PLACEHOLDER = '__PACKAGE_VERSION_PLACEHOLDER__'

// Resolve paths relative to this script's own location so it works regardless
// of the working directory from which it is invoked.
const __base = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const pkgJsonPath = resolve(__base, './packages/artemis-console-plugin/package.json')

// version to use for replacement - from node.js environment or directly from package.json
const version = process.env.npm_package_version ?? JSON.parse(readFileSync(pkgJsonPath, 'utf8')).version

let files = process.argv.slice(2) ?? []
files = files.flatMap(file => {
  return glob(file, { cwd: __base })
})
for (const file of files) {
  const distPath = resolve(__base, file)
  const original = readFileSync(distPath, 'utf8')

  if (!original.includes(PLACEHOLDER)) {
    continue
  }
  console.info('FILE (resolved)', distPath)

  const replaced = original.replaceAll(PLACEHOLDER, version)
  writeFileSync(distPath, replaced, 'utf8')
  console.log(`Replaced ${PLACEHOLDER} with ${version} in ${distPath}`)
}
