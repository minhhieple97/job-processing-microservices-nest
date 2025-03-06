# Jobber

<a alt="Nx logo" href="https://nx.dev" target="_blank" rel="noreferrer"><img src="https://raw.githubusercontent.com/nrwl/nx/master/images/nx-logo.png" width="45"></a>

A distributed job processing system built with modern microservices architecture.

> Please note that this project focuses on applying best practices, clean code and writing units in detail, CI/CD.

## System Architecture

Jobber is a robust, scalable job processing platform built using a microservices architecture. The system consists of several specialized services that communicate through gRPC and GraphQL, orchestrated in a Kubernetes environment.

```
                                     ┌─────────────┐
                                     │             │
                                     │  PostgreSQL │
                                     │             │
                                     └──────┬──────┘
                                            │
                                            │
                                     ┌──────▼──────┐
                                     │             │
                                     │    Auth     │
                                     │             │
                                     └──────┬──────┘
                                            ▲
                                            │
                                            │ gRPC
┌─────────┐     ┌─────────────┐  GraphQL   │   ┌─────────────┐      ┌─────────────┐
│         │     │             ├────────────┘   │             │ gRPC │             │
│  Actor  ├────►│    Load     │                │  Executor   ├─────►│  Products   │
│         │     │  Balancer   │                │             │      │             │
└─────────┘     │             │                └──────┬──────┘      └─────────────┘
                └──────┬──────┘                      ▲
                       │                             │
                       │                             │ Consume
                       │ GraphQL                     │
                       │                      ┌──────┴──────┐
                       │                      │             │
                       └─────────────────────►│    Jobs     │
                                              │             │
                                              └──────┬──────┘
                                                     │
                                                     │ Produce
                                                     ▼
                                              ┌─────────────┐
                                              │             │
                                              │   Pulsar    │
                                              │             │
                                              └─────────────┘
```

### Core Components

- **Load Balancer**: Entry point for client requests, distributing traffic across services.
- **Auth Service**: Handles authentication and authorization for all system operations.
- **Jobs Service**: Manages job definitions, scheduling, and lifecycle. Exposes GraphQL API for job management.
- **Executor Service**: Processes jobs from the queue, with multiple instances for horizontal scaling.
- **Products Service**: Manages product data and metadata related to jobs.
- **Pulsar**: Message broker that enables asynchronous communication between services.
- **PostgreSQL**: Persistent data storage for all services.

### Communication Patterns

- **GraphQL**: Used for client-facing APIs (Auth and Jobs services)
- **gRPC**: Used for internal service-to-service communication
- **Pub/Sub**: Jobs service produces messages to Pulsar, which are consumed by Executor service

## Technology Stack

- **Framework**: [NestJS](https://nestjs.com/) - A progressive Node.js framework for building efficient and scalable server-side applications
- **Monorepo Management**: [Nx](https://nx.dev/) - Smart, fast and extensible build system with first-class monorepo support
- **API Layer**:
  - [GraphQL](https://graphql.org/) - A query language for APIs
  - [gRPC](https://grpc.io/) - High-performance RPC framework
- **Database**: [PostgreSQL](https://www.postgresql.org/) - Advanced open-source relational database
- **Message Broker**: [Apache Pulsar](https://pulsar.apache.org/) - Distributed pub-sub messaging system
- **Orchestration**: [Kubernetes](https://kubernetes.io/) - Container orchestration platform
- **Containerization**: Docker

## Getting Started

### Prerequisites

- Node.js (v20+)
- Docker and Docker Compose
- Kubernetes cluster (for production deployment)
- Apache Pulsar instance
- PostgreSQL database

### Local Development Setup

1. Clone the repository:

   ```sh
   git clone https://github.com/minhhieple97
   /jobber.git
   cd jobber
   ```

2. Install dependencies:

   ```sh
   npm install
   ```

3. Start the development environment:

   ```sh
   # Start PostgreSQL and Pulsar using Docker Compose
   docker-compose up -d

   # Start all services in development mode
   npx nx run-many --target=serve --all
   ```

### Running Individual Services

To run a specific service:

```sh
npx nx serve jobber-auth    # Auth service
npx nx serve jobber-jobs    # Jobs service
npx nx serve jobber-executor # Executor service
npx nx serve jobber-products # Products service
```

To build a service for production:

```sh
npx nx build jobber-auth
```

## Nx Usage Tips

### Generating Components

When using the `nx g` command (like `nx g <application, service, module>`), you need to specify the full path to the desired location:

```sh
# Use the --directory flag (relative to where you run the command)
nx g <schematic> --directory=apps/<service_name>

# Or use a fully specified path
nx g <schematic> apps/<service_name>/<module_name>
```

Alternatively, if you're using VS Code with the Nx extension:

- Right-click on a folder and choose "Nx Generate"
- The code generation will run from that folder

This helps avoid having to manually move generated files to the correct location.

## Project Structure

```
jobber/
├── apps/
│   ├── jobber-auth/        # Authentication service
│   ├── jobber-jobs/        # Job management service
│   ├── jobber-executor/    # Job execution service
│   └── jobber-products/    # Products service
├── libs/
│   ├── shared/             # Shared utilities and models
│   ├── database/           # Database connections and models
│   └── proto/              # Protocol buffer definitions for gRPC
├── tools/                  # Build and deployment tools
└── kubernetes/             # Kubernetes configuration files
```

## Deployment

The application is designed to be deployed on Kubernetes. Deployment configurations are available in the `kubernetes/` directory.

```sh
# Deploy to Kubernetes
kubectl apply -f kubernetes/
```

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## Useful links

- [Learn more about Nx](https://nx.dev/nx-api/nest?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)
- [NestJS Documentation](https://docs.nestjs.com/)
- [GraphQL Documentation](https://graphql.org/learn/)
- [gRPC Documentation](https://grpc.io/docs/)
- [Apache Pulsar Documentation](https://pulsar.apache.org/docs/en/standalone/)
- [Kubernetes Documentation](https://kubernetes.io/docs/home/)

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
