# UI Framework for NetApp Neo 

The NetApp Neo UI is the standalone web UI for the NetApp Neo.

## Architecture

The client is built using:

- Vite for dynamic development
- React + Typescript as framework and language
- Tailwind CSS
- shadcn for UI components

## Live Development

- Clone the repository using ```git clone```
- Install all the dependencies using ```npm install```
- Run the dev mode using ```npm run dev``` that should return:
  ```
  npm run dev

  > ntap-neo-ui@1.0.0 dev
  > vite

  10:25:00 AM [vite] (client) Re-optimizing dependencies because lockfile has changed

  VITE v7.1.12  ready in 177 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help
  ```

## Contributing

To contribute to the NetApp Neo UI: 

- fork the repository using GitHub fork capability
- create a branch ```feature_xyz```
- all UI components including the backend services to interact with Neo are under:
  ```
  └── src
    ├── assets
    ├── components
    │   ├── data-tables
    │   ├── dialogs
    │   ├── navs
    │   ├── pages
    │   ├── sections
    │   ├── services
    │   ├── sidebars
    │   └── ui
    ├── hooks
    └── lib
  ```
  The ```ui``` should **never** be modified as its hosting the ```shadcn``` components.   
  To add a [shadcn components](https://ui.shadcn.com/docs/components), run the following ```npx shadcn@latest add <component_name>```
- open a Pull Request with your branch ```feature_xyz``` for review

## Building

To build a redistributable package: 

- run the build command ```npm run build```
- run the docker/podman build command ```podman build --no-cache -t netapp-neo-ui:feature-xyz .```

## Run your build

- modify the ```dockercompose.yaml``` to include your personal build image as ```image: localhost/netapp-neo-ui:feature-xyz```
- run docker/podman compose command like ```podman compose -f docker-compose.yml up```
- open the page ```http://localhost:8080``` in your browser

