# Apache Artemis Console


The [Apache Artemis](https://artemis.apache.org/) Console Plugin is written using [Hawtio v4](https://github.com/hawtio/hawtio).
The plugin is written in TypeScript. Since a Hawtio plugin is based on React and [Webpack Module Federation](https://module-federation.github.io/),
this project uses Yarn v4 and [Webpack](https://webpack.js.org/) as the build tools.

The WAR file created by this project is consumed by Apache Artemis but can be developed and run standalone.


### Build

The following command first builds the `artemis-console-extension` frontend project and then compiles and packages 
the main Java project Web Archive in `artemis-console-war`.

```console
mvn clean install
```

Building the frontend project 'artemis-console-extension' can take time, so if you build it once and make no changes on the project afterwards, you 
can speed up the whole build by skipping the frontend part next time.

```console
mvn install -Dskip.yarn
```

### Test run

You can quickly run and test the console by using `jetty-maven-plugin` configured in `pom.xml`. It launches an embedded 
Jetty server and deploys the plugin WAR application. From the 'artemis-console-war' directory run:

```console
mvn -f artemis-console-war/pom.xml jetty:run-war -Dskip.yarn
```

You can access the Artemis console with the sample plugin at: <http://localhost:8080/console/>. To connect to a running 
Artemis instance click on the 'connect' menu item and click on the 'Add Connection' button. This will open up a dialog where 
you can enter the Artemis Jolokia endpoint details, for a default Artemis installation this would be:

| Key    | Value            |
|--------|------------------|
| Name   | Artemis          |
| Scheme | HTTP             |
| Host   | 127.0.0.1        |
| Port   | 8161             |
| Path   | /console/jolokia |

You can test the connection and then once saved connect to Artemis. This will open a new tab in the browser.

Note: If you use localhost for the 'Host' setting and you find the connection doesn't work this could be beacuse localhost 
is being translated to your local ipv6 address rather than the ipv4 address. If that occurs use the IP address instead.

## Faster plugin development

You could run `mvn install` or `mvn jetty:run` every time to incrementally develop the `artemis-extension` 
frontend project while checking its behaviour in the browser. But this is not suitable for running the fast development feedback cycle.

As shown below, a faster development cycle can be achieved by directly running the `artemis-console-extension` 
frontend project itself in development mode with `yarn start` or `npm run start`.

### Development
Start the plugin project in development mode with yarn:

```console
cd artemis-console-extension/artemis-extension/app
yarn start
```

or with npm:

```console
cd artemis-console-extension/artemis-extension/app
npm start
```

Now you should be able to preview the plugins under development at <http://localhost:8080/console/>. However, since it still
hasn't been connected to a backend JVM, you can then connect to a running Artemis instance using the connect tab using for
instance http://localhost:8161/console/jolokia.
You can now edit the artemis console web application and see changes loaded live.

### Debug plugin with VSCode

To debug the plugin code in VSCode:

1. Start the development server:
   ```console
   npm start --prefix artemis-console-extension/artemis-extension/app
   ```

2. Create a `.vscode/launch.json` file in the project root with the following configuration:
   ```json
   {
     "version": "0.2.0",
     "configurations": [
       {
         "name": "Debug in Chrome",
         "type": "chrome",
         "request": "launch",
         "url": "http://localhost:8080/console/",
         "webRoot": "${workspaceFolder}/artemis-console-extension/artemis-extension",
         "sourceMapPathOverrides": {
             "webpack:/*": "${webRoot}/*",
         }
       }
     ]
   }
   ```

3. Set breakpoints in your TypeScript source files
4. Press F5 or use the "Run and Debug" panel to start debugging
5. VSCode will launch Chrome and connect to your running development server
