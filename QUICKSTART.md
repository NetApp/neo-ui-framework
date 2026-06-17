
# 🚀 Getting Started

> [!IMPORTANT]
> Neo UI Framework is for development and testing purposes. For production-grade deployment, refer to the latest Neo deployment from the [NetApp Innovation Labs](https://github.com/NetApp/Innovation-Labs/) repository.

## ⚙️ Neo backend running externally

When running the Neo backend externally, the following configuration needs to be considered: 

### Environment Variables when running from sources

The application uses Vite's environment variable system:

- `VITE_API_BASE_URL` - Base URL for API requests (default: `/api`)

### Runtime Configuration when running in docker/podman

For containerized deployments, configure the Neo API endpoint:

```bash
docker run -e NEO_API=http://neo-backend:8080 neo-ui-framework
```

The `entrypoint.sh` script exports this value for Caddy to resolve at runtime.

## From source

### Prerequisites

- Node.js 20+ and npm 10+
- Docker and Docker Compose (for containerized deployment)
- Access to a NetApp Neo API instance
- A running Neo v2.2.6 instance [Neo Quickstart](https://github.com/NetApp/Innovation-Labs/blob/main/netapp-neo/DEPLOY-V2.md)

1. Clone the repository:
    ```bash
    git clone https://github.com/NetApp/neo-ui-framework
    cd neo-ui-framework
    ```

2. Install dependencies:
    ```bash
    npm install
    ```

3. Run the dev server:
    ```bash
    npm run dev
    ```

The application will be available at `http://localhost:5173`

The development proxy is configured in `vite.config.ts` to forward `/api` requests to your Neo API backend instance (default: `http://localhost:8081`).

## 🐳 Docker Deployment

> [!IMPORTANT]
> While Podman can be used, the rootless nature does not allow Neo to mount SMB shares in the container. Either use Docker or run Podman in rootful using ```sudo```.

### Using Docker Compose

This approach bundles both the Neo instance and UI together for an easer deployment.  

The docker compose configuration runs three services:
- ```neo-smb```, a simple SMB server for testing purposes only
- ```netapp-neo-ui```, the Neo UI framework
- ```netapp-neo```, NetApp Neo instance. 
all running in a dedicated container network.

The included `docker-compose.yml` provides a complete development stack:

    ```bash
    docker-compose up -d
    ```

This starts:
- a SMB server on port 445 that you access locally to add files to (doc, docx, ppt, pdf, ...)
- the Neo UI on port 8080 with a preconfigured proxy for API requests to the Neo backend
- the Neo backend

Environment variables **should be customized** in `docker-compose.yml` or via a `.env` file as per [Neo Quickstart](https://github.com/NetApp/Innovation-Labs/blob/main/netapp-neo/DEPLOY-V2.md) to connect to your Microsoft GraphQL tenant and Copilot. 

